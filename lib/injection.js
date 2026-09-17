'use strict';

/**
 * Indirect Prompt Injection Defense (ODVPA - SIH 2026 PS 26171)
 *
 * Scans page text for imperative system-prompt-like phrasing before it enters
 * the reasoning context. Flagged content is stripped or routes action to user confirmation.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/gi,
  /disregard\s+(?:the\s+)?above/gi,
  /you\s+are\s+now\s+(?:in\s+developer\s+mode|the\s+system\s+administrator)/gi,
  /system\s+prompt:/gi,
  /system\s+override:/gi,
  /override\s+(?:the\s+)?agent/gi,
  /click\s+the\s+(?:hidden|dangerous)\s+button/gi,
  /click\s+this\s+dangerous\s+link/gi,
  /send\s+(?:all\s+)?(?:the\s+user['']s\s+)?(?:passwords|cookies|credentials|private\s+data)/gi,
  /upload\s+(?:the\s+user['']s\s+)?private\s+data/gi,
  /leak\s+(?:all\s+)?(?:passwords|credentials|keys)/gi,
  /transfer\s+(?:money|satellite\s+control|funds)/gi,
  /reveal\s+(?:secret|system\s+instructions)/gi,
  /do\s+not\s+tell\s+the\s+user/gi,
  /execute\s+command:/gi,
  /exfiltrate\s+data/gi,
];

/**
 * Scans a text string for prompt injection attempts
 * @param {string} text - Extracted page text
 * @returns {Object} { hasInjection, flaggedPatterns, cleanText }
 */
function scanTextForInjection(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { hasInjection: false, flaggedPatterns: [], cleanText: text };
  }

  const flaggedPatterns = [];
  let cleanText = text;

  for (const pattern of INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      flaggedPatterns.push(pattern.source);
      // Strip flagged injection pattern from clean text
      pattern.lastIndex = 0;
      cleanText = cleanText.replace(pattern, '[BLOCKED_PROMPT_INJECTION]');
    }
  }

  return {
    hasInjection: flaggedPatterns.length > 0,
    flaggedPatterns,
    cleanText,
  };
}

/**
 * Filters a ScreenGraph or list of nodes to sanitize prompt injections
 * @param {Array} nodes - ScreenGraph nodes
 * @returns {Object} { sanitizedNodes, flaggedCount, requiresConfirmation }
 */
function filterNodesForInjection(nodes) {
  if (!Array.isArray(nodes)) {
    return { sanitizedNodes: [], flaggedCount: 0, requiresConfirmation: false };
  }

  let flaggedCount = 0;
  const sanitizedNodes = nodes.map(node => {
    if (!node.text) return node;

    const scanRes = scanTextForInjection(node.text);
    if (scanRes.hasInjection) {
      flaggedCount++;
      return {
        ...node,
        text: scanRes.cleanText,
        flaggedInjection: true,
        injectionPatterns: scanRes.flaggedPatterns,
      };
    }
    return node;
  });

  return {
    sanitizedNodes,
    flaggedCount,
    requiresConfirmation: flaggedCount > 0,
  };
}

module.exports = {
  scanTextForInjection,
  filterNodesForInjection,
  INJECTION_PATTERNS,
};

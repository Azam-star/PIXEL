'use strict';

/**
 * AI Cursor & Transparency State Overlay (ODVPA - SIH 2026 PS 26171 § 5.2.11)
 *
 * Injects a lightweight, non-intrusive on-screen visual transparency overlay into the
 * browser tab during agent runs. Shows current agent state (Observing / Thinking /
 * Target Found / Acting) and highlights the target element's bounding box before action.
 */

const STATE_COLORS = {
  OBSERVING: { bg: '#0284c7', border: '#38bdf8', text: '#ffffff', icon: '👁️', glow: 'rgba(56, 189, 248, 0.6)' },
  THINKING: { bg: '#2563eb', border: '#60a5fa', text: '#ffffff', icon: '🧠', glow: 'rgba(96, 165, 250, 0.6)' },
  TARGET_FOUND: { bg: '#d97706', border: '#fbbf24', text: '#ffffff', icon: '🎯', glow: 'rgba(251, 191, 36, 0.6)' },
  ACTING: { bg: '#7c3aed', border: '#a78bfa', text: '#ffffff', icon: '⚡', glow: 'rgba(167, 139, 250, 0.6)' },
};

/**
 * Returns a self-contained client-side JavaScript snippet to inject/update the overlay DOM
 * @param {Object} opts - Overlay parameters
 * @returns {string} JavaScript expression
 */
function generateOverlayScript(opts = {}) {
  const state = String(opts.state || 'OBSERVING').toUpperCase();
  const colors = STATE_COLORS[state] || STATE_COLORS.OBSERVING;
  const message = String(opts.message || state).replace(/["`\\]/g, ' ');
  const targetRef = opts.targetRef ? String(opts.targetRef).replace(/["`\\]/g, '') : null;
  const bbox = opts.bbox && typeof opts.bbox === 'object' ? opts.bbox : null;
  const visionBox = (opts.visionBox && typeof opts.visionBox === 'object') ? opts.visionBox : (state === 'OBSERVING' ? bbox : null);

  const targetBadge = targetRef
    ? `<span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:12px;font-size:11px;">Target: ${targetRef}</span>`
    : '';
  const messageBadge = message
    ? `<span style="opacity:0.9;font-weight:400;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${message}</span>`
    : '';

  // Light Blue Bounding Box for LLM Seeing / Vision Field
  const visionScript = visionBox
    ? `
        if (!visionHighlight) {
          visionHighlight = document.createElement('div');
          visionHighlight.id = '__pixel_ai_vision_box__';
          visionHighlight.style.cssText = 'position:absolute;z-index:2147483645;pointer-events:none;border:2px solid #38bdf8;background:rgba(56,189,248,0.22);border-radius:6px;box-shadow:0 0 16px rgba(56,189,248,0.7);transition:all 0.15s ease-out;';
          const tag = document.createElement('div');
          tag.id = '__pixel_ai_vision_tag__';
          tag.style.cssText = 'position:absolute;top:-20px;left:0;background:#0369a1;color:#ffffff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid #38bdf8;box-shadow:0 2px 6px rgba(0,0,0,0.4);white-space:nowrap;';
          tag.textContent = '👁️ LLM Seeing';
          visionHighlight.appendChild(tag);
          document.body.appendChild(visionHighlight);
        }
        const vb = ${JSON.stringify(visionBox)};
        const vx = vb.x ?? vb[0] ?? 0;
        const vy = vb.y ?? vb[1] ?? 0;
        const vw = vb.width ?? vb[2] ?? 0;
        const vh = vb.height ?? vb[3] ?? 0;
        visionHighlight.style.left = vx + 'px';
        visionHighlight.style.top = vy + 'px';
        visionHighlight.style.width = vw + 'px';
        visionHighlight.style.height = vh + 'px';
        visionHighlight.style.display = 'block';
    `
    : `
        if (visionHighlight) visionHighlight.style.display = 'none';
    `;

  // Action/Target Bounding Box
  const bboxScript = (bbox && state !== 'OBSERVING')
    ? `
        if (!boxHighlight) {
          boxHighlight = document.createElement('div');
          boxHighlight.id = '__pixel_ai_target_box__';
          boxHighlight.style.cssText = 'position:absolute;z-index:2147483646;pointer-events:none;border:3px solid #f59e0b;background:rgba(245,158,11,0.18);border-radius:4px;box-shadow:0 0 12px rgba(245,158,11,0.7);transition:all 0.15s ease-out;';
          document.body.appendChild(boxHighlight);
        }
        const b = ${JSON.stringify(bbox)};
        const x = b.x ?? b[0] ?? 0;
        const y = b.y ?? b[1] ?? 0;
        const w = b.width ?? b[2] ?? 0;
        const h = b.height ?? b[3] ?? 0;
        boxHighlight.style.left = x + 'px';
        boxHighlight.style.top = y + 'px';
        boxHighlight.style.width = w + 'px';
        boxHighlight.style.height = h + 'px';
        boxHighlight.style.display = 'block';
    `
    : `
        if (boxHighlight) boxHighlight.style.display = 'none';
    `;

  return `(() => {
    try {
      let root = document.getElementById('__pixel_ai_transparency_overlay__');
      if (!root) {
        root = document.createElement('div');
        root.id = '__pixel_ai_transparency_overlay__';
        root.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;transition:all 0.2s ease-in-out;';
        document.body.appendChild(root);
      }

      root.innerHTML = \`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:${colors.bg};border:2px solid ${colors.border};border-radius:24px;box-shadow:0 4px 16px rgba(0,0,0,0.3),0 0 12px ${colors.glow};color:${colors.text};font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">
          <span style="font-size:14px;animation:pulse 1.5s infinite;">${colors.icon}</span>
          <span>ODVPA: ${state}</span>
          ${targetBadge}
          ${messageBadge}
        </div>
      \`;

      // Light blue LLM Vision Seeing Box highlight
      let visionHighlight = document.getElementById('__pixel_ai_vision_box__');
      ${visionScript}

      // Target action bounding box highlight
      let boxHighlight = document.getElementById('__pixel_ai_target_box__');
      ${bboxScript}
    } catch (e) {}
  })()`;
}

/**
 * Injects or updates transparency state overlay via Chrome DevTools Protocol
 * @param {Object} client - CDP client
 * @param {Object} opts - Overlay parameters
 */
async function updateStateOverlay(client, opts = {}) {
  if (!client || !client.Runtime?.evaluate) return;
  try {
    const script = generateOverlayScript(opts);
    await client.Runtime.evaluate({ expression: script });
  } catch (err) {
    // Non-fatal if page was navigating
  }
}

/**
 * Removes overlay from target page
 * @param {Object} client - CDP client
 */
async function clearStateOverlay(client) {
  if (!client || !client.Runtime?.evaluate) return;
  try {
    await client.Runtime.evaluate({
      expression: `(() => {
        document.getElementById('__pixel_ai_transparency_overlay__')?.remove();
        document.getElementById('__pixel_ai_target_box__')?.remove();
        document.getElementById('__pixel_ai_vision_box__')?.remove();
      })()`,
    });
  } catch (err) {}
}

module.exports = {
  STATE_COLORS,
  generateOverlayScript,
  updateStateOverlay,
  clearStateOverlay,
};

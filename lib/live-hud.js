'use strict';

/**
 * PIXEL Real-Time Interactive On-Screen HUD (ODVPA Live Controller)
 *
 * Injects a floating, interactive control dock directly into Chrome:
 * - Real-time screen reading & bounding box visualization
 * - Read Mode & Visual Privacy Shield (live on-screen blurring of PII & sensitive data)
 * - On-screen task prompt execution
 * - Live agent state indicators (Observing / Thinking / Acting)
 * - 100% on-device PII detection badges & privacy verification
 */

function generateLiveHudScript() {
  return `(() => {
    if (document.getElementById('__pixel_live_hud_root__')) return;

    const root = document.createElement('div');
    root.id = '__pixel_live_hud_root__';
    root.style.cssText = \`
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2);
      color: #f8fafc;
      width: 380px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease-in-out;
      user-select: none;
    \`;

    root.innerHTML = \`
      <div id="pixel-hud-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; cursor: move;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite;"></div>
          <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PIXEL ODVPA LIVE</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span id="pixel-hud-status-badge" style="font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 12px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3);">READY</span>
          <button id="pixel-hud-minimize-btn" title="Minimize / Expand" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; cursor: pointer; border-radius: 4px; width: 20px; height: 20px; font-size: 12px; line-height: 1; display: flex; align-items: center; justify-content: center; padding: 0;">_</button>
        </div>
      </div>

      <div id="pixel-hud-body" style="display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease;">
        <div id="pixel-hud-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div style="background: rgba(255,255,255,0.05); padding: 7px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #94a3b8;">Perception</div>
            <div id="pixel-nodes-count" style="font-weight: 600; font-size: 13px; color: #38bdf8;">0 nodes</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 7px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #94a3b8;">Privacy Gate</div>
            <div id="pixel-privacy-status" style="font-weight: 600; font-size: 13px; color: #4ade80;">100% On-Device</div>
          </div>
        </div>

        <!-- Action Buttons: Read Screen, Read Mode, Privacy Blur, Clear -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button id="pixel-btn-read" style="padding: 7px 8px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 2px 8px rgba(37,99,235,0.4);">
            <span>👁️</span> Read Screen
          </button>
          <button id="pixel-btn-readmode" style="padding: 7px 8px; background: #475569; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
            <span>📖</span> Read Mode
          </button>
          <button id="pixel-btn-blur" style="padding: 7px 8px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 2px 8px rgba(5,150,105,0.4);">
            <span>🔒</span> Privacy Blur
          </button>
          <button id="pixel-btn-clear" style="padding: 7px 8px; background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
            <span>✕</span> Clear All
          </button>
        </div>

        <div style="display: flex; gap: 6px;">
          <input id="pixel-task-input" type="text" placeholder="Type autonomous task (e.g. search shoe)..." style="flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 7px 9px; color: white; font-size: 12px; outline: none;" />
          <button id="pixel-btn-run" style="padding: 7px 14px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">
            Run
          </button>
        </div>

        <div id="pixel-log-msg" style="font-size: 11px; color: #94a3b8; max-height: 48px; overflow-y: auto; padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; font-family: monospace;">
          Connected to PIXEL Real-Time Agent.
        </div>
      </div>
    \`;

    document.body.appendChild(root);

    // Minimize / Expand logic
    let isMinimized = false;
    const minBtn = document.getElementById('pixel-hud-minimize-btn');
    const hudBody = document.getElementById('pixel-hud-body');
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMinimized = !isMinimized;
      if (isMinimized) {
        hudBody.style.display = 'none';
        root.style.width = '240px';
        minBtn.textContent = '+';
        document.getElementById('pixel-hud-header').style.borderBottom = 'none';
        document.getElementById('pixel-hud-header').style.paddingBottom = '0px';
      } else {
        hudBody.style.display = 'flex';
        root.style.width = '380px';
        minBtn.textContent = '_';
        document.getElementById('pixel-hud-header').style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        document.getElementById('pixel-hud-header').style.paddingBottom = '8px';
      }
    });

    // Draggable HUD dock via header
    const header = document.getElementById('pixel-hud-header');
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0, initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target === minBtn) return;
      isDragging = true;
      const rect = root.getBoundingClientRect();
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      root.style.left = initialLeft + 'px';
      root.style.top = initialTop + 'px';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      root.style.left = (initialLeft + dx) + 'px';
      root.style.top = (initialTop + dy) + 'px';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Track active toggle states
    let isPrivacyBlurred = false;
    let isReadModeActive = false;

    // Event handlers inside browser tab
    document.getElementById('pixel-btn-read').addEventListener('click', () => {
      window.__pixel_trigger_read = Date.now();
      const badge = document.getElementById('pixel-hud-status-badge');
      badge.textContent = 'READING...';
      badge.style.color = '#fbbf24';
      document.getElementById('pixel-log-msg').textContent = 'Perceiving page layout & elements...';
    });

    document.getElementById('pixel-btn-readmode').addEventListener('click', () => {
      isReadModeActive = !isReadModeActive;
      window.__pixel_trigger_read_mode = { timestamp: Date.now(), active: isReadModeActive };
      const btn = document.getElementById('pixel-btn-readmode');
      if (isReadModeActive) {
        btn.style.background = '#0284c7';
        btn.innerHTML = '<span>📖</span> Read Mode [ON]';
        document.getElementById('pixel-log-msg').textContent = 'Read Mode activated. Focused perception.';
      } else {
        btn.style.background = '#475569';
        btn.innerHTML = '<span>📖</span> Read Mode';
        document.getElementById('pixel-log-msg').textContent = 'Read Mode deactivated.';
      }
    });

    document.getElementById('pixel-btn-blur').addEventListener('click', () => {
      isPrivacyBlurred = !isPrivacyBlurred;
      window.__pixel_trigger_privacy_blur = { timestamp: Date.now(), active: isPrivacyBlurred };
      const btn = document.getElementById('pixel-btn-blur');
      if (isPrivacyBlurred) {
        btn.style.background = '#dc2626';
        btn.innerHTML = '<span>🔒</span> Privacy [SHIELD]';
        document.getElementById('pixel-log-msg').textContent = 'Privacy Shield ON: Sensitive PII blurred.';
      } else {
        btn.style.background = '#059669';
        btn.innerHTML = '<span>🔒</span> Privacy Blur';
        document.getElementById('pixel-log-msg').textContent = 'Privacy Shield unblurred.';
      }
    });

    document.getElementById('pixel-btn-clear').addEventListener('click', () => {
      window.__pixel_trigger_clear = Date.now();
      // Remove bounding boxes
      document.querySelectorAll('.__pixel_screen_box__, .__pixel_readmode_highlight__, .__pixel_privacy_badge__').forEach(b => b.remove());
      // Unblur elements
      document.querySelectorAll('.__pixel_privacy_blurred__').forEach(el => {
        el.style.filter = '';
        el.classList.remove('__pixel_privacy_blurred__');
      });
      isPrivacyBlurred = false;
      isReadModeActive = false;
      document.getElementById('pixel-btn-blur').style.background = '#059669';
      document.getElementById('pixel-btn-blur').innerHTML = '<span>🔒</span> Privacy Blur';
      document.getElementById('pixel-btn-readmode').style.background = '#475569';
      document.getElementById('pixel-btn-readmode').innerHTML = '<span>📖</span> Read Mode';
      document.getElementById('pixel-hud-status-badge').textContent = 'READY';
      document.getElementById('pixel-hud-status-badge').style.color = '#93c5fd';
      document.getElementById('pixel-nodes-count').textContent = '0 nodes';
      document.getElementById('pixel-privacy-status').textContent = '100% On-Device';
      document.getElementById('pixel-privacy-status').style.color = '#4ade80';
      document.getElementById('pixel-log-msg').textContent = 'All overlays and filters cleared.';
    });

    document.getElementById('pixel-btn-run').addEventListener('click', () => {
      const val = document.getElementById('pixel-task-input').value.trim();
      if (val) {
        window.__pixel_pending_task = val;
        document.getElementById('pixel-hud-status-badge').textContent = 'EXECUTING';
        document.getElementById('pixel-hud-status-badge').style.color = '#a855f7';
        document.getElementById('pixel-log-msg').textContent = 'Task dispatched: ' + val;
      }
    });

    document.getElementById('pixel-task-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('pixel-btn-run').click();
      }
    });
  })()`;
}

function generateUpdateHudStatusScript({ status = 'READY', color = '#93c5fd', message = '', nodeCount = null } = {}) {
  return `(() => {
    try {
      const badge = document.getElementById('pixel-hud-status-badge');
      if (badge) {
        badge.textContent = ${JSON.stringify(status)};
        badge.style.color = ${JSON.stringify(color)};
      }
      if (${JSON.stringify(message)}) {
        const msg = document.getElementById('pixel-log-msg');
        if (msg) msg.textContent = ${JSON.stringify(message)};
      }
      if (${nodeCount !== null}) {
        const nodes = document.getElementById('pixel-nodes-count');
        if (nodes) nodes.textContent = ${JSON.stringify(nodeCount + ' nodes')};
      }
    } catch {}
  })()`;
}

/**
 * Generates script to draw visual bounding boxes on all detected screen elements
 */
function generateAnnotateBoxesScript(elements = []) {
  return `(() => {
    // Remove previous boxes
    document.querySelectorAll('.__pixel_screen_box__').forEach(e => e.remove());

    const els = ${JSON.stringify(elements)};
    let count = 0;

    for (const el of els) {
      if (!el.bbox) continue;
      const b = el.bbox;
      const x = b.x ?? b[0] ?? 0;
      const y = b.y ?? b[1] ?? 0;
      const w = b.width ?? b[2] ?? 0;
      const h = b.height ?? b[3] ?? 0;

      if (w <= 0 || h <= 0) continue;

      const box = document.createElement('div');
      box.className = '__pixel_screen_box__';
      box.style.cssText = \`
        position: absolute;
        left: \${x}px;
        top: \${y}px;
        width: \${w}px;
        height: \${h}px;
        border: 2px solid #38bdf8;
        background: rgba(56, 189, 248, 0.18);
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.45);
        pointer-events: none;
        z-index: 2147483640;
        transition: all 0.15s ease-in-out;
      \`;

      const label = document.createElement('div');
      label.style.cssText = \`
        position: absolute;
        top: -18px;
        left: 0;
        background: #0369a1;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 3px;
        white-space: nowrap;
        border: 1px solid #38bdf8;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      \`;
      label.textContent = '👁️ ' + (el.ref || '') + ' ' + (el.role || '');
      box.appendChild(label);
      document.body.appendChild(box);
      count++;
    }

    // Update HUD count
    const nodeBadge = document.getElementById('pixel-nodes-count');
    if (nodeBadge) nodeBadge.textContent = count + ' elements';
    const statusBadge = document.getElementById('pixel-hud-status-badge');
    if (statusBadge) {
      statusBadge.textContent = 'PERCEIVED';
      statusBadge.style.color = '#38bdf8';
    }
    const logMsg = document.getElementById('pixel-log-msg');
    if (logMsg) logMsg.textContent = 'Perceived ' + count + ' elements with light-blue bounding boxes.';
  })()`;
}

/**
 * Generates script to scan the live DOM and visually blur all sensitive PII & credentials.
 * Places glowing "🔒 Protected" privacy badges on blurred elements.
 */
function generatePrivacyBlurScript(opts = {}) {
  const active = opts.active !== false;

  return `(() => {
    // 1. If unblurring, remove blur filters and badges
    if (!${active}) {
      document.querySelectorAll('.__pixel_privacy_blurred__').forEach(el => {
        el.style.filter = '';
        el.classList.remove('__pixel_privacy_blurred__');
      });
      document.querySelectorAll('.__pixel_privacy_badge__').forEach(b => b.remove());
      const pStatus = document.getElementById('pixel-privacy-status');
      if (pStatus) {
        pStatus.textContent = '100% On-Device';
        pStatus.style.color = '#4ade80';
      }
      return 0;
    }

    // 2. Sensitive field selectors (passwords, emails, phone, card, account, address)
    const sensitiveSelectors = [
      'input[type="password"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[autocomplete*="cc-"]',
      'input[autocomplete*="email"]',
      'input[autocomplete*="tel"]',
      'input[autocomplete*="postal"]',
      'input[autocomplete*="street"]',
      'input[name*="card"]',
      'input[name*="cvv"]',
      'input[name*="ssn"]',
      'input[name*="password"]',
      'input[name*="phone"]',
      'input[name*="mobile"]',
      'input[name*="account"]',
      'input[name*="address"]',
      '#nav-global-location-slot', // Amazon delivery address
      '#nav-link-accountList-nav-line-1', // Amazon user greeting
      '.address-line',
      '.payment-method',
      '.card-number',
      '.user-profile-name',
      '.account-balance'
    ];

    let blurredCount = 0;
    const elementsToBlur = new Set();

    // Query selector matching
    for (const sel of sensitiveSelectors) {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (el.offsetWidth > 0 || el.offsetHeight > 0) {
            elementsToBlur.add(el);
          }
        });
      } catch (e) {}
    }

    // PII Regex Patterns for text nodes
    const piiRegexes = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,             // Email
      /(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}/, // Phone
      /\\b(?:\\d[ -]*?){13,16}\\b/,                                   // Card number
      /\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b|\\b[A-Z]{5}\\d{4}[A-Z]{1}\\b/, // Aadhaar / PAN ID
      /\\b\\d{3}-\\d{2}-\\d{4}\\b/                                    // SSN
    ];

    // Scan text in leaf elements
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node) {
        if (node.id === '__pixel_live_hud_root__' || node.classList.contains('__pixel_screen_box__') || node.classList.contains('__pixel_privacy_badge__')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.children.length === 0 && node.textContent && node.textContent.trim().length > 3) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    });

    let current;
    while ((current = walker.nextNode())) {
      const text = current.textContent.trim();
      for (const rx of piiRegexes) {
        if (rx.test(text)) {
          elementsToBlur.add(current);
          break;
        }
      }
    }

    // Apply blur styling and visual privacy badge
    elementsToBlur.forEach(el => {
      if (!el.classList.contains('__pixel_privacy_blurred__')) {
        el.classList.add('__pixel_privacy_blurred__');
        el.style.filter = 'blur(8px) !important';
        el.style.webkitFilter = 'blur(8px)';
        el.style.transition = 'filter 0.2s ease-in-out';
        el.style.userSelect = 'none';

        // Add badge
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const badge = document.createElement('div');
          badge.className = '__pixel_privacy_badge__';
          badge.style.cssText = \`
            position: absolute;
            left: \${rect.left + window.scrollX}px;
            top: \${Math.max(0, rect.top + window.scrollY - 16)}px;
            background: rgba(15, 23, 42, 0.95);
            color: #4ade80;
            border: 1px solid #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
            font-size: 10px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 2147483642;
            white-space: nowrap;
          \`;
          badge.textContent = '🔒 Protected (PII Blurred)';
          document.body.appendChild(badge);
        }

        blurredCount++;
      }
    });

    // Update HUD indicator
    const pStatus = document.getElementById('pixel-privacy-status');
    if (pStatus) {
      pStatus.textContent = blurredCount > 0 ? ('🔒 ' + blurredCount + ' Blurred') : '100% On-Device';
      pStatus.style.color = '#4ade80';
    }

    return blurredCount;
  })()`;
}

/**
 * Generates script to activate distraction-free Read Mode on active page
 */
function generateReadModeScript(opts = {}) {
  const active = opts.active !== false;

  return `(() => {
    // 1. If disabling, remove readmode classes
    if (!${active}) {
      document.querySelectorAll('.__pixel_readmode_dimmed__').forEach(e => {
        e.style.opacity = '';
        e.classList.remove('__pixel_readmode_dimmed__');
      });
      document.querySelectorAll('.__pixel_readmode_focus__').forEach(e => {
        e.style.outline = '';
        e.style.boxShadow = '';
        e.classList.remove('__pixel_readmode_focus__');
      });
      return false;
    }

    // 2. Identify main readable articles / product content
    const mainContent = document.querySelector('main, article, [role="main"], #search, #centerCol, #dp');
    if (mainContent) {
      mainContent.classList.add('__pixel_readmode_focus__');
      mainContent.style.outline = '2px solid rgba(56, 189, 248, 0.5)';
      mainContent.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.15)';
    }

    // Dim noisy peripheral elements (headers, footers, sidebars, ad containers)
    const peripherals = document.querySelectorAll('header, footer, nav, [role="banner"], [role="contentinfo"], .ad, .advertisement');
    peripherals.forEach(p => {
      if (p.id !== '__pixel_live_hud_root__' && !p.contains(document.getElementById('__pixel_live_hud_root__'))) {
        p.classList.add('__pixel_readmode_dimmed__');
        p.style.opacity = '0.35';
        p.style.transition = 'opacity 0.25s ease-in-out';
      }
    });

    return true;
  })()`;
}

module.exports = {
  generateLiveHudScript,
  generateUpdateHudStatusScript,
  generateAnnotateBoxesScript,
  generatePrivacyBlurScript,
  generateReadModeScript,
};

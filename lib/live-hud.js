'use strict';

/**
 * PIXEL Real-Time Interactive On-Screen Floating Agent Dock
 * (Apple Floating Dynamic Island for Browser Automation & Live ODVPA)
 *
 * Features:
 * - Apple Dynamic Island OLED glassmorphism aesthetic (deep pitch black, blur, pill curvature)
 * - Hardware notch simulation with TrueDepth camera dot and glowing real-time activity LED
 * - Full Draggability anywhere across the screen (mouse & touch) with viewport bounds clamping
 * - Position memory across page reloads, navigations, and tab switches
 * - Safe DOM mounting: attaches cleanly even when injected before document.body is ready
 * - Compact Island Pill mode ↔ Expanded Control Center with fluid spring transitions
 * - Interactive action chips (👁️ Read Screen, 🔒 Privacy Blur, 📖 Read Mode, ✕ Clear All)
 * - High-speed autonomous prompt input bar with glowing Run button
 * - Live turn-by-turn activity ticker with real-time status updates (READY, THINKING, ACTING, etc.)
 */

function generateLiveHudScript() {
  return `(() => {
    if (document.getElementById('__pixel_live_hud_root__')) return;

    // Inject CSS Keyframes and styling rules
    if (!document.getElementById('__pixel_dynamic_island_styles__')) {
      const styleTag = document.createElement('style');
      styleTag.id = '__pixel_dynamic_island_styles__';
      styleTag.textContent = \`
        @keyframes pixelIslandPulse {
          0%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 6px currentColor); }
          50% { transform: scale(1.25); opacity: 0.8; filter: drop-shadow(0 0 12px currentColor); }
        }
        @keyframes pixelIslandGlow {
          0%, 100% { box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.12); }
          50% { box-shadow: 0 16px 45px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.22), 0 0 25px rgba(56, 189, 248, 0.25); }
        }
        .__pixel_island_chip__:hover {
          background: rgba(255, 255, 255, 0.14) !important;
          transform: translateY(-1px);
        }
        .__pixel_island_chip__:active {
          transform: translateY(1px);
          filter: brightness(0.9);
        }
        .__pixel_island_run_btn__:hover {
          filter: brightness(1.15);
          transform: scale(1.02);
        }
        .__pixel_island_run_btn__:active {
          transform: scale(0.98);
        }
      \`;
      (document.head || document.documentElement).appendChild(styleTag);
    }

    const root = document.createElement('div');
    root.id = '__pixel_live_hud_root__';

    // Retrieve saved drag coordinates or default to top center
    let savedPos = null;
    try {
      savedPos = JSON.parse(sessionStorage.getItem('__pixel_island_pos') || 'null') || window.__pixel_island_pos || null;
    } catch {}

    const defaultTop = 16;
    const defaultLeft = Math.max(16, Math.round((window.innerWidth - 380) / 2));
    const initTop = (savedPos && typeof savedPos.top === 'number') ? savedPos.top : defaultTop;
    const initLeft = (savedPos && typeof savedPos.left === 'number') ? savedPos.left : defaultLeft;

    root.style.cssText = \`
      position: fixed;
      top: \${initTop}px;
      left: \${initLeft}px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(28px) saturate(190%);
      -webkit-backdrop-filter: blur(28px) saturate(190%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 28px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 20px rgba(0, 0, 0, 0.4);
      color: #f8fafc;
      width: 380px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-sizing: border-box;
      user-select: none;
      transition: width 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.32s cubic-bezier(0.16, 1, 0.3, 1), padding 0.32s ease, box-shadow 0.32s ease;
      touch-action: none;
    \`;

    root.innerHTML = \`
      <!-- Dynamic Island Header / Draggable Pill -->
      <div id="pixel-hud-header" style="display: flex; align-items: center; justify-content: space-between; cursor: grab; padding-bottom: 2px;">
        <!-- Hardware Notch cutout with TrueDepth sensor & pulsating activity dot -->
        <div style="display: flex; align-items: center; gap: 9px;">
          <div style="display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.06); padding: 3px 8px 3px 6px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #000; border: 1px solid rgba(255,255,255,0.25);"></div>
            <div id="pixel-hud-sensor-dot" style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; color: #10b981; animation: pixelIslandPulse 2s infinite ease-in-out;"></div>
          </div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 800; font-size: 13px; letter-spacing: -0.2px; color: #ffffff; display: flex; align-items: center; gap: 5px;">
              PIXEL <span style="font-weight: 500; font-size: 10px; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 1px 5px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.25);">ODVPA LIVE</span>
            </span>
          </div>
        </div>

        <!-- Dynamic Status Badge & Island Mode Toggle -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="pixel-hud-status-badge" style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); letter-spacing: 0.4px; text-transform: uppercase;">READY</span>
          <button id="pixel-hud-minimize-btn" title="Collapse / Expand Dynamic Island" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; cursor: pointer; border-radius: 50%; width: 22px; height: 22px; font-size: 11px; line-height: 1; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.15s ease;">_</button>
        </div>
      </div>

      <!-- Island Expandable Body Container -->
      <div id="pixel-hud-body" style="display: flex; flex-direction: column; gap: 11px; transition: opacity 0.25s ease;">
        <!-- Metrics Row -->
        <div id="pixel-hud-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 2px;">
            <div style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Perception</div>
            <div id="pixel-nodes-count" style="font-weight: 700; font-size: 13px; color: #38bdf8;">0 nodes</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 2px;">
            <div style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Privacy Gate</div>
            <div id="pixel-privacy-status" style="font-weight: 700; font-size: 13px; color: #34d399;">100% On-Device</div>
          </div>
        </div>

        <!-- Action Chips: Read Screen, Read Mode, Privacy Blur, Clear All -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button id="pixel-btn-read" class="__pixel_island_chip__" style="padding: 8px 10px; background: rgba(37, 99, 235, 0.25); color: #bfdbfe; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 12px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: all 0.2s ease;">
            <span style="font-size: 12px;">👁️</span> Read Screen
          </button>
          <button id="pixel-btn-readmode" class="__pixel_island_chip__" style="padding: 8px 10px; background: rgba(255, 255, 255, 0.06); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
            <span style="font-size: 12px;">📖</span> Read Mode
          </button>
          <button id="pixel-btn-blur" class="__pixel_island_chip__" style="padding: 8px 10px; background: rgba(16, 185, 129, 0.25); color: #a7f3d0; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: all 0.2s ease;">
            <span style="font-size: 12px;">🔒</span> Privacy Blur
          </button>
          <button id="pixel-btn-clear" class="__pixel_island_chip__" style="padding: 8px 10px; background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; font-weight: 600; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
            <span style="font-size: 12px;">✕</span> Clear All
          </button>
        </div>

        <!-- Task Prompt Bar with Glowing Apple-Style Run Pill -->
        <div style="display: flex; gap: 7px; align-items: center;">
          <input id="pixel-task-input" type="text" placeholder="Type autonomous task (e.g. search shoes, login)..." style="flex: 1; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 18px; padding: 8px 12px; color: #ffffff; font-size: 12px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;" />
          <button id="pixel-btn-run" class="__pixel_island_run_btn__" style="padding: 8px 15px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; border-radius: 18px; font-weight: 700; font-size: 12px; cursor: pointer; box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4); display: flex; align-items: center; gap: 4px; transition: all 0.2s ease;">
            Run
          </button>
        </div>

        <!-- Real-Time Activity Ticker Console -->
        <div id="pixel-log-msg" style="font-size: 11px; color: #94a3b8; max-height: 48px; min-height: 22px; overflow-y: auto; padding: 6px 9px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.4;">
          Ready · Connected to PIXEL On-Device Agent.
        </div>
      </div>
    \`;

    // Safe DOM mounting helper: ensures body is ready even on early document creation
    function mount() {
      if (document.getElementById('__pixel_live_hud_root__')) return;
      if (!document.body) {
        if (document.readyState === 'loading') {
          window.addEventListener('DOMContentLoaded', mount, { once: true });
        } else {
          setTimeout(mount, 40);
        }
        return;
      }
      document.body.appendChild(root);
    }

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
      mount();
    }

    // Minimize / Expand Dynamic Island Pill logic
    let isMinimized = false;
    const minBtn = document.getElementById('pixel-hud-minimize-btn');
    const hudBody = document.getElementById('pixel-hud-body');

    function toggleIsland(minimize) {
      isMinimized = (minimize !== undefined) ? minimize : !isMinimized;
      if (isMinimized) {
        hudBody.style.display = 'none';
        root.style.width = '240px';
        root.style.padding = '8px 12px';
        root.style.borderRadius = '24px';
        minBtn.textContent = '+';
      } else {
        hudBody.style.display = 'flex';
        root.style.width = '380px';
        root.style.padding = '14px 16px';
        root.style.borderRadius = '28px';
        minBtn.textContent = '_';
      }
    }

    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleIsland();
    });

    // Expanding island if clicked on header while collapsed
    const header = document.getElementById('pixel-hud-header');
    header.addEventListener('click', (e) => {
      if (isMinimized && e.target !== minBtn) {
        toggleIsland(false);
      }
    });

    // Draggable Dynamic Island: Supports both mouse and touch anywhere on header/pill
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0, initialLeft = 0, initialTop = 0;

    function onDragStart(clientX, clientY) {
      isDragging = true;
      const rect = root.getBoundingClientRect();
      dragStartX = clientX;
      dragStartY = clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
      header.style.cursor = 'grabbing';
      root.style.transition = 'none'; // Instant tracking while dragging
    }

    function onDragMove(clientX, clientY) {
      if (!isDragging) return;
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;
      
      const newLeft = Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, initialLeft + dx));
      const newTop = Math.max(8, Math.min(window.innerHeight - root.offsetHeight - 8, initialTop + dy));

      root.style.left = newLeft + 'px';
      root.style.top = newTop + 'px';

      // Persist coordinates
      const pos = { left: newLeft, top: newTop };
      window.__pixel_island_pos = pos;
      try {
        sessionStorage.setItem('__pixel_island_pos', JSON.stringify(pos));
      } catch {}
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = 'grab';
      root.style.transition = 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.32s cubic-bezier(0.16, 1, 0.3, 1), padding 0.32s ease, box-shadow 0.32s ease';
    }

    // Mouse drag events
    header.addEventListener('mousedown', (e) => {
      if (e.target === minBtn) return;
      onDragStart(e.clientX, e.clientY);
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        onDragMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      onDragEnd();
    });

    // Touch drag events (for touchscreens)
    header.addEventListener('touchstart', (e) => {
      if (e.target === minBtn) return;
      if (e.touches.length === 1) {
        onDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        onDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      onDragEnd();
    });

    // Track active toggle states
    let isPrivacyBlurred = false;
    let isReadModeActive = false;

    // Action button event handlers
    document.getElementById('pixel-btn-read').addEventListener('click', () => {
      window.__pixel_trigger_read = Date.now();
      const badge = document.getElementById('pixel-hud-status-badge');
      const dot = document.getElementById('pixel-hud-sensor-dot');
      badge.textContent = 'READING...';
      badge.style.color = '#38bdf8';
      badge.style.background = 'rgba(56, 189, 248, 0.15)';
      badge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      if (dot) {
        dot.style.background = '#38bdf8';
        dot.style.color = '#38bdf8';
      }
      document.getElementById('pixel-log-msg').textContent = 'Perceiving page layout & interactive nodes...';
    });

    document.getElementById('pixel-btn-readmode').addEventListener('click', () => {
      isReadModeActive = !isReadModeActive;
      window.__pixel_trigger_read_mode = { timestamp: Date.now(), active: isReadModeActive };
      const btn = document.getElementById('pixel-btn-readmode');
      if (isReadModeActive) {
        btn.style.background = 'rgba(14, 165, 233, 0.35)';
        btn.style.borderColor = '#0284c7';
        btn.style.color = '#e0f2fe';
        btn.innerHTML = '<span style="font-size: 12px;">📖</span> Read Mode [ON]';
        document.getElementById('pixel-log-msg').textContent = 'Read Mode active: dimmed non-essential distractions.';
      } else {
        btn.style.background = 'rgba(255, 255, 255, 0.06)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        btn.style.color = '#cbd5e1';
        btn.innerHTML = '<span style="font-size: 12px;">📖</span> Read Mode';
        document.getElementById('pixel-log-msg').textContent = 'Read Mode deactivated.';
      }
    });

    document.getElementById('pixel-btn-blur').addEventListener('click', () => {
      isPrivacyBlurred = !isPrivacyBlurred;
      window.__pixel_trigger_privacy_blur = { timestamp: Date.now(), active: isPrivacyBlurred };
      const btn = document.getElementById('pixel-btn-blur');
      if (isPrivacyBlurred) {
        btn.style.background = 'rgba(239, 68, 68, 0.35)';
        btn.style.borderColor = '#ef4444';
        btn.style.color = '#fee2e2';
        btn.innerHTML = '<span style="font-size: 12px;">🔒</span> Privacy [SHIELD]';
        document.getElementById('pixel-log-msg').textContent = 'Privacy Shield active: sensitive PII & credentials blurred.';
      } else {
        btn.style.background = 'rgba(16, 185, 129, 0.25)';
        btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        btn.style.color = '#a7f3d0';
        btn.innerHTML = '<span style="font-size: 12px;">🔒</span> Privacy Blur';
        document.getElementById('pixel-log-msg').textContent = 'Privacy Shield unblurred.';
      }
    });

    document.getElementById('pixel-btn-clear').addEventListener('click', () => {
      window.__pixel_trigger_clear = Date.now();
      // Remove bounding boxes & privacy badges
      document.querySelectorAll('.__pixel_screen_box__, .__pixel_readmode_highlight__, .__pixel_privacy_badge__').forEach(b => b.remove());
      // Unblur elements
      document.querySelectorAll('.__pixel_privacy_blurred__').forEach(el => {
        el.style.filter = '';
        el.classList.remove('__pixel_privacy_blurred__');
      });
      isPrivacyBlurred = false;
      isReadModeActive = false;
      document.getElementById('pixel-btn-blur').style.background = 'rgba(16, 185, 129, 0.25)';
      document.getElementById('pixel-btn-blur').style.borderColor = 'rgba(16, 185, 129, 0.4)';
      document.getElementById('pixel-btn-blur').style.color = '#a7f3d0';
      document.getElementById('pixel-btn-blur').innerHTML = '<span style="font-size: 12px;">🔒</span> Privacy Blur';
      document.getElementById('pixel-btn-readmode').style.background = 'rgba(255, 255, 255, 0.06)';
      document.getElementById('pixel-btn-readmode').style.borderColor = 'rgba(255, 255, 255, 0.12)';
      document.getElementById('pixel-btn-readmode').style.color = '#cbd5e1';
      document.getElementById('pixel-btn-readmode').innerHTML = '<span style="font-size: 12px;">📖</span> Read Mode';
      
      const badge = document.getElementById('pixel-hud-status-badge');
      const dot = document.getElementById('pixel-hud-sensor-dot');
      badge.textContent = 'READY';
      badge.style.color = '#34d399';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      if (dot) {
        dot.style.background = '#10b981';
        dot.style.color = '#10b981';
      }
      document.getElementById('pixel-nodes-count').textContent = '0 nodes';
      document.getElementById('pixel-privacy-status').textContent = '100% On-Device';
      document.getElementById('pixel-privacy-status').style.color = '#34d399';
      document.getElementById('pixel-log-msg').textContent = 'All overlays and filters cleared.';
    });

    // Run autonomous task
    document.getElementById('pixel-btn-run').addEventListener('click', () => {
      const val = document.getElementById('pixel-task-input').value.trim();
      if (val) {
        window.__pixel_pending_task = val;
        const badge = document.getElementById('pixel-hud-status-badge');
        const dot = document.getElementById('pixel-hud-sensor-dot');
        badge.textContent = 'EXECUTING';
        badge.style.color = '#c084fc';
        badge.style.background = 'rgba(168, 85, 247, 0.2)';
        badge.style.borderColor = 'rgba(168, 85, 247, 0.4)';
        if (dot) {
          dot.style.background = '#a855f7';
          dot.style.color = '#a855f7';
        }
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

function generateUpdateHudStatusScript({ status = 'READY', color = '#34d399', message = '', nodeCount = null } = {}) {
  return `(() => {
    try {
      const badge = document.getElementById('pixel-hud-status-badge');
      const dot = document.getElementById('pixel-hud-sensor-dot');
      if (badge) {
        badge.textContent = ${JSON.stringify(status)};
        badge.style.color = ${JSON.stringify(color)};
        if (${JSON.stringify(status)} === 'EXECUTING' || ${JSON.stringify(status)} === 'ACTING') {
          badge.style.background = 'rgba(168, 85, 247, 0.2)';
          badge.style.borderColor = 'rgba(168, 85, 247, 0.4)';
          if (dot) { dot.style.background = '#a855f7'; dot.style.color = '#a855f7'; }
        } else if (${JSON.stringify(status)} === 'THINKING') {
          badge.style.background = 'rgba(245, 158, 11, 0.2)';
          badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
          if (dot) { dot.style.background = '#f59e0b'; dot.style.color = '#f59e0b'; }
        } else if (${JSON.stringify(status)} === 'FAILED') {
          badge.style.background = 'rgba(239, 68, 68, 0.2)';
          badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          if (dot) { dot.style.background = '#ef4444'; dot.style.color = '#ef4444'; }
        } else {
          badge.style.background = 'rgba(16, 185, 129, 0.15)';
          badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          if (dot) { dot.style.background = '#10b981'; dot.style.color = '#10b981'; }
        }
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
        border-radius: 6px;
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.45);
        pointer-events: none;
        z-index: 2147483640;
        transition: all 0.15s ease-in-out;
      \`;

      const label = document.createElement('div');
      label.style.cssText = \`
        position: absolute;
        top: -19px;
        left: 0;
        background: #0284c7;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 7px;
        border-radius: 4px;
        white-space: nowrap;
        border: 1px solid #38bdf8;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
      \`;
      label.textContent = '👁️ ' + (el.ref || '') + ' ' + (el.role || '');
      box.appendChild(label);
      document.body.appendChild(box);
      count++;
    }

    // Update Island count
    const nodeBadge = document.getElementById('pixel-nodes-count');
    if (nodeBadge) nodeBadge.textContent = count + ' elements';
    const statusBadge = document.getElementById('pixel-hud-status-badge');
    if (statusBadge) {
      statusBadge.textContent = 'PERCEIVED';
      statusBadge.style.color = '#38bdf8';
      statusBadge.style.background = 'rgba(56, 189, 248, 0.15)';
      statusBadge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    }
    const logMsg = document.getElementById('pixel-log-msg');
    if (logMsg) logMsg.textContent = 'Perceived ' + count + ' interactive elements with light-blue bounding boxes.';
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
        pStatus.style.color = '#34d399';
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
            background: rgba(0, 0, 0, 0.9);
            color: #34d399;
            border: 1px solid #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
            font-size: 10px;
            font-weight: 700;
            padding: 1px 7px;
            border-radius: 6px;
            pointer-events: none;
            z-index: 2147483642;
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
          \`;
          badge.textContent = '🔒 Protected (PII Blurred)';
          document.body.appendChild(badge);
        }

        blurredCount++;
      }
    });

    // Update Island indicator
    const pStatus = document.getElementById('pixel-privacy-status');
    if (pStatus) {
      pStatus.textContent = blurredCount > 0 ? ('🔒 ' + blurredCount + ' Blurred') : '100% On-Device';
      pStatus.style.color = '#34d399';
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
      mainContent.style.outline = '2px solid rgba(56, 189, 248, 0.6)';
      mainContent.style.boxShadow = '0 0 35px rgba(56, 189, 248, 0.2)';
      mainContent.style.borderRadius = '12px';
    }

    // Dim noisy peripheral elements (headers, footers, sidebars, ad containers)
    const peripherals = document.querySelectorAll('header, footer, nav, [role="banner"], [role="contentinfo"], .ad, .advertisement');
    peripherals.forEach(p => {
      if (p.id !== '__pixel_live_hud_root__' && !p.contains(document.getElementById('__pixel_live_hud_root__'))) {
        p.classList.add('__pixel_readmode_dimmed__');
        p.style.opacity = '0.3';
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

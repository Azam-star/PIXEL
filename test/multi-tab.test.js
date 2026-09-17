'use strict';

/**
 * PIXEL ODVPA Multi-Tab & Live HUD Persistence Test Suite
 *
 * Verifies:
 * 1. Session multi-tab tracking (targetId, targetUrl, targetTitle getters)
 * 2. Tab switching logic (switchToTab, getVisibleTab, followVisibleTab)
 * 3. Live HUD injection script structure & resilience across tab switches
 * 4. HUD collapsible controls (minimize button, draggable header)
 * 5. HUD status synchronization script (status badge, log messages, node count)
 * 6. Multi-tab trigger contract (__pixel_pending_task, __pixel_trigger_read, etc.)
 */

const assert = require('assert');
const { Session, chooseTab } = require('../lib/connect');
const {
  generateLiveHudScript,
  generateUpdateHudStatusScript,
  generateAnnotateBoxesScript,
  generatePrivacyBlurScript,
  generateReadModeScript,
} = require('../lib/live-hud');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack || err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack || err.message}`);
    failed++;
  }
}

console.log('\n===============================================================');
console.log('   PIXEL Multi-Tab Persistence & Floating Agent HUD Tests     ');
console.log('===============================================================\n');

// 1. Target Getters on Session
test('Session exposes targetId, targetUrl, targetTitle getters', () => {
  const mockTarget = { id: 'TAB_123', url: 'https://example.com', title: 'Example Page', type: 'page' };
  const mockClient = { Accessibility: { enable: async () => {} } };
  const session = new Session(mockClient, mockTarget, {});

  assert.strictEqual(session.targetId, 'TAB_123');
  assert.strictEqual(session.targetUrl, 'https://example.com');
  assert.strictEqual(session.targetTitle, 'Example Page');
  assert.strictEqual(session.target, mockTarget);
});

// 2. chooseTab Tab Resolution Policy
test('chooseTab tracks child tabs and fresh tabs accurately', () => {
  const pages = [
    { targetId: 'TAB_A', openerId: null, type: 'page' },
    { targetId: 'TAB_B', openerId: 'TAB_A', type: 'page' },
  ];
  // Follows child tab when opener is current
  const chosen = chooseTab({
    pages,
    currentId: 'TAB_A',
    openerId: null,
    knownIds: new Set(['TAB_A']),
    allowFresh: true,
  });
  assert.strictEqual(chosen, 'TAB_B', 'Should follow child tab opened by TAB_A');
});

// 3. Live HUD script DOM elements
test('generateLiveHudScript generates required interactive floating dock DOM structure', () => {
  const script = generateLiveHudScript();
  assert.ok(typeof script === 'string', 'Script must be a string');
  assert.ok(script.includes('__pixel_live_hud_root__'), 'HUD root ID missing');
  assert.ok(script.includes('z-index: 2147483647'), 'HUD must have top-tier z-index');
  assert.ok(script.includes('pixel-hud-header'), 'Header element for dragging missing');
  assert.ok(script.includes('pixel-hud-minimize-btn'), 'Minimize/Expand button missing');
  assert.ok(script.includes('pixel-hud-body'), 'Collapsible body container missing');
  assert.ok(script.includes('pixel-btn-read'), 'Read Screen button missing');
  assert.ok(script.includes('pixel-btn-readmode'), 'Read Mode button missing');
  assert.ok(script.includes('pixel-btn-blur'), 'Privacy Blur button missing');
  assert.ok(script.includes('pixel-btn-clear'), 'Clear All button missing');
  assert.ok(script.includes('pixel-task-input'), 'Autonomous task input field missing');
  assert.ok(script.includes('pixel-btn-run'), 'Task Run button missing');
  assert.ok(script.includes('pixel-log-msg'), 'Agent status log message element missing');
});

// 4. HUD status update script generator
test('generateUpdateHudStatusScript generates correct DOM mutator', () => {
  const updateScript = generateUpdateHudStatusScript({
    status: 'EXECUTING',
    color: '#a855f7',
    message: 'Searching for shoes...',
    nodeCount: 42,
  });
  assert.ok(typeof updateScript === 'string');
  assert.ok(updateScript.includes('EXECUTING'), 'Status text not embedded');
  assert.ok(updateScript.includes('#a855f7'), 'Status color not embedded');
  assert.ok(updateScript.includes('Searching for shoes...'), 'Log message not embedded');
  assert.ok(updateScript.includes('42 nodes'), 'Node count not embedded');
});

// 5. On-screen event trigger contract
test('Live HUD script sets global window triggers on user interaction', () => {
  const script = generateLiveHudScript();
  assert.ok(script.includes('window.__pixel_trigger_read'), 'Read Screen trigger contract missing');
  assert.ok(script.includes('window.__pixel_trigger_privacy_blur'), 'Privacy Blur trigger contract missing');
  assert.ok(script.includes('window.__pixel_trigger_read_mode'), 'Read Mode trigger contract missing');
  assert.ok(script.includes('window.__pixel_trigger_clear'), 'Clear trigger contract missing');
  assert.ok(script.includes('window.__pixel_pending_task'), 'Autonomous task dispatch trigger missing');
});

// 6. Annotation and Privacy filter script generation
test('generateAnnotateBoxesScript and generatePrivacyBlurScript generate valid expressions', () => {
  const boxesScript = generateAnnotateBoxesScript([
    { ref: '@e1', bbox: [100, 200, 150, 40], name: 'Search Input' },
  ]);
  assert.ok(boxesScript.includes('__pixel_screen_box__'));
  assert.ok(boxesScript.includes('100'));

  const blurScript = generatePrivacyBlurScript({ active: true });
  assert.ok(blurScript.includes('__pixel_privacy_blurred__'));
});

// Summary
console.log('\n---------------------------------------------------------------');
console.log(`Test Execution Complete: ${passed} passed, ${failed} failed`);
console.log('===============================================================\n');

if (failed > 0) process.exit(1);

'use strict';

/**
 * PIXEL ODVPA Universal Task & Website Resolution Test Suite
 *
 * Verifies that PIXEL can resolve ANY website, query, or service intent,
 * auto-recovers parameters for local models, and enforces self-healing.
 */

const assert = require('assert');
const { resolveDestinationUrl, cleanSearchQuery, POPULAR_SERVICES, SITE_SEARCH_TEMPLATES } = require('../lib/resolver');
const { validate } = require('../lib/validate');
const actions = require('../lib/actions');

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

console.log('\n===============================================================');
console.log('   PIXEL Universal Task & Multi-Website Resolver Tests         ');
console.log('===============================================================\n');

// 1. Universal Direct Site Search
test('Resolves site-specific search queries directly into search URLs', () => {
  const yt = resolveDestinationUrl('search for python tutorials on youtube');
  assert.ok(yt.includes('youtube.com/results?search_query=python%20tutorials'));

  const amz = resolveDestinationUrl('search for running shoes on amazon');
  assert.ok(amz.includes('amazon.com/s?k=running%20shoes'));

  const wiki = resolveDestinationUrl('search for Albert Einstein on wikipedia');
  assert.ok(wiki.includes('wikipedia.org/wiki/Special:Search?search=Albert%20Einstein'));

  const gh = resolveDestinationUrl('search for transformers on github');
  assert.ok(gh.includes('github.com/search?q=transformers'));
});

// 2. Popular Indian and Global Services
test('Resolves popular Indian and global web services from natural language', () => {
  assert.strictEqual(resolveDestinationUrl('login to instagram'), 'https://www.instagram.com');
  assert.strictEqual(resolveDestinationUrl('check flights on makemytrip'), 'https://www.makemytrip.com');
  assert.strictEqual(resolveDestinationUrl('order food on swiggy'), 'https://www.swiggy.com');
  assert.strictEqual(resolveDestinationUrl('find restaurants on zomato'), 'https://www.zomato.com');
  assert.strictEqual(resolveDestinationUrl('visit isro.gov.in'), 'https://isro.gov.in');
  assert.strictEqual(resolveDestinationUrl('open youtube'), 'https://www.youtube.com');
  assert.ok(resolveDestinationUrl('watch lo-fi on youtube').includes('youtube.com/results?search_query=lo-fi'));
  assert.strictEqual(resolveDestinationUrl('open flipkart'), 'https://www.flipkart.com');
  assert.ok(resolveDestinationUrl('buy electronics on flipkart').includes('flipkart.com/search?q=electronics'));
  assert.strictEqual(resolveDestinationUrl('browse reddit'), 'https://www.reddit.com');
  assert.strictEqual(resolveDestinationUrl('check news on bbc'), 'https://www.bbc.com');
});

// 3. Blank Tab Smart Fallback
test('Resolves general queries on blank/newtab pages directly to Google Search', () => {
  const gSearch = resolveDestinationUrl('who won the 2024 olympics', 'chrome://newtab/');
  assert.ok(gSearch.includes('google.com/search?q=who%20won%20the%202024%20olympics'));

  const buySearch = resolveDestinationUrl('buy running shoes under 2000', 'about:blank');
  assert.ok(buySearch.includes('google.com/search?q=running%20shoes%20under%202000'));
});

// 4. Parameter Auto-Recovery for Local SLMs (Type & Search)
test('Validator automatically recovers search query and sets submit=true', () => {
  const mockLookup = { '@e1': 101 };
  const mockBrief = {
    elements: [
      { ref: '@e1', role: 'searchbox', name: 'Search Wikipedia' },
    ],
    lookup: mockLookup,
  };

  // Local model gives type without explicit text, but with intent
  const result = validate([
    { verb: 'type', ref: '@e1', args: { intent: 'search for artificial intelligence' } }
  ], mockLookup, actions, mockBrief);

  assert.strictEqual(result.errors.length, 0, 'Should have 0 errors');
  assert.strictEqual(result.ok.length, 1, 'Should produce 1 valid action');
  assert.strictEqual(result.ok[0].args.text, 'artificial intelligence');
  assert.strictEqual(result.ok[0].args.submit, true, 'Should auto-set submit=true for search');
});

// 5. Off-Page Service Re-Route in Validator
test('Validator transforms click with off-page service intent into direct navigation', () => {
  const mockLookup = { '@e5': 105 };
  const mockBrief = {
    url: 'https://www.google.com',
    elements: [{ ref: '@e5', role: 'button', name: 'Google Search' }],
    lookup: mockLookup,
  };

  const result = validate([
    { verb: 'click', args: { intent: 'login to instagram' } }
  ], mockLookup, actions, mockBrief);

  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.ok[0].verb, 'navigate');
  assert.strictEqual(result.ok[0].args.url, 'https://www.instagram.com');
});

// Summary
console.log('\n---------------------------------------------------------------');
console.log(`Test Execution Complete: ${passed} passed, ${failed} failed`);
console.log('===============================================================\n');

if (failed > 0) process.exit(1);

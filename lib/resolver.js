'use strict';

/**
 * Universal Web Service & URL Destination Resolver for PIXEL / ODVPA
 * 
 * Automatically maps natural language goals, services, and queries
 * to their authoritative web destinations without requiring hardcoded URLs.
 */

const POPULAR_SERVICES = {
  instagram: 'https://www.instagram.com',
  twitter: 'https://x.com',
  x: 'https://x.com',
  facebook: 'https://www.facebook.com',
  fb: 'https://www.facebook.com',
  reddit: 'https://www.reddit.com',
  linkedin: 'https://www.linkedin.com',
  amazon: 'https://www.amazon.com',
  flipkart: 'https://www.flipkart.com',
  netflix: 'https://www.netflix.com',
  spotify: 'https://open.spotify.com',
  youtube: 'https://www.youtube.com',
  github: 'https://github.com',
  gitlab: 'https://gitlab.com',
  wikipedia: 'https://en.wikipedia.org',
  google: 'https://www.google.com',
  gmail: 'https://mail.google.com',
  yahoo: 'https://www.yahoo.com',
  bing: 'https://www.bing.com',
  duckduckgo: 'https://duckduckgo.com',
  stackoverflow: 'https://stackoverflow.com',
  medium: 'https://medium.com',
  quora: 'https://www.quora.com',
  pinterest: 'https://www.pinterest.com',
  twitch: 'https://www.twitch.tv',
  discord: 'https://discord.com',
  ebay: 'https://www.ebay.com',
  walmart: 'https://www.walmart.com',
  isro: 'https://www.isro.gov.in',
  hackernews: 'https://news.ycombinator.com',
  ycombinator: 'https://news.ycombinator.com',
};

function resolveDestinationUrl(text, currentUrl = '') {
  if (!text || typeof text !== 'string') return null;
  const str = text.trim();
  
  // 1. Explicit http/https or www
  const explicit = str.match(/https?:\/\/[^\s"'<>]+/i) || str.match(/\b(www\.[^\s"'<>]+)/i);
  if (explicit) {
    let u = explicit[0];
    return u.startsWith('http') ? u : 'https://' + u;
  }

  // 2. Bare domain (e.g. instagram.com, wikipedia.org, github.com)
  const domainMatch = str.match(/\b([a-zA-Z0-9-]+\.(?:com|org|gov|in|edu|net|io|ai|tv)(?:\/[^\s"'<>]*)?)\b/i);
  if (domainMatch) {
    return 'https://' + domainMatch[1];
  }

  // 3. Named popular services (e.g. "instagram", "twitter", "reddit", etc.)
  const lower = str.toLowerCase();
  for (const [key, url] of Object.entries(POPULAR_SERVICES)) {
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(lower)) {
      return url;
    }
  }

  // 4. Pattern: "login to X", "go to X", "open X", "visit X", "sign in to X"
  const actionMatch = lower.match(/(?:login to|sign in to|go to|open|visit|browse|navigate to)\s+([a-zA-Z0-9_-]+)/i);
  if (actionMatch) {
    const candidate = actionMatch[1];
    if (POPULAR_SERVICES[candidate]) return POPULAR_SERVICES[candidate];
    if (candidate.length >= 3 && !['the', 'my', 'a', 'an', 'page', 'site', 'tab', 'window'].includes(candidate)) {
      return `https://www.${candidate}.com`;
    }
  }

  // 5. If currently on blank/newtab page, search queries route to Google
  const isBlank = !currentUrl || currentUrl === 'about:blank' || currentUrl.startsWith('chrome://');
  if (isBlank) {
    if (lower.startsWith('search') || lower.includes('find') || lower.includes('lookup') || lower.includes('buy') || lower.includes('weather')) {
      return 'https://www.google.com';
    }
  }

  return null;
}

module.exports = {
  POPULAR_SERVICES,
  resolveDestinationUrl,
};

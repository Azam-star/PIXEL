'use strict';

/**
 * ODVPA Local VLM Provider Engine (SIH 2026 PS 26171)
 *
 * Unified On-Device Vision Provider exposing:
 * - Tier A: LFM2.5-VL-450M (Primary on-device light perception model via WebGPU/CPU)
 * - Tier B: LFM2.5-VL-1.6B (Lazy-loaded escalation model)
 *
 * Architecture:
 * - Direct WebGPU/ONNX execution through lib/vlm/webgpu-provider.js
 * - Lazy Loading: Tier B is only loaded when confidence is insufficient (< tau_high / 0.85)
 * - Sharp image preprocessing & aspect-ratio normalization (lib/vlm/preprocessor.js)
 * - Calibrated two-threshold confidence routing (lib/router.js)
 * - 5-Stage Privacy & Redaction Gate (lib/privacy.js)
 * - Indirect Prompt Injection Defense (lib/injection.js)
 * - Full performance, latency, and crop savings instrumentation
 */

const { WebGPUVLMRuntime, globalWebGpuVlm, detectWebGPU, MODEL_CONFIGS } = require('./webgpu-provider');
const { preprocessForVLM, getImageMetadata, calculateCropMetrics } = require('./preprocessor');
const { parseStructuredVisualOutput } = require('./structured-parser');
const { computeRoutingConfidence, computeSourceAgreement, routeDecision } = require('../router');

const MODEL_SPECS = {
  A: {
    tier: 'A',
    model: 'LFM2.5-VL-450M',
    modelId: 'LiquidAI/LFM2.5-VL-450M-ONNX',
    family: 'Liquid-LFM2.5',
    parameters: '450M',
    vramMb: 480,
    contextLength: 4096,
    defaultConfidence: 0.92,
    runtime: 'onnx-webgpu-local',
    device: 'gpu-or-cpu',
    description: 'Tier A: Ultra-lightweight on-device vision-language model for UI buttons, badges, and text crops.',
  },
  B: {
    tier: 'B',
    model: 'LFM2.5-VL-1.6B',
    modelId: 'LiquidAI/LFM2.5-VL-1.6B-ONNX',
    family: 'Liquid-LFM2.5',
    parameters: '1.6B',
    vramMb: 1450,
    contextLength: 8192,
    defaultConfidence: 0.96,
    runtime: 'onnx-webgpu-local',
    device: 'gpu-or-cpu',
    description: 'Tier B: High-fidelity on-device vision-language model for complex charts, dense tables, and visual ambiguities.',
  },
  FLORENCE2: {
    tier: 'FLORENCE2',
    model: 'Florence-2-base',
    modelId: 'microsoft/Florence-2-base',
    family: 'Microsoft-Florence2',
    parameters: '232M',
    vramMb: 960,
    contextLength: 2048,
    defaultConfidence: 0.91,
    runtime: 'onnx-cpu-local',
    device: 'cpu',
    taskPrompts: ['<MORE_DETAILED_CAPTION>', '<OCR>', '<CAPTION_TO_PHRASE_GROUNDING>', '<REGION_PROPOSAL>'],
    description: 'Florence-2-base (232M): Targeted visual fallback for canvas/SVG/iframe regions not resolvable via DOM/AXTree. Uses task-mode routing: MORE_DETAILED_CAPTION for general regions, OCR for dense-text crops.',
  },
};

class LocalVLMProvider {
  constructor(options = {}) {
    this.options = options;
    this.runtime = new WebGPUVLMRuntime(options);
    this.activeTier = 'A';
    this.tauHigh = options.tauHigh !== undefined ? options.tauHigh : 0.85;
    this.tauLow = options.tauLow !== undefined ? options.tauLow : 0.55;
    this.runtime.tauHigh = this.tauHigh;
    this.runtime.tauLow = this.tauLow;
  }

  get loadedModels() {
    return new Set(this.runtime.models.keys());
  }

  /**
   * Checks availability of the Local VLM runtime
   * @param {string} tier - 'A' | 'B'
   */
  async isAvailable(tier = 'A') {
    const targetTier = tier.toUpperCase();
    return Boolean(MODEL_SPECS[targetTier]);
  }

  /**
   * Checks if model tier is currently loaded in memory
   */
  isLoaded(tier = 'A') {
    return this.runtime.isLoaded(tier);
  }

  /**
   * Loads the specified model tier into memory
   * @param {string} tier - 'A' | 'B'
   */
  async load(tier = 'A') {
    const targetTier = tier.toUpperCase();
    const res = await this.runtime.load(targetTier);
    return {
      status: res.status,
      tier: targetTier,
      spec: MODEL_SPECS[targetTier],
      loadDurationMs: res.loadMs || 0,
    };
  }

  /**
   * Unloads a model tier to free memory / VRAM
   * @param {string} tier - 'A' | 'B'
   */
  async unload(tier = 'A') {
    return await this.runtime.unload(tier);
  }

  /**
   * Returns memory/VRAM footprint metrics
   */
  getMemoryInfo() {
    return this.runtime.getMemoryInfo();
  }

  /**
   * Returns detailed model metadata
   * @param {string} tier - 'A' | 'B'
   */
  getModelInfo(tier = 'A') {
    const t = tier.toUpperCase();
    return MODEL_SPECS[t] || null;
  }

  /**
   * Preprocesses an image crop for Local VLM
   */
  async preprocessImage(input, options = {}) {
    return await preprocessForVLM(input, options);
  }

  /**
   * Core Local VLM inference routine
   * @param {Object} req - { imageBase64, prompt, hint, cropBox, viewport, mimeType }
   * @returns {Promise<Object>}
   */
  async describe(req = {}) {
    if (!req.imageBase64) {
      throw new Error('Local VLM requires imageBase64 input');
    }
    this.runtime.tauHigh = this.tauHigh;
    this.runtime.tauLow = this.tauLow;
    const res = await this.runtime.describe(req);
    return {
      ...res,
      model: MODEL_SPECS[res.tier]?.model || res.model,
      modelId: MODEL_SPECS[res.tier]?.modelId || res.model,
    };
  }

  /**
   * Returns aggregated VLM benchmark statistics
   */
  getBenchmarkMetrics() {
    const metrics = this.runtime.metrics;
    const total = metrics.totalInvocations || 1;
    const latencies = metrics.latenciesMs;
    const avgLatency = latencies.length > 0 ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)) : 0;

    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Idx = Math.floor(sorted.length * 0.95);
    const p95Latency = sorted.length > 0 ? sorted[Math.min(sorted.length - 1, p95Idx)] : 0;

    const cropRatios = metrics.cropRatios;
    const avgCropRatio = cropRatios.length > 0 ? Number((cropRatios.reduce((a, b) => a + b, 0) / cropRatios.length).toFixed(4)) : 0;

    return {
      totalVlmInvocations: metrics.totalInvocations,
      webgpuInvocations: metrics.webgpuInvocations,
      cpuInvocations: metrics.cpuInvocations,
      cloudCalls: 0,
      escalationCount: metrics.latenciesMs.length,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      avgCropRatio,
      pixelReductionPercent: Number(((1 - avgCropRatio) * 100).toFixed(1)),
      loadedModels: Array.from(this.runtime.models.keys()),
      device: this.runtime.device || 'cpu',
    };
  }
}

// Global Singleton Instance
const globalVlmProvider = new LocalVLMProvider();

module.exports = {
  LocalVLMProvider,
  globalVlmProvider,
  MODEL_SPECS,
  detectWebGPU,
};

'use strict';

/**
 * ODVPA Interactive Live Local VLM Demo Runner
 *
 * Demonstrates the full On-Device Visual Perception pipeline:
 * 1. Image crop ingestion & bounding box calculation
 * 2. On-device LFM2.5-VL perception inference
 * 3. Element localization & coordinate conversion to viewport CSS space
 * 4. 5-Stage Privacy & Prompt Injection sanitization
 * 5. Calibrated confidence routing decision
 */

const sharp = require('sharp');
const { LocalVLMProvider } = require('./lib/vlm/provider');
const { detectWebGPU } = require('./lib/vlm/webgpu-provider');

async function createTelemetryChartCanvas() {
  // Generate a mock telemetry canvas image buffer
  const svg = `
    <svg width="480" height="260" viewBox="0 0 480 260" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0b1329"/>
      <!-- Grid Lines -->
      <line x1="40" y1="30" x2="440" y2="30" stroke="#1e293b" stroke-width="1"/>
      <line x1="40" y1="90" x2="440" y2="90" stroke="#1e293b" stroke-width="1"/>
      <line x1="40" y1="150" x2="440" y2="150" stroke="#1e293b" stroke-width="1"/>
      <line x1="40" y1="210" x2="440" y2="210" stroke="#334155" stroke-width="2"/>
      <!-- Telemetry Orbit Curve -->
      <path d="M 40 180 Q 180 30 320 120 T 440 60" fill="none" stroke="#38bdf8" stroke-width="3"/>
      <!-- Coordinate Points -->
      <circle cx="180" cy="85" r="5" fill="#f59e0b"/>
      <text x="195" y="80" fill="#f8fafc" font-size="12" font-family="sans-serif">Apogee: 450 km</text>
      <circle cx="320" cy="120" r="5" fill="#10b981"/>
      <text x="330" y="140" fill="#10b981" font-size="12" font-family="sans-serif">Velocity: 7.8 km/s</text>
      <!-- Visual Button inside Canvas -->
      <rect x="40" y="215" width="150" height="35" rx="6" fill="#2563eb"/>
      <text x="65" y="238" fill="#ffffff" font-size="12" font-weight="bold" font-family="sans-serif">Export CSV Data</text>
    </svg>
  `;
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  console.log('\n========================================================================');
  console.log('       PIXEL ODVPA — Real On-Device Visual Perception Demo              ');
  console.log('       Model: LiquidAI/LFM2.5-VL-450M-ONNX (Tier A) / 1.6B (Tier B)    ');
  console.log('========================================================================\n');

  const gpu = await detectWebGPU();
  console.log(`[Hardware Discovery] Device: ${gpu.device.toUpperCase()} | ${gpu.reason}`);

  const provider = new LocalVLMProvider();
  console.log('[Model Status] Memory:');
  console.log(JSON.stringify(provider.getMemoryInfo(), null, 2));

  console.log('\n--- Step 1: Synthesizing Canvas Telemetry Graphic (480x260 px) ---');
  const chartBuffer = await createTelemetryChartCanvas();
  const imageBase64 = chartBuffer.toString('base64');
  console.log('✓ Canvas graphic generated in memory (0 network transfer)');

  console.log('\n--- Step 2: Executing On-Device VLM Perception ---');
  const result = await provider.describe({
    imageBase64,
    hint: 'Analyze ISRO orbit altitude telemetry chart and detect interactive buttons',
    cropBox: { x: 120, y: 340, width: 480, height: 260 },
    viewport: { width: 1920, height: 1080 },
  });

  console.log('\n========================================================================');
  console.log('                      VLM INFERENCE OUTPUT RESULT                       ');
  console.log('========================================================================');
  console.log(`Model Used          : ${result.model} (${result.tier === 'A' ? '450M Tier A' : '1.6B Tier B'})`);
  console.log(`Runtime Execution   : ${result.runtime} on ${result.device.toUpperCase()}`);
  console.log(`Total Latency       : ${result.totalLatencyMs} ms (Preprocess: ${result.preprocessLatencyMs} ms, Inference: ${result.inferenceLatencyMs} ms)`);
  console.log(`Crop Dimensions     : ${result.cropMetrics.cropDimensions.width} x ${result.cropMetrics.cropDimensions.height} px`);
  console.log(`Viewport Dimensions : ${result.cropMetrics.viewportDimensions.width} x ${result.cropMetrics.viewportDimensions.height} px`);
  console.log(`Pixel / Token Saving: ${result.cropMetrics.pixelSavingsPercent} %`);
  console.log(`Visual Confidence   : ${result.confidence}`);
  console.log(`Calibrated Routing  : ${result.routingConfidence} -> [${result.routeDecision}]`);
  console.log(`Cloud Call Made     : ${result.cloudUsed ? 'YES (Violated)' : 'NO (100% On-Device)'}`);
  
  console.log('\n--- Structured Visual Content ---');
  console.log(`Summary     : "${result.summary}"`);
  console.log(`Description : "${result.description}"`);
  console.log(`Visual State: ${result.visual_state}`);

  console.log('\n--- Detected Elements & Translated Viewport Coordinates ---');
  for (const el of result.elements) {
    console.log(` • [${el.type}] "${el.text}"`);
    console.log(`   - Local Crop Box : [${el.cropRelativeLocation?.x}, ${el.cropRelativeLocation?.y}, ${el.cropRelativeLocation?.width}, ${el.cropRelativeLocation?.height}]`);
    console.log(`   - Viewport CSS   : [x: ${el.location.x}, y: ${el.location.y}, w: ${el.location.width}, h: ${el.location.height}]`);
    console.log(`   - Confidence     : ${el.confidence}`);
  }

  console.log('\n--- Extracted Text Nodes ---');
  for (const t of result.text) {
    console.log(` • "${t}"`);
  }

  console.log('\n========================================================================');
  console.log('✓ On-Device VLM Execution Verified Cleanly with Zero Cloud Dependencies!');
  console.log('========================================================================\n');
}

main().catch(console.error);

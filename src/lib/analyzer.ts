/**
 * Real file analyzer — extracts actual metrics from uploaded files
 * and generates honest, data-driven scoring.
 * Supports two modes: coloring (pixel-based) and design (pixel + theme context).
 */

import type { ScoreResult, ContestConfig, CriterionDef } from '../store/appStore';

// ─── Image Analysis ───

interface ImageMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  avgBrightness: number;
  brightnessStdDev: number;
  colorfulness: number;
  dominantHue: number;
  saturationAvg: number;
  uniqueColorRatio: number;
  edgeDensity: number;
  isHighRes: boolean;
  hasGoodAspect: boolean;
}

function analyzeImageData(imageData: ImageData): ImageMetrics {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  let brightnessSum = 0;
  const brightnessArr: number[] = [];
  let satSum = 0;
  const hueHist = new Float32Array(360);
  const colorSet = new Set<string>();
  const sampleStep = Math.max(1, Math.floor(pixelCount / 50000));

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessSum += brightness;
    brightnessArr.push(brightness);
    colorSet.add(`${Math.floor(r / 16)}-${Math.floor(g / 16)}-${Math.floor(b / 16)}`);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0, s = 0;
    if (delta > 0.01) {
      const l = (max + min) / 2;
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      if (max === rn) h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) * 60;
      else if (max === gn) h = ((bn - rn) / delta + 2) * 60;
      else h = ((rn - gn) / delta + 4) * 60;
    }
    satSum += s;
    hueHist[Math.floor(h) % 360]++;
  }

  const sampledCount = brightnessArr.length;
  const avgBrightness = brightnessSum / sampledCount;
  let varianceSum = 0;
  for (const b of brightnessArr) varianceSum += (b - avgBrightness) ** 2;
  const brightnessStdDev = Math.sqrt(varianceSum / sampledCount);
  const uniqueColorRatio = Math.min(colorSet.size / (16 * 16 * 16), 1);
  const saturationAvg = (satSum / sampledCount) * 100;
  const colorfulness = Math.min(100, saturationAvg * 0.6 + uniqueColorRatio * 100 * 0.4);
  let maxHueCount = 0, dominantHue = 0;
  for (let i = 0; i < 360; i++) {
    if (hueHist[i] > maxHueCount) { maxHueCount = hueHist[i]; dominantHue = i; }
  }

  let edgeSum = 0;
  const w = width, step = sampleStep;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * w + x) * 4;
      const left = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
      const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const top = 0.299 * data[idx - w * 4] + 0.587 * data[idx - w * 4 + 1] + 0.114 * data[idx - w * 4 + 2];
      const bottom = 0.299 * data[idx + w * 4] + 0.587 * data[idx + w * 4 + 1] + 0.114 * data[idx + w * 4 + 2];
      if (Math.abs(right - left) + Math.abs(bottom - top) > 30) edgeSum++;
    }
  }
  const edgeSamples = Math.ceil((height - 2) / step) * Math.ceil((width - 2) / step);
  const edgeDensity = edgeSamples > 0 ? edgeSum / edgeSamples : 0;
  const aspectRatio = width / height;
  const commonAspects = [1, 4 / 3, 3 / 2, 16 / 9, 3 / 4, 2 / 3, 9 / 16];
  const hasGoodAspect = commonAspects.some((a) => Math.abs(aspectRatio - a) < 0.05);

  return {
    width, height, aspectRatio, avgBrightness, brightnessStdDev,
    colorfulness, dominantHue, saturationAvg, uniqueColorRatio,
    edgeDensity, isHighRes: width >= 1920 || height >= 1920, hasGoodAspect,
  };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ─── Metric-to-score mapping (reusable) ───

function metricScore_creativity(m: ImageMetrics): number {
  return clamp(
    m.colorfulness * 0.35 + m.uniqueColorRatio * 100 * 0.25 +
    m.edgeDensity * 100 * 0.25 + (m.brightnessStdDev / 80) * 100 * 0.15,
    15, 95
  );
}

function metricScore_technical(m: ImageMetrics): number {
  const res = m.isHighRes ? 30 : Math.min(30, (Math.max(m.width, m.height) / 1920) * 30);
  const asp = m.hasGoodAspect ? 20 : 10;
  const bri = m.avgBrightness > 30 && m.avgBrightness < 230 ? 25 : 10;
  const con = Math.min(25, (m.brightnessStdDev / 70) * 25);
  return clamp(res + asp + bri + con, 15, 95);
}

function metricScore_visual(m: ImageMetrics): number {
  const sat = m.saturationAvg > 10 && m.saturationAvg < 80 ? 35 : m.saturationAvg <= 10 ? 15 : 20;
  const bright = Math.abs(m.avgBrightness - 128) < 60 ? 35 : 15;
  return clamp(sat + bright + m.colorfulness * 0.3, 15, 95);
}

function metricScore_content(m: ImageMetrics): number {
  return clamp(m.edgeDensity * 100 * 0.5 + m.uniqueColorRatio * 100 * 0.5, 15, 95);
}

function metricScore_impact(m: ImageMetrics): number {
  // Impact = high contrast + colorful + detailed
  return clamp(
    (m.brightnessStdDev / 80) * 100 * 0.35 +
    m.colorfulness * 0.35 +
    m.edgeDensity * 100 * 0.3,
    15, 95
  );
}

function metricScore_theme(m: ImageMetrics): number {
  // Without actual content understanding, theme score is based on
  // visual complexity + color richness as proxy for "effort put into theme"
  return clamp(
    m.colorfulness * 0.3 +
    m.edgeDensity * 100 * 0.3 +
    m.uniqueColorRatio * 100 * 0.2 +
    (m.brightnessStdDev / 80) * 100 * 0.2,
    15, 95
  );
}

// Map metric type string to function
function getMetricFn(metricType: string): (m: ImageMetrics) => number {
  switch (metricType) {
    case 'creativity': return metricScore_creativity;
    case 'technical': return metricScore_technical;
    case 'visual': return metricScore_visual;
    case 'content': return metricScore_content;
    case 'impact': return metricScore_impact;
    case 'theme': return metricScore_theme;
    case 'completeness': return (m) => {
      const scores = [metricScore_creativity(m), metricScore_technical(m), metricScore_visual(m), metricScore_content(m)];
      return clamp(scores.reduce((a, b) => a + b, 0) / scores.length, 15, 95);
    };
    default: return metricScore_visual;
  }
}

// ─── Feedback generators ───

function feedbackFor(criterionId: string, m: ImageMetrics, score: number, config?: ContestConfig): string {
  const themeLabel = config?.theme ? `「${config.theme}」` : '';

  switch (criterionId) {
    case 'theme':
      if (score >= 75) return `作品在視覺複雜度與色彩豐富度上表現優秀，具備充分詮釋主題${themeLabel}的視覺基礎。`;
      if (score >= 55) return `作品具有一定的視覺表現力，但在主題${themeLabel}的深度詮釋上仍有提升空間。`;
      if (score >= 35) return `作品的視覺元素較為單薄，建議增加更多與主題${themeLabel}相關的視覺層次。`;
      return `作品在視覺豐富度上不足，難以充分傳達主題${themeLabel}的意涵。`;

    case 'creativity':
      if (score >= 80) return `色彩豐富度高（${m.colorfulness.toFixed(0)}/100），畫面細節層次分明，展現出較強的創意表達。`;
      if (score >= 60) return `色彩運用尚可（${m.colorfulness.toFixed(0)}/100），畫面有一定的層次感，但仍有提升空間。`;
      if (score >= 40) return `畫面色彩較為單一（${m.colorfulness.toFixed(0)}/100），細節不夠豐富，建議增加視覺層次。`;
      return `畫面整體較為平淡，色彩與細節均不足，建議重新審視構圖與配色方案。`;

    case 'technical': {
      const resPart = m.isHighRes ? `解析度優秀（${m.width}×${m.height}）` : `解析度偏低（${m.width}×${m.height}）`;
      const contrastPart = m.brightnessStdDev > 50 ? '對比度充足' : m.brightnessStdDev > 25 ? '對比度中等' : '對比度不足';
      return `${resPart}。${contrastPart}（標準差 ${m.brightnessStdDev.toFixed(1)}）。`;
    }

    case 'visual': {
      const brightDesc = m.avgBrightness > 180 ? '偏亮' : m.avgBrightness < 75 ? '偏暗' : '適中';
      const satDesc = m.saturationAvg > 60 ? '飽和度較高' : m.saturationAvg > 25 ? '飽和度適中' : '飽和度偏低';
      return `整體亮度${brightDesc}（${m.avgBrightness.toFixed(0)}/255），${satDesc}。`;
    }

    case 'content': {
      const detailDesc = m.edgeDensity > 0.3 ? '豐富' : m.edgeDensity > 0.15 ? '中等' : '較少';
      return `畫面細節${detailDesc}，色域覆蓋 ${(m.uniqueColorRatio * 100).toFixed(0)}%。`;
    }

    case 'impact':
      if (score >= 75) return '作品具有強烈的視覺衝擊力，色彩對比鮮明、細節豐富，整體感染力強。';
      if (score >= 55) return '作品有一定的視覺吸引力，但在衝擊力和記憶點上仍可加強。';
      if (score >= 35) return '作品的視覺影響力偏弱，建議加強色彩對比與細節表現。';
      return '作品缺乏視覺衝擊力，需要在多個方面進行大幅改善。';

    case 'completeness':
      if (score >= 80) return '各維度表現均衡且優秀，作品整體完成度高。';
      if (score >= 60) return '大部分維度表現合格，但存在短板。';
      return '多個維度表現不足，整體完成度有待提升。';

    default:
      return `分數 ${score}/100。`;
  }
}

// ─── Score from Image (generic, supports both modes) ───

function scoreFromImageMetrics(m: ImageMetrics, config?: ContestConfig): ScoreResult {
  const criteria = config?.criteria ?? [
    { id: 'creativity', name: '創意與原創性', weight: 3, description: '' },
    { id: 'technical', name: '技術執行力', weight: 3, description: '' },
    { id: 'visual', name: '視覺呈現', weight: 3, description: '' },
    { id: 'content', name: '內容深度', weight: 2, description: '' },
    { id: 'completeness', name: '整體完整性', weight: 2, description: '' },
  ];

  const categories = criteria.map((c) => {
    // Use metricType if set (custom criteria), otherwise fall back to id
    const fn = getMetricFn(c.metricType || c.id);
    const score = fn(m);
    return {
      name: c.name,
      score,
      maxScore: 100,
      feedback: feedbackFor(c.id, m, score, config),
      weight: c.weight,
    };
  });

  // Weighted average
  const totalWeight = categories.reduce((s, c) => s + (c.weight || 1), 0);
  const weightedSum = categories.reduce((s, c) => s + c.score * (c.weight || 1), 0);
  const totalScore = clamp(Math.round(weightedSum / totalWeight), 15, 95);

  return {
    totalScore,
    categories,
    aiComment: buildComment(m, totalScore, categories, config),
    suggestions: buildSuggestions(m, categories, config),
    strengths: buildStrengths(m, categories),
    tags: buildTags(totalScore, categories, config),
  };
}

function buildComment(m: ImageMetrics, total: number, cats: ScoreResult['categories'], config?: ContestConfig): string {
  const best = cats.reduce((a, b) => (a.score > b.score ? a : b));
  const worst = cats.reduce((a, b) => (a.score < b.score ? a : b));
  let level = total >= 80 ? '表現優秀' : total >= 65 ? '表現中等偏上' : total >= 50 ? '表現尚可' : total >= 35 ? '有較大改善空間' : '需要重大改進';

  let prefix = '';
  if (config?.mode === 'design' && config.theme) {
    prefix = `【設計比賽 · 主題：${config.theme}】`;
  } else if (config?.mode === 'coloring') {
    prefix = '【填色比賽】';
  }

  return `${prefix}此作品經 AI 分析後綜合評分為 ${total} 分（加權平均），整體${level}。` +
    `圖片解析度 ${m.width}×${m.height}${m.isHighRes ? '（高解析度）' : ''}。` +
    `在${cats.length}個評估維度中，「${best.name}」表現最佳（${best.score} 分），` +
    `「${worst.name}」相對較弱（${worst.score} 分）。` +
    `亮度 ${m.avgBrightness.toFixed(0)}/255，對比度標準差 ${m.brightnessStdDev.toFixed(1)}，色彩豐富度 ${m.colorfulness.toFixed(0)}/100。`;
}

function buildSuggestions(m: ImageMetrics, cats: ScoreResult['categories'], config?: ContestConfig): string[] {
  const suggestions: string[] = [];

  // Theme-specific suggestions for design mode
  if (config?.mode === 'design' && config.theme) {
    const themeCat = cats.find((c) => c.name === '主題契合度');
    if (themeCat && themeCat.score < 70) {
      suggestions.push(`主題「${config.theme}」的視覺詮釋力不足，建議增加更多與主題相關的視覺元素與色彩表達。`);
    }
  }

  if (!m.isHighRes) suggestions.push(`解析度為 ${m.width}×${m.height}，建議提升至 1920px 以上。`);
  if (m.brightnessStdDev < 30) suggestions.push('對比度偏低，建議調整明暗對比以增加層次感。');
  if (m.avgBrightness > 200) suggestions.push('畫面偏亮（可能過曝），建議降低曝光。');
  else if (m.avgBrightness < 50) suggestions.push('畫面偏暗，建議提升亮度。');
  if (m.colorfulness < 30) suggestions.push('色彩較單調，嘗試引入更多色彩層次。');
  if (m.saturationAvg > 75) suggestions.push('飽和度偏高，建議適度降低以獲得更自然的效果。');
  if (m.edgeDensity < 0.1) suggestions.push('細節不夠豐富，考慮增加紋理或元素。');
  if (!m.hasGoodAspect) suggestions.push(`長寬比（${m.aspectRatio.toFixed(2)}）較特殊，考慮使用標準比例。`);

  if (suggestions.length === 0) {
    suggestions.push('整體表現良好，可嘗試更多實驗性突破。');
    suggestions.push('確保跨平台視覺一致性。');
  }
  if (suggestions.length === 1) suggestions.push('持續保持品質水準，探索新方向。');
  return suggestions.slice(0, 5);
}

function buildStrengths(m: ImageMetrics, cats: ScoreResult['categories']): string[] {
  const strengths: string[] = [];
  const sorted = [...cats].sort((a, b) => b.score - a.score);
  for (const cat of sorted.slice(0, 3)) {
    if (cat.score >= 60) strengths.push(`${cat.name}表現良好（${cat.score} 分）`);
  }
  if (m.isHighRes) strengths.push(`高解析度（${m.width}×${m.height}）`);
  if (m.brightnessStdDev > 50) strengths.push('明暗對比層次分明');
  if (m.colorfulness > 60) strengths.push('色彩運用豐富多元');
  if (m.hasGoodAspect) strengths.push('長寬比例標準規範');
  if (m.edgeDensity > 0.25) strengths.push('畫面細節豐富');
  if (strengths.length === 0) strengths.push('已完成作品提交');
  return strengths.slice(0, 4);
}

function buildTags(total: number, cats: ScoreResult['categories'], config?: ContestConfig): string[] {
  const tags: string[] = [];
  if (config?.mode === 'design') tags.push('設計比賽');
  else if (config?.mode === 'coloring') tags.push('填色比賽');

  if (total >= 80) tags.push('優秀作品');
  else if (total >= 65) tags.push('良好作品');
  else if (total >= 50) tags.push('合格作品');
  else tags.push('待改進');

  for (const cat of cats) {
    if (cat.score >= 80) {
      const short = cat.name.replace('與原創性', '').replace('執行力', '').replace('呈現', '').replace('深度', '').replace('完整性', '').replace('契合度', '');
      tags.push(`${short}突出`);
    }
  }
  return tags.slice(0, 4);
}

// ─── Non-image fallback ───

function scoreFromFileMetadata(file: File, config?: ContestConfig): ScoreResult {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const sizeMB = file.size / (1024 * 1024);
  const base = clamp(Math.round((
    (sizeMB > 0.1 ? Math.min(70, 30 + sizeMB * 2) : 20) +
    (['pdf', 'psd', 'ai', 'fig', 'sketch', 'xd'].includes(ext) ? 65 : 50) +
    (file.name.length > 5 ? 60 : 35)
  ) / 3), 25, 70);

  const criteria = config?.criteria ?? [
    { id: 'creativity', name: '創意與原創性', weight: 3, description: '' },
    { id: 'technical', name: '技術執行力', weight: 3, description: '' },
    { id: 'visual', name: '視覺呈現', weight: 3, description: '' },
    { id: 'content', name: '內容深度', weight: 2, description: '' },
    { id: 'completeness', name: '整體完整性', weight: 2, description: '' },
  ];

  const categories = criteria.map((c, i) => ({
    name: c.name,
    score: clamp(base + (i % 2 === 0 ? 3 : -3), 20, 70),
    maxScore: 100,
    feedback: '非圖片格式，無法進行視覺分析。建議上傳圖片以獲得完整評估。',
    weight: c.weight,
  }));

  const totalWeight = categories.reduce((s, c) => s + (c.weight || 1), 0);
  const weightedSum = categories.reduce((s, c) => s + c.score * (c.weight || 1), 0);
  const totalScore = clamp(Math.round(weightedSum / totalWeight), 20, 70);

  return {
    totalScore,
    categories,
    aiComment: `此檔案為 .${ext} 格式（${sizeMB.toFixed(1)} MB），非圖片格式，僅基於元數據估算。建議上傳圖片以獲得完整分析。`,
    suggestions: ['建議上傳圖片格式（PNG、JPG、WebP）以獲得完整的 AI 視覺分析。', '可將作品匯出為圖片後重新上傳。'],
    strengths: [`已提交 .${ext} 格式檔案`],
    tags: ['非圖片格式', '元數據評估'],
  };
}

// ─── Thumbnail Generator ───

export function generateThumbnail(file: File, maxSize = 240): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(undefined); return; }
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(undefined);
    img.src = URL.createObjectURL(file);
  });
}

export function generateFullImage(file: File, maxSize = 1200): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(undefined); return; }
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(undefined);
    img.src = URL.createObjectURL(file);
  });
}

// ─── Main Export ───

export async function analyzeFile(file: File, config?: ContestConfig): Promise<ScoreResult> {
  if (file.type.startsWith('image/')) {
    try {
      const img = await loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      const metrics = analyzeImageData(imageData);
      metrics.width = img.width;
      metrics.height = img.height;
      metrics.isHighRes = img.width >= 1920 || img.height >= 1920;
      return scoreFromImageMetrics(metrics, config);
    } catch {
      return scoreFromFileMetadata(file, config);
    }
  }
  return scoreFromFileMetadata(file, config);
}

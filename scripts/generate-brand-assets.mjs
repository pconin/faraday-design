import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire('/tmp/faraday-toolchain/package.json');
const sharp = require('sharp');
const TextToSVG = require('text-to-svg');
const ffmpegBinary = require('ffmpeg-static');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const exportsDir = path.join(root, 'exports', 'deliverables');
const logosDir = path.join(exportsDir, 'logos');
const socialDir = path.join(exportsDir, 'social');
const tempDir = path.join(exportsDir, '.tmp');

const COLORS = {
  ink: '#151D2A',
  porcelain: '#F6F3EC',
  sage: '#C5CFBF',
  lake: '#4A8395',
  ember: '#FF9361',
  white: '#FFFFFF',
  line: 'rgba(21,29,42,.12)',
  mutedInk: '#4A5561',
};

const FONTS = {
  sora: TextToSVG.loadSync(path.join(assetsDir, 'fonts', 'Sora.ttf')),
  soraLight: TextToSVG.loadSync(path.join(assetsDir, 'fonts', 'Sora-Light.ttf')),
  manrope: TextToSVG.loadSync(path.join(assetsDir, 'fonts', 'Manrope-Regular.ttf')),
  manropeBold: TextToSVG.loadSync(path.join(assetsDir, 'fonts', 'Manrope-Bold.ttf')),
  plex: TextToSVG.loadSync(path.join(assetsDir, 'fonts', 'IBMPlexMono-Medium.ttf')),
};

const PHOTO = {
  boxBlack: path.join(assetsDir, 'box-black.jpeg'),
  boxCream: path.join(assetsDir, 'box-cream.jpeg'),
  led: path.join(assetsDir, 'led-reference-v2.jpg'),
};

const manifest = {
  generatedAt: new Date().toISOString(),
  package: {
    zip: 'exports/deliverables/faraday-assets.zip',
    motionZip: 'exports/deliverables/faraday-motion-assets.zip',
  },
  logos: [],
  staticBanners: [],
  animatedBanners: [],
};

function toBuffer(svg) {
  return Buffer.from(svg);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function svgDoc(width, height, content, background = null) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  ${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}
  ${content}
</svg>`;
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function measureTracked(text, font, fontSize, tracking = 0) {
  let width = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === ' ') {
      width += fontSize * 0.34 + tracking;
      continue;
    }
    const metrics = font.getMetrics(ch, { fontSize });
    width += metrics.width + tracking;
  }
  return Math.max(0, width - tracking);
}

function textPath({
  text,
  font,
  fontSize,
  x,
  y,
  fill,
  anchor = 'left',
  tracking = 0,
  opacity = 1,
}) {
  if (!text) return '';
  let startX = x;
  const fullWidth = measureTracked(text, font, fontSize, tracking);
  if (anchor === 'center') startX -= fullWidth / 2;
  if (anchor === 'right') startX -= fullWidth;

  let cursor = startX;
  return Array.from(text).map((ch) => {
    if (ch === ' ') {
      cursor += fontSize * 0.34 + tracking;
      return '';
    }
    const d = font.getD(ch, { x: cursor, y, fontSize, anchor: 'left baseline' });
    const metrics = font.getMetrics(ch, { fontSize });
    cursor += metrics.width + tracking;
    return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
  }).join('');
}

function multilineText({
  lines,
  font,
  fontSize,
  x,
  y,
  lineHeight,
  fill,
  anchor = 'left',
  tracking = 0,
  opacity = 1,
}) {
  return lines.map((line, index) => textPath({
    text: line,
    font,
    fontSize,
    x,
    y: y + (index * lineHeight),
    fill,
    anchor,
    tracking,
    opacity,
  })).join('');
}

function ledGroup({
  x,
  y,
  size,
  tileFill = 'transparent',
  shell = COLORS.porcelain,
  core = COLORS.ember,
  aura = null,
  auraMode = 'core',
  auraOpacity = 0.18,
  transparentTile = false,
}) {
  const scale = size / 96;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    ${transparentTile ? '' : `<rect width="96" height="96" rx="26" fill="${tileFill}"/>`}
    ${aura ? (
      auraMode === 'full'
        ? `<rect class="led-aura" x="32" y="15" width="32" height="66" rx="16" fill="${aura}" opacity="${auraOpacity}"/>`
        : `<rect class="led-aura" x="33" y="18" width="30" height="60" rx="15" fill="${aura}" opacity="${auraOpacity}"/>`
    ) : ''}
    <rect x="31" y="14" width="34" height="68" rx="17" stroke="${shell}" stroke-width="2.6"/>
    <rect x="43" y="28" width="10" height="40" rx="5" fill="${core}"/>
  </g>`;
}

function logoWordmark({
  x,
  y,
  fill,
  baselineFill,
  baselineOpacity = 0.82,
  baseline = true,
  align = 'left',
  titleSize = 154,
  baselineSize = 28,
  baselineTracking = 12,
  baselineOffset = 62,
}) {
  const title = textPath({
    text: 'faraday',
    font: FONTS.soraLight,
    fontSize: titleSize,
    x,
    y,
    fill,
    anchor: align,
  });
  const base = baseline ? textPath({
    text: 'DISCONNECT TO RECONNECT',
    font: FONTS.manropeBold,
    fontSize: baselineSize,
    x,
    y: y + baselineOffset,
    fill: baselineFill,
    anchor: align,
    tracking: baselineTracking,
    opacity: baselineOpacity,
  }) : '';
  return `${title}${base}`;
}

function buildLogoSvg(variant) {
  if (variant.layout === 'mark') {
    return svgDoc(
      variant.width,
      variant.height,
      ledGroup({
        x: (variant.width - variant.markSize) / 2,
        y: (variant.height - variant.markSize) / 2,
        size: variant.markSize,
        tileFill: variant.tileFill,
        shell: variant.shell,
        core: variant.core,
        aura: variant.aura,
        auraMode: variant.auraMode,
        auraOpacity: variant.auraOpacity,
        transparentTile: variant.transparentTile,
      }),
      variant.background,
    );
  }

  if (variant.layout === 'horizontal') {
    const markX = 156;
    const markY = (variant.height - variant.markSize) / 2;
    const wordGap = variant.wordGap ?? Math.round(variant.markSize * 0.15);
    const wordX = markX + variant.markSize + wordGap;
    const titleSize = Math.round(variant.markSize * 0.52);
    const baselineSize = Math.round(variant.markSize * 0.15);
    const baselineTracking = Math.max(8, Math.round(variant.markSize * 0.048));
    const baselineOffset = Math.round(titleSize * 0.56);
    return svgDoc(
      variant.width,
      variant.height,
      `
        ${ledGroup({
          x: markX,
          y: markY,
          size: variant.markSize,
          tileFill: variant.tileFill,
          shell: variant.shell,
          core: variant.core,
          aura: variant.aura,
          auraMode: variant.auraMode,
          auraOpacity: variant.auraOpacity,
          transparentTile: variant.transparentTile,
        })}
        ${logoWordmark({
          x: wordX,
          y: variant.height / 2 + Math.round(variant.markSize * 0.02),
          fill: variant.wordFill,
          baselineFill: variant.baselineFill,
          baselineOpacity: variant.baselineOpacity,
          baseline: variant.baseline,
          titleSize,
          baselineSize,
          baselineTracking,
          baselineOffset,
        })}
      `,
      variant.background,
    );
  }

  if (variant.layout === 'stacked') {
    const centerX = variant.width / 2;
    const markX = centerX - (variant.markSize / 2);
    const markY = variant.markY ?? 228;
    const titleSize = Math.round(variant.markSize * 0.5);
    const titleY = markY + variant.markSize + Math.round(titleSize * 0.74) + Math.round(variant.markSize * 0.08);
    const baselineY = titleY + Math.round(titleSize * 0.58);
    return svgDoc(
      variant.width,
      variant.height,
      `
        ${ledGroup({
          x: markX,
          y: markY,
          size: variant.markSize,
          tileFill: variant.tileFill,
          shell: variant.shell,
          core: variant.core,
          aura: variant.aura,
          auraMode: variant.auraMode,
          auraOpacity: variant.auraOpacity,
          transparentTile: variant.transparentTile,
        })}
        ${textPath({
          text: 'faraday',
          font: FONTS.soraLight,
          fontSize: titleSize,
          x: centerX,
          y: titleY,
          fill: variant.wordFill,
          anchor: 'center',
        })}
        ${variant.baseline ? textPath({
          text: 'DISCONNECT TO RECONNECT',
          font: FONTS.manropeBold,
          fontSize: Math.round(variant.markSize * 0.15),
          x: centerX,
          y: baselineY,
          fill: variant.baselineFill,
          anchor: 'center',
          tracking: Math.max(8, Math.round(variant.markSize * 0.045)),
          opacity: variant.baselineOpacity ?? 0.82,
        }) : ''}
      `,
      variant.background,
    );
  }

  if (variant.layout === 'wordmark') {
    const titleSize = 170;
    const titleY = variant.height / 2 - 4;
    const baselineY = titleY + Math.round(titleSize * 0.58);
    return svgDoc(
      variant.width,
      variant.height,
      `
        ${textPath({
          text: 'faraday',
          font: FONTS.soraLight,
          fontSize: titleSize,
          x: variant.width / 2,
          y: titleY,
          fill: variant.wordFill,
          anchor: 'center',
        })}
        ${variant.baseline ? textPath({
          text: 'DISCONNECT TO RECONNECT',
          font: FONTS.manropeBold,
          fontSize: 30,
          x: variant.width / 2,
          y: baselineY,
          fill: variant.baselineFill,
          anchor: 'center',
          tracking: 10,
          opacity: variant.baselineOpacity ?? 0.82,
        }) : ''}
      `,
      variant.background,
    );
  }

  throw new Error(`Unknown logo layout: ${variant.layout}`);
}

async function saveLogoVariant(variant) {
  const svg = buildLogoSvg(variant);
  const svgPath = path.join(logosDir, 'svg', `${variant.id}.svg`);
  await fs.writeFile(svgPath, svg);

  const entry = {
    id: variant.id,
    label: variant.label,
    category: variant.category,
    files: {
      svg: rel(svgPath),
      png: {},
      webp: {},
    },
  };

  const rasterSizes = variant.rasterSizes;
  for (const size of rasterSizes) {
    const pngPath = path.join(logosDir, 'png', `${variant.id}-${size}.png`);
    const webpPath = path.join(logosDir, 'webp', `${variant.id}-${size}.webp`);
    await sharp(toBuffer(svg))
      .resize({ width: size, height: size, fit: 'inside' })
      .png()
      .toFile(pngPath);
    await sharp(pngPath)
      .webp({ quality: 92 })
      .toFile(webpPath);
    entry.files.png[size] = rel(pngPath);
    entry.files.webp[size] = rel(webpPath);
  }

  manifest.logos.push(entry);
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

async function basePhoto(file, width, height, position = 'centre') {
  return sharp(file).rotate().resize(width, height, { fit: 'cover', position }).toBuffer();
}

function roundedRectSvg(width, height, radius, fill, opacity = 1, stroke = null, strokeWidth = 0) {
  return svgDoc(width, height, `
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="${fill}" opacity="${opacity}" ${stroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ''}/>
  `);
}

function gradientLayer(width, height, stops, options = {}) {
  const {
    x1 = '0%',
    y1 = '0%',
    x2 = '100%',
    y2 = '100%',
  } = options;
  const stopMarkup = stops.map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}" stop-opacity="${stop.opacity ?? 1}"/>`).join('');
  return toBuffer(svgDoc(width, height, `
    <defs>
      <linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        ${stopMarkup}
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  `));
}

function blurGlowLayer(width, height, cx, cy, radius, color, opacity) {
  return toBuffer(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${radius / 2}"/>
    </filter>
  </defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius * 1.4}" fill="${color}" opacity="${opacity}" filter="url(#blur)"/>
</svg>`);
}

function layerFromMarkup(width, height, markup) {
  return toBuffer(svgDoc(width, height, markup));
}

function pillMarkup(x, y, width, height, fill, label, labelFill = COLORS.ink) {
  const radius = height / 2;
  return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"/>
    ${textPath({
      text: label.toUpperCase(),
      font: FONTS.manrope,
      fontSize: Math.round(height * 0.42),
      x: x + (width / 2),
      y: y + (height * 0.67),
      fill: labelFill,
      anchor: 'center',
      tracking: 3.5,
    })}
  `;
}

function renderQuoteCenter(cfg) {
  const textX = cfg.textX ?? (cfg.width / 2);
  const anchor = cfg.anchor ?? 'center';
  const subX = cfg.subX ?? textX;
  const subAnchor = cfg.subAnchor ?? anchor;
  return layerFromMarkup(cfg.width, cfg.height, `
    ${cfg.overline ? textPath({
      text: cfg.overline.toUpperCase(),
      font: FONTS.manrope,
      fontSize: cfg.smallSize,
      x: cfg.overlineX ?? textX,
      y: cfg.top,
      fill: cfg.overlineFill,
      anchor: cfg.overlineAnchor ?? anchor,
      tracking: cfg.smallTracking,
      opacity: 0.72,
    }) : ''}
    ${multilineText({
      lines: cfg.lines,
      font: FONTS.sora,
      fontSize: cfg.titleSize,
      x: textX,
      y: cfg.top + cfg.offsetY,
      lineHeight: cfg.lineHeight,
      fill: cfg.titleFill,
      anchor,
    })}
    ${cfg.divider ? `<rect x="${(cfg.width / 2) - (cfg.divider / 2)}" y="${cfg.top + cfg.dividerY}" width="${cfg.divider}" height="${cfg.dividerHeight}" rx="${cfg.dividerHeight / 2}" fill="${cfg.accent}"/>` : ''}
    ${cfg.subLines ? multilineText({
      lines: cfg.subLines,
      font: FONTS.manrope,
      fontSize: cfg.subSize,
      x: subX,
      y: cfg.top + cfg.subY,
      lineHeight: cfg.subLineHeight,
      fill: cfg.subFill,
      anchor: subAnchor,
    }) : ''}
    ${cfg.logoMarkup ?? ''}
  `);
}

function renderPhotoOverlay(cfg) {
  return layerFromMarkup(cfg.width, cfg.height, `
    ${cfg.kicker ? textPath({
      text: cfg.kicker.toUpperCase(),
      font: FONTS.manrope,
      fontSize: cfg.kickerSize,
      x: cfg.padding,
      y: cfg.padding,
      fill: cfg.kickerFill,
      tracking: cfg.kickerTracking,
      opacity: 0.74,
    }) : ''}
    ${multilineText({
      lines: cfg.lines,
      font: FONTS.sora,
      fontSize: cfg.titleSize,
      x: cfg.padding,
      y: cfg.height - cfg.bottomOffset,
      lineHeight: cfg.lineHeight,
      fill: cfg.titleFill,
    })}
    ${cfg.bodyLines ? multilineText({
      lines: cfg.bodyLines,
      font: FONTS.manrope,
      fontSize: cfg.bodySize,
      x: cfg.padding,
      y: cfg.height - cfg.bodyOffset,
      lineHeight: cfg.bodyLineHeight,
      fill: cfg.bodyFill,
    }) : ''}
    ${cfg.logoMarkup ?? ''}
  `);
}

function renderStatCenter(cfg) {
  const anchor = cfg.anchor ?? 'center';
  const textX = cfg.textX ?? (cfg.width / 2);
  return layerFromMarkup(cfg.width, cfg.height, `
    ${cfg.overline ? textPath({
      text: cfg.overline.toUpperCase(),
      font: FONTS.manrope,
      fontSize: cfg.smallSize,
      x: cfg.overlineX ?? textX,
      y: cfg.top,
      fill: cfg.overlineFill,
      anchor: cfg.overlineAnchor ?? anchor,
      tracking: cfg.smallTracking,
      opacity: 0.72,
    }) : ''}
    ${textPath({
      text: cfg.stat,
      font: FONTS.plex,
      fontSize: cfg.statSize,
      x: textX,
      y: cfg.statY,
      fill: cfg.statFill,
      anchor,
    })}
    ${multilineText({
      lines: cfg.lines,
      font: FONTS.manrope,
      fontSize: cfg.titleSize,
      x: cfg.bodyX ?? textX,
      y: cfg.statY + cfg.offsetY,
      lineHeight: cfg.lineHeight,
      fill: cfg.titleFill,
      anchor: cfg.bodyAnchor ?? anchor,
    })}
    ${cfg.cta ? textPath({
      text: cfg.cta.toUpperCase(),
      font: FONTS.manrope,
      fontSize: cfg.ctaSize,
      x: cfg.ctaXText ?? textX,
      y: cfg.ctaY,
      fill: cfg.ctaFill,
      anchor: cfg.ctaAnchor ?? anchor,
      tracking: cfg.ctaTracking,
    }) : ''}
    ${cfg.logoMarkup ?? ''}
  `);
}

function renderStoryCta(cfg) {
  const anchor = cfg.anchor ?? 'center';
  const titleX = cfg.titleX ?? (cfg.width / 2);
  const bodyX = cfg.bodyX ?? titleX;
  return layerFromMarkup(cfg.width, cfg.height, `
    ${cfg.logoMarkup ?? ''}
    ${multilineText({
      lines: cfg.lines,
      font: FONTS.sora,
      fontSize: cfg.titleSize,
      x: titleX,
      y: cfg.titleY,
      lineHeight: cfg.lineHeight,
      fill: cfg.titleFill,
      anchor,
    })}
    ${multilineText({
      lines: cfg.bodyLines,
      font: FONTS.manrope,
      fontSize: cfg.bodySize,
      x: bodyX,
      y: cfg.bodyY,
      lineHeight: cfg.bodyLineHeight,
      fill: cfg.bodyFill,
      anchor: cfg.bodyAnchor ?? anchor,
    })}
    ${pillMarkup(cfg.ctaX, cfg.ctaY, cfg.ctaWidth, cfg.ctaHeight, cfg.ctaFill, cfg.ctaLabel, cfg.ctaLabelFill)}
  `);
}

function renderLinkedInSplit(cfg) {
  return layerFromMarkup(cfg.width, cfg.height, `
    ${cfg.kicker ? textPath({
      text: cfg.kicker.toUpperCase(),
      font: FONTS.manrope,
      fontSize: cfg.kickerSize,
      x: cfg.padding,
      y: cfg.padding,
      fill: cfg.kickerFill,
      tracking: cfg.kickerTracking,
      opacity: 0.72,
    }) : ''}
    ${multilineText({
      lines: cfg.lines,
      font: FONTS.sora,
      fontSize: cfg.titleSize,
      x: cfg.padding,
      y: cfg.titleY,
      lineHeight: cfg.lineHeight,
      fill: cfg.titleFill,
    })}
    ${multilineText({
      lines: cfg.bodyLines,
      font: FONTS.manrope,
      fontSize: cfg.bodySize,
      x: cfg.padding,
      y: cfg.bodyY,
      lineHeight: cfg.bodyLineHeight,
      fill: cfg.bodyFill,
    })}
    ${cfg.logoMarkup ?? ''}
    ${cfg.accentPill ? pillMarkup(cfg.accentPill.x, cfg.accentPill.y, cfg.accentPill.width, cfg.accentPill.height, cfg.accentPill.fill, cfg.accentPill.label, cfg.accentPill.labelFill) : ''}
  `);
}

function renderRitualSteps(cfg) {
  const stepWidth = cfg.stepWidth ?? 286;
  const stepGap = cfg.stepGap ?? 18;
  const stepHeight = cfg.stepHeight ?? 250;
  return layerFromMarkup(cfg.width, cfg.height, `
    ${cfg.kicker ? textPath({
      text: cfg.kicker.toUpperCase(),
      font: FONTS.manrope,
      fontSize: cfg.kickerSize,
      x: cfg.padding,
      y: cfg.padding,
      fill: cfg.kickerFill,
      tracking: cfg.kickerTracking,
      opacity: 0.72,
    }) : ''}
    ${multilineText({
      lines: cfg.lines,
      font: FONTS.sora,
      fontSize: cfg.titleSize,
      x: cfg.padding,
      y: cfg.titleY,
      lineHeight: cfg.lineHeight,
      fill: cfg.titleFill,
    })}
    ${cfg.bodyLines ? multilineText({
      lines: cfg.bodyLines,
      font: FONTS.manrope,
      fontSize: cfg.bodySize,
      x: cfg.padding,
      y: cfg.bodyY,
      lineHeight: cfg.bodyLineHeight,
      fill: cfg.bodyFill,
    }) : ''}
    ${cfg.steps.map((step, index) => {
      const x = cfg.padding + (index * (stepWidth + stepGap));
      const y = cfg.stepsY;
      return `
        <rect x="${x}" y="${y}" width="${stepWidth}" height="${stepHeight}" rx="28" fill="${step.fill}" stroke="${step.stroke}" stroke-width="2"/>
        <rect x="${x + 24}" y="${y + 24}" width="56" height="28" rx="14" fill="${step.badgeFill}"/>
        ${textPath({
          text: String(index + 1).padStart(2, '0'),
          font: FONTS.manrope,
          fontSize: 16,
          x: x + 52,
          y: y + 43,
          fill: step.badgeLabelFill,
          anchor: 'center',
          tracking: 2,
        })}
        ${textPath({
          text: step.title,
          font: FONTS.sora,
          fontSize: step.titleSize ?? 34,
          x: x + 24,
          y: y + 112,
          fill: step.titleFill,
        })}
        ${multilineText({
          lines: step.body,
          font: FONTS.manrope,
          fontSize: step.bodySize ?? 19,
          x: x + 24,
          y: y + 156,
          lineHeight: step.lineHeight ?? 28,
          fill: step.bodyFill,
        })}
      `;
    }).join('')}
    ${cfg.logoMarkup ?? ''}
  `);
}

function logoSnippet({ x, y, size, style }) {
  const variants = {
    ember: { tile: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, aura: null },
    lake: { tile: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.lake, aura: null },
    porcelain: { tile: COLORS.sage, shell: 'rgba(21,29,42,.16)', core: COLORS.porcelain, aura: null },
  };
  const token = variants[style];
  return ledGroup({
    x,
    y,
    size,
    tileFill: token.tile,
    shell: token.shell,
    core: token.core,
    aura: token.aura,
  });
}

function lockupMarkup({
  x,
  y,
  style,
  layout = 'horizontal',
  baseline = true,
  markSize = 84,
  gap = 12,
  wordFill,
  baselineFill,
  baselineOpacity = 0.7,
  aura = false,
}) {
  const variants = {
    ember: { tile: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, auraColor: COLORS.ember, word: COLORS.porcelain },
    lake: { tile: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.lake, auraColor: COLORS.lake, word: COLORS.porcelain },
    porcelain: { tile: COLORS.sage, shell: 'rgba(21,29,42,.16)', core: COLORS.porcelain, auraColor: COLORS.porcelain, word: COLORS.ink },
    'porcelain-ember': { tile: COLORS.porcelain, shell: 'rgba(21,29,42,.15)', core: COLORS.ember, auraColor: COLORS.ember, word: COLORS.ink },
  };
  const token = variants[style];
  if (!token) throw new Error(`Unknown lockup style: ${style}`);

  const mark = ledGroup({
    x,
    y,
    size: markSize,
    tileFill: token.tile,
    shell: token.shell,
    core: token.core,
    aura: aura ? token.auraColor : null,
    auraMode: 'full',
    auraOpacity: token.tile === COLORS.ink ? 0.18 : 0.14,
  });

  if (layout === 'horizontal') {
    const titleSize = Math.round(markSize * 0.5);
    const baselineOffset = Math.round(titleSize * 0.56);
    return `
      ${mark}
      ${logoWordmark({
        x: x + markSize + gap,
        y: y + (markSize * 0.55),
        fill: wordFill ?? token.word,
        baselineFill: baselineFill ?? (wordFill ?? token.word),
        baselineOpacity,
        baseline,
        titleSize,
        baselineSize: Math.max(10, Math.round(markSize * 0.15)),
        baselineTracking: Math.max(3, Math.round(markSize * 0.05)),
        baselineOffset,
      })}
    `;
  }

  const centerX = x + (markSize / 2);
  const titleSize = Math.round(markSize * 0.5);
  const titleY = y + markSize + Math.round(titleSize * 0.74) + Math.round(markSize * 0.06);
  const baselineY = titleY + Math.round(titleSize * 0.58);
  return `
    ${mark}
    ${textPath({
      text: 'faraday',
      font: FONTS.soraLight,
      fontSize: titleSize,
      x: centerX,
      y: titleY,
      fill: wordFill ?? token.word,
      anchor: 'center',
    })}
    ${baseline ? textPath({
      text: 'DISCONNECT TO RECONNECT',
      font: FONTS.manropeBold,
      fontSize: Math.max(10, Math.round(markSize * 0.15)),
      x: centerX,
      y: baselineY,
      fill: baselineFill ?? (wordFill ?? token.word),
      anchor: 'center',
      tracking: Math.round(markSize * 0.05),
      opacity: baselineOpacity,
    }) : ''}
  `;
}

function collectStrings(value, bucket = []) {
  if (typeof value === 'string') {
    bucket.push(value);
    return bucket;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, bucket));
    return bucket;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, bucket));
  }
  return bucket;
}

function isColor(value, token) {
  return typeof value === 'string' && value.toLowerCase() === token.toLowerCase();
}

function validateBannerConfig(config) {
  const expectedSizes = {
    'Instagram portrait': [1080, 1350],
    'Instagram square': [1080, 1080],
    'Instagram story': [1080, 1920],
    'LinkedIn feed': [1200, 627],
    'LinkedIn page cover': [1584, 396],
    'LinkedIn personal cover': [1584, 396],
  };

  const expected = expectedSizes[config.platform];
  if (expected && (config.width !== expected[0] || config.height !== expected[1])) {
    throw new Error(`Invalid format for ${config.id}: expected ${expected[0]}x${expected[1]}, received ${config.width}x${config.height}`);
  }

  const usesSageSurface = [config.background, config.mark?.tileFill].some((value) => isColor(value, COLORS.sage));
  const usesEmberCore = isColor(config.mark?.core, COLORS.ember);
  if (usesSageSurface && usesEmberCore) {
    throw new Error(`Forbidden Sage Mist + Ember combination in ${config.id}`);
  }
  if (usesSageSurface && config.animation) {
    throw new Error(`Animated Sage Mist asset forbidden in ${config.id}: LED core would drift away from Porcelain`);
  }

  if (config.mark?.tileFill) {
    const { tileFill, core } = config.mark;
    const isInk = isColor(tileFill, COLORS.ink);
    const isPorcelain = isColor(tileFill, COLORS.porcelain);
    const isSage = isColor(tileFill, COLORS.sage);
    if (isInk && ![COLORS.ember, COLORS.lake].some((token) => isColor(core, token))) {
      throw new Error(`Invalid LED core on Ink tile in ${config.id}`);
    }
    if (isPorcelain && !isColor(core, COLORS.ember)) {
      throw new Error(`Porcelain tile must keep Ember core in ${config.id}`);
    }
    if (isSage && !isColor(core, COLORS.porcelain)) {
      throw new Error(`Sage tile must keep Porcelain core in ${config.id}`);
    }
  }

  const textBlob = collectStrings(config.text).join(' ').toLowerCase();
  const bannedPhrases = [
    'la cage de faraday',
    'le calme n’a pas besoin d’être froid',
    "le calme n'a pas besoin d'être froid",
    'reprends le contrôle de ta vie',
    'la présence n’est pas une option',
    "la présence n'est pas une option",
  ];
  const banned = bannedPhrases.find((phrase) => textBlob.includes(phrase));
  if (banned) {
    throw new Error(`Forbidden copy in ${config.id}: "${banned}"`);
  }
}

async function renderBanner(config, frame = null) {
  const image = sharp({
    create: {
      width: config.width,
      height: config.height,
      channels: 4,
      background: config.background ?? COLORS.porcelain,
    },
  });

  const composites = [];

  if (config.photo) {
    composites.push({ input: await basePhoto(config.photo.file, config.width, config.height, config.photo.position), left: 0, top: 0 });
  }
  if (config.overlayGradient) {
    composites.push({ input: gradientLayer(config.width, config.height, config.overlayGradient.stops, config.overlayGradient.options), left: 0, top: 0 });
  }
  if (config.overlaySolid) {
    composites.push({ input: toBuffer(roundedRectSvg(config.width, config.height, 0, config.overlaySolid.fill, config.overlaySolid.opacity)), left: 0, top: 0 });
  }
  if (config.glow && frame) {
    composites.push({ input: blurGlowLayer(config.width, config.height, config.glow.cx, config.glow.cy, config.glow.radius * frame.glowScale, config.glow.color, config.glow.opacity * frame.glowOpacity), left: 0, top: 0 });
  }
  if (config.card) {
    composites.push({ input: toBuffer(roundedRectSvg(config.card.width, config.card.height, config.card.radius, config.card.fill, config.card.opacity ?? 1, config.card.stroke, config.card.strokeWidth ?? 0)), left: config.card.left, top: config.card.top });
  }

  const ledMarkup = config.mark ? ledGroup({
    x: config.mark.x,
    y: config.mark.y,
    size: config.mark.size,
    tileFill: config.mark.tileFill,
    shell: config.mark.shell,
    core: frame ? frame.core : config.mark.core,
    aura: frame ? frame.aura : config.mark.aura,
    transparentTile: config.mark.transparentTile,
  }) : '';

  if (ledMarkup) {
    composites.push({ input: layerFromMarkup(config.width, config.height, ledMarkup), left: 0, top: 0 });
  }

  const overlayMarkup = config.textRenderer({
    width: config.width,
    height: config.height,
    ...config.text,
    logoMarkup: `${config.text.logoMarkup ?? ''}${config.text.logoExtra ?? ''}`,
  });

  composites.push({ input: overlayMarkup, left: 0, top: 0 });

  return image.composite(composites).png().toBuffer();
}

async function saveStaticBanner(config) {
  validateBannerConfig(config);
  const pngPath = path.join(socialDir, 'static', `${config.id}.png`);
  const webpPath = path.join(socialDir, 'static', `${config.id}.webp`);
  const pngBuffer = await renderBanner(config);
  await fs.writeFile(pngPath, pngBuffer);
  await sharp(pngBuffer).webp({ quality: 92 }).toFile(webpPath);

  manifest.staticBanners.push({
    id: config.id,
    label: config.label,
    platform: config.platform,
    format: `${config.width}x${config.height}`,
    withImage: Boolean(config.photo),
    files: {
      png: rel(pngPath),
      webp: rel(webpPath),
    },
  });
}

function animationFrame(type, index, total) {
  const t = index / total;
  if (type === 'pulse') {
    const v = (Math.sin(t * Math.PI * 2) + 1) / 2;
    return {
      core: COLORS.ember,
      aura: COLORS.ember,
      glowScale: 0.8 + (v * 0.45),
      glowOpacity: 0.12 + (v * 0.2),
    };
  }
  if (type === 'blink') {
    const on = index % 12 < 4 || (index % 12 > 6 && index % 12 < 9);
    return {
      core: on ? COLORS.ember : '#6E4739',
      aura: on ? COLORS.ember : null,
      glowScale: on ? 1.12 : 0.86,
      glowOpacity: on ? 0.26 : 0.02,
    };
  }
  if (type === 'breathe-lake') {
    const v = (Math.sin(t * Math.PI * 2) + 1) / 2;
    return {
      core: COLORS.lake,
      aura: COLORS.lake,
      glowScale: 0.84 + (v * 0.32),
      glowOpacity: 0.08 + (v * 0.14),
    };
  }
  return {
    core: COLORS.ember,
    aura: null,
    glowScale: 1,
    glowOpacity: 0,
  };
}

async function saveAnimatedBanner(config) {
  validateBannerConfig(config);
  const workDir = path.join(tempDir, config.id);
  await ensureDir(workDir);
  const totalFrames = config.frames ?? 36;

  for (let i = 0; i < totalFrames; i += 1) {
    const buffer = await renderBanner(config, animationFrame(config.animation, i, totalFrames));
    await fs.writeFile(path.join(workDir, `frame-${String(i).padStart(3, '0')}.png`), buffer);
  }

  const gifPath = path.join(socialDir, 'animated', `${config.id}.gif`);
  const mp4Path = path.join(socialDir, 'animated', `${config.id}.mp4`);
  const webmPath = path.join(socialDir, 'animated', `${config.id}.webm`);
  const posterPath = path.join(socialDir, 'animated', `${config.id}-poster.png`);

  await fs.copyFile(path.join(workDir, 'frame-000.png'), posterPath);

  spawnSync(ffmpegBinary, [
    '-y',
    '-nostdin',
    '-framerate', String(config.fps ?? 12),
    '-i', path.join(workDir, 'frame-%03d.png'),
    '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
    gifPath,
  ], { stdio: 'ignore' });

  spawnSync(ffmpegBinary, [
    '-y',
    '-nostdin',
    '-framerate', String(config.fps ?? 12),
    '-i', path.join(workDir, 'frame-%03d.png'),
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mp4Path,
  ], { stdio: 'ignore' });

  spawnSync(ffmpegBinary, [
    '-y',
    '-nostdin',
    '-framerate', String(config.fps ?? 12),
    '-i', path.join(workDir, 'frame-%03d.png'),
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-b:v', '0',
    '-crf', '32',
    webmPath,
  ], { stdio: 'ignore' });

  manifest.animatedBanners.push({
    id: config.id,
    label: config.label,
    platform: config.platform,
    format: `${config.width}x${config.height}`,
    animation: config.animation,
    files: {
      gif: rel(gifPath),
      mp4: rel(mp4Path),
      webm: rel(webmPath),
      poster: rel(posterPath),
    },
  });
}

async function generateLogos() {
  const variants = [
    {
      id: 'mark-on-ink-ember',
      label: 'Mark · Ink Charcoal / Ember',
      category: 'Symbol',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      aura: null,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-ink-lake',
      label: 'Mark · Ink Charcoal / Lake',
      category: 'Symbol',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      aura: null,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-porcelain-ember',
      label: 'Mark · Porcelain / Ember',
      category: 'Symbol',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      aura: null,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-sage-porcelain',
      label: 'Mark · Sage Mist / Porcelain',
      category: 'Symbol',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      aura: null,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-ink-ember-halo',
      label: 'Mark · Ink Charcoal / Ember · halo',
      category: 'Halo',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      aura: COLORS.ember,
      auraMode: 'full',
      auraOpacity: 0.18,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-ink-lake-halo',
      label: 'Mark · Ink Charcoal / Lake · halo',
      category: 'Halo',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      aura: COLORS.lake,
      auraMode: 'full',
      auraOpacity: 0.18,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-porcelain-ember-halo',
      label: 'Mark · Porcelain / Ember · halo',
      category: 'Halo',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      aura: COLORS.ember,
      auraMode: 'full',
      auraOpacity: 0.11,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-on-sage-porcelain-halo',
      label: 'Mark · Sage Mist / Porcelain · halo',
      category: 'Halo',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      aura: COLORS.porcelain,
      auraMode: 'full',
      auraOpacity: 0.16,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-gravure-ink',
      label: 'Mark · Gravure mono Ink',
      category: 'Monochrome',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: 'transparent',
      shell: COLORS.ink,
      core: COLORS.ink,
      transparentTile: true,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'mark-gravure-porcelain',
      label: 'Mark · Gravure mono Porcelain',
      category: 'Monochrome',
      layout: 'mark',
      width: 1024,
      height: 1024,
      markSize: 760,
      background: null,
      tileFill: 'transparent',
      shell: COLORS.porcelain,
      core: COLORS.porcelain,
      transparentTile: true,
      rasterSizes: [32, 64, 128, 256, 512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-ink-ember-baseline',
      label: 'Horizontal · Ink Charcoal / Ember · baseline',
      category: 'Wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-ink-lake-baseline',
      label: 'Horizontal · Ink Charcoal / Lake · baseline',
      category: 'Wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-porcelain-ember-baseline',
      label: 'Horizontal · Porcelain / Ember · baseline',
      category: 'Wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.porcelain,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-sage-porcelain-baseline',
      label: 'Horizontal · Sage Mist / Porcelain · baseline',
      category: 'Wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.sage,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.6,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-ink-ember',
      label: 'Horizontal · Ink Charcoal / Ember',
      category: 'Wordmark',
      layout: 'horizontal',
      width: 2200,
      height: 920,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-ink-ember-halo-baseline',
      label: 'Horizontal · Ink Charcoal / Ember · halo · baseline',
      category: 'Halo wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      aura: COLORS.ember,
      auraMode: 'full',
      auraOpacity: 0.18,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-ink-lake-halo-baseline',
      label: 'Horizontal · Ink Charcoal / Lake · halo · baseline',
      category: 'Halo wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      aura: COLORS.lake,
      auraMode: 'full',
      auraOpacity: 0.18,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-porcelain-ember-halo-baseline',
      label: 'Horizontal · Porcelain / Ember · halo · baseline',
      category: 'Halo wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.porcelain,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      aura: COLORS.ember,
      auraMode: 'full',
      auraOpacity: 0.11,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-horizontal-sage-porcelain-halo-baseline',
      label: 'Horizontal · Sage Mist / Porcelain · halo · baseline',
      category: 'Halo wordmark',
      layout: 'horizontal',
      width: 2400,
      height: 1080,
      markSize: 246,
      background: COLORS.sage,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      aura: COLORS.porcelain,
      auraMode: 'full',
      auraOpacity: 0.16,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.6,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-ink-ember-baseline',
      label: 'Stacked · Ink Charcoal / Ember · baseline',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-ink-ember',
      label: 'Stacked · Ink Charcoal / Ember',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-ink-lake-baseline',
      label: 'Stacked · Ink Charcoal / Lake · baseline',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-ink-lake',
      label: 'Stacked · Ink Charcoal / Lake',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-porcelain-ember-baseline',
      label: 'Stacked · Porcelain / Ember · baseline',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.porcelain,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-porcelain-ember',
      label: 'Stacked · Porcelain / Ember',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.porcelain,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-sage-porcelain-baseline',
      label: 'Stacked · Sage Mist / Porcelain · baseline',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.sage,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.6,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-sage-porcelain',
      label: 'Stacked · Sage Mist / Porcelain',
      category: 'Stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.sage,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.6,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-ink-ember-halo-baseline',
      label: 'Stacked · Ink Charcoal / Ember · halo · baseline',
      category: 'Halo stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.ember,
      aura: COLORS.ember,
      auraMode: 'full',
      auraOpacity: 0.18,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-ink-lake-halo-baseline',
      label: 'Stacked · Ink Charcoal / Lake · halo · baseline',
      category: 'Halo stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.ink,
      tileFill: COLORS.ink,
      shell: 'rgba(246,243,236,.22)',
      core: COLORS.lake,
      aura: COLORS.lake,
      auraMode: 'full',
      auraOpacity: 0.18,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-porcelain-ember-halo-baseline',
      label: 'Stacked · Porcelain / Ember · halo · baseline',
      category: 'Halo stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.porcelain,
      tileFill: COLORS.porcelain,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.ember,
      aura: COLORS.ember,
      auraMode: 'full',
      auraOpacity: 0.11,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'logo-stacked-sage-porcelain-halo-baseline',
      label: 'Stacked · Sage Mist / Porcelain · halo · baseline',
      category: 'Halo stacked',
      layout: 'stacked',
      width: 1200,
      height: 900,
      markSize: 220,
      background: COLORS.sage,
      tileFill: COLORS.sage,
      shell: 'rgba(21,29,42,.15)',
      core: COLORS.porcelain,
      aura: COLORS.porcelain,
      auraMode: 'full',
      auraOpacity: 0.16,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.6,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'wordmark-transparent-ink',
      label: 'Wordmark transparent · Ink',
      category: 'Transparent',
      layout: 'wordmark',
      width: 2200,
      height: 780,
      background: null,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'wordmark-transparent-ink-baseline',
      label: 'Wordmark transparent · Ink · baseline',
      category: 'Transparent',
      layout: 'wordmark',
      width: 2200,
      height: 780,
      background: null,
      wordFill: COLORS.ink,
      baselineFill: COLORS.ink,
      baselineOpacity: 0.62,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'wordmark-transparent-porcelain',
      label: 'Wordmark transparent · Porcelain',
      category: 'Transparent',
      layout: 'wordmark',
      width: 2200,
      height: 780,
      background: null,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: false,
      rasterSizes: [512, 1024, 2048],
    },
    {
      id: 'wordmark-transparent-porcelain-baseline',
      label: 'Wordmark transparent · Porcelain · baseline',
      category: 'Transparent',
      layout: 'wordmark',
      width: 2200,
      height: 780,
      background: null,
      wordFill: COLORS.porcelain,
      baselineFill: COLORS.porcelain,
      baselineOpacity: 0.72,
      baseline: true,
      rasterSizes: [512, 1024, 2048],
    },
  ];

  for (const variant of variants) {
    await saveLogoVariant(variant);
  }
}

async function generateStaticBanners() {
  const commonMark = {
    tileFill: COLORS.ink,
    shell: 'rgba(246,243,236,.22)',
    core: COLORS.ember,
    aura: COLORS.ember,
  };

  const configs = [
    {
      id: 'instagram-portrait-quiet-promise',
      label: 'Instagram portrait · quote',
      platform: 'Instagram portrait',
      width: 1080,
      height: 1350,
      background: COLORS.ink,
      textRenderer: renderPhotoOverlay,
      mark: { x: 418, y: 190, size: 244, ...commonMark },
      text: {
        kicker: 'Disconnect to reconnect',
        kickerSize: 18,
        kickerTracking: 5,
        kickerFill: 'rgba(246,243,236,.58)',
        padding: 72,
        lines: ['Promis.', 'Il ne vous', 'manquera pas.'],
        titleSize: 84,
        lineHeight: 98,
        titleFill: COLORS.porcelain,
        bottomOffset: 314,
        bodyLines: ['Votre téléphone s’en remettra très bien.'],
        bodySize: 26,
        bodyLineHeight: 38,
        bodyFill: 'rgba(246,243,236,.76)',
        bodyOffset: 132,
      },
    },
    {
      id: 'instagram-portrait-evening-photo',
      label: 'Instagram portrait · photo',
      platform: 'Instagram portrait',
      width: 1080,
      height: 1350,
      background: COLORS.ink,
      photo: { file: PHOTO.boxCream, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.18 },
          { offset: '55%', color: '#0F1722', opacity: 0.52 },
          { offset: '100%', color: '#0F1722', opacity: 0.88 },
        ],
      },
      textRenderer: renderPhotoOverlay,
      mark: { x: 76, y: 88, size: 96, ...commonMark },
      text: {
        kicker: 'faradaybox',
        kickerSize: 22,
        kickerTracking: 6,
        kickerFill: 'rgba(246,243,236,.65)',
        padding: 76,
        lines: ['Le vrai luxe,', "c'est d'oublier", 'son téléphone.'],
        titleSize: 76,
        lineHeight: 92,
        titleFill: COLORS.porcelain,
        bottomOffset: 320,
        bodyLines: ['Une box, un geste,', 'et la soirée redevient à vous.'],
        bodySize: 26,
        bodyLineHeight: 40,
        bodyFill: 'rgba(246,243,236,.74)',
        bodyOffset: 126,
      },
    },
    {
      id: 'instagram-square-412',
      label: 'Instagram square · stat',
      platform: 'Instagram square',
      width: 1080,
      height: 1080,
      background: COLORS.porcelain,
      textRenderer: renderPhotoOverlay,
      mark: { x: 850, y: 820, size: 112, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember },
      text: {
        kicker: 'Temps moyen',
        kickerSize: 18,
        kickerTracking: 6,
        kickerFill: 'rgba(21,29,42,.45)',
        padding: 84,
        lines: ['4h12', 'par jour.'],
        titleSize: 158,
        lineHeight: 148,
        titleFill: COLORS.ink,
        bottomOffset: 360,
        bodyLines: ['Ça fait beaucoup pour un appareil qui devait nous faire gagner du temps.'],
        bodySize: 24,
        bodyLineHeight: 36,
        bodyFill: COLORS.mutedInk,
        bodyOffset: 132,
      },
    },
    {
      id: 'instagram-square-led-photo',
      label: 'Instagram square · photo',
      platform: 'Instagram square',
      width: 1080,
      height: 1080,
      background: COLORS.ink,
      photo: { file: PHOTO.boxBlack, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.48 },
          { offset: '100%', color: '#0F1722', opacity: 0.82 },
        ],
      },
      textRenderer: renderPhotoOverlay,
      mark: { x: 84, y: 86, size: 88, ...commonMark },
      text: {
        kicker: 'Disconnect to reconnect',
        kickerSize: 18,
        kickerTracking: 5,
        kickerFill: 'rgba(246,243,236,.68)',
        padding: 84,
        lines: ['Le plus dur,', "c'est juste", 'de commencer.'],
        titleSize: 70,
        lineHeight: 84,
        titleFill: COLORS.porcelain,
        bottomOffset: 322,
        bodyLines: ['Une impulsion simple.', 'Un vrai moment retrouvé.'],
        bodySize: 24,
        bodyLineHeight: 38,
        bodyFill: 'rgba(246,243,236,.75)',
        bodyOffset: 120,
      },
    },
    {
      id: 'instagram-story-disconnect',
      label: 'Instagram story · typographic',
      platform: 'Instagram story',
      width: 1080,
      height: 1920,
      background: COLORS.ink,
      glow: { cx: 540, cy: 560, radius: 160, color: COLORS.ember, opacity: 0.18 },
      textRenderer: renderPhotoOverlay,
      mark: { x: 390, y: 330, size: 300, ...commonMark, aura: COLORS.ember },
      text: {
        kicker: 'Disconnect to reconnect',
        kickerSize: 18,
        kickerTracking: 6,
        kickerFill: 'rgba(246,243,236,.58)',
        padding: 82,
        lines: ['Votre téléphone', 'mérite une', 'pause.'],
        titleSize: 98,
        lineHeight: 112,
        titleFill: COLORS.porcelain,
        bottomOffset: 520,
        bodyLines: ['Une bonne soirée commence parfois', 'par un téléphone posé.'],
        bodySize: 34,
        bodyLineHeight: 48,
        bodyFill: 'rgba(246,243,236,.78)',
        bodyOffset: 188,
      },
    },
    {
      id: 'instagram-story-living-room',
      label: 'Instagram story · photo',
      platform: 'Instagram story',
      width: 1080,
      height: 1920,
      background: COLORS.ink,
      photo: { file: PHOTO.boxBlack, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.26 },
          { offset: '52%', color: '#0F1722', opacity: 0.4 },
          { offset: '100%', color: '#0F1722', opacity: 0.9 },
        ],
      },
      textRenderer: renderStoryCta,
      mark: { x: 74, y: 110, size: 90, ...commonMark },
      text: {
        anchor: 'left',
        titleX: 74,
        lines: ['Une boîte,', 'un geste,', 'plus de présence.'],
        titleSize: 78,
        lineHeight: 96,
        titleFill: COLORS.porcelain,
        titleY: 1120,
        bodyLines: ['Vos notifications survivront.', 'Votre dîner aussi.'],
        bodySize: 34,
        bodyLineHeight: 48,
        bodyFill: 'rgba(246,243,236,.8)',
        bodyX: 74,
        bodyY: 1410,
        ctaX: 74,
        ctaY: 1650,
        ctaWidth: 364,
        ctaHeight: 80,
        ctaFill: COLORS.ember,
        ctaLabel: 'faraday-box.fr',
        ctaLabelFill: COLORS.ink,
      },
    },
    {
      id: 'linkedin-feed-presence',
      label: 'LinkedIn feed · typographic',
      platform: 'LinkedIn feed',
      width: 1200,
      height: 627,
      background: COLORS.porcelain,
      card: {
        left: 740,
        top: 68,
        width: 362,
        height: 470,
        radius: 30,
        fill: COLORS.ink,
      },
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 760,
          y: 102,
          style: 'ember',
          layout: 'horizontal',
          baseline: true,
          markSize: 54,
          gap: 12,
          baselineOpacity: 0.72,
        }),
        kicker: 'Typographic asset',
        kickerSize: 18,
        kickerTracking: 4,
        kickerFill: 'rgba(21,29,42,.5)',
        padding: 74,
        lines: ['Le vrai luxe,', "c'est de ne pas", 'être joignable.'],
        titleSize: 60,
        lineHeight: 72,
        titleFill: COLORS.ink,
        titleY: 182,
        bodyLines: ['Faraday transforme un réflexe digital', 'en geste quotidien beaucoup plus désirable.'],
        bodySize: 23,
        bodyLineHeight: 36,
        bodyFill: COLORS.mutedInk,
        bodyY: 430,
        accentPill: { x: 74, y: 516, width: 188, height: 40, fill: COLORS.lake, label: 'linkedin feed', labelFill: COLORS.porcelain },
      },
    },
    {
      id: 'linkedin-feed-led-photo',
      label: 'LinkedIn feed · photo',
      platform: 'LinkedIn feed',
      width: 1200,
      height: 627,
      background: COLORS.ink,
      photo: { file: PHOTO.boxCream, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.18 },
          { offset: '56%', color: '#0F1722', opacity: 0.42 },
          { offset: '100%', color: '#0F1722', opacity: 0.82 },
        ],
      },
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 852,
          y: 96,
          style: 'ember',
          layout: 'horizontal',
          baseline: true,
          markSize: 50,
          gap: 12,
          baselineOpacity: 0.72,
        }),
        kicker: 'LinkedIn cover',
        kickerSize: 17,
        kickerTracking: 4,
        kickerFill: 'rgba(246,243,236,.56)',
        padding: 74,
        lines: ['Votre téléphone', 'ne vous manquera', 'pas. Promis.'],
        titleSize: 62,
        lineHeight: 78,
        titleFill: COLORS.porcelain,
        titleY: 190,
        bodyLines: ['Moins de réflexes, plus de matière, plus de soirées,', 'plus de vrai temps.'],
        bodySize: 24,
        bodyLineHeight: 36,
        bodyFill: 'rgba(246,243,236,.76)',
        bodyY: 472,
      },
    },
    {
      id: 'linkedin-page-cover-minimal',
      label: 'LinkedIn page cover · minimal',
      platform: 'LinkedIn page cover',
      width: 1584,
      height: 396,
      background: COLORS.ink,
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 1182,
          y: 74,
          style: 'lake',
          layout: 'horizontal',
          baseline: true,
          markSize: 50,
          gap: 12,
          baselineOpacity: 0.72,
        }),
        kicker: 'Disconnect to reconnect',
        kickerSize: 15,
        kickerTracking: 5,
        kickerFill: 'rgba(246,243,236,.54)',
        padding: 78,
        lines: ['Votre téléphone', 'ne vous manquera', 'pas. Promis.'],
        titleSize: 48,
        lineHeight: 58,
        titleFill: COLORS.porcelain,
        titleY: 156,
        bodyLines: ['Une phrase simple, une présence nette, un objet que l’on comprend immédiatement.'],
        bodySize: 20,
        bodyLineHeight: 34,
        bodyFill: 'rgba(246,243,236,.72)',
        bodyY: 314,
        accentPill: { x: 78, y: 316, width: 168, height: 40, fill: 'rgba(246,243,236,.08)', label: 'page cover', labelFill: COLORS.porcelain },
      },
    },
    {
      id: 'linkedin-page-cover-photo',
      label: 'LinkedIn page cover · photo',
      platform: 'LinkedIn page cover',
      width: 1584,
      height: 396,
      background: COLORS.ink,
      photo: { file: PHOTO.boxBlack, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.54 },
          { offset: '60%', color: '#0F1722', opacity: 0.68 },
          { offset: '100%', color: '#0F1722', opacity: 0.82 },
        ],
      },
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 1242,
          y: 248,
          style: 'ember',
          layout: 'horizontal',
          baseline: true,
          markSize: 48,
          gap: 12,
          baselineOpacity: 0.72,
        }),
        kicker: 'faradaybox',
        kickerSize: 15,
        kickerTracking: 5,
        kickerFill: 'rgba(246,243,236,.56)',
        padding: 78,
        lines: ['Le plus dur,', "c'est juste de", 'commencer.'],
        titleSize: 56,
        lineHeight: 66,
        titleFill: COLORS.porcelain,
        titleY: 176,
        bodyLines: ['Une impulsion simple. Un vrai temps retrouvé.'],
        bodySize: 22,
        bodyLineHeight: 34,
        bodyFill: 'rgba(246,243,236,.76)',
        bodyY: 330,
      },
    },
    {
      id: 'linkedin-personal-cover-editorial',
      label: 'LinkedIn personal cover · editorial',
      platform: 'LinkedIn personal cover',
      width: 1584,
      height: 396,
      background: COLORS.sage,
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 1212,
          y: 246,
          style: 'porcelain',
          layout: 'horizontal',
          baseline: true,
          markSize: 48,
          gap: 12,
          baselineOpacity: 0.6,
        }),
        kicker: 'Founder point of view',
        kickerSize: 15,
        kickerTracking: 5,
        kickerFill: 'rgba(21,29,42,.48)',
        padding: 78,
        lines: ['Le vrai luxe,', "c'est de ne pas", 'être joignable.'],
        titleSize: 46,
        lineHeight: 56,
        titleFill: COLORS.ink,
        titleY: 140,
        bodyLines: ['Une marque qui retire du bruit.', 'Pas de la valeur.'],
        bodySize: 22,
        bodyLineHeight: 34,
        bodyFill: COLORS.mutedInk,
        bodyY: 318,
      },
    },
    {
      id: 'linkedin-personal-cover-photo',
      label: 'LinkedIn personal cover · photo',
      platform: 'LinkedIn personal cover',
      width: 1584,
      height: 396,
      background: COLORS.ink,
      photo: { file: PHOTO.boxCream, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.54 },
          { offset: '100%', color: '#0F1722', opacity: 0.9 },
        ],
      },
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 1238,
          y: 246,
          style: 'ember',
          layout: 'horizontal',
          baseline: true,
          markSize: 48,
          gap: 12,
          baselineOpacity: 0.72,
        }),
        kicker: 'Disconnect to reconnect',
        kickerSize: 15,
        kickerTracking: 5,
        kickerFill: 'rgba(246,243,236,.58)',
        padding: 78,
        lines: ['Personne n’a jamais', 'regretté une soirée', 'sans téléphone.'],
        titleSize: 50,
        lineHeight: 62,
        titleFill: COLORS.porcelain,
        titleY: 156,
        bodyLines: ['Le plus dur, c’est juste de commencer.'],
        bodySize: 22,
        bodyLineHeight: 34,
        bodyFill: 'rgba(246,243,236,.78)',
        bodyY: 338,
      },
    },
    {
      id: 'instagram-square-luxury-quote',
      label: 'Instagram square · luxury quote',
      platform: 'Instagram square',
      width: 1080,
      height: 1080,
      background: COLORS.ink,
      textRenderer: renderQuoteCenter,
      mark: { x: 84, y: 84, size: 88, ...commonMark },
      text: {
        overline: 'Faraday quote card',
        overlineFill: 'rgba(246,243,236,.6)',
        smallSize: 20,
        smallTracking: 5,
        top: 120,
        overlineX: 84,
        overlineAnchor: 'left',
        textX: 84,
        anchor: 'left',
        offsetY: 316,
        lines: ['Le vrai luxe,', "c'est de ne pas", 'être joignable.'],
        titleSize: 78,
        lineHeight: 92,
        titleFill: COLORS.porcelain,
        divider: 120,
        dividerY: 636,
        dividerHeight: 8,
        accent: COLORS.ember,
        subLines: ['Disconnect to reconnect'],
        subSize: 22,
        subX: 84,
        subAnchor: 'left',
        subY: 704,
        subLineHeight: 30,
        subFill: 'rgba(246,243,236,.72)',
      },
    },
    {
      id: 'instagram-square-ritual-steps',
      label: 'Instagram square · ritual steps',
      platform: 'Instagram square',
      width: 1080,
      height: 1080,
      background: COLORS.porcelain,
      textRenderer: renderRitualSteps,
      mark: { x: 902, y: 86, size: 92, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember },
      text: {
        kicker: 'Rituel Faraday',
        kickerSize: 18,
        kickerTracking: 6,
        kickerFill: 'rgba(21,29,42,.48)',
        padding: 84,
        lines: ['Le rituel', 'qui rend', 'du temps.'],
        titleSize: 74,
        lineHeight: 82,
        titleFill: COLORS.ink,
        titleY: 192,
        bodyLines: ['Trois gestes, aucun sermon.', 'Juste un meilleur réflexe quotidien.'],
        bodySize: 22,
        bodyLineHeight: 34,
        bodyFill: COLORS.mutedInk,
        bodyY: 388,
        stepsY: 530,
        stepWidth: 286,
        stepGap: 18,
        stepHeight: 300,
        steps: [
          {
            fill: COLORS.ink,
            stroke: 'rgba(21,29,42,.08)',
            badgeFill: COLORS.ember,
            badgeLabelFill: COLORS.ink,
            title: 'Posez',
            titleFill: COLORS.porcelain,
            body: ['Déposez votre', 'téléphone', 'dans la box.'],
            bodyFill: 'rgba(246,243,236,.76)',
          },
          {
            fill: '#FFFFFF',
            stroke: 'rgba(21,29,42,.08)',
            badgeFill: COLORS.ink,
            badgeLabelFill: COLORS.porcelain,
            title: 'Vivez',
            titleFill: COLORS.ink,
            body: ['La session', 'commence.', 'Le temps vous appartient.'],
            bodyFill: COLORS.mutedInk,
          },
          {
            fill: COLORS.sage,
            stroke: 'rgba(21,29,42,.06)',
            badgeFill: COLORS.porcelain,
            badgeLabelFill: COLORS.ink,
            title: 'Retrouvez',
            titleFill: COLORS.ink,
            body: ['Chaque minute', 'compte.', 'Recevez votre récap.'],
            bodyFill: 'rgba(21,29,42,.76)',
          },
        ],
      },
    },
    {
      id: 'instagram-portrait-time-back',
      label: 'Instagram portrait · hero statement',
      platform: 'Instagram portrait',
      width: 1080,
      height: 1350,
      background: COLORS.ink,
      textRenderer: renderPhotoOverlay,
      mark: { x: 86, y: 84, size: 96, ...commonMark },
      text: {
        kicker: 'Hero website',
        kickerSize: 20,
        kickerTracking: 6,
        kickerFill: 'rgba(246,243,236,.58)',
        padding: 86,
        lines: ['Posez votre', 'téléphone.', 'Retrouvez votre', 'temps.'],
        titleSize: 76,
        lineHeight: 88,
        titleFill: COLORS.porcelain,
        bottomOffset: 470,
        bodyLines: ['Ligne déjà présente sur le site.', 'Très forte pour paid et organique.'],
        bodySize: 24,
        bodyLineHeight: 38,
        bodyFill: 'rgba(246,243,236,.76)',
        bodyOffset: 164,
      },
    },
    {
      id: 'instagram-story-notifications-photo',
      label: 'Instagram story · notifications',
      platform: 'Instagram story',
      width: 1080,
      height: 1920,
      background: COLORS.ink,
      photo: { file: PHOTO.boxBlack, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.42 },
          { offset: '55%', color: '#0F1722', opacity: 0.58 },
          { offset: '100%', color: '#0F1722', opacity: 0.92 },
        ],
      },
      textRenderer: renderStoryCta,
      mark: { x: 78, y: 114, size: 92, ...commonMark },
      text: {
        logoMarkup: `
          <rect x="734" y="196" width="232" height="74" rx="24" fill="rgba(246,243,236,.12)"/>
          <rect x="734" y="288" width="272" height="74" rx="24" fill="rgba(246,243,236,.09)"/>
          <rect x="734" y="380" width="214" height="74" rx="24" fill="rgba(246,243,236,.06)"/>
        `,
        anchor: 'left',
        titleX: 82,
        lines: ['Vos notifications', 'survivront.'],
        titleSize: 90,
        lineHeight: 102,
        titleFill: COLORS.porcelain,
        titleY: 1130,
        bodyLines: ['Votre dîner mérite mieux.', 'Et votre cerveau aussi.'],
        bodySize: 34,
        bodyLineHeight: 48,
        bodyFill: 'rgba(246,243,236,.8)',
        bodyX: 82,
        bodyY: 1418,
        ctaX: 82,
        ctaY: 1650,
        ctaWidth: 364,
        ctaHeight: 82,
        ctaFill: COLORS.ember,
        ctaLabel: 'faraday-box.fr',
        ctaLabelFill: COLORS.ink,
      },
    },
    {
      id: 'linkedin-feed-ritual-platform',
      label: 'LinkedIn feed · ritual platform',
      platform: 'LinkedIn feed',
      width: 1200,
      height: 627,
      background: COLORS.porcelain,
      card: {
        left: 720,
        top: 82,
        width: 380,
        height: 456,
        radius: 30,
        fill: '#ECE7DF',
      },
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 790,
          y: 108,
          style: 'porcelain-ember',
          layout: 'horizontal',
          baseline: true,
          markSize: 64,
          gap: 14,
          baselineOpacity: 0.62,
        }),
        kicker: 'Positionnement',
        kickerSize: 18,
        kickerTracking: 4,
        kickerFill: 'rgba(21,29,42,.5)',
        padding: 74,
        lines: ['Faraday transforme', 'la déconnexion', 'volontaire en rituel.'],
        titleSize: 58,
        lineHeight: 72,
        titleFill: COLORS.ink,
        titleY: 180,
        bodyLines: ['Un objet. Une lumière. Une app.', 'Et surtout un geste simple qui remet la présence au centre.'],
        bodySize: 23,
        bodyLineHeight: 34,
        bodyFill: COLORS.mutedInk,
        bodyY: 430,
        accentPill: { x: 832, y: 398, width: 204, height: 44, fill: COLORS.ink, label: 'brand platform', labelFill: COLORS.porcelain },
      },
    },
    {
      id: 'linkedin-feed-stat-editorial',
      label: 'LinkedIn feed · editorial stat',
      platform: 'LinkedIn feed',
      width: 1200,
      height: 627,
      background: COLORS.ink,
      textRenderer: renderLinkedInSplit,
      text: {
        logoMarkup: lockupMarkup({
          x: 858,
          y: 88,
          style: 'lake',
          layout: 'horizontal',
          baseline: true,
          markSize: 54,
          gap: 12,
          baselineOpacity: 0.72,
        }),
        kicker: 'Temps retrouvé',
        kickerSize: 18,
        kickerTracking: 5,
        kickerFill: 'rgba(246,243,236,.56)',
        padding: 74,
        lines: ['4h12 par jour.', '63 jours par an.'],
        titleSize: 70,
        lineHeight: 84,
        titleFill: COLORS.porcelain,
        titleY: 214,
        bodyLines: ['Une stat simple, un angle fort, un visuel lisible.', 'Parfait pour LinkedIn feed et social paid.'],
        bodySize: 23,
        bodyLineHeight: 34,
        bodyFill: 'rgba(246,243,236,.76)',
        bodyY: 458,
        accentPill: { x: 74, y: 516, width: 174, height: 40, fill: 'rgba(246,243,236,.08)', label: 'editorial stat', labelFill: COLORS.porcelain },
      },
    },
  ];

  for (const config of configs) {
    await saveStaticBanner(config);
  }
}

async function generateAnimatedBanners() {
  const configs = [
    {
      id: 'instagram-story-led-pulse',
      label: 'Instagram story · LED pulse',
      platform: 'Instagram story',
      width: 1080,
      height: 1920,
      background: COLORS.ink,
      glow: { cx: 540, cy: 568, radius: 180, color: COLORS.ember, opacity: 0.18 },
      animation: 'pulse',
      fps: 12,
      frames: 40,
      textRenderer: renderStoryCta,
      mark: { x: 390, y: 330, size: 300, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, aura: COLORS.ember },
      text: {
        anchor: 'left',
        titleX: 82,
        lines: ['Vos notifications', 'survivront.'],
        titleSize: 100,
        lineHeight: 108,
        titleFill: COLORS.porcelain,
        titleY: 1040,
        bodyLines: ['Votre téléphone peut attendre.', 'Votre soirée non.'],
        bodySize: 34,
        bodyLineHeight: 48,
        bodyFill: 'rgba(246,243,236,.78)',
        bodyX: 82,
        bodyY: 1328,
        ctaX: 82,
        ctaY: 1552,
        ctaWidth: 330,
        ctaHeight: 82,
        ctaFill: COLORS.porcelain,
        ctaLabel: 'faradaybox',
        ctaLabelFill: COLORS.ink,
      },
    },
    {
      id: 'instagram-square-led-blink',
      label: 'Instagram square · double blink',
      platform: 'Instagram square',
      width: 1080,
      height: 1080,
      background: COLORS.ink,
      glow: { cx: 540, cy: 338, radius: 120, color: COLORS.ember, opacity: 0.12 },
      animation: 'blink',
      fps: 12,
      frames: 36,
      textRenderer: renderQuoteCenter,
      mark: { x: 420, y: 180, size: 240, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, aura: COLORS.ember },
      text: {
        overline: 'Signal vivant',
        overlineFill: 'rgba(246,243,236,.62)',
        smallSize: 22,
        smallTracking: 6,
        top: 126,
        overlineX: 84,
        overlineAnchor: 'left',
        textX: 84,
        anchor: 'left',
        offsetY: 468,
        lines: ['Vos notifications', 'survivront.'],
        titleSize: 80,
        lineHeight: 96,
        titleFill: COLORS.porcelain,
        divider: 110,
        dividerY: 710,
        dividerHeight: 8,
        accent: COLORS.ember,
        subLines: ['Faraday • social loop'],
        subSize: 22,
        subX: 84,
        subAnchor: 'left',
        subY: 760,
        subLineHeight: 30,
        subFill: 'rgba(246,243,236,.72)',
      },
    },
    {
      id: 'instagram-portrait-led-breathe-photo',
      label: 'Instagram portrait · breathe photo',
      platform: 'Instagram portrait',
      width: 1080,
      height: 1350,
      background: COLORS.ink,
      photo: { file: PHOTO.boxBlack, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.22 },
          { offset: '100%', color: '#0F1722', opacity: 0.82 },
        ],
      },
      glow: { cx: 178, cy: 176, radius: 70, color: COLORS.ember, opacity: 0.16 },
      animation: 'pulse',
      fps: 12,
      frames: 36,
      textRenderer: renderPhotoOverlay,
      mark: { x: 86, y: 84, size: 96, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, aura: COLORS.ember },
      text: {
        kicker: 'faradaybox',
        kickerSize: 20,
        kickerTracking: 6,
        kickerFill: 'rgba(246,243,236,.6)',
        padding: 86,
        anchor: 'left',
        textX: 86,
        lines: ['Vos notifications', 'survivront.'],
        titleSize: 82,
        lineHeight: 100,
        titleFill: COLORS.porcelain,
        bottomOffset: 320,
        bodyLines: ['Votre soirée aussi, mais en mieux.'],
        bodySize: 28,
        bodyLineHeight: 42,
        bodyFill: 'rgba(246,243,236,.78)',
        bodyOffset: 134,
      },
    },
    {
      id: 'linkedin-feed-lake-breathe',
      label: 'LinkedIn feed · lake breathe',
      platform: 'LinkedIn feed',
      width: 1200,
      height: 627,
      background: COLORS.ink,
      glow: { cx: 936, cy: 198, radius: 92, color: COLORS.lake, opacity: 0.14 },
      animation: 'breathe-lake',
      fps: 12,
      frames: 40,
      textRenderer: renderLinkedInSplit,
      mark: { x: 856, y: 118, size: 160, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.lake, aura: COLORS.lake },
      text: {
        kicker: 'LinkedIn motion asset',
        kickerSize: 18,
        kickerTracking: 4,
        kickerFill: 'rgba(246,243,236,.5)',
        padding: 78,
        lines: ['Une présence visible,', 'une tech silencieuse.'],
        titleSize: 58,
        lineHeight: 72,
        titleFill: COLORS.porcelain,
        titleY: 178,
        bodyLines: ['Le système lumineux sert le rituel.', 'Pas l’inverse.'],
        bodySize: 22,
        bodyLineHeight: 34,
        bodyFill: 'rgba(246,243,236,.72)',
        bodyY: 438,
        accentPill: { x: 832, y: 406, width: 206, height: 44, fill: 'rgba(246,243,236,.08)', label: 'motion loop', labelFill: COLORS.porcelain },
      },
    },
    {
      id: 'instagram-story-notifications-pulse',
      label: 'Instagram story · notifications pulse',
      platform: 'Instagram story',
      width: 1080,
      height: 1920,
      background: COLORS.ink,
      photo: { file: PHOTO.boxCream, position: 'attention' },
      overlayGradient: {
        stops: [
          { offset: '0%', color: '#0F1722', opacity: 0.48 },
          { offset: '100%', color: '#0F1722', opacity: 0.9 },
        ],
      },
      glow: { cx: 124, cy: 160, radius: 72, color: COLORS.ember, opacity: 0.16 },
      animation: 'pulse',
      fps: 12,
      frames: 36,
      textRenderer: renderStoryCta,
      mark: { x: 78, y: 108, size: 92, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, aura: COLORS.ember },
      text: {
        logoMarkup: `
          <rect x="720" y="212" width="252" height="76" rx="24" fill="rgba(246,243,236,.12)"/>
          <rect x="740" y="308" width="212" height="76" rx="24" fill="rgba(246,243,236,.08)"/>
          <rect x="760" y="404" width="172" height="76" rx="24" fill="rgba(246,243,236,.05)"/>
        `,
        anchor: 'left',
        titleX: 82,
        lines: ['Vos notifications', 'survivront.'],
        titleSize: 92,
        lineHeight: 104,
        titleFill: COLORS.porcelain,
        titleY: 1100,
        bodyLines: ['Le plus dur, c’est juste de commencer.', 'Le reste est étonnamment agréable.'],
        bodySize: 34,
        bodyLineHeight: 48,
        bodyFill: 'rgba(246,243,236,.8)',
        bodyX: 82,
        bodyY: 1410,
        ctaX: 82,
        ctaY: 1652,
        ctaWidth: 334,
        ctaHeight: 82,
        ctaFill: COLORS.porcelain,
        ctaLabel: 'faradaybox',
        ctaLabelFill: COLORS.ink,
      },
    },
    {
      id: 'linkedin-feed-promise-pulse',
      label: 'LinkedIn feed · promise pulse',
      platform: 'LinkedIn feed',
      width: 1200,
      height: 627,
      background: COLORS.ink,
      glow: { cx: 948, cy: 200, radius: 92, color: COLORS.ember, opacity: 0.14 },
      animation: 'pulse',
      fps: 12,
      frames: 40,
      textRenderer: renderLinkedInSplit,
      mark: { x: 868, y: 120, size: 156, tileFill: COLORS.ink, shell: 'rgba(246,243,236,.22)', core: COLORS.ember, aura: COLORS.ember },
      text: {
        kicker: 'Social motion asset',
        kickerSize: 18,
        kickerTracking: 4,
        kickerFill: 'rgba(246,243,236,.5)',
        padding: 78,
        lines: ['Votre téléphone', 'ne vous manquera', 'pas. Promis.'],
        titleSize: 60,
        lineHeight: 72,
        titleFill: COLORS.porcelain,
        titleY: 178,
        bodyLines: ['Une promesse claire, un mouvement discret,', 'une signature immédiatement reconnaissable.'],
        bodySize: 22,
        bodyLineHeight: 34,
        bodyFill: 'rgba(246,243,236,.72)',
        bodyY: 438,
        accentPill: { x: 832, y: 406, width: 226, height: 44, fill: 'rgba(246,243,236,.08)', label: 'promise motion', labelFill: COLORS.porcelain },
      },
    },
  ];

  for (const config of configs) {
    await saveAnimatedBanner(config);
  }
}

async function buildZip() {
  const zipPath = path.join(exportsDir, 'faraday-assets.zip');
  const motionZipPath = path.join(exportsDir, 'faraday-motion-assets.zip');
  try { await fs.unlink(zipPath); } catch {}
  try { await fs.unlink(motionZipPath); } catch {}
  spawnSync('zip', [
    '-rq',
    zipPath,
    'logos',
    'social',
    'manifest.json',
  ], {
    cwd: exportsDir,
    stdio: 'ignore',
  });
  spawnSync('zip', [
    '-rq',
    motionZipPath,
    'social/animated',
  ], {
    cwd: exportsDir,
    stdio: 'ignore',
  });
}

async function writeManifest() {
  await fs.writeFile(path.join(exportsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

async function cleanAndPrepare() {
  await ensureDir(path.join(logosDir, 'svg'));
  await ensureDir(path.join(logosDir, 'png'));
  await ensureDir(path.join(logosDir, 'webp'));
  await ensureDir(path.join(socialDir, 'static'));
  await ensureDir(path.join(socialDir, 'animated'));
  await ensureDir(tempDir);
}

async function main() {
  await cleanAndPrepare();
  await generateLogos();
  await generateStaticBanners();
  await generateAnimatedBanners();
  await writeManifest();
  await buildZip();
  console.log('Generated brand assets into', exportsDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

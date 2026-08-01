export const DOLL_WORD_MOBILE_BREAKPOINT = 720;

export interface DollWordLimits {
  activePhrases: number;
  glyphs: number;
}

export interface GlyphLayout {
  grapheme: string;
  height: number;
  isWhitespace: boolean;
  line: number;
  sourceIndex: number;
  width: number;
  x: number;
  y: number;
}

export interface GlyphPlan extends GlyphLayout {
  angularVelocity: [number, number, number];
  impulse: [number, number, number];
  releaseAfterMs: number | null;
  showAfterMs: number;
}

export interface BurstPlan {
  anchorIndex: number;
  fontIndex: number;
  fontSize: number;
  glyphs: GlyphPlan[];
  holdMs: number;
  mode: 'motion' | 'reduced';
  releaseIntervalMs: number;
  releaseOrder: number[];
  seed: number;
  spawn: [number, number, number];
  tilt: [number, number, number];
  typingIntervalMs: number;
}

export interface BurstPlanOptions {
  anchorCount: number;
  fontCount: number;
  mobile: boolean;
  reducedMotion?: boolean;
}

export interface TimelineGlyph {
  clearingStartedAt: number | null;
  id: string;
  releaseAt: number | null;
  showAt: number;
  stage: 'hidden' | 'held' | 'dynamic' | 'clearing';
}

const segmenter =
  typeof Intl.Segmenter === 'undefined'
    ? null
    : new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });

const emojiPattern = /\p{Extended_Pictographic}/u;
const narrowPattern = /[\u0021-\u007e]/u;

export function segmentGraphemes(value: string) {
  if (segmenter === null) return Array.from(value);
  return Array.from(segmenter.segment(value), (part) => part.segment);
}

export function hashDollWordSeed(id: number, phrase: string) {
  let hash = 0x811c9dc5;
  const input = `${String(id)}:${phrase}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function shuffledIndices(length: number, random: () => number) {
  const indices = Array.from({ length }, (_, index) => index);
  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = indices[index];
    const swap = indices[swapIndex];
    if (current === undefined || swap === undefined) continue;
    indices[index] = swap;
    indices[swapIndex] = current;
  }
  return indices;
}

function glyphAdvance(grapheme: string, fontSize: number) {
  if (/^\s+$/u.test(grapheme)) return fontSize * 0.38;
  if (emojiPattern.test(grapheme)) return fontSize * 1.12;
  if (narrowPattern.test(grapheme)) {
    if (/[ilI1.,'`:;|!]/u.test(grapheme)) return fontSize * 0.34;
    if (/[mwMW@#%&]/u.test(grapheme)) return fontSize * 0.82;
    return fontSize * 0.62;
  }
  return fontSize;
}

export function layoutGraphemes(
  graphemes: string[],
  {
    fontSize,
    lineHeight = fontSize * 1.2,
    maxWidth,
  }: {
    fontSize: number;
    lineHeight?: number;
    maxWidth: number;
  },
) {
  const lines: Omit<GlyphLayout, 'line' | 'x' | 'y'>[][] = [[]];
  let lineWidth = 0;

  graphemes.forEach((grapheme, sourceIndex) => {
    if (grapheme === '\n' || grapheme === '\r\n') {
      lines.push([]);
      lineWidth = 0;
      return;
    }

    const width = glyphAdvance(grapheme, fontSize);
    let line = lines.at(-1);
    if (line === undefined) return;
    if (line.length > 0 && lineWidth + width > maxWidth) {
      line = [];
      lines.push(line);
      lineWidth = 0;
    }
    line.push({
      grapheme,
      height: fontSize,
      isWhitespace: /^\s+$/u.test(grapheme),
      sourceIndex,
      width,
    });
    lineWidth += width;
  });

  const totalHeight = Math.max(0, lines.length - 1) * lineHeight;
  return lines.flatMap((line, lineIndex) => {
    const width = line.reduce((sum, glyph) => sum + glyph.width, 0);
    let cursor = -width / 2;
    return line.map((glyph) => {
      const x = cursor + glyph.width / 2;
      cursor += glyph.width;
      return {
        ...glyph,
        line: lineIndex,
        x,
        y: totalHeight / 2 - lineIndex * lineHeight,
      };
    });
  });
}

export function createBurstPlan(
  id: number,
  phrase: string,
  { anchorCount, fontCount, mobile, reducedMotion = false }: BurstPlanOptions,
): BurstPlan {
  const seed = hashDollWordSeed(id, phrase);
  const random = createSeededRandom(seed);
  const fontSize = (mobile ? 0.68 : 0.86) + random() * (mobile ? 0.18 : 0.26);
  const graphemes = segmentGraphemes(phrase);
  const graphemeCount = graphemes.length;
  const baseTypingIntervalMs = 65 + Math.floor(random() * 31);
  // 长句压缩打字间隔，目标 2s 内完成打字；短句保持原节奏
  const typingIntervalMs = Math.min(
    baseTypingIntervalMs,
    Math.floor(2_000 / Math.max(1, graphemeCount)),
  );
  const holdMs = 470 + Math.floor(random() * 61);
  const baseReleaseIntervalMs = 72 + Math.floor(random() * 48);
  const layout = layoutGraphemes(graphemes, {
    fontSize,
    maxWidth: mobile ? 3.35 : 5.1,
  });
  const physicalLayoutIndices = layout
    .map((glyph, index) => (glyph.isWhitespace ? -1 : index))
    .filter((index) => index >= 0);
  const visibleCount = physicalLayoutIndices.length;
  // 长句压缩掉落间隔，目标 0.7s 内全部开始掉落；短句保持原节奏
  const releaseIntervalMs = Math.min(
    baseReleaseIntervalMs,
    Math.floor(700 / Math.max(1, visibleCount - 1)),
  );
  // 从头到尾顺序掉落，不再随机
  const releaseOrder = [...physicalLayoutIndices];
  const releaseRank = new Map(releaseOrder.map((layoutIndex, rank) => [layoutIndex, rank]));
  const typingEnd = graphemeCount * typingIntervalMs;

  return {
    anchorIndex: Math.floor(random() * Math.max(1, anchorCount)),
    fontIndex: Math.floor(random() * Math.max(1, fontCount)),
    fontSize,
    glyphs: layout.map((glyph, layoutIndex) => {
      const rank = releaseRank.get(layoutIndex);
      return {
        ...glyph,
        angularVelocity: [(random() - 0.5) * 12, (random() - 0.5) * 10, (random() - 0.5) * 15],
        impulse: [(random() - 0.5) * 3, -4 - random() * 3, (random() - 0.5) * 2],
        releaseAfterMs:
          reducedMotion || rank === undefined
            ? null
            : typingEnd + holdMs + rank * releaseIntervalMs,
        showAfterMs: reducedMotion ? 0 : glyph.sourceIndex * typingIntervalMs,
      };
    }),
    holdMs,
    mode: reducedMotion ? 'reduced' : 'motion',
    releaseIntervalMs,
    releaseOrder,
    seed,
    spawn: [random(), random(), random()],
    tilt: [(random() - 0.5) * 0.12, (random() - 0.5) * 0.16, (random() - 0.5) * 0.16],
    typingIntervalMs,
  };
}

export function getDollWordLimits(mobile: boolean): DollWordLimits {
  return mobile ? { activePhrases: 2, glyphs: 42 } : { activePhrases: 5, glyphs: 72 };
}

export function advanceTimelineGlyph(glyph: TimelineGlyph, now: number): TimelineGlyph {
  if (glyph.stage === 'hidden' && now >= glyph.showAt) {
    if (glyph.releaseAt !== null && now >= glyph.releaseAt) return { ...glyph, stage: 'dynamic' };
    return { ...glyph, stage: 'held' };
  }
  if (glyph.stage === 'held' && glyph.releaseAt !== null && now >= glyph.releaseAt) {
    return { ...glyph, stage: 'dynamic' };
  }
  return glyph;
}

export function markTimelineClearing<T extends TimelineGlyph>(glyphs: T[], now: number) {
  return glyphs.map((glyph) =>
    glyph.stage === 'hidden'
      ? null
      : { ...glyph, clearingStartedAt: now, releaseAt: null, stage: 'clearing' as const },
  );
}

export function oldestOverflowIds(
  glyphs: { createdAt: number; id: string; stage: TimelineGlyph['stage'] }[],
  limit: number,
) {
  const visible = glyphs
    .filter((glyph) => glyph.stage === 'held' || glyph.stage === 'dynamic')
    .sort((left, right) => left.createdAt - right.createdAt);
  return visible.slice(0, Math.max(0, visible.length - limit)).map((glyph) => glyph.id);
}

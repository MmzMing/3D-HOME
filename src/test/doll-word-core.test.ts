import { describe, expect, it } from 'vitest';

import {
  advanceTimelineGlyph,
  createBurstPlan,
  createSeededRandom,
  getDollWordLimits,
  layoutGraphemes,
  markTimelineClearing,
  oldestOverflowIds,
  segmentGraphemes,
  shuffledIndices,
  type TimelineGlyph,
} from '@/scene/doll-words/core';

describe('doll word graphemes and layout', () => {
  it('keeps Chinese, combining marks, and emoji sequences intact', () => {
    expect(segmentGraphemes('菲比e\u0301👨‍👩‍👧‍👦')).toEqual(['菲', '比', 'é', '👨‍👩‍👧‍👦']);
  });

  it('keeps spaces in mixed-language layout without creating ambiguous positions', () => {
    const layout = layoutGraphemes(segmentGraphemes('菲比 Ciallo~'), {
      fontSize: 1,
      maxWidth: 20,
    });

    expect(layout.map((glyph) => glyph.grapheme).join('')).toBe('菲比 Ciallo~');
    expect(layout.find((glyph) => glyph.grapheme === ' ')?.isWhitespace).toBe(true);
  });

  it('wraps lines and centers every line around the phrase anchor', () => {
    const layout = layoutGraphemes(segmentGraphemes('AB中文CD中文'), {
      fontSize: 1,
      maxWidth: 3,
    });
    const lines = new Map<number, typeof layout>();
    layout.forEach((glyph) => {
      const line = lines.get(glyph.line) ?? [];
      line.push(glyph);
      lines.set(glyph.line, line);
    });

    expect(lines.size).toBeGreaterThan(1);
    lines.forEach((line) => {
      const left = Math.min(...line.map((glyph) => glyph.x - glyph.width / 2));
      const right = Math.max(...line.map((glyph) => glyph.x + glyph.width / 2));
      expect(left + right).toBeCloseTo(0, 8);
    });
  });
});

describe('doll word deterministic motion plan', () => {
  it('creates the same plan for the same burst and phrase', () => {
    const options = { anchorCount: 5, fontCount: 4, mobile: false };
    expect(createBurstPlan(7, '菲比啾比(*^_^*)', options)).toEqual(
      createBurstPlan(7, '菲比啾比(*^_^*)', options),
    );
  });

  it('creates a complete release permutation for visible glyphs', () => {
    const plan = createBurstPlan(8, '中文 A👋', {
      anchorCount: 4,
      fontCount: 4,
      mobile: false,
    });
    const visibleIndices = plan.glyphs
      .map((glyph, index) => (glyph.isWhitespace ? -1 : index))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);

    expect([...plan.releaseOrder].sort((left, right) => left - right)).toEqual(visibleIndices);
    expect(new Set(plan.releaseOrder).size).toBe(visibleIndices.length);
  });

  it('uses a deterministic Fisher-Yates order', () => {
    expect(shuffledIndices(8, createSeededRandom(42))).toEqual(
      shuffledIndices(8, createSeededRandom(42)),
    );
  });

  it('shows reduced-motion phrases immediately and never schedules a release', () => {
    const plan = createBurstPlan(9, '立即出现', {
      anchorCount: 3,
      fontCount: 4,
      mobile: true,
      reducedMotion: true,
    });

    expect(plan.mode).toBe('reduced');
    expect(plan.glyphs.every((glyph) => glyph.showAfterMs === 0)).toBe(true);
    expect(plan.glyphs.every((glyph) => glyph.releaseAfterMs === null)).toBe(true);
  });
});

describe('doll word lifecycle limits', () => {
  const glyph = (overrides: Partial<TimelineGlyph> = {}): TimelineGlyph => ({
    clearingStartedAt: null,
    id: 'glyph',
    releaseAt: 200,
    showAt: 100,
    stage: 'hidden',
    ...overrides,
  });

  it('uses the approved desktop and mobile limits', () => {
    expect(getDollWordLimits(false)).toEqual({ activePhrases: 3, glyphs: 72 });
    expect(getDollWordLimits(true)).toEqual({ activePhrases: 2, glyphs: 42 });
  });

  it('advances typing and release stages at their scheduled times', () => {
    const hidden = glyph();
    const held = advanceTimelineGlyph(hidden, 100);
    const dynamic = advanceTimelineGlyph(held, 200);

    expect(held.stage).toBe('held');
    expect(dynamic.stage).toBe('dynamic');
  });

  it('drops hidden glyphs and marks visible glyphs for clear animation', () => {
    const cleared = markTimelineClearing(
      [glyph({ id: 'hidden' }), glyph({ id: 'held', stage: 'held' })],
      400,
    );

    expect(cleared[0]).toBeNull();
    expect(cleared[1]).toMatchObject({
      clearingStartedAt: 400,
      id: 'held',
      releaseAt: null,
      stage: 'clearing',
    });
  });

  it('evicts the oldest visible glyphs when a cap is exceeded', () => {
    const ids = oldestOverflowIds(
      Array.from({ length: 5 }, (_, index) => ({
        createdAt: index,
        id: `glyph-${String(index)}`,
        stage: 'dynamic' as const,
      })),
      3,
    );

    expect(ids).toEqual(['glyph-0', 'glyph-1']);
  });
});

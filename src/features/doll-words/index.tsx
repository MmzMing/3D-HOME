import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type Matter from 'matter-js';

import { profileConfig } from '@/config';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useRoomStore } from '@/stores/room-store';

interface GlyphInput {
  character: string;
  fontFamily: string;
  fontSize: string;
  height: number;
  width: number;
  x: number;
  y: number;
}

interface Glyph extends GlyphInput {
  id: string;
  isClearing: boolean;
}

interface Popup {
  fontFamily: string;
  id: number;
  phrase: string;
  x: number;
  y: number;
}

type MatterApi = typeof Matter;

const frameDurationMs = 1000 / 60;
const desktopMaxGlyphs = 120;
const desktopMaxPopups = 5;
const mobileBreakpoint = 719;
const mobileMaxGlyphs = 80;
const mobileMaxPopups = 4;
const wallThickness = 80;

function isMobileViewport() {
  return window.innerWidth <= mobileBreakpoint;
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest(
      "button, a, input, select, textarea, [role='button'], [contenteditable='true']",
    ) !== null
  );
}

function DollWordPopup({
  popup,
  reducedMotion,
  onDismiss,
  onRelease,
}: {
  popup: Popup;
  reducedMotion: boolean;
  onDismiss: (id: number) => void;
  onRelease: (glyph: GlyphInput) => void;
}) {
  const characters = useMemo(() => Array.from(popup.phrase), [popup.phrase]);
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? characters.length : 0);
  const [releasing, setReleasing] = useState(false);
  const [lifting, setLifting] = useState<Set<number>>(() => new Set());
  const [released, setReleased] = useState<Set<number>>(() => new Set());
  const characterRefs = useRef(new Map<number, HTMLSpanElement>());

  useEffect(() => {
    if (reducedMotion) {
      const timer = window.setTimeout(() => onDismiss(popup.id), 900);
      return () => window.clearTimeout(timer);
    }

    if (visibleCount < characters.length) {
      const timer = window.setTimeout(() => setVisibleCount((count) => count + 1), 90);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setReleasing(true), 700);
    return () => window.clearTimeout(timer);
  }, [characters.length, onDismiss, popup.id, reducedMotion, visibleCount]);

  useEffect(() => {
    if (!releasing) return undefined;

    const liftTimers = characters.map((_, index) =>
      window.setTimeout(() => {
        setLifting((current) => new Set(current).add(index));
      }, index * 120),
    );
    const releaseTimers = characters.map((character, index) =>
      window.setTimeout(
        () => {
          const element = characterRefs.current.get(index);

          if (element !== undefined && character.trim().length > 0) {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            onRelease({
              character,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              height: rect.height,
              width: rect.width,
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
          }

          setReleased((current) => new Set(current).add(index));
        },
        index * 120 + 160,
      ),
    );
    const dismissTimer = window.setTimeout(
      () => onDismiss(popup.id),
      characters.length * 120 + 260,
    );

    return () => {
      liftTimers.forEach((timer) => window.clearTimeout(timer));
      releaseTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(dismissTimer);
    };
  }, [characters, onDismiss, onRelease, popup.id, releasing]);

  return (
    <div className="doll-word-popup" aria-hidden="true">
      <div style={{ left: popup.x, top: popup.y, fontFamily: popup.fontFamily }}>
        {characters.slice(0, visibleCount).map((character, index) => (
          <span
            key={`${String(popup.id)}-${String(index)}`}
            ref={(element) => {
              if (element === null) characterRefs.current.delete(index);
              else characterRefs.current.set(index, element);
            }}
            data-lifting={lifting.has(index)}
            data-released={released.has(index)}
          >
            {character}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DollWords() {
  const burst = useRoomStore((state) => state.dollWordBurst);
  const clearRevision = useRoomStore((state) => state.dollWordClearRevision);
  const reducedMotion = useReducedMotion();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [glyphs, setGlyphs] = useState<Glyph[]>([]);
  const lastBurstId = useRef(0);
  const glyphsRef = useRef<Glyph[]>([]);
  const elementsRef = useRef(new Map<string, HTMLSpanElement>());
  const pendingGlyphsRef = useRef<GlyphInput[]>([]);
  const matterRef = useRef<MatterApi | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef(new Map<string, Matter.Body>());
  const boundariesRef = useRef<Matter.Body[]>([]);
  const clearTimerRef = useRef<number | null>(null);
  const lastClearRevision = useRef(0);
  const setDollWordCount = useRoomStore((state) => state.setDollWordCount);

  const dismissPopup = useCallback((id: number) => {
    setPopups((current) => current.filter((popup) => popup.id !== id));
  }, []);

  const updateGlyphs = useCallback(
    (next: Glyph[]) => {
      glyphsRef.current = next;
      setDollWordCount(next.filter((glyph) => !glyph.isClearing).length);
      setGlyphs(next);
    },
    [setDollWordCount],
  );

  const clearGlyphs = useCallback(() => {
    const matter = matterRef.current;
    const engine = engineRef.current;
    const ids = glyphsRef.current.filter((glyph) => !glyph.isClearing).map((glyph) => glyph.id);

    // The eraser clears both landed glyphs and any phrase still preparing to fall.
    setPopups([]);
    pendingGlyphsRef.current = [];

    if (ids.length === 0) return;

    ids.forEach((id) => {
      const body = bodiesRef.current.get(id);
      if (body !== undefined && matter !== null && engine !== null) {
        matter.Composite.remove(engine.world, body);
      }
      bodiesRef.current.delete(id);
    });
    updateGlyphs(
      glyphsRef.current.map((glyph) =>
        ids.includes(glyph.id) ? { ...glyph, isClearing: true } : glyph,
      ),
    );

    if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => {
      clearTimerRef.current = null;
      updateGlyphs(glyphsRef.current.filter((glyph) => !glyph.isClearing));
    }, 320);
  }, [updateGlyphs]);

  const resetBoundaries = useCallback((matter: MatterApi, engine: Matter.Engine) => {
    boundariesRef.current.forEach((body) => matter.Composite.remove(engine.world, body));

    const width = window.innerWidth;
    const height = window.innerHeight;
    const collisionFilter = { category: 0x0002, mask: 0x0001 };
    boundariesRef.current = [
      matter.Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        {
          collisionFilter,
          isStatic: true,
        },
      ),
      matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        {
          collisionFilter,
          isStatic: true,
        },
      ),
      matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        {
          collisionFilter,
          isStatic: true,
        },
      ),
    ];
    matter.Composite.add(engine.world, boundariesRef.current);
  }, []);

  const releaseGlyph = useCallback(
    (input: GlyphInput) => {
      const matter = matterRef.current;
      const engine = engineRef.current;

      if (matter === null || engine === null) {
        pendingGlyphsRef.current.push(input);
        return;
      }

      const id = `${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
      const body = matter.Bodies.rectangle(input.x, input.y, input.width, input.height, {
        collisionFilter: { category: 0x0001, mask: 0x0001 | 0x0002 },
        friction: 0.7,
        frictionAir: 0.018,
        restitution: 0.25,
        sleepThreshold: 30,
      });
      matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.2, y: -4.8 });
      matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
      matter.Composite.add(engine.world, body);
      bodiesRef.current.set(id, body);

      const next = [...glyphsRef.current, { ...input, id, isClearing: false }];
      const maxGlyphs = isMobileViewport() ? mobileMaxGlyphs : desktopMaxGlyphs;
      const overflow = Math.max(0, next.length - maxGlyphs);
      const kept = overflow === 0 ? next : next.slice(overflow);

      if (overflow > 0) {
        next.slice(0, overflow).forEach((glyph) => {
          const staleBody = bodiesRef.current.get(glyph.id);
          if (staleBody !== undefined) matter.Composite.remove(engine.world, staleBody);
          bodiesRef.current.delete(glyph.id);
        });
      }

      updateGlyphs(kept);
    },
    [updateGlyphs],
  );

  useEffect(() => {
    let cancelled = false;

    void import('matter-js').then((module) => {
      if (cancelled) return;

      const matter = module.default;
      const engine = matter.Engine.create({ enableSleeping: true });
      engine.gravity.y = 1;
      engine.gravity.scale = 0.001;
      matterRef.current = matter;
      engineRef.current = engine;
      resetBoundaries(matter, engine);
      pendingGlyphsRef.current.splice(0).forEach(releaseGlyph);
    });

    return () => {
      cancelled = true;
      if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
      const matter = matterRef.current;
      const engine = engineRef.current;
      if (matter !== null && engine !== null) {
        matter.Composite.clear(engine.world, false, true);
        matter.Engine.clear(engine);
      }
    };
  }, [releaseGlyph, resetBoundaries]);

  useEffect(() => {
    if (clearRevision === lastClearRevision.current) return;

    lastClearRevision.current = clearRevision;
    clearGlyphs();
  }, [clearGlyphs, clearRevision]);

  useEffect(() => {
    if (burst === null || burst.id === lastBurstId.current) return;

    lastBurstId.current = burst.id;
    const fonts = profileConfig.intro.dollFonts;
    const fontFamily = fonts[Math.floor(Math.random() * fonts.length)]?.family ?? 'Ark Pixel';
    const x = window.innerWidth * (0.16 + Math.random() * 0.68);
    const y = window.innerHeight * (0.18 + Math.random() * 0.5);
    const maxPopups = isMobileViewport() ? mobileMaxPopups : desktopMaxPopups;
    setPopups((current) => [
      ...current.slice(-(maxPopups - 1)),
      { fontFamily, id: burst.id, phrase: burst.phrase, x, y },
    ]);
  }, [burst]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const matter = matterRef.current;
      const engine = engineRef.current;

      if (matter !== null && engine !== null && !document.hidden) {
        matter.Engine.update(engine, frameDurationMs);
        glyphsRef.current.forEach((glyph) => {
          const body = bodiesRef.current.get(glyph.id);
          const element = elementsRef.current.get(glyph.id);
          if (body === undefined || element === undefined || glyph.isClearing) return;
          element.style.transform = `translate3d(${String(body.position.x - glyph.width / 2)}px, ${String(body.position.y - glyph.height / 2)}px, 0) rotate(${String(body.angle)}rad)`;
        });
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const matter = matterRef.current;
      const engine = engineRef.current;
      if (matter !== null && engine !== null) resetBoundaries(matter, engine);
    };
    const previousPointer = { time: 0, x: 0, y: 0 };
    let dragConstraint: Matter.Constraint | null = null;

    const finishDrag = () => {
      const matter = matterRef.current;
      const engine = engineRef.current;
      if (matter !== null && engine !== null && dragConstraint !== null) {
        matter.Composite.remove(engine.world, dragConstraint);
      }
      dragConstraint = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const matter = matterRef.current;
      const engine = engineRef.current;
      if (matter === null || engine === null) return;

      if (dragConstraint !== null) {
        dragConstraint.pointA.x = event.clientX;
        dragConstraint.pointA.y = event.clientY;
        event.preventDefault();
        return;
      }

      if (event.pointerType !== 'mouse' || isInteractiveTarget(event.target)) return;
      const elapsed = Math.max(1, event.timeStamp - previousPointer.time);
      const velocity = {
        x: Math.max(-12, Math.min(12, ((event.clientX - previousPointer.x) / elapsed) * 16.67)),
        y: Math.max(-12, Math.min(12, ((event.clientY - previousPointer.y) / elapsed) * 16.67)),
      };
      previousPointer.time = event.timeStamp;
      previousPointer.x = event.clientX;
      previousPointer.y = event.clientY;

      matter.Query.point(Array.from(bodiesRef.current.values()), {
        x: event.clientX,
        y: event.clientY,
      }).forEach((body) => {
        matter.Sleeping.set(body, false);
        matter.Body.setVelocity(body, {
          x: body.velocity.x + velocity.x,
          y: body.velocity.y + velocity.y,
        });
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const matter = matterRef.current;
      const engine = engineRef.current;
      if (
        matter === null ||
        engine === null ||
        event.button !== 0 ||
        isInteractiveTarget(event.target)
      )
        return;

      const body = matter.Query.point(Array.from(bodiesRef.current.values()), {
        x: event.clientX,
        y: event.clientY,
      }).at(-1);
      if (body === undefined) return;

      dragConstraint = matter.Constraint.create({
        bodyB: body,
        damping: 0.1,
        length: 0,
        pointA: { x: event.clientX, y: event.clientY },
        pointB: matter.Vector.rotate(
          matter.Vector.sub({ x: event.clientX, y: event.clientY }, body.position),
          -body.angle,
        ),
        stiffness: 0.88,
      });
      matter.Composite.add(engine.world, dragConstraint);
      matter.Sleeping.set(body, false);
      previousPointer.time = event.timeStamp;
      previousPointer.x = event.clientX;
      previousPointer.y = event.clientY;
      event.preventDefault();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
      finishDrag();
    };
  }, [resetBoundaries]);

  return (
    <>
      <div className="doll-words" aria-hidden="true">
        {glyphs.map((glyph) => (
          <span
            key={glyph.id}
            ref={(element) => {
              if (element === null) elementsRef.current.delete(glyph.id);
              else elementsRef.current.set(glyph.id, element);
            }}
            data-clearing={glyph.isClearing}
            style={
              {
                fontFamily: glyph.fontFamily,
                fontSize: glyph.fontSize,
                height: `${String(glyph.height)}px`,
                width: `${String(glyph.width)}px`,
                '--doll-word-x': `${String(glyph.x - glyph.width / 2)}px`,
                '--doll-word-y': `${String(glyph.y - glyph.height / 2)}px`,
              } as CSSProperties
            }
          >
            {glyph.character}
          </span>
        ))}
      </div>
      {popups.map((popup) => (
        <DollWordPopup
          key={popup.id}
          popup={popup}
          reducedMotion={reducedMotion}
          onDismiss={dismissPopup}
          onRelease={releaseGlyph}
        />
      ))}
    </>
  );
}

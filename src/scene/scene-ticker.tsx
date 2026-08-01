import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { usePlayerStore } from '@/stores/player-store';
import { useRoomStore } from '@/stores/room-store';

export function SceneTicker() {
  const airConditionerOn = useRoomStore((state) => state.objectState.airConditionerOn);
  const fanSpeed = useRoomStore((state) => state.objectState.fanSpeed);
  const playback = usePlayerStore((state) => state.status);
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);
  const mobile = useThree((state) => state.size.width < 720);

  useEffect(() => {
    const highMotion = airConditionerOn || fanSpeed > 0 || playback === 'playing';
    const targetFps = reducedMotion ? 15 : highMotion ? (mobile ? 30 : 60) : mobile ? 20 : 30;
    const frameInterval = 1000 / targetFps;
    let frame = 0;
    let previous = 0;
    const tick = (time: number) => {
      if (!document.hidden && time - previous >= frameInterval) {
        previous = time - ((time - previous) % frameInterval);
        invalidate();
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [airConditionerOn, fanSpeed, invalidate, mobile, playback, reducedMotion]);

  return null;
}

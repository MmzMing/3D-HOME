import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { usePlayerStore } from '@/stores/player-store';
import { useRoomStore } from '@/stores/room-store';

export function SceneTicker() {
  const airConditionerOn = useRoomStore((state) => state.objectState.airConditionerOn);
  const fanSpeed = useRoomStore((state) => state.objectState.fanSpeed);
  const clockRunning = useRoomStore((state) => state.objectState.clockRunning);
  const coffeeSteaming = useRoomStore((state) => state.objectState.coffeeSteaming);
  const theme = useRoomStore((state) => state.theme);
  const playback = usePlayerStore((state) => state.status);
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);
  const mobile = useThree((state) => state.size.width < 720);

  useEffect(() => {
    const highMotion = airConditionerOn || fanSpeed > 0 || playback === 'playing';
    const ambientMotion = clockRunning || coffeeSteaming || theme === 'dark';
    const continuous = !reducedMotion && (highMotion || ambientMotion);
    if (!continuous) return;

    const targetFps = highMotion ? (mobile ? 30 : 60) : mobile ? 15 : 30;
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
  }, [
    airConditionerOn,
    clockRunning,
    coffeeSteaming,
    fanSpeed,
    invalidate,
    mobile,
    playback,
    reducedMotion,
    theme,
  ]);

  return null;
}

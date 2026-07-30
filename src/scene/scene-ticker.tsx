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
  const playback = usePlayerStore((state) => state.status);
  const reducedMotion = useReducedMotion();
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const continuous =
      !reducedMotion &&
      (airConditionerOn ||
        fanSpeed > 0 ||
        clockRunning ||
        coffeeSteaming ||
        playback === 'playing');
    if (!continuous) return;
    let frame = 0;
    const tick = () => {
      if (!document.hidden) invalidate();
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
    playback,
    reducedMotion,
  ]);

  return null;
}

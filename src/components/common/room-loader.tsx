import { useProgress } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useRoomStore } from '@/stores/room-store';

interface RoomLoaderProps {
  canvasReady: boolean;
  onReveal: () => void;
  sceneReady: boolean;
}

export function RoomLoader({ canvasReady, onReveal, sceneReady }: RoomLoaderProps) {
  const { active, progress, total } = useProgress();
  const theme = useRoomStore((state) => state.theme);
  const reducedMotion = useReducedMotion();
  const [displayedProgress, setDisplayedProgress] = useState(6);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  const finishExit = useCallback(() => setVisible(false), []);

  const targetProgress = useMemo(() => {
    if (sceneReady && !active) return 100;
    if (total > 0) return Math.min(96, Math.round(24 + progress * 0.72));
    return canvasReady ? 32 : 8;
  }, [active, canvasReady, progress, sceneReady, total]);

  useEffect(() => {
    let timeout = 0;
    const advance = () => {
      setDisplayedProgress((current) => {
        if (current >= targetProgress) return current;
        const step = Math.max(1, Math.ceil((targetProgress - current) * 0.14));
        const next = Math.min(targetProgress, current + step);
        if (next < targetProgress) timeout = window.setTimeout(advance, 50);
        return next;
      });
    };
    timeout = window.setTimeout(advance, 0);
    return () => window.clearTimeout(timeout);
  }, [targetProgress]);

  useEffect(() => {
    if (displayedProgress < 100) return;

    let firstFrame = 0;
    let secondFrame = 0;
    let fallbackTimeout = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        onReveal();

        if (reducedMotion) {
          finishExit();
          return;
        }

        setExiting(true);
        fallbackTimeout = window.setTimeout(finishExit, 520);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallbackTimeout);
    };
  }, [displayedProgress, finishExit, onReveal, reducedMotion]);

  if (!visible) return null;
  return (
    <div
      className="room-loader"
      data-exiting={exiting ? 'true' : 'false'}
      data-loader-theme={theme}
      onTransitionEnd={(event) => {
        if (event.currentTarget === event.target && event.propertyName === 'opacity') finishExit();
      }}
      role="progressbar"
      aria-label="正在加载三维房间"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={displayedProgress}
    >
      <div className="room-loader-bulb" aria-hidden="true">
        <svg viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="m930 552.86h-660c-6.9297 0-13.191-4.168-15.836-10.582-2.6602-6.4102-1.1875-13.777 3.7148-18.684l289.72-289.7c4.1367-4.1367 10.078-5.875 15.836-4.6211 5.707 1.2734 10.379 5.375 12.387 10.883 3.7031 10.164 13.43 16.996 24.176 16.996s20.473-6.832 24.191-17.008c2.0078-5.5078 6.6797-9.5938 12.406-10.863 5.6602-1.2539 11.668 0.48437 15.82 4.6211l289.7 289.7c4.9062 4.9062 6.3789 12.27 3.7148 18.684-2.6445 6.4062-8.9062 10.574-15.836 10.574zm-618.62-34.285h577.23l-245.5-245.51c-11.102 11.469-26.586 18.367-43.109 18.367-16.539 0-32.008-6.8984-43.109-18.348z" />
            <path d="m986.48 1028.6h-772.97c-23.203 0-42.086-18.883-42.086-42.086v-425.82c0-23.203 18.883-42.09 42.086-42.09h772.97c23.203 0 42.086 18.887 42.086 42.09v425.82c0 23.203-18.883 42.086-42.086 42.086zm-772.97-475.71c-4.3008 0-7.8008 3.5-7.8008 7.8047v425.82c0 4.3008 3.5 7.8008 7.8008 7.8008h772.97c4.3008 0 7.8008-3.5 7.8008-7.8008v-425.82c0-4.3047-3.5-7.8047-7.8008-7.8047z" />
            <path d="m599.92 935.74c-89.332 0-162-72.758-162-162.17 0-89.414 72.672-162.17 162-162.17 89.414 0 162.17 72.758 162.17 162.17-0.003906 89.414-72.758 162.17-162.17 162.17zm0-290.05c-70.43 0-127.72 57.371-127.72 127.89 0 70.512 57.289 127.89 127.72 127.89 70.512 0 127.89-57.371 127.89-127.89-0.003907-70.516-57.375-127.89-127.89-127.89z" />
            <path d="m600 291.43c-25.113 0-47.777-15.887-56.383-39.559-2.3633-6.1445-3.6172-13.125-3.6172-20.441 0-33.082 26.918-60 60-60s60 26.918 60 60c0 7.3477-1.2383 14.312-3.6992 20.727-8.5391 23.387-31.207 39.273-56.301 39.273zm0-85.715c-14.18 0-25.715 11.535-25.715 25.715 0 3.0625 0.50391 5.9766 1.4414 8.4375 3.8008 10.445 13.527 17.277 24.273 17.277s20.473-6.832 24.191-17.008c1.0391-2.6992 1.5234-5.6094 1.5234-8.707 0-14.18-11.535-25.715-25.715-25.715z" />
          </g>
          <text className="room-loader-progress" x="600" y="805" textAnchor="middle">
            {displayedProgress}%
          </text>
        </svg>
      </div>
    </div>
  );
}

import { useEffect } from 'react';

import { useRoomStore } from '@/stores/room-store';

const themeColors = {
  dark: '#0b0d0f',
  light: '#ffffff',
} as const;

export function ThemeSync() {
  const theme = useRoomStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
  }, [theme]);

  return null;
}

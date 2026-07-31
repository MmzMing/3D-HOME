import { create } from 'zustand';

import { appConfig, themeConfig } from '@/config';
import type { CameraZone, PanelId, ProfileTab, RoomObjectState, ThemeMode } from '@/types/room';
import { readStorage, writeStorage } from '@/utils/storage';

interface RoomState {
  cameraZone: CameraZone;
  dollWordBurst: { id: number; phrase: string } | null;
  dollWordClearRevision: number;
  dollWordCount: number;
  hoveredObject: string | null;
  isLinkClusterOpen: boolean;
  isObjectMenuOpen: boolean;
  isSoundEnabled: boolean;
  isWeatherOpen: boolean;
  objectState: RoomObjectState;
  panel: PanelId;
  profileTab: ProfileTab;
  selectedFeedId: string | null;
  selectedLinkId: string | null;
  theme: ThemeMode;
  closePanel: () => void;
  clearDollWords: () => void;
  releaseDollWords: (phrase: string) => void;
  setDollWordCount: (count: number) => void;
  openFeed: (feedId: string) => void;
  openLink: (linkId: string) => void;
  openPanel: (panel: Exclude<PanelId, 'feed' | 'link' | null>) => void;
  patchObjectState: (patch: Partial<RoomObjectState>) => void;
  pulseObject: (key: 'cushionPulse' | 'plantPulse' | 'weatherDollPulse') => void;
  setCameraZone: (zone: CameraZone) => void;
  setHoveredObject: (id: string | null) => void;
  setLinkClusterOpen: (open: boolean) => void;
  setObjectMenuOpen: (open: boolean) => void;
  setProfileTab: (tab: ProfileTab) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setWeatherOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

const initialObjectState: RoomObjectState = {
  airConditionerOn: false,
  chairOut: false,
  clockRunning: true,
  coffeeSteaming: true,
  curtainsOpen: true,
  cushionPulse: 0,
  quiltFolded: false,
  deskLampOn: false,
  doorOpen: false,
  drawerOpen: false,
  fanSpeed: 0,
  plantPulse: 0,
  weatherDollPulse: 0,
  windowOpen: false,
};

const initialTheme =
  typeof window === 'undefined'
    ? themeConfig.defaultMode
    : readStorage(themeConfig.themeStorageKey, ['light', 'dark'], themeConfig.defaultMode);
const initialSound =
  typeof window === 'undefined'
    ? true
    : readStorage(themeConfig.soundStorageKey, ['enabled', 'disabled'], 'enabled') === 'enabled';

export const useRoomStore = create<RoomState>((set) => ({
  cameraZone: appConfig.defaultCameraZone,
  dollWordBurst: null,
  dollWordClearRevision: 0,
  dollWordCount: 0,
  hoveredObject: null,
  isLinkClusterOpen: false,
  isObjectMenuOpen: false,
  isSoundEnabled: initialSound,
  isWeatherOpen: false,
  objectState: initialObjectState,
  panel: null,
  profileTab: 'about',
  selectedFeedId: null,
  selectedLinkId: null,
  theme: initialTheme,
  closePanel: () => set({ panel: null, selectedFeedId: null, selectedLinkId: null }),
  clearDollWords: () =>
    set((state) => ({ dollWordClearRevision: state.dollWordClearRevision + 1, dollWordCount: 0 })),
  releaseDollWords: (phrase) =>
    set((state) => ({
      dollWordBurst: { id: (state.dollWordBurst?.id ?? 0) + 1, phrase },
    })),
  setDollWordCount: (dollWordCount) =>
    set({ dollWordCount: Math.max(0, Math.floor(dollWordCount)) }),
  openFeed: (selectedFeedId) => set({ panel: 'feed', selectedFeedId }),
  openLink: (selectedLinkId) => set({ panel: 'link', selectedLinkId }),
  openPanel: (panel) => set({ panel }),
  patchObjectState: (patch) =>
    set((state) => ({ objectState: { ...state.objectState, ...patch } })),
  pulseObject: (key) =>
    set((state) => ({ objectState: { ...state.objectState, [key]: state.objectState[key] + 1 } })),
  setCameraZone: (cameraZone) => set({ cameraZone }),
  setHoveredObject: (hoveredObject) => set({ hoveredObject }),
  setLinkClusterOpen: (isLinkClusterOpen) => set({ isLinkClusterOpen }),
  setObjectMenuOpen: (isObjectMenuOpen) => set({ isObjectMenuOpen }),
  setProfileTab: (profileTab) => set({ profileTab }),
  setSoundEnabled: (isSoundEnabled) => {
    writeStorage(themeConfig.soundStorageKey, isSoundEnabled ? 'enabled' : 'disabled');
    set({ isSoundEnabled });
  },
  setWeatherOpen: (isWeatherOpen) => set({ isWeatherOpen }),
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'light' ? 'dark' : 'light';
      writeStorage(themeConfig.themeStorageKey, theme);
      return { theme };
    }),
}));

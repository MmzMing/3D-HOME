import { create } from 'zustand';

import { appConfig, feedsConfig, themeConfig } from '@/config';
import type { CameraFocus, CameraZone, PanelId, RoomObjectState, ThemeMode } from '@/types/room';
import { readStorage, writeStorage } from '@/utils/storage';

type CameraFocusTarget = Exclude<CameraFocus, null>;

interface RoomState {
  cameraFocus: CameraFocus;
  focusReturnZone: CameraZone | null;
  cameraZone: CameraZone;
  dollWordBurst: { id: number; phrase: string } | null;
  dollWordClearRevision: number;
  dollWordCount: number;
  doorExitFeedId: string | null;
  hoveredObject: string | null;
  isDoorExitPromptOpen: boolean;
  isLinkClusterOpen: boolean;
  isObjectMenuOpen: boolean;
  isSoundEnabled: boolean;
  isWeatherOpen: boolean;
  objectState: RoomObjectState;
  panel: PanelId;
  selectedFeedId: string | null;
  selectedLinkId: string | null;
  theme: ThemeMode;
  closePanel: () => void;
  clearDollWords: () => void;
  focusObject: (focus: CameraFocusTarget) => void;
  focusPortrait: () => void;
  openDoorExitPrompt: () => void;
  refreshDoorExitLink: () => void;
  setDoorExitPromptOpen: (open: boolean) => void;
  releaseDollWords: (phrase: string) => void;
  setDollWordCount: (count: number) => void;
  openFeed: (feedId: string) => void;
  openLink: (linkId: string) => void;
  openPanel: (panel: Exclude<PanelId, 'feed' | 'link' | null>) => void;
  patchObjectState: (patch: Partial<RoomObjectState>) => void;
  pulseObject: (key: 'cushionPulse' | 'plantPulse' | 'topPulse' | 'weatherDollPulse') => void;
  restoreCameraFocus: () => void;
  setCameraZone: (zone: CameraZone) => void;
  setHoveredObject: (id: string | null) => void;
  setLinkClusterOpen: (open: boolean) => void;
  setObjectMenuOpen: (open: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setWeatherOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

const initialObjectState: RoomObjectState = {
  airConditionerOn: false,
  bedsideLampOn: false,
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
  monitorOn: true,
  plantPulse: 0,
  topPulse: 0,
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

function randomDoorExitFeedId(currentId: string | null) {
  const enabledFeeds = feedsConfig.filter((feed) => feed.enabled);
  const candidates = enabledFeeds.filter((feed) => feed.id !== currentId);
  const feeds = candidates.length === 0 ? enabledFeeds : candidates;
  return feeds[Math.floor(Math.random() * feeds.length)]?.id ?? null;
}

export const useRoomStore = create<RoomState>((set) => ({
  cameraFocus: null,
  focusReturnZone: null,
  cameraZone: appConfig.defaultCameraZone,
  dollWordBurst: null,
  dollWordClearRevision: 0,
  dollWordCount: 0,
  doorExitFeedId: feedsConfig.find((feed) => feed.enabled)?.id ?? null,
  hoveredObject: null,
  isDoorExitPromptOpen: false,
  isLinkClusterOpen: false,
  isObjectMenuOpen: false,
  isSoundEnabled: initialSound,
  isWeatherOpen: false,
  objectState: initialObjectState,
  panel: null,
  selectedFeedId: null,
  selectedLinkId: null,
  theme: initialTheme,
  closePanel: () => set({ panel: null, selectedFeedId: null, selectedLinkId: null }),
  clearDollWords: () =>
    set((state) => ({ dollWordClearRevision: state.dollWordClearRevision + 1, dollWordCount: 0 })),
  focusObject: (cameraFocus) =>
    set((state) => ({
      cameraFocus,
      focusReturnZone: state.cameraFocus === null ? state.cameraZone : state.focusReturnZone,
    })),
  focusPortrait: () =>
    set((state) => ({
      cameraFocus: 'portrait',
      focusReturnZone: state.cameraFocus === null ? state.cameraZone : state.focusReturnZone,
    })),
  openDoorExitPrompt: () =>
    set((state) => ({
      doorExitFeedId: randomDoorExitFeedId(state.doorExitFeedId),
      isDoorExitPromptOpen: true,
      isWeatherOpen: false,
      objectState: { ...state.objectState, doorOpen: true },
      panel: null,
      selectedFeedId: null,
      selectedLinkId: null,
    })),
  refreshDoorExitLink: () =>
    set((state) => ({ doorExitFeedId: randomDoorExitFeedId(state.doorExitFeedId) })),
  setDoorExitPromptOpen: (isDoorExitPromptOpen) =>
    set((state) => ({
      isDoorExitPromptOpen,
      objectState: { ...state.objectState, doorOpen: isDoorExitPromptOpen },
    })),
  releaseDollWords: (phrase) =>
    set((state) => ({
      dollWordBurst: { id: (state.dollWordBurst?.id ?? 0) + 1, phrase },
    })),
  setDollWordCount: (dollWordCount) =>
    set({ dollWordCount: Math.max(0, Math.floor(dollWordCount)) }),
  openFeed: (selectedFeedId) =>
    set((state) => ({
      isDoorExitPromptOpen: false,
      isWeatherOpen: false,
      objectState: { ...state.objectState, doorOpen: false },
      panel: 'feed',
      selectedFeedId,
      selectedLinkId: null,
    })),
  openLink: (selectedLinkId) =>
    set((state) => ({
      isDoorExitPromptOpen: false,
      isWeatherOpen: false,
      objectState: { ...state.objectState, doorOpen: false },
      panel: 'link',
      selectedFeedId: null,
      selectedLinkId,
    })),
  openPanel: (panel) =>
    set((state) => ({
      isDoorExitPromptOpen: false,
      isWeatherOpen: false,
      objectState: { ...state.objectState, doorOpen: false },
      panel,
      selectedFeedId: null,
      selectedLinkId: null,
    })),
  patchObjectState: (patch) =>
    set((state) => ({ objectState: { ...state.objectState, ...patch } })),
  pulseObject: (key) =>
    set((state) => ({ objectState: { ...state.objectState, [key]: state.objectState[key] + 1 } })),
  restoreCameraFocus: () =>
    set((state) => ({
      cameraFocus: null,
      cameraZone: state.focusReturnZone ?? state.cameraZone,
      focusReturnZone: null,
    })),
  setCameraZone: (cameraZone) =>
    set((state) => ({
      cameraFocus: null,
      cameraZone,
      focusReturnZone: null,
      isDoorExitPromptOpen: false,
      isWeatherOpen: false,
      objectState: { ...state.objectState, doorOpen: false },
      panel: null,
      selectedFeedId: null,
      selectedLinkId: null,
    })),
  setHoveredObject: (hoveredObject) => set({ hoveredObject }),
  setLinkClusterOpen: (isLinkClusterOpen) => set({ isLinkClusterOpen }),
  setObjectMenuOpen: (isObjectMenuOpen) => set({ isObjectMenuOpen }),
  setSoundEnabled: (isSoundEnabled) => {
    writeStorage(themeConfig.soundStorageKey, isSoundEnabled ? 'enabled' : 'disabled');
    set({ isSoundEnabled });
  },
  setWeatherOpen: (isWeatherOpen) =>
    isWeatherOpen
      ? set((state) => ({
          isDoorExitPromptOpen: false,
          isWeatherOpen: true,
          objectState: { ...state.objectState, doorOpen: false },
          panel: null,
          selectedFeedId: null,
          selectedLinkId: null,
        }))
      : set({ isWeatherOpen: false }),
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'light' ? 'dark' : 'light';
      writeStorage(themeConfig.themeStorageKey, theme);
      return { theme };
    }),
}));

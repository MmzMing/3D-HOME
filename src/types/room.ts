export type ThemeMode = 'light' | 'dark';

export type CameraZone = 'overview' | 'workspace' | 'lounge';
export type CameraFocus =
  'portrait' | 'keyboard' | 'laptop' | 'bookshelf' | 'weather' | 'door' | null;

export type PanelId = 'profile' | 'github' | 'link' | 'feed' | 'music' | 'search' | null;

export type RoomCommand = 'overview' | 'open-profile' | 'focus-bookshelf' | 'open-music';

export type RoomObjectId =
  | 'monitor'
  | 'laptop'
  | 'portrait'
  | 'bookshelf'
  | 'weather-doll'
  | 'gramophone'
  | 'keyboard'
  | 'mouse'
  | 'wall-switch'
  | 'desk-lamp'
  | 'bedside-lamp'
  | 'door'
  | 'window'
  | 'curtains'
  | 'air-conditioner'
  | 'fan'
  | 'clock'
  | 'desk-drawer'
  | 'office-chair'
  | 'sofa'
  | 'spinning-top'
  | 'bed'
  | 'coffee'
  | 'plant'
  | 'profile-doll'
  | 'doll-eraser';

export interface RoomObjectDefinition {
  id: RoomObjectId;
  label: string;
  zone: CameraZone;
}

export interface RoomObjectState {
  airConditionerOn: boolean;
  bedsideLampOn: boolean;
  chairOut: boolean;
  clockRunning: boolean;
  coffeeSteaming: boolean;
  curtainsOpen: boolean;
  cushionPulse: number;
  quiltFolded: boolean;
  deskLampOn: boolean;
  doorOpen: boolean;
  drawerOpen: boolean;
  fanSpeed: 0 | 1 | 2;
  monitorOn: boolean;
  plantPulse: number;
  topPulse: number;
  weatherDollPulse: number;
  windowOpen: boolean;
}

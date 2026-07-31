import { feedsConfig } from '@/config';
import { usePlayerStore } from '@/stores/player-store';
import { useRoomStore } from '@/stores/room-store';
import type { RoomCommand, RoomObjectDefinition, RoomObjectId } from '@/types/room';
import { playObjectSound, playRandomProfileAudio, playRoomSound } from '@/utils/room-audio';

export const roomObjects: readonly RoomObjectDefinition[] = [
  { id: 'monitor', label: '主显示器链接', zone: 'workspace' },
  { id: 'laptop', label: '笔记本 GitHub', zone: 'workspace' },
  { id: 'portrait', label: '个人壁画', zone: 'workspace' },
  { id: 'bookshelf', label: 'RSS 书架', zone: 'lounge' },
  { id: 'weather-doll', label: '晴天娃娃天气', zone: 'workspace' },
  { id: 'gramophone', label: '音乐留声机', zone: 'lounge' },
  { id: 'keyboard', label: '搜索键盘', zone: 'workspace' },
  { id: 'mouse', label: '显示器电源鼠标', zone: 'workspace' },
  { id: 'wall-switch', label: '主题开关', zone: 'workspace' },
  { id: 'desk-lamp', label: '主台灯', zone: 'workspace' },
  { id: 'door', label: '门户', zone: 'overview' },
  { id: 'window', label: '窗户', zone: 'workspace' },
  { id: 'curtains', label: '窗帘', zone: 'lounge' },
  { id: 'air-conditioner', label: '空调', zone: 'lounge' },
  { id: 'fan', label: '桌面风扇', zone: 'workspace' },
  { id: 'clock', label: '时钟', zone: 'lounge' },
  { id: 'desk-drawer', label: '书桌抽屉', zone: 'workspace' },
  { id: 'office-chair', label: '办公椅', zone: 'workspace' },
  { id: 'sofa', label: '广式木长椅', zone: 'lounge' },
  { id: 'bed', label: '床与枕头', zone: 'lounge' },
  { id: 'coffee', label: '咖啡', zone: 'workspace' },
  { id: 'plant', label: '植物', zone: 'workspace' },
  { id: 'profile-doll', label: '中央玩偶', zone: 'overview' },
  { id: 'doll-eraser', label: '文字清除方块', zone: 'overview' },
] as const;

function sound(kind: 'click' | 'chime' | 'soft' | 'switch' = 'click') {
  playRoomSound(kind, useRoomStore.getState().isSoundEnabled);
}

export function runRoomCommand(command: RoomCommand) {
  const room = useRoomStore.getState();
  if (command === 'overview') room.setCameraZone('overview');
  if (command === 'open-profile') {
    room.setProfileTab('about');
    room.openPanel('profile');
  }
  if (command === 'focus-bookshelf') {
    room.setCameraZone('lounge');
    const feed = feedsConfig.find((item) => item.enabled);
    if (feed !== undefined) room.openFeed(feed.id);
  }
  if (command === 'open-music') room.openPanel('music');
}

export function activateRoomObject(id: RoomObjectId) {
  const room = useRoomStore.getState();
  const state = room.objectState;
  switch (id) {
    case 'monitor':
      if (!state.monitorOn) break;
      room.setLinkClusterOpen(!room.isLinkClusterOpen);
      sound();
      break;
    case 'laptop':
      room.setProfileTab('github');
      room.openPanel('profile');
      sound();
      break;
    case 'portrait':
      room.setProfileTab('about');
      room.openPanel('profile');
      sound('soft');
      break;
    case 'bookshelf': {
      const feed = feedsConfig.find((item) => item.enabled);
      if (feed !== undefined) room.openFeed(feed.id);
      sound('soft');
      break;
    }
    case 'weather-doll':
      room.pulseObject('weatherDollPulse');
      room.setWeatherOpen(true);
      sound('chime');
      break;
    case 'gramophone': {
      const player = usePlayerStore.getState();
      if (player.status === 'playing' || player.status === 'loading') player.pause();
      else player.play();
      sound('soft');
      break;
    }
    case 'keyboard':
      room.openPanel('search');
      sound();
      break;
    case 'mouse': {
      const monitorOn = !state.monitorOn;
      room.patchObjectState({ monitorOn });
      if (!monitorOn) room.setLinkClusterOpen(false);
      sound('switch');
      break;
    }
    case 'wall-switch':
      room.toggleTheme();
      sound('switch');
      break;
    case 'desk-lamp':
      room.patchObjectState({ deskLampOn: !state.deskLampOn });
      sound('switch');
      break;
    case 'door':
      if (state.doorOpen) {
        room.openDoorExitPrompt();
        sound('chime');
      } else {
        room.patchObjectState({ doorOpen: true });
        sound('soft');
      }
      break;
    case 'window': {
      const opening = !state.windowOpen;
      room.patchObjectState({ windowOpen: opening });
      if (opening) playObjectSound('window-open', room.isSoundEnabled);
      else sound('soft');
      break;
    }
    case 'curtains':
      room.patchObjectState({ curtainsOpen: !state.curtainsOpen });
      sound('soft');
      break;
    case 'air-conditioner': {
      const turningOn = !state.airConditionerOn;
      room.patchObjectState({ airConditionerOn: turningOn });
      if (turningOn) playObjectSound('air-conditioner-on', room.isSoundEnabled);
      else sound('switch');
      break;
    }
    case 'fan':
      room.patchObjectState({ fanSpeed: ((state.fanSpeed + 1) % 3) as 0 | 1 | 2 });
      sound();
      break;
    case 'clock':
      room.patchObjectState({ clockRunning: !state.clockRunning });
      sound();
      break;
    case 'desk-drawer':
      room.patchObjectState({ drawerOpen: !state.drawerOpen });
      sound('soft');
      break;
    case 'office-chair':
      room.patchObjectState({ chairOut: !state.chairOut });
      sound('soft');
      break;
    case 'sofa':
      room.pulseObject('cushionPulse');
      sound('soft');
      break;
    case 'bed':
      room.patchObjectState({ quiltFolded: !state.quiltFolded });
      sound('soft');
      break;
    case 'coffee':
      room.patchObjectState({ coffeeSteaming: !state.coffeeSteaming });
      sound('soft');
      break;
    case 'plant':
      room.pulseObject('plantPulse');
      sound('soft');
      break;
    case 'profile-doll':
      playRandomProfileAudio(true);
      break;
    case 'doll-eraser':
      break;
  }
}

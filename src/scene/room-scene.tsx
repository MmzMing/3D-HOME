import { Bookshelf } from '@/scene/objects/bookshelf';
import { AirConditioner } from '@/scene/objects/air-conditioner';
import { Bed } from '@/scene/objects/bed';
import { DeskFan } from '@/scene/objects/desk-fan';
import { Coffee } from '@/scene/objects/coffee';
import { CoffeeTable } from '@/scene/objects/coffee-table';
import { Desk } from '@/scene/objects/desk';
import { DeskLamp } from '@/scene/objects/desk-lamp';
import { Door } from '@/scene/objects/door';
import { Gramophone } from '@/scene/objects/gramophone';
import { Keyboard } from '@/scene/objects/keyboard';
import { Laptop } from '@/scene/objects/laptop';
import { Monitor } from '@/scene/objects/monitor';
import { Mouse } from '@/scene/objects/mouse';
import { OfficeChair } from '@/scene/objects/office-chair';
import { Plant } from '@/scene/objects/plant';
import { Portrait } from '@/scene/objects/portrait';
import { ProfileDoll } from '@/scene/objects/profile-doll';
import { SiteRecords } from '@/scene/objects/site-records';
import { Sofa } from '@/scene/objects/sofa';
import { WallClock } from '@/scene/objects/clock';
import { WallSwitch } from '@/scene/objects/wall-switch';
import { Window } from '@/scene/objects/window';
import { WeatherDoll } from '@/scene/objects/weather-doll';
import { CameraRig } from '@/scene/camera-rig';
import { RoomShell } from '@/scene/room-shell';
import { SceneTicker } from '@/scene/scene-ticker';
import { RoomPostprocessing } from '@/scene/effects/room-postprocessing';
import { RoomLineReveal } from '@/scene/effects/line-reveal';
import { DollWordLayer } from '@/scene/doll-words/layer';

interface RoomSceneProps {
  onDollWordsReady: () => void;
  onRevealComplete: () => void;
  revealActive: boolean;
}

export function RoomScene({ onDollWordsReady, onRevealComplete, revealActive }: RoomSceneProps) {
  return (
    <>
      <CameraRig />
      <SceneTicker />
      <group position={[0, -0.85, 0]}>
        <RoomShell />
        <Desk />
        <Monitor />
        <Laptop />
        <Keyboard />
        <Mouse />
        <DeskLamp />
        <Coffee />
        <Plant />
        <Portrait />
        <ProfileDoll />
        <WallSwitch />
        <Door />
        <Window />
        <WeatherDoll />
        <Bookshelf />
        <AirConditioner />
        <Gramophone />
        <DeskFan />
        <WallClock />
        <SiteRecords />
        <OfficeChair />
        <Sofa />
        <CoffeeTable />
        <Bed />
      </group>
      <DollWordLayer onReady={onDollWordsReady} />
      <RoomPostprocessing />
      <RoomLineReveal active={revealActive} onComplete={onRevealComplete} />
    </>
  );
}

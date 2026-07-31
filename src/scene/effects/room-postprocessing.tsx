import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';

import { useRoomStore } from '@/stores/room-store';

export function RoomPostprocessing() {
  const theme = useRoomStore((state) => state.theme);
  const mobile = useThree((state) => state.size.width < 720);

  if (theme !== 'dark') return null;

  const resolutionScale = mobile ? 0.35 : 0.5;
  return (
    <EffectComposer
      enableNormalPass={false}
      multisampling={mobile ? 0 : 4}
      resolutionScale={resolutionScale}
    >
      <Bloom
        intensity={0.8}
        luminanceSmoothing={0.2}
        luminanceThreshold={1.05}
        mipmapBlur
        radius={0.68}
        resolutionScale={resolutionScale}
      />
    </EffectComposer>
  );
}

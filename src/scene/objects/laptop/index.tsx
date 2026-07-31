import { LineBox, LinePlane } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

function LaptopKeyboard({ active }: { active: boolean }) {
  return (
    <>
      {Array.from({ length: 7 }, (_, column) =>
        Array.from({ length: 3 }, (_, row) => (
          <LineBox
            key={[column, row].join('-')}
            args={[0.13, 0.025, 0.1]}
            position={[-0.54 + column * 0.18, 0.062, 0.03 + row * 0.14]}
            accent={active ? 'active' : undefined}
          />
        )),
      )}
      <LineBox
        args={[0.48, 0.025, 0.23]}
        position={[0, 0.062, 0.57]}
        accent={active ? 'active' : undefined}
      />
    </>
  );
}

export function Laptop() {
  const interaction = useRoomInteraction('laptop');
  const theme = useRoomStore((state) => state.theme);
  return (
    <group position={[0.45, 2.18, -7.08]} rotation={[0, -0.14, 0]} {...interaction.bind}>
      <LineBox args={[0.98, 0.1, 0.54]} position={[0, 0.09, 0.1]} />
      <LineBox args={[0.12, 0.46, 0.12]} position={[0, 0.34, 0]} />
      <LineBox args={[1.48, 0.08, 0.96]} position={[0, 0.56, 0.08]} rotation={[0.08, 0, 0]} />
      <group position={[0, 0.68, 0.08]}>
        <group rotation={[0.08, 0, 0]}>
          <LineBox
            args={[1.42, 0.08, 0.96]}
            position={[0, 0, 0.28]}
            hovered={interaction.hovered}
          />
          <LaptopKeyboard active={interaction.hovered} />
        </group>
        <group position={[0, 0.015, -0.18]} rotation={[0.3, 0, 0]}>
          <LineBox
            args={[1.36, 0.9, 0.07]}
            position={[0, 0.45, 0]}
            hovered={interaction.hovered}
            accent={interaction.hovered ? 'active' : undefined}
            glow={
              theme === 'dark'
                ? {
                    color: '#c4f1ff',
                    intensity: 1.85,
                    lineWidth: 1.35,
                    opacity: 0.62,
                    scale: 1.01,
                  }
                : undefined
            }
          />
          <LinePlane
            args={[1.18, 0.7]}
            position={[0, 0.45, 0.041]}
            accent={interaction.hovered ? 'active' : undefined}
          />
        </group>
      </group>
    </group>
  );
}

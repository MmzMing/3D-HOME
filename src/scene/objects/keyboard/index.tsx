import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';

export function Keyboard() {
  const interaction = useRoomInteraction('keyboard');
  return (
    <group position={[-2.18, 2.24, -5.98]} rotation={[0, 0.04, 0]} {...interaction.bind}>
      <LineBox
        args={[1.7, 0.1, 0.58]}
        hovered={interaction.hovered}
        accent={interaction.hovered ? 'active' : undefined}
      />
      {Array.from({ length: 6 }, (_, column) =>
        Array.from({ length: 3 }, (_, row) => (
          <LineBox
            key={[column, row].join('-')}
            args={[0.2, 0.025, 0.11]}
            position={[-0.64 + column * 0.26, 0.065, -0.16 + row * 0.17]}
            accent={interaction.hovered ? 'active' : undefined}
          />
        )),
      )}
    </group>
  );
}

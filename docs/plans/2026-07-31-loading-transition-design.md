# Loading Transition Design

## Goal

Make the handoff from the loading screen to the interactive room feel smooth while keeping the WebGL startup path stable and inexpensive.

## Approach

- Keep the room mounted behind the loader so WebGL can initialize without a second mount.
- After assets and the scene report ready, wait for two animation frames before starting the transition. This gives the browser a chance to present a stable room frame first.
- Crossfade the two layers: the room enters over 520 ms with an ease-out curve while the loader exits over 420 ms with an ease-in curve.
- Animate only `opacity` and promote the two transition layers with `will-change` while the handoff is active.
- Remove the loader after its transition finishes so it cannot block interaction or keep an unnecessary compositing layer alive.
- Under `prefers-reduced-motion: reduce`, skip the animated handoff and reveal the room immediately.

## State Flow

1. The room stage starts hidden while the loader is visible.
2. Canvas and scene readiness continue to drive the displayed loading progress.
3. At 100%, the loader schedules the reveal after two animation frames.
4. The room and loader crossfade, then the loader unmounts.

## Verification

- Run type checking, linting, and a production build.
- Inspect desktop and mobile viewports in the browser.
- Confirm the loader unmounts, the room becomes interactive, and reduced-motion styles avoid animation.

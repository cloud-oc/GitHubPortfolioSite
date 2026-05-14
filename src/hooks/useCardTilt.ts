import { useCallback, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

type TiltState = {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
  isActive: boolean;
};

const RESTING_TILT: TiltState = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
  isActive: false
};

export function useCardTilt(maxTilt = 10) {
  const [tilt, setTilt] = useState(RESTING_TILT);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      setTilt({
        rotateX: (0.5 - y) * maxTilt,
        rotateY: (x - 0.5) * maxTilt,
        glareX: x * 100,
        glareY: y * 100,
        isActive: true
      });
    },
    [maxTilt]
  );

  const reset = useCallback(() => setTilt(RESTING_TILT), []);

  return {
    style: {
      "--tilt-x": `${tilt.rotateX.toFixed(2)}deg`,
      "--tilt-y": `${tilt.rotateY.toFixed(2)}deg`,
      "--glare-x": `${tilt.glareX.toFixed(2)}%`,
      "--glare-y": `${tilt.glareY.toFixed(2)}%`
    } as CSSProperties,
    isActive: tilt.isActive,
    handlers: {
      onPointerMove,
      onPointerLeave: reset,
      onPointerCancel: reset
    }
  };
}

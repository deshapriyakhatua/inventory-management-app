"use client";

import { useReducedMotion } from "motion/react";

export const spring = {
  // Critically damped default for ordinary UI transitions.
  default: { type: "spring", bounce: 0, duration: 0.4 },
  // Slight bounce for gesture-driven sheet releases.
  sheet: { type: "spring", bounce: 0.2, duration: 0.3 },
  // Faster critically damped response for small controls.
  snappy: { type: "spring", bounce: 0, duration: 0.3 },
};

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

const slideOffsets = {
  left: { x: -24, y: 0 },
  right: { x: 24, y: 0 },
  top: { x: 0, y: -24 },
  bottom: { x: 0, y: 24 },
};

export function slideFrom(edge = "right") {
  const offset = slideOffsets[edge] ?? slideOffsets.right;

  return {
    initial: { ...offset, opacity: 0 },
    animate: { x: 0, y: 0, opacity: 1 },
    exit: { ...offset, opacity: 0 },
  };
}

export function useMotionPreference() {
  const reducedMotion = Boolean(useReducedMotion());
  const transition = reducedMotion ? { duration: 0.15 } : spring.default;
  const opacityOnlyFade = {
    ...fade,
    transition: { duration: 0.15 },
  };

  return {
    reducedMotion,
    transition,
    fade: { ...fade, transition },
    scaleIn: reducedMotion ? opacityOnlyFade : { ...scaleIn, transition },
    slideFrom: (edge) => reducedMotion
      ? opacityOnlyFade
      : { ...slideFrom(edge), transition },
  };
}

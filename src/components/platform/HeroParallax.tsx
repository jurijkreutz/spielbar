"use client";

import { useEffect } from "react";

export function HeroParallax() {
  useEffect(() => {
    const target = document.querySelector<HTMLElement>(".hero-surface");
    if (!target) {
      return;
    }

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const offset = Math.round(window.scrollY * -0.12);
      target.style.setProperty("--hero-parallax", `${offset}px`);
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      target.style.removeProperty("--hero-parallax");
    };
  }, []);

  return null;
}

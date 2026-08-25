"use client";

import { useEffect, useRef, useState } from "react";

// Animated count-up for stat tiles — purely cosmetic (server-rendered value
// is the real source of truth), gives the dashboard a "live telemetry" feel
// on load instead of numbers just appearing.
export default function StatCounter({ value, prefix = "", suffix = "", duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const start = typeof performance !== "undefined" ? performance.now() : 0;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <>
      {prefix}
      {display.toLocaleString("en-US")}
      {suffix}
    </>
  );
}

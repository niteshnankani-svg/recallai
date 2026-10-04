import { useEffect, useRef } from "react";
import "./styles/CodeRain.css";

// Matrix-style digital rain behind the hero. Faint at rest, intensifies with the
// dive (reads window.__dive, which the 3D scene updates each frame).
const GLYPHS =
  "01010110ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾊﾋﾌﾍﾎ日本0123456789ABCDEF<>/{}[]";

const CodeRain = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fs = window.innerWidth < 768 ? 14 : 18;
    let W = 0, H = 0, cols = 0;
    let drops: number[] = [];
    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      cols = Math.ceil(W / fs);
      drops = new Array(cols).fill(0).map(() => Math.random() * -H);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const draw = () => {
      const dive = Math.min(1, (window as unknown as { __dive?: number }).__dive || 0);
      const intensity = 0.05 + dive * 0.85;
      ctx.fillStyle = `rgba(10,10,15,${0.1 + dive * 0.12})`;
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fs}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        const x = i * fs;
        const y = drops[i];
        ctx.fillStyle =
          Math.random() < 0.1
            ? `rgba(247,168,59,${intensity})`
            : `rgba(45,212,191,${intensity})`;
        ctx.fillText(ch, x, y);
        // lead glyph brighter during dive
        if (dive > 0.15 && Math.random() < 0.04) {
          ctx.fillStyle = `rgba(210,255,245,${intensity})`;
          ctx.fillText(ch, x, y);
        }
        drops[i] += fs * (0.5 + dive * 1.4);
        if (y > H && Math.random() > 0.975) drops[i] = Math.random() * -160;
      }
      raf = requestAnimationFrame(draw);
    };
    if (reduce) {
      ctx.fillStyle = "rgba(45,212,191,0.05)";
      ctx.fillRect(0, 0, W, H);
    } else {
      draw();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="code-rain" data-cursor="disable" aria-hidden />;
};

export default CodeRain;

import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./styles/Cursor.css";

// Reused near-verbatim from the reference Cursor.tsx: a lerp-follow custom cursor
// that reacts to [data-cursor] attributes (disable / icons) on hover.
const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let hover = false;
    const cursor = cursorRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };
    document.addEventListener("mousemove", onMove);

    let raf = requestAnimationFrame(function loop() {
      if (!hover) {
        const delay = 6;
        cursorPos.x += (mousePos.x - cursorPos.x) / delay;
        cursorPos.y += (mousePos.y - cursorPos.y) / delay;
        gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });
      }
      raf = requestAnimationFrame(loop);
    });

    const bind = (element: HTMLElement) => {
      const onOver = (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");
          gsap.to(cursor, { x: rect.left, y: rect.top, duration: 0.1 });
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };
      const onOut = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
      };
      element.addEventListener("mouseover", onOver);
      element.addEventListener("mouseout", onOut);
    };

    document
      .querySelectorAll<HTMLElement>("[data-cursor]")
      .forEach((el) => bind(el));

    // Re-bind for elements added after first paint (sections render immediately,
    // but this keeps parity if the tree changes).
    const observer = new MutationObserver(() => {
      document
        .querySelectorAll<HTMLElement>("[data-cursor]")
        .forEach((el) => {
          if (!el.dataset.cursorBound) {
            el.dataset.cursorBound = "1";
            bind(el);
          }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;

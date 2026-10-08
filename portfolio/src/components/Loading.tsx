import { useEffect } from "react";
import { useLoading } from "../context/LoadingProvider";
import "./styles/Loading.css";

// Loading gate adapted from the reference Loading.tsx. `setProgress` gives the
// 3D scene a simple hook to drive the percentage, and to flip isLoading off once
// the first frame is ready.
let externalDone: (() => void) | null = null;

export const setProgress = (onValue: (v: number) => void) => {
  let value = 0;
  const tick = () => {
    value = Math.min(value + Math.random() * 18, 92);
    onValue(value);
    if (value < 92) setTimeout(tick, 120);
  };
  tick();
  return {
    loaded: () =>
      new Promise<void>((resolve) => {
        onValue(100);
        externalDone?.();
        resolve();
      }),
  };
};

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  useEffect(() => {
    externalDone = () => setTimeout(() => setIsLoading(false), 600);
    return () => {
      externalDone = null;
    };
  }, [setIsLoading]);

  return (
    <div className="loading-screen" data-cursor="disable">
      <div className="loading-inner">
        <div className="loading-mark">NN</div>
        <div className="loading-bar">
          <div
            className="loading-bar-fill"
            style={{ width: `${Math.round(percent)}%` }}
          />
        </div>
        <div className="loading-count">{Math.round(percent)}%</div>
      </div>
    </div>
  );
};

export default Loading;

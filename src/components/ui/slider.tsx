"use client";
import * as React from "react";

type SliderProps = {
  value: [number, number];
  onValueChange: (next: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = "" }: SliderProps) {
  const [minVal, maxVal] = value;

  const percent = (v: number) => ((v - min) / (max - min)) * 100;
  const left = Math.min(100, Math.max(0, percent(minVal)));
  const right = Math.min(100, Math.max(0, percent(maxVal)));

  return (
    <div className={["relative h-8 select-none", className].join(" ")}>
      {/* Track */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded bg-black/10 dark:bg-white/10" />
      {/* Range highlight */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-black/70 dark:bg-white"
        style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
      />

      {/* Min thumb */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={(e) => {
          const nextMin = Math.min(Number(e.target.value), maxVal);
          onValueChange([nextMin, maxVal]);
        }}
        className="absolute left-0 right-0 top-0 bottom-0 w-full appearance-none bg-transparent"
      />
      {/* Max thumb */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={(e) => {
          const nextMax = Math.max(Number(e.target.value), minVal);
          onValueChange([minVal, nextMax]);
        }}
        className="absolute left-0 right-0 top-0 bottom-0 w-full appearance-none bg-transparent"
      />

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: currentColor;
          color: #111;
          border: 2px solid white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.25);
          cursor: pointer;
          margin-top: -8px;
          position: relative;
          z-index: 2;
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: currentColor;
          color: #111;
          border: 2px solid white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.25);
          cursor: pointer;
          position: relative;
          z-index: 2;
        }
        input[type="range"]::-ms-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: currentColor;
          border: 2px solid white;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 1px;
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          height: 1px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}



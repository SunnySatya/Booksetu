import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function CategorySlider({ cat, isActive, onSelect }) {
  const total = cat.slides.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || total <= 1) return undefined;
    const id = setInterval(() => setIdx((i) => (i + 1) % total), 3000);
    return () => clearInterval(id);
  }, [paused, total]);

  const go = (d) => setIdx((i) => (i + d + total) % total);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        onClick={onSelect}
        className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-shadow duration-300 ${
          isActive ? "ring-4 ring-emerald-500 shadow-lg" : "ring-1 ring-gray-200 hover:shadow-xl"
        }`}
      >
        <div className="relative aspect-[4/5]">
          {cat.slides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${cat.name} book ${i + 1}`}
              draggable="false"
              className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-500 ${
                i === idx ? "opacity-100" : "opacity-0 scale-105"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white active:scale-95 transition-all lg:w-8 lg:h-8 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white active:scale-95 transition-all lg:w-8 lg:h-8 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5">
          {cat.slides.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
      <h3
        onClick={onSelect}
        className={`text-center font-bold mt-3 cursor-pointer transition-colors ${
          isActive ? "text-emerald-600" : "text-gray-900"
        }`}
      >
        {cat.name}
      </h3>
    </div>
  );
}

export default CategorySlider;

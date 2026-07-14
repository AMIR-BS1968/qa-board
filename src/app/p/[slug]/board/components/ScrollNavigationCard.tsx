"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { RefObject } from "react";

interface ScrollNavigationCardProps {
  arrowsRef: RefObject<HTMLDivElement | null>;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export function ScrollNavigationCard({
  arrowsRef,
  onScrollLeft,
  onScrollRight,
}: ScrollNavigationCardProps) {
  return (
    <div
      ref={arrowsRef}
      className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-2.5 flex items-center justify-between shadow-md transition duration-150"
    >
      <button
        type="button"
        onClick={onScrollLeft}
        className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-855 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition shadow-sm cursor-pointer active:scale-95 flex items-center justify-center"
        title="Scroll Left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:block">
        {/* Empty space for scroll wheel navigation */}
      </div>

      <button
        type="button"
        onClick={onScrollRight}
        className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-855 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition shadow-sm cursor-pointer active:scale-95 flex items-center justify-center"
        title="Scroll Right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

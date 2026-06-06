import React from 'react';

export function CardSkeleton() {
  return (
    <div className="p-6 md:p-8 rounded-3xl liquid-glass border border-white/5 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        <div className="w-full sm:w-28 md:w-32 h-28 sm:h-32 shrink-0 rounded-xl sm:rounded-2xl bg-white/5" />
        <div className="flex-1 w-full">
          <div className="h-6 bg-white/5 rounded-lg w-3/4 mb-3" />
          <div className="h-4 bg-white/5 rounded-lg w-1/3 mb-4" />
          <div className="h-4 bg-white/5 rounded-lg w-full mb-2" />
          <div className="h-4 bg-white/5 rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function GridCardSkeleton() {
  return (
    <div className="liquid-glass rounded-3xl border border-white/5 overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <div className="h-4 w-16 bg-white/5 rounded-full" />
          <div className="h-4 w-20 bg-white/5 rounded-full" />
        </div>
        <div className="h-5 bg-white/5 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-white/5 rounded-lg w-1/2 mb-4" />
        <div className="h-5 bg-white/5 rounded-lg w-1/4" />
      </div>
    </div>
  );
}

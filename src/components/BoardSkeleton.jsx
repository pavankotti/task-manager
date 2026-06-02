import React from 'react';

export const BoardSkeleton = () => {
  const cols = [1, 2, 3, 4];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      {cols.map(col => (
        <div key={col} className="w-full bg-slate-50/80 rounded-2xl p-5 border border-slate-200 shadow-sm min-h-[400px]">
          <div className="h-5 bg-slate-200 rounded-md w-1/3 mb-6 animate-pulse" />
          <div className="h-32 bg-white rounded-xl mb-3 border border-slate-200 shadow-sm animate-pulse" />
          <div className="h-32 bg-white rounded-xl mb-3 border border-slate-200 shadow-sm animate-pulse" />
        </div>
      ))}
    </div>
  );
};
export default BoardSkeleton;

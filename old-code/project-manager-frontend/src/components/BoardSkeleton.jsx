import React from 'react';

export const BoardSkeleton = () => {
  const cols = [1, 2, 3];
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {cols.map(col => (
        <div key={col} className="w-[350px] flex-shrink-0 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="h-5 bg-gray-200 rounded-md w-1/3 mb-6 animate-pulse" />
          <div className="h-32 bg-white rounded-lg mb-3 border border-gray-200 shadow-sm animate-pulse" />
          <div className="h-32 bg-white rounded-lg mb-3 border border-gray-200 shadow-sm animate-pulse" />
        </div>
      ))}
    </div>
  );
};
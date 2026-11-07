import React from 'react';

export const TaskCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse">
      <div>
        {/* Top Badges Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 rounded-full bg-slate-200" />
          <div className="h-5 w-24 rounded-full bg-slate-200" />
        </div>

        {/* Title Skeleton */}
        <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />

        {/* Description Skeleton */}
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        {/* Member and Action Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="space-y-1">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-2.5 w-14 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-8 w-24 rounded-xl bg-slate-200" />
        </div>

        {/* Date */}
        <div className="mt-3 flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 w-44 rounded bg-slate-200 mb-1.5" />
        <div className="h-3 w-64 rounded bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-3 w-16 rounded bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 w-20 rounded-full bg-slate-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-3 w-28 rounded bg-slate-100" />
      </td>
      <td className="px-6 py-4">
        <div className="h-3 w-28 rounded bg-slate-100" />
      </td>
    </tr>
  );
};


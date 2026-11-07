import React from 'react';
import { CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StatsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export const StatsSummary: React.FC<StatsProps> = ({
  total,
  pending,
  inProgress,
  completed,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Tasks */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total Tasks</span>
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{total}</p>
        <p className="mt-1 text-xs text-slate-400">All registered tasks</p>
      </div>

      {/* Pending */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Pending</span>
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{pending}</p>
        <p className="mt-1 text-xs text-slate-400">Awaiting start</p>
      </div>

      {/* In-Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">In-Progress</span>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-blue-600">{inProgress}</p>
        <p className="mt-1 text-xs text-slate-400">Currently active</p>
      </div>

      {/* Completed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Completed</span>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">{completed}</p>
        <p className="mt-1 text-xs text-slate-400">Finished tasks</p>
      </div>
    </div>
  );
};


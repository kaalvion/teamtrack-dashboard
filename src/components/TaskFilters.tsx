import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { TEAM_MEMBERS } from '../utils/teamConstants';

export interface FilterState {
  member: string;
  status: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
  searchQuery: string;
}

interface TaskFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onChange, onReset }) => {
  const isFiltered =
    filters.member !== 'all' ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.searchQuery.trim() !== '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-center">
        {/* Search bar */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by title, description or keyword..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Member filter */}
        <div className="lg:col-span-3">
          <select
            value={filters.member}
            onChange={(e) => onChange({ ...filters, member: e.target.value })}
            className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
          >
            <option value="all">All Members (4)</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="lg:col-span-2">
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Date range filter */}
        <div className="lg:col-span-2">
          <select
            value={filters.dateRange}
            onChange={(e) =>
              onChange({
                ...filters,
                dateRange: e.target.value as FilterState['dateRange'],
              })
            }
            className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Reset filter button */}
        <div className="flex justify-end lg:col-span-1">
          {isFiltered && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition w-full justify-center"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="lg:hidden">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

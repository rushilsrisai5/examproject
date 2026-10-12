import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  Download,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
  Eye,
  X,
  ChevronDown,
  Layers,
  DoorOpen,
  Sparkles,
  Unlock,
  Lock,
  CheckCircle2,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { AuditLog } from '../types';
import { DatabaseService } from '../services/db';
import { downloadCSV } from '../utils/csvExport';

interface AuditTrailProps {
  initialLogs?: AuditLog[];
  onRefreshParent?: () => Promise<void> | void;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  initialLogs,
  onRefreshParent,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs || []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date>(new Date());
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLog | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('ALL');
  
  // Date Filtering: Range or Quick Presets
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');

  // Sorting
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Load audit logs from Firestore 'audit_logs' collection
  const fetchAuditLogsFromFirestore = async () => {
    setIsLoading(true);
    try {
      const records = await DatabaseService.getAuditLogs();
      setLogs(records);
      setLastFetchedAt(new Date());
      if (onRefreshParent) {
        await onRefreshParent();
      }
    } catch (err) {
      console.error('Failed to load audit logs from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync if parent passes updated logs
  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
    } else {
      fetchAuditLogsFromFirestore();
    }
  }, [initialLogs]);

  // Extract unique users from audit records
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    logs.forEach((log) => {
      const userId = log.performed_by || 'Unknown';
      const userName = log.performed_by_name || log.performed_by || 'Unknown User';
      if (!map.has(userId)) {
        map.set(userId, { id: userId, name: userName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [logs]);

  // Quick Date Preset handler
  const handleDatePresetChange = (preset: 'all' | 'today' | '7days' | '30days' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedUser('ALL');
    setSelectedEntityType('ALL');
    setSelectedActionCategory('ALL');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  // Filtered Logs Evaluation
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // 1. Text Search (action, details, entity_id, user, user_name)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchAction = log.action?.toLowerCase().includes(q);
          const matchDetails = log.details?.toLowerCase().includes(q);
          const matchEntity = log.entity_id?.toLowerCase().includes(q);
          const matchUser = log.performed_by?.toLowerCase().includes(q);
          const matchUserName = log.performed_by_name?.toLowerCase().includes(q);
          if (!matchAction && !matchDetails && !matchEntity && !matchUser && !matchUserName) {
            return false;
          }
        }

        // 2. User Filter
        if (selectedUser !== 'ALL' && log.performed_by !== selectedUser) {
          return false;
        }

        // 3. Entity Type Filter
        if (selectedEntityType !== 'ALL' && log.entity_type !== selectedEntityType) {
          return false;
        }

        // 4. Action Category Filter (Sensitive Operations Groups)
        if (selectedActionCategory !== 'ALL') {
          if (selectedActionCategory === 'ALLOCATION' && !log.action.includes('ALLOCAT')) {
            return false;
          }
          if (selectedActionCategory === 'ATTENDANCE' && !log.action.includes('ATTENDANCE')) {
            return false;
          }
          if (selectedActionCategory === 'EXAMINATION' && !log.action.includes('EXAM') && !log.action.includes('SCHEDULE')) {
            return false;
          }
          if (selectedActionCategory === 'ROOM' && !log.action.includes('ROOM')) {
            return false;
          }
          if (selectedActionCategory === 'SYSTEM' && !log.action.includes('SYSTEM')) {
            return false;
          }
        }

        // 5. Date Filter (Start and End Dates)
        if (startDate || endDate) {
          const logDate = new Date(log.timestamp);
          if (isNaN(logDate.getTime())) return true;
          
          const logDateStr = logDate.toISOString().split('T')[0];

          if (startDate && logDateStr < startDate) {
            return false;
          }
          if (endDate && logDateStr > endDate) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [
    logs,
    searchQuery,
    selectedUser,
    selectedEntityType,
    selectedActionCategory,
    startDate,
    endDate,
    sortDirection,
  ]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = logs.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = logs.filter((l) => l.timestamp && l.timestamp.startsWith(todayStr)).length;
    const allocationCount = logs.filter((l) => l.entity_type === 'allocation' || l.action.includes('ALLOCAT')).length;
    const attendanceCount = logs.filter((l) => l.entity_type === 'attendance' || l.action.includes('ATTENDANCE')).length;
    const usersCount = uniqueUsers.length;

    return { total, todayCount, allocationCount, attendanceCount, usersCount };
  }, [logs, uniqueUsers]);

  // Export current filtered view to CSV
  const handleExportCSV = () => {
    const headers = [
      'Timestamp (ISO)',
      'Timestamp (Formatted)',
      'Action Event Code',
      'Entity Domain',
      'Entity Identifier',
      'Performed By User ID / Email',
      'User Full Name',
      'Operation Details',
    ];

    const rows = filteredLogs.map((log) => [
      log.timestamp,
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.entity_type,
      log.entity_id || 'N/A',
      log.performed_by,
      log.performed_by_name || 'System User',
      log.details,
    ]);

    const dateSuffix = new Date().toISOString().split('T')[0];
    downloadCSV(`ExamNova_Audit_Trail_${dateSuffix}`, [headers, ...rows]);
  };

  // Helper formatting for entity types
  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'allocation':
        return {
          label: 'Allocation',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: <Layers className="w-3 h-3 text-cyan-600" />,
        };
      case 'attendance':
        return {
          label: 'Attendance',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
        };
      case 'examination':
        return {
          label: 'Examination',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Calendar className="w-3 h-3 text-indigo-600" />,
        };
      case 'room':
        return {
          label: 'Hall / Room',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <DoorOpen className="w-3 h-3 text-amber-600" />,
        };
      default:
        return {
          label: 'System',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <ShieldCheck className="w-3 h-3 text-slate-600" />,
        };
    }
  };

  // Helper formatting for sensitive actions
  const getActionBadgeColor = (action: string) => {
    if (action.includes('UNLOCK') || action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('FINALIZED') || action.includes('LOCKED') || action.includes('PUBLISHED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('SMART_ALLOCATION') || action.includes('OPTIMIZER')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('ALLOCATION')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    if (action.includes('EXAM')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <History className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Institutional Activity & Security Audit Trail
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable audit history of sensitive examination operations retrieved directly from Cloud Firestore (<code className="font-mono text-indigo-600 font-semibold">audit_logs</code> collection).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchAuditLogsFromFirestore}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh logs from Cloud Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Refresh from Firestore'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Download currently filtered audit entries as CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered CSV ({filteredLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Logged Ops
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">{stats.total}</span>
              <span className="text-[11px] text-slate-400">events</span>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Today's Actions
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-700 font-mono">{stats.todayCount}</span>
              <span className="text-[11px] text-indigo-600">recorded</span>
            </div>
          </div>

          <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
              Seat Allocations
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-cyan-700 font-mono">{stats.allocationCount}</span>
              <span className="text-[11px] text-cyan-600">operations</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Attendance Records
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700 font-mono">{stats.attendanceCount}</span>
              <span className="text-[11px] text-emerald-600">updates</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Audited Staff
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 font-mono">{stats.usersCount}</span>
              <span className="text-[11px] text-slate-400">actors</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs">
          {/* Top Row: Search, User Filter, Action Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Query */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Search Audit Trail
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by action, entity ID, or keyword..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter by User (Requirement) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Filter by User</span>
                <span className="text-[10px] font-normal text-slate-400">
                  ({uniqueUsers.length} active users)
                </span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Users & Invigilators</option>
                  {uniqueUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter by Entity Domain */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Operation Category
              </label>
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Entity Domains</option>
                <option value="allocation">Seating Allocations</option>
                <option value="attendance">Attendance Records</option>
                <option value="examination">Examinations</option>
                <option value="room">Rooms & Halls</option>
                <option value="system">System & Setup</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Date Filtering (Requirement) */}
          <div className="pt-2 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 font-bold mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date Range:</span>
              </span>
              <button
                type="button"
                onClick={() => handleDatePresetChange('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  datePreset === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange('today')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  datePreset === 'today'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange('7days')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  datePreset === '7days'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleDatePresetChange('30days')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  datePreset === '30days'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            {/* Custom Date Pickers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800"
                />
              </div>

              {(searchQuery || selectedUser !== 'ALL' || selectedEntityType !== 'ALL' || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer ml-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Info Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Connected to Cloud Firestore (<code className="font-mono text-slate-700">audit_logs</code> collection)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
              <strong className="text-slate-800">{logs.length}</strong> events
            </span>
            <button
              onClick={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Sort: {sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Entity Domain</th>
                <th className="px-5 py-3.5">Performed By</th>
                <th className="px-5 py-3.5">Operation Details</th>
                <th className="px-5 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-sm font-bold text-slate-800">
                        No Audit Activity Matches Your Filter
                      </div>
                      <p className="text-xs text-slate-500">
                        No sensitive operations found matching the selected date range, user account, or search keyword.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getEntityBadge(log.entity_type);
                  const actionColor = getActionBadgeColor(log.action);
                  const dateObj = new Date(log.timestamp);
                  const isInvalidDate = isNaN(dateObj.getTime());

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLogForDetails(log)}
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">
                          {isInvalidDate ? log.timestamp : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{isInvalidDate ? '' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Action Event */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block font-mono font-bold text-[11px] px-2.5 py-1 rounded-md border ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Entity Domain */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        {log.entity_id && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]" title={log.entity_id}>
                            id: {log.entity_id}
                          </div>
                        )}
                      </td>

                      {/* Performed By */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0">
                            {(log.performed_by_name || log.performed_by || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[140px]">{log.performed_by_name || 'Administrator'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]" title={log.performed_by}>
                          {log.performed_by}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 text-slate-700 max-w-md">
                        <p className="line-clamp-2 text-xs leading-relaxed font-normal">
                          {log.details}
                        </p>
                      </td>

                      {/* Quick Details Trigger */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForDetails(log);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="View full audit record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Detail Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Audit Log Inspection
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedLogForDetails.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Action Identifier:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${getActionBadgeColor(selectedLogForDetails.action)}`}>
                    {selectedLogForDetails.action}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Entity Domain:</span>
                  <span className="font-bold text-slate-800 uppercase text-[10px]">
                    {selectedLogForDetails.entity_type}
                  </span>
                </div>

                {selectedLogForDetails.entity_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Target Entity ID:</span>
                    <span className="font-mono text-indigo-600">
                      {selectedLogForDetails.entity_id}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedLogForDetails.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-slate-500 font-semibold">Operator / Actor:</div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedLogForDetails.performed_by_name || 'System Administrator'}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  User ID / Email: {selectedLogForDetails.performed_by}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Operation Narrative & Details:
                </label>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedLogForDetails.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { MOCK_ALARMS } from '../constants.tsx';
import { AlertCircle, AlertTriangle, Filter, Trash2, CheckCircle2, Info } from 'lucide-react';

interface AlarmCenterProps {
  siteId: string;
}

const SEVERITY_CONFIG: Record<string, { dot: string; badge: string; icon: React.ReactNode }> = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-600 border border-red-200', icon: <AlertCircle size={13} /> },
  major:    { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 border border-amber-200', icon: <AlertTriangle size={13} /> },
  minor:    { dot: 'bg-blue-400', badge: 'bg-blue-400/10 text-blue-600 border border-blue-200', icon: <Info size={13} /> },
  warning:  { dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 text-yellow-700 border border-yellow-200', icon: <AlertTriangle size={13} /> },
  info:     { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border border-slate-200', icon: <Info size={13} /> },
};

const AlarmCenter: React.FC<AlarmCenterProps> = () => {
  return (
    <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-500">
      <div className="max-w-[1200px] mx-auto p-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Alarm <span className="text-[#0ABAB5]">Center</span></h1>
            <p className="text-xs text-slate-400 mt-1">Critical infrastructure events requiring immediate attention</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#0ABAB5] hover:text-[#0ABAB5] text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              <Filter size={12} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              <Trash2 size={12} /> Clear All
            </button>
          </div>
        </div>

        {/* Alarm List */}
        {MOCK_ALARMS.length > 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {MOCK_ALARMS.map(alarm => {
                const cfg = SEVERITY_CONFIG[alarm.severity] || SEVERITY_CONFIG.info;
                return (
                  <div key={alarm.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${cfg.badge}`}>
                      {cfg.icon} {alarm.severity}
                    </span>
                    <p className="text-[12px] font-semibold text-slate-700 flex-1 min-w-0 truncate">{alarm.message}</p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{alarm.source}</span>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{alarm.time}</span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#0ABAB5] hover:text-[#0ABAB5] text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        Ack
                      </button>
                      <button className="px-3 py-1.5 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#099e9a] transition-all">
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <CheckCircle2 size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-slate-500">No active alarms</p>
            <p className="text-xs text-slate-400 mt-1">Your network environment is currently stable</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmCenter;

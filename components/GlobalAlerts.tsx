import React, { useState, useMemo } from 'react';
import { Bell, AlertCircle, AlertTriangle, Search, Download, Settings, RefreshCw, MapPin, CheckCircle2, Info } from 'lucide-react';
import { MOCK_ALARMS, MOCK_SITES, MOCK_DEVICES } from '../constants.tsx';
import { Site } from '../types';

interface GlobalAlertsProps { sites: Site[]; onSelectSite: (id: string) => void; }

// Map alarm source to siteId by matching device name prefix
const getSiteForAlarm = (source: string) => {
  const dev = MOCK_DEVICES.find(d => source.toLowerCase().includes(d.name.toLowerCase().split('-').slice(0, 2).join('-').toLowerCase()));
  if (dev) return dev.siteId;
  if (source.includes('SJ') || source.includes('WH')) return 'wh-hq';
  if (source.includes('FRA') || source.includes('BJ')) return 'bj-dc';
  if (source.includes('SH') || source.includes('NJ')) return 'nj-branch';
  return 'wh-hq';
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  major: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  minor: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  info: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const GlobalAlerts: React.FC<GlobalAlertsProps> = ({ sites, onSelectSite }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('ALL');
  const [searchText, setSearchText] = useState('');

  // Get device role from alarm source
  const getDeviceRole = (source: string) => {
    const dev = MOCK_DEVICES.find(d => d.name === source);
    return dev?.role || 'Unknown';
  };

  const alarms = useMemo(() => {
    return MOCK_ALARMS.map(a => ({ ...a, siteId: getSiteForAlarm(a.source), role: getDeviceRole(a.source) }));
  }, []);

  const deviceRoles = useMemo(() => {
    const roles = new Set(alarms.map(a => a.role));
    return Array.from(roles).sort();
  }, [alarms]);

  const filtered = useMemo(() => {
    return alarms.filter(a => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter.toLowerCase()) return false;
      if (siteFilter !== 'ALL' && a.siteId !== siteFilter) return false;
      if (deviceTypeFilter !== 'ALL' && a.role !== deviceTypeFilter) return false;
      if (searchText && !a.message.toLowerCase().includes(searchText.toLowerCase()) && !a.source.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [alarms, severityFilter, siteFilter, deviceTypeFilter, searchText]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, major: 0, minor: 0, warning: 0 };
    alarms.forEach(a => { if (c[a.severity] !== undefined) c[a.severity]++; });
    return c;
  }, [alarms]);

  const total = alarms.length;
  const ackCount = alarms.filter(a => a.status === 'cleared').length;
  const ackRate = total > 0 ? Math.round((ackCount / total) * 100) : 0;
  const clearRate = ackRate;

  return (
    <div className="h-full flex flex-col bg-slate-50/50 animate-in fade-in duration-500">
      {/* Top Stats */}
      <div className="px-6 pt-5 pb-4">
        <div className="grid grid-cols-3 gap-4 max-w-[1400px] mx-auto">
          {/* Alarm Level Statistics */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Alarm Level Statistics</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#0ABAB5" strokeWidth="6" strokeDasharray="163" strokeDashoffset={163 * (1 - 1)} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900">{total}</span>
                  <span className="text-[7px] text-slate-400 uppercase font-bold">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1">
                <LevelDot color="bg-red-500" label="Critical" count={counts.critical} total={total} />
                <LevelDot color="bg-amber-500" label="Major" count={counts.major} total={total} />
                <LevelDot color="bg-blue-400" label="Minor" count={counts.minor} total={total} />
                <LevelDot color="bg-yellow-500" label="Warning" count={counts.warning} total={total} />
              </div>
            </div>
          </div>
          {/* Confirmation Rate */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Confirmation Rate</h3>
            <div className="flex justify-center"><MiniRing value={ackRate} color="#0ABAB5" /></div>
          </div>
          {/* Clearance Rate */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4">Clearance Rate</h3>
            <div className="flex justify-center"><MiniRing value={clearRate} color="#f59e0b" /></div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 pb-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-2 flex-wrap">
          {/* Severity filters */}
          {['ALL', 'CRITICAL', 'MAJOR', 'MINOR', 'WARNING'].map(s => {
            const cfg = s === 'ALL' ? null : SEVERITY_CONFIG[s.toLowerCase()];
            const isActive = severityFilter === s;
            return (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  isActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {cfg && <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                {s}
              </button>
            );
          })}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {/* Site filter */}
          <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-600 outline-none">
            <option value="ALL">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={deviceTypeFilter} onChange={e => setDeviceTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-600 outline-none">
            <option value="ALL">All Device Types</option>
            {deviceRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {/* Action buttons */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:border-[#0ABAB5] hover:text-[#0ABAB5] transition-all">
            <CheckCircle2 size={12} /> Ack
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:border-[#0ABAB5] hover:text-[#0ABAB5] transition-all">
            <RefreshCw size={12} /> Synchronize
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:border-[#0ABAB5] hover:text-[#0ABAB5] transition-all">
            <Settings size={12} /> Alarm Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:border-[#0ABAB5] hover:text-[#0ABAB5] transition-all">
            <Download size={12} /> Export
          </button>
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 rounded-lg text-[11px] border border-slate-200 bg-white outline-none w-48 focus:border-[#0ABAB5] transition-all" />
          </div>
        </div>
      </div>

      {/* Alarm Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="max-w-[1400px] mx-auto bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">Severity</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">NE Name</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">Site</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">Alarm Name</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">Ack Status</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">Clear Status</th>
                <th className="text-left py-3 px-4 font-black text-slate-400 uppercase tracking-widest">Raised Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.info;
                const site = MOCK_SITES.find(s => s.id === a.siteId);
                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-medium">s{i + 1}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{a.source}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => site && onSelectSite(site.id)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <MapPin size={10} />{site?.name || '—'}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{a.message}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold ${a.status === 'cleared' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {a.status === 'cleared' ? 'Acknowledged' : 'Unacknowledged'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold ${a.status === 'cleared' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {a.status === 'cleared' ? 'Cleared' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-medium">{a.time}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm">No alarms match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const LevelDot = ({ color, label, count, total }: any) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-sm ${color}`} />
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className="text-[10px] font-black text-slate-800 ml-auto">{count}</span>
    <span className="text-[9px] text-slate-400">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
  </div>
);

const MiniRing = ({ value, color }: { value: number; color: string }) => {
  const r = 30, circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: 76, height: 76 }}>
      <svg width={76} height={76} className="-rotate-90">
        <circle cx={38} cy={38} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <circle cx={38} cy={38} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-black" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

export default GlobalAlerts;

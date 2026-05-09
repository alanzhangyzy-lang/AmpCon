import React, { useState } from 'react';
import { Site } from '../types';
import { 
  Globe, Server, AlertTriangle, ChevronRight,
  ArrowUpRight, ArrowDownRight, Activity, MapPin, Zap,
  SlidersHorizontal, Eye, EyeOff, X
} from 'lucide-react';
import { MOCK_DEVICES, MOCK_ALARMS, PLUGINS } from '../constants.tsx';

interface GlobalDashboardProps { sites: Site[]; onSelectSite: (id: string) => void; }

type WidgetKey = 'kpi' | 'sites' | 'alarms' | 'deviceStatus' | 'deviceRoles' | 'services' | 'models' | 'systemInfo';

const WIDGET_META: { key: WidgetKey; label: string; description: string }[] = [
  { key: 'kpi', label: 'KPI Overview', description: 'Device count, alarms, sites, health' },
  { key: 'sites', label: 'Sites', description: 'All site cards with status' },
  { key: 'alarms', label: 'Recent Alarms', description: 'Latest active alarm feed' },
  { key: 'deviceStatus', label: 'Device Status', description: 'Online/offline breakdown ring' },
  { key: 'deviceRoles', label: 'Device Roles', description: 'Role distribution bar chart' },
  { key: 'services', label: 'Active Services', description: 'Enabled plugins across sites' },
  { key: 'models', label: 'Top Device Models', description: 'Most deployed hardware models' },
  { key: 'systemInfo', label: 'System Info', description: 'Controller version and uptime' },
];

const DEFAULT_VISIBLE: Record<WidgetKey, boolean> = {
  kpi: true, sites: true, alarms: true, deviceStatus: true,
  deviceRoles: true, services: true, models: true, systemInfo: true,
};

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ sites, onSelectSite }) => {
  const [showCustomize, setShowCustomize] = useState(false);
  const [visible, setVisible] = useState<Record<WidgetKey, boolean>>(DEFAULT_VISIBLE);
  const toggleWidget = (key: WidgetKey) => setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  const w = (key: WidgetKey) => visible[key];

  const allDevices = MOCK_DEVICES;
  const total = allDevices.length;
  const online = allDevices.filter(d => d.status === 'online').length;
  const offline = allDevices.filter(d => d.status === 'offline').length;
  const alerting = allDevices.filter(d => d.status === 'provisioning' || d.status === 'pending').length;
  const onlineRate = total > 0 ? Math.round((online / total) * 100) : 0;
  const critAlarms = MOCK_ALARMS.filter(a => a.severity === 'critical').length;
  const majorAlarms = MOCK_ALARMS.filter(a => a.severity === 'major').length;
  const activeAlarms = MOCK_ALARMS.filter(a => a.status === 'active').length;
  const avgHealth = sites.length ? Math.round(sites.reduce((a, s) => a + s.health, 0) / sites.length) : 100;
  const roles: Record<string, number> = {};
  allDevices.forEach(d => { roles[d.role] = (roles[d.role] || 0) + 1; });
  const sortedRoles = Object.entries(roles).sort((a, b) => b[1] - a[1]);
  const maxRole = sortedRoles[0]?.[1] || 1;
  const models: Record<string, number> = {};
  allDevices.forEach(d => { models[d.model] = (models[d.model] || 0) + 1; });
  const topModels = Object.entries(models).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const activePlugins = PLUGINS.filter(p => sites.some(s => s.activePlugins.includes(p.id)));

  return (
    <div className="h-full overflow-auto bg-[#f8fafb]">
      <div className="max-w-[1400px] mx-auto p-6 pb-20 space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global <span className="text-[#0ABAB5]">Dashboard</span></h1>
            <p className="text-xs text-slate-400 mt-1">Real-time overview of your entire network infrastructure</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowCustomize(!showCustomize)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
              showCustomize ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white text-slate-400 border-slate-200 hover:border-[#0ABAB5] hover:text-[#0ABAB5]'
            }`}>
            <SlidersHorizontal size={13} /> Customize
          </button>
          {showCustomize && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCustomize(false)} />
              <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Dashboard Widgets</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toggle sections to customize your view</p>
                  </div>
                  <button onClick={() => setShowCustomize(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <div className="p-3 space-y-1 max-h-[400px] overflow-auto">
                  {WIDGET_META.map(wm => (
                    <button key={wm.key} onClick={() => toggleWidget(wm.key)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${visible[wm.key] ? 'bg-[#0ABAB5]/5' : 'hover:bg-slate-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${visible[wm.key] ? 'bg-[#0ABAB5] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {visible[wm.key] ? <Eye size={14} /> : <EyeOff size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold ${visible[wm.key] ? 'text-slate-800' : 'text-slate-400'}`}>{wm.label}</p>
                        <p className="text-[9px] text-slate-400 truncate">{wm.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-slate-100 flex justify-between">
                  <button onClick={() => setVisible(DEFAULT_VISIBLE)} className="text-[10px] font-bold text-slate-400 hover:text-[#0ABAB5] uppercase tracking-widest">Reset All</button>
                  <button onClick={() => setShowCustomize(false)} className="text-[10px] font-bold text-[#0ABAB5] uppercase tracking-widest">Done</button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>

        {/* Row 1: KPI Cards */}
        {w('kpi') && (
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Total Devices" value={total} sub={`${online} online · ${offline} offline`} icon={<Server size={18} />} accent="#0ABAB5" trend={`${onlineRate}% uptime`} trendUp />
            <KpiCard label="Active Alarms" value={activeAlarms} sub={`${critAlarms} critical · ${majorAlarms} major`} icon={<AlertTriangle size={18} />} accent={critAlarms > 0 ? '#ef4444' : '#f59e0b'} trend={critAlarms > 0 ? 'Needs attention' : 'Stable'} trendUp={critAlarms === 0} />
            <KpiCard label="Sites" value={sites.length} sub={`${sites.filter(s => s.siteType === 'Campus').length} campus · ${sites.filter(s => s.siteType === 'DataCenter').length} data center`} icon={<Globe size={18} />} accent="#3b82f6" trend="All connected" trendUp />
            <KpiCard label="Platform Health" value={`${avgHealth}%`} sub="Weighted average" icon={<Activity size={18} />} accent={avgHealth >= 95 ? '#10b981' : '#f59e0b'} trend={avgHealth >= 95 ? 'Excellent' : 'Good'} trendUp={avgHealth >= 90} />
          </div>
        )}

        {/* Row 2: Sites + Alarms — fixed 12-col grid */}
        {(w('sites') || w('alarms')) && (
          <div className="grid grid-cols-12 gap-4">
            {w('sites') && (
              <div className={w('alarms') ? 'col-span-8' : 'col-span-12'}>
                <SectionLabel>Sites</SectionLabel>
                <div className="mt-3 space-y-2.5">
                  {sites.map(site => {
                    const sd = allDevices.filter(d => d.siteId === site.id);
                    const so = sd.filter(d => d.status === 'online').length;
                    const sa = MOCK_ALARMS.filter(a => { const dev = allDevices.find(d => a.source.toLowerCase().includes(d.name.toLowerCase().split('-').slice(0, 2).join('-').toLowerCase())); return dev?.siteId === site.id; });
                    const pl = PLUGINS.filter(p => site.activePlugins.includes(p.id));
                    return (
                      <button key={site.id} onClick={() => onSelectSite(site.id)}
                        className="w-full bg-white border border-slate-200/80 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-[#0ABAB5]/30 transition-all text-left group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${site.health >= 95 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                              <MapPin size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-slate-800 group-hover:text-[#0ABAB5] transition-colors truncate">{site.name}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded flex-shrink-0">{site.siteType}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">{site.location}, {site.country}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 flex-shrink-0">
                            <MiniStat label="Devices" value={sd.length} sub={`${so} up`} />
                            <MiniStat label="Alarms" value={sa.filter(a => a.status === 'active').length} sub={sa.some(a => a.severity === 'critical') ? 'critical' : 'stable'} warn={sa.some(a => a.severity === 'critical')} />
                            <MiniStat label="Health" value={`${site.health}%`} sub="" />
                            <div className="flex items-center gap-1">
                              {pl.slice(0, 4).map(p => (
                                <div key={p.id} className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: p.color + '15', color: p.color }}><Zap size={9} /></div>
                              ))}
                              {pl.length > 4 && <span className="text-[8px] text-slate-400 font-bold">+{pl.length - 4}</span>}
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-[#0ABAB5]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {w('alarms') && (
              <div className={w('sites') ? 'col-span-4' : 'col-span-12'}>
                <SectionLabel>Recent Alarms</SectionLabel>
                <div className="mt-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {MOCK_ALARMS.filter(a => a.status === 'active').slice(0, 6).map(alarm => {
                      const sc = alarm.severity === 'critical' ? 'bg-red-500' : alarm.severity === 'major' ? 'bg-amber-500' : alarm.severity === 'minor' ? 'bg-blue-400' : 'bg-yellow-400';
                      return (
                        <div key={alarm.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sc}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-slate-700 leading-snug truncate">{alarm.message}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{alarm.source} · {alarm.time.split(' ')[1]}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {activeAlarms > 6 && (
                    <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-[#0ABAB5]">View all {activeAlarms} alarms →</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 3: Device Status + Roles + Services — equal height */}
        {(w('deviceStatus') || w('deviceRoles') || w('services')) && (
          <div className="grid grid-cols-12 gap-4">
            {w('deviceStatus') && (
              <div className="col-span-4">
                <SectionLabel>Device Status</SectionLabel>
                <div className="mt-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-center mb-4">
                    <Ring value={onlineRate} size={110} sw={9} color="#0ABAB5" />
                  </div>
                  <div className="space-y-2">
                    <StatusRow dot="bg-emerald-500" label="Online" count={online} total={total} />
                    <StatusRow dot="bg-slate-300" label="Offline" count={offline} total={total} />
                    <StatusRow dot="bg-amber-500" label="Provisioning" count={alerting} total={total} />
                  </div>
                </div>
              </div>
            )}
            {w('deviceRoles') && (
              <div className="col-span-4">
                <SectionLabel>Device Roles</SectionLabel>
                <div className="mt-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="space-y-2.5">
                    {sortedRoles.map(([role, count], i) => {
                      const colors = ['#0ABAB5', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6'];
                      const c = colors[i % colors.length];
                      return (
                        <div key={role}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-500">{role}</span>
                            <span className="text-[11px] font-bold text-slate-700">{count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxRole) * 100}%`, backgroundColor: c }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {w('services') && (
              <div className="col-span-4">
                <SectionLabel>Active Services</SectionLabel>
                <div className="mt-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="space-y-1.5">
                    {activePlugins.map(p => {
                      const dc = allDevices.filter(d => d.pluginType === p.id).length;
                      const sc = sites.filter(s => s.activePlugins.includes(p.id)).length;
                      return (
                        <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: p.color + '15', color: p.color }}><Zap size={11} /></div>
                            <div>
                              <p className="text-[11px] font-semibold text-slate-700 leading-none">{p.name}</p>
                              <p className="text-[9px] text-slate-400">{sc} site{sc > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">{dc} NE</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 4: Models + System Info — equal 2-col */}
        {(w('models') || w('systemInfo')) && (
          <div className="grid grid-cols-12 gap-4">
            {w('models') && (
              <div className="col-span-6">
                <SectionLabel>Top Device Models</SectionLabel>
                <div className="mt-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="space-y-3">
                    {topModels.map(([model, count], i) => {
                      const pct = Math.round((count / total) * 100);
                      const colors = ['#0ABAB5', '#6366f1', '#f59e0b', '#ec4899', '#10b981'];
                      return (
                        <div key={model}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: colors[i] }}>{i + 1}</span>
                              <span className="text-[11px] font-semibold text-slate-700">{model}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-800">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {w('systemInfo') && (
              <div className="col-span-6">
                <SectionLabel>System Info</SectionLabel>
                <div className="mt-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="space-y-2.5">
                    <InfoRow label="Controller" value="AmpCon OS v2.5.0-LTS" />
                    <InfoRow label="Uptime" value="142 days" />
                    <InfoRow label="Last Backup" value="2026-03-21 02:00" />
                    <InfoRow label="API Status" value="Healthy" valueColor="text-emerald-500" />
                    <InfoRow label="NTP Sync" value="time.google.com" />
                    <InfoRow label="Total Managed NE" value={String(total)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!Object.values(visible).some(Boolean) && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <EyeOff size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-bold">All widgets are hidden</p>
            <p className="text-xs text-slate-400 mt-1">Click "Customize" to enable widgets</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{children}</p>
);

const KpiCard = ({ label, value, sub, icon, accent, trend, trendUp }: {
  label: string; value: string | number; sub: string; icon: React.ReactNode; accent: string; trend: string; trendUp: boolean;
}) => {
  // Generate a fake sparkline
  const points = Array.from({length: 12}, (_, i) => {
    const base = trendUp ? 30 + i * 2 : 50 - i * 1.5;
    return base + (Math.sin(i * 1.3) * 8) + (Math.random() * 5);
  });
  const max = Math.max(...points), min = Math.min(...points);
  const h = 32, w = 100;
  const d = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min || 1)) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaD = d + ` L${w},${h} L0,${h} Z`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + '12', color: accent }}>{icon}</div>
        <div className="flex items-center gap-1">
          {trendUp ? <ArrowUpRight size={12} className="text-emerald-500" /> : <ArrowDownRight size={12} className="text-amber-500" />}
          <span className={`text-[10px] font-semibold ${trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>{trend}</span>
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
      <svg className="absolute bottom-0 right-0 opacity-30" width={w + 10} height={h + 10} viewBox={`-5 -5 ${w + 10} ${h + 10}`}>
        <path d={areaD} fill={accent} opacity="0.1" />
        <path d={d} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const MiniStat = ({ label, value, sub, warn }: { label: string; value: string | number; sub: string; warn?: boolean }) => (
  <div className="text-center min-w-[50px]">
    <p className={`text-sm font-bold ${warn ? 'text-red-500' : 'text-slate-800'}`}>{value}</p>
    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</p>
    {sub && <p className={`text-[8px] ${warn ? 'text-red-400' : 'text-slate-300'}`}>{sub}</p>}
  </div>
);

const StatusRow = ({ dot, label, count, total }: { dot: string; label: string; count: number; total: number }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-slate-700">{count}</span>
      <span className="text-[9px] text-slate-400">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
    </div>
  </div>
);

const InfoRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
    <span className="text-[11px] text-slate-400">{label}</span>
    <span className={`text-[11px] font-semibold ${valueColor || 'text-slate-700'}`}>{value}</span>
  </div>
);

const Ring = ({ value, size, sw, color }: { value: number; size: number; sw: number; color: string }) => {
  const r = (size - sw) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-800">{value}%</span>
        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Online</span>
      </div>
    </div>
  );
};

export default GlobalDashboard;

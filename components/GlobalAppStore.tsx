import React, { useState } from 'react';
import { PLUGINS, getIcon } from '../constants.tsx';
import { PluginID } from '../types';
import { 
  Zap, Wifi, WifiOff, AlertTriangle, CheckCircle2, Clock, ArrowUpCircle,
  RefreshCw, Upload, X, FileText, ChevronDown, ChevronUp, Server, Trash2, Shield, Package, Globe
} from 'lucide-react';

interface GlobalAppStoreProps {
  subscribedPlugins: PluginID[];
  onSubscribe: (id: PluginID) => void;
}

const VERSIONS: Record<string, { installed: string; cloud: string; releaseDate: string }> = {
  'campus-network': { installed: 'v2.4.0', cloud: 'v2.6.0', releaseDate: '2026-03-25' },
  'security-surveillance': { installed: 'v2.1.0', cloud: 'v2.1.0', releaseDate: '2026-03-10' },
  'aidc-network': { installed: 'v2.2.0', cloud: 'v2.4.0', releaseDate: '2026-04-01' },
  'idc-network': { installed: 'v2.4.0', cloud: 'v2.6.1', releaseDate: '2026-03-28' },
  'transport-network': { installed: 'v2.1.0', cloud: 'v2.3.0', releaseDate: '2026-03-22' },
};

const RELEASE_NOTES: Record<string, { version: string; date: string; notes: string[] }[]> = {
  'campus-network': [
    { version: 'v2.6.0', date: '2026-03-25', notes: ['AI-based anomaly detection for wired ports', 'Improved VXLAN overlay stability', 'Fixed DHCP relay on stacked switches'] },
    { version: 'v2.5.1', date: '2026-03-05', notes: ['Hotfix for STP convergence timeout', 'Improved AP roaming handoff'] },
    { version: 'v2.5.0', date: '2026-02-10', notes: ['Fabric LAN orchestration support', 'VLAN/Port management overhaul'] },
    { version: 'v2.4.0', date: '2026-01-15', notes: ['Wireless AI optimization beta', 'New dashboard KPI widgets'] },
  ],
  'security-surveillance': [
    { version: 'v2.1.0', date: '2026-03-10', notes: ['4K live view optimization', 'Motion zone configuration', 'Recording policy engine'] },
    { version: 'v2.0.0', date: '2026-01-20', notes: ['Major UI redesign', 'AI detection engine v2'] },
  ],
  'aidc-network': [
    { version: 'v2.4.0', date: '2026-04-01', notes: ['GPU cluster auto-discovery', 'NCCL traffic optimization', 'PFC storm protection'] },
    { version: 'v2.3.0', date: '2026-03-18', notes: ['RoCE v2 lossless fabric', 'PFC/ECN auto-tuning'] },
    { version: 'v2.2.0', date: '2026-02-05', notes: ['Basic RDMA flow monitoring', 'ECN marking policy'] },
  ],
  'idc-network': [
    { version: 'v2.6.1', date: '2026-03-28', notes: ['Critical BGP graceful restart fix', 'ECMP entropy for elephant flows', 'VNI batch provisioning API'] },
    { version: 'v2.6.0', date: '2026-03-15', notes: ['Multi-tenant VRF isolation', 'EVPN Type-5 routes', 'Fabric-wide config rollback'] },
    { version: 'v2.5.0', date: '2026-02-15', notes: ['Spine-Leaf fabric automation', 'VXLAN EVPN multi-tenancy'] },
    { version: 'v2.4.0', date: '2026-01-10', notes: ['BGP underlay auto-provisioning', 'Leaf port orchestration'] },
  ],
  'transport-network': [
    { version: 'v2.3.0', date: '2026-03-22', notes: ['AI wavelength path optimization', 'ROADM auto-provisioning', 'OTN alarm correlation'] },
    { version: 'v2.2.0', date: '2026-02-01', notes: ['OTN topology management', 'Wavelength map visualization'] },
    { version: 'v2.1.0', date: '2026-01-05', notes: ['Initial OTN device onboarding', 'WDM channel monitoring'] },
  ],
};

const PLATFORM = {
  name: 'AmpCon OS', installed: 'v2.5.0-LTS', cloud: 'v2.6.0-LTS', releaseDate: '2026-03-30',
  minAppVersions: { 'campus-network': 'v2.5.0', 'security-surveillance': 'v2.0.0', 'aidc-network': 'v2.3.0', 'idc-network': 'v2.5.0', 'transport-network': 'v2.2.0' } as Record<string, string>,
  releaseNotes: ['Kernel upgrade to 6.8 LTS', 'Sub-second HA failover', 'Database engine 40% faster', 'TLS 1.3 enforced', 'API gateway rate limiting'],
};

const ACTIVE_DEVICES: Record<string, number> = {
  'campus-network': 11, 'security-surveillance': 2, 'aidc-network': 0, 'idc-network': 20, 'transport-network': 6,
};

const GlobalAppStore: React.FC<GlobalAppStoreProps> = ({ subscribedPlugins }) => {
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [showPlatformNotes, setShowPlatformNotes] = useState(false);
  const [uninstallTarget, setUninstallTarget] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ appId: string; version: string } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  // Staged offline packages: appId -> { version, filename }
  const [stagedPackages, setStagedPackages] = useState<Record<string, { version: string; filename: string }>>({});

  const getAvailable = (id: string) => {
    if (stagedPackages[id]) return stagedPackages[id].version;
    if (isOnline) return VERSIONS[id]?.cloud || VERSIONS[id]?.installed;
    return null;
  };

  const appsWithUpdate = PLUGINS.filter(p => {
    const avail = getAvailable(p.id);
    return avail && avail !== VERSIONS[p.id]?.installed;
  });

  const handleStagePackage = () => {
    // Mock: simulate uploading a package
    setStagedPackages(prev => ({ ...prev, 'campus-network': { version: 'v2.6.0', filename: 'campus-network-v2.6.0.ampkg' } }));
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafb] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 pt-6 pb-4">
        <div className="max-w-[1200px] mx-auto flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-[#0ABAB5]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0ABAB5]">APP Center</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Upgrade Management</h1>
          </div>
          <div className="flex items-center gap-5">
            {/* Network Status Toggle */}
            <button onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
              {isOnline ? <><Wifi size={14} /> Cloud Connected</> : <><WifiOff size={14} /> Offline Mode</>}
            </button>
            <div className="text-center border-l border-slate-700 pl-5">
              <p className="text-xl font-black">{appsWithUpdate.length}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto max-w-[1200px] mx-auto w-full p-6 space-y-3">

        {/* Network Status Banner */}
        {isOnline ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
            <Wifi size={14} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] text-emerald-700 flex-1"><span className="font-bold">Connected</span> — Latest versions fetched from cloud. You can also upload offline packages.</p>
            <button className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors"><RefreshCw size={12} /> Refresh</button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
            <WifiOff size={14} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 flex-1"><span className="font-bold">Offline</span> — Cannot reach cloud repository. Upload .ampkg packages to stage upgrades.</p>
          </div>
        )}

        {/* Upload Zone (always visible, more prominent when offline) */}
        <div className={`border-2 border-dashed rounded-xl text-center transition-all cursor-pointer group ${
          isOnline ? 'border-slate-200 p-3 hover:border-[#0ABAB5]' : 'border-amber-300 bg-amber-50/30 p-5 hover:border-amber-400'
        }`} onClick={handleStagePackage}>
          <div className="flex items-center justify-center gap-3">
            <Upload size={isOnline ? 16 : 20} className={`${isOnline ? 'text-slate-300 group-hover:text-[#0ABAB5]' : 'text-amber-400'} transition-colors`} />
            <div className="text-left">
              <p className={`font-bold ${isOnline ? 'text-xs text-slate-500' : 'text-sm text-slate-700'}`}>
                {isOnline ? 'Upload offline package (.ampkg)' : 'Drop or click to upload upgrade package'}
              </p>
              <p className="text-[10px] text-slate-400">Supports platform OS and app packages. Auto-detected on upload.</p>
            </div>
          </div>
          {Object.keys(stagedPackages).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {Object.entries(stagedPackages).map(([id, pkg]: [string, { version: string; filename: string }]) => {
                const p = PLUGINS.find(pl => pl.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#0ABAB5]/30 rounded-lg text-[10px] font-bold text-[#0ABAB5]">
                    <Package size={12} /> {p?.name} → {pkg.version}
                    <button onClick={e => { e.stopPropagation(); setStagedPackages(prev => { const n = {...prev}; delete n[id]; return n; }); }} className="text-slate-400 hover:text-red-500 ml-1"><X size={10} /></button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform OS */}
        <div className={`bg-white border rounded-xl transition-all ${PLATFORM.installed !== PLATFORM.cloud && isOnline ? 'border-indigo-200' : 'border-slate-200'}`}>
          <div className="px-5 py-3.5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Server size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-900">{PLATFORM.name}</h4>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[7px] font-black uppercase rounded border border-indigo-100">Platform</span>
              </div>
              <p className="text-[10px] text-slate-400">Installed: <span className="font-mono font-bold text-slate-600">{PLATFORM.installed}</span></p>
            </div>
            <div className="text-right shrink-0 mr-2">
              {isOnline ? (
                <><p className="text-[9px] text-slate-400">Cloud Latest</p><p className={`text-xs font-black font-mono ${PLATFORM.installed !== PLATFORM.cloud ? 'text-indigo-600' : 'text-emerald-600'}`}>{PLATFORM.cloud}</p></>
              ) : (
                <><p className="text-[9px] text-slate-400">Cloud</p><p className="text-[10px] text-slate-300 italic">Unavailable</p></>
              )}
            </div>
            {PLATFORM.installed !== PLATFORM.cloud && isOnline ? (
              <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all shrink-0"><ArrowUpCircle size={12} /> Upgrade OS</button>
            ) : (
              <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100 shrink-0"><CheckCircle2 size={12} /> Current</span>
            )}
            <button onClick={() => setShowPlatformNotes(!showPlatformNotes)} className="p-1.5 text-slate-400 hover:text-slate-600 shrink-0">
              {showPlatformNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          {showPlatformNotes && (
            <div className="border-t border-slate-100 px-5 py-4 animate-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><FileText size={12} className="inline mr-1" />Release Notes — {PLATFORM.cloud}</h5>
                  <ul className="space-y-1">{PLATFORM.releaseNotes.map((n, i) => <li key={i} className="text-[11px] text-slate-600 flex items-start gap-2"><span className="text-indigo-500 mt-0.5">•</span> {n}</li>)}</ul>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Shield size={12} className="inline mr-1" />Min App Versions Required</h5>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5">
                    {Object.entries(PLATFORM.minAppVersions).map(([id, minVer]) => {
                      const p = PLUGINS.find(pl => pl.id === id);
                      const cur = VERSIONS[id]?.installed || '—';
                      const ok = cur >= minVer;
                      return <div key={id} className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-600">{p?.name}</span><div className="flex items-center gap-2"><span className="text-[9px] font-mono text-slate-400">≥ {minVer}</span>{ok ? <CheckCircle2 size={12} className="text-emerald-500" /> : <AlertTriangle size={12} className="text-amber-500" />}</div></div>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-200" />
        {appsWithUpdate.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Installed Apps</p>
            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0ABAB5] text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-[#099e9a] active:scale-95 transition-all">
              <RefreshCw size={12} /> Upgrade All ({appsWithUpdate.length})
            </button>
          </div>
        )}
        {!appsWithUpdate.length && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Installed Apps</p>}

        {/* App List */}
        {PLUGINS.filter(p => subscribedPlugins.includes(p.id)).map(plugin => {
          const ver = VERSIONS[plugin.id];
          if (!ver) return null;
          const available = getAvailable(plugin.id);
          const hasUpdate = available && available !== ver.installed;
          const staged = stagedPackages[plugin.id];
          const isExpanded = expandedApp === plugin.id;
          const releases = RELEASE_NOTES[plugin.id] || [];

          return (
            <div key={plugin.id} className={`bg-white border rounded-xl transition-all ${isExpanded ? 'shadow-md border-[#0ABAB5]/30' : 'border-slate-200 hover:shadow-sm'}`}>
              <div className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: plugin.color + '15', color: plugin.color }}>
                  {getIcon(plugin.icon, 18)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-900">{plugin.name}</h4>
                  <p className="text-[10px] text-slate-400">Installed: <span className="font-mono font-bold text-slate-600">{ver.installed}</span></p>
                </div>

                {/* Available version info */}
                <div className="text-right shrink-0 mr-1">
                  {staged ? (
                    <><p className="text-[9px] text-slate-400">Staged</p><p className="text-xs font-black font-mono text-[#0ABAB5]">{staged.version}</p></>
                  ) : isOnline ? (
                    <><p className="text-[9px] text-slate-400">Cloud</p><p className={`text-xs font-black font-mono ${hasUpdate ? 'text-amber-600' : 'text-emerald-600'}`}>{ver.cloud}</p></>
                  ) : (
                    <><p className="text-[9px] text-slate-400">Cloud</p><p className="text-[10px] text-slate-300 italic">N/A</p></>
                  )}
                </div>

                {/* Action */}
                {hasUpdate ? (
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-[9px] font-black uppercase rounded-lg shadow-sm hover:bg-amber-600 active:scale-95 transition-all shrink-0">
                    <ArrowUpCircle size={12} /> {staged ? 'Apply' : 'Upgrade'}
                  </button>
                ) : !isOnline && !staged ? (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-400 text-[9px] font-black uppercase rounded-lg border border-slate-200 shrink-0">
                    <Upload size={12} /> Upload
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100 shrink-0">
                    <CheckCircle2 size={12} /> Current
                  </span>
                )}

                <button onClick={() => setUninstallTarget(plugin.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0" title="Uninstall"><Trash2 size={14} /></button>
                <button onClick={() => setExpandedApp(isExpanded ? null : plugin.id)} className="p-1.5 text-slate-400 hover:text-slate-600 shrink-0">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Release Notes */}
              {isExpanded && releases.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-4 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Version History</h5>
                    <span className="text-[9px] text-slate-400">Installed: <span className="font-mono font-bold text-slate-600">{ver.installed}</span></span>
                  </div>
                  <div className="space-y-3">
                    {releases.map((rel, idx) => {
                      const isInstalled = rel.version === ver.installed;
                      const isNewer = rel.version > ver.installed;
                      const isLatest = rel.version === ver.cloud;
                      // Find the index of the installed version
                      const installedIdx = releases.findIndex(r => r.version === ver.installed);
                      // The version right after installed in the list (one version older) is the downgrade target
                      const isDowngradeTarget = installedIdx >= 0 && idx === installedIdx + 1;
                      // Check if downgrade is blocked by platform min version requirement
                      const platformMinVer = PLATFORM.minAppVersions[plugin.id];
                      const downgradeBlocked = isDowngradeTarget && platformMinVer && rel.version < platformMinVer;

                      return (
                        <div key={rel.version} className={`pl-4 border-l-2 ${isInstalled ? 'border-emerald-400 bg-emerald-50/30 rounded-r-lg pr-3 py-2 -ml-px' : isNewer ? 'border-[#0ABAB5]' : isDowngradeTarget ? 'border-amber-300 opacity-100' : 'border-slate-200 opacity-50'}`}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-black font-mono ${isLatest && isNewer ? 'text-[#0ABAB5]' : isInstalled ? 'text-emerald-600' : isDowngradeTarget ? 'text-amber-600' : 'text-slate-600'}`}>{rel.version}</span>
                            {isLatest && isNewer && <span className="px-1.5 py-0.5 bg-[#0ABAB5]/10 text-[#0ABAB5] text-[7px] font-black uppercase rounded border border-[#0ABAB5]/20">Latest</span>}
                            {isInstalled && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[7px] font-black uppercase rounded">Installed</span>}
                            {isNewer && !isLatest && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[7px] font-black uppercase rounded border border-amber-100">Available</span>}
                            {isDowngradeTarget && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[7px] font-black uppercase rounded">Previous</span>}
                            <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> {rel.date}</span>
                            {isNewer && isOnline && (
                              <button className={`ml-auto px-3 py-1 rounded-md text-[8px] font-black uppercase ${isLatest ? 'bg-[#0ABAB5] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                Upgrade to {rel.version}
                              </button>
                            )}
                            {isDowngradeTarget && !downgradeBlocked && (
                              <button onClick={() => setRollbackTarget({ appId: plugin.id, version: rel.version })}
                                className="ml-auto px-3 py-1 rounded-md text-[8px] font-black uppercase bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors">
                                ↩ Downgrade
                              </button>
                            )}
                            {isDowngradeTarget && downgradeBlocked && (
                              <span className="ml-auto px-3 py-1 rounded-md text-[8px] font-black uppercase bg-red-50 text-red-400 border border-red-100 flex items-center gap-1" title={`Platform requires ≥ ${platformMinVer}`}>
                                <AlertTriangle size={10} /> Blocked by OS
                              </span>
                            )}
                          </div>
                          {isDowngradeTarget && downgradeBlocked && (
                            <p className="text-[9px] text-red-400 mt-1">Current platform ({PLATFORM.installed}) requires this app ≥ {platformMinVer}. Downgrade the platform first.</p>
                          )}
                          <ul className="space-y-0.5">{rel.notes.map((n, i) => <li key={i} className="text-[11px] text-slate-600 flex items-start gap-2"><span className="text-[#0ABAB5] mt-0.5">•</span> {n}</li>)}</ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Downgrade Modal */}
      {rollbackTarget && (() => {
        const plugin = PLUGINS.find(p => p.id === rollbackTarget.appId);
        const ver = VERSIONS[rollbackTarget.appId];
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Downgrade {plugin?.name}</h3>
                <button onClick={() => setRollbackTarget(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="px-6 py-5">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
                  <p className="text-xs font-bold text-amber-800 mb-2">Downgrade Confirmation</p>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-bold text-slate-600">{ver?.installed}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-xs font-mono font-bold text-amber-600">{rollbackTarget.version}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mb-2">This will:</p>
                  <ul className="space-y-1 text-[11px] text-amber-700">
                    <li>• Restore the previous version from pre-upgrade snapshot</li>
                    <li>• Revert configuration changes made after the upgrade</li>
                    <li>• Briefly interrupt service during downgrade (~30s)</li>
                  </ul>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-600">Downgrade Rules</p>
                  <ul className="space-y-1 text-[10px] text-slate-500">
                    <li>• Only one version back — snapshot is retained from last upgrade only</li>
                    <li>• Platform min-version constraints are enforced — if the OS requires this app ≥ a certain version, downgrade is blocked until the OS is downgraded first</li>
                    <li>• Cross-version downgrade is not supported due to DB schema migration</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRollbackTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50">Cancel</button>
                  <button onClick={() => setRollbackTarget(null)} className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-amber-600 active:scale-95 flex items-center justify-center gap-2">
                    ↩ Confirm Downgrade
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Uninstall Modal */}
      {uninstallTarget && (() => {
        const plugin = PLUGINS.find(p => p.id === uninstallTarget);
        const activeCount = ACTIVE_DEVICES[uninstallTarget] || 0;
        const canUninstall = activeCount === 0;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Uninstall {plugin?.name}</h3>
                <button onClick={() => setUninstallTarget(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="px-6 py-5">
                {canUninstall ? (
                  <>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
                      <p className="text-xs font-bold text-amber-800 mb-1">Are you sure?</p>
                      <p className="text-[11px] text-amber-700">This removes {plugin?.name} and all configuration. Cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setUninstallTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50">Cancel</button>
                      <button onClick={() => setUninstallTarget(null)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-600 active:scale-95 flex items-center justify-center gap-2"><Trash2 size={12} /> Uninstall</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-red-500" /><p className="text-xs font-black text-red-800">Cannot Uninstall — Active Business</p></div>
                      <p className="text-[11px] text-red-700 mb-3"><span className="font-black">{activeCount} devices</span> are running services managed by this app.</p>
                      <div className="bg-white border border-red-100 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-slate-700 mb-1">Required before uninstall:</p>
                        <ul className="space-y-1">
                          <li className="text-[10px] text-slate-600">1. Migrate or decommission all {activeCount} managed devices</li>
                          <li className="text-[10px] text-slate-600">2. Remove all site bindings for this app</li>
                          <li className="text-[10px] text-slate-600">3. Clear active policies referencing this app</li>
                        </ul>
                      </div>
                    </div>
                    <button onClick={() => setUninstallTarget(null)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50">Understood</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GlobalAppStore;

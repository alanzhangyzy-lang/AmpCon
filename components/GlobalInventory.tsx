
import React, { useState, useMemo } from 'react';
import { Search, Plus, Server, Wifi, MapPin, LayoutGrid, Network, Globe, Scan, RefreshCw, X, Loader2, Zap, Activity, Download, Radio, Video, Cpu, HardDrive } from 'lucide-react';
import { MOCK_DEVICES, MOCK_SITES, PLUGINS } from '../constants.tsx';
import { Device, PluginID } from '../types';
import DeviceDetailDrawer from './DeviceDetailDrawer';

interface GlobalInventoryProps {
  onSelectSite: (id: string) => void;
  siteId?: string; // If provided, only show devices for this site
}

type AdoptionMethod = 'discovery' | 'sn' | 'ip';

const DISCOVERED_DEVICES = [
  { id: 'disc-1', model: 'AmpX-Acc-48P', mac: 'FC:FB:22:33:AA:01', tempIp: '192.168.1.102', type: 'switching' },
  { id: 'disc-2', model: 'Uni-WiFi-7', mac: 'FC:FB:22:33:BB:05', tempIp: '192.168.1.105', type: 'wireless' },
  { id: 'disc-3', model: 'AmpX-Agg-24', mac: 'FC:FB:22:33:CC:09', tempIp: '192.168.1.109', type: 'switching' },
];

const GlobalInventory: React.FC<GlobalInventoryProps> = ({ onSelectSite, siteId }) => {
  const [search, setSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [adoptionMethod, setAdoptionMethod] = useState<AdoptionMethod>('discovery');
  const [isScanning, setIsScanning] = useState(false);
  const [adoptingIds, setAdoptingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'devices' | 'firmware'>('devices');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const isGlobal = !siteId;
  const site = useMemo(() => siteId ? MOCK_SITES.find(s => s.id === siteId) : null, [siteId]);

  const deviceRoles = useMemo(() => {
    const base = siteId ? MOCK_DEVICES.filter(d => d.siteId === siteId) : MOCK_DEVICES;
    return Array.from(new Set(base.map(d => d.role))).sort();
  }, [siteId]);

  const allDevices = useMemo(() => {
    let base = siteId ? MOCK_DEVICES.filter(d => d.siteId === siteId) : MOCK_DEVICES;
    if (isGlobal && siteFilter !== 'ALL') base = base.filter(d => d.siteId === siteFilter);
    if (roleFilter !== 'ALL') base = base.filter(d => d.role === roleFilter);
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.ip.includes(q) ||
      d.mac.toLowerCase().includes(q)
    );
  }, [search, siteId, siteFilter, roleFilter, isGlobal]);

  const handleAdopt = (id: string) => {
    setAdoptingIds(prev => new Set(prev).add(id));
    setTimeout(() => { setAdoptingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }, 2000);
  };

  return (
    <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-500">
      <div className="max-w-[1200px] mx-auto p-8 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isGlobal ? <>Global <span className="text-[#0ABAB5]">Inventory</span></> : <>{site?.name} <span className="text-[#0ABAB5]">Inventory</span></>}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isGlobal
              ? `Managing ${allDevices.length} assets across ${MOCK_SITES.length} active sites.`
              : `${allDevices.length} assets at ${site?.location || ''}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isGlobal ? "Search all assets..." : "Search site assets..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs w-64 focus:border-[#0ABAB5] transition-all outline-none"
            />
          </div>
          <button
            onClick={() => setShowAdoptionModal(true)}
            className="bg-[#0ABAB5] hover:bg-[#099e9a] text-white px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Plus size={14} /> Adopt Asset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        <button onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'devices' ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Devices ({allDevices.length})
        </button>
        <button onClick={() => setActiveTab('firmware')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'firmware' ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Firmware
        </button>
      </div>

      {/* Filter Bar */}
      {activeTab === 'devices' && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {isGlobal && (
            <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-600 outline-none">
              <option value="ALL">All Sites</option>
              {MOCK_SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-600 outline-none">
            <option value="ALL">All Device Types</option>
            {deviceRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(siteFilter !== 'ALL' || roleFilter !== 'ALL') && (
            <button onClick={() => { setSiteFilter('ALL'); setRoleFilter('ALL'); }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-1">
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>
      )}

      {activeTab === 'firmware' ? (
        <FirmwarePanel devices={allDevices} />
      ) : (
      <>
      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 border-b border-slate-100">
                <th className="px-5 py-3">Asset Identity</th>
                <th className="px-5 py-3">Host / IP</th>
                {isGlobal && <th className="px-5 py-3">Site</th>}
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {allDevices.map(device => {
                const dvSite = MOCK_SITES.find(s => s.id === device.siteId);
                const plugin = PLUGINS.find(p => p.id === device.pluginType);
                const isSelected = selectedDevice?.id === device.id;
                return (
                  <tr
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`group hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-[#0ABAB5]/5' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#0ABAB5] group-hover:text-white transition-all relative">
                          {device.role === 'AP' ? <Wifi size={16} /> : device.role === 'Camera' ? <Video size={16} /> : device.role === 'Optical' || device.role === 'OTN' ? <Network size={16} /> : device.role === 'Spine' || device.role === 'Leaf' ? <Cpu size={16} /> : <Server size={16} />}
                          <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${device.status === 'online' ? 'bg-emerald-500' : device.status === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-bold leading-tight transition-colors ${isSelected ? 'text-[#0ABAB5]' : 'text-slate-800 group-hover:text-[#0ABAB5]'}`}>{device.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{device.mac}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{device.ip}</td>
                    {isGlobal && (
                      <td className="px-5 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); onSelectSite(device.siteId); }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md hover:border-[#0ABAB5] transition-all text-left"
                        >
                          <MapPin size={10} className="text-[#0ABAB5]" />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">{dvSite?.name}</span>
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: plugin?.color }} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{plugin?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">{device.model}</span>
                    </td>
                    <td className="px-5 py-3 text-[10px] text-slate-600 font-bold uppercase">{device.role}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase ${
                        device.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {device.status === 'online' ? 'Online' : device.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Detail Drawer */}
      <DeviceDetailDrawer
        device={selectedDevice}
        onClose={() => setSelectedDevice(null)}
        activePlugins={site?.activePlugins || []}
      />

      {/* Adoption Modal (site-level only) */}
      {showAdoptionModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-4xl h-[650px] flex overflow-hidden shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowAdoptionModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors z-20"><X size={24} /></button>

            {/* Modal Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-100 p-10 flex flex-col gap-8">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200"><Network size={24} /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Adoption</h3>
              </div>
              <div className="space-y-2">
                {(['discovery', 'sn', 'ip'] as AdoptionMethod[]).map(m => (
                  <button key={m} onClick={() => setAdoptionMethod(m)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      adoptionMethod === m ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}>
                    {m === 'discovery' ? <Activity size={16}/> : m === 'sn' ? <Scan size={16}/> : <Globe size={16}/>}
                    {m === 'discovery' ? 'Discovery' : m === 'sn' ? 'Serial (SN)' : 'IP Address'}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-16 overflow-auto">
              {adoptionMethod === 'discovery' && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight">Auto Discovery</h4>
                      <p className="text-slate-500 font-medium text-sm">Detected devices pending authorization.</p>
                    </div>
                    <button onClick={() => { setIsScanning(true); setTimeout(() => setIsScanning(false), 2000); }} disabled={isScanning}
                      className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100">
                      <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {DISCOVERED_DEVICES.map(dev => (
                      <div key={dev.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] group hover:border-blue-400 hover:bg-white transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 border border-slate-100 shadow-sm">
                            {dev.type === 'wireless' ? <Wifi size={24}/> : <Zap size={24}/>}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-base">{dev.model}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{dev.mac} • {dev.tempIp}</p>
                          </div>
                        </div>
                        <button onClick={() => handleAdopt(dev.id)} disabled={adoptingIds.has(dev.id)}
                          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            adoptingIds.has(dev.id) ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:scale-105 active:scale-95'
                          }`}>
                          {adoptingIds.has(dev.id) ? <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Adopt...</span> : 'Adopt'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {adoptionMethod === 'sn' && (
                <div className="max-w-lg">
                  <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Manual Provision</h4>
                  <p className="text-slate-500 font-medium text-sm mb-10">Register hardware via serial number.</p>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number</label>
                      <div className="relative">
                        <Scan size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input type="text" placeholder="e.g. AX-48-2201" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-8 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Family</label>
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 font-bold outline-none focus:border-blue-500 text-sm appearance-none">
                        <option value="">Select...</option>
                        <option>AmpX Core (L3 Chassis)</option><option>AmpX Access (PoE+ Stack)</option><option>Uni-WiFi (WAP)</option><option>AmpFabric (Spine/Leaf)</option>
                      </select>
                    </div>
                    <button onClick={() => setShowAdoptionModal(false)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Authorize & Adopt</button>
                  </div>
                </div>
              )}
              {adoptionMethod === 'ip' && (
                <div className="h-full flex flex-col">
                  <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">IP Provisioning</h4>
                  <p className="text-slate-500 font-medium text-sm mb-8">Onboard via IP address.</p>
                  <textarea placeholder="192.168.1.10&#10;192.168.1.11" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-8 font-mono text-sm font-bold outline-none focus:border-blue-500 resize-none mb-6"/>
                  <button onClick={() => setShowAdoptionModal(false)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    <RefreshCw size={18}/> Verify & Provision
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

// ─── Firmware Panel (embedded in Inventory) ───
const FIRMWARE_LIBRARY = [
  { id: 'fw-1', version: 'v1.4.2', modelFamily: 'AmpX-Core', uploadDate: '2025-05-20', size: '124MB', type: 'Stable' as const },
  { id: 'fw-2', version: 'v2.1.0', modelFamily: 'Uni-WiFi', uploadDate: '2025-05-18', size: '42MB', type: 'Stable' as const },
  { id: 'fw-3', version: 'v1.0.5', modelFamily: 'AmpFabric', uploadDate: '2025-05-22', size: '256MB', type: 'Security' as const },
];

const FirmwarePanel: React.FC<{ devices: Device[] }> = ({ devices }) => {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const startPush = (id: string) => {
    setUpdatingIds(prev => new Set(prev).add(id));
    setTimeout(() => { setUpdatingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }, 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <Download size={16} className="text-blue-600" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Firmware Deployment</span>
          <span className="text-[10px] text-slate-400">{FIRMWARE_LIBRARY.length} builds in repository</span>
        </div>
        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors">Upload New Build</button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50">
            <th className="px-8 py-5">Device</th>
            <th className="px-8 py-5">Model</th>
            <th className="px-8 py-5">Current</th>
            <th className="px-8 py-5">Available</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {devices.map(device => {
            const isUpdating = updatingIds.has(device.id);
            const fw = FIRMWARE_LIBRARY.find(f => device.model.includes(f.modelFamily));
            return (
              <tr key={device.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      {device.role === 'AP' ? <Wifi size={18}/> : <Server size={18}/>}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{device.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">{device.mac}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">{device.model}</td>
                <td className="px-8 py-5 font-mono text-xs text-slate-500">v1.4.1</td>
                <td className="px-8 py-5">
                  {fw ? <span className="font-mono text-xs font-black text-blue-600">{fw.version}</span> : <span className="text-[10px] text-slate-300">No match</span>}
                </td>
                <td className="px-8 py-5">
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: '60%', animation: 'pulse 1s infinite' }}/></div>
                      <span className="text-[9px] font-black text-blue-600 uppercase">Pushing...</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">Pending</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => startPush(device.id)} disabled={isUpdating || !fw}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all disabled:opacity-30 active:scale-95">
                    Push
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GlobalInventory;

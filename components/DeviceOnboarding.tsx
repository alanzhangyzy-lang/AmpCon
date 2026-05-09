
import React, { useState, useMemo, useEffect } from 'react';
import { Smartphone, RefreshCw, X, Search, Plus, Scan, Database, ChevronRight, Activity, Settings2, Sliders, Info, BarChart3, Lock, Zap, LayoutGrid, Globe, Network, Cpu, Wifi, Check, Loader2 } from 'lucide-react';
import { MOCK_DEVICES, PLUGINS, MOCK_SITES } from '../constants.tsx';
import { Device, PluginID } from '../types';
import DeviceDetailDrawer from './DeviceDetailDrawer';

interface DeviceOnboardingProps {
  siteId: string;
}

type AdoptionMethod = 'discovery' | 'sn' | 'ip';

const DISCOVERED_DEVICES = [
  { id: 'disc-1', model: 'AmpX-Acc-48P', mac: 'FC:FB:22:33:AA:01', tempIp: '192.168.1.102', type: 'switching' },
  { id: 'disc-2', model: 'Uni-WiFi-7', mac: 'FC:FB:22:33:BB:05', tempIp: '192.168.1.105', type: 'wireless' },
  { id: 'disc-3', model: 'AmpX-Agg-24', mac: 'FC:FB:22:33:CC:09', tempIp: '192.168.1.109', type: 'switching' },
];

const DeviceOnboarding: React.FC<DeviceOnboardingProps> = ({ siteId }) => {
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [adoptionMethod, setAdoptionMethod] = useState<AdoptionMethod>('discovery');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [adoptingIds, setAdoptingIds] = useState<Set<string>>(new Set());
  
  const site = useMemo(() => MOCK_SITES.find(s => s.id === siteId), [siteId]);
  const devices = useMemo(() => MOCK_DEVICES.filter(d => d.siteId === siteId), [siteId]);

  const handleAdopt = (id: string) => {
    setAdoptingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setAdoptingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // In a real app, this would refresh the list
    }, 2000);
  };

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Global <span className="text-blue-600">Assets</span></h1>
          <p className="text-slate-500 font-medium mt-1">Foundational hardware orchestration and provisioning.</p>
        </div>
        <button 
          onClick={() => setShowAdoptionModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-[2rem] font-black text-sm transition-all shadow-2xl shadow-blue-900/20 flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} /> Adopt Asset
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 backdrop-blur">
          <div className="flex gap-10">
            <button className="text-[11px] font-black text-blue-600 border-b-2 border-blue-600 pb-2 uppercase tracking-[0.2em]">Active Matrix ({devices.length})</button>
            <button className="text-[11px] font-black text-slate-400 hover:text-slate-600 pb-2 uppercase tracking-[0.2em]">Provisioning (1)</button>
          </div>
          <div className="relative group">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
             <input type="text" placeholder="Asset Identifier..." className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-xs w-72 focus:outline-none focus:border-blue-500 transition-all shadow-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-8 py-7">System Identity</th>
                <th className="px-8 py-7">Network Segment</th>
                <th className="px-8 py-7">Category</th>
                <th className="px-8 py-7">SKU / Model</th>
                <th className="px-8 py-7">Fabric Role</th>
                <th className="px-8 py-7 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {devices.map(device => {
                const plugin = PLUGINS.find(p => p.id === device.pluginType);
                const isSelected = selectedDevice?.id === device.id;
                return (
                  <tr 
                    key={device.id} 
                    onClick={() => setSelectedDevice(device)}
                    className={`hover:bg-slate-50 transition-all cursor-pointer group ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 border border-slate-200 group-hover:scale-105 transition-all flex items-center justify-center shadow-sm relative overflow-hidden">
                          <img src={device.image} className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                             <LayoutGrid size={24} className="text-slate-400" />
                          </div>
                          <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${device.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className={`text-base font-black leading-tight transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>{device.name}</p>
                          <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest leading-none">{device.mac}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-sm text-slate-700 font-black font-mono">{device.ip}</td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plugin?.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{plugin?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                       <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-200/50">{device.model}</span>
                    </td>
                    <td className="px-8 py-8 text-[11px] text-slate-600 font-black tracking-widest uppercase">{device.role}</td>
                    <td className="px-8 py-8 text-right">
                      <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border group-hover:bg-emerald-100 transition-colors shadow-sm ${device.status === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{device.status === 'online' ? 'Verified' : 'Provisioning'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <DeviceDetailDrawer 
        device={selectedDevice} 
        onClose={() => setSelectedDevice(null)} 
        activePlugins={site?.activePlugins || []}
      />

      {/* Advanced Adoption Modal */}
      {showAdoptionModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-4xl h-[650px] flex overflow-hidden shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowAdoptionModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors z-20"><X size={24} /></button>
            
            {/* Modal Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-100 p-10 flex flex-col gap-8">
               <div className="mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                     <Network size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Adoption</h3>
               </div>
               
               <div className="space-y-2">
                  <AdoptionTab 
                    label="Discovery" 
                    active={adoptionMethod === 'discovery'} 
                    onClick={() => setAdoptionMethod('discovery')} 
                    icon={<Activity size={16} />} 
                  />
                  <AdoptionTab 
                    label="Serial (SN)" 
                    active={adoptionMethod === 'sn'} 
                    onClick={() => setAdoptionMethod('sn')} 
                    icon={<Scan size={16} />} 
                  />
                  <AdoptionTab 
                    label="IP Address" 
                    active={adoptionMethod === 'ip'} 
                    onClick={() => setAdoptionMethod('ip')} 
                    icon={<Globe size={16} />} 
                  />
               </div>

               <div className="mt-auto p-5 bg-blue-50 rounded-2xl border border-blue-100/50">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-[10px] text-blue-900 font-medium leading-relaxed italic">System is scanning Layer 2 fabric for pending assets.</p>
               </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-16 overflow-auto">
               {adoptionMethod === 'discovery' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h4 className="text-3xl font-black text-slate-900 tracking-tight">Auto Discovery</h4>
                          <p className="text-slate-500 font-medium text-sm">Detected devices pending authorization.</p>
                       </div>
                       <button 
                        onClick={startScan}
                        disabled={isScanning}
                        className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100 active:scale-95"
                       >
                          <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       {DISCOVERED_DEVICES.map(dev => (
                         <div key={dev.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] group hover:border-blue-400 hover:bg-white transition-all">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                                  {dev.type === 'wireless' ? <Wifi size={24} /> : <Zap size={24} />}
                               </div>
                               <div>
                                  <p className="font-black text-slate-800 text-base">{dev.model}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{dev.mac} • {dev.tempIp}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleAdopt(dev.id)}
                              disabled={adoptingIds.has(dev.id)}
                              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                adoptingIds.has(dev.id) 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:scale-105 active:scale-95'
                              }`}
                            >
                               {adoptingIds.has(dev.id) ? (
                                 <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Adopt...</span>
                               ) : 'Adopt'}
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {adoptionMethod === 'sn' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Manual Provision</h4>
                    <p className="text-slate-500 font-medium text-sm mb-10">Directly register hardware via manufacturer identity.</p>
                    
                    <div className="space-y-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset PIN / Serial</label>
                          <div className="relative">
                            <Scan size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Enter Device SN (e.g. AX-48-2201)" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-8 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sm" />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Family / SKU</label>
                          <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sm appearance-none">
                             <option value="">Select hardware archetype...</option>
                             <option>AmpX Core (L3 Chassis)</option>
                             <option>AmpX Access (PoE+ Stack)</option>
                             <option>Uni-WiFi (WAP Platform)</option>
                             <option>AmpFabric (Spine/Leaf DC)</option>
                          </select>
                       </div>

                       <div className="pt-4">
                          <button onClick={() => setShowAdoptionModal(false)} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 active:scale-95 transition-all">
                             Authorize & Adopt
                          </button>
                       </div>
                    </div>
                 </div>
               )}

               {adoptionMethod === 'ip' && (
                 <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">IP Provisioning</h4>
                    <p className="text-slate-500 font-medium text-sm mb-8">Onboard assets via specific network segment endpoints.</p>
                    
                    <div className="flex-1 space-y-8 flex flex-col">
                       <div className="flex-1 flex flex-col space-y-2">
                          <div className="flex justify-between items-center mb-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target IP List</label>
                             <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Supports batch entry (CSV/Newlines)</span>
                          </div>
                          <textarea 
                            placeholder="192.168.1.10&#10;192.168.1.11, 10.0.4.2" 
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 font-mono text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none shadow-inner"
                          />
                       </div>

                       <div className="pt-4">
                          <button onClick={() => setShowAdoptionModal(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3">
                             <RefreshCw size={18} /> Verify & Provision Nodes
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdoptionTab = ({ label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/50'
    }`}
  >
     {icon}
     {label}
  </button>
);

export default DeviceOnboarding;

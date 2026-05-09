
import React, { useState, useMemo } from 'react';
import { X, Cpu, Activity, Zap, Shield, ChevronRight, HardDrive, Network, BarChart3, Settings2, Info, Wifi, Sliders, Box, Save, AlertCircle } from 'lucide-react';
import { Device, PluginID } from '../types';
import { PLUGINS } from '../constants.tsx';

interface DeviceDetailDrawerProps {
  device: Device | null;
  onClose: () => void;
  activePlugins: PluginID[];
}

type TabID = 'overview' | 'insights' | 'settings';

const DeviceDetailDrawer: React.FC<DeviceDetailDrawerProps> = ({ device, onClose, activePlugins }) => {
  const [activeTab, setActiveTab] = useState<TabID>('overview');

  const isPluginActive = useMemo(() => {
    if (!device) return false;
    return activePlugins.includes(device.pluginType);
  }, [device, activePlugins]);

  if (!device) return null;

  const pluginInfo = PLUGINS.find(p => p.id === device.pluginType);

  return (
    <div className="fixed top-0 right-0 h-full w-[500px] bg-white border-l border-slate-200 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Asset <span className="text-blue-600">Console</span></h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{device.name} • {device.model}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex px-8 border-b border-slate-50 bg-slate-50/30">
        <TabButton id="overview" label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Info size={14} />} />
        <TabButton id="insights" label="Insights" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BarChart3 size={14} />} />
        <TabButton id="settings" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings2 size={14} />} />
      </div>

      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Device Identity */}
            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                {device.pluginType === 'wireless' ? <Wifi size={80} /> : <Box size={80} />}
              </div>
              <img src={device.image} className="w-full h-40 object-cover rounded-2xl mb-6 shadow-sm border border-white" alt={device.name} />
              <div className="flex justify-between items-center">
                <div>
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{device.role} Node</span>
                   <h3 className="text-xl font-black text-slate-900 mt-2">{device.name}</h3>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${device.status === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                   <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{device.status}</span>
                </div>
              </div>
            </div>

            {/* Core Telemetry */}
            <div className="grid grid-cols-2 gap-4">
               <StatBox icon={<Cpu size={16} />} label="Processor" value="12.4%" />
               <StatBox icon={<Zap size={16} />} label="Power Draw" value="14.2W" />
               <StatBox icon={<HardDrive size={16} />} label="Storage" value="2.1 / 8 GB" />
               <StatBox icon={<Activity size={16} />} label="Throughput" value="442 Mbps" />
            </div>

            <div className="space-y-2 pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Identity Stack</p>
              <DetailRow label="System IP" value={device.ip} />
              <DetailRow label="MAC Address" value={device.mac} />
              <DetailRow label="Fabric Logic" value={device.pluginType.toUpperCase()} />
              <DetailRow label="Serial" value={`SN-${device.mac.replace(/:/g, '')}`} />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {!isPluginActive ? (
              <PluginRequiredPlaceholder pluginName={pluginInfo?.name || 'Required'} />
            ) : (
              <>
                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} className="text-blue-500" /> Traffic Distribution</h4>
                   <div className="space-y-6">
                      <TrafficIndicator label="Streaming" value="65%" color="bg-blue-500" />
                      <TrafficIndicator label="Management" value="15%" color="bg-slate-400" />
                      <TrafficIndicator label="Web/SaaS" value="20%" color="bg-emerald-500" />
                   </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Uplink Performance</h4>
                   <div className="flex items-end gap-1 h-24 mb-4">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-blue-500/30 rounded-t-sm" style={{ height: `${30 + Math.random() * 70}%` }} />
                      ))}
                   </div>
                   <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                      <span>Latency: 4ms</span>
                      <span>Packet Loss: 0.00%</span>
                   </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {!isPluginActive ? (
              <PluginRequiredPlaceholder pluginName={pluginInfo?.name || 'Required'} />
            ) : (
              <>
                <section className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">General Configuration</p>
                  <InputField label="Device Display Name" value={device.name} />
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">LED Status Indicator</span>
                    <Toggle active />
                  </div>
                </section>

                {device.pluginType === 'switching' && (
                  <section className="space-y-4 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">L2/L3 Switching Overrides</p>
                    <div className="grid grid-cols-2 gap-4">
                       <InputField label="Management VLAN" value="1" />
                       <InputField label="MTU Size" value="1500" />
                    </div>
                  </section>
                )}

                {device.pluginType === 'wireless' && (
                  <section className="space-y-4 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Radio Resource Management</p>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-3">5GHz Bandwidth</p>
                       <div className="flex gap-2">
                          {['20', '40', '80', '160'].map(w => (
                            <button key={w} className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${w === '80' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>HE{w}</button>
                          ))}
                       </div>
                    </div>
                  </section>
                )}

                <div className="pt-8">
                   <button className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                      <Save size={18} /> Apply Config Overrides
                   </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ id, label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
      active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {icon}
    {label}
    {active && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full shadow-[0_-2px_6px_rgba(59,130,246,0.3)]" />}
  </button>
);

const StatBox = ({ icon, label, value }: any) => (
  <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group">
    <div className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors">{icon}</div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-base font-black text-slate-900">{value}</p>
  </div>
);

const DetailRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-slate-800 font-mono">{value}</span>
  </div>
);

const TrafficIndicator = ({ label, value, color }: any) => (
  <div>
     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
     </div>
     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
        <div className={`h-full ${color}`} style={{ width: value }} />
     </div>
  </div>
);

const InputField = ({ label, value }: any) => (
  <div className="space-y-1.5">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <input type="text" defaultValue={value} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all" />
  </div>
);

const Toggle = ({ active }: { active?: boolean }) => (
  <div className={`w-10 h-5 rounded-full p-1 transition-all cursor-pointer ${active ? 'bg-blue-600' : 'bg-slate-200'}`}>
     <div className={`w-3 h-3 bg-white rounded-full transition-all ${active ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
);

const PluginRequiredPlaceholder = ({ pluginName }: { pluginName: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
     <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-100">
        <Shield size={40} />
     </div>
     <div>
        <h5 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-2">Plugin Deactivated</h5>
        <p className="text-xs text-slate-400 font-medium max-w-[240px] leading-relaxed mx-auto">
           The <span className="font-bold text-slate-600 underline decoration-blue-500/30 decoration-2">{pluginName}</span> module must be active to access telemetry and configuration overrides.
        </p>
     </div>
     <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
        Go to Settings
     </button>
  </div>
);

export default DeviceDetailDrawer;

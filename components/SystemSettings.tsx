
import React, { useState } from 'react';
import { Site, PluginID } from '../types';
import { Settings, Globe, Database, Check, Plus, Trash2, ShieldCheck, Shield, Wifi, Zap, Server, Video, Network, ShoppingBag, ExternalLink, AlertTriangle } from 'lucide-react';
import { PLUGINS } from '../constants.tsx';

interface SystemSettingsProps {
  site: Site;
  onUpdateActivePlugins?: (plugins: PluginID[]) => void;
  subscribedPlugins?: PluginID[];
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ site, onUpdateActivePlugins, subscribedPlugins = [] }) => {
  const [activePlugins, setActivePlugins] = useState<PluginID[]>(site.activePlugins);

  const togglePlugin = (id: PluginID) => {
    setActivePlugins(prev => {
      let next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      
      // Mutual Exclusivity Logic: switching vs campus-fabric vs vxlan-evpn
      if (id === 'switching') {
        next = next.filter(p => p !== 'campus-fabric' && p !== 'vxlan-evpn');
      } else if (id === 'campus-fabric') {
        next = next.filter(p => p !== 'switching' && p !== 'vxlan-evpn');
      } else if (id === 'vxlan-evpn') {
        next = next.filter(p => p !== 'switching' && p !== 'campus-fabric');
      }
      
      return next;
    });
  };

  const handleSave = () => {
    if (onUpdateActivePlugins) {
      onUpdateActivePlugins(activePlugins);
      alert('Plugin configuration updated successfully.');
    }
  };

  // Site-level settings hide SD-WAN
  const availablePlugins = PLUGINS.filter(p => p.id !== 'sd-wan');

  return (
    <div className="p-10 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500 pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Site Settings</h1>
        <p className="text-slate-500 font-medium">Configure base parameters and application plugins for {site.name}.</p>
      </div>

      <div className="space-y-10">
        <SettingSection title="Network Foundation" icon={<Globe size={20} className="text-blue-600" />}>
           <SettingField label="Global Management VLAN" value="10" />
           <SettingField label="Domain Suffix" value="ampcon.local" />
           <SettingField label="NTP Server" value="pool.ntp.org" />
        </SettingSection>

        <section>
          <div className="flex items-center justify-between mb-8">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-slate-50 rounded-2xl text-emerald-600"><Settings size={20} /></div>
                   <h3 className="text-2xl font-black text-slate-900">Plugin Management</h3>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg text-[9px] font-black uppercase mt-4 border border-amber-100 w-fit">
                   <AlertTriangle size={12} />
                   Note: LAN architecture types (Traditional, Campus Fabric, DC Fabric) are mutually exclusive.
                </div>
             </div>
             <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100">
                <ShoppingBag size={14} className="text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{subscribedPlugins.length} Licenses Active</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {availablePlugins.map(plugin => {
                const isSubscribed = subscribedPlugins.includes(plugin.id);
                const isActive = activePlugins.includes(plugin.id);
                
                return (
                  <div key={plugin.id} className={`p-8 bg-white border rounded-[2.5rem] flex flex-col justify-between transition-all group ${
                    isSubscribed 
                      ? (isActive ? 'border-blue-400 shadow-xl shadow-blue-900/5' : 'border-slate-100 hover:border-slate-300') 
                      : 'border-slate-50 opacity-40 grayscale'
                  }`}>
                    <div className="flex justify-between items-start mb-8">
                       <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl transition-all shadow-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`} style={{ color: !isActive ? plugin.color : undefined }}>
                             {getPluginIcon(plugin.id)}
                          </div>
                          <div>
                             <p className="font-black text-slate-900 text-lg leading-tight">{plugin.name}</p>
                             <p className="text-xs text-slate-400 font-medium mt-1">{plugin.description}</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                       {!isSubscribed ? (
                         <div className="flex items-center gap-2 text-slate-400">
                            <Shield size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Requires License</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-emerald-600">
                            <Check size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Licensed</span>
                         </div>
                       )}

                       {isSubscribed ? (
                         <button 
                           onClick={() => togglePlugin(plugin.id)}
                           className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                             isActive 
                              ? 'bg-red-50 text-red-500 hover:bg-red-100 flex items-center gap-2' 
                              : 'bg-slate-900 text-white hover:bg-black flex items-center gap-2 shadow-lg shadow-slate-900/5'
                           }`}
                         >
                           {isActive ? <><Trash2 size={12} /> Remove</> : <><Plus size={12} /> Provision App</>}
                         </button>
                       ) : (
                         <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            Unavailable
                         </button>
                       )}
                    </div>
                  </div>
                );
             })}
          </div>
        </section>

        <SettingSection title="Retention & Intelligence" icon={<Database size={20} className="text-indigo-600" />}>
           <SettingField label="Log Retention (Days)" value="90" />
           <SettingField label="Telemetry Interval" value="1s" />
        </SettingSection>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur border-t border-slate-200 z-50 flex justify-center">
         <button onClick={handleSave} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-2xl shadow-blue-900/20 flex items-center gap-3 hover:bg-blue-700 transition-all uppercase tracking-[0.1em]">
            <Check size={20} /> Deploy Site Configuration
         </button>
      </div>
    </div>
  );
};

const getPluginIcon = (id: PluginID) => {
  switch(id) {
    case 'switching': return <Zap size={20} />;
    case 'wireless': return <Wifi size={20} />;
    case 'optical': return <Network size={20} />;
    case 'vxlan-evpn': return <Server size={20} />;
    case 'ai-roce': return <Cpu size={20} />;
    case 'cctv': return <Video size={20} />;
    case 'nac': return <ShieldCheck size={20} />;
    case 'campus-fabric': return <Network size={20} />;
    default: return <Settings size={20} />;
  }
};

const SettingSection = ({ title, icon, children }: any) => (
  <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
    <div className="flex items-center gap-4 mb-8">
       <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
       <h3 className="text-xl font-black text-slate-900">{title}</h3>
    </div>
    <div className="space-y-6">{children}</div>
  </section>
);

const SettingField = ({ label, value }: any) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">{label}</span>
    <input type="text" defaultValue={value} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 text-right focus:ring-2 ring-blue-500/20 w-48" />
  </div>
);

export default SystemSettings;

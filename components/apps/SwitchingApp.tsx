
import React, { useState, useEffect } from 'react';
import { 
  Settings2, RefreshCw, Box, Zap, Shield, Layers, Activity, Laptop, Camera, Smartphone, Printer, Network, Plus, X, MoreVertical, 
  ChevronDown, ChevronUp, Search, Filter, Server, ShieldCheck, Share2, Globe, Database, Sliders, Check, CheckCircle2
} from 'lucide-react';
import { Device } from '../../types';

interface SwitchingAppProps {
  devices: Device[];
  feature: string;
}

const SwitchingApp: React.FC<SwitchingAppProps> = ({ devices, feature }) => {
  const [configStep, setConfigStep] = useState<1 | 2 | 3>(1);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryTab, setSummaryTab] = useState<'summary' | 'result'>('summary');
  const [activeProfileTab, setActiveProfileTab] = useState<'radius' | 'templates'>('templates');
  const [templateViewTab, setTemplateViewTab] = useState<'file' | 'template' | 'result'>('file');

  // Interface State
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  
  // Advanced State
  const [activeAdvancedTab, setActiveAdvancedTab] = useState<'static' | 'ospf' | 'vrf'>('static');

  useEffect(() => {
    if (feature !== 'config') { setShowSummary(false); setConfigStep(1); }
  }, [feature]);

  const handleApply = () => { setShowSummary(true); setSummaryTab('result'); };

  const switchingDevices = devices.filter(d => d.role === 'Core' || d.role === 'Aggregation' || d.role === 'Access');

  if (feature === 'overview') {
    return (
      <div className="flex-1 flex flex-col p-10 overflow-auto bg-[#fcfcfc] animate-in fade-in duration-300 h-full pb-32">
        <div className="w-full max-w-7xl mx-auto space-y-10">
          <div className="flex items-center justify-between">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tradition LAN <span className="text-blue-600">Overview</span></h2>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Campus Switching & L2 Stability</p>
            </div>
            <div className="flex gap-2">
               <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm transition-all"><Settings2 size={18} /></button>
               <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 shadow-sm transition-all"><RefreshCw size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <MetricCard label="Port Utilization" value="42%" sub="128 active / 312 total" icon={<Box className="text-blue-600" />} />
             <MetricCard label="POE Load" value="1.2 kW" sub="45% of 2.8kW Budget" icon={<Zap className="text-amber-500" />} />
             <MetricCard label="STP Integrity" value="Safe" sub="Root Bridge: WH-Core-01" icon={<Shield className="text-emerald-500" />} />
             <MetricCard label="VLAN Segments" value="12" sub="Across all switch-blocks" icon={<Layers className="text-indigo-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <Widget title="STP / Loop Monitor" icon={<Shield size={16} />}>
                <div className="flex flex-col items-center justify-center py-10">
                   <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-inner">
                      <Shield size={32} />
                   </div>
                   <p className="text-sm font-black text-slate-800">Switching Fabric Stable</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Last Root Transition: 14d ago</p>
                </div>
             </Widget>
             <Widget title="Abnormal Ports" icon={<Activity size={16} />} badge="Alerting">
                <div className="space-y-3 pt-2">
                   <ErrorPortItem name="WH-Acc-05" port="Eth1/12" error="CRC Error" count={124} />
                   <ErrorPortItem name="WH-Acc-08" port="Eth1/42" error="Input Drops" count={42} />
                </div>
             </Widget>
             <Widget title="Terminal Access" icon={<Laptop size={16} />}>
                <div className="space-y-4 pt-2">
                   <TerminalTypeRow label="Compute" count={142} icon={<Laptop size={14}/>} color="bg-blue-600" />
                   <TerminalTypeRow label="Security" count={48} icon={<Camera size={14}/>} color="bg-red-500" />
                   <TerminalTypeRow label="Phone" count={24} icon={<Smartphone size={14}/>} color="bg-emerald-500" />
                   <TerminalTypeRow label="Printer" count={8} icon={<Printer size={14}/>} color="bg-amber-500" />
                </div>
             </Widget>
          </div>
        </div>
      </div>
    );
  }

  if (feature === 'config') {
    if (showSummary) {
      return (
        <div className="p-10 max-w-7xl mx-auto h-full flex flex-col bg-[#fcfcfc] overflow-auto pb-32 animate-in fade-in zoom-in-95 duration-500">
           <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit mb-12 shadow-inner">
              <button onClick={() => setSummaryTab('summary')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${summaryTab === 'summary' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Configuration Summary</button>
              <button onClick={() => setSummaryTab('result')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${summaryTab === 'result' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Configuration Result</button>
           </div>
           {summaryTab === 'summary' ? (
             <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300">
                <SummarySection title="Network" icon={<Network size={16} />}>
                   <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm p-8 space-y-6">
                      <div className="grid grid-cols-4 text-[9px] font-black text-slate-400 uppercase border-b pb-4"><span>Network Name</span><span>VLAN</span><span>Gateway</span><span>Subnet</span></div>
                      <div className="grid grid-cols-4 text-sm font-bold text-slate-800"><span className="text-blue-600">IoT_Network</span><span>10</span><span>S5860-20SQ</span><span>192.168.10.1/24</span></div>
                   </div>
                </SummarySection>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <table className="w-full text-left"><thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5">Device Name</th><th className="px-8 py-5">Config Result</th><th className="px-8 py-5">Config Time</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    <ResultRow name="SW001" status="In Progress" time="2025-11-12 14:17:12" />
                  </tbody>
                </table>
             </div>
           )}
           <div className="mt-12"><button onClick={() => setShowSummary(false)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-colors"><X size={14} /> Clear Switch Config</button></div>
        </div>
      );
    }
    return (
      <div className="p-10 max-w-7xl mx-auto h-full flex flex-col bg-[#fcfcfc] overflow-auto pb-32">
        <div className="flex items-center gap-12 mb-12 border-b border-slate-100 pb-8 px-4">
          <StepIndicator number={1} label="Network" active={configStep === 1} completed={configStep > 1} onClick={() => setConfigStep(1)} />
          <StepIndicator number={2} label="Interface" active={configStep === 2} completed={configStep > 2} onClick={() => setConfigStep(2)} />
          <StepIndicator number={3} label="Advanced" active={configStep === 3} completed={false} onClick={() => setConfigStep(3)} />
        </div>
        
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {configStep === 1 && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left"><thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5">Network Name</th><th className="px-8 py-5">VLAN ID</th><th className="px-8 py-5">Subnet</th><th className="px-8 py-5 text-right">Gateway</th></tr></thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-sm">
                       <NetworkRow name="IoT_Network" vlan="10" subnet="192.168.10.1/24" />
                       <NetworkRow name="Office_Users" vlan="20" subnet="192.168.20.1/24" />
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {configStep === 2 && (
             <div className="space-y-10 overflow-auto pb-20">
                {switchingDevices.map(device => (
                   <div key={device.id} className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm group hover:border-blue-100 transition-all">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner group-hover:text-blue-600 transition-colors">
                               <Server size={28} />
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-slate-900 leading-tight">{device.name}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{device.model} • {device.ip}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all">Apply Profile to All</button>
                         </div>
                      </div>

                      <div className="grid grid-cols-6 md:grid-cols-12 lg:grid-cols-24 gap-3">
                         {Array.from({length: 48}).map((_, i) => {
                            const portId = `${device.id}-p${i+1}`;
                            const isDown = i > 12 && i < 20;
                            const isSelected = selectedPortId === portId;
                            return (
                               <div key={portId} className="relative flex flex-col items-center gap-2 group/port cursor-pointer" onClick={() => setSelectedPortId(isSelected ? null : portId)}>
                                  <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                     isSelected ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10 scale-110' :
                                     isDown ? 'bg-slate-50 border-slate-200 text-slate-300' : 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                                  }`}>
                                     <div className={`w-4 h-1.5 rounded-sm ${isDown ? 'bg-slate-200' : 'bg-white opacity-40'} mb-0.5`} />
                                  </div>
                                  <span className={`text-[9px] font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{i+1}</span>

                                  {isSelected && (
                                     <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl z-20 min-w-[320px] animate-in zoom-in-95 duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                                           <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">Port {i+1} Config</h5>
                                           <button onClick={() => setSelectedPortId(null)} className="p-1.5 bg-slate-50 rounded-lg hover:text-red-500"><X size={14}/></button>
                                        </div>
                                        <div className="space-y-6">
                                           <PortSetting label="Profile" type="select" options={['Default_Trunk', 'CCTV_Access', 'Voice_VLAN', 'Manual Override']} />
                                           <PortSetting label="Operation Mode" type="tabs" options={['Switching', 'Mirroring', 'Aggregate']} />
                                           <PortSetting label="L2 Port Type" type="tabs" options={['Trunk', 'Access']} />
                                           <div className="flex justify-between items-center py-2 border-t border-slate-50 pt-4">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PoE Power</span>
                                              <Toggle active />
                                           </div>
                                           <div className="flex justify-between items-center py-2">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flow Control</span>
                                              <Toggle />
                                           </div>
                                           <div className="flex justify-between items-center py-2">
                                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">dot1x Auth</span>
                                              <Toggle />
                                           </div>
                                           <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all mt-4">Update Port</button>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            );
                         })}
                      </div>
                   </div>
                ))}
             </div>
          )}

          {configStep === 3 && (
             <div className="space-y-8 max-w-5xl mx-auto pb-20">
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200 mb-10">
                   <AdvancedTab label="Static Route" icon={<Globe size={14}/>} active={activeAdvancedTab === 'static'} onClick={() => setActiveAdvancedTab('static')} />
                   <AdvancedTab label="OSPF Dynamic" icon={<Activity size={14}/>} active={activeAdvancedTab === 'ospf'} onClick={() => setActiveAdvancedTab('ospf')} />
                   <AdvancedTab label="VRF Logic" icon={<ShieldCheck size={14}/>} active={activeAdvancedTab === 'vrf'} onClick={() => setActiveAdvancedTab('vrf')} />
                </div>

                <div className="animate-in slide-in-from-bottom-4 duration-300">
                   {activeAdvancedTab === 'static' && (
                      <div className="space-y-8">
                         <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                               <h4 className="text-xl font-black text-slate-900 tracking-tight">IPv4 Static Routing Table</h4>
                               <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg"><Plus size={16}/> Add Route</button>
                            </div>
                            <table className="w-full text-left">
                               <thead>
                                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                     <th className="py-4">Network Dest</th><th className="py-4">Subnet Mask</th><th className="py-4">Next Hop IP</th><th className="py-4">Preference</th><th className="py-4 text-right">Actions</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50 font-bold text-sm text-slate-700">
                                  <tr>
                                     <td className="py-6">0.0.0.0</td><td className="py-6">0.0.0.0</td><td className="py-6 text-blue-600 font-mono">192.168.1.1</td><td className="py-6">60</td><td className="py-6 text-right"><MoreVertical size={16} className="text-slate-300 inline" /></td>
                                  </tr>
                               </tbody>
                            </table>
                         </div>
                      </div>
                   )}

                   {activeAdvancedTab === 'ospf' && (
                      <div className="space-y-8">
                         <div className="grid grid-cols-2 gap-8">
                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                               <h4 className="text-lg font-black text-slate-900 mb-8">OSPF Global Config</h4>
                               <div className="space-y-6">
                                  <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">OSPF Process ID</span><input type="text" defaultValue="1" className="bg-slate-50 border-none rounded-xl px-4 py-2 w-32 font-bold text-right"/></div>
                                  <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Router ID Override</span><input type="text" placeholder="Auto" className="bg-slate-50 border-none rounded-xl px-4 py-2 w-48 font-bold text-right"/></div>
                                  <div className="flex justify-between items-center pt-4 border-t border-slate-50"><span className="text-sm font-bold text-slate-600">Graceful Restart</span><Toggle active /></div>
                               </div>
                            </div>
                            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                               <Share2 className="absolute top-0 right-0 p-8 opacity-10" size={180} />
                               <h4 className="text-lg font-black mb-6">OSPF Area Sync</h4>
                               <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Active Areas</p>
                                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                                     <span className="font-bold">Area 0.0.0.0 (Backbone)</span>
                                     <span className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-full uppercase">Normal</span>
                                  </div>
                                  <button className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Redistribute BGP to OSPF</button>
                               </div>
                            </div>
                         </div>
                      </div>
                   )}

                   {activeAdvancedTab === 'vrf' && (
                      <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
                         <div className="flex justify-between items-center mb-8">
                            <div><h4 className="text-xl font-black text-slate-900 tracking-tight">VRF Virtual Routing Instances</h4><p className="text-slate-400 text-xs mt-1">Isolate control plane and routing tables logically.</p></div>
                            <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-xl"><Plus size={18}/> New VRF</button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <VrfCard name="Management-VRF" description="OOB Control Plane isolation" rd="100:1" />
                            <VrfCard name="SaaS-Edge-VRF" description="Cloud direct-connect peering" rd="100:50" active />
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>

        <div className="mt-12 flex justify-between items-center px-4 shrink-0">
          <div>{configStep > 1 && <button onClick={() => setConfigStep(s => (s-1) as any)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Previous</button>}</div>
          <div className="flex gap-4">
            <button className="px-10 py-3 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50">Cancel</button>
            <button onClick={configStep < 3 ? () => setConfigStep(s => (s+1) as any) : handleApply} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
               {configStep < 3 ? 'Next Configuration' : 'Sync Intent to Hardware'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (feature === 'profiles') {
     return (
       <div className="p-10 max-w-7xl mx-auto h-full flex flex-col space-y-10 animate-in fade-in duration-300 pb-32 h-full overflow-auto">
          <div className="flex items-center gap-1 mb-8 bg-slate-100 p-1.5 rounded-3xl w-fit shadow-inner">
             <TabBtn label="RADIUS Auth" active={activeProfileTab === 'radius'} onClick={() => setActiveProfileTab('radius')} />
             <TabBtn label="Port Templates" active={activeProfileTab === 'templates'} onClick={() => setActiveProfileTab('templates')} />
          </div>
          {activeProfileTab === 'templates' ? (
            <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
               <table className="w-full text-left">
                  <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100"><th className="px-10 py-6">Identity</th><th className="px-10 py-6">Operation Mode</th><th className="px-10 py-6">VLAN Binding</th><th className="px-10 py-6 text-right">Provisioning</th></tr></thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-sm">
                     <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-10 py-7 text-blue-600 underline cursor-pointer">Default_Trunk</td>
                        <td className="px-10 py-7">802.1Q Trunk</td>
                        <td className="px-10 py-7 font-mono text-xs text-slate-500">All (1-4094)</td>
                        <td className="px-10 py-7 text-right">
                           {/* Fixed: Use imported CheckCircle2 icon */}
                           <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl border border-emerald-100 text-[10px] uppercase font-black">
                              <CheckCircle2 size={14}/> Verified
                           </div>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
          ) : <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] animate-pulse">Global Radius Configuration Matrix</div>}
       </div>
     );
  }

  return null;
};

// Internal Config Helpers
const PortSetting = ({ label, type, options }: any) => (
  <div className="space-y-2">
     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     {type === 'select' && (
        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all">
           {options.map((o: string) => <option key={o}>{o}</option>)}
        </select>
     )}
     {type === 'tabs' && (
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
           {options.map((o: string, idx: number) => (
              <button key={o} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${idx === 0 ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                 {o}
              </button>
           ))}
        </div>
     )}
  </div>
);

const AdvancedTab = ({ label, icon, active, onClick }: any) => (
  <button onClick={onClick} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${active ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
     {icon} {label}
  </button>
);

const VrfCard = ({ name, description, rd, active = false }: any) => (
  <div className={`p-8 rounded-[2.5rem] border-2 transition-all group cursor-pointer ${active ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
     <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'} transition-colors shadow-sm`}><ShieldCheck size={20}/></div>
        <div className="text-right">
           <p className="text-[8px] font-black text-slate-400 uppercase">Route Distinguisher</p>
           <p className="text-xs font-mono font-black text-slate-900">{rd}</p>
        </div>
     </div>
     <h5 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{name}</h5>
     <p className="text-xs text-slate-400 mt-1 font-medium italic">{description}</p>
  </div>
);

// Shared UI Elements
const Toggle = ({ active }: { active?: boolean }) => (
  <div className={`w-10 h-5 rounded-full p-1 transition-all cursor-pointer ${active ? 'bg-blue-600' : 'bg-slate-300'}`}>
     <div className={`w-3 h-3 bg-white rounded-full transition-all ${active ? 'translate-x-5 shadow-lg shadow-blue-900/40' : 'translate-x-0'}`} />
  </div>
);

const MetricCard = ({ label, value, sub, icon }: any) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
    <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 border border-slate-100 group-hover:bg-blue-50 transition-colors">{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest italic">{sub}</p>
  </div>
);

const Widget = ({ title, icon, badge, children }: any) => (
  <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col h-full group hover:border-blue-100 transition-all">
    <div className="flex items-center justify-between mb-8">
       <div className="flex items-center gap-3"><div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors">{icon}</div><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h3></div>
       {badge && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded border border-blue-100">{badge}</span>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const ErrorPortItem = ({ name, port, error, count }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-50 rounded-2xl group hover:border-blue-100 transition-all">
     <div><p className="text-xs font-black text-slate-800">{name}</p><p className="text-[9px] font-black text-slate-400 uppercase">{port}</p></div>
     <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-500">{error}</p><p className="text-sm font-black text-slate-900">{count}</p></div>
  </div>
);

const TerminalTypeRow = ({ label, count, icon, color }: any) => (
  <div className="flex items-center justify-between group cursor-default">
     <div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl ${color} text-white shadow-sm transition-transform group-hover:scale-110`}>{icon}</div><span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</span></div>
     <span className="text-base font-black text-slate-900">{count}</span>
  </div>
);

const StepIndicator = ({ number, numberColor = 'blue', label, active, completed, onClick }: any) => (
  <button onClick={onClick} className="flex items-center gap-4 group">
     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-blue-600 bg-white text-blue-600 shadow-lg' : completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-400'}`}>
        {/* Fixed: Use imported CheckCircle2 icon */}
        {completed ? <CheckCircle2 size={16} /> : <span className="text-[11px] font-black">{number}</span>}
     </div>
     <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900 underline decoration-blue-500/30' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const NetworkRow = ({ name, vlan, subnet }: any) => (
  <tr className="hover:bg-slate-50 group"><td className="px-8 py-6 text-blue-600 underline cursor-pointer">{name}</td><td className="px-8 py-6 text-slate-600">{vlan}</td><td className="px-8 py-6 text-slate-600">{subnet}</td><td className="px-8 py-6 text-right"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">DHCP Gateway</span></td></tr>
);

const ResultRow = ({ name, status, time }: any) => (
  <tr className="hover:bg-slate-50/50 transition-colors"><td className="px-8 py-6 text-[11px] font-black text-slate-800">{name}</td><td className="px-8 py-6"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${status === 'Succeed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{status}</span></td><td className="px-8 py-6 text-[11px] font-mono font-bold text-slate-400">{time}</td></tr>
);

const SummarySection = ({ title, icon, children }: any) => (
  <div className="space-y-4"><div className="flex items-center gap-3 px-2"><div className="p-2 bg-slate-100 rounded-xl text-slate-400">{icon}</div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4></div>{children}</div>
);

const TabBtn = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}>{label}</button>
);

export default SwitchingApp;

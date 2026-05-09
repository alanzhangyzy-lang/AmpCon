
import React, { useState } from 'react';
import { Site, Device } from '../../types';
import { 
  Layers, Share2, Shield, Settings, Zap, Database, Cpu, Activity, Save, 
  ChevronRight, X, Box, Check, LayoutGrid, Info, ChevronDown, Plus, 
  Server, Network, RefreshCw, Trash2, Edit3, MoreVertical, CheckCircle2, ChevronUp,
  Search, Laptop, Smartphone, Globe, BarChart3, TrendingUp, TrendingDown, Clock, ShieldAlert, Sliders, Lock, ShieldCheck, Filter
} from 'lucide-react';
import SwitchingApp from './SwitchingApp';
import GlobalTopology from '../GlobalTopology';

interface CampusFabricAppProps {
  site: Site;
  devices: Device[];
  feature: string;
}

const CampusFabricApp: React.FC<CampusFabricAppProps> = ({ site, devices, feature }) => {
  const [underlayStep, setUnderlayStep] = useState<1 | 2 | 3 | 4>(1);
  const [topologyType, setTopologyType] = useState<'IP Clos' | 'MLAG'>('IP Clos');
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);

  // 1. Topology - reuse GlobalTopology which already has campus 3-tier layout
  if (feature === 'topology') {
    return <GlobalTopology site={site} />;
  }

  // 2. Dashboard
  if (feature === 'overview') {
    return (
      <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-300">
        <div className="max-w-[1200px] mx-auto p-8 pb-24 space-y-6">
        <div className="flex justify-between items-end">
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Fabric LAN <span className="text-[#0ABAB5]">Orchestrator</span></h1>
              <p className="text-slate-400 text-xs">SDN Overlay & Underlay Sync State</p>
           </div>
           <div className="flex gap-2">
              <button className="px-5 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">Audit Intent</button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <FabricMetricCard label="Fabric Health" value="98%" sub="Spine-Leaf Full Connected" icon={<Activity className="text-emerald-500" />} />
           <FabricMetricCard label="VTEP Status" value="24 / 24" sub="Nodes Online" icon={<Globe className="text-blue-500" />} />
           <FabricMetricCard label="BGP Neighbors" value="48 Up" sub="Adjacency Sync" icon={<Zap className="text-amber-500" />} />
           <FabricMetricCard label="Active VNIs" value="128" sub="VXLAN Segments" icon={<Layers className="text-indigo-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
           <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm flex flex-col min-h-[450px] relative overflow-hidden group">
              <div className="flex justify-between items-center mb-10 px-2 relative z-10">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3"><Share2 size={18} className="text-blue-500" /> VPC / VRF Logic View</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                 <div className="flex gap-40 mb-20 relative z-20">
                    <LogicNode label="VRF-PROD" icon={<Shield size={22}/>} type="core" />
                    <LogicNode label="VRF-GUEST" icon={<Lock size={22}/>} type="core" />
                 </div>
                 <div className="grid grid-cols-4 gap-12 relative z-20">
                    <LogicNode label="VNI 1001" type="access" />
                    <LogicNode label="VNI 1002" type="access" />
                    <LogicNode label="VNI 2001" type="access" />
                    <LogicNode label="VNI 2002" type="access" />
                 </div>
                 <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" overflow="visible">
                    <path d="M 40% 30% L 20% 70% M 40% 30% L 40% 70%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,3" />
                    <path d="M 60% 30% L 60% 70% M 60% 30% L 80% 70%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,3" />
                 </svg>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm flex flex-col group">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-10">Tenant Throughput Rank</h3>
              <div className="space-y-10 flex-1 justify-center flex flex-col">
                 <TrafficRankRow label="ERP-Production" value="4.2 Tbps" percentage={85} color="bg-blue-600" />
                 <TrafficRankRow label="Guest-Portal" value="2.8 Tbps" percentage={62} color="bg-indigo-500" />
                 <TrafficRankRow label="DC-Backend" value="1.1 Tbps" percentage={24} color="bg-emerald-500" />
              </div>
           </div>
        </div>
      </div>
      </div>
    );
  }

  // 2. Underlay Step-by-Step Wizard
  if (feature === 'underlay') {
    return (
      <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-500">
        <div className="max-w-[1200px] mx-auto p-8 pb-24 flex flex-col" style={{minHeight: '100%'}}>
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4 overflow-x-auto no-scrollbar relative shrink-0">
           <StepTab num={1} label="Topology" active={underlayStep === 1} done={underlayStep > 1} />
           <StepTab num={2} label="Nodes" active={underlayStep === 2} done={underlayStep > 2} />
           <StepTab num={3} label="Preview" active={underlayStep === 3} done={underlayStep > 3} />
           <StepTab num={4} label="Deploy" active={underlayStep === 4} done={false} />
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
           {underlayStep === 1 && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div><h3 className="text-lg font-black text-slate-900 tracking-tight">Select Infrastructure Architecture</h3><p className="text-slate-400 text-xs mt-1">Choose how your physical fabric nodes will interconnect.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <ArchitectureCard title="IP Clos (L3 Fabric)" desc="Standard Spine-Leaf architecture using eBGP for pure L3 routing." active={topologyType === 'IP Clos'} onClick={() => setTopologyType('IP Clos')} />
                   <ArchitectureCard title="MLAG (L2 Fabric)" desc="Traditional multi-chassis link aggregation for L2 redundancy." active={topologyType === 'MLAG'} onClick={() => setTopologyType('MLAG')} />
                </div>
             </div>
           )}
           {underlayStep === 2 && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div><h3 className="text-lg font-black text-slate-900 tracking-tight">Assign Physical Role</h3><p className="text-slate-400 text-xs mt-1">Bind discovered assets to their designated fabric positions.</p></div>
                <div className="grid grid-cols-1 gap-4">
                   <RoleAssignment title="Fabric Spine" icon={<Server className="text-blue-600" />} count={2} />
                   <RoleAssignment title="Fabric Leaf" icon={<Network className="text-indigo-600" />} count={6} />
                </div>
             </div>
           )}
           {underlayStep === 3 && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center">
                   <div><h3 className="text-lg font-black text-slate-900 tracking-tight">Underlay Intent Preview</h3><p className="text-slate-400 text-xs mt-1">Review generated configurations before final synchronization.</p></div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 font-bold text-[9px] uppercase"><CheckCircle2 size={12}/> Verified</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Generated Subnets</h4>
                      <div className="space-y-3">
                         <PreviewRow label="Loopbacks" value="10.255.0.0/24" />
                         <PreviewRow label="AS Number" value="65001" />
                         <PreviewRow label="Control Plane" value="EVPN Multi-Homing" />
                      </div>
                   </div>
                </div>
             </div>
           )}
           {underlayStep === 4 && (
             <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg"><Check size={32} /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Synchronizing Underlay...</h3>
                <button onClick={() => setUnderlayStep(1)} className="mt-10 px-8 py-3 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all">Back to Dashboard</button>
             </div>
           )}
        </div>
        {underlayStep < 4 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
             <button onClick={() => setUnderlayStep(s => (s-1) as any)} disabled={underlayStep === 1} className="px-5 py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 disabled:opacity-0 transition-all">Previous</button>
             <button onClick={() => setUnderlayStep(s => (s+1) as any)} className="px-8 py-2.5 bg-[#0ABAB5] text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all">{underlayStep === 3 ? 'Deploy Fabric' : 'Next Step'}</button>
          </div>
        )}
      </div>
      </div>
    );
  }

  // 3. Overlay Management
  if (feature === 'overlay') {
    return (
      <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-300">
        <div className="max-w-[1200px] mx-auto p-8 pb-24 space-y-6">
        <div className="flex justify-between items-end">
           <div><h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Overlay <span className="text-[#0ABAB5]">Segments</span></h1><p className="text-slate-400 text-xs">Logical Virtual Networks & Multi-tenancy</p></div>
           <button className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 active:scale-95 transition-all"><Plus size={18} /> Provision Logical VN</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <OverlaySegmentCard name="Production-VRF" vni="10001" type="L3 VN" traffic="2.4 Gbps" status="Synced" />
           <OverlaySegmentCard name="Corporate-Users" vni="10002" type="L2 VN" traffic="1.2 Gbps" status="Synced" />
           <OverlaySegmentCard name="Guest-Isolation" vni="10003" type="L3 VN" traffic="442 Mbps" status="Synced" warning />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Logical Service Mapping</h3>
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5">Virtual Network</th><th className="px-8 py-5">Gateway Mode</th><th className="px-8 py-5">IP Anycast</th><th className="px-8 py-5">Mapped Ports</th><th className="px-8 py-5 text-right">Verification</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 <OverlayRow name="VN-Corp-WiFi" mode="Distributed" ip="192.168.10.1" edges={24} status="Optimal" />
                 <OverlayRow name="VN-DC-Backend" mode="Centralized" ip="10.0.88.1" edges={2} status="Optimal" />
              </tbody>
           </table>
        </div>
      </div>
      </div>
    );
  }

  // 4. Fabric Port Orchestration (NEW)
  if (feature === 'ports') {
    return (
      <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-300">
        <div className="max-w-[1200px] mx-auto p-8 pb-24 space-y-6">
        <div className="flex justify-between items-end shrink-0">
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Fabric <span className="text-[#0ABAB5]">Ports</span></h1>
              <p className="text-slate-400 text-xs">Orchestrate Physical Access to Overlay Segments</p>
           </div>
           <div className="flex gap-3">
              <div className="relative group flex items-center">
                 <Search size={14} className="absolute left-3 text-slate-400" />
                 <input type="text" placeholder="Search ports..." className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs w-56 outline-none focus:border-[#0ABAB5] shadow-sm" />
              </div>
              <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><Filter size={16}/> Filter</button>
           </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar space-y-10 pr-2">
           {devices.filter(d => d.role === 'Leaf' || d.role === 'Core').map(device => (
             <div key={device.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm group hover:border-[#0ABAB5]/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-[#0ABAB5] transition-colors border border-slate-100">
                         <Server size={20} />
                      </div>
                      <div>
                         <h3 className="text-sm font-black text-slate-800">{device.name}</h3>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{device.model}</span>
                            <span className="text-[9px] font-bold text-[#0ABAB5] font-mono">{device.ip}</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabric Role</p>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{device.role}</p>
                   </div>
                </div>

                <div className="grid grid-cols-12 gap-1.5">
                   {Array.from({length: 24}).map((_, i) => {
                     const portId = `${device.id}-p${i+1}`;
                     const isActive = i % 4 === 0;
                     const isSelected = selectedPortId === portId;
                     return (
                       <div 
                         key={portId}
                         onClick={() => setSelectedPortId(isSelected ? null : portId)}
                         className={`relative flex flex-col items-center gap-2 cursor-pointer transition-all ${isSelected ? 'scale-110 z-10' : ''}`}
                       >
                          <div className={`w-7 h-7 rounded border-2 flex items-center justify-center shadow-sm ${
                             isSelected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/10' : 
                             isActive ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                             <div className={`w-2 h-1 rounded-sm ${isActive || isSelected ? 'bg-white' : 'bg-slate-300'} opacity-60`} />
                          </div>
                          <span className={`text-[7px] font-bold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{i + 1}</span>
                          
                          {/* Port Tooltip on Select */}
                          {isSelected && (
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-20 min-w-[200px] animate-in zoom-in-95 duration-200">
                               <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Port Configuration</p>
                               <div className="space-y-3">
                                  <div>
                                     <label className="text-[8px] font-black text-slate-500 uppercase">Overlay VN</label>
                                     <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-xs font-bold mt-1 outline-none">
                                        <option>Production-VRF</option>
                                        <option>Corporate-WiFi</option>
                                        <option>Guest-Portal</option>
                                        <option>Unassigned</option>
                                     </select>
                                  </div>
                                  <div className="flex justify-between items-center pt-2">
                                     <span className="text-[8px] font-black text-slate-500 uppercase">PoE State</span>
                                     <div className="w-8 h-4 bg-blue-600 rounded-full flex items-center px-1"><div className="w-2 h-2 bg-white rounded-full translate-x-4" /></div>
                                  </div>
                                  <button className="w-full py-2 bg-blue-600 text-[10px] font-black uppercase rounded-xl mt-2 hover:bg-blue-500 transition-all">Save Mapping</button>
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
      </div>
      </div>
    );
  }

  // REUSE LOGIC: Delegation to SwitchingApp UI for shared menus (Profiles, Clients)
  if (feature === 'profiles' || feature === 'wired-clients') {
    return <SwitchingApp devices={devices} feature={feature} />;
  }

  return null;
};

// Internal Components
const FabricMetricCard = ({ label, value, sub, icon }: any) => (
  <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-36">
    <div className="p-2 bg-slate-50 rounded-lg w-fit mb-3 border border-slate-100 group-hover:bg-[#0ABAB5]/10 transition-colors">{icon}</div>
    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-xl font-black text-slate-900 tracking-tight">{value}</p><p className="text-[9px] text-slate-400 mt-0.5">{sub}</p></div>
  </div>
);

const LogicNode = ({ label, icon, type }: any) => (
  <div className="flex flex-col items-center gap-3 group cursor-pointer">
     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${type === 'core' ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white border border-slate-100 text-slate-400 shadow-sm'}`}>{icon || <Network size={22} />}</div>
     <span className={`text-[9px] font-black uppercase tracking-widest ${type === 'core' ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
  </div>
);

const TrafficRankRow = ({ label, value, percentage, color }: any) => (
  <div className="space-y-2"><div className="flex justify-between items-end px-1"><span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{label}</span><span className="text-sm font-black text-slate-900">{value}</span></div><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-all duration-[1.5s]`} style={{ width: `${percentage}%` }} /></div></div>
);

const StepTab = ({ num, label, active, done }: any) => (
  <div className="flex items-center gap-3 group shrink-0">
     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-[#0ABAB5] border-[#0ABAB5] text-white scale-105 shadow-sm' : done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-400'}`}>
        {done ? <Check size={14} /> : <span className="text-[10px] font-black">{num}</span>}
     </div>
     <div className="flex flex-col">
        <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
     </div>
     <ChevronRight size={12} className="text-slate-200 ml-3 group-last:hidden" />
  </div>
);

const ArchitectureCard = ({ title, desc, active, onClick }: any) => (
  <div onClick={onClick} className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-4 group ${active ? 'border-[#0ABAB5] bg-[#0ABAB5]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
     <div className="flex justify-between items-center">
        <div className={`p-2 rounded-lg transition-all ${active ? 'bg-[#0ABAB5] text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}><Box size={18}/></div>
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#0ABAB5]' : 'border-slate-300'}`}>{active && <div className="w-2 h-2 rounded-full bg-[#0ABAB5]" />}</div>
     </div>
     <div>
        <h4 className={`text-sm font-black ${active ? 'text-[#0ABAB5]' : 'text-slate-900'}`}>{title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
     </div>
  </div>
);

const RoleAssignment = ({ title, icon, count }: any) => (
  <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-blue-300 transition-all cursor-pointer group">
     <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{icon}</div>
        <div>
           <p className="text-base font-black text-slate-800">{title}</p>
           <p className="text-xs font-medium text-slate-400 mt-0.5">{count} Node Instances Required</p>
        </div>
     </div>
     <button className="px-6 py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Select Assets</button>
  </div>
);

const PreviewRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-black text-slate-800 font-mono">{value}</span>
  </div>
);

const OverlaySegmentCard = ({ name, vni, type, traffic, status, warning = false }: any) => (
  <div className={`bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${warning ? 'border-amber-200' : 'border-slate-200'}`}>
     <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg shadow-sm ${warning ? 'bg-amber-50 text-amber-500' : 'bg-[#0ABAB5]/10 text-[#0ABAB5]'}`}><Layers size={16} /></div>
        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${warning ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{status}</span>
     </div>
     <h4 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">{name}</h4>
     <p className="text-[9px] font-bold text-slate-400 uppercase mb-4">VNI: <span className="text-[#0ABAB5] font-mono">{vni}</span> • {type}</p>
     <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
        <span className="text-[9px] font-bold text-slate-400 uppercase">Live Traffic</span>
        <span className="text-xs font-black text-slate-800">{traffic}</span>
     </div>
  </div>
);

const OverlayRow = ({ name, mode, ip, edges, status }: any) => (
  <tr className="hover:bg-slate-50 transition-all group cursor-pointer">
     <td className="px-5 py-3">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-[#0ABAB5] rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
           <span className="font-bold text-slate-800 text-xs">{name}</span>
        </div>
     </td>
     <td className="px-8 py-6 font-bold text-slate-500 text-xs uppercase">{mode}</td>
     <td className="px-8 py-6 font-mono font-black text-blue-600 text-xs">{ip}</td>
     <td className="px-8 py-6 text-sm font-black text-slate-800">{edges} Edges</td>
     <td className="px-8 py-6 text-right">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">
           <ShieldCheck size={12}/> Verified
        </div>
     </td>
  </tr>
);

export default CampusFabricApp;

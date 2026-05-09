import React, { useState } from 'react';
import { 
  Globe, Shield, Zap, Activity, Map, Settings, Plus, Save, 
  ChevronRight, Share2, ActivitySquare, Monitor, Server, 
  Info, LayoutGrid, Network, Check, ExternalLink, Sliders, Box,
  ArrowRightLeft, Database, Building2, ShieldCheck, Lock, X, CheckCircle2
} from 'lucide-react';
import { MOCK_SITES } from '../../constants.tsx';

interface SDWANAppProps {
  feature: string;
}

type InterconnectScenario = 'branch' | 'dci' | 'hybrid';

const SDWANApp: React.FC<SDWANAppProps> = ({ feature }) => {
  const [configStep, setConfigStep] = useState<number>(1);
  const [scenario, setScenario] = useState<InterconnectScenario | null>(null);
  
  // Selection State
  const [hubSite, setHubSite] = useState<string>('');
  const [targetSites, setTargetSites] = useState<string[]>([]);

  // 如果处于配置模式
  if (feature === 'config') {
    return (
      <div className="p-10 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500 pb-20 overflow-auto">
        <div className="mb-10 flex justify-between items-center shrink-0">
           <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Fabric <span className="text-blue-600">Provisioning</span></h2>
              <p className="text-slate-500 font-medium mt-2">Orchestrate logical interconnects across global geographic sites.</p>
           </div>
           {scenario && (
             <button onClick={() => { setScenario(null); setConfigStep(1); }} className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                <X size={14} /> Reset Wizard
             </button>
           )}
        </div>

        {!scenario ? (
          /* 第一步：选择互联场景 */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <ScenarioCard 
               id="branch"
               icon={<Building2 size={32} />}
               title="HQ to Branch"
               desc="Classic Hub-Spoke model connecting multiple remote branches to regional head offices."
               onSelect={() => setScenario('branch')}
             />
             <ScenarioCard 
               id="dci"
               icon={<Database size={32} />}
               title="DC to DC (DCI)"
               desc="High-speed Fabric extension between Data Centers for VM migration and cluster sync."
               onSelect={() => setScenario('dci')}
             />
             <ScenarioCard 
               id="hybrid"
               icon={<ArrowRightLeft size={32} />}
               title="HQ to DC Hybrid"
               desc="Bridge Campus User VRFs directly to Data Center logical segments for low-latency SaaS access."
               onSelect={() => setScenario('hybrid')}
             />
          </div>
        ) : (
          /* 场景化引导流程 */
          <div className="flex-1 flex flex-col min-h-0">
             {/* Progress Stepper */}
             <div className="flex items-center gap-12 mb-12 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm shrink-0">
                <ConfigStep num={1} label="Identity & Sites" active={configStep === 1} done={configStep > 1} />
                <ConfigStep num={2} label="Transport & Policy" active={configStep === 2} done={configStep > 2} />
                <ConfigStep num={3} label="Deployment Audit" active={configStep === 3} done={false} />
             </div>

             <div className="flex-1 bg-white border border-slate-200 rounded-[3.5rem] p-12 shadow-sm overflow-auto custom-scrollbar">
                {configStep === 1 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="grid grid-cols-2 gap-20">
                        <div className="space-y-8">
                           <h4 className="text-xl font-black text-slate-800 border-l-4 border-blue-600 pl-4 uppercase tracking-tighter">
                             {scenario === 'branch' ? 'Regional Hub Site' : scenario === 'dci' ? 'Primary DC Node' : 'HQ Gateway'}
                           </h4>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed">Select the core orchestration node that will serve as the traffic gateway or DCI termination point.</p>
                           <select 
                             value={hubSite}
                             onChange={(e) => setHubSite(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/5 focus:border-blue-500 transition-all"
                           >
                              <option value="">Select Primary Site...</option>
                              {MOCK_SITES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.siteType})</option>)}
                           </select>

                           {hubSite && (
                             <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4 animate-in zoom-in-95">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                   <Server size={24} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Role</p>
                                   <p className="text-sm font-black text-blue-900">Assigned as Fabric Orchestrator</p>
                                </div>
                             </div>
                           )}
                        </div>
                        
                        <div className="space-y-8">
                           <h4 className="text-xl font-black text-slate-800 border-l-4 border-slate-200 pl-4 uppercase tracking-tighter">Remote Spokes / Peers</h4>
                           <div className="space-y-3 max-h-[350px] overflow-auto pr-2 custom-scrollbar">
                              {MOCK_SITES.filter(s => s.id !== hubSite).map(s => (
                                <button 
                                  key={s.id}
                                  onClick={() => setTargetSites(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${targetSites.includes(s.id) ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                                >
                                   <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${targetSites.includes(s.id) ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-300'}`}>
                                         {s.siteType === 'DataCenter' ? <Database size={18} /> : <Building2 size={18} />}
                                      </div>
                                      <div className="text-left">
                                         <span className={`text-sm font-bold block ${targetSites.includes(s.id) ? 'text-blue-900' : 'text-slate-500'}`}>{s.name}</span>
                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.siteType}</span>
                                      </div>
                                   </div>
                                   {targetSites.includes(s.id) && <CheckCircle2 size={18} className="text-blue-600 animate-in zoom-in" />}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {configStep === 2 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="grid grid-cols-2 gap-16">
                        <div className="space-y-8">
                           <h4 className="text-xl font-black text-slate-800 border-l-4 border-cyan-500 pl-4 uppercase tracking-tighter">Transmission Protocol</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <ProtocolOption 
                                label="VXLAN EVPN" 
                                desc="L2 Extension / DCI" 
                                icon={<Network size={16}/>} 
                                active={scenario === 'dci' || scenario === 'hybrid'} 
                              />
                              <ProtocolOption 
                                label="IPsec / SD-WAN" 
                                desc="Secure WAN Overlay" 
                                icon={<Shield size={16}/>} 
                                active={scenario === 'branch'} 
                              />
                              <ProtocolOption 
                                label="Direct Fiber" 
                                desc="L3 Dedicated Link" 
                                icon={<Zap size={16}/>} 
                              />
                              <ProtocolOption 
                                label="MPLS L3VPN" 
                                desc="Carrier Managed" 
                                icon={<Globe size={16}/>} 
                              />
                           </div>
                        </div>
                        <div className="space-y-8">
                           <h4 className="text-xl font-black text-slate-800 border-l-4 border-slate-200 pl-4 uppercase tracking-tighter">Global Fabric Policy</h4>
                           <div className="space-y-4">
                              <PolicyToggle label="Enable Path Steering (DPI)" active />
                              <PolicyToggle label="Application SLA Enforcement" active />
                              <PolicyToggle label="End-to-End Encryption" active />
                              <div className="pt-4 border-t border-slate-50">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Maximum Aggregated MTU</label>
                                 <input type="range" className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" min="1500" max="9216" defaultValue="9000" />
                                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mt-2"><span>1500</span><span>Jumbo Frame (9216)</span></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {configStep === 3 && (
                   <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-500">
                      <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl animate-pulse">
                         <Share2 size={40} />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2 text-center">Intent Generation Successful</h3>
                      <p className="text-slate-500 font-medium max-w-md text-center leading-relaxed">
                         The SD-WAN orchestrator is pushing the logical topology to <span className="text-blue-600 font-bold">{targetSites.length} remote nodes</span> and the hub site <span className="text-blue-600 font-bold">{MOCK_SITES.find(s => s.id === hubSite)?.name || 'Central Node'}</span>.
                      </p>
                      
                      <div className="mt-12 w-full max-w-2xl bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-6 shadow-inner">
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Proposed Tunnels</span><span className="text-sm font-black text-slate-800">{targetSites.length} Dual-Homed Links</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimated Latency (P50)</span><span className="text-sm font-black text-blue-600">~18ms - 22ms</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Security Verification</span><span className="text-xs font-black text-emerald-600 flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">CERT-AUTH-OK <ShieldCheck size={14}/></span></div>
                      </div>
                   </div>
                )}
             </div>

             <div className="mt-12 flex justify-between items-center px-4 shrink-0">
                <button 
                  onClick={() => configStep > 1 && setConfigStep(prev => prev - 1)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${configStep > 1 ? 'text-slate-500 hover:bg-slate-100' : 'opacity-0 pointer-events-none'}`}
                >
                   Previous Step
                </button>
                <div className="flex gap-4">
                   <button onClick={() => setScenario(null)} className="px-8 py-3 text-slate-400 font-black text-[10px] uppercase hover:text-slate-600 transition-all">Cancel Wizard</button>
                   <button 
                     onClick={() => configStep < 3 ? setConfigStep(prev => prev + 1) : setScenario(null)}
                     className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
                   >
                      {configStep === 3 ? 'Finalize & Deploy' : 'Save & Continue'}
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // 默认总览页面
  return (
    <div className="p-10 max-w-7xl mx-auto h-full flex flex-col space-y-10 animate-in fade-in duration-300 pb-32 overflow-auto custom-scrollbar">
      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <MetricCard label="Active Tunnels" value="12" sub="Full Mesh State" icon={<Globe className="text-cyan-600" />} />
        <MetricCard label="Aggregated Bandwidth" value="4.2 Gbps" sub="Universal Overlays" icon={<Zap className="text-amber-500" />} />
        <MetricCard label="Fabric Latency (Avg)" value="12ms" sub="Global Sync" icon={<Activity className="text-emerald-500" />} />
        <MetricCard label="Compliance" value="100%" sub="Identity Policy" icon={<Shield className="text-blue-600" />} />
      </div>

      {/* Global Connectivity Matrix */}
      <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm overflow-hidden flex flex-col">
         <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <Share2 size={22} className="text-cyan-500" />
               Global Fabric Interconnect Matrix (Site-to-Site)
            </h3>
            <div className="flex gap-2">
               <button className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Export Matrix</button>
               <button className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-900/10 hover:bg-cyan-700 transition-all">Optimize Paths</button>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                     <th className="px-8 py-5 rounded-l-2xl">Source Node</th>
                     <th className="px-8 py-5">Destination Node</th>
                     <th className="px-8 py-5">Tunnel Type</th>
                     <th className="px-8 py-5 text-center">Latency</th>
                     <th className="px-8 py-5 rounded-r-2xl text-right">Verification</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 font-medium">
                  <MatrixRow from="Wuhan HQ (Campus)" to="Beijing DC (Cloud)" path="Direct Fiber (DCI Fabric)" latency="2ms" status="Optimal" />
                  <MatrixRow from="Wuhan HQ (Campus)" to="Nanjing Branch" path="Overlay VPN (SD-WAN)" latency="16ms" status="Optimal" />
                  <MatrixRow from="Beijing DC (Spine)" to="Regional DC 2" path="EVPN VXLAN Mesh" latency="1ms" status="Optimal" />
                  <MatrixRow from="Nanjing Branch" to="Beijing DC" path="LTE / 5G Backup" latency="42ms" status="Degraded" />
               </tbody>
            </table>
         </div>
      </div>
      
      {/* Visual Overlay - Dark Telemetry Map */}
      <div className="bg-[#0f172a] rounded-[3.5rem] p-12 h-96 relative overflow-hidden flex flex-col justify-end group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-800 shrink-0">
         <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#0ea5e9_0%,transparent_70%)]" />
         
         {/* Animated Grid Lines */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
            backgroundSize: '80px 80px'
         }} />

         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-around items-center px-32 max-w-5xl">
            {/* Visual Nodes */}
            <SitePulse label="Campus HQ" active />
            <div className="flex-1 h-px bg-cyan-500/20 relative mx-4">
               <div className="absolute top-1/2 left-0 h-1 bg-cyan-400 rounded-full shadow-[0_0_15px_#0ea5e9] transition-all duration-1000 w-[70%]" />
               <div className="absolute top-1/2 -translate-y-1/2 h-3 w-1 bg-white rounded-full animate-ping" style={{ left: '70%' }} />
            </div>
            <SitePulse label="Cloud DC" active icon={<Box size={24} />} />
            <div className="flex-1 h-px bg-slate-700/50 relative mx-4">
               <div className="absolute top-1/2 left-0 h-1 bg-amber-500/60 rounded-full animate-pulse w-[40%]" />
            </div>
            <SitePulse label="Edge Branch" icon={<Building2 size={24} />} />
         </div>

         <div className="relative z-10 flex items-center justify-between">
            <div>
               <p className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-1">Hybrid Fabric Telemetry</p>
               <p className="text-slate-300 font-medium text-lg tracking-tight">Visualizing <span className="text-white font-black">12 active</span> hybrid interconnects across DC and Campus regions.</p>
            </div>
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Throughput</p>
                  <p className="text-xl font-black text-white">14.2 GB/s</p>
               </div>
               <div className="w-px h-10 bg-slate-800" />
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Fabric Key</p>
                  <p className="text-xl font-black text-white">CH-8092</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// UI Helpers
const ScenarioCard = ({ icon, title, desc, onSelect }: any) => (
  <div 
    onClick={onSelect}
    className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm hover:border-blue-600 hover:shadow-xl transition-all cursor-pointer group flex flex-col gap-6"
  >
     <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
        {icon}
     </div>
     <div>
        <h4 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-sm text-slate-400 font-medium leading-relaxed mt-2">{desc}</p>
     </div>
     <div className="mt-auto pt-6 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
        Launch Config <ChevronRight size={14} />
     </div>
  </div>
);

const ConfigStep = ({ num, label, active, done }: any) => (
  <div className="flex items-center gap-4 group shrink-0">
     <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' : done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-300'}`}>
        {done ? <Check size={20} /> : <span className="text-xs font-black">{num}</span>}
     </div>
     <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900 underline decoration-blue-500/30' : 'text-slate-300'}`}>{label}</span>
     <ChevronRight size={16} className="text-slate-100 group-last:hidden" />
  </div>
);

const ProtocolOption = ({ label, desc, icon, active = false }: any) => (
  <div className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${active ? 'bg-white border-blue-600 shadow-lg' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'}`}>
     <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>{icon}</div>
     <p className="text-xs font-black text-slate-900 leading-tight">{label}</p>
     <p className="text-[9px] font-medium text-slate-400 uppercase mt-1">{desc}</p>
  </div>
);

const PolicyToggle = ({ label, active = false }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all cursor-pointer group">
     <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{label}</span>
     <div className={`w-10 h-6 rounded-full p-1 transition-all ${active ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-all ${active ? 'translate-x-4 shadow-md' : ''}`} />
     </div>
  </div>
);

const MetricCard = ({ label, value, sub, icon }: any) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-48">
    <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 border border-slate-100 group-hover:bg-cyan-50 transition-colors shadow-inner">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest italic">{sub}</p>
    </div>
  </div>
);

const MatrixRow = ({ from, to, path, latency, status }: any) => (
  <tr className="hover:bg-slate-50/80 transition-all group cursor-pointer">
     <td className="px-8 py-7">
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${from.includes('DC') ? 'bg-indigo-500' : 'bg-blue-500'} shadow-[0_0_8px_currentColor]`} />
           <span className="font-bold text-slate-800 text-sm tracking-tight">{from}</span>
        </div>
     </td>
     <td className="px-8 py-7 font-bold text-slate-800 text-sm tracking-tight">{to}</td>
     <td className="px-8 py-7">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/50">{path}</span>
     </td>
     <td className="px-8 py-7 text-center font-mono font-black text-slate-600 text-xs">{latency}</td>
     <td className="px-8 py-7 text-right">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
          status === 'Optimal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
           <Activity size={12} className={status === 'Optimal' ? 'animate-pulse' : ''} />
           {status}
        </div>
     </td>
  </tr>
);

const SitePulse = ({ label, active, icon }: any) => (
   <div className="flex flex-col items-center gap-4 group">
      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 ${active ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_30px_rgba(14,165,233,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-600'}`}>
         {/* Fix: Added <any> to React.ReactElement to resolve className error */}
         {icon ? React.cloneElement(icon as React.ReactElement<any>, { className: active ? 'text-cyan-400' : '' }) : <Server size={24} className={active ? 'text-cyan-400' : ''} />}
      </div>
      <div className="text-center">
         <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-cyan-400' : 'text-slate-600'}`}>{label}</span>
         {active && <div className="mt-1.5 flex gap-1 justify-center"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#0ea5e9]" /><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-30" /></div>}
      </div>
   </div>
);

export default SDWANApp;
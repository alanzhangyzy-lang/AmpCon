
import React, { useState, useEffect } from 'react';
import { 
  Wifi, Plus, Save, Activity, Radio, Smartphone, Globe, ChevronRight, X, Layers, Network, Settings, 
  Search, Laptop, Shield, Info, MoreVertical, Clock, CheckCircle2, ChevronUp, RefreshCw, Maximize2, LayoutGrid, Check,
  Sliders, Zap, ShieldAlert, ActivitySquare, AlertCircle, BarChart, TrendingUp, Gauge, Lock, Filter, Eye, EyeOff,
  ChevronDown, Cpu, Server, Terminal, HardDrive, Trash2, Edit3, Calendar, FileText, MousePointer2, Key
} from 'lucide-react';
import { Device, Client } from '../../types';

interface WirelessAppProps {
  devices: Device[];
  feature: string;
}

const WirelessApp: React.FC<WirelessAppProps> = ({ devices, feature }) => {
  const [showSSIDModal, setShowSSIDModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'radius' | 'mpsk' | 'portal' | 'timerange'>('radius');
  const [configStep, setConfigStep] = useState<1 | 2 | 3>(1);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryTab, setSummaryTab] = useState<'summary' | 'result'>('summary');
  const [showPassword, setShowPassword] = useState(false);
  
  // Advanced Step Collapsible Sections
  const [expandedSections, setExpandedSections] = useState<string[]>(['system', 'lan', 'ip', 'services']);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (feature !== 'config') { setShowSummary(false); setConfigStep(1); setSummaryTab('summary'); }
  }, [feature]);

  if (feature === 'overview') {
    return (
      <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300 bg-[#fcfcfc] h-full overflow-auto pb-32">
        <div className="flex justify-between items-end">
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">Wireless <span className="text-blue-600">Mobility</span></h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">RF Ecosystem & User Experience Matrix</p>
           </div>
           <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Scan Airwaves</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <MetricCard label="Experience Score" value="94%" sub="Optimal Connectivity" icon={<ActivitySquare className="text-blue-600" />} />
          <MetricCard label="Online Clients" value="248" sub="2.4G/5G/6G Distributed" icon={<Smartphone className="text-blue-600" />} />
          <MetricCard label="Airtime Usage" value="12%" sub="RF Congestion Low" icon={<Radio className="text-orange-600" />} />
          <MetricCard label="Roaming Success" value="99.2%" sub="Seamless L2/L3 Shifts" icon={<RefreshCw className="text-purple-600" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm flex flex-col group">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-10">Signal Distribution (RSSI)</h3>
              <div className="space-y-6 flex-1 justify-center flex flex-col">
                 <SignalBucket label="Excellent (> -50dBm)" count={156} percentage={65} color="bg-blue-600" />
                 <SignalBucket label="Stable (-51 to -70)" count={82} percentage={30} color="bg-blue-400" />
                 <SignalBucket label="Weak (-71 to -85)" count={8} percentage={4} color="bg-amber-400" />
                 <SignalBucket label="Critical (< -85dBm)" count={2} percentage={1} color="bg-red-500" />
              </div>
           </div>
           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm flex flex-col group">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8">RF Interference Profile</h3>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                 <div className="relative w-44 h-44 mb-8">
                    <svg className="w-full h-full -rotate-90">
                       <circle cx="88" cy="88" r="76" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                       <circle cx="88" cy="88" r="76" fill="none" stroke="#81D8D0" strokeWidth="16" strokeDasharray="477" strokeDashoffset="440" />
                       <circle cx="88" cy="88" r="76" fill="none" stroke="#fbbf24" strokeWidth="16" strokeDasharray="477" strokeDashoffset="465" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <p className="text-4xl font-black text-slate-800">92%</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase">Clear Spectrum</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm flex flex-col group">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8">AP Load Distribution</h3>
              <div className="space-y-6 flex-1">
                 <div>
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 border-l-4 border-red-500 pl-3">Crowded Nodes (Top 5)</p>
                    <div className="space-y-2">
                       <ApLoadRow name="HQ-Lobby-AP-01" clients={82} color="bg-red-500" />
                       <ApLoadRow name="HQ-Cafe-WiFi" clients={65} color="bg-amber-500" />
                    </div>
                 </div>
              </div>
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
                <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm overflow-hidden flex flex-col">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                            <th className="px-8 py-5">SSID Name</th>
                            <th className="px-8 py-5">Security</th>
                            <th className="px-8 py-5 text-right">WLAN Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         <SummarySsidRow name="wireless-1" security="WPA2-PSK" status={true} />
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                         <th className="px-8 py-5">Device Name</th>
                         <th className="px-8 py-5">Config Result</th>
                         <th className="px-8 py-5">Config Time</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-bold text-sm">
                      <ConfigResultRow name="AP-Lobby-01" status="In Progress" time="2025-11-12 14:17:12" />
                   </tbody>
                </table>
             </div>
           )}
           <div className="mt-12 flex justify-between items-center px-4">
              <button onClick={() => setShowSummary(false)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-colors">
                 <RefreshCw size={14} /> Clear Wireless Intent
              </button>
           </div>
        </div>
      );
    }

    return (
      <div className="p-10 max-w-7xl mx-auto h-full flex flex-col bg-[#fcfcfc] overflow-auto pb-32">
        <div className="flex items-center gap-12 mb-12 border-b border-slate-100 pb-8 px-4">
          <StepIndicator number={1} label="SSID" active={configStep === 1} completed={configStep > 1} onClick={() => setConfigStep(1)} />
          <StepIndicator number={2} label="RADIO" active={configStep === 2} completed={configStep > 2} onClick={() => setConfigStep(2)} />
          <StepIndicator number={3} label="ADVANCED" active={configStep === 3} completed={false} onClick={() => setConfigStep(3)} />
        </div>
        
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {configStep === 1 && (
            <div className="space-y-10">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5">SSID Name</th>
                      <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-sm">
                    <tr>
                      <td className="px-8 py-5 text-blue-600 underline cursor-pointer">AmpCon-Corp</td>
                      <td className="px-8 py-5 text-right"><div className="w-2 h-2 bg-blue-600 rounded-full ml-auto shadow-[0_0_8px_rgba(129,216,208,0.5)]" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div onClick={() => setShowSSIDModal(true)} className="group border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all cursor-pointer bg-white/50">
                 <Plus size={32} />
                 <p className="text-xl font-black uppercase tracking-widest">Create SSID</p>
              </div>
            </div>
          )}

          {configStep === 2 && (
            <div className="space-y-12 max-w-5xl mx-auto pb-10">
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <RadioField label="Country" value="US (United States)" />
                     <RadioToggle label="Radio Scheduled" active />
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-600">Radio Mode</label>
                        <div className="flex gap-6">
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rmode" className="text-blue-600" /><span className="text-sm font-bold">Radio On</span></label>
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rmode" defaultChecked className="text-blue-600" /><span className="text-sm font-bold">Radio Off</span></label>
                        </div>
                     </div>
                     <RadioField label="Time Range" value="Time Range Profile 1" subAction="Manage Time Range Profile" />
                  </div>
                  <div className="space-y-8">
                     <RadioToggle label="Mesh Enablement" active />
                     <RadioField label="Deployment Priority" value="Performance Optimized" />
                  </div>
               </div>

               <div className="space-y-10">
                  <RfBandSection label="2.4G" active />
                  <RfBandSection label="5G" active />
                  <RfBandSection label="6G" />
               </div>
            </div>
          )}

          {configStep === 3 && (
            <div className="space-y-6 max-w-5xl mx-auto pb-20">
               <AdvancedSection id="system" title="System" expanded={expandedSections.includes('system')} onToggle={toggleSection}>
                  <div className="space-y-4 pt-4">
                     <AdvancedToggle label="Device Naming" active />
                     <AdvancedToggle label="LEDs Active" active />
                     <AdvancedToggle label="Wi-Fi Onboarding Support" active />
                  </div>
               </AdvancedSection>

               <AdvancedSection id="lan" title="LAN Port Configuration" expanded={expandedSections.includes('lan')} onToggle={toggleSection}>
                  <div className="space-y-6 pt-4">
                     <AdvancedToggle label="Enable Port 1" active />
                     <div className="flex items-center justify-between pl-4">
                        <label className="text-sm font-bold text-slate-600">Network Binding</label>
                        <div className="flex gap-6">
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ntype" /><span className="text-xs font-bold">Default</span></label>
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ntype" defaultChecked /><span className="text-xs font-bold">VLAN Tagged</span></label>
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ntype" /><span className="text-xs font-bold">L3 Routing</span></label>
                        </div>
                     </div>
                     <div className="flex items-center justify-between pl-4">
                        <label className="text-sm font-bold text-slate-600">Link Mode</label>
                        <div className="flex gap-6">
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pmode" /><span className="text-xs font-bold">Access</span></label>
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pmode" defaultChecked /><span className="text-xs font-bold">Trunk</span></label>
                        </div>
                     </div>
                     <AdvancedInput label="Tagged VLANs" placeholder="e.g. 10, 20, 30" />
                  </div>
               </AdvancedSection>

               <AdvancedSection id="ip" title="Management & IP Address" expanded={expandedSections.includes('ip')} onToggle={toggleSection}>
                  <div className="space-y-6 pt-4">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-600">IPv4 Assignment</label>
                        <div className="flex gap-6">
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ip4" defaultChecked /><span className="text-xs font-bold">DHCP (Dynamic)</span></label>
                           <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ip4" /><span className="text-xs font-bold">Static IP</span></label>
                        </div>
                     </div>
                     <AdvancedToggle label="IPv6 Stack" />
                     <AdvancedToggle label="Management VLAN" active />
                     <AdvancedInput label="Management VLAN ID" defaultValue="10" />
                  </div>
               </AdvancedSection>

               <AdvancedSection id="services" title="Platform Services" expanded={expandedSections.includes('services')} onToggle={toggleSection}>
                  <div className="space-y-6 pt-4">
                     <div className="flex items-center gap-3 mb-2">
                        <Terminal size={16} className="text-blue-600" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Remote Access</h4>
                     </div>
                     <AdvancedToggle label="SSH Terminal Access" active />
                     <AdvancedInput label="SSH Port" defaultValue="22" />
                     
                     <div className="flex items-center gap-3 mb-2 pt-4">
                        <Globe size={16} className="text-blue-600" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Web UI</h4>
                     </div>
                     <AdvancedToggle label="HTTP Management" active />
                     <AdvancedToggle label="HTTPS Redirect" active />
                  </div>
               </AdvancedSection>
            </div>
          )}
        </div>
        
        <div className="mt-12 flex justify-between items-center px-4">
          <div>{configStep > 1 && <button onClick={() => setConfigStep(s => (s-1) as any)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest">PREVIOUS</button>}</div>
          <div className="flex gap-4">
            <button className="px-8 py-3 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest">CANCEL</button>
            <button onClick={() => configStep < 3 ? setConfigStep(s => (s+1) as any) : setShowSummary(true)} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">NEXT</button>
          </div>
        </div>

        {showSSIDModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden border border-slate-100">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                   <h2 className="text-2xl font-bold text-slate-800">Create New SSID</h2>
                   <button onClick={() => setShowSSIDModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                   <div className="grid grid-cols-2 gap-x-20 gap-y-10">
                      <div className="space-y-8">
                         <div className="flex items-center justify-between"><label className="text-sm font-bold text-slate-700">SSID <span className="text-red-500">*</span></label><input type="text" placeholder="e.g. Office-Guest" className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm w-72 focus:border-blue-600 outline-none" /></div>
                         <div className="flex items-center justify-between"><label className="text-sm font-bold text-slate-700">WLAN</label><div className="w-10 h-5 bg-blue-600 rounded-full p-1 flex justify-end transition-all"><div className="w-3 h-3 bg-white rounded-full shadow-sm" /></div></div>
                      </div>
                      <div className="space-y-8">
                         <div className="flex items-start justify-between">
                            <label className="text-sm font-bold text-slate-700">Wi-Fi Bands <span className="text-red-500">*</span></label>
                            <div className="flex gap-6 w-72">
                               <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="text-blue-600 rounded" /><span>2G</span></label>
                               <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="text-blue-600 rounded" /><span>5G</span></label>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="px-8 py-6 border-t border-slate-50 bg-white flex justify-end gap-3">
                   <button onClick={() => setShowSSIDModal(false)} className="px-8 py-2 border border-blue-600 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50">Cancel</button>
                   <button onClick={() => setShowSSIDModal(false)} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Apply</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (feature === 'profiles') {
     return (
       <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300 pb-32 h-full overflow-auto bg-[#fcfcfc]">
          <div className="flex flex-col gap-8">
             <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Wireless <span className="text-blue-600">Profiles</span></h1>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Global Wireless Policy Entities</p>
                </div>
                <div className="flex gap-3">
                   <button className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 group">
                      <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> Update All AP Configurations
                   </button>
                   <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                      <Plus size={16} /> Create {activeProfileTab.toUpperCase()}
                   </button>
                </div>
             </div>

             <div className="flex gap-1 bg-slate-100 p-1.5 rounded-[1.75rem] w-fit shadow-inner">
                <ProfileTab label="SSID RADIUS" active={activeProfileTab === 'radius'} onClick={() => setActiveProfileTab('radius')} icon={<Lock size={12}/>} />
                <ProfileTab label="MPSK" active={activeProfileTab === 'mpsk'} onClick={() => setActiveProfileTab('mpsk')} icon={<Key size={12}/>} />
                <ProfileTab label="Portal" active={activeProfileTab === 'portal'} onClick={() => setActiveProfileTab('portal')} icon={<MousePointer2 size={12}/>} />
                <ProfileTab label="Time Range" active={activeProfileTab === 'timerange'} onClick={() => setActiveProfileTab('timerange')} icon={<Calendar size={12}/>} />
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-500">
             <table className="w-full text-left">
                <thead>
                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-6">Identity / Name</th>
                      {activeProfileTab === 'radius' && <><th className="px-8 py-6">Type</th><th className="px-8 py-6">Auth Server Host</th><th className="px-8 py-6 text-center">Port</th></>}
                      {activeProfileTab === 'portal' && <th className="px-8 py-6">Auth Mode</th>}
                      {activeProfileTab === 'timerange' && <th className="px-8 py-6">Schedule Detail</th>}
                      <th className="px-8 py-6">Modify Time</th>
                      <th className="px-8 py-6">Description</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-sm">
                   {activeProfileTab === 'radius' && (
                      <>
                         <ProfileRow name="radius-corp-ext" type="External" host="192.168.10.22" port="1812" time="2025-12-22 16:48:46" desc="Corporate External Auth" />
                         <ProfileRow name="radius-local-01" type="Local" host="127.0.0.1" port="1812" time="2025-12-22 17:15:54" desc="Internal Node Auth" />
                      </>
                   )}
                   {activeProfileTab === 'mpsk' && (
                      <>
                         <ProfileRow name="mpsk-guest-dynamic" time="2025-12-22 16:48:46" desc="Dynamic Multi-PSK Policy" />
                         <ProfileRow name="mpsk-iot-static" time="2025-12-22 17:15:54" desc="Static IoT Fleet Keys" />
                      </>
                   )}
                   {activeProfileTab === 'portal' && (
                      <>
                         <ProfileRow name="Lobby Login Page" mode="Click" time="2025-12-22 16:48:46" desc="Standard Click-through" />
                         <ProfileRow name="Office Onboarding" mode="Radius" time="2025-12-22 17:15:54" desc="Auth via Radius Credentials" />
                      </>
                   )}
                   {activeProfileTab === 'timerange' && (
                      <>
                         <ProfileRow name="Business Hours" schedule="Mon-Fri 08:00 - 18:00" time="2025-12-22 16:48:46" desc="Standard Office Schedule" />
                         <ProfileRow name="Maintenance Window" schedule="Sun 01:00 - 04:00" time="2025-12-22 17:15:54" desc="Weekly Patch Period" />
                      </>
                   )}
                </tbody>
             </table>
          </div>
       </div>
     );
  }

  return null;
};

// Internal Components
const MetricCard = ({ label, value, sub, icon }: any) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-48">
    <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 border border-slate-100 group-hover:bg-blue-50 transition-colors">{icon}</div>
    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p><p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p><p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest italic">{sub}</p></div>
  </div>
);

const SignalBucket = ({ label, count, percentage, color }: any) => (
  <div className="space-y-2 group cursor-default">
     <div className="flex justify-between items-end px-1"><span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{label}</span><span className="text-xs font-black text-slate-900">{count} Users</span></div>
     <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100"><div className={`h-full ${color} rounded-full transition-all duration-1000 opacity-70 group-hover:opacity-100`} style={{ width: `${percentage}%` }} /></div>
  </div>
);

const ApLoadRow = ({ name, clients, color }: any) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-50 rounded-2xl group hover:border-blue-100 transition-all shadow-sm">
     <div className="flex-1"><p className="text-xs font-black text-slate-800">{name}</p><div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, (clients/100)*100)}%` }} /></div></div>
     <div className="text-right w-10"><p className="text-base font-black text-slate-900">{clients}</p></div>
  </div>
);

const StepIndicator = ({ number, label, active, completed, onClick }: any) => (
  <button onClick={onClick} className="flex items-center gap-4 group">
     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-blue-600 bg-white text-blue-600 shadow-lg' : completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-400'}`}>
        {completed ? <Check size={16} /> : <span className="text-[11px] font-black">{number}</span>}
     </div>
     <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const ProfileTab = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${active ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
     {icon} {label}
  </button>
);

const ProfileRow = ({ name, type, host, port, time, desc, mode, schedule }: any) => (
  <tr className="hover:bg-slate-50/50 transition-colors group">
     <td className="px-8 py-6">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><FileText size={18} /></div>
           <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">{name}</span>
        </div>
     </td>
     {type && <td className="px-8 py-6"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${type === 'External' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{type}</span></td>}
     {host && <td className="px-8 py-6 font-mono text-slate-500">{host}</td>}
     {port && <td className="px-8 py-6 text-center text-slate-400 font-mono">{port}</td>}
     {mode && <td className="px-8 py-6"><span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase border border-amber-100">{mode}</span></td>}
     {schedule && <td className="px-8 py-6"><div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit"><Clock size={12} /> <span className="text-[10px] font-black uppercase">{schedule}</span></div></td>}
     <td className="px-8 py-6 text-slate-400 font-mono text-xs">{time}</td>
     <td className="px-8 py-6 text-slate-400 italic text-xs max-w-xs truncate">{desc || '--'}</td>
     <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit"><Edit3 size={16} /></button>
           <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
        </div>
     </td>
  </tr>
);

const SummarySsidRow = ({ name, security, status }: any) => (
  <tr className="hover:bg-slate-50 group">
     <td className="px-8 py-5 text-blue-600 underline cursor-pointer">{name}</td>
     <td className="px-8 py-5 text-slate-600">{security}</td>
     <td className="px-8 py-5 text-right">
        <div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-all ${status ? 'bg-blue-600 flex justify-end ml-auto' : 'bg-slate-200 flex justify-start ml-auto'}`}>
           <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
        </div>
     </td>
  </tr>
);

const ConfigResultRow = ({ name, status, time }: any) => {
  const statusStyles: any = {
    'In Progress': 'bg-amber-50 text-amber-600 border-amber-100',
    'Succeed': 'bg-blue-50 text-blue-600 border-blue-100',
  };
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
       <td className="px-8 py-6 text-slate-800">{name}</td>
       <td className="px-8 py-6">
          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${statusStyles[status]}`}>
             {status}
          </span>
       </td>
       <td className="px-8 py-6 text-slate-400 font-mono text-[11px]">{time}</td>
    </tr>
  );
};

// Radio UI Helpers
const RadioField = ({ label, value, subAction }: any) => (
  <div className="flex items-center justify-between border-b border-slate-50 py-4">
     <label className="text-sm font-bold text-slate-600">{label}</label>
     <div className="text-right">
        <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold w-64 outline-none focus:border-blue-600 transition-all"><option>{value}</option></select>
        {subAction && <p className="text-[9px] font-black text-blue-600 uppercase mt-1 cursor-pointer hover:underline">{subAction}</p>}
     </div>
  </div>
);

const RadioToggle = ({ label, active }: any) => (
  <div className="flex items-center justify-between border-b border-slate-50 py-4">
     <label className="text-sm font-bold text-slate-600">{label}</label>
     <div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-all ${active ? 'bg-blue-600 flex justify-end' : 'bg-slate-200 flex justify-start'}`}><div className="w-3 h-3 bg-white rounded-full shadow-sm" /></div>
  </div>
);

const RfBandSection = ({ label, active = false }: any) => (
  <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
     <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{label} Infrastructure</h3>
        <div className={`w-8 h-4 rounded-full p-0.5 ${active ? 'bg-blue-600 flex justify-end' : 'bg-slate-200 flex justify-start'}`}><div className="w-3 h-3 bg-white rounded-full shadow-sm" /></div>
     </div>
     <div className="p-8 grid grid-cols-2 gap-x-20 gap-y-6">
        <RfParam label="TX Power" type="radio" options={['Default', 'Manual']} />
        <RfParam label="Channel Width" type="select" value="20MHz" />
        <RfParam label="Channel List" type="checkbox-group" options={['All', '1', '6', '11']} />
        <RfParam label="Max Terminal Load" type="input" placeholder="e.g. 100" />
     </div>
  </div>
);

const RfParam = ({ label, type, options, value, placeholder }: any) => (
  <div className="flex items-center justify-between">
     <label className="text-[11px] font-black text-slate-400 uppercase tracking-tight">{label}</label>
     <div className="w-64">
        {type === 'select' && <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-blue-600"><option>{value}</option></select>}
        {type === 'input' && <input type="text" placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-blue-600" />}
        {type === 'radio' && (<div className="flex gap-4">{options.map((o: string) => <label key={o} className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name={label} className="w-3 h-3 text-blue-600" /><span className="text-[10px] font-bold text-slate-600">{o}</span></label>)}</div>)}
        {type === 'checkbox-group' && (<div className="flex gap-3">{options.map((o: string) => <label key={o} className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3 h-3 text-blue-600" /><span className="text-[10px] font-bold text-slate-600">{o}</span></label>)}</div>)}
     </div>
  </div>
);

// Advanced Section Helpers
const AdvancedSection = ({ id, title, children, expanded, onToggle }: any) => (
  <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:border-blue-100">
     <div onClick={() => onToggle(id)} className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors">
        <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
        {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
     </div>
     {expanded && <div className="px-8 pb-10 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">{children}</div>}
  </div>
);

const AdvancedToggle = ({ label, active }: any) => (
  <div className="flex items-center justify-between py-2"><label className="text-sm font-bold text-slate-600">{label}</label><div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-all ${active ? 'bg-blue-600 flex justify-end' : 'bg-slate-200 flex justify-start'}`}><div className="w-3 h-3 bg-white rounded-full shadow-sm" /></div></div>
);

const AdvancedInput = ({ label, defaultValue, placeholder }: any) => (
  <div className="flex items-center justify-between py-2"><label className="text-sm font-bold text-slate-600">{label}</label><input type="text" defaultValue={defaultValue} placeholder={placeholder} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold w-72 outline-none focus:border-blue-600 transition-all" /></div>
);

export default WirelessApp;

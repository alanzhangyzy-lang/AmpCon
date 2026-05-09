
import React from 'react';
import { ShieldCheck, Users, Lock, UserX, UserCheck, Activity, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';

const NACApp: React.FC = () => {
  return (
    <div className="p-10 max-w-7xl mx-auto h-full flex flex-col space-y-10 animate-in fade-in duration-300 overflow-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Access <span className="text-cyan-600">Control</span></h1>
          <p className="text-slate-500 font-medium">Policy orchestration and endpoint identity verification.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-cyan-600 text-white rounded-2xl font-bold shadow-xl shadow-cyan-100 transition-all active:scale-95">Deploy NAC Strategy</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <MetricCard label="Auth Requests" value="1.2k" sub="Last 1h" icon={<Activity className="text-cyan-600" />} />
        <MetricCard label="Authorized Devices" value="842" sub="802.1X Active" icon={<UserCheck className="text-emerald-600" />} />
        <MetricCard label="Quarantined" value="3" sub="Policy Violations" icon={<UserX className="text-red-500" />} />
        <MetricCard label="Policy Hit Rate" value="98%" sub="Optimized" icon={<ShieldCheck className="text-blue-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Users size={22} className="text-cyan-500" /> Active Authentications</h3>
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Filter identities..." className="bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs" />
               </div>
            </div>
            <div className="space-y-3">
               <AuthRow user="Zhang San" device="MacBook Pro" status="Compliant" method="802.1X (TLS)" />
               <AuthRow user="Li Si" device="iPhone 15" status="Compliant" method="802.1X (PEAP)" />
               <AuthRow user="Guest-4412" device="Android" status="Limited" method="Captive Portal" />
               <AuthRow user="IoT-Sensor-01" device="Unknown" status="Quarantined" method="MAB (MAC Auth)" />
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-cyan-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-cyan-900/10">
               <ShieldCheck size={40} className="mb-6 opacity-40" />
               <h3 className="text-2xl font-black mb-2 tracking-tight">Postcheck Engine</h3>
               <p className="text-xs text-cyan-100 leading-relaxed font-medium mb-6">Device health checks are mandatory for <span className="font-black italic">AmpCon-Corp</span> SSID. Non-compliant devices are automatically isolated into VLAN 999.</p>
               <button className="w-full py-4 bg-white text-cyan-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Posture Settings</button>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Security Alerts</h3>
               <div className="space-y-4">
                  <AlertItem type="Brute Force" count={12} level="critical" />
                  <AlertItem type="Spoofed MAC" count={1} level="warning" />
                  <AlertItem type="Expired Cert" count={0} level="info" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const AuthRow = ({ user, device, status, method }: any) => (
  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-cyan-400 transition-all cursor-pointer group hover:bg-white shadow-sm hover:shadow-xl hover:shadow-cyan-900/5">
     <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${status === 'Compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : status === 'Quarantined' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
           <Lock size={20} />
        </div>
        <div>
           <p className="text-base font-black text-slate-800 group-hover:text-cyan-600 transition-colors">{user}</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{device} • {method}</p>
        </div>
     </div>
     <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
        {status}
     </div>
  </div>
);

const AlertItem = ({ type, count, level }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
     <div className="flex items-center gap-3">
        {level === 'critical' ? <ShieldAlert size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{type}</span>
     </div>
     <span className={`text-xs font-black ${count > 0 ? 'text-red-500' : 'text-slate-300'}`}>{count}</span>
  </div>
);

const MetricCard = ({ label, value, sub, icon }: any) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all">
    <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 border border-slate-100">{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest italic">{sub}</p>
  </div>
);

export default NACApp;

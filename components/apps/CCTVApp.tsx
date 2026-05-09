
import React from 'react';
// Added missing ChevronRight import
import { Video, Camera, Activity, Calendar, Sliders, Maximize2, Play, Circle, Search, MoreVertical, ChevronRight } from 'lucide-react';

const CCTVApp: React.FC = () => {
  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-in fade-in duration-500 bg-[#1e293b]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Protect <span className="text-red-500">Center</span></h1>
          <p className="text-slate-400 font-medium">Unified video surveillance and physical security layer.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-900/40 flex items-center gap-2 hover:bg-red-700 transition-all">
            <Camera size={20} /> Provision Camera
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
           <CameraView label="Lobby Entrance" status="live" />
           <CameraView label="DC Corridor A" status="live" />
           <CameraView label="Roof Terrace" status="recording" />
           <CameraView label="Main Server Rack" status="live" />
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-[3rem] p-8 flex flex-col gap-8 text-white overflow-hidden shadow-2xl">
           <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Activity size={16} className="text-red-500" />
                 Smart Detections (24h)
              </h3>
              <div className="space-y-4">
                 <DetectionItem type="Person" time="10:45 AM" cam="Lobby" />
                 <DetectionItem type="Vehicle" time="09:12 AM" cam="Gate 01" />
                 <DetectionItem type="Package" time="08:30 AM" cam="Reception" />
              </div>
           </div>

           <div className="mt-auto">
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-700">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NVR Capacity</p>
                    <p className="text-xs font-bold text-red-500">88% Full</p>
                 </div>
                 <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: '88%' }} />
                 </div>
                 <p className="text-[9px] text-slate-500 mt-3 text-center">Auto-purging oldest footage (30d+)</p>
              </div>
           </div>
        </div>
      </div>

      <div className="h-24 bg-slate-900/80 backdrop-blur rounded-[2rem] border border-slate-700 flex items-center px-10 gap-10">
         <div className="flex items-center gap-6">
            <button className="p-3 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-900/20"><Play size={24} fill="white" /></button>
            <div className="text-white">
               <p className="text-base font-black tracking-tight leading-none">Live Playback</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Synced Grid</p>
            </div>
         </div>
         <div className="flex-1 h-px bg-slate-700 relative">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-4 w-[2px] bg-red-500 shadow-[0_0_10px_red]" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-2 w-[2px] bg-white/20" />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 h-2 w-[2px] bg-white/20" />
            <div className="absolute top-1/2 left-3/4 -translate-y-1/2 h-2 w-[2px] bg-white/20" />
         </div>
         <p className="text-xs font-mono font-bold text-slate-400">14:24:55 UTC+8</p>
      </div>
    </div>
  );
};

const CameraView = ({ label, status }: any) => (
  <div className="bg-slate-900 rounded-[2.5rem] relative overflow-hidden group shadow-2xl border border-white/5">
     <img src={`https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800&t=${Math.random()}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
     <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${status === 'live' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
           <Circle size={8} fill={status === 'live' ? 'white' : 'transparent'} className={status === 'live' ? 'animate-pulse' : ''} />
           {status}
        </div>
        <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-widest">{label}</span>
     </div>
     <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-3 bg-black/40 backdrop-blur rounded-2xl text-white hover:bg-black/60 transition-colors"><Maximize2 size={18} /></button>
     </div>
  </div>
);

const DetectionItem = ({ type, time, cam }: any) => (
  <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-700 flex items-center justify-between hover:bg-slate-800 transition-all cursor-pointer">
     <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-red-400 shadow-inner"><Video size={18} /></div>
        <div>
           <p className="text-sm font-bold">{type} Detected</p>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cam} • {time}</p>
        </div>
     </div>
     <ChevronRight size={14} className="text-slate-600" />
  </div>
);

export default CCTVApp;

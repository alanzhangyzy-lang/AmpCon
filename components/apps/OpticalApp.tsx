
import React from 'react';
import { Network, Activity, Sun, Zap, Info, Sliders, Save, Layers } from 'lucide-react';
import { Device } from '../../types';

interface OpticalAppProps {
  devices: Device[];
  feature: string;
}

const OpticalApp: React.FC<OpticalAppProps> = ({ devices, feature }) => {
  if (feature === 'config') {
    return (
      <div className="p-10 max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
        <h2 className="text-3xl font-black text-slate-900">Transport Grid Control</h2>
        
        <ConfigSection title="Spectrum Management" icon={<Sliders size={20} />}>
           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-bold text-slate-600">Channel Spacing Grid</span>
              <select className="bg-white border-slate-200 rounded-lg px-4 py-2 text-sm font-bold">
                 <option>50 GHz (Dense)</option>
                 <option>100 GHz (Standard)</option>
                 <option>Flex-Grid (Variable)</option>
              </select>
           </div>
           <ConfigField label="Auto-Power Equalization" type="toggle" defaultChecked />
        </ConfigSection>

        <ConfigSection title="Protection Switching" icon={<Zap size={20} />}>
           <ConfigField label="1+1 Fiber Protection" type="toggle" />
           <div className="space-y-2 mt-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Switching Threshold (dBm)</label>
              <input type="range" className="w-full accent-amber-500" min="-30" max="0" />
           </div>
        </ConfigSection>

        <div className="flex justify-end pt-6">
           <button className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-700 transition-all shadow-xl shadow-amber-100">
              <Save size={18} /> Provision Spectrum
           </button>
        </div>
      </div>
    );
  }

  if (feature === 'profiles') {
    return (
      <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-black text-slate-900">Wave Profiles</h2>
           <button className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold">+ New Lambda</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <WaveProfile name="LAMBDA-CORE-1" frequency="193.10 THz" reach="Long-Haul" rate="400G" />
           <WaveProfile name="LAMBDA-METRO-A" frequency="193.50 THz" reach="Metro" rate="100G" />
           <WaveProfile name="LAMBDA-DCI" frequency="191.10 THz" reach="Ultra-Short" rate="800G" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Optical <span className="text-amber-500">Transport</span></h1>
          <p className="text-slate-500 font-medium">Monitor and manage OTN/WDM transport layers.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all">
            Create End-to-End Trail
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col p-10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
              <Sun size={18} className="text-amber-500" />
              Optical Power Monitoring (dBm)
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Real-time</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex-1 bg-slate-50 rounded-[2rem] p-10 flex items-end gap-2 border border-slate-100">
              {Array.from({ length: 42 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-amber-500/40 rounded-t-lg hover:bg-amber-500 transition-all cursor-pointer relative group"
                  style={{ height: `${20 + Math.random() * 70}%` }}
                >
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-3 rounded-xl text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-2xl">
                    CH-{191.1 + i*0.1} THz<br/>Power: -12.4 dBm
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              <span>191.1 THz</span>
              <span>193.1 THz</span>
              <span>195.1 THz</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col overflow-auto shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Active Optical Trails</h3>
          <div className="space-y-4">
            <TrailItem from="BJ-DC" to="WH-HQ" rate="400G" status="UP" />
            <TrailItem from="SH-DC-1" to="SH-DC-2" rate="100G" status="UP" />
            <TrailItem from="WH-HQ" to="Cloud-Exchange" rate="100G" status="DEGRADED" />
          </div>

          <div className="mt-auto pt-8 border-t border-slate-50">
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
              <Info size={24} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                Optical layer intelligence is automatically injecting physical fiber routes into the global topology base.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WaveProfile = ({ name, frequency, reach, rate }: any) => (
  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border-l-4 border-l-amber-500">
     <h4 className="text-xl font-bold text-slate-900 mb-6">{name}</h4>
     <div className="space-y-4">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>Frequency</span> <span className="text-slate-900">{frequency}</span></div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>Service Rate</span> <span className="text-slate-900">{rate}</span></div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>Reach Mode</span> <span className="text-amber-600">{reach}</span></div>
     </div>
  </div>
);

const ConfigSection = ({ title, icon, children }: any) => (
  <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-slate-50 rounded-xl text-amber-600">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const ConfigField = ({ label, type, defaultChecked }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
    <span className="text-sm font-bold text-slate-600">{label}</span>
    {type === 'toggle' && (
      <input type="checkbox" defaultChecked={defaultChecked} className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-amber-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:w-4 after:h-4 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 checked:after:left-5.5 after:transition-all shadow-inner" />
    )}
  </div>
);

const TrailItem = ({ from, to, rate, status }: any) => (
  <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl transition-all hover:bg-white hover:border-amber-200">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <Network size={16} className="text-amber-600" />
        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{rate}</span>
      </div>
      <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
        status === 'UP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {status}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-slate-600">{from}</span>
      <div className="flex-1 h-px bg-slate-200 relative">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
          status === 'UP' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
        }`} />
      </div>
      <span className="text-xs font-bold text-slate-600">{to}</span>
    </div>
  </div>
);

export default OpticalApp;

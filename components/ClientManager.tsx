
import React, { useState, useMemo } from 'react';
import { MOCK_CLIENTS, MOCK_DEVICES } from '../constants.tsx';
import { Smartphone, Laptop, Monitor, Wifi, Zap, MoreHorizontal, Search, Shield, Activity, ChevronRight, X, Layers, Filter } from 'lucide-react';
import { Client } from '../types';

interface ClientManagerProps {
  siteId: string;
  filterType?: 'wired' | 'wifi' | 'all';
}

const ClientManager: React.FC<ClientManagerProps> = ({ filterType = 'all' }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    return MOCK_CLIENTS.filter(c => {
      const matchesFilter = filterType === 'all' || c.connectionType === filterType;
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                           c.mac.toLowerCase().includes(search.toLowerCase()) ||
                           c.ip.includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [filterType, search]);

  return (
    <div className="p-10 max-w-7xl mx-auto h-full animate-in fade-in duration-500 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Terminal <span className="text-blue-600">Assets</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {filterType === 'wifi' ? 'Wireless' : filterType === 'wired' ? 'Wired' : 'All'} monitoring and policy mapping for connected endpoints.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search MAC/IP/Ident..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-[1.25rem] pl-12 pr-6 py-3.5 text-sm w-72 focus:outline-none focus:border-blue-500 shadow-sm transition-all"
            />
          </div>
          <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-50">
              <th className="px-10 py-6">Identity / MAC</th>
              <th className="px-10 py-6">Connectivity</th>
              <th className="px-10 py-6">Path Origin</th>
              <th className="px-10 py-6">Traffic (24h)</th>
              <th className="px-10 py-6 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredClients.map(client => (
              <tr key={client.id} onClick={() => setSelectedClient(client)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="px-10 py-7">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      {client.name.includes('MacBook') ? <Laptop size={22} /> : client.name.includes('iPhone') ? <Smartphone size={22} /> : <Monitor size={22} />}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors">{client.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5 uppercase">{client.mac}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-7">
                  <div className="flex items-center gap-2.5">
                    {client.connectionType === 'wifi' ? (
                      <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <Wifi size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{client.signal} dBm</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <Zap size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">10 Gbps</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-10 py-7">
                   <div className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                      <span className="text-xs font-bold">{MOCK_DEVICES.find(d => d.id === client.connectedTo)?.name || 'HQ-Fabric-Node'}</span>
                      <ChevronRight size={12} className="opacity-40" />
                   </div>
                </td>
                <td className="px-10 py-7">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-800 font-black">{client.traffic}</span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: client.traffic.includes('4.8') ? '75%' : '40%' }} />
                    </div>
                  </div>
                </td>
                <td className="px-10 py-7 text-right">
                   <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all">
                      <Shield size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Authenticated</span>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <div className="fixed top-0 right-0 h-full w-[450px] bg-white border-l border-slate-200 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Client <span className="text-blue-600">Deep Insights</span></h2>
              <button onClick={() => setSelectedClient(null)} className="p-2.5 bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
           </div>
           <div className="flex-1 overflow-auto p-8 space-y-8">
              <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-blue-600 shadow-xl border border-slate-100 mb-6">
                    {selectedClient.name.includes('MacBook') ? <Laptop size={44} /> : <Smartphone size={44} />}
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedClient.name}</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">{selectedClient.ip}</p>
                 <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Stable Session</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <StatBox icon={<Activity size={16} />} label="Signal Health" value={selectedClient.signal ? `${selectedClient.signal} dBm` : 'N/A'} />
                 <StatBox icon={<Zap size={16} />} label="Link Protocol" value={selectedClient.connectionType === 'wifi' ? 'WiFi 7 (6GHz)' : 'Ethernet (10G)'} />
                 <StatBox icon={<Shield size={16} />} label="Auth Status" value="WPA3-SAE" />
                 <StatBox icon={<Activity size={16} />} label="Activity" value="2.4 Mbps" />
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Connection Path</p>
                 <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100 border-dashed border-l" />
                    <PathStep icon={<Smartphone />} label="Client Terminal" sub={selectedClient.name} active />
                    <PathStep icon={selectedClient.connectionType === 'wifi' ? <Wifi /> : <Zap />} label="Access Point" sub={MOCK_DEVICES.find(d => d.id === selectedClient.connectedTo)?.name || 'HQ-Fabric-Node'} active />
                    <PathStep icon={<Layers />} label="Switching Fabric" sub="HQ-Core-96" />
                 </div>
              </div>

              <div className="pt-8 flex gap-3">
                 <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 transition-all">Reconnect Client</button>
                 <button className="flex-1 py-4 bg-white border border-slate-200 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all">Block Device</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PathStep = ({ icon, label, sub, active }: any) => (
  <div className="flex items-center gap-6 relative z-10">
     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 border-blue-500' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
        {icon}
     </div>
     <div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</p>
        <p className="text-sm font-bold text-slate-800 tracking-tight">{sub}</p>
     </div>
  </div>
);

const StatBox = ({ icon, label, value }: any) => (
  <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
    <div className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors">{icon}</div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight mb-1">{label}</p>
    <p className="text-base font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

export default ClientManager;

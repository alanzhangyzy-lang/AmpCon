
import React, { useState, useMemo } from 'react';
import { 
  Download, RefreshCw, CheckCircle2, AlertCircle, Play, Settings, 
  Database, Server, Wifi, Zap, Cpu, Search, Upload, Plus, FileText, 
  Trash2, HardDrive, ChevronRight, X, ShieldCheck, Clock
} from 'lucide-react';
import { MOCK_DEVICES } from '../constants.tsx';

interface FirmwareUpdateProps {
  siteId: string;
}

interface LocalFirmware {
  id: string;
  version: string;
  modelFamily: string;
  uploadDate: string;
  size: string;
  type: 'Stable' | 'Beta' | 'Security';
}

const FirmwareUpdate: React.FC<FirmwareUpdateProps> = ({ siteId }) => {
  const [view, setView] = useState<'deployment' | 'repository'>('deployment');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Mock local library
  const [localLibrary, setLocalLibrary] = useState<LocalFirmware[]>([
    { id: 'fw-1', version: 'v1.4.2', modelFamily: 'AmpX-Core', uploadDate: '2024-05-20', size: '124MB', type: 'Stable' },
    { id: 'fw-2', version: 'v2.1.0', modelFamily: 'Uni-WiFi', uploadDate: '2024-05-18', size: '42MB', type: 'Stable' },
    { id: 'fw-3', version: 'v1.0.5', modelFamily: 'AmpFabric', uploadDate: '2024-05-22', size: '256MB', type: 'Security' },
  ]);

  const devices = useMemo(() => MOCK_DEVICES.filter(d => d.siteId === siteId), [siteId]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      const newFw: LocalFirmware = {
        id: `fw-${Date.now()}`,
        version: 'v1.5.0',
        modelFamily: 'AmpX-Acc',
        uploadDate: new Date().toISOString().split('T')[0],
        size: '88MB',
        type: 'Stable'
      };
      setLocalLibrary([newFw, ...localLibrary]);
      setIsUploading(false);
      setShowUploadModal(false);
    }, 2000);
  };

  const startPush = (deviceId: string) => {
    setUpdatingIds(prev => new Set(prev).add(deviceId));
    setTimeout(() => {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(deviceId);
        return next;
      });
    }, 5000);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500 pb-20">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            Firmware <span className="text-blue-600">Forge</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Local platform deployment and asset lifecycle management.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-2xl flex">
            <button 
              onClick={() => setView('deployment')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${view === 'deployment' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}
            >
              <Server size={14} /> Deployment
            </button>
            <button 
              onClick={() => setView('repository')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${view === 'repository' ? 'bg-white shadow-md text-amber-600' : 'text-slate-500'}`}
            >
              <Database size={14} /> Local Repository
            </button>
          </div>
          
          {view === 'repository' && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Upload size={18} /> Upload to Platform
            </button>
          )}
        </div>
      </div>

      {view === 'deployment' ? (
        <>
          {/* Deployment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <MetricCard label="Repository Cache" value={`${localLibrary.length} Builds`} icon={<HardDrive className="text-amber-500" />} />
            <MetricCard label="Ready to Push" value={devices.length.toString()} icon={<Zap className="text-blue-500" />} />
            <MetricCard label="Platform Status" value="Online / Sync" icon={<ShieldCheck className="text-emerald-500" />} />
          </div>

          {/* Device List for Pushing */}
          <div className="bg-white border border-slate-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <div className="relative flex-1 max-w-md">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Filter devices for update..." className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-xs outline-none focus:border-blue-500" />
               </div>
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors">Mass Push to Site</button>
            </div>
            
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-slate-50/50">
                  <th className="px-10 py-6">Asset</th>
                  <th className="px-10 py-6">Current Build</th>
                  <th className="px-10 py-6">Library Build (Target)</th>
                  <th className="px-10 py-6">Sync Status</th>
                  <th className="px-10 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {devices.map(device => {
                  const isUpdating = updatingIds.has(device.id);
                  const compatibleFw = localLibrary.find(fw => device.model.includes(fw.modelFamily));
                  
                  return (
                    <tr key={device.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                              {device.role === 'AP' ? <Wifi size={24} /> : <Server size={24} />}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900">{device.name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase">{device.model}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-mono text-xs text-slate-500 font-bold">1.4.1</td>
                      <td className="px-10 py-6">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-600 font-mono">{compatibleFw?.version || 'No Match'}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase">From Local Repo</span>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                        {isUpdating ? (
                          <div className="flex items-center gap-3">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 animate-progress origin-left" style={{ width: '60%' }} />
                             </div>
                             <span className="text-[9px] font-black text-blue-600 uppercase">Pushing...</span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">Pending Upgrade</span>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right">
                         <button 
                           onClick={() => startPush(device.id)}
                           disabled={isUpdating || !compatibleFw}
                           className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all disabled:opacity-30 active:scale-95"
                         >
                           Push Build
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Repository View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {localLibrary.map(fw => (
            <div key={fw.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText size={100} />
               </div>
               
               <div className="flex justify-between items-start mb-8">
                  <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${fw.type === 'Security' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                     {fw.type} Build
                  </div>
                  <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
               </div>
               
               <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{fw.version}</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Compatible: <span className="text-slate-900">{fw.modelFamily}*</span></p>
               
               <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span className="flex items-center gap-1.5"><Clock size={12} /> Uploaded</span>
                     <span className="text-slate-800">{fw.uploadDate}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span className="flex items-center gap-1.5"><HardDrive size={12} /> Package Size</span>
                     <span className="text-slate-800">{fw.size}</span>
                  </div>
               </div>
               
               <div className="mt-8">
                  <button className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-500 transition-all">
                     Verify Integrity
                  </button>
               </div>
            </div>
          ))}
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all group"
          >
             <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Plus size={40} />
             </div>
             <p className="font-black text-sm uppercase tracking-widest">Register New Firmware</p>
             <p className="text-xs font-medium mt-2">Add binary to platform cache</p>
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-xl p-16 shadow-2xl relative animate-in zoom-in duration-300 border border-white/20">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={28} />
            </button>
            
            <div className="text-center mb-10">
               <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                  <Upload size={32} />
               </div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Local Repository Upload</h2>
               <p className="text-slate-500 font-medium mt-2">The binary will be cached on this platform instance for site distribution.</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
               <div className="border-4 border-dashed border-slate-50 rounded-[2rem] p-10 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                  <Download size={40} className="mx-auto text-slate-200 group-hover:text-blue-400 mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Drop Firmware Binary (.bin / .img)</p>
                  <p className="text-[10px] text-slate-300 font-medium mt-1">Maximum size: 2.5GB</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Version Number</label>
                     <input type="text" placeholder="e.g. v1.5.0" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-blue-500" required />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Family</label>
                     <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-blue-500">
                        <option>AmpX-Core</option>
                        <option>AmpX-Acc</option>
                        <option>Uni-WiFi</option>
                        <option>AmpFabric</option>
                     </select>
                  </div>
               </div>

               <button 
                 disabled={isUploading}
                 className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
               >
                  {isUploading ? (
                    <><RefreshCw className="animate-spin" size={18} /> Syncing with Storage...</>
                  ) : (
                    <>Upload & Register Build</>
                  )}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon }: any) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 hover:shadow-xl transition-all group">
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

export default FirmwareUpdate;

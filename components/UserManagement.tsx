
import React, { useState, useMemo } from 'react';
import { MOCK_USERS, MOCK_SITES, PLUGINS, getIcon } from '../constants.tsx';
import { UserPlus, Shield, Mail, MoreVertical, X, Check, UserCheck, ShieldCheck, Globe, Eye, Edit3, Lock, ChevronDown, Server, MapPin, ChevronRight } from 'lucide-react';
import { AccessLevel, PluginID, Site } from '../types';

interface UserManagementProps {
  activeSite?: Site | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ activeSite }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'users' | 'roles'>('users');
  
  // Provisioning State
  const [targetSiteId, setTargetSiteId] = useState<string>(activeSite?.id || MOCK_SITES[0].id);
  const [identityName, setIdentityName] = useState('');
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<Record<PluginID, AccessLevel>>({
    'campus-network': 'Full',
    'security-surveillance': 'Full',
    'aidc-network': 'None',
    'idc-network': 'None',
    'transport-network': 'None',
  });

  const handleLevelChange = (appId: PluginID, level: AccessLevel) => {
    setPermissions(prev => ({ ...prev, [appId]: level }));
  };

  // Filter users based on context
  const displayUsers = useMemo(() => {
    if (!activeSite) return MOCK_USERS;
    // In a real app, filter users who have specific site permissions
    // For mock, we show all but the UI will label them differently
    return MOCK_USERS;
  }, [activeSite]);

  return (
    <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-500">
      <div className="max-w-[1200px] mx-auto p-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {activeSite ? <><span className="text-[#0ABAB5]">{activeSite.name}</span> Access</> : <>Global <span className="text-[#0ABAB5]">Access</span></>}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeSite ? `Managing local site governance for ${activeSite.location}.` : 'Global user orchestration and multi-site authorization.'}
          </p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-sm">
              <button onClick={() => setSelectedTab('users')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === 'users' ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Users</button>
              <button onClick={() => setSelectedTab('roles')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === 'roles' ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Policy Roles</button>
           </div>
           <button 
             onClick={() => {
               if (activeSite) setTargetSiteId(activeSite.id);
               setShowInviteModal(true);
             }}
             className="bg-[#0ABAB5] text-white px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-[#099e9a] transition-all active:scale-95"
           >
             <UserPlus size={14} /> {activeSite ? 'Provision Local User' : 'Provision Global User'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayUsers.map(user => (
          <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Shield size={80} /></div>
            
            <div className="flex items-center gap-4 mb-5 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-[#0ABAB5] flex items-center justify-center text-white font-black text-sm shadow-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">{user.name}</h3>
                <div className="flex items-center gap-1.5 text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-1 border border-[#0ABAB5]/20 w-fit">
                  <ShieldCheck size={12} /> {user.role === 'SuperAdmin' ? 'System Admin' : 'Site Operator'}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-slate-50 relative z-10">
              <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-2 text-slate-400">
                   <MapPin size={12} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Authorized Base</span>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {user.role === 'SuperAdmin' ? 'Universal Infrastructure' : (activeSite ? activeSite.name : MOCK_SITES[0].name)}
                </span>
              </div>
              
              <div className="space-y-3">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">App Permission Matrix</p>
                 <div className="grid grid-cols-2 gap-3">
                    <PermissionBadge app="Traditional LAN" level="Full" />
                    <PermissionBadge app="Wireless" level="Full" />
                    <PermissionBadge app="Protect" level="Read" />
                    <PermissionBadge app="NAC" level="None" />
                 </div>
              </div>

              <div className="flex items-center justify-between pt-8">
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">Edit Permissions <ChevronRight size={12} /></button>
                <button className="p-2.5 bg-slate-50 rounded-xl text-slate-300 hover:text-red-500 transition-all"><MoreVertical size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] w-full max-w-4xl max-h-[90vh] p-16 shadow-2xl relative animate-in zoom-in duration-300 flex flex-col overflow-hidden">
              <button onClick={() => setShowInviteModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-600 transition-colors z-20"><X size={32} /></button>
              
              <div className="mb-12 shrink-0">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Identity Provisioning {activeSite && <span className="text-blue-600">Local</span>}
                 </h2>
                 <p className="text-slate-500 font-medium mt-1">
                    {activeSite 
                      ? `Defining site-specific application access for ${activeSite.name}.`
                      : 'Defining global infrastructure access and application matrix.'}
                 </p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label="Full Identity Name" placeholder="e.g. Alex Vance" value={identityName} onChange={(e: any) => setIdentityName(e.target.value)} />
                    <InputField label="Work Email Endpoint" placeholder="alex@ampcon.io" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                 </div>

                 {/* Hide Site Selection if inside a site */}
                 {!activeSite ? (
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Infrastructure Base</label>
                      <div className="flex flex-wrap gap-3">
                         {MOCK_SITES.map(s => (
                           <button 
                             key={s.id} 
                             onClick={() => setTargetSiteId(s.id)}
                             className={`px-6 py-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${targetSiteId === s.id ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                           >
                              {s.siteType === 'DataCenter' ? <Server size={14} /> : <Globe size={14} />}
                              <span className="text-[11px] font-black uppercase tracking-tight">{s.name}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                 ) : (
                   <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><MapPin size={20} /></div>
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Locked to Site</p>
                            <p className="text-lg font-black text-slate-900">{activeSite.name}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Site Category</p>
                         <p className="text-xs font-bold text-slate-700 uppercase">{activeSite.siteType}</p>
                      </div>
                   </div>
                 )}

                 {/* Application Matrix */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Lock size={20} /></div>
                       <h3 className="text-xl font-black text-slate-900">Application Access Matrix</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                       {PLUGINS.filter(p => p.id !== 'sd-wan').map(app => (
                         <div key={app.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col gap-6 group hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform">{getIcon(app.icon, 20)}</div>
                               <span className="font-black text-sm text-slate-800 tracking-tight">{app.name}</span>
                            </div>
                            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
                               {(['Full', 'Read', 'None'] as AccessLevel[]).map(l => (
                                 <button 
                                   key={l} 
                                   onClick={() => handleLevelChange(app.id, l)}
                                   className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                     permissions[app.id] === l 
                                      ? (l === 'Full' ? 'bg-slate-900 text-white shadow-lg' : l === 'Read' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-600') 
                                      : 'text-slate-400 hover:text-slate-600'
                                   }`}
                                 >
                                    {l}
                                 </button>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-10 shrink-0 border-t border-slate-50 flex gap-4">
                 <button onClick={() => setShowInviteModal(false)} className="px-10 py-6 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-3xl">Discard</button>
                 <button onClick={() => setShowInviteModal(false)} className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                    {activeSite ? 'Authorize Site User' : 'Initialize & Invite User'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
    </div>
  );
};

const PermissionBadge = ({ app, level }: { app: string, level: AccessLevel }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{app}</span>
     <div className={`p-1 rounded-md ${level === 'Full' ? 'text-blue-600' : level === 'Read' ? 'text-cyan-500' : 'text-slate-300'}`}>
        {level === 'Full' ? <Edit3 size={12} /> : level === 'Read' ? <Eye size={12} /> : <X size={12} />}
     </div>
  </div>
);

const InputField = ({ label, placeholder, value, onChange }: any) => (
  <div className="space-y-2">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <input 
        type="text" 
        value={value}
        onChange={onChange}
        placeholder={placeholder} 
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-8 font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" 
     />
  </div>
);

export default UserManagement;

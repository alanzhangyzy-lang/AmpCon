
import React, { useState } from 'react';
import { ChevronDown, Bell, Search, User, LogOut, Shield, LayoutGrid, Globe } from 'lucide-react';
import { Site, PluginID } from '../types';
import { MOCK_SITES, PLUGINS, getIcon } from '../constants.tsx';

interface HeaderProps {
  site: Site | null;
  activePlugin: PluginID | 'base';
  onSiteSelect: (id: string) => void;
  onPluginSelect: (id: PluginID | 'base') => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ site, activePlugin, onSiteSelect, onPluginSelect, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Preserve each site's configured APP order (Frankfurt: IDC first, AIDC second).
  const availablePlugins = site
    ? site.activePlugins
        .filter(id => id !== 'sd-wan')
        .map(id => PLUGINS.find(plugin => plugin.id === id))
        .filter((plugin): plugin is (typeof PLUGINS)[number] => Boolean(plugin))
    : [];

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center z-50 shadow-sm transition-all px-8">
      {/* Left: Brand + App Tabs */}
      <div className="flex items-center gap-6 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 shrink-0">
           <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(129,216,208,0.7)]" />
           <h1 className="font-black text-slate-900 text-xl tracking-tighter select-none">
             AMP<span className="text-slate-400 font-medium">CON</span>
           </h1>
        </div>

        {/* App Navigation Tabs - inline with header */}
        {site && (
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar ml-4 border-l border-slate-200 pl-4 h-full animate-in fade-in duration-300">
            {availablePlugins.map(p => (
              <AppTab 
                key={p.id}
                label={p.name}
                isActive={activePlugin === p.id}
                onClick={() => onPluginSelect(p.id)}
                icon={getIcon(p.icon, 14)}
                activeColor={p.color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="relative hidden lg:block">
           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input type="text" placeholder="Global Search..." className="bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-2.5 text-xs w-64 focus:bg-white focus:border-blue-600 transition-all outline-none" />
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-2.5 relative bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200">
          <Bell size={20} />
          {site && site.alertCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />}
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white hover:bg-black transition-colors shadow-lg shadow-slate-200"
          >
            <User size={20} />
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl z-20 p-3 overflow-hidden">
                <div className="p-4 border-b border-slate-50 mb-2">
                   <p className="font-black text-slate-900 text-sm">Root Administrator</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SuperUser Access</p>
                </div>
                <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                  <LogOut size={16} /> Sign Out System
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const AppTab = ({ label, isActive, onClick, icon, activeColor }: any) => (
  <button 
    onClick={onClick}
    title={label}
    className={`px-3 h-14 flex items-center gap-1.5 transition-all relative group ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
  >
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive ? 'shadow-sm' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`} style={{ backgroundColor: isActive ? activeColor + '15' : undefined, color: isActive ? activeColor : undefined }}>
      {icon}
    </div>
    <span className="text-[9px] font-bold uppercase tracking-tight whitespace-nowrap max-w-[60px] truncate">{label}</span>
    {isActive && (
      <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full" style={{ backgroundColor: activeColor }} />
    )}
  </button>
);

export default Header;

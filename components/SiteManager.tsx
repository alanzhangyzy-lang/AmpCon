
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, MapPin, X, Globe, Server, Check, Share2, LayoutGrid, Zap, Activity, Shield, Sliders, Bell, Users, Search, HardDrive, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { Site, PluginID } from '../types';
import { PLUGINS, getIcon } from '../constants.tsx';

interface SiteManagerProps {
  sites: Site[];
  onSelectSite: (id: string) => void;
  onAddSite: (site: Site) => void;
}

const SiteManager: React.FC<SiteManagerProps> = ({ sites, onSelectSite, onAddSite }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newSiteType, setNewSiteType] = useState<'Campus' | 'DataCenter' | 'Optical'>('Campus');
  const [selectedPlugins, setSelectedPlugins] = useState<PluginID[]>(['switching']);
  
  // Geographic location states
  const [selectedCountry, setSelectedCountry] = useState('China');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);

  // Geographic data structure
  const geoData: Record<string, Record<string, string[]>> = {
    'China': {
      'Beijing': ['Beijing City', 'Chaoyang District', 'Haidian District'],
      'Hubei': ['Wuhan', 'Yichang', 'Xiangyang'],
      'Jiangsu': ['Nanjing', 'Suzhou', 'Wuxi'],
      'Guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan'],
      'Shanghai': ['Shanghai City', 'Pudong District', 'Huangpu District'],
      'Zhejiang': ['Hangzhou', 'Ningbo', 'Wenzhou'],
    },
    'United States': {
      'California': ['San Francisco', 'Los Angeles', 'San Diego'],
      'New York': ['New York City', 'Buffalo', 'Rochester'],
      'Texas': ['Houston', 'Dallas', 'Austin'],
    },
    'Singapore': {
      'Singapore': ['Central Region', 'East Region', 'West Region'],
    },
  };

  const countries = Object.keys(geoData);
  const regions = selectedCountry ? Object.keys(geoData[selectedCountry]) : [];
  const cities = selectedCountry && selectedRegion ? geoData[selectedCountry][selectedRegion] : [];

  // Auto-generate site name from city + scenario
  useEffect(() => {
    if (!nameManuallyEdited && selectedCity) {
      const citySlug = selectedCity.toLowerCase().replace(/\s+/g, '-');
      const typeSlug = newSiteType === 'DataCenter' ? 'dc' : newSiteType === 'Optical' ? 'otn' : 'campus';
      setNewSiteName(`${citySlug}.${typeSlug}`);
    }
  }, [selectedCity, newSiteType, nameManuallyEdited]);

  const CAMPUS_PLUGIN_IDS: PluginID[] = ['campus-network', 'security-surveillance'];
  const DC_PLUGIN_IDS: PluginID[] = ['aidc-network', 'idc-network'];
  const OPTICAL_PLUGIN_IDS: PluginID[] = ['transport-network'];

  // Filter logic based on the selected site type
  const filteredAvailablePlugins = useMemo(() => {
    if (newSiteType === 'Campus') {
      return PLUGINS.filter(p => CAMPUS_PLUGIN_IDS.includes(p.id));
    } else if (newSiteType === 'DataCenter') {
      return PLUGINS.filter(p => DC_PLUGIN_IDS.includes(p.id));
    } else if (newSiteType === 'Optical') {
      return PLUGINS.filter(p => OPTICAL_PLUGIN_IDS.includes(p.id));
    }
    return PLUGINS;
  }, [newSiteType]);

  // Sync selected plugins when category changes to avoid invalid states
  useEffect(() => {
    if (newSiteType === 'DataCenter') {
      setSelectedPlugins(['aidc-network', 'idc-network']);
    } else if (newSiteType === 'Campus') {
      setSelectedPlugins(['campus-network', 'security-surveillance']);
    } else if (newSiteType === 'Optical') {
      setSelectedPlugins(['transport-network']);
    }
  }, [newSiteType]);

  const togglePlugin = (id: PluginID) => {
    setSelectedPlugins(prev => {
      return prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
    });
  };

  const handleCreate = () => {
    if (!newSiteName || !selectedCity) return;
    const locationString = `${selectedCity}, ${selectedRegion}, ${selectedCountry}`;
    const newSite: Site = {
      id: `site-${Date.now()}`,
      name: newSiteName,
      location: locationString,
      country: selectedCountry,
      region: selectedRegion,
      health: 100,
      activePlugins: selectedPlugins,
      deviceCount: 0,
      alertCount: 0,
      siteType: newSiteType
    };
    onAddSite(newSite);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewSiteName('');
    setNewSiteLocation('');
    setNewSiteType('Campus');
    setSelectedPlugins(['switching']);
    setSelectedCountry('China');
    setSelectedRegion('');
    setSelectedCity('');
    setNameManuallyEdited(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#fcfcfc] overflow-auto animate-in fade-in duration-500">
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
               <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">Site Center</div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               </div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Site <span className="text-blue-600">Manager</span></h1>
               <p className="text-slate-500 font-medium text-sm max-w-2xl">Unified site management center. Create and manage Campus or Data Center sites, monitor health and device status across your entire network infrastructure.</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95">
              <Plus size={16} /> Create New Site
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map(site => (
              <div key={site.id} onClick={() => onSelectSite(site.id)} className="bg-white border border-blue-100/60 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-[0_20px_40px_-10px_rgba(129,216,208,0.15)] transition-all group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   {site.siteType === 'DataCenter' ? <Server size={100} /> : <Globe size={100} />}
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${site.health > 95 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {site.health}% Health
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shadow-sm">
                     <LayoutGrid size={10} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-blue-600 transition-colors tracking-tight">{site.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-4">
                    <MapPin size={13} /> {site.location}
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                  <div className="flex -space-x-2">
                    {site.activePlugins.slice(0, 4).map(pId => {
                      const p = PLUGINS.find(pl => pl.id === pId);
                      return <div key={pId} className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm transition-transform hover:z-20 hover:scale-110" style={{ color: p?.color }}>{getIcon(p?.icon || '', 16)}</div>;
                    })}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-800 leading-none">{site.deviceCount}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Devices</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] p-8 shadow-2xl relative animate-in zoom-in duration-300 flex flex-col overflow-hidden">
            <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors z-20"><X size={20} /></button>
            <div className="mb-6 shrink-0">
               <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Create New Site</h2>
               <p className="text-slate-500 text-sm font-medium">Deploy a new Campus, Data Center or Optical Transport site. Select a geographic location and scenario to get started.</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-6">
              {/* 1. Scenario Selection + Topology Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-[#0ABAB5]/10 text-[#0ABAB5] rounded-lg flex items-center justify-center"><LayoutGrid size={16} /></div>
                   <h3 className="text-sm font-black text-slate-900">1. Network Scenario</h3>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {(['Campus', 'DataCenter', 'Optical'] as const).map(type => (
                    <button key={type} onClick={() => setNewSiteType(type)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${newSiteType === type ? 'bg-white text-[#0ABAB5] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{type === 'DataCenter' ? 'DATACENTER' : type.toUpperCase()}</button>
                  ))}
                </div>
                {/* Topology Preview SVG */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center">
                  <svg width="480" height="140" viewBox="0 0 480 140">
                    {newSiteType === 'Campus' && (
                      <>
                        {/* Campus: Core → Agg → Access → AP */}
                        <text x="240" y="12" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="700">CAMPUS 3-TIER ARCHITECTURE</text>
                        {/* Core */}
                        <rect x="210" y="22" width="60" height="24" rx="6" fill="#0ABAB5" opacity="0.15" stroke="#0ABAB5" strokeWidth="1" />
                        <text x="240" y="38" textAnchor="middle" fontSize="8" fill="#0ABAB5" fontWeight="700">Core</text>
                        {/* Agg */}
                        <rect x="140" y="62" width="60" height="24" rx="6" fill="#6366f1" opacity="0.15" stroke="#6366f1" strokeWidth="1" />
                        <text x="170" y="78" textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="700">Agg-1</text>
                        <rect x="280" y="62" width="60" height="24" rx="6" fill="#6366f1" opacity="0.15" stroke="#6366f1" strokeWidth="1" />
                        <text x="310" y="78" textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="700">Agg-2</text>
                        {/* Access */}
                        <rect x="60" y="102" width="50" height="22" rx="5" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1" />
                        <text x="85" y="116" textAnchor="middle" fontSize="7" fill="#10b981" fontWeight="700">Access</text>
                        <rect x="140" y="102" width="50" height="22" rx="5" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1" />
                        <text x="165" y="116" textAnchor="middle" fontSize="7" fill="#10b981" fontWeight="700">Access</text>
                        <rect x="290" y="102" width="50" height="22" rx="5" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1" />
                        <text x="315" y="116" textAnchor="middle" fontSize="7" fill="#10b981" fontWeight="700">Access</text>
                        <rect x="370" y="102" width="50" height="22" rx="5" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1" />
                        <text x="395" y="116" textAnchor="middle" fontSize="7" fill="#10b981" fontWeight="700">AP</text>
                        {/* Links */}
                        <line x1="240" y1="46" x2="170" y2="62" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="240" y1="46" x2="310" y2="62" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="170" y1="86" x2="85" y2="102" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="170" y1="86" x2="165" y2="102" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="310" y1="86" x2="315" y2="102" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="310" y1="86" x2="395" y2="102" stroke="#cbd5e1" strokeWidth="1" />
                      </>
                    )}
                    {newSiteType === 'DataCenter' && (
                      <>
                        {/* DC: Spine-Leaf */}
                        <text x="240" y="12" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="700">SPINE-LEAF FABRIC ARCHITECTURE</text>
                        {/* Spine */}
                        {[120, 200, 280, 360].map((x, i) => (
                          <g key={i}>
                            <rect x={x-25} y="22" width="50" height="24" rx="6" fill="#6366f1" opacity="0.15" stroke="#6366f1" strokeWidth="1" />
                            <text x={x} y="38" textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="700">Spine-{i+1}</text>
                          </g>
                        ))}
                        {/* Leaf */}
                        {[80, 160, 240, 320, 400].map((x, i) => (
                          <g key={i}>
                            <rect x={x-25} y="72" width="50" height="24" rx="6" fill="#0ABAB5" opacity="0.15" stroke="#0ABAB5" strokeWidth="1" />
                            <text x={x} y="88" textAnchor="middle" fontSize="8" fill="#0ABAB5" fontWeight="700">Leaf-{i+1}</text>
                          </g>
                        ))}
                        {/* Border */}
                        <rect x="155" y="112" width="50" height="22" rx="5" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1" />
                        <text x="180" y="126" textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="700">Border</text>
                        <rect x="275" y="112" width="50" height="22" rx="5" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1" />
                        <text x="300" y="126" textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="700">Border</text>
                        {/* Links (partial mesh) */}
                        {[120,200,280,360].map((sx, si) => [80,160,240,320,400].slice(si, si+2).map((lx, li) => (
                          <line key={`${si}-${li}`} x1={sx} y1="46" x2={lx} y2="72" stroke="#cbd5e1" strokeWidth="0.8" />
                        )))}
                        <line x1="160" y1="96" x2="180" y2="112" stroke="#cbd5e1" strokeWidth="0.8" />
                        <line x1="320" y1="96" x2="300" y2="112" stroke="#cbd5e1" strokeWidth="0.8" />
                      </>
                    )}
                    {newSiteType === 'Optical' && (
                      <>
                        {/* Optical: OTN chain */}
                        <text x="240" y="12" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="700">OTN / WDM TRANSPORT CHAIN</text>
                        {['OTN-MUX', 'ROADM-1', 'OLA', 'ROADM-2', 'OTN-MUX'].map((label, i) => {
                          const x = 60 + i * 95;
                          return (
                            <g key={i}>
                              <rect x={x-30} y="55" width="60" height="30" rx="8" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1" />
                              <text x={x} y="74" textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="700">{label}</text>
                              {i < 4 && <line x1={x+30} y1="70" x2={x+65} y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />}
                            </g>
                          );
                        })}
                        <text x="240" y="110" textAnchor="middle" fontSize="8" fill="#cbd5e1">λ1 λ2 λ3 ... λ96</text>
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* 2. Location + Name */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Globe size={16} /></div>
                   <h3 className="text-sm font-black text-slate-900">2. Site Identity</h3>
                </div>
                {/* Geographic Location Selection (first) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geographic Location</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                      <select 
                        value={selectedCountry} 
                        onChange={e => { setSelectedCountry(e.target.value); setSelectedRegion(''); setSelectedCity(''); setNameManuallyEdited(false); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
                      >
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Region / Province</label>
                      <select 
                        value={selectedRegion} 
                        onChange={e => { setSelectedRegion(e.target.value); setSelectedCity(''); setNameManuallyEdited(false); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                        disabled={!selectedCountry}
                      >
                        <option value="">Select Region</option>
                        {regions.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">City / District</label>
                      <select 
                        value={selectedCity} 
                        onChange={e => { setSelectedCity(e.target.value); setNameManuallyEdited(false); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                        disabled={!selectedRegion}
                      >
                        <option value="">Select City</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Site Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Name</label>
                  <input value={newSiteName} onChange={e => { setNewSiteName(e.target.value); setNameManuallyEdited(true); }} type="text" placeholder={selectedCity ? `${selectedCity.toLowerCase().replace(/\s+/g, '-')}.${newSiteType === 'DataCenter' ? 'dc' : newSiteType === 'Optical' ? 'otn' : 'campus'}` : 'Auto-generated from location'} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:border-[#0ABAB5] focus:bg-white transition-all outline-none" />
                  <p className="text-[9px] text-slate-400 ml-1">Auto-generated from location & scenario. Edit to customize.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Zap size={16} /></div>
                      <h3 className="text-sm font-black text-slate-900">3. Service Layer Extensions</h3>
                   </div>
                   <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 text-amber-700">
                      <AlertTriangle size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Depends on scenario</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                  {filteredAvailablePlugins.map(plugin => {
                    const isSelected = selectedPlugins.includes(plugin.id);
                    return (
                      <div key={plugin.id} onClick={() => togglePlugin(plugin.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all group relative overflow-hidden flex flex-col gap-3 ${isSelected ? 'border-blue-500 bg-blue-50/20 shadow-md shadow-blue-500/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                         <div className="flex justify-between items-start">
                           <div className={`p-2.5 rounded-xl transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 group-hover:scale-110'}`}>{getIcon(plugin.icon, 18)}</div>
                           {isSelected && <div className="text-blue-600"><CheckCircle2 size={18} /></div>}
                         </div>
                         <div>
                            <p className={`font-black text-sm ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>{plugin.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{plugin.description}</p>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="pt-5 shrink-0 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-xl text-slate-400 font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-50 transition-all">Discard</button>
              <button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/15 active:scale-95 transition-all">Create Site</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManager;

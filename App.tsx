
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPortal from './components/LoginPortal';
import SiteManager from './components/SiteManager';
import SiteDashboard from './components/SiteDashboard';
import GlobalTopology from './components/GlobalTopology';
import DeviceOnboarding from './components/DeviceOnboarding';
import ClientManager from './components/ClientManager';
import AlarmCenter from './components/AlarmCenter';
import UserManagement from './components/UserManagement';
import SiteSettings from './components/SystemSettings'; 
import GlobalSettings from './components/GlobalSettings';
import FirmwareUpdate from './components/FirmwareUpdate';
import GlobalInventory from './components/GlobalInventory';
import GlobalAlerts from './components/GlobalAlerts';
import GlobalDashboard from './components/GlobalDashboard';
import SiteMap from './components/SiteMap';
import GlobalAppStore from './components/GlobalAppStore';
import LicenseManager from './components/LicenseManager';
import SwitchingApp from './components/apps/SwitchingApp';
import WirelessApp from './components/apps/WirelessApp';
import DCFabricApp from './components/apps/DCFabricApp';
import AIRoceApp from './components/apps/AIRoceApp';
import CampusFabricApp from './components/apps/CampusFabricApp';
import OpticalApp from './components/apps/OpticalApp';
import CCTVApp from './components/apps/CCTVApp';
import NACApp from './components/apps/NACApp';
import SDWANApp from './components/apps/SDWANApp';
import { MOCK_SITES, MOCK_DEVICES, PLUGINS, getIcon } from './constants.tsx';
import { Site, PluginID } from './types';

type CoreFeature = 
  | 'portal-sites' | 'portal-map' | 'portal-market' | 'portal-fabric' | 'portal-devices' | 'portal-alarms' | 'portal-users' | 'portal-dashboard'
  | 'dashboard' | 'topology' | 'devices' | 'alarms' | 'users' | 'logs' | 'settings' | 'overview' | 'config' | 'profiles' | 'wired-clients' | 'wireless-clients' | 'firmware';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [activePlugin, setActivePlugin] = useState<PluginID | 'base'>('base');
  const [activeFeature, setActiveFeature] = useState<CoreFeature | string>('portal-sites');
  
  // Global Subscription State
  const [subscribedPlugins, setSubscribedPlugins] = useState<PluginID[]>(['campus-network', 'security-surveillance', 'aidc-network', 'idc-network', 'transport-network']);
  const [dynamicSites, setDynamicSites] = useState<Site[]>(MOCK_SITES);
  const [siteOverrides, setSiteOverrides] = useState<Record<string, Partial<Site>>>({});

  const allSites = useMemo(() => {
    return dynamicSites.map(s => ({ ...s, ...siteOverrides[s.id] }));
  }, [dynamicSites, siteOverrides]);

  const currentSite = useMemo(() => {
    return allSites.find(s => s.id === activeSiteId) || null;
  }, [activeSiteId, allSites]);

  if (!isLoggedIn) {
    return <LoginPortal onLogin={() => setIsLoggedIn(true)} />;
  }

  const handleSiteSelect = (id: string) => {
    if (id) {
      setActiveSiteId(id);
      // Auto-select first available plugin (excluding sd-wan which is global)
      const site = allSites.find(s => s.id === id);
      const firstPlugin = site?.activePlugins.find(p => p !== 'sd-wan');
      if (firstPlugin) {
        setActivePlugin(firstPlugin);
        setActiveFeature('overview');
      } else {
        setActivePlugin('base');
        setActiveFeature('topology');
      }
    } else {
      setActiveSiteId(null);
      setActivePlugin('base');
      setActiveFeature('portal-sites');
    }
  };

  const handleSubscribe = (id: PluginID) => {
    if (!subscribedPlugins.includes(id)) {
      setSubscribedPlugins(prev => [...prev, id]);
    }
  };

  const updateSitePlugins = (plugins: PluginID[]) => {
    if (!activeSiteId) return;
    setSiteOverrides(prev => ({
      ...prev,
      [activeSiteId]: { ...prev[activeSiteId], activePlugins: plugins }
    }));
  };

  const renderContent = () => {
    if (!activeSiteId) {
      switch (activeFeature) {
        case 'portal-dashboard': return <GlobalDashboard sites={allSites} onSelectSite={handleSiteSelect} />;
        case 'portal-sites': 
        case 'portal-devices': 
          return (
            <div className="h-full flex flex-col">
              <div className="px-8 pt-6 pb-0 bg-[#f8fafb]">
                <div className="max-w-[1200px] mx-auto flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
                  <button onClick={() => setActiveFeature('portal-sites')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFeature === 'portal-sites' ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sites</button>
                  <button onClick={() => setActiveFeature('portal-devices')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFeature === 'portal-devices' ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Devices</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {activeFeature === 'portal-sites' 
                  ? <SiteManager sites={allSites} onSelectSite={handleSiteSelect} onAddSite={(s) => setDynamicSites(p => [...p, s])} />
                  : <GlobalInventory onSelectSite={handleSiteSelect} />
                }
              </div>
            </div>
          );
        case 'portal-map': return <SiteMap sites={allSites} onSelectSite={handleSiteSelect} />;
        case 'portal-market': return <GlobalAppStore subscribedPlugins={subscribedPlugins} onSubscribe={handleSubscribe} />;
        case 'portal-fabric': return <SDWANApp feature="overview" />;
        case 'portal-alarms': return <GlobalAlerts sites={allSites} onSelectSite={handleSiteSelect} />;
        case 'portal-users': return <UserManagement activeSite={null} />;
        case 'settings': return <GlobalSettings />;
        default: return <SiteManager sites={allSites} onSelectSite={handleSiteSelect} onAddSite={(s) => setDynamicSites(p => [...p, s])} />;
      }
    }

    if (activePlugin === 'base') {
      switch (activeFeature) {
        case 'dashboard': return <SiteDashboard site={currentSite!} />;
        case 'topology': return <GlobalTopology site={currentSite!} />;
        case 'devices': return <GlobalInventory onSelectSite={handleSiteSelect} siteId={activeSiteId} />;
        case 'alarms': return <AlarmCenter siteId={activeSiteId} />;
        case 'users': return <UserManagement activeSite={currentSite} />;
        case 'firmware': return <FirmwareUpdate siteId={activeSiteId} />;
        case 'settings': return <SiteSettings site={currentSite!} onUpdateActivePlugins={updateSitePlugins} subscribedPlugins={subscribedPlugins} />;
        default: return <GlobalTopology site={currentSite!} />;
      }
    }

    // Handle shared features across plugins
    if (activeFeature === 'devices') return <GlobalInventory onSelectSite={handleSiteSelect} siteId={activeSiteId} />;
    if (activeFeature === 'alarms') return <AlarmCenter siteId={activeSiteId} />;
    if (activeFeature === 'wired-clients') return <ClientManager siteId={activeSiteId!} filterType="wired" />;
    if (activeFeature === 'wireless-clients') return <ClientManager siteId={activeSiteId!} filterType="wifi" />;
    if (activeFeature === 'topology') return <GlobalTopology site={currentSite!} />;
    if (activeFeature === 'license') return <LicenseManager />;

    const filteredDevices = MOCK_DEVICES.filter(d => d.siteId === activeSiteId && d.pluginType === activePlugin);

    // Map new plugin IDs to existing app components where available
    if (activePlugin === 'campus-network') return <CampusFabricApp site={currentSite!} devices={filteredDevices} feature={activeFeature} />;
    if (activePlugin === 'idc-network') return <DCFabricApp site={currentSite!} feature={activeFeature} />;
    if (activePlugin === 'aidc-network') return <AIRoceApp site={currentSite!} feature={activeFeature} />;
    if (activePlugin === 'transport-network') return <OpticalApp devices={filteredDevices} feature={activeFeature} />;
    if (activePlugin === 'security-surveillance') return <CCTVApp />;

    // Generic app placeholder for new plugins without dedicated components
    const pluginMeta = PLUGINS.find(p => p.id === activePlugin);
    return (
      <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-300">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{pluginMeta?.name || activePlugin}</h1>
        <p className="text-slate-400 text-sm font-medium mb-10">{pluginMeta?.description}</p>
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            {pluginMeta && getIcon(pluginMeta.icon, 36)}
          </div>
          <p className="text-slate-400 text-sm font-bold">App Dashboard — Coming Soon</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#fcfcfc] overflow-hidden text-slate-900 font-sans">
      <Sidebar 
        activeSite={currentSite}
        activePlugin={activePlugin}
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        onGoToPortal={() => handleSiteSelect('')}
        sites={allSites}
        onSiteSelect={handleSiteSelect}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header 
          site={currentSite} 
          activePlugin={activePlugin}
          onSiteSelect={handleSiteSelect}
          onPluginSelect={(id) => { setActivePlugin(id); setActiveFeature(id === 'base' ? 'dashboard' : 'overview'); }}
          onLogout={() => setIsLoggedIn(false)}
        />
        <main className="flex-1 overflow-auto relative custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;

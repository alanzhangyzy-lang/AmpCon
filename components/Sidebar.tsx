import React, { useState, useEffect, useCallback } from 'react';
import {
  Network, Users, Bell, Settings,
  HardDrive, Activity, Video, Layers,
  LayoutGrid, MapPin, Globe, ChevronLeft, Server, ShoppingBag,
  BarChart3, Sliders, Monitor, Box, FileText,
  Smartphone, Wifi, Radio, Shield, Wrench
} from 'lucide-react';
import { PluginID, Site } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeSite: Site | null;
  activePlugin: PluginID | 'base';
  activeFeature: string;
  setActiveFeature: (f: string) => void;
  onGoToPortal: () => void;
  sites?: Site[];
  onSiteSelect?: (id: string) => void;
}

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  feature?: string;                // direct feature (no panel)
  children?: PanelSection[];       // opens slide-out panel
}

interface PanelSection {
  heading?: string;
  items: PanelEntry[];
}

interface PanelEntry {
  icon: React.ReactNode;
  label: string;
  feature: string;
}

// ── Menu definitions ───────────────────────────────────────────────────────────

const portalMenu: MenuItem[] = [
  { id: 'sites', icon: <LayoutGrid size={18} />, label: 'Site Manager', feature: 'portal-sites' },
  { id: 'topo', icon: <MapPin size={18} />, label: 'Topology', feature: 'portal-map' },
  { id: 'events', icon: <Bell size={18} />, label: 'Event Log', feature: 'portal-alarms' },
];

const portalSettings: MenuItem = {
  id: 'settings',
  icon: <Settings size={18} />,
  label: 'Settings',
  children: [
    {
      items: [
        { icon: <ShoppingBag size={16} />, label: 'App Store', feature: 'portal-market' },
        { icon: <Settings size={16} />, label: 'System', feature: 'settings' },
        { icon: <Users size={16} />, label: 'Admins', feature: 'portal-users' },
      ],
    },
  ],
};

const siteBaseMenu: MenuItem[] = [
  { id: 'back', icon: <ChevronLeft size={18} />, label: 'Back', feature: '__back__' },
  { id: 'topo', icon: <Network size={18} />, label: 'Topology', feature: 'topology' },
  { id: 'devices', icon: <HardDrive size={18} />, label: 'Devices', feature: 'devices' },
  { id: 'events', icon: <Bell size={18} />, label: 'Event Log', feature: 'alarms' },
  { id: 'users', icon: <Users size={18} />, label: 'Users', feature: 'users' },
  { id: 'settings', icon: <Settings size={18} />, label: 'Settings', feature: 'settings' },
];

const campusMenu: MenuItem[] = [
  { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard', feature: 'overview' },
  { id: 'topo', icon: <Network size={18} />, label: 'Topology', feature: 'topology' },
  {
    id: 'device',
    icon: <HardDrive size={18} />,
    label: 'Device',
    children: [
      {
        heading: 'Switch',
        items: [
          { icon: <HardDrive size={16} />, label: 'Device List', feature: 'devices' },
          { icon: <Layers size={16} />, label: 'Adopt Device', feature: 'adopt-device' },
        ],
      },
      {
        heading: 'Client',
        items: [
          { icon: <Smartphone size={16} />, label: 'Wired Client', feature: 'wired-clients' },
          { icon: <Wifi size={16} />, label: 'Wireless Client', feature: 'wireless-clients' },
        ],
      },
    ],
  },
  {
    id: 'provisioning',
    icon: <Sliders size={18} />,
    label: 'Provisioning',
    children: [
      {
        heading: 'Config',
        items: [
          { icon: <Settings size={16} />, label: 'Global Config', feature: 'global-config' },
          { icon: <Layers size={16} />, label: 'Wired Config', feature: 'wired-config' },
          { icon: <Radio size={16} />, label: 'Wireless Config', feature: 'wireless-config' },
        ],
      },
      {
        heading: 'Policy',
        items: [
          { icon: <FileText size={16} />, label: 'Profile', feature: 'profile' },
          { icon: <Shield size={16} />, label: 'NAC', feature: 'nac' },
        ],
      },
    ],
  },
  {
    id: 'assurance',
    icon: <BarChart3 size={18} />,
    label: 'Assurance',
    children: [
      {
        items: [
          { icon: <Bell size={16} />, label: 'Alarms', feature: 'alarms' },
          { icon: <FileText size={16} />, label: 'Logs', feature: 'logs' },
          { icon: <Layers size={16} />, label: 'Upgrade', feature: 'upgrade' },
          { icon: <Radio size={16} />, label: 'RRM Optimize', feature: 'rrm-optimize' },
          { icon: <Shield size={16} />, label: 'License', feature: 'license' },
          { icon: <Wrench size={16} />, label: 'Tools', feature: 'tools' },
        ],
      },
    ],
  },
];

const campusSettings: MenuItem = {
  id: 'system',
  icon: <Settings size={18} />,
  label: 'System',
  children: [{ items: [{ icon: <Users size={16} />, label: 'Admin', feature: 'admin' }] }],
};

const idcMenu: MenuItem[] = [
  { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard', feature: 'overview' },
  { id: 'topo', icon: <Network size={18} />, label: 'Topology', feature: 'topology' },
  {
    id: 'device',
    icon: <HardDrive size={18} />,
    label: 'Device',
    children: [{ items: [{ icon: <HardDrive size={16} />, label: 'Device List', feature: 'devices' }] }],
  },
  {
    id: 'provisioning',
    icon: <Sliders size={18} />,
    label: 'Provisioning',
    children: [
      {
        heading: 'Fabric',
        items: [
          { icon: <Layers size={16} />, label: 'Underlay/BGP', feature: 'underlay' },
          { icon: <Network size={16} />, label: 'Overlay/VNI', feature: 'overlay' },
          { icon: <Box size={16} />, label: 'Virtualization', feature: 'virtualization' },
        ],
      },
      {
        heading: 'Policy',
        items: [
          { icon: <FileText size={16} />, label: 'Blueprints', feature: 'profiles' },
          { icon: <Sliders size={16} />, label: 'Tenant Policy', feature: 'config' },
        ],
      },
    ],
  },
  {
    id: 'assurance',
    icon: <BarChart3 size={18} />,
    label: 'Assurance',
    children: [
      {
        items: [
          { icon: <Bell size={16} />, label: 'Alarms', feature: 'alarms' },
          { icon: <BarChart3 size={16} />, label: 'Traffic Analytics', feature: 'traffic' },
          { icon: <FileText size={16} />, label: 'Logs', feature: 'logs' },
          { icon: <Shield size={16} />, label: 'License', feature: 'license' },
        ],
      },
    ],
  },
];

const aidcMenu: MenuItem[] = [
  { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard', feature: 'overview' },
  { id: 'topo', icon: <Network size={18} />, label: 'Topology', feature: 'topology' },
  {
    id: 'device',
    icon: <HardDrive size={18} />,
    label: 'Device',
    children: [{ items: [{ icon: <HardDrive size={16} />, label: 'Device List', feature: 'devices' }] }],
  },
  {
    id: 'provisioning',
    icon: <Sliders size={18} />,
    label: 'Provisioning',
    children: [
      {
        items: [
          { icon: <Network size={16} />, label: 'Network Design', feature: 'network-design' },
          { icon: <LayoutGrid size={16} />, label: 'Studios', feature: 'studio2' },
          { icon: <Layers size={16} />, label: 'Workspaces', feature: 'workspaces' },
          { icon: <FileText size={16} />, label: 'Tasks', feature: 'tasks' },
          { icon: <Activity size={16} />, label: 'Change Control', feature: 'change-control' },
        ],
      },
    ],
  },
  {
    id: 'assurance',
    icon: <BarChart3 size={18} />,
    label: 'Assurance',
    children: [
      {
        items: [
          { icon: <Bell size={16} />, label: 'Alarms', feature: 'alarms' },
          { icon: <BarChart3 size={16} />, label: 'Traffic Analytics', feature: 'traffic' },
          { icon: <FileText size={16} />, label: 'Logs', feature: 'logs' },
          { icon: <Shield size={16} />, label: 'License', feature: 'license' },
        ],
      },
    ],
  },
];

const idcSettings: MenuItem = {
  id: 'system',
  icon: <Settings size={18} />,
  label: 'System',
  children: [{ items: [{ icon: <Users size={16} />, label: 'Admin', feature: 'admin' }] }],
};

const securityMenu: MenuItem[] = [
  { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard', feature: 'overview' },
  {
    id: 'device',
    icon: <HardDrive size={18} />,
    label: 'Device',
    children: [{ items: [{ icon: <Video size={16} />, label: 'Camera List', feature: 'devices' }] }],
  },
  {
    id: 'provisioning',
    icon: <Sliders size={18} />,
    label: 'Provisioning',
    children: [
      {
        items: [
          { icon: <Bell size={16} />, label: 'Events', feature: 'events' },
          { icon: <Monitor size={16} />, label: 'Playback', feature: 'playback' },
          { icon: <FileText size={16} />, label: 'Case Manager', feature: 'case-manager' },
          { icon: <Video size={16} />, label: 'Live View', feature: 'live-view' },
        ],
      },
    ],
  },
  {
    id: 'assurance',
    icon: <BarChart3 size={18} />,
    label: 'Assurance',
    children: [
      {
        items: [
          { icon: <Bell size={16} />, label: 'Alarms', feature: 'alarms' },
          { icon: <FileText size={16} />, label: 'Logs', feature: 'logs' },
        ],
      },
    ],
  },
];

const securitySettings: MenuItem = {
  id: 'system',
  icon: <Settings size={18} />,
  label: 'System',
  children: [{ items: [{ icon: <Users size={16} />, label: 'Admin', feature: 'admin' }] }],
};

const transportMenu: MenuItem[] = [
  { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard', feature: 'overview' },
  { id: 'topo', icon: <Network size={18} />, label: 'Topology', feature: 'topology' },
  {
    id: 'device',
    icon: <HardDrive size={18} />,
    label: 'Device',
    children: [{ items: [{ icon: <HardDrive size={16} />, label: 'Device List', feature: 'devices' }] }],
  },
  {
    id: 'provisioning',
    icon: <Sliders size={18} />,
    label: 'Provisioning',
    children: [
      {
        items: [
          { icon: <Layers size={16} />, label: 'Wavelength', feature: 'wavelength' },
          { icon: <Sliders size={16} />, label: 'OTN Config', feature: 'config' },
        ],
      },
    ],
  },
  {
    id: 'assurance',
    icon: <BarChart3 size={18} />,
    label: 'Assurance',
    children: [
      {
        items: [
          { icon: <Bell size={16} />, label: 'Alarms', feature: 'alarms' },
          { icon: <BarChart3 size={16} />, label: 'Performance', feature: 'traffic' },
          { icon: <FileText size={16} />, label: 'Logs', feature: 'logs' },
        ],
      },
    ],
  },
];

const transportSettings: MenuItem = {
  id: 'system',
  icon: <Settings size={18} />,
  label: 'System',
  children: [{ items: [{ icon: <Users size={16} />, label: 'Admin', feature: 'admin' }] }],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMenuConfig(
  activeSite: Site | null,
  activePlugin: PluginID | 'base',
): { items: MenuItem[]; settingsItem: MenuItem | null } {
  if (!activeSite) return { items: portalMenu, settingsItem: portalSettings };
  if (activePlugin === 'base') return { items: siteBaseMenu, settingsItem: null };

  switch (activePlugin) {
    case 'campus-network':
      return { items: campusMenu, settingsItem: campusSettings };
    case 'idc-network':
      return { items: idcMenu, settingsItem: idcSettings };
    case 'aidc-network':
      return { items: aidcMenu, settingsItem: idcSettings };
    case 'security-surveillance':
      return { items: securityMenu, settingsItem: securitySettings };
    case 'transport-network':
      return { items: transportMenu, settingsItem: transportSettings };
    default:
      return { items: [], settingsItem: null };
  }
}

/** Check if a 1st-level item (or any of its children) owns the current feature */
function menuOwnsFeature(item: MenuItem, feature: string): boolean {
  if (item.feature && (item.feature === feature || (item.feature === 'portal-sites' && feature === 'portal-devices'))) return true;
  if (item.children) {
    return item.children.some(sec => sec.items.some(e => e.feature === feature));
  }
  return false;
}

const getSiteIcon = (siteType: string, size: number) => {
  if (siteType === 'DataCenter') return <Server size={size} />;
  if (siteType === 'Optical') return <Network size={size} />;
  return <MapPin size={size} />;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Icon-only sidebar button with tooltip */
const IconItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  panelOpen?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, panelOpen, onClick }) => (
  <button
    onClick={onClick}
    aria-haspopup={panelOpen !== undefined ? 'menu' : undefined}
    aria-expanded={panelOpen}
    title={label}
    className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all relative group ${
      active
        ? 'bg-[#0ABAB5] text-white shadow-sm'
        : panelOpen
          ? 'bg-slate-100 text-slate-700'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    {icon}
    {/* tooltip */}
    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] shadow-lg">
      {label}
      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
    </div>
  </button>
);

/** Full-width button inside the slide-out panel */
const PanelItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
      active ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className={active ? 'text-[#0ABAB5]' : 'text-slate-400'}>{icon}</div>
    {label}
  </button>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({
  activeSite,
  activePlugin,
  activeFeature,
  setActiveFeature,
  onGoToPortal,
  sites = [],
  onSiteSelect,
}) => {
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const { items, settingsItem } = getMenuConfig(activeSite, activePlugin);

  // Close panel when context changes (site / plugin switch)
  useEffect(() => {
    setExpandedMenu(null);
  }, [activeSite?.id, activePlugin]);

  // Handle 1st-level icon click
  const handleIconClick = useCallback(
    (item: MenuItem) => {
      if (item.feature === '__back__') {
        onGoToPortal();
        return;
      }
      if (item.children) {
        // Toggle panel
        setExpandedMenu(prev => (prev === item.id ? null : item.id));
      } else if (item.feature) {
        setExpandedMenu(null);
        setActiveFeature(item.feature);
      }
    },
    [onGoToPortal, setActiveFeature],
  );

  // Handle 2nd-level panel item click — keep panel open
  const handlePanelItemClick = useCallback(
    (feature: string) => {
      setActiveFeature(feature);
    },
    [setActiveFeature],
  );

  // Resolve which panel sections to show
  const expandedItem = [...items, ...(settingsItem ? [settingsItem] : [])].find(
    i => i.id === expandedMenu,
  );

  return (
    <div className="flex h-full z-[60]">
      {/* ── Icon bar ─────────────────────────────────────────────────────── */}
      <div className="w-14 border-r border-slate-200 bg-white flex flex-col shadow-sm select-none">
        {/* Site switcher */}
        <div className="p-2 mb-1 relative">
          <button
            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md mx-auto bg-[#0ABAB5] text-white"
            title={activeSite ? activeSite.name : 'Global'}
          >
            {activeSite ? getSiteIcon(activeSite.siteType, 18) : <Globe size={18} />}
          </button>

          {showSiteDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSiteDropdown(false)} />
              <div className="absolute left-2 top-14 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-200 origin-top-left w-52">
                <button
                  onClick={() => { onSiteSelect?.(''); setShowSiteDropdown(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-colors ${
                    !activeSite ? 'bg-[#0ABAB5] text-white' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Globe size={14} /> Global
                </button>
                <div className="h-px bg-slate-100" />
                {sites.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onSiteSelect?.(s.id); setShowSiteDropdown(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-colors ${
                      activeSite?.id === s.id ? 'bg-[#0ABAB5] text-white' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {getSiteIcon(s.siteType, 14)} {s.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 1st-level nav icons */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
          {items.map(item => (
            <IconItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={!item.children && menuOwnsFeature(item, activeFeature)}
              panelOpen={expandedMenu === item.id}
              onClick={() => handleIconClick(item)}
            />
          ))}
        </div>

        {/* Settings at bottom */}
        {settingsItem && (
          <div className="p-1.5 border-t border-slate-100 space-y-1">
            <IconItem
              icon={settingsItem.icon}
              label={settingsItem.label}
              active={!settingsItem.children && menuOwnsFeature(settingsItem, activeFeature)}
              panelOpen={expandedMenu === settingsItem.id}
              onClick={() => handleIconClick(settingsItem)}
            />
          </div>
        )}
      </div>

      {/* ── Backdrop (click-outside to close panel) ──────────────────────── */}
      {expandedMenu && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setExpandedMenu(null)}
        />
      )}

      {/* ── Slide-out panel ──────────────────────────────────────────────── */}
      {expandedMenu && expandedItem?.children && (
        <div className="w-52 border-r border-slate-200 bg-white shadow-lg animate-in slide-in-from-left duration-200 flex flex-col z-[56]">
          {/* Panel header */}
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {expandedItem.label}
            </p>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {expandedItem.children.map((section, si) => (
              <div key={si}>
                {section.heading && (
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-3 pt-2 pb-1">
                    {section.heading}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map(entry => (
                    <PanelItem
                      key={entry.feature}
                      icon={entry.icon}
                      label={entry.label}
                      active={activeFeature === entry.feature || activeFeature.startsWith(`${entry.feature}:`)}
                      onClick={() => handlePanelItemClick(entry.feature)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

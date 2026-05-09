
export type PluginID = 
  // Campus
  | 'campus-network' | 'security-surveillance'
  // DataCenter
  | 'aidc-network' | 'idc-network'
  // Optical
  | 'transport-network';

export type AccessLevel = 'Full' | 'Read' | 'None';

export interface AppPermission {
  appId: PluginID;
  level: AccessLevel;
}

export interface SitePermission {
  siteId: string;
  level: AccessLevel; // Global level for the site
  appOverrides?: AppPermission[]; // Fine-grained app levels
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'SiteAdmin' | 'Viewer' | 'Custom';
  avatar?: string;
  globalPermissions?: SitePermission[]; // For Global Admins
  sitePermissions?: AppPermission[]; // For Local Site Users
}

export interface PluginMetadata {
  id: PluginID;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  country: string;
  region: string;
  health: number;
  activePlugins: PluginID[];
  deviceCount: number;
  alertCount: number;
  siteType: 'Campus' | 'DataCenter' | 'Optical';
}

export interface Device {
  id: string;
  siteId: string;
  name: string;
  model: string;
  ip: string;
  mac: string;
  role: 'Core' | 'Aggregation' | 'Access' | 'Spine' | 'Leaf' | 'OTN' | 'AP' | 'Camera' | 'Border' | 'Optical';
  status: 'online' | 'offline' | 'provisioning' | 'pending';
  pluginType: PluginID;
  image: string;
  ports?: DevicePort[];
}

export interface DevicePort {
  id: number;
  status: 'active' | 'inactive' | 'error';
  poe: boolean;
  vlan: number;
  speed: string;
}

// Added Client interface to fix "Module './types' has no exported member 'Client'" errors
export interface Client {
  id: string;
  name: string;
  mac: string;
  ip: string;
  connectedTo: string;
  signal?: number;
  traffic: string;
  connectionType: 'wifi' | 'wired';
  clientType: 'UserDevice' | 'Server';
}

// Added Alarm interface to fix "Module './types' has no exported member 'Alarm'" errors
export interface Alarm {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
  message: string;
  source: string;
  time: string;
  status: 'active' | 'cleared';
}

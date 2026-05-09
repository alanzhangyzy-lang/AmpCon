
import React from 'react';
import { LayoutGrid, Wifi, Radio, Zap, ShieldCheck, Video, Server, Network, Globe, Cpu, Layers, Share2, Box, Shield, BarChart3, Cloud } from 'lucide-react';
import { PluginMetadata, Site, Device, Client, Alarm, User } from './types';

export const PLUGINS: PluginMetadata[] = [
  // Campus Apps
  { id: 'campus-network', name: 'Campus Network', icon: 'Zap', description: 'Unified Wired & Wireless Network Management', color: '#0ABAB5' },
  { id: 'security-surveillance', name: 'Security & Surveillance', icon: 'Video', description: 'Unified Video Security & AI Analytics', color: '#ef4444' },
  // DataCenter Apps
  { id: 'aidc-network', name: 'AIDC Network', icon: 'Cpu', description: 'AI Data Center Lossless Fabric & RoCE Orchestration', color: '#ec4899' },
  { id: 'idc-network', name: 'IDC Network', icon: 'Box', description: 'Traditional DC Spine-Leaf Network Orchestration', color: '#6366f1' },
  // Optical Apps
  { id: 'transport-network', name: 'Transport Network', icon: 'Network', description: 'OTN/WDM Optical Transport Orchestration', color: '#f59e0b' },
];

export const MOCK_SITES: Site[] = [
  { id: 'wh-hq', name: 'San Jose Campus', location: 'Santa Clara, San Jose', country: 'United States', region: 'California', health: 98, activePlugins: ['campus-network', 'security-surveillance'], deviceCount: 12, alertCount: 2, siteType: 'Campus' },
  { id: 'bj-dc', name: 'Frankfurt Data Center', location: 'Sossenheim, Frankfurt', country: 'Germany', region: 'Hessen', health: 100, activePlugins: ['idc-network', 'aidc-network'], deviceCount: 42, alertCount: 0, siteType: 'DataCenter' },
  { id: 'nj-branch', name: 'Shanghai Branch', location: 'Pudong, Shanghai', country: 'China', region: 'Shanghai', health: 92, activePlugins: ['campus-network'], deviceCount: 8, alertCount: 1, siteType: 'Campus' },
  { id: 'ldn-branch', name: 'London Optical Transport', location: 'Canary Wharf, London', country: 'United Kingdom', region: 'England', health: 95, activePlugins: ['transport-network'], deviceCount: 6, alertCount: 1, siteType: 'Optical' },
];

export const MOCK_DEVICES: Device[] = [
  // WH HQ Devices (Campus Network)
  { id: 'sw-f-01', siteId: 'wh-hq', name: 'WH-Core-01', model: 'AmpX-Core-96', ip: '10.0.1.1', mac: 'AA:BB:CC:DD:EE:01', role: 'Core', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-f-02', siteId: 'wh-hq', name: 'WH-Core-02', model: 'AmpX-Core-96', ip: '10.0.1.2', mac: 'AA:BB:CC:DD:EE:02', role: 'Core', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-f-03', siteId: 'wh-hq', name: 'WH-Agg-01', model: 'AmpX-Agg-48', ip: '10.0.1.10', mac: 'AA:BB:CC:DD:EE:10', role: 'Aggregation', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-f-04', siteId: 'wh-hq', name: 'WH-Agg-02', model: 'AmpX-Agg-48', ip: '10.0.1.11', mac: 'AA:BB:CC:DD:EE:11', role: 'Aggregation', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-f-05', siteId: 'wh-hq', name: 'WH-Access-01', model: 'AmpX-Acc-48P', ip: '10.0.1.20', mac: 'AA:BB:CC:DD:EE:20', role: 'Access', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-f-06', siteId: 'wh-hq', name: 'WH-Access-02', model: 'AmpX-Acc-48P', ip: '10.0.1.21', mac: 'AA:BB:CC:DD:EE:21', role: 'Access', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'ap-wh-01', siteId: 'wh-hq', name: 'WH-Floor1-AP01', model: 'Uni-WiFi-7', ip: '10.0.1.101', mac: 'AA:BB:CC:DD:EE:A1', role: 'AP', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200' },
  { id: 'ap-wh-02', siteId: 'wh-hq', name: 'WH-Floor1-AP02', model: 'Uni-WiFi-7', ip: '10.0.1.102', mac: 'AA:BB:CC:DD:EE:A2', role: 'AP', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200' },
  { id: 'ap-wh-03', siteId: 'wh-hq', name: 'WH-Floor2-AP01', model: 'Uni-WiFi-7', ip: '10.0.1.103', mac: 'AA:BB:CC:DD:EE:A3', role: 'AP', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200' },
  { id: 'cam-wh-01', siteId: 'wh-hq', name: 'WH-Entrance-Cam', model: 'AmpCam-4K', ip: '10.0.1.201', mac: 'AA:BB:CC:DD:EE:C1', role: 'Camera', status: 'online', pluginType: 'security-surveillance', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=200' },
  { id: 'cam-wh-02', siteId: 'wh-hq', name: 'WH-Parking-Cam', model: 'AmpCam-4K', ip: '10.0.1.202', mac: 'AA:BB:CC:DD:EE:C2', role: 'Camera', status: 'online', pluginType: 'security-surveillance', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=200' },
  
  // NJ Branch Devices (Traditional)
  { id: 'sw-01', siteId: 'nj-branch', name: 'NJ-Core-01', model: 'AmpX-Core-48', ip: '192.168.20.1', mac: 'BC:DD:EE:FF:00:01', role: 'Core', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-02', siteId: 'nj-branch', name: 'NJ-Access-01', model: 'AmpX-Acc-48P', ip: '192.168.20.10', mac: 'BC:DD:EE:FF:00:10', role: 'Access', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-03', siteId: 'nj-branch', name: 'NJ-Access-02', model: 'AmpX-Acc-48P', ip: '192.168.20.11', mac: 'BC:DD:EE:FF:00:11', role: 'Access', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'sw-04', siteId: 'nj-branch', name: 'NJ-Access-03', model: 'AmpX-Acc-24P', ip: '192.168.20.12', mac: 'BC:DD:EE:FF:00:12', role: 'Access', status: 'provisioning', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=200' },
  { id: 'ap-01', siteId: 'nj-branch', name: 'NJ-Office-AP01', model: 'Uni-WiFi-7', ip: '192.168.20.101', mac: 'AA:BB:CC:DD:EE:A1', role: 'AP', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200' },
  { id: 'ap-02', siteId: 'nj-branch', name: 'NJ-Office-AP02', model: 'Uni-WiFi-7', ip: '192.168.20.102', mac: 'AA:BB:CC:DD:EE:A2', role: 'AP', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200' },
  { id: 'ap-03', siteId: 'nj-branch', name: 'NJ-Warehouse-AP', model: 'Uni-WiFi-6', ip: '192.168.20.103', mac: 'AA:BB:CC:DD:EE:A3', role: 'AP', status: 'online', pluginType: 'campus-network', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200' },
  
  // BJ DC Devices
  { id: 'spine-01', siteId: 'bj-dc', name: 'BJ-Spine-01', model: 'AmpFabric-S1', ip: '192.168.10.1', mac: 'BC:DD:EE:FF:00:01', role: 'Spine', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'spine-02', siteId: 'bj-dc', name: 'BJ-Spine-02', model: 'AmpFabric-S1', ip: '192.168.10.2', mac: 'BC:DD:EE:FF:00:02', role: 'Spine', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'spine-03', siteId: 'bj-dc', name: 'BJ-Spine-03', model: 'AmpFabric-S1', ip: '192.168.10.3', mac: 'BC:DD:EE:FF:00:03', role: 'Spine', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'spine-04', siteId: 'bj-dc', name: 'BJ-Spine-04', model: 'AmpFabric-S1', ip: '192.168.10.4', mac: 'BC:DD:EE:FF:00:04', role: 'Spine', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-01', siteId: 'bj-dc', name: 'BJ-Leaf-01', model: 'AmpFabric-L1', ip: '192.168.10.11', mac: 'BC:DD:EE:FF:01:01', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-02', siteId: 'bj-dc', name: 'BJ-Leaf-02', model: 'AmpFabric-L1', ip: '192.168.10.12', mac: 'BC:DD:EE:FF:01:02', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-03', siteId: 'bj-dc', name: 'BJ-Leaf-03', model: 'AmpFabric-L1', ip: '192.168.10.13', mac: 'BC:DD:EE:FF:01:03', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-04', siteId: 'bj-dc', name: 'BJ-Leaf-04', model: 'AmpFabric-L1', ip: '192.168.10.14', mac: 'BC:DD:EE:FF:01:04', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-05', siteId: 'bj-dc', name: 'BJ-Leaf-05', model: 'AmpFabric-L1', ip: '192.168.10.15', mac: 'BC:DD:EE:FF:01:05', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-06', siteId: 'bj-dc', name: 'BJ-Leaf-06', model: 'AmpFabric-L1', ip: '192.168.10.16', mac: 'BC:DD:EE:FF:01:06', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-07', siteId: 'bj-dc', name: 'BJ-Leaf-07', model: 'AmpFabric-L1', ip: '192.168.10.17', mac: 'BC:DD:EE:FF:01:07', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-08', siteId: 'bj-dc', name: 'BJ-Leaf-08', model: 'AmpFabric-L1', ip: '192.168.10.18', mac: 'BC:DD:EE:FF:01:08', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-09', siteId: 'bj-dc', name: 'BJ-Leaf-09', model: 'AmpFabric-L1', ip: '192.168.10.19', mac: 'BC:DD:EE:FF:01:09', role: 'Leaf', status: 'provisioning', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-10', siteId: 'bj-dc', name: 'BJ-Leaf-10', model: 'AmpFabric-L1', ip: '192.168.10.20', mac: 'BC:DD:EE:FF:01:10', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-11', siteId: 'bj-dc', name: 'BJ-Leaf-11', model: 'AmpFabric-L1', ip: '192.168.10.21', mac: 'BC:DD:EE:FF:01:11', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'leaf-12', siteId: 'bj-dc', name: 'BJ-Leaf-12', model: 'AmpFabric-L1', ip: '192.168.10.22', mac: 'BC:DD:EE:FF:01:12', role: 'Leaf', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'border-01', siteId: 'bj-dc', name: 'BJ-Border-01', model: 'AmpFabric-B1', ip: '192.168.10.31', mac: 'BC:DD:EE:FF:03:01', role: 'Border', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'border-02', siteId: 'bj-dc', name: 'BJ-Border-02', model: 'AmpFabric-B1', ip: '192.168.10.32', mac: 'BC:DD:EE:FF:03:02', role: 'Border', status: 'online', pluginType: 'idc-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'optical-01', siteId: 'bj-dc', name: 'BJ-OTN-01', model: 'AmpOptical-100G', ip: '192.168.10.41', mac: 'BC:DD:EE:FF:04:01', role: 'Optical', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'optical-02', siteId: 'bj-dc', name: 'BJ-OTN-02', model: 'AmpOptical-100G', ip: '192.168.10.42', mac: 'BC:DD:EE:FF:04:02', role: 'Optical', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  
  // London Optical Transport Devices
  { id: 'ldn-otn-01', siteId: 'ldn-branch', name: 'LDN-OTN-MUX-01', model: 'AmpOptical-200G', ip: '172.16.1.1', mac: 'DA:BB:CC:11:22:01', role: 'OTN', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'ldn-otn-02', siteId: 'ldn-branch', name: 'LDN-OTN-MUX-02', model: 'AmpOptical-200G', ip: '172.16.1.2', mac: 'DA:BB:CC:11:22:02', role: 'OTN', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'ldn-wdm-01', siteId: 'ldn-branch', name: 'LDN-ROADM-01', model: 'AmpWDM-96CH', ip: '172.16.1.10', mac: 'DA:BB:CC:11:22:03', role: 'Optical', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'ldn-wdm-02', siteId: 'ldn-branch', name: 'LDN-ROADM-02', model: 'AmpWDM-96CH', ip: '172.16.1.11', mac: 'DA:BB:CC:11:22:04', role: 'Optical', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'ldn-amp-01', siteId: 'ldn-branch', name: 'LDN-OLA-01', model: 'AmpOptical-OLA', ip: '172.16.1.20', mac: 'DA:BB:CC:11:22:05', role: 'Optical', status: 'online', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
  { id: 'ldn-amp-02', siteId: 'ldn-branch', name: 'LDN-OLA-02', model: 'AmpOptical-OLA', ip: '172.16.1.21', mac: 'DA:BB:CC:11:22:06', role: 'Optical', status: 'provisioning', pluginType: 'transport-network', image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=200' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Zhang San', email: 'zhangsan@ampcon.io', role: 'SuperAdmin', avatar: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', name: 'Li Si', email: 'lisi@ampcon.io', role: 'SiteAdmin', avatar: 'https://i.pravatar.cc/150?u=u2' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'c1', name: 'Admin-MacBook', mac: 'E4:E4:C3:D2:11:01', ip: '10.0.1.101', connectedTo: 'sw-f-01', signal: -45, traffic: '1.2 GB', connectionType: 'wired', clientType: 'UserDevice' },
  { id: 'c2', name: 'Work-Station-01', mac: 'BC:FB:C3:D2:11:02', ip: '10.0.1.102', connectedTo: 'sw-01', traffic: '4.8 GB', connectionType: 'wired', clientType: 'Server' },
];

export const MOCK_ALARMS: Alarm[] = [
  { id: 'a1', severity: 'critical', message: 'Power Supply Redundancy Lost', source: 'SJ-Core-01', time: '2026-03-19 10:45', status: 'active' },
  { id: 'a2', severity: 'major', message: 'STP Topology Change G0/24', source: 'SH-Access-01', time: '2026-03-19 10:20', status: 'active' },
  { id: 'a3', severity: 'minor', message: 'CRC Error Rate Threshold', source: 'SJ-Access-02', time: '2026-03-19 09:55', status: 'active' },
  { id: 'a4', severity: 'warning', message: 'VLAN 100 Pruned on Trunk', source: 'SJ-Core-02', time: '2026-03-19 09:10', status: 'cleared' },
  { id: 'a5', severity: 'critical', message: 'BGP Peer Down - Spine-01', source: 'FRA-Border-01', time: '2026-03-19 08:30', status: 'active' },
  { id: 'a6', severity: 'major', message: 'High CPU Utilization (92%)', source: 'FRA-Spine-02', time: '2026-03-19 08:15', status: 'active' },
  { id: 'a7', severity: 'minor', message: 'AP Association Limit Reached', source: 'SJ-AP-03', time: '2026-03-19 07:40', status: 'active' },
  { id: 'a8', severity: 'warning', message: 'Optical Power Degradation', source: 'FRA-Optical-01', time: '2026-03-18 22:10', status: 'active' },
  { id: 'a9', severity: 'major', message: 'DHCP Pool Exhaustion Warning', source: 'SH-SW-01', time: '2026-03-18 18:30', status: 'active' },
  { id: 'a10', severity: 'minor', message: 'NTP Sync Lost', source: 'SH-SW-02', time: '2026-03-18 16:00', status: 'cleared' },
  { id: 'a11', severity: 'warning', message: 'PoE Budget Threshold 80%', source: 'LDN-Access-01', time: '2026-03-19 11:20', status: 'active' },
  { id: 'a12', severity: 'critical', message: 'Camera Offline - No Video Feed', source: 'WH-Entrance-Cam', time: '2026-03-19 11:30', status: 'active' },
  { id: 'a13', severity: 'critical', message: 'Camera Storage Full', source: 'WH-Parking-Cam', time: '2026-03-19 11:35', status: 'active' },
];

// ── Site neighbor inter-connection data ──────────────────
export interface SiteNeighborLink {
  fromSiteId: string;
  fromDeviceName: string;
  fromPort: string;
  toSiteId: string;
  toDeviceName: string;
  toPort: string;
  bandwidth: string;
  status: 'active' | 'degraded';
}

export const SITE_NEIGHBOR_LINKS: SiteNeighborLink[] = [
  { fromSiteId: 'wh-hq', fromDeviceName: 'WH-Core-01', fromPort: 'Eth1/49', toSiteId: 'bj-dc',     toDeviceName: 'BJ-Border-01', toPort: 'Eth1/1',  bandwidth: '10G', status: 'active' },
  { fromSiteId: 'wh-hq', fromDeviceName: 'WH-Core-02', fromPort: 'Eth1/49', toSiteId: 'bj-dc',     toDeviceName: 'BJ-Border-02', toPort: 'Eth1/1',  bandwidth: '10G', status: 'active' },
  { fromSiteId: 'wh-hq', fromDeviceName: 'WH-Core-01', fromPort: 'Eth1/50', toSiteId: 'nj-branch', toDeviceName: 'NJ-Core-01',   toPort: 'Eth1/49', bandwidth: '10G', status: 'active' },
  { fromSiteId: 'bj-dc', fromDeviceName: 'BJ-Border-01', fromPort: 'Eth1/2', toSiteId: 'nj-branch', toDeviceName: 'NJ-Core-01',  toPort: 'Eth1/50', bandwidth: '10G', status: 'degraded' },
  { fromSiteId: 'wh-hq', fromDeviceName: 'WH-Core-02', fromPort: 'Eth1/51', toSiteId: 'ldn-branch', toDeviceName: 'LDN-OTN-MUX-01', toPort: 'LINE-1', bandwidth: '100G', status: 'active' },
  { fromSiteId: 'bj-dc', fromDeviceName: 'BJ-OTN-01',  fromPort: 'LINE-1',  toSiteId: 'ldn-branch', toDeviceName: 'LDN-OTN-MUX-02', toPort: 'LINE-1', bandwidth: '100G', status: 'active' },
];

export const getIcon = (iconName: string, size = 20, color = 'currentColor') => {
  switch (iconName) {
    case 'Zap': return <Zap size={size} color={color} />;
    case 'Wifi': return <Wifi size={size} color={color} />;
    case 'Network': return <Network size={size} color={color} />;
    case 'Server': return <Server size={size} color={color} />;
    case 'Video': return <Video size={size} color={color} />;
    case 'ShieldCheck': return <ShieldCheck size={size} color={color} />;
    case 'Shield': return <Shield size={size} color={color} />;
    case 'LayoutGrid': return <LayoutGrid size={size} color={color} />;
    case 'Globe': return <Globe size={size} color={color} />;
    case 'Cpu': return <Cpu size={size} color={color} />;
    case 'Layers': return <Layers size={size} color={color} />;
    case 'Share2': return <Share2 size={size} color={color} />;
    case 'Box': return <Box size={size} color={color} />;
    case 'BarChart3': return <BarChart3 size={size} color={color} />;
    case 'Cloud': return <Cloud size={size} color={color} />;
    case 'Radio': return <Radio size={size} color={color} />;
    default: return <Radio size={size} color={color} />;
  }
};

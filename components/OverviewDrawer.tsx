import React, { useState } from 'react';
import { Server, Globe, Wifi, Layers, Search, AlertTriangle, ChevronLeft, ChevronRight, ArrowLeft, MapPin, Activity } from 'lucide-react';
import { Site } from '../types';
import { MOCK_ALARMS, MOCK_DEVICES, SITE_NEIGHBOR_LINKS } from '../constants.tsx';

export interface InterSiteLinkSelection {
  fromSiteId: string;
  toSiteId: string;
  manualLinkIds?: string[]; // 指定具体的手动链路ID，用于精确过滤
}

interface OverviewDrawerProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (id: string | null) => void;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
  selectedLink: { from: string; to: string; fromPort: string; toPort: string; type: string } | null;
  onSelectLink: (link: { from: string; to: string; fromPort: string; toPort: string; type: string } | null) => void;
  selectedSiteNeighborId: string | null;
  onSelectSiteNeighbor: (id: string | null) => void;
  selectedInterSiteLink: InterSiteLinkSelection | null;
  onSelectInterSiteLink: (link: InterSiteLinkSelection | null) => void;
  onDrillDevice?: (siteId: string, deviceName: string) => void;
  onDrillLink?: (fromSiteId: string, fromDeviceName: string, toSiteId: string, toDeviceName: string) => void;
  manualLinks?: { id: string; fromSiteId: string; fromDeviceId: string; fromPort: string; toSiteId: string; toDeviceId: string; toPort: string }[];
}

// ── Link Detail View ──────────────────────────────────────
const LinkDetailView: React.FC<{ link: { from: string; to: string; fromPort: string; toPort: string; type: string }; onBack: () => void; onDeviceClick?: (id: string) => void }> = ({ link, onBack, onDeviceClick }) => {
  const [alarmSearch, setAlarmSearch] = useState('');
  const fromDevice = MOCK_DEVICES.find(d => d.id === link.from);
  const toDevice = MOCK_DEVICES.find(d => d.id === link.to);
  const linkAlarms = MOCK_ALARMS.filter(a => a.status === 'active' && (a.source === (fromDevice?.name || '') || a.source === (toDevice?.name || '')));
  const filteredLinkAlarms = linkAlarms.filter(a => a.message.toLowerCase().includes(alarmSearch.toLowerCase()) || a.source.toLowerCase().includes(alarmSearch.toLowerCase()));

  // Check if this is an aggregated link (multiple physical links between same device pair)
  const memberCount = SITE_NEIGHBOR_LINKS.filter(l =>
    (l.fromDeviceName === (fromDevice?.name || '') && l.toDeviceName === (toDevice?.name || '')) ||
    (l.fromDeviceName === (toDevice?.name || '') && l.toDeviceName === (fromDevice?.name || ''))
  ).length;
  const isAggregated = memberCount > 1;
  const [linkTab, setLinkTab] = useState<'members' | 'alarms'>('members');

  return (
    <div className="w-[200px] flex flex-col h-full overflow-hidden">
      {/* Header: X close */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0 flex justify-end">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">
          <span className="text-[16px] leading-none font-light">×</span>
        </button>
      </div>

      {/* Connectivity between */}
      <div className="px-3 pb-3 border-b border-slate-200 flex-shrink-0 text-center">
        <p className="text-[12px] font-black text-slate-800 mb-2">Connectivity between</p>
        <p className="text-[11px] font-bold text-[#0ABAB5] cursor-pointer hover:underline"
          onClick={() => { if (onDeviceClick && fromDevice) onDeviceClick(fromDevice.id); }}>
          {fromDevice?.name || link.from}
        </p>
        <p className="text-slate-300 text-[14px] leading-tight my-0.5">↕</p>
        <p className="text-[11px] font-bold text-[#0ABAB5] cursor-pointer hover:underline"
          onClick={() => { if (onDeviceClick && toDevice) onDeviceClick(toDevice.id); }}>
          {toDevice?.name || link.to}
        </p>
      </div>

      {/* Time axis */}
      <div className="px-3 pt-2 pb-1 flex-shrink-0 border-b border-slate-200">
        <div className="flex items-end justify-between text-[8px] text-slate-400 mb-1">
          <span>16:45</span><span>16:50</span><span>16:55</span><span>17:00</span><span>17:05</span>
        </div>
        <div className="relative h-1 bg-slate-100 rounded-full">
          <div className="absolute left-0 top-0 h-full bg-slate-300 rounded-full" style={{ width: '60%' }} />
        </div>
      </div>

      {/* Metrics - Arista style */}
      <div className="px-3 flex-shrink-0">
        <div className="border-b border-slate-200 py-2">
          <p className="text-[10px] text-slate-500">Traffic Throughput</p>
          <p className="text-[10px] font-bold text-slate-800 text-right">0 Mbps</p>
        </div>
        <div className="border-b border-slate-200 py-2">
          <p className="text-[10px] text-slate-500">Bandwidth Utilization</p>
          <p className="text-[10px] font-bold text-slate-800 text-right">0.672%</p>
        </div>
        <div className="border-b border-slate-200 py-2">
          <p className="text-[10px] text-slate-500">Discard Rate</p>
          <p className="text-[10px] font-bold text-slate-800 text-right">0 discards/s</p>
        </div>
        <div className="border-b border-slate-200 py-2">
          <p className="text-[10px] text-slate-500">Error Rate</p>
          <p className="text-[10px] font-bold text-slate-800 text-right">0 errors/s</p>
        </div>
        <div className="border-b border-slate-200 py-2">
          <p className="text-[10px] text-slate-500">延迟</p>
          <p className="text-[10px] font-bold text-slate-800 text-right">N/A</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-3 pt-2 flex-shrink-0 border-b border-slate-100">
        <button onClick={() => setLinkTab('members')}
          className={'text-[10px] font-bold pb-1.5 mr-3 border-b-2 transition-colors ' + (linkTab === 'members' ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>
          成员链路
        </button>
        <button onClick={() => setLinkTab('alarms')}
          className={'text-[10px] font-bold pb-1.5 mr-3 border-b-2 transition-colors ' + (linkTab === 'alarms' ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>
          告警列表
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {linkTab === 'members' && (
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-[10px] font-bold text-slate-800">{fromDevice?.name || link.from}</p>
                <p className="text-[9px] text-slate-400">{link.fromPort}</p>
              </div>
              <span className="text-slate-300 text-[12px] mx-1">⟷</span>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-800">{toDevice?.name || link.to}</p>
                <p className="text-[9px] text-slate-400">{link.toPort}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-[10px] font-bold text-slate-800">{fromDevice?.name || link.from}</p>
                <p className="text-[9px] text-slate-400">{link.fromPort.replace(/\/\d+$/, '/2')}</p>
              </div>
              <span className="text-slate-300 text-[12px] mx-1">⟷</span>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-800">{toDevice?.name || link.to}</p>
                <p className="text-[9px] text-slate-400">{link.toPort.replace(/\/\d+$/, '/12')}</p>
              </div>
            </div>
          </div>
        )}
        {linkTab === 'alarms' && (
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2">
              <Search size={10} className="text-slate-400 flex-shrink-0" />
              <input value={alarmSearch} onChange={e => setAlarmSearch(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
            </div>
            <div className="divide-y divide-slate-100">
            {filteredLinkAlarms.length === 0 && <p className="text-[9px] text-slate-400 text-center py-4">暂无告警</p>}
            {filteredLinkAlarms.slice(0, 5).map(a => {
              const isCritical = a.severity === 'critical' || a.severity === 'major';
              return (
                <div key={a.id} className="flex items-start gap-1.5 py-2">
                  {isCritical ? (
                    <div className="flex-shrink-0 w-4 h-4 bg-red-500 rounded flex items-center justify-center mt-0.5">
                      <span className="text-white text-[7px] font-black">!</span>
                    </div>
                  ) : (
                    <span className="text-yellow-500 text-[11px] leading-none mt-0.5 flex-shrink-0">▲</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-700 leading-tight">{a.message}</p>
                    <p className="text-[8px] text-slate-400">{a.time}</p>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Device Detail View ─────────────────────────────────────
const DeviceDetailView: React.FC<{ deviceId: string; onBack: () => void; onLinkClick?: (link: { from: string; to: string; fromPort: string; toPort: string; type: string }) => void; onDeviceClick?: (id: string) => void }> = ({ deviceId, onBack, onLinkClick, onDeviceClick }) => {
  const [devTab, setDevTab] = useState<'neighbors' | 'events'>('neighbors');
  const [neighborSearch, setNeighborSearch] = useState('');
  const [devAlarmSearch, setDevAlarmSearch] = useState('');
  const device = MOCK_DEVICES.find(d => d.id === deviceId);
  if (!device) return <div className="p-4 text-[10px] text-slate-400">Device not found</div>;
  const deviceAlarms = MOCK_ALARMS.filter(a => a.status === 'active' && a.source === device.name);
  const filteredDevAlarms = deviceAlarms.filter(a => a.message.toLowerCase().includes(devAlarmSearch.toLowerCase()) || a.source.toLowerCase().includes(devAlarmSearch.toLowerCase()));
  const neighbors = MOCK_DEVICES.filter(d => d.siteId === device.siteId && d.id !== device.id);
  const filteredNeighbors = neighbors.filter(n => n.name.toLowerCase().includes(neighborSearch.toLowerCase()));

  return (
    <div className="w-[200px] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 flex-shrink-0 flex items-start justify-between">
        <h2 className="text-[16px] font-black text-slate-800 leading-tight">{device.name}</h2>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors ml-1 flex-shrink-0 mt-1">
          <span className="text-[16px] leading-none font-light">×</span>
        </button>
      </div>

      {/* Info rows */}
      <div className="px-3 py-1 border-b border-slate-200 flex-shrink-0">
        <div className="divide-y divide-slate-100">
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">设备名称</span>
            <span className="text-[10px] text-slate-700">{device.name}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">Mode名称</span>
            <span className="text-[10px] text-slate-700">{device.model}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">软件版本</span>
            <span className="text-[10px] text-slate-700">v3.2.1</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">设备MAC</span>
            <span className="text-[10px] text-slate-700">{device.mac}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">设备序列号</span>
            <span className="text-[10px] text-slate-700">JPA22443420</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">设备在线状态</span>
            <span className={'text-[10px] font-bold ' + (device.status === 'online' ? 'text-[#0ABAB5]' : 'text-red-500')}>{device.status === 'online' ? '在线' : '离线'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">设备运行时长</span>
            <span className="text-[10px] text-slate-700">72h 15m</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] text-slate-500">设备管理IP</span>
            <span className="text-[10px] text-slate-700">{device.ip}</span>
          </div>
          <div className="py-1.5">
            <span className="text-[10px] text-slate-500">更多信息</span>
            <div className="flex flex-col items-end gap-0.5 mt-0.5">
              <span className="text-[10px] text-[#0ABAB5] font-bold cursor-pointer hover:underline">Device Overview</span>
              <span className="text-[10px] text-[#0ABAB5] font-bold cursor-pointer hover:underline">View Events</span>
              <span className="text-[10px] text-[#0ABAB5] font-bold cursor-pointer hover:underline">Tags</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-3 pt-2 flex-shrink-0 border-b border-slate-100">
        <button onClick={() => setDevTab('neighbors')}
          className={'text-[10px] font-bold pb-1.5 mr-3 border-b-2 transition-colors ' + (devTab === 'neighbors' ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>
          设备邻居
        </button>
        <button onClick={() => setDevTab('events')}
          className={'text-[10px] font-bold pb-1.5 mr-3 border-b-2 transition-colors ' + (devTab === 'events' ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>
          告警列表
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {devTab === 'neighbors' && (
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2">
              <Search size={10} className="text-slate-400 flex-shrink-0" />
              <input value={neighborSearch} onChange={e => setNeighborSearch(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
            </div>
            <div className="divide-y divide-slate-100">
              {filteredNeighbors.length === 0 && <p className="text-[9px] text-slate-400 text-center py-4">暂无邻居</p>}
              {filteredNeighbors.map(n => (
                <div key={n.id} className="py-2">
                  <p className="text-[10px] font-bold text-slate-800 cursor-pointer hover:text-[#0ABAB5] transition-colors" onClick={() => { if (onDeviceClick) onDeviceClick(n.id); }}>{n.name}</p>
                  <p className="text-[9px] text-[#0ABAB5] cursor-pointer hover:underline mt-0.5"
                    onClick={() => { if (onLinkClick) onLinkClick({ from: device.id, to: n.id, fromPort: 'Eth1/1', toPort: 'Eth1/49', type: 'ethernet' }); }}>
                    View Connectivity
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {devTab === 'events' && (
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2">
              <Search size={10} className="text-slate-400 flex-shrink-0" />
              <input value={devAlarmSearch} onChange={e => setDevAlarmSearch(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
            </div>
            <div className="divide-y divide-slate-100">
            {filteredDevAlarms.length === 0 && <p className="text-[9px] text-slate-400 text-center py-4">暂无告警</p>}
            {filteredDevAlarms.slice(0, 8).map(a => {
              const isCritical = a.severity === 'critical' || a.severity === 'major';
              return (
                <div key={a.id} className="flex items-start gap-1.5 py-2">
                  {isCritical ? (
                    <div className="flex-shrink-0 w-4 h-4 bg-red-500 rounded flex items-center justify-center mt-0.5">
                      <span className="text-white text-[7px] font-black">!</span>
                    </div>
                  ) : (
                    <span className="text-yellow-500 text-[11px] leading-none mt-0.5 flex-shrink-0">▲</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-700 leading-tight">{a.message}</p>
                    <p className="text-[8px] text-slate-400">{a.time}</p>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Site Detail View ──────────────────────────────────────
const SiteDetailView: React.FC<{ site: Site; onBack: () => void; onDeviceClick?: (id: string) => void }> = ({ site, onBack, onDeviceClick }) => {
  const [detailTab, setDetailTab] = useState<'devices' | 'alarms'>('devices');
  const [devSearch, setDevSearch] = useState('');
  const [siteAlarmSearch, setSiteAlarmSearch] = useState('');
  const devices = MOCK_DEVICES.filter(d => d.siteId === site.id);
  const filteredDevices = devices.filter(d => d.name.toLowerCase().includes(devSearch.toLowerCase()) || d.mac.toLowerCase().includes(devSearch.toLowerCase()));
  const siteAlarms = MOCK_ALARMS.filter(a => a.status === 'active');
  const criticalCount = siteAlarms.filter(a => a.severity === 'critical').length;
  const majorCount = siteAlarms.filter(a => a.severity === 'major').length;
  const minorCount = siteAlarms.filter(a => a.severity === 'minor').length;
  const warningCount = siteAlarms.filter(a => a.severity === 'warning' || a.severity === 'info').length;
  const healthColor = site.health >= 90 ? '#0ABAB5' : site.health >= 70 ? '#FADB14' : '#FF4D4F';
  const healthLevel = site.health >= 90 ? '良好' : site.health >= 70 ? '一般' : '差';
  const typeLabel = site.siteType === 'DataCenter' ? 'Data Center' : site.siteType === 'Optical' ? 'Optical' : 'Campus';
  const siteIcon = site.siteType === 'DataCenter' ? <Server size={18} className="text-slate-400" /> : site.siteType === 'Optical' ? <Layers size={18} className="text-slate-400" /> : <Wifi size={18} className="text-slate-400" />;

  return (
    <div className="w-[200px] flex flex-col h-full overflow-hidden">
      {/* Back + site name */}
      {/* Site name header - separate from sections */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#0ABAB5] mb-1.5 transition-colors">
          <ArrowLeft size={10} /> 返回全局
        </button>
        <h2 className="text-[16px] font-black text-slate-800 leading-tight">{site.name}</h2>
        <p className="text-[9px] text-slate-400 mt-0.5">站点内信息概览</p>
      </div>

      {/* Section 1: 站点信息 */}
      <div className="px-3 py-2 border-b border-slate-100 flex-shrink-0">
        <p className="text-[10px] font-bold text-slate-500 mb-2">站点信息</p>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 flex-shrink-0">{siteIcon}</div>
          <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: healthColor }}>
            <span className="text-[9px] font-black" style={{ color: healthColor }}>{site.health}</span>
          </div>
          <span className="text-[18px] font-black" style={{ color: healthColor }}>{healthLevel}</span>
        </div>
        <div>
          <div className="flex justify-between py-1.5"><span className="text-[10px] text-slate-500">站点名称</span><span className="text-[10px] text-slate-700 font-medium">{site.name}</span></div>
          <div className="flex justify-between py-1.5"><span className="text-[10px] text-slate-500">站点类型</span><span className="text-[10px] text-slate-700 font-medium">{typeLabel}</span></div>
          <div className="flex justify-between py-1.5"><span className="text-[10px] text-slate-500">站点位置</span><span className="text-[10px] text-slate-700 font-medium text-right max-w-[100px]">{site.location}</span></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-bold text-slate-400">更多信息</span>
          <span className="text-[10px] font-bold text-[#0ABAB5] cursor-pointer hover:underline">Enter Site →</span>
        </div>
      </div>

      {/* Section 2: 设备信息 */}
      <div className="px-3 py-2 border-b border-slate-100 flex-shrink-0">
        <p className="text-[10px] font-bold text-slate-500 mb-2">设备信息</p>
        <div className="flex items-center justify-between py-1"><div className="flex items-center gap-1.5"><Server size={10} className="text-slate-400" /><span className="text-[10px] text-slate-600">设备总数</span></div><span className="text-[10px] font-bold text-slate-800">{devices.length}</span></div>
        {site.siteType === 'DataCenter' ? (
          <div className="ml-4 mt-1 space-y-0.5">
            {[{role: 'Spine', label: 'Spine'}, {role: 'Leaf', label: 'Leaf'}, {role: 'Border', label: 'Border Leaf'}, {role: 'Optical', label: 'Server'}].map(r => {
              const count = devices.filter(d => d.role === r.role).length;
              return count > 0 ? <div key={r.role} className="flex justify-between py-0.5"><span className="text-[9px] text-slate-400">{r.label}</span><span className="text-[9px] font-medium text-slate-600">{count}</span></div> : null;
            })}
          </div>
        ) : (
          <div className="ml-4 mt-1 space-y-0.5">
            {[{role: 'Core', label: 'Core'}, {role: 'Aggregation', label: 'Aggregation'}, {role: 'Access', label: 'Access'}, {role: 'AP', label: 'AP'}, {role: 'Camera', label: 'Client'}].map(r => {
              const count = devices.filter(d => d.role === r.role).length;
              return count > 0 ? <div key={r.role} className="flex justify-between py-0.5"><span className="text-[9px] text-slate-400">{r.label}</span><span className="text-[9px] font-medium text-slate-600">{count}</span></div> : null;
            })}
          </div>
        )}
      </div>

      {/* Section 3: 告警信息 */}
      <div className="px-3 py-2 border-b border-slate-100 flex-shrink-0">
        <p className="text-[10px] font-bold text-slate-500 mb-2">告警信息</p>
        <div className="flex justify-between py-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-500 rounded text-white text-[7px] font-black text-center leading-3">!</span>严重告警</span><span className="text-[10px] font-bold text-red-500">{criticalCount}</span></div>
        <div className="flex justify-between py-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="inline-block w-3 h-3 bg-orange-500 rounded text-white text-[7px] font-black text-center leading-3">!</span>重要告警</span><span className="text-[10px] font-bold text-orange-500">{majorCount}</span></div>
        <div className="flex justify-between py-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="inline-block text-[10px] text-yellow-500 leading-none">▲</span>一般告警</span><span className="text-[10px] font-bold text-blue-500">{minorCount}</span></div>
        <div className="flex justify-between py-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="inline-block text-[10px] text-slate-400 leading-none">ℹ</span>提示告警</span><span className="text-[10px] font-bold text-slate-600">{warningCount}</span></div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-3 pt-2 flex-shrink-0 border-b border-slate-100">
        {(['devices', 'alarms'] as const).map(t => (
          <button key={t} onClick={() => setDetailTab(t)}
            className={'text-[10px] font-bold pb-1.5 mr-3 border-b-2 transition-colors ' + (detailTab === t ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>
            {t === 'devices' ? '设备列表' : '告警列表'}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {detailTab === 'devices' && (
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2">
              <Search size={10} className="text-slate-400 flex-shrink-0" />
              <input value={devSearch} onChange={e => setDevSearch(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
            </div>
            <div className="divide-y divide-slate-100">
              {filteredDevices.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">暂无设备</p>}
              {filteredDevices.map(d => {
                const roleIcon = d.role === 'Core' || d.role === 'Spine' ? '◆' : d.role === 'Aggregation' || d.role === 'Leaf' ? '▲' : d.role === 'AP' ? '◉' : d.role === 'Camera' ? '◐' : d.role === 'OTN' || d.role === 'Optical' ? '◎' : '●';
                const roleColor = d.role === 'Core' || d.role === 'Spine' ? '#0ABAB5' : d.role === 'Aggregation' || d.role === 'Leaf' ? '#6366f1' : d.role === 'AP' ? '#22c55e' : d.role === 'Camera' ? '#ef4444' : d.role === 'OTN' || d.role === 'Optical' ? '#f59e0b' : '#94a3b8';
                return (
                  <div key={d.id} className="flex items-center gap-2.5 py-2.5 cursor-pointer hover:bg-slate-50 rounded transition-colors" onClick={() => onDeviceClick?.(d.id)}>
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><span style={{ color: roleColor, fontSize: 14 }}>{roleIcon}</span></div>
                    <div className="min-w-0"><p className="text-[10px] font-bold text-slate-800 truncate">{d.name}</p><p className="text-[9px] text-slate-400 mt-0.5">{d.mac}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {detailTab === 'alarms' && (
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2">
              <Search size={10} className="text-slate-400 flex-shrink-0" />
              <input value={siteAlarmSearch} onChange={e => setSiteAlarmSearch(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
            </div>
            <div className="divide-y divide-slate-100">
            {siteAlarms.filter(a => a.source.toLowerCase().includes(siteAlarmSearch.toLowerCase()) || a.message.toLowerCase().includes(siteAlarmSearch.toLowerCase())).length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">暂无告警</p>}
            {siteAlarms.filter(a => a.source.toLowerCase().includes(siteAlarmSearch.toLowerCase()) || a.message.toLowerCase().includes(siteAlarmSearch.toLowerCase())).slice(0, 10).map(a => {
              const isCritical = a.severity === 'critical' || a.severity === 'major';
              return (
                <div key={a.id} className="flex items-start gap-2 py-2.5">
                  {isCritical ? (<div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded flex items-center justify-center mt-0.5"><span className="text-white text-[9px] font-black">!</span></div>) : (<div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5"><span className="text-yellow-500 text-[14px] leading-none">▲</span></div>)}
                  <div className="min-w-0"><p className="text-[10px] font-bold text-slate-800 truncate">{a.source}</p><p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{a.message}</p><p className="text-[8px] text-slate-400 mt-0.5">{a.time}</p></div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Site Inter-View (neighbors + link members) ──────────
const SiteInterView: React.FC<{
  site: Site | null;
  interSiteLink: InterSiteLinkSelection | null;
  sites: Site[];
  onBack: () => void;
  defaultTab?: 'members' | 'neighbors';
  onDrillDevice?: (siteId: string, deviceName: string) => void;
  onDrillLink?: (fromSiteId: string, fromDeviceName: string, toSiteId: string, toDeviceName: string) => void;
  manualLinks?: { id: string; fromSiteId: string; fromDeviceId: string; fromPort: string; toSiteId: string; toDeviceId: string; toPort: string }[];
  onSelectNeighbor?: (siteId: string) => void;
}> = ({ site, interSiteLink, sites, onBack, defaultTab = 'neighbors', onDrillDevice, onDrillLink, manualLinks = [], onSelectNeighbor }) => {
  const [tab, setTab] = useState<'members' | 'neighbors'>(defaultTab);

  // Determine the site for header display
  const displaySite = site || (interSiteLink ? sites.find(s => s.id === interSiteLink.fromSiteId) : null);
  const typeLabel = displaySite?.siteType === 'DataCenter' ? 'Datacenter' : displaySite?.siteType === 'Optical' ? 'Optical' : 'Campus';

  // Convert manual links to SiteNeighborLink format (with id for filtering)
  const manualAsNeighborLinks = manualLinks.map(ml => {
    const fromDev = MOCK_DEVICES.find(d => d.id === ml.fromDeviceId);
    const toDev = MOCK_DEVICES.find(d => d.id === ml.toDeviceId);
    return {
      _id: ml.id,
      fromSiteId: ml.fromSiteId,
      fromDeviceName: fromDev?.name || ml.fromDeviceId,
      fromPort: ml.fromPort,
      toSiteId: ml.toSiteId,
      toDeviceName: toDev?.name || ml.toDeviceId,
      toPort: ml.toPort,
      bandwidth: '—',
      status: 'active' as const,
    };
  });

  // Members: inter-site device links for the selected link or for the site's all links
  const allNeighborLinks = [...SITE_NEIGHBOR_LINKS.map(l => ({ ...l, _id: '' })), ...manualAsNeighborLinks];
  let memberLinks: typeof allNeighborLinks;
  if (interSiteLink && interSiteLink.manualLinkIds && interSiteLink.manualLinkIds.length > 0) {
    // 展开态点击具体设备对聚合线：只显示指定的手动链路
    const idSet = new Set(interSiteLink.manualLinkIds);
    memberLinks = manualAsNeighborLinks.filter(l => idSet.has(l._id));
  } else if (interSiteLink) {
    // 折叠态点击站点对聚合线：显示该站点对的所有链路
    memberLinks = allNeighborLinks.filter(l =>
      (l.fromSiteId === interSiteLink.fromSiteId && l.toSiteId === interSiteLink.toSiteId) ||
      (l.fromSiteId === interSiteLink.toSiteId && l.toSiteId === interSiteLink.fromSiteId));
  } else if (site) {
    memberLinks = allNeighborLinks.filter(l => l.fromSiteId === site.id || l.toSiteId === site.id);
  } else {
    memberLinks = [];
  }

  // Neighbors: unique neighbor sites
  const targetSiteId = site?.id || interSiteLink?.fromSiteId;
  const neighborMap = new Map<string, { siteId: string; siteName: string; linkCount: number; degradedCount: number }>();
  if (targetSiteId) {
    SITE_NEIGHBOR_LINKS.forEach(l => {
      let nId: string | null = null;
      if (l.fromSiteId === targetSiteId) nId = l.toSiteId;
      else if (l.toSiteId === targetSiteId) nId = l.fromSiteId;
      if (!nId) return;
      if (!neighborMap.has(nId)) {
        const ns = sites.find(s => s.id === nId);
        neighborMap.set(nId, { siteId: nId, siteName: ns?.name || nId, linkCount: 0, degradedCount: 0 });
      }
      const e = neighborMap.get(nId)!;
      e.linkCount++;
      if (l.status === 'degraded') e.degradedCount++;
    });
  }
  const neighbors = Array.from(neighborMap.values());

  // Header text
  const headerTitle = interSiteLink && !site
    ? 'Selected Link'
    : 'Site';
  const headerName = interSiteLink && !site
    ? `${sites.find(s => s.id === interSiteLink.fromSiteId)?.name || ''} ⟷ ${sites.find(s => s.id === interSiteLink.toSiteId)?.name || ''}`
    : displaySite?.name || '';

  return (
    <div className="w-[200px] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-1">
          <h2 className="text-[13px] font-black text-slate-800 leading-snug">{interSiteLink && !site ? 'Selected Link' : 'Site'}</h2>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5">
            <span className="text-[16px] leading-none font-light">×</span>
          </button>
        </div>
        {displaySite && !interSiteLink && (
          <p className="text-[10px] text-slate-500 mt-1">
            <span className="text-slate-400">Current Site:</span>{' '}
            <span className="font-medium text-slate-700">{displaySite.name}</span>
          </p>
        )}
        {interSiteLink && !site && (
          <p className="text-[10px] text-slate-500 mt-1">
            <span className="font-medium text-slate-700">
              {sites.find(s => s.id === interSiteLink.fromSiteId)?.name} ⟷ {sites.find(s => s.id === interSiteLink.toSiteId)?.name}
            </span>
          </p>
        )}
      </div>

      {/* Tabs: Members | Neighbors (hide Neighbors when viewing a selected link) */}
      {interSiteLink && !site ? (
        <div className="px-3 pt-2 pb-1.5 flex-shrink-0 border-b border-slate-200">
          <span className="text-[10px] font-bold text-[#2563eb] border-b-2 border-[#2563eb] pb-1.5">Members</span>
        </div>
      ) : (
        <div className="flex items-center gap-0 px-3 pt-2 flex-shrink-0 border-b border-slate-200">
          <button onClick={() => setTab('neighbors')}
            className={'text-[10px] font-bold pb-1.5 mr-4 border-b-2 transition-colors ' + (tab === 'neighbors' ? 'text-[#2563eb] border-[#2563eb]' : 'text-slate-400 border-transparent hover:text-slate-600')}>
            Neighbors
          </button>
          <button onClick={() => setTab('members')}
            className={'text-[10px] font-bold pb-1.5 mr-4 border-b-2 transition-colors ' + (tab === 'members' ? 'text-[#2563eb] border-[#2563eb]' : 'text-slate-400 border-transparent hover:text-slate-600')}>
            Members
          </button>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {(tab === 'members' || (interSiteLink && !site)) && (
          <div className="divide-y divide-slate-100">
            {memberLinks.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">No connections</p>}
            {memberLinks.map((l, i) => {
              const refSiteId = site?.id || interSiteLink?.fromSiteId;
              const isFrom = l.fromSiteId === refSiteId;
              const dev1 = isFrom ? l.fromDeviceName : l.toDeviceName;
              const dev1SiteId = isFrom ? l.fromSiteId : l.toSiteId;
              const dev2 = isFrom ? l.toDeviceName : l.fromDeviceName;
              const dev2SiteId = isFrom ? l.toSiteId : l.fromSiteId;
              const isLinkMode = !!(interSiteLink && !site);
              return (
                <div key={i} className={'flex items-center gap-2.5 py-3' + (isLinkMode ? ' cursor-pointer hover:bg-slate-50 rounded transition-colors' : '')}
                  onClick={isLinkMode ? () => onDrillLink?.(l.fromSiteId, l.fromDeviceName, l.toSiteId, l.toDeviceName) : undefined}>
                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-400 text-[10px]">⟷</span>
                  </div>
                  <div className="min-w-0">
                    {isLinkMode ? (
                      <>
                        <p className="text-[11px] font-bold text-[#0ABAB5] truncate">{dev1}</p>
                        <p className="text-[11px] font-bold text-[#0ABAB5] mt-0.5 truncate">{dev2}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-bold text-[#0ABAB5] truncate cursor-pointer hover:underline" onClick={() => onDrillDevice?.(dev1SiteId, dev1)}>{dev1}</p>
                        <p className="text-[11px] font-bold text-[#0ABAB5] mt-0.5 truncate cursor-pointer hover:underline" onClick={() => onDrillDevice?.(dev2SiteId, dev2)}>{dev2}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'neighbors' && !(interSiteLink && !site) && (
          <div className="divide-y divide-slate-100">
            {neighbors.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">No neighbors</p>}
            {neighbors.map(n => {
              const ns = sites.find(s => s.id === n.siteId);
              const nType = ns?.siteType === 'DataCenter' ? 'Datacenter' : ns?.siteType === 'Optical' ? 'Optical' : 'Campus';
              const statusColor = n.degradedCount > 0 ? '#f59e0b' : '#10b981';
              return (
                <div key={n.siteId} className="py-3 cursor-pointer hover:bg-slate-50 rounded transition-colors" onClick={() => onSelectNeighbor?.(n.siteId)}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
                    <p className="text-[11px] font-bold text-slate-800 truncate">{n.siteName}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3.5 mt-0.5">
                    <span className="text-[9px] text-slate-400">{nType}</span>
                    <span className="text-[9px] text-slate-300">·</span>
                    <span className="text-[9px] text-slate-400">{n.linkCount} links</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Global Overview View ──────────────────────────────────
export const OverviewDrawer: React.FC<OverviewDrawerProps> = ({ sites, selectedSiteId, onSelectSite, selectedDeviceId, onSelectDevice, selectedLink, onSelectLink, selectedSiteNeighborId, onSelectSiteNeighbor, selectedInterSiteLink, onSelectInterSiteLink, onDrillDevice, onDrillLink, manualLinks }) => {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'sites' | 'alarms'>('sites');
  const [query, setQuery] = useState('');
  const [globalAlarmSearch, setGlobalAlarmSearch] = useState('');

  const selectedSite = sites.find(s => s.id === selectedSiteId) ?? null;

  const totalDevices = sites.reduce((a, s) => a + s.deviceCount, 0);
  const dcCount = sites.filter(s => s.siteType === 'DataCenter').length;
  const campusCount = sites.filter(s => s.siteType === 'Campus').length;
  const opticalCount = sites.filter(s => s.siteType === 'Optical').length;
  const filtered = sites.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  const alarms = MOCK_ALARMS.filter(a => a.status === 'active');

  return (
    <div className="flex flex-row flex-shrink-0 h-full">
      <div
        className="border-r border-slate-100 bg-white flex flex-col overflow-hidden transition-all duration-300"
        style={{ width: open ? 200 : 0 }}
      >
        {open && (
          selectedLink
            ? <LinkDetailView link={selectedLink} onBack={() => onSelectLink(null)} onDeviceClick={(id) => { onSelectLink(null); onSelectDevice(id); }} />
            : selectedDeviceId
            ? <DeviceDetailView deviceId={selectedDeviceId} onBack={() => onSelectDevice(null)} onLinkClick={(l) => { onSelectDevice(null); onSelectLink(l); }} onDeviceClick={(id) => onSelectDevice(id)} />
            : selectedSite
            ? <SiteDetailView site={selectedSite} onBack={() => onSelectSite(null)} onDeviceClick={(id) => { onSelectSite(null); onSelectDevice(id); }} />
            : selectedInterSiteLink
            ? <SiteInterView site={null} interSiteLink={selectedInterSiteLink} sites={sites} defaultTab="members" onBack={() => onSelectInterSiteLink(null)} onDrillDevice={onDrillDevice} onDrillLink={onDrillLink} manualLinks={manualLinks} onSelectNeighbor={(id) => { onSelectSiteNeighbor(id); onSelectInterSiteLink(null); }} />
            : selectedSiteNeighborId && sites.find(s => s.id === selectedSiteNeighborId)
            ? <SiteInterView site={sites.find(s => s.id === selectedSiteNeighborId)!} interSiteLink={null} sites={sites} defaultTab="neighbors" onBack={() => onSelectSiteNeighbor(null)} onDrillDevice={onDrillDevice} onDrillLink={onDrillLink} manualLinks={manualLinks} onSelectNeighbor={(id) => onSelectSiteNeighbor(id)} />
            : (
              <div className="w-[200px] flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-2 border-b border-slate-100 flex-shrink-0">
                  <h2 className="text-[14px] font-black text-slate-800">Overview</h2>
                  <p className="text-[9px] text-slate-400 mt-0.5">站点信息概览</p>
                </div>

                {/* 全局健康度 */}
                <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                  <p className="text-[10px] font-bold text-slate-500 mb-3">全局健康度</p>
                  {[
                    { icon: <Server size={22} className="text-slate-400" />, score: 100 },
                    { icon: <Wifi size={22} className="text-slate-400" />, score: 100 },
                    { icon: <Layers size={22} className="text-slate-400" />, score: 100 },
                  ].map((item, i) => {
                    const color = item.score >= 90 ? '#0ABAB5' : item.score >= 70 ? '#FADB14' : '#FF4D4F';
                    const level = item.score >= 90 ? '良好' : item.score >= 70 ? '一般' : '差';
                    return (
                      <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100">{item.icon}</div>
                        <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}>
                          <span className="text-[10px] font-black" style={{ color }}>{item.score}</span>
                        </div>
                        <span className="text-[18px] font-black" style={{ color }}>{level}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 关键指标 */}
                <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                  <p className="text-[10px] font-bold text-slate-500 mb-2">关键指标</p>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1.5"><Globe size={11} className="text-slate-400" /><span className="text-[11px] text-slate-600">站点总数</span></div>
                    <span className="text-[11px] font-bold text-slate-800">{sites.length}</span>
                  </div>
                  <div className="py-1">
                    <div className="flex items-center gap-1.5 mb-1.5"><Layers size={11} className="text-slate-400" /><span className="text-[11px] text-slate-600">站点类型</span></div>
                    <div className="ml-3 space-y-1.5">
                      {[{ label: 'Data Center', count: dcCount, color: '#6366f1' }, { label: 'Campus', count: campusCount, color: '#0ABAB5' }, { label: '光传输', count: opticalCount, color: '#f59e0b' }].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[10px] text-slate-500">{item.label}</span>
                            <span className="text-[10px] font-bold text-slate-700">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: (item.count / Math.max(sites.length, 1) * 100) + '%', backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1 mt-1">
                    <div className="flex items-center gap-1.5"><Server size={11} className="text-slate-400" /><span className="text-[11px] text-slate-600">设备总数</span></div>
                    <span className="text-[11px] font-bold text-slate-800">{totalDevices}</span>
                  </div>
                </div>

                {/* 站点列表 / 告警列表 */}
                <div className="flex-1 flex flex-col px-4 py-3 min-h-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <button onClick={() => setTab('sites')} className={'text-[10px] font-bold pb-1 border-b-2 transition-colors ' + (tab === 'sites' ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>站点列表</button>
                    <button onClick={() => setTab('alarms')} className={'text-[10px] font-bold pb-1 border-b-2 transition-colors ' + (tab === 'alarms' ? 'text-[#0ABAB5] border-[#0ABAB5]' : 'text-slate-400 border-transparent')}>告警列表</button>
                  </div>

                  {tab === 'sites' && (
                    <>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2 flex-shrink-0">
                        <Search size={10} className="text-slate-400 flex-shrink-0" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                        {filtered.map(s => {
                          const typeLabel = s.siteType === 'DataCenter' ? 'Data Center' : s.siteType === 'Optical' ? 'Optical' : 'Campus';
                          const isSelected = selectedSiteId === s.id;
                          return (
                            <div key={s.id} onClick={() => onSelectSite(s.id)}
                              className={'py-2 px-2 cursor-pointer transition-colors ' + (isSelected ? 'bg-[#0ABAB5]/10' : 'hover:bg-slate-50')}>
                              <div className="flex items-center gap-1">
                                {isSelected && <span className="text-[#0ABAB5] text-[9px] flex-shrink-0">▶</span>}
                                <p className={'text-[11px] font-bold truncate ' + (isSelected ? 'text-[#0ABAB5]' : 'text-slate-800')}>{s.name}</p>
                              </div>
                              <p className="text-[9px] text-slate-400 mt-0.5">{'Site Type: ' + typeLabel}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {tab === 'alarms' && (
                    <>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2 flex-shrink-0">
                        <Search size={10} className="text-slate-400 flex-shrink-0" />
                        <input value={globalAlarmSearch} onChange={e => setGlobalAlarmSearch(e.target.value)} placeholder="搜索" className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0" />
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                      {alarms.filter(a => a.source.toLowerCase().includes(globalAlarmSearch.toLowerCase()) || a.message.toLowerCase().includes(globalAlarmSearch.toLowerCase())).slice(0, 10).map(a => {
                        const isCritical = a.severity === 'critical' || a.severity === 'major';
                        return (
                          <div key={a.id} className="flex items-start gap-2 py-2.5">
                            {isCritical ? (
                              <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded flex items-center justify-center mt-0.5">
                                <span className="text-white text-[9px] font-black">!</span>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                                <span className="text-yellow-500 text-[14px] leading-none">▲</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-800 truncate">{a.source}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{a.message}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">{a.time}</p>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
        )}
      </div>

      <button onClick={() => setOpen(o => !o)} className="w-4 bg-white border-r border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
        {open ? <ChevronLeft size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
      </button>
    </div>
  );
};

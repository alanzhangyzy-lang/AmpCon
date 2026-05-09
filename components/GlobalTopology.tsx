
import React, { useState, useMemo } from 'react';
// Added missing Layers import
import { Maximize2, ZoomIn, ZoomOut, Info, Zap, Server, Network, Wifi, Activity, Cpu, Globe, Layers, ChevronLeft, ChevronRight, Search, AlertTriangle, Plus, X, Check } from 'lucide-react';
import { Site, Device } from '../types';
import { MOCK_DEVICES, MOCK_SITES, MOCK_ALARMS } from '../constants.tsx';
import DeviceDetailDrawer from './DeviceDetailDrawer';

interface GlobalTopologyProps {
  site: Site;
}

interface PhysicalLink {
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
  type: 'fiber' | 'ethernet';
  isManual?: boolean; // 标记手动添加的连线
}

const GlobalTopology: React.FC<GlobalTopologyProps> = ({ site }) => {
  const [zoom, setZoom] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [hoveredLink, setHoveredLink] = useState<PhysicalLink | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [overviewTab, setOverviewTab] = useState<'sites' | 'alarms'>('sites');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 手动添加连线相关状态
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkStartDevice, setLinkStartDevice] = useState<Device | null>(null);
  const [manualLinks, setManualLinks] = useState<PhysicalLink[]>([]);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<PhysicalLink>>({});

  const devices = useMemo(() => MOCK_DEVICES.filter(d => d.siteId === site.id), [site.id]);

  // Overview stats
  const totalDevices = useMemo(() => MOCK_SITES.reduce((a, s) => a + s.deviceCount, 0), []);
  const dcCount = useMemo(() => MOCK_SITES.filter(s => s.siteType === 'DataCenter').length, []);
  const campusCount = useMemo(() => MOCK_SITES.filter(s => s.siteType === 'Campus').length, []);
  const filteredSites = useMemo(() =>
    MOCK_SITES.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const activeAlarms = useMemo(() => MOCK_ALARMS.filter(a => a.status === 'active'), []);

  const topologyData = useMemo(() => {
    const data: { nodes: any[], links: PhysicalLink[] } = { nodes: [], links: [] };

    if (site.id === 'wh-hq') {
      // Classic 3-tier campus: Core(top) → Agg(mid) → Access(lower) → AP/Camera(bottom)
      data.nodes = [
        // Core layer
        { device: devices.find(d => d.id === 'sw-f-01'), x: 350, y: 60 },
        { device: devices.find(d => d.id === 'sw-f-02'), x: 550, y: 60 },
        // Aggregation layer
        { device: devices.find(d => d.id === 'sw-f-03'), x: 300, y: 200 },
        { device: devices.find(d => d.id === 'sw-f-04'), x: 600, y: 200 },
        // Access layer
        { device: devices.find(d => d.id === 'sw-f-05'), x: 220, y: 340 },
        { device: devices.find(d => d.id === 'sw-f-06'), x: 680, y: 340 },
        // APs
        { device: devices.find(d => d.id === 'ap-wh-01'), x: 120, y: 470 },
        { device: devices.find(d => d.id === 'ap-wh-02'), x: 280, y: 470 },
        { device: devices.find(d => d.id === 'ap-wh-03'), x: 580, y: 470 },
        // Cameras
        { device: devices.find(d => d.id === 'cam-wh-01'), x: 720, y: 470 },
        { device: devices.find(d => d.id === 'cam-wh-02'), x: 840, y: 470 },
      ].filter(n => n.device);

      data.links = [
        // Core ↔ Core (redundancy)
        { from: 'sw-f-01', to: 'sw-f-02', fromPort: 'QSFP28-1', toPort: 'QSFP28-1', type: 'fiber' },
        // Core → Agg (full mesh)
        { from: 'sw-f-01', to: 'sw-f-03', fromPort: 'QSFP28-2', toPort: 'QSFP28-1', type: 'fiber' },
        { from: 'sw-f-01', to: 'sw-f-04', fromPort: 'QSFP28-3', toPort: 'QSFP28-1', type: 'fiber' },
        { from: 'sw-f-02', to: 'sw-f-03', fromPort: 'QSFP28-2', toPort: 'QSFP28-2', type: 'fiber' },
        { from: 'sw-f-02', to: 'sw-f-04', fromPort: 'QSFP28-3', toPort: 'QSFP28-2', type: 'fiber' },
        // Agg → Access
        { from: 'sw-f-03', to: 'sw-f-05', fromPort: 'Te1/0/1', toPort: 'Te1/0/49', type: 'fiber' },
        { from: 'sw-f-04', to: 'sw-f-06', fromPort: 'Te1/0/1', toPort: 'Te1/0/49', type: 'fiber' },
        // Access → APs
        { from: 'sw-f-05', to: 'ap-wh-01', fromPort: 'Gi1/0/1', toPort: 'PoE', type: 'ethernet' },
        { from: 'sw-f-05', to: 'ap-wh-02', fromPort: 'Gi1/0/2', toPort: 'PoE', type: 'ethernet' },
        { from: 'sw-f-06', to: 'ap-wh-03', fromPort: 'Gi1/0/1', toPort: 'PoE', type: 'ethernet' },
        // Access → Cameras
        { from: 'sw-f-06', to: 'cam-wh-01', fromPort: 'Gi1/0/5', toPort: 'PoE', type: 'ethernet' },
        { from: 'sw-f-06', to: 'cam-wh-02', fromPort: 'Gi1/0/6', toPort: 'PoE', type: 'ethernet' },
      ];
    } else if (site.id === 'bj-dc') {
      // Spine-Leaf DC topology
      data.nodes = [
        // Spine layer
        { device: devices.find(d => d.id === 'spine-01'), x: 180, y: 60 },
        { device: devices.find(d => d.id === 'spine-02'), x: 380, y: 60 },
        { device: devices.find(d => d.id === 'spine-03'), x: 580, y: 60 },
        { device: devices.find(d => d.id === 'spine-04'), x: 780, y: 60 },
        // Leaf layer (show first 6)
        { device: devices.find(d => d.id === 'leaf-01'), x: 100, y: 220 },
        { device: devices.find(d => d.id === 'leaf-02'), x: 250, y: 220 },
        { device: devices.find(d => d.id === 'leaf-03'), x: 400, y: 220 },
        { device: devices.find(d => d.id === 'leaf-04'), x: 550, y: 220 },
        { device: devices.find(d => d.id === 'leaf-05'), x: 700, y: 220 },
        { device: devices.find(d => d.id === 'leaf-06'), x: 850, y: 220 },
        // Border
        { device: devices.find(d => d.id === 'border-01'), x: 300, y: 370 },
        { device: devices.find(d => d.id === 'border-02'), x: 660, y: 370 },
      ].filter(n => n.device);

      data.links = [
        // Spine ↔ Leaf (partial mesh for readability)
        { from: 'spine-01', to: 'leaf-01', fromPort: 'Eth1/1', toPort: 'Eth1/49', type: 'fiber' },
        { from: 'spine-01', to: 'leaf-02', fromPort: 'Eth1/2', toPort: 'Eth1/49', type: 'fiber' },
        { from: 'spine-01', to: 'leaf-03', fromPort: 'Eth1/3', toPort: 'Eth1/49', type: 'fiber' },
        { from: 'spine-02', to: 'leaf-02', fromPort: 'Eth1/1', toPort: 'Eth1/50', type: 'fiber' },
        { from: 'spine-02', to: 'leaf-03', fromPort: 'Eth1/2', toPort: 'Eth1/50', type: 'fiber' },
        { from: 'spine-02', to: 'leaf-04', fromPort: 'Eth1/3', toPort: 'Eth1/49', type: 'fiber' },
        { from: 'spine-03', to: 'leaf-04', fromPort: 'Eth1/1', toPort: 'Eth1/50', type: 'fiber' },
        { from: 'spine-03', to: 'leaf-05', fromPort: 'Eth1/2', toPort: 'Eth1/49', type: 'fiber' },
        { from: 'spine-03', to: 'leaf-06', fromPort: 'Eth1/3', toPort: 'Eth1/49', type: 'fiber' },
        { from: 'spine-04', to: 'leaf-05', fromPort: 'Eth1/1', toPort: 'Eth1/50', type: 'fiber' },
        { from: 'spine-04', to: 'leaf-06', fromPort: 'Eth1/2', toPort: 'Eth1/50', type: 'fiber' },
        { from: 'spine-04', to: 'leaf-01', fromPort: 'Eth1/3', toPort: 'Eth1/50', type: 'fiber' },
        // Border connections
        { from: 'leaf-01', to: 'border-01', fromPort: 'Eth1/47', toPort: 'Eth1/1', type: 'fiber' },
        { from: 'leaf-06', to: 'border-02', fromPort: 'Eth1/47', toPort: 'Eth1/1', type: 'fiber' },
        // Optical connections
        { from: 'border-01', to: 'optical-01', fromPort: 'Line-1', toPort: 'WDM-1', type: 'fiber' },
        { from: 'border-02', to: 'optical-02', fromPort: 'Line-1', toPort: 'WDM-1', type: 'fiber' },
      ];
    } else if (site.id === 'nj-branch') {
      // Simple campus: Core → Access → APs
      data.nodes = [
        { device: devices.find(d => d.id === 'sw-01'), x: 600, y: 100 },
        { device: devices.find(d => d.id === 'sw-02'), x: 300, y: 300 },
        { device: devices.find(d => d.id === 'sw-03'), x: 600, y: 300 },
        { device: devices.find(d => d.id === 'sw-04'), x: 900, y: 300 },
        { device: devices.find(d => d.id === 'ap-01'), x: 200, y: 520 },
        { device: devices.find(d => d.id === 'ap-02'), x: 450, y: 520 },
        { device: devices.find(d => d.id === 'ap-03'), x: 900, y: 520 },
      ].filter(n => n.device);

      data.links = [
        { from: 'sw-01', to: 'sw-02', fromPort: 'Te1/0/1', toPort: 'Te1/0/49', type: 'fiber' },
        { from: 'sw-01', to: 'sw-03', fromPort: 'Te1/0/2', toPort: 'Te1/0/49', type: 'fiber' },
        { from: 'sw-01', to: 'sw-04', fromPort: 'Te1/0/3', toPort: 'Te1/0/49', type: 'fiber' },
        { from: 'sw-02', to: 'ap-01', fromPort: 'Gi1/0/1', toPort: 'PoE', type: 'ethernet' },
        { from: 'sw-03', to: 'ap-02', fromPort: 'Gi1/0/1', toPort: 'PoE', type: 'ethernet' },
        { from: 'sw-04', to: 'ap-03', fromPort: 'Gi1/0/1', toPort: 'PoE', type: 'ethernet' },
      ];
    } else {
      data.nodes = devices.map((d, i) => ({ device: d, x: 200 + i * 200, y: 300 }));
    }
    return data;
  }, [site.id, devices]);

  return (
    <div className="h-full flex flex-row relative bg-white animate-in fade-in duration-500 overflow-hidden">

      {/* ── Overview Drawer ── */}
      <div
        className="flex-shrink-0 border-r border-slate-100 bg-white flex flex-col transition-all duration-300 overflow-hidden"
        style={{ width: drawerOpen ? 200 : 0 }}
      >
        {drawerOpen && (
          <div className="w-[200px] flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-black text-slate-800">Overview</h2>
                  <p className="text-[9px] text-slate-400 mt-0.5">站点生命周期管理与监控</p>
                </div>
              </div>
            </div>

            {/* 全局健康度 */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 mb-2">全局健康度</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Server size={16} className="text-slate-500" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#0ABAB5] flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-black text-[#0ABAB5]">100</span>
                </div>
                <span className="text-[16px] font-black text-[#0ABAB5]">良好</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wifi size={16} className="text-slate-500" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#0ABAB5] flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-black text-[#0ABAB5]">100</span>
                </div>
                <span className="text-[16px] font-black text-[#0ABAB5]">良好</span>
              </div>
            </div>

            {/* 关键指标 */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 mb-2">关键指标</p>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600">站点总数</span>
                </div>
                <span className="text-[11px] font-bold text-slate-800">{MOCK_SITES.length}</span>
              </div>
              <div className="py-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Layers size={12} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600">站点类型</span>
                </div>
                <div className="ml-4 space-y-1.5">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-slate-500">Data Center</span>
                      <span className="text-[10px] font-bold text-slate-700">{dcCount}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0ABAB5] rounded-full" style={{ width: (dcCount / MOCK_SITES.length * 100) + '%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-slate-500">Campus</span>
                      <span className="text-[10px] font-bold text-slate-700">{campusCount}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0ABAB5] rounded-full" style={{ width: (campusCount / MOCK_SITES.length * 100) + '%' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <Server size={12} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600">设备总数</span>
                </div>
                <span className="text-[11px] font-bold text-slate-800">{totalDevices}</span>
              </div>
            </div>

            {/* 站点列表 / 告警列表 */}
            <div className="flex-1 flex flex-col px-4 py-3 min-h-0">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setOverviewTab('sites')}
                  className={`text-[11px] font-bold pb-1 border-b-2 transition-colors ${overviewTab === 'sites' ? 'text-slate-800 border-slate-800' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  站点列表
                </button>
                <button
                  onClick={() => setOverviewTab('alarms')}
                  className={`text-[11px] font-bold pb-1 border-b-2 transition-colors ${overviewTab === 'alarms' ? 'text-slate-800 border-slate-800' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  告警列表
                </button>
              </div>

              {overviewTab === 'sites' && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-2">
                    <Search size={11} className="text-slate-400 flex-shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="搜索"
                      className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none placeholder-slate-400 min-w-0"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-0.5">
                    {filteredSites.map(s => (
                      <div
                        key={s.id}
                        className={`py-1.5 px-1 text-[11px] cursor-pointer rounded transition-colors ${s.id === site.id ? 'text-[#0ABAB5] font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {overviewTab === 'alarms' && (
                <div className="flex-1 overflow-y-auto space-y-1">
                  {activeAlarms.slice(0, 8).map(a => (
                    <div key={a.id} className="flex items-start gap-1.5 py-1">
                      <AlertTriangle size={10} className={`flex-shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'major' ? 'text-orange-500' : 'text-yellow-500'}`} />
                      <div>
                        <p className="text-[10px] text-slate-700 leading-tight">{a.message}</p>
                        <p className="text-[9px] text-slate-400">{a.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setDrawerOpen(o => !o)}
        className="absolute top-1/2 -translate-y-1/2 z-30 w-5 h-10 bg-white border border-slate-200 rounded-r-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
        style={{ left: drawerOpen ? 200 : 0 }}
      >
        {drawerOpen ? <ChevronLeft size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
      </button>

      {/* ── Main topology area ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur z-20">
          <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
            <button className="px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white shadow-sm text-blue-600">Physical Wiring</button>
            <button className="px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-400">Logical Overlay</button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddingLink(!isAddingLink)}
              className={`p-2 rounded-lg transition-all ${isAddingLink ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:text-blue-600'}`}
            >
              <Plus size={14} />
            </button>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:text-blue-600 transition-all"><ZoomIn size={14} /></button>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:text-blue-600 transition-all"><ZoomOut size={14} /></button>
            <button className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:text-blue-600 transition-all ml-2"><Maximize2 size={14} /></button>
          </div>
        </div>

        {hoveredLink && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-4 z-30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Local Port</p><p className="text-xs font-bold">{hoveredLink.fromPort}</p></div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Remote Port</p><p className="text-xs font-bold">{hoveredLink.toPort}</p></div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{hoveredLink.type}</div>
            {hoveredLink.isManual && (
              <button 
                onClick={() => setManualLinks(links => links.filter(l => l !== hoveredLink))}
                className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* 添加连线提示 */}
        {isAddingLink && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-3 z-30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <Plus size={16} />
            <span className="text-[11px] font-bold">
              {linkStartDevice ? `选择终点设备 (已选: ${linkStartDevice.name})` : '选择起点设备'}
            </span>
            <button 
              onClick={() => {
                setIsAddingLink(false);
                setLinkStartDevice(null);
              }}
              className="ml-2 p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing">
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            <svg width="960" height="560" className="overflow-visible">
              {/* 渲染自动连线 */}
              {topologyData.links.map((link, i) => {
                const from = topologyData.nodes.find(n => n.device.id === link.from);
                const to = topologyData.nodes.find(n => n.device.id === link.to);
                if (!from || !to) return null;
                return (
                  <LinkLine
                    key={i}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    type={link.type}
                    onMouseEnter={() => setHoveredLink(link)}
                    onMouseLeave={() => setHoveredLink(null)}
                  />
                );
              })}
              {/* 渲染手动添加的连线 */}
              {manualLinks.map((link, i) => {
                const from = topologyData.nodes.find(n => n.device.id === link.from);
                const to = topologyData.nodes.find(n => n.device.id === link.to);
                if (!from || !to) return null;
                return (
                  <LinkLine
                    key={`manual-${i}`}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    type={link.type}
                    isManual={true}
                    onMouseEnter={() => setHoveredLink(link)}
                    onMouseLeave={() => setHoveredLink(null)}
                  />
                );
              })}
              {topologyData.nodes.map((node, i) => (
                <Node 
                  key={i} 
                  x={node.x} 
                  y={node.y} 
                  device={node.device} 
                  isSelected={linkStartDevice?.id === node.device.id}
                  onClick={() => {
                    if (isAddingLink) {
                      if (!linkStartDevice) {
                        // 选择起点
                        setLinkStartDevice(node.device);
                      } else if (linkStartDevice.id !== node.device.id) {
                        // 选择终点,打开编辑器
                        setEditingLink({
                          from: linkStartDevice.id,
                          to: node.device.id,
                          type: 'ethernet'
                        });
                        setShowLinkEditor(true);
                        setIsAddingLink(false);
                        setLinkStartDevice(null);
                      }
                    } else {
                      setSelectedDevice(node.device);
                    }
                  }}
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 z-10">
          <Info size={14} className="text-blue-500" />
          <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Site Mode: {site.siteType}</p>
        </div>

        <DeviceDetailDrawer device={selectedDevice} onClose={() => setSelectedDevice(null)} activePlugins={site.activePlugins} />

        {/* 连线编辑弹窗 */}
        {showLinkEditor && editingLink && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">编辑连线</h3>
                <button 
                  onClick={() => {
                    setShowLinkEditor(false);
                    setEditingLink({});
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">起点设备</label>
                  <input
                    type="text"
                    value={devices.find(d => d.id === editingLink.from)?.name || ''}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">起点端口</label>
                  <input
                    type="text"
                    placeholder="例如: Eth1/1"
                    value={editingLink.fromPort || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, fromPort: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">终点设备</label>
                  <input
                    type="text"
                    value={devices.find(d => d.id === editingLink.to)?.name || ''}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">终点端口</label>
                  <input
                    type="text"
                    placeholder="例如: Eth1/49"
                    value={editingLink.toPort || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, toPort: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">连线类型</label>
                  <select
                    value={editingLink.type || 'ethernet'}
                    onChange={(e) => setEditingLink({ ...editingLink, type: e.target.value as 'fiber' | 'ethernet' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ethernet">以太网</option>
                    <option value="fiber">光纤</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowLinkEditor(false);
                    setEditingLink({});
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (editingLink.from && editingLink.to && editingLink.fromPort && editingLink.toPort) {
                      setManualLinks([...manualLinks, editingLink as PhysicalLink]);
                      setShowLinkEditor(false);
                      setEditingLink({});
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LinkLine = ({ x1, y1, x2, y2, type, isManual, onMouseEnter, onMouseLeave }: any) => (
  <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className="cursor-pointer group">
    <line 
      x1={x1} y1={y1} x2={x2} y2={y2} 
      stroke={type === 'fiber' ? '#f59e0b' : '#81D8D0'} 
      strokeWidth="2" 
      strokeDasharray={isManual ? "5,5" : "none"}
      className="opacity-40 group-hover:opacity-100 transition-opacity"
    />
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="20" />
    <circle r="3" fill={type === 'fiber' ? '#f59e0b' : '#81D8D0'}>
       <animateMotion dur="2.5s" repeatCount="indefinite" path={`M ${x1} ${y1} L ${x2} ${y2}`} />
    </circle>
  </g>
);

const Node = ({ x, y, device, onClick, isSelected }: any) => {
  const getDeviceIcon = () => {
    switch(device.role) {
      case 'Core': case 'Spine': return <Server size={28} className="text-blue-700" />;
      case 'Aggregation': case 'Leaf': return <Layers size={24} className="text-blue-500" />;
      case 'Access': return <Network size={24} className="text-slate-500" />;
      case 'AP': return <Wifi size={24} className="text-emerald-500" />;
      case 'OTN': case 'Optical': return <Activity size={24} className="text-amber-500" />;
      case 'Border': return <Globe size={24} className="text-indigo-500" />;
      case 'Camera': return <Cpu size={24} className="text-red-500" />;
      default: return <Network size={24} className="text-slate-400" />;
    }
  };

  return (
    <foreignObject x={x-50} y={y-50} width="100" height="120">
      <div onClick={onClick} className="flex flex-col items-center group cursor-pointer">
        <div className={`w-16 h-16 rounded-[1.25rem] bg-white border-2 flex items-center justify-center shadow-lg transition-all group-hover:scale-110 relative ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-300' :
          device.status === 'online' ? 'border-slate-100 group-hover:border-blue-500' : 'border-red-100 opacity-60 grayscale'
        }`}>
          {getDeviceIcon()}
          <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
            device.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'
          }`} />
        </div>
        <div className="mt-2.5 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
           <p className="text-[9px] font-black text-slate-800 uppercase truncate max-w-[85px]">{device.name}</p>
        </div>
      </div>
    </foreignObject>
  );
};

export default GlobalTopology;

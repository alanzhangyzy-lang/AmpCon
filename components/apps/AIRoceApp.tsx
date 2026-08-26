import React, { useState } from 'react';
import { Site } from '../../types';
import AIDCDashboard from './AIDCDashboard';
import AIDCProvisioning from './AIDCProvisioning';
import AIDCStudio2 from './AIDCStudio2';
import AIDCNetworkDesign from './AIDCNetworkDesign';
import { createInitialInventoryTopologyState, InventoryTopologyState } from './AIDCInventoryTopology';
import { AIDC_FABRIC_01, aidcDeviceName } from './aidcTopologyDomain';
import {
  Cpu, Activity, Zap, Shield, Network, BarChart3, TrendingUp,
  AlertCircle, CheckCircle2, Layers, Sliders, Server, Clock, AlertTriangle
} from 'lucide-react';
import {
  ChevronDown, MoreHorizontal, Download, Copy, Trash2, Upload,
  Maximize2, Star, FilePlus, LayoutDashboard, Globe, Database
} from 'lucide-react';

interface AIRoceAppProps {
  site: Site;
  feature: string;
  onNavigate?: (feature: string) => void;
}

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full overflow-auto bg-[#f0f2f5] animate-in fade-in duration-300">
    <div className="p-4 flex flex-col h-full gap-3">{children}</div>
  </div>
);

/* Unified panel card */
const Panel = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200/80 rounded-lg flex flex-col overflow-hidden h-full">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
      <h3 className="text-[12px] font-semibold text-slate-700">{title}</h3>
      {action}
    </div>
    <div className="px-4 py-3 flex-1 min-h-0 overflow-auto">{children}</div>
  </div>
);

const DashboardToolbar = () => {
  const [viewOpen, setViewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Default');
  const views = ['Default', 'AmpCon Cluster', 'Device Health'];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 font-medium">Views:</span>
        <div className="relative">
          <button onClick={() => setViewOpen(!viewOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:border-slate-300 transition-colors">
            <span>{currentView}</span>
            <ChevronDown size={11} className="text-slate-400" />
          </button>
          {viewOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-20 py-1 min-w-[150px]">
              {views.map(v => (
                <button key={v} onClick={() => { setCurrentView(v); setViewOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-slate-50 transition-colors ${currentView === v ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'}`}>{v}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="新建Dashboard视图"><FilePlus size={15} /></button>
        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="添加Dashboard面板"><LayoutDashboard size={15} /></button>
        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="全屏"><Maximize2 size={15} /></button>
        <div className="relative">
          <button onClick={() => setMoreOpen(!moreOpen)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="更多"><MoreHorizontal size={15} /></button>
          {moreOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-20 py-1 min-w-[150px]">
              {[{icon:<Star size={12}/>,label:'设置为默认'},{icon:<Copy size={12}/>,label:'复制'},{icon:<Trash2 size={12}/>,label:'删除',danger:true},{icon:<Download size={12}/>,label:'导出JSON'},{icon:<Download size={12}/>,label:'导出JPEG'},{icon:<Upload size={12}/>,label:'导入'}].map(item=>(
                <button key={item.label} onClick={()=>setMoreOpen(false)} className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-slate-50 transition-colors ${item.danger?'text-red-500 hover:bg-red-50':'text-slate-600'}`}>{item.icon}{item.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AIRoceApp: React.FC<AIRoceAppProps> = ({ site, feature, onNavigate }) => {
  const [inventoryState,setInventoryState] = useState<InventoryTopologyState>(()=>createInitialInventoryTopologyState());
  if (feature === 'overview') return <AIDCDashboard site={site} />;
  if (feature === 'network-design') return <AIDCNetworkDesign site={site} onNavigate={onNavigate} inventoryState={inventoryState} onInventoryStateChange={setInventoryState} />;
  if (feature === 'studio2') return <AIDCStudio2 site={site} onNavigate={onNavigate} inventoryState={inventoryState} onInventoryStateChange={setInventoryState} />;
  if (feature.startsWith('workspaces:')) return <AIDCProvisioning site={site} feature="workspaces" initialWorkspaceId={decodeURIComponent(feature.slice('workspaces:'.length))} />;
  if (['studios', 'workspaces', 'tasks', 'change-control'].includes(feature)) return <AIDCProvisioning site={site} feature={feature} />;

  if (feature === 'overview') {
    const [loadTab, setLoadTab] = useState<'CPU'|'内存'|'温度'>('CPU');
    const [ecnTab, setEcnTab] = useState<'交换机'|'网卡'>('交换机');
    const [evtFilter, setEvtFilter] = useState('All');

    const hs = site.health ?? 100;
    const hc = hs >= 90 ? '#10b981' : hs >= 70 ? '#f59e0b' : '#ef4444';
    const htx = hs >= 90 ? 'text-emerald-500' : hs >= 70 ? 'text-amber-500' : 'text-red-500';
    const hlabel = hs >= 90 ? '健康（Healthy）' : hs >= 70 ? '一般（Fair）' : '异常（Critical）';

    const queueDropData = [
      { rank: 1, device: 'WH-Core-02', port: 'Eth1/2', ecn: 12453 },
      { rank: 2, device: 'BJ-Spine-02', port: 'Eth1/1', ecn: 9821 },
      { rank: 3, device: 'BJ-Spine-03', port: 'Eth1/11', ecn: 8734 },
      { rank: 4, device: 'BJ-Leaf-12', port: 'Eth1/18', ecn: 6512 },
      { rank: 5, device: 'BJ-Border-02', port: 'Eth1/2', ecn: 5230 },
    ];

    const ecnSwitchData = [
      { device: 'WH-Core-02', port: 'Eth1/2', ecn: 12453 },
      { device: 'BJ-Spine-02', port: 'Eth1/1', ecn: 9821 },
      { device: 'BJ-Spine-03', port: 'Eth1/11', ecn: 8734 },
      { device: 'BJ-Leaf-12', port: 'Eth1/18', ecn: 6512 },
      { device: 'BJ-Border-02', port: 'Eth1/2', ecn: 5230 },
    ];

    const ecnNicData = [
      { device: 'Server-3', nic: 'mlx5_0', ecn: 8921 },
      { device: 'Server-1', nic: 'mlx5_1', ecn: 7654 },
      { device: 'Server-2', nic: 'mlx5_0', ecn: 6543 },
      { device: 'Server-2', nic: 'mlx5_2', ecn: 5432 },
      { device: 'Server-2', nic: 'mlx5_1', ecn: 4321 },
    ];

    const loadData = [
      { rank: 1, name: 'Core-Switch-01', ip: '10.0.0.1', util: 90, c: 'bg-red-500' },
      { rank: 2, name: 'Dist-Switch-A2', ip: '10.0.0.2', util: 80, c: 'bg-orange-500' },
      { rank: 3, name: 'Cache-R-01', ip: '10.0.0.3', util: 60, c: 'bg-blue-500' },
      { rank: 4, name: 'Dist-Switch-A2', ip: '10.0.0.4', util: 60, c: 'bg-blue-500' },
      { rank: 5, name: 'Spine-Switch-01', ip: '10.0.0.5', util: 60, c: 'bg-blue-500' },
    ];

    const events = [
      { level: 'CRITICAL', dot: 'bg-red-500', time: '2026-04-02 07:43:51', site: 'WuHan-DC-01', msg: 'Core-Switch-01 端口 Eth1/49 Down' },
      { level: 'MAJOR', dot: 'bg-orange-500', time: '2026-04-01 23:50:12', site: 'ShangHai-DC-01', msg: 'Core-Switch-01 CPU 超过阈值（92%）' },
      { level: 'MINOR', dot: 'bg-yellow-500', time: '2026-04-01 20:30:45', site: 'Frankfurt-DC', msg: 'Spine-02 误码率超过预警阈值' },
    ];

    const filteredEvents = evtFilter === 'All' ? events : events.filter(e => e.level === evtFilter);


    return (
      <Wrap>
        <DashboardToolbar />

        {/* ROW 1: 3 columns equal height */}
        <div className="grid grid-cols-3 gap-3 flex-[2]">
          {/* 设备资源统计 */}
          <Panel title="设备资源统计">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#3b82f6" strokeWidth="5" strokeDasharray={2 * Math.PI * 25 * 0.88} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 30 30)" />
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#ef4444" strokeWidth="5" strokeDasharray={2 * Math.PI * 25 * 0.12} strokeDashoffset={-2 * Math.PI * 25 * 0.88} strokeLinecap="round" transform="rotate(-90 30 30)" />
                  <text x="30" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">{site.deviceCount || 68}</text>
                  <text x="30" y="36" textAnchor="middle" fontSize="6" fill="#94a3b8">总数</text>
                </svg>
              </div>
              <div className="flex-1 space-y-0 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-400">设备总数</span><span className="font-semibold text-slate-700">{site.deviceCount || 68}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">设备在线数</span><span className="font-semibold text-emerald-600">60</span></div>
                <div className="flex justify-between"><span className="text-slate-400">设备在线率</span><span className="font-semibold text-emerald-600">88%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">设备离线数</span><span className="font-semibold text-slate-500">8</span></div>
                <div className="flex justify-between"><span className="text-slate-400">异常设备数</span><span className="font-semibold text-red-500">15</span></div>
              </div>
            </div>
            <div className="text-[9px] font-medium text-slate-500 mb-1">设备类型</div>
            <div className="space-y-1">
              {[{ l: 'Spine', c: 16, cl: 'bg-indigo-500' }, { l: 'Leaf', c: 32, cl: 'bg-emerald-500' }, { l: 'Border Leaf', c: 12, cl: 'bg-amber-500' }, { l: 'Other', c: 8, cl: 'bg-slate-400' }].map(r => (
                <div key={r.l} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 w-16 text-right">{r.l}</span>
                  <div className="flex-1 bg-slate-100 h-4 rounded overflow-hidden">
                    <div className={`h-4 rounded ${r.cl} flex items-center justify-end pr-1`} style={{ width: `${(r.c / 32) * 100}%` }}><span className="text-[8px] text-white font-medium">{r.c}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* 资产负载排名 */}
          <Panel title="资产负载排名（TOP 5）" action={<div className="flex gap-0.5">{(['CPU', '内存', '温度'] as const).map(t => (<button key={t} onClick={() => setLoadTab(t)} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${loadTab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t}</button>))}</div>}>
            <table className="w-full text-[12px]">
              <thead><tr className="text-[11px] text-slate-400 border-b border-slate-100"><th className="text-left py-1 font-medium w-6">排名</th><th className="text-left py-1 font-medium">设备名</th><th className="text-left py-1 font-medium">IP</th><th className="text-left py-1 font-medium w-28">当前利用率</th></tr></thead>
              <tbody>{loadData.map(a => (<tr key={a.rank} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="py-2"><span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${a.rank === 1 ? 'bg-red-100 text-red-600' : a.rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{a.rank}</span></td><td className="py-2 text-slate-700 font-medium">{a.name}</td><td className="py-2 text-slate-500 font-mono text-[10px]">{a.ip}</td><td className="py-2"><div className="flex items-center gap-1.5"><div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className={`h-1.5 rounded-full ${a.c}`} style={{ width: `${a.util}%` }} /></div><span className="text-[10px] text-slate-600 w-7 text-right">{a.util}%</span></div></td></tr>))}</tbody>
            </table>
          </Panel>

          {/* 告警汇总 */}
          <Panel title="告警汇总">
            <div className="grid grid-cols-2 gap-2 h-full">
              <div className="bg-red-50 border border-red-100 rounded-md p-3 flex items-center gap-2">
                <div className="w-9 h-9 bg-red-100 rounded flex items-center justify-center flex-shrink-0"><AlertCircle className="w-6 h-6 text-red-500" /></div>
                <div><div className="text-[10px] text-slate-500">严重告警</div><div className="text-2xl font-bold text-red-500">12</div></div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-md p-3 flex items-center gap-2">
                <div className="w-9 h-9 bg-orange-100 rounded flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-6 h-6 text-orange-500" /></div>
                <div><div className="text-[10px] text-slate-500">重要告警</div><div className="text-2xl font-bold text-orange-500">34</div></div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 flex items-center gap-2">
                <div className="w-9 h-9 bg-yellow-100 rounded flex items-center justify-center flex-shrink-0"><AlertCircle className="w-6 h-6 text-yellow-500" /></div>
                <div><div className="text-[10px] text-slate-500">一般告警</div><div className="text-2xl font-bold text-yellow-500">89</div></div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-100 rounded flex items-center justify-center flex-shrink-0"><Activity className="w-6 h-6 text-blue-500" /></div>
                <div><div className="text-[10px] text-slate-500">提示告警</div><div className="text-2xl font-bold text-blue-500">156</div></div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ROW 2+3: CSS Grid 3 cols × 2 rows, Events spans right column both rows */}
        <div className="grid gap-3 flex-[3]" style={{ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
          {/* [R2,C1] 队列丢包Top5 */}
          <Panel title="队列丢包Top5">
            <table className="w-full text-[12px]">
              <thead><tr className="text-[11px] text-slate-400 border-b border-slate-100"><th className="text-left py-1 font-medium w-8">排名</th><th className="text-left py-1 font-medium">设备名</th><th className="text-left py-1 font-medium">端口</th><th className="text-right py-1 font-medium">ECN报文数</th></tr></thead>
              <tbody>{queueDropData.map(r => (<tr key={r.rank} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="py-2"><span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${r.rank === 1 ? 'bg-red-100 text-red-600' : r.rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{r.rank}</span></td><td className="py-2 text-slate-700 font-medium">{r.device}</td><td className="py-2 text-slate-500 font-mono text-[10px]">{r.port}</td><td className="py-2 text-right text-slate-600">{r.ecn.toLocaleString()}</td></tr>))}</tbody>
            </table>
          </Panel>

          {/* [R2,C2] Headroom 利用趋势图 */}
          <Panel title="Headroom 利用趋势图">
            <div className="text-[10px] text-slate-400 mb-1">Headroom Buffer Usage (%)</div>
            <svg viewBox="0 0 300 120" className="w-full" preserveAspectRatio="xMidYMid meet">
              <line x1="30" y1="10" x2="30" y2="110" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="110" x2="290" y2="110" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="35" x2="290" y2="35" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="60" x2="290" y2="60" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="85" x2="290" y2="85" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x="25" y="14" textAnchor="end" fontSize="8" fill="#94a3b8">100%</text>
              <text x="25" y="39" textAnchor="end" fontSize="8" fill="#94a3b8">75%</text>
              <text x="25" y="64" textAnchor="end" fontSize="8" fill="#94a3b8">50%</text>
              <text x="25" y="89" textAnchor="end" fontSize="8" fill="#94a3b8">25%</text>
              <text x="25" y="114" textAnchor="end" fontSize="8" fill="#94a3b8">0%</text>
              <line x1="30" y1="45" x2="290" y2="45" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" />
              <text x="292" y="48" fontSize="7" fill="#f59e0b">阈值</text>
              <path d="M30,100 L80,92 L130,85 L180,78 L210,70 L240,65 L270,72 L290,68 L290,110 L30,110 Z" fill="#10b981" fillOpacity="0.1" />
              <path d="M30,100 L80,92 L130,85 L180,78 L210,70 L240,65 L270,72 L290,68" fill="none" stroke="#10b981" strokeWidth="2" />
              <text x="30" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">00:00</text>
              <text x="95" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">04:00</text>
              <text x="160" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">08:00</text>
              <text x="225" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">12:00</text>
              <text x="290" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">16:00</text>
            </svg>
          </Panel>

          {/* [R2+R3,C3] Events — spans 2 rows */}
          <div style={{ gridRow: 'span 2' }}>
            <Panel title="Events" action={<select value={evtFilter} onChange={e => setEvtFilter(e.target.value)} className="text-[10px] border border-slate-200 rounded px-2 py-0.5 bg-white text-slate-600 outline-none"><option value="All">All</option><option value="CRITICAL">CRITICAL</option><option value="MAJOR">MAJOR</option><option value="MINOR">MINOR</option><option value="WARNING">WARNING</option></select>}>
              <div className="space-y-2">
                {filteredEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] bg-slate-50 rounded px-3 py-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${e.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-slate-400 font-mono text-[11px]">{e.time}</span>
                      </div>
                      <div className="text-slate-700">{e.msg}</div>
                    </div>
                  </div>
                ))}
                {filteredEvents.length === 0 && <div className="text-center text-[11px] text-slate-400 py-4">暂无匹配事件</div>}
              </div>
            </Panel>
          </div>

          {/* [R3,C1] ECN报文数Top5 */}
          <Panel title="ECN报文数Top5" action={<div className="flex gap-0.5">{(['交换机', '网卡'] as const).map(t => (<button key={t} onClick={() => setEcnTab(t)} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${ecnTab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t}</button>))}</div>}>
            {ecnTab === '交换机' ? (
              <table className="w-full text-[12px]">
                <thead><tr className="text-[11px] text-slate-400 border-b border-slate-100"><th className="text-left py-1 font-medium w-8">#</th><th className="text-left py-1 font-medium">设备名</th><th className="text-left py-1 font-medium">端口</th><th className="text-right py-1 font-medium">ECN报文数</th></tr></thead>
                <tbody>{ecnSwitchData.map((r, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="py-2"><span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span></td><td className="py-2 text-slate-700 font-medium">{r.device}</td><td className="py-2 text-slate-500 font-mono text-[10px]">{r.port}</td><td className="py-2 text-right text-slate-600">{r.ecn.toLocaleString()}</td></tr>))}</tbody>
              </table>
            ) : (
              <table className="w-full text-[12px]">
                <thead><tr className="text-[11px] text-slate-400 border-b border-slate-100"><th className="text-left py-1 font-medium w-8">#</th><th className="text-left py-1 font-medium">设备名</th><th className="text-left py-1 font-medium">网卡名称</th><th className="text-right py-1 font-medium">ECN报文数</th></tr></thead>
                <tbody>{ecnNicData.map((r, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="py-2"><span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span></td><td className="py-2 text-slate-700 font-medium">{r.device}</td><td className="py-2 text-slate-500 font-mono text-[10px]">{r.nic}</td><td className="py-2 text-right text-slate-600">{r.ecn.toLocaleString()}</td></tr>))}</tbody>
              </table>
            )}
          </Panel>

          {/* [R3,C2] 队列丢包趋势图 — line chart */}
          <Panel title="队列丢包趋势图">
            <div className="text-[10px] text-slate-400 mb-1">Queue Packet Drops</div>
            <svg viewBox="0 0 300 110" className="w-full" preserveAspectRatio="xMidYMid meet">
              <line x1="30" y1="10" x2="30" y2="105" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="105" x2="290" y2="105" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="30" x2="290" y2="30" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="55" x2="290" y2="55" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="80" x2="290" y2="80" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x="25" y="14" textAnchor="end" fontSize="7" fill="#94a3b8">6e+13</text>
              <text x="25" y="34" textAnchor="end" fontSize="7" fill="#94a3b8">4.5e+13</text>
              <text x="25" y="59" textAnchor="end" fontSize="7" fill="#94a3b8">3e+13</text>
              <text x="25" y="84" textAnchor="end" fontSize="7" fill="#94a3b8">1.5e+13</text>
              <text x="25" y="109" textAnchor="end" fontSize="7" fill="#94a3b8">0</text>
              <path d="M30,90 L70,82 L110,75 L150,65 L190,58 L230,50 L270,42 L290,38" fill="none" stroke="#3b82f6" strokeWidth="2" />
              <path d="M30,90 L70,82 L110,75 L150,65 L190,58 L230,50 L270,42 L290,38 L290,105 L30,105 Z" fill="#3b82f6" fillOpacity="0.08" />
              <path d="M30,95 L70,90 L110,85 L150,78 L190,72 L230,65 L270,60 L290,55" fill="none" stroke="#10b981" strokeWidth="1.5" />
              <path d="M30,100 L70,96 L110,92 L150,86 L190,82 L230,78 L270,74 L290,70" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <path d="M30,103 L70,100 L110,97 L150,92 L190,88 L230,85 L270,82 L290,78" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
              <text x="30" y="118" textAnchor="middle" fontSize="7" fill="#94a3b8">07:45</text>
              <text x="95" y="118" textAnchor="middle" fontSize="7" fill="#94a3b8">08:00</text>
              <text x="160" y="118" textAnchor="middle" fontSize="7" fill="#94a3b8">02:15</text>
              <text x="225" y="118" textAnchor="middle" fontSize="7" fill="#94a3b8">02:30</text>
              <text x="290" y="118" textAnchor="middle" fontSize="7" fill="#94a3b8">03:15</text>
            </svg>
          </Panel>
        </div>
      </Wrap>
    );
  }

  if (feature === 'topology') {
    const missingLinks=AIDC_FABRIC_01.expectedLinks-AIDC_FABRIC_01.observedLinks;
    return (
      <div className="p-10 max-w-7xl mx-auto h-full flex flex-col space-y-10 animate-in fade-in duration-300 bg-[#fcfcfc] overflow-auto pb-32">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">RoCE <span className="text-pink-600">Fabric Topology</span></h1>
          <p className="text-slate-500 font-medium">{AIDC_FABRIC_01.podName} · {AIDC_FABRIC_01.spines} Spine · {AIDC_FABRIC_01.leafs} GPU Leaf</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">{AIDC_FABRIC_01.expectedLinks} expected links</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">{AIDC_FABRIC_01.observedLinks} observed</span>
            <span className={`rounded-full border px-3 py-1 ${missingLinks?'border-red-200 bg-red-50 text-red-700':'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{missingLinks} missing</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm min-h-[500px] flex flex-col items-center justify-center">
          <div className="text-center space-y-8 w-full max-w-3xl">
            <div className="flex justify-center gap-3 flex-wrap">
              {Array.from({length:AIDC_FABRIC_01.spines},(_,index)=>aidcDeviceName('Spine',index+1)).map(s => (
                <div key={s} className="px-8 py-4 bg-pink-50 border-2 border-pink-200 rounded-2xl text-sm font-black text-pink-700">{s}</div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({length:AIDC_FABRIC_01.spines}).map((_,i)=><div key={i} className="w-px h-16 bg-pink-200" />)}
            </div>
            <div className="flex justify-center gap-3 flex-wrap">
              {Array.from({length:AIDC_FABRIC_01.leafs},(_,index)=>aidcDeviceName('Leaf',index+1)).map(l => (
                <div key={l} className="px-6 py-3 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-xs font-black text-indigo-700">{l}</div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({length:AIDC_FABRIC_01.leafs}).map((_,i)=><div key={i} className="w-px h-12 bg-slate-200" />)}
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
              {Array.from({length:AIDC_FABRIC_01.leafs}).map((_,i)=><div key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500"><Cpu size={12} className="inline mr-1" />GPU-Node-{String(i+1).padStart(2,'0')}</div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (feature === 'traffic') {
    return (
      <div className="p-10 max-w-7xl mx-auto h-full flex flex-col space-y-10 animate-in fade-in duration-300 bg-[#fcfcfc] overflow-auto pb-32">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">RDMA <span className="text-pink-600">Traffic Analytics</span></h1>
          <p className="text-slate-500 font-medium">RoCEv2 Flow Monitoring & Congestion Detection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Total RDMA Flows" value="2,847" icon={<Network size={18} />} color="text-pink-600" />
          <StatCard label="Aggregate BW" value="1.6 Tbps" icon={<TrendingUp size={18} />} color="text-indigo-600" />
          <StatCard label="Avg Latency" value="1.2 μs" icon={<Clock size={18} />} color="text-emerald-600" />
          <StatCard label="Drop Rate" value="0.00%" icon={<CheckCircle2 size={18} />} color="text-emerald-600" />
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Top RDMA Flows</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Source</th><th className="px-6 py-4">Destination</th><th className="px-6 py-4">QP</th><th className="px-6 py-4">Rate</th><th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-700">
              <FlowRow src="GPU-01" dst="GPU-05" qp="QP-1024" rate="98 Gbps" status="Healthy" />
              <FlowRow src="GPU-02" dst="GPU-06" qp="QP-2048" rate="95 Gbps" status="Healthy" />
              <FlowRow src="GPU-03" dst="GPU-07" qp="QP-3072" rate="92 Gbps" status="Healthy" />
              <FlowRow src="GPU-04" dst="GPU-08" qp="QP-4096" rate="88 Gbps" status="ECN Marked" warning />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (feature === 'qos') {
    return (
      <div className="p-10 max-w-7xl mx-auto h-full flex flex-col space-y-10 animate-in fade-in duration-300 bg-[#fcfcfc] overflow-auto pb-32">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">QoS / <span className="text-pink-600">PFC Policy</span></h1>
          <p className="text-slate-500 font-medium">Priority Flow Control & DCQCN Configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Shield size={18} /> PFC Priority Map</h3>
            <div className="space-y-4">
              {[
                { pri: 0, name: 'Best Effort', pfc: false, bw: '5%' },
                { pri: 1, name: 'Background', pfc: false, bw: '5%' },
                { pri: 2, name: 'Excellent Effort', pfc: false, bw: '5%' },
                { pri: 3, name: 'RoCEv2 (RDMA)', pfc: true, bw: '60%' },
                { pri: 4, name: 'Video Streaming', pfc: false, bw: '10%' },
                { pri: 5, name: 'Voice', pfc: false, bw: '5%' },
                { pri: 6, name: 'Network Control', pfc: false, bw: '5%' },
                { pri: 7, name: 'Mgmt / OAM', pfc: false, bw: '5%' },
              ].map(p => (
                <div key={p.pri} className={`flex items-center justify-between p-4 rounded-2xl border ${p.pfc ? 'bg-pink-50 border-pink-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${p.pfc ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{p.pri}</span>
                    <span className="text-sm font-bold text-slate-700">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{p.bw}</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${p.pfc ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {p.pfc ? 'PFC ON' : 'PFC OFF'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Sliders size={18} /> DCQCN Parameters</h3>
            <div className="space-y-6">
              <ParamRow label="ECN Marking Threshold" value="150 KB" desc="Buffer threshold for ECN CE marking" />
              <ParamRow label="CNP Generation Rate" value="10 μs" desc="Min interval between CNP packets" />
              <ParamRow label="Rate Increase Timer" value="300 μs" desc="Additive increase period" />
              <ParamRow label="Rate Decrease Factor" value="α = 0.5" desc="Multiplicative decrease factor" />
              <ParamRow label="Min Rate Limit" value="1 Gbps" desc="Floor rate for throttled flows" />
              <ParamRow label="Headroom Buffer" value="384 KB" desc="PFC headroom per priority per port" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Internal Components
const ClusterRow = ({ name, gpus, util, status }: any) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="flex items-center gap-3">
      <Cpu size={14} className={status === 'active' ? 'text-pink-500' : 'text-slate-300'} />
      <span className="text-sm font-bold text-slate-700">{name}</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black text-slate-400 uppercase">{gpus} GPUs</span>
      <span className="text-[10px] font-black text-pink-600">{util}%</span>
    </div>
  </div>
);

const CounterRow = ({ label, value, trend, good }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-bold text-slate-500">{label}</span>
    <div className="flex items-center gap-3">
      <span className="text-sm font-black text-slate-800">{value}</span>
      <span className={`text-[10px] font-black ${good ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</span>
    </div>
  </div>
);

const ThroughputRow = ({ src, dst, rate, util }: any) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-lg text-[11px] font-bold">{src}</span>
    <span className="text-slate-300">→</span>
    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[11px] font-bold">{dst}</span>
    <div className="flex-1" />
    <span className="text-[11px] font-bold text-slate-600">{rate}</span>
    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className="h-full bg-pink-500 rounded-full" style={{ width: `${util}%` }} />
    </div>
    <span className="text-xs font-black text-slate-800 w-10 text-right">{util}%</span>
  </div>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
    <div className={`mb-4 ${color}`}>{icon}</div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

const FlowRow = ({ src, dst, qp, rate, status, warning = false }: any) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-5"><span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-lg">{src}</span></td>
    <td className="px-6 py-5"><span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">{dst}</span></td>
    <td className="px-6 py-5 font-mono text-[10px]">{qp}</td>
    <td className="px-6 py-5">{rate}</td>
    <td className="px-6 py-5 text-right">
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${warning ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{status}</span>
    </td>
  </tr>
);

const ParamRow = ({ label, value, desc }: any) => (
  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <span className="text-sm font-black text-pink-600 font-mono">{value}</span>
    </div>
    <p className="text-[10px] text-slate-400">{desc}</p>
  </div>
);

export default AIRoceApp;

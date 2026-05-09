import React, { useState } from 'react';
import { Site } from '../../types';
import GlobalTopology from '../GlobalTopology';
import {
  Server, Zap, Layers, Plus, Activity, Cpu, Save, Shield, Settings, Network,
  Database, ChevronRight, Sliders, Box, BarChart3, Globe, AlertCircle, FileText,
  LayoutGrid, Share2, CheckCircle2, TrendingUp, TrendingDown, Clock, ShieldCheck,
  Search, Monitor, ChevronDown, MoreHorizontal, Download, Copy, Trash2, Upload,
  Maximize2, Grid, Star, FilePlus, LayoutDashboard
} from 'lucide-react';

interface DCFabricAppProps {
  site: Site;
  feature: string;
}

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full overflow-auto bg-[#f8fafb] animate-in fade-in duration-300">
    <div className="p-6 pb-24 space-y-5">{children}</div>
  </div>
);

/* ── Dashboard Toolbar ──────────────────────────────────────── */
const DashboardToolbar = () => {
  const [viewOpen, setViewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Default');
  const views = ['Default', 'AmpCon Cluster', 'Device Health'];

  return (
    <div className="flex items-center justify-between">
      {/* Left: Views dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Views:</span>
        <div className="relative">
          <button onClick={() => setViewOpen(!viewOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors">
            <span>{currentView}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          {viewOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
              {views.map(v => (
                <button key={v} onClick={() => { setCurrentView(v); setViewOpen(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${currentView === v ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'}`}>{v}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Action toolbar */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="新建Dashboard视图">
          <FilePlus size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="添加Dashboard面板">
          <LayoutDashboard size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="全屏">
          <Maximize2 size={16} />
        </button>
        <div className="relative">
          <button onClick={() => setMoreOpen(!moreOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="更多">
            <MoreHorizontal size={16} />
          </button>
          {moreOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
              {[
                { icon: <Star size={13} />, label: '设置为默认' },
                { icon: <Copy size={13} />, label: '复制' },
                { icon: <Trash2 size={13} />, label: '删除', danger: true },
                { icon: <Download size={13} />, label: '导出JSON' },
                { icon: <Download size={13} />, label: '导出JPEG' },
                { icon: <Upload size={13} />, label: '导入' },
              ].map(item => (
                <button key={item.label} onClick={() => setMoreOpen(false)} className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600'}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DCFabricApp: React.FC<DCFabricAppProps> = ({ site, feature }) => {

  // 1. OVERVIEW DASHBOARD — AIDC Network Dashboard
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

        {/* ROW 1 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Panel 1: 网络健康度评估 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">网络健康度评估</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">{site.name || 'Frankfurt Data Center'}</div>
                    <div className="text-[10px] text-slate-400">数据中心场景</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">运行状态</div>
                  <div className={`text-sm font-bold ${htx}`}>{hlabel}</div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle cx="45" cy="45" r="38" fill="none" stroke={hc} strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 38} strokeDashoffset={2 * Math.PI * 38 * (1 - hs / 100)}
                    strokeLinecap="round" transform="rotate(-90 45 45)" />
                  <text x="45" y="45" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="bold" fill={hc}>{hs}</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Panel 2: 队列丢包Top5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">队列丢包Top5</h3>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                  <th className="text-left py-1 font-medium w-8">排名</th>
                  <th className="text-left py-1 font-medium">设备名</th>
                  <th className="text-left py-1 font-medium">端口</th>
                  <th className="text-right py-1 font-medium">ECN报文数</th>
                </tr>
              </thead>
              <tbody>
                {queueDropData.map(r => (
                  <tr key={r.rank} className="border-b border-slate-50">
                    <td className="py-1.5">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${r.rank === 1 ? 'bg-red-100 text-red-600' : r.rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{r.rank}</span>
                    </td>
                    <td className="py-1.5 text-slate-700 font-medium">{r.device}</td>
                    <td className="py-1.5 text-slate-500 font-mono text-[10px]">{r.port}</td>
                    <td className="py-1.5 text-right text-slate-600">{r.ecn.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panel 3: Headroom Buffer 利用率趋势图 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">Headroom Buffer 利用率趋势图</h3>
            <svg viewBox="0 0 300 140" className="w-full">
              {/* Grid lines */}
              <line x1="30" y1="10" x2="30" y2="110" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="110" x2="290" y2="110" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="30" y1="35" x2="290" y2="35" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="60" x2="290" y2="60" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="85" x2="290" y2="85" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              {/* Y-axis labels */}
              <text x="25" y="14" textAnchor="end" fontSize="8" fill="#94a3b8">100%</text>
              <text x="25" y="39" textAnchor="end" fontSize="8" fill="#94a3b8">75%</text>
              <text x="25" y="64" textAnchor="end" fontSize="8" fill="#94a3b8">50%</text>
              <text x="25" y="89" textAnchor="end" fontSize="8" fill="#94a3b8">25%</text>
              <text x="25" y="114" textAnchor="end" fontSize="8" fill="#94a3b8">0%</text>
              {/* Orange threshold line */}
              <line x1="30" y1="45" x2="290" y2="45" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" />
              <text x="292" y="48" fontSize="7" fill="#f59e0b">阈值</text>
              {/* Green area fill */}
              <path d="M30,100 L80,92 L130,85 L180,78 L210,70 L240,65 L270,72 L290,68 L290,110 L30,110 Z" fill="#10b981" fillOpacity="0.15" />
              <path d="M30,100 L80,92 L130,85 L180,78 L210,70 L240,65 L270,72 L290,68" fill="none" stroke="#10b981" strokeWidth="2" />
              {/* X-axis time labels */}
              <text x="30" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">00:00</text>
              <text x="95" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">04:00</text>
              <text x="160" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">08:00</text>
              <text x="225" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">12:00</text>
              <text x="290" y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">16:00</text>
            </svg>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Panel 4: 设备资源统计 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">设备资源统计</h3>
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28 * 0.88} strokeDashoffset="0"
                    strokeLinecap="round" transform="rotate(-90 32 32)" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28 * 0.12} strokeDashoffset={-2 * Math.PI * 28 * 0.88}
                    strokeLinecap="round" transform="rotate(-90 32 32)" />
                  <text x="32" y="30" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">{site.deviceCount || 68}</text>
                  <text x="32" y="40" textAnchor="middle" fontSize="7" fill="#94a3b8">总数</text>
                </svg>
              </div>
              <div className="flex-1 space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">设备总数</span><span className="font-bold text-slate-800">{site.deviceCount || 68}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">设备在线数</span><span className="font-bold text-emerald-600">60</span></div>
                <div className="flex justify-between"><span className="text-slate-500">设备在线率</span><span className="font-bold text-emerald-600">88%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">设备离线数</span><span className="font-bold text-slate-600">8</span></div>
                <div className="flex justify-between"><span className="text-slate-500">异常设备数</span><span className="font-bold text-red-500">15</span></div>
              </div>
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mb-2">设备类型</div>
            <div className="space-y-1.5">
              {[
                { l: 'Spine', c: 16, cl: 'bg-indigo-500' },
                { l: 'Leaf', c: 32, cl: 'bg-emerald-500' },
                { l: 'Border Leaf', c: 12, cl: 'bg-amber-500' },
                { l: 'Other', c: 8, cl: 'bg-slate-400' },
              ].map(r => (
                <div key={r.l} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-16 text-right">{r.l}</span>
                  <div className="flex-1 bg-slate-100 h-4 rounded overflow-hidden">
                    <div className={`h-4 rounded ${r.cl} flex items-center justify-end pr-1.5`} style={{ width: `${(r.c / 32) * 100}%` }}>
                      <span className="text-[9px] text-white font-medium">{r.c}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 5: ECN报文数Top5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-slate-800">ECN报文数Top5</h3>
              <div className="flex gap-0.5">
                {(['交换机', '网卡'] as const).map(t => (
                  <button key={t} onClick={() => setEcnTab(t)} className={`text-[10px] px-2.5 py-0.5 rounded ${ecnTab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t}</button>
                ))}
              </div>
            </div>
            {ecnTab === '交换机' ? (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                    <th className="text-left py-1 font-medium w-8">#</th>
                    <th className="text-left py-1 font-medium">设备名</th>
                    <th className="text-left py-1 font-medium">端口</th>
                    <th className="text-right py-1 font-medium">ECN报文数</th>
                  </tr>
                </thead>
                <tbody>
                  {ecnSwitchData.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1.5"><span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span></td>
                      <td className="py-1.5 text-slate-700 font-medium">{r.device}</td>
                      <td className="py-1.5 text-slate-500 font-mono text-[10px]">{r.port}</td>
                      <td className="py-1.5 text-right text-slate-600">{r.ecn.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                    <th className="text-left py-1 font-medium w-8">#</th>
                    <th className="text-left py-1 font-medium">设备名</th>
                    <th className="text-left py-1 font-medium">网卡名称</th>
                    <th className="text-right py-1 font-medium">ECN报文数</th>
                  </tr>
                </thead>
                <tbody>
                  {ecnNicData.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1.5"><span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span></td>
                      <td className="py-1.5 text-slate-700 font-medium">{r.device}</td>
                      <td className="py-1.5 text-slate-500 font-mono text-[10px]">{r.nic}</td>
                      <td className="py-1.5 text-right text-slate-600">{r.ecn.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Panel 6: 网络拥塞趋势图 + ECN报文数Top5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">网络拥塞趋势图</h3>
            <svg viewBox="0 0 280 140" className="w-full">
              <line x1="25" y1="130" x2="270" y2="130" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="25" y1="10" x2="25" y2="130" stroke="#e2e8f0" strokeWidth="1" />
              {/* Grid lines */}
              <line x1="25" y1="40" x2="270" y2="40" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="25" y1="70" x2="270" y2="70" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="25" y1="100" x2="270" y2="100" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
              {/* Line 1 - blue */}
              <polyline points="25,110 70,95 115,85 160,65 205,70 250,50 270,40" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              {/* Line 2 - green */}
              <polyline points="25,105 70,98 115,90 160,78 205,82 250,68 270,58" fill="none" stroke="#10b981" strokeWidth="1.5" />
              {/* Line 3 - orange */}
              <polyline points="25,118 70,108 115,102 160,92 205,95 250,88 270,80" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="25" y="142" fontSize="7" fill="#94a3b8">00:00</text>
              <text x="115" y="142" fontSize="7" fill="#94a3b8">08:00</text>
              <text x="205" y="142" fontSize="7" fill="#94a3b8">16:00</text>
              <text x="260" y="142" fontSize="7" fill="#94a3b8">24:00</text>
            </svg>
          </div>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Panel 7: 资产负载排名 TOP5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-slate-800">资产负载排名（TOP 5）</h3>
              <div className="flex gap-0.5">
                {(['CPU', '内存', '温度'] as const).map(t => (
                  <button key={t} onClick={() => setLoadTab(t)} className={`text-[10px] px-2 py-0.5 rounded ${loadTab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t}</button>
                ))}
              </div>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                  <th className="text-left py-1 font-medium w-6">排名</th>
                  <th className="text-left py-1 font-medium">设备名</th>
                  <th className="text-left py-1 font-medium">IP</th>
                  <th className="text-left py-1 font-medium w-28">当前利用率</th>
                </tr>
              </thead>
              <tbody>
                {loadData.map(a => (
                  <tr key={a.rank} className="border-b border-slate-50">
                    <td className="py-1.5">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${a.rank === 1 ? 'bg-red-100 text-red-600' : a.rank === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{a.rank}</span>
                    </td>
                    <td className="py-1.5 text-slate-700 font-medium">{a.name}</td>
                    <td className="py-1.5 text-slate-500 font-mono text-[10px]">{a.ip}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full ${a.c}`} style={{ width: `${a.util}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-600 w-7 text-right">{a.util}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panel 8: 告警汇总 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">告警汇总</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-500">12</div>
                <div className="text-[10px] text-slate-600 mt-1">严重告警</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">34</div>
                <div className="text-[10px] text-slate-600 mt-1">重要告警</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">89</div>
                <div className="text-[10px] text-slate-600 mt-1">一般告警</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">156</div>
                <div className="text-[10px] text-slate-600 mt-1">提示告警</div>
              </div>
            </div>
          </div>

          {/* Panel 9: Events */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-slate-800">Events</h3>
              <select
                value={evtFilter}
                onChange={e => setEvtFilter(e.target.value)}
                className="text-[10px] border border-slate-200 rounded px-2 py-1 bg-white text-slate-600"
              >
                <option value="All">All</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="MAJOR">MAJOR</option>
                <option value="MINOR">MINOR</option>
                <option value="WARNING">WARNING</option>
              </select>
            </div>
            <div className="space-y-2">
              {filteredEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] bg-slate-50 rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${e.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-400 font-mono text-[10px]">{e.time}</span>
                      <span className="text-slate-500 text-[10px]">{e.site}</span>
                    </div>
                    <div className="text-slate-700">{e.msg}</div>
                  </div>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center text-[11px] text-slate-400 py-4">暂无匹配事件</div>
              )}
            </div>
          </div>
        </div>
      </Wrap>
    );
  }

  // 2. TOPOLOGY
  if (feature === 'topology') {
    return <GlobalTopology site={site} />;
  }

  // 3. UNDERLAY — BGP Underlay Config
  if (feature === 'underlay') {
    return (
      <Wrap>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">BGP <span className="text-[#0ABAB5]">Underlay</span></h1>
            <p className="text-xs text-slate-400 mt-1">eBGP underlay peering, loopbacks & OSPF areas</p>
          </div>
          <button className="px-5 py-2 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Add Peer
          </button>
        </div>

        {/* BGP Neighbors */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-[10px] font-black text-[#0ABAB5] uppercase tracking-widest">BGP Neighbor Table</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-5 py-3">Neighbor</th><th className="px-5 py-3">Peer IP</th><th className="px-5 py-3">Local AS</th><th className="px-5 py-3">Remote AS</th><th className="px-5 py-3">State</th><th className="px-5 py-3">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
              {[
                { name: 'Spine-01', ip: '10.0.0.1', las: '65001', ras: '65100', state: 'Established', up: '14d 6h' },
                { name: 'Spine-02', ip: '10.0.0.2', las: '65001', ras: '65100', state: 'Established', up: '14d 6h' },
                { name: 'Spine-03', ip: '10.0.0.3', las: '65001', ras: '65100', state: 'Established', up: '7d 2h' },
                { name: 'Spine-04', ip: '10.0.0.4', las: '65001', ras: '65100', state: 'Idle', up: '—' },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-black">{r.name}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{r.ip}</td>
                  <td className="px-5 py-3">{r.las}</td>
                  <td className="px-5 py-3">{r.ras}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${r.state === 'Established' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{r.state}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{r.up}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Loopback Assignments */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-[#0ABAB5] uppercase tracking-widest">Loopback Assignments</h3>
            </div>
            <div className="px-5 py-3 space-y-2">
              {[
                { node: 'Spine-01', lo0: '10.255.0.1/32', lo1: '10.255.1.1/32' },
                { node: 'Spine-02', lo0: '10.255.0.2/32', lo1: '10.255.1.2/32' },
                { node: 'Leaf-01', lo0: '10.255.0.11/32', lo1: '10.255.1.11/32' },
                { node: 'Leaf-02', lo0: '10.255.0.12/32', lo1: '10.255.1.12/32' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-black text-slate-700">{r.node}</span>
                  <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <span>Lo0: {r.lo0}</span>
                    <span>Lo1: {r.lo1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OSPF Areas */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-[#0ABAB5] uppercase tracking-widest">OSPF Areas</h3>
            </div>
            <div className="px-5 py-3 space-y-2">
              {[
                { area: '0.0.0.0', type: 'Backbone', interfaces: 8, neighbors: 4 },
                { area: '0.0.0.1', type: 'Stub', interfaces: 12, neighbors: 6 },
                { area: '0.0.0.2', type: 'NSSA', interfaces: 6, neighbors: 3 },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-xs font-black text-slate-700">Area {r.area}</span>
                    <span className="ml-2 text-[9px] font-black text-slate-400 uppercase">{r.type}</span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-slate-500">
                    <span>{r.interfaces} intf</span>
                    <span>{r.neighbors} nbrs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Wrap>
    );
  }

  // 4. OVERLAY — VNI Overlay
  if (feature === 'overlay') {
    return (
      <Wrap>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">VNI <span className="text-[#0ABAB5]">Overlay</span></h1>
            <p className="text-xs text-slate-400 mt-1">VXLAN network identifier mapping & VTEP status</p>
          </div>
          <button className="px-5 py-2 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Add VNI
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-[10px] font-black text-[#0ABAB5] uppercase tracking-widest">VNI Table</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-5 py-3">VNI ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">VTEP Count</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
              {[
                { id: '10001', name: 'Production-Web', type: 'L2', vtep: 12, status: 'Active' },
                { id: '10002', name: 'Production-DB', type: 'L2', vtep: 8, status: 'Active' },
                { id: '10003', name: 'Development', type: 'L2', vtep: 6, status: 'Active' },
                { id: '50001', name: 'Tenant-A-VRF', type: 'L3', vtep: 12, status: 'Active' },
                { id: '50002', name: 'Tenant-B-VRF', type: 'L3', vtep: 8, status: 'Active' },
                { id: '10004', name: 'DMZ-Isolation', type: 'L2', vtep: 4, status: 'Warning' },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-black text-[#0ABAB5]">{r.id}</td>
                  <td className="px-5 py-3">{r.name}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${r.type === 'L3' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>{r.type}</span>
                  </td>
                  <td className="px-5 py-3">{r.vtep}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${r.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Wrap>
    );
  }

  // 5. VIRTUALIZATION — Virtual Fabric Segments
  if (feature === 'virtualization') {
    return (
      <Wrap>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Virtual <span className="text-[#0ABAB5]">Fabric</span></h1>
            <p className="text-xs text-slate-400 mt-1">Overlay management (VXLAN/EVPN)</p>
          </div>
          <button className="px-5 py-2 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> New Segment
          </button>
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit">
          <button className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#0ABAB5] text-white shadow-sm flex items-center gap-1.5"><Globe size={12}/> VXLAN (6)</button>
          <button className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Layers size={12}/> VLAN (3)</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SegmentCard name="Production-Web" vni="10001" vtep={12} members={48} traffic="2.4 Tbps" trend="+12%" />
          <SegmentCard name="Production-DB" vni="10002" vtep={8} members={24} traffic="1.8 Tbps" trend="+5%" />
          <SegmentCard name="Development" vni="10003" vtep={6} members={32} traffic="0.6 Tbps" trend="-3%" />
          <SegmentCard name="Management" vni="10004" vtep={12} members={16} traffic="0.2 Tbps" trend="0%" />
          <SegmentCard name="DMZ-Isolation" vni="10005" vtep={4} members={8} traffic="0.4 Tbps" trend="+28%" warning />
          <SegmentCard name="Backup-Core" vni="10006" vtep={4} members={12} traffic="0.8 Tbps" trend="+8%" />
        </div>
      </Wrap>
    );
  }

  // 6. TRAFFIC — Traffic Analytics
  if (feature === 'traffic') {
    return (
      <Wrap>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Traffic <span className="text-[#0ABAB5]">Analytics</span></h1>
            <p className="text-xs text-slate-400 mt-1">Spine-leaf throughput & physical link load</p>
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl">
            <button className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#0ABAB5] text-white shadow-sm">Fabric View</button>
            <button className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">Interface View</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LayerThroughput label="Spine Layer" value="4.8 Tbps" percentage={72} color="bg-indigo-500" />
          <LayerThroughput label="Leaf Layer" value="12.4 Tbps" percentage={65} color="bg-blue-500" />
          <LayerThroughput label="Border Layer" value="2.1 Tbps" percentage={45} color="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ECMP Paths */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Network size={14}/> ECMP Path Status</h3>
            <div className="space-y-3">
              <EcmpThroughput label="Path 1" value="1.25 Tbps" percentage={26} color="bg-indigo-400" />
              <EcmpThroughput label="Path 2" value="1.15 Tbps" percentage={24} color="bg-blue-400" />
              <EcmpThroughput label="Path 3" value="1.20 Tbps" percentage={25} color="bg-emerald-400" />
              <EcmpThroughput label="Path 4" value="1.20 Tbps" percentage={25} color="bg-amber-400" />
            </div>
          </div>

          {/* Top Interfaces */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart3 size={14}/> Top Utilization</h3>
            <div className="space-y-2">
              <TopInterface rank={1} name="Leaf-02" port="Eth1/49" rate="94 Gbps" percentage={94} type="TX" />
              <TopInterface rank={2} name="Spine-01" port="Eth1/1" rate="89 Gbps" percentage={89} type="RX" color="bg-amber-500" />
              <TopInterface rank={3} name="Leaf-01" port="Eth1/50" rate="85 Gbps" percentage={85} type="TX" color="bg-amber-500" />
              <TopInterface rank={4} name="Border-01" port="Eth1/1" rate="78 Gbps" percentage={78} type="TX" color="bg-emerald-500" />
            </div>
          </div>
        </div>
      </Wrap>
    );
  }

  // 7. PROFILES — Config Blueprints
  if (feature === 'profiles') {
    return (
      <Wrap>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fabric <span className="text-[#0ABAB5]">Blueprints</span></h1>
            <p className="text-xs text-slate-400 mt-1">Policy provisioning & template lifecycle</p>
          </div>
          <button className="px-5 py-2 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Create Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BlueprintCard name="Spine BGP Underlay" category="Spine" version="v2.1" devices={4} time="2d ago" tags={['BGP', 'AS-65001']} color="border-l-indigo-500" />
          <BlueprintCard name="Leaf VXLAN EVPN" category="Leaf" version="v3.0" devices={12} time="1w ago" tags={['VXLAN', 'VNI']} color="border-l-blue-500" />
          <BlueprintCard name="Border PE Transit" category="Border" version="v1.5" devices={2} time="3d ago" tags={['NAT', 'External']} color="border-l-amber-500" />
          <BlueprintCard name="Leaf QoS Policy" category="Leaf" version="v2.0" devices={12} time="5d ago" tags={['DSCP', 'Cos']} draft color="border-l-blue-400 opacity-80" />
          <BlueprintCard name="Spine ECMP Tweak" category="Spine" version="v1.2" devices={4} time="1d ago" tags={['Entropy', 'L4']} color="border-l-indigo-400" />
          <BlueprintCard name="Border Firewall" category="Border" version="v2.3" devices={2} time="4d ago" tags={['ACL', 'Security']} color="border-l-red-500" />
        </div>
      </Wrap>
    );
  }

  // 8. CONFIG — Tenant Policy
  if (feature === 'config') {
    return (
      <Wrap>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tenant <span className="text-[#0ABAB5]">Policy</span></h1>
            <p className="text-xs text-slate-400 mt-1">Multi-tenant VRF isolation & route target management</p>
          </div>
          <button className="px-5 py-2 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> Add Tenant
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-[10px] font-black text-[#0ABAB5] uppercase tracking-widest">Tenant Table</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-5 py-3">Tenant</th><th className="px-5 py-3">VRF</th><th className="px-5 py-3">VNI Range</th><th className="px-5 py-3">Route Target</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
              {[
                { name: 'Production', vrf: 'VRF-PROD', vni: '10001–10050', rt: '65001:100', status: 'Active' },
                { name: 'Development', vrf: 'VRF-DEV', vni: '10051–10080', rt: '65001:200', status: 'Active' },
                { name: 'DMZ', vrf: 'VRF-DMZ', vni: '10081–10090', rt: '65001:300', status: 'Active' },
                { name: 'Management', vrf: 'VRF-MGMT', vni: '10091–10100', rt: '65001:400', status: 'Active' },
                { name: 'Guest', vrf: 'VRF-GUEST', vni: '10101–10110', rt: '65001:500', status: 'Disabled' },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-black">{r.name}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{r.vrf}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{r.vni}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{r.rt}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${r.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Wrap>
    );
  }

  return null;
};

// ─── Sub-components ───

const LegendRow = ({ label, value, color }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-black text-slate-800">{value}</span>
  </div>
);

const EcmpBar = ({ label, value }: any) => (
  <div className="flex items-center gap-3">
    <span className="text-[9px] font-black text-slate-400 uppercase w-10">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-[#0ABAB5] rounded-full" style={{ width: `${value}%` }} />
    </div>
    <span className="text-[10px] font-black text-slate-500 w-8">{value}%</span>
  </div>
);

const ComplianceRow = ({ label, value }: any) => (
  <div>
    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-0.5">
      <span>{label}</span>
      <span className="text-slate-800">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const AuditCard = ({ title, user, time, icon }: any) => (
  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-white hover:border-[#0ABAB5]/30 transition-all cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-black text-slate-800">{title}</p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user} • {time}</p>
      </div>
    </div>
    <ChevronRight size={12} className="text-slate-300" />
  </div>
);

const SegmentCard = ({ name, vni, vtep, members, traffic, trend, warning = false }: any) => (
  <div className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${warning ? 'border-amber-200' : 'border-slate-200'}`}>
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${warning ? 'bg-amber-50 text-amber-500' : 'bg-[#0ABAB5]/10 text-[#0ABAB5]'}`}><Globe size={16} /></div>
        <div>
          <h4 className="text-base font-black text-slate-900 leading-none mb-0.5">{name}</h4>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VNI: <span className="text-[#0ABAB5] font-mono">{vni}</span></p>
        </div>
      </div>
      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${warning ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{warning ? 'Warning' : 'Active'}</span>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-3">
      <MetricMini label="VTEP" value={vtep} />
      <MetricMini label="Members" value={members} />
      <MetricMini label="Throughput" value={traffic} color="text-[#0ABAB5]" />
    </div>
    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trend</p>
      <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-500' : trend.startsWith('-') ? 'text-red-500' : 'text-slate-400'}`}>{trend}</span>
    </div>
  </div>
);

const MetricMini = ({ label, value, color = 'text-slate-800' }: any) => (
  <div className="text-center p-2 bg-slate-50 rounded-lg">
    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{label}</p>
    <p className={`text-sm font-black tracking-tight ${color}`}>{value}</p>
  </div>
);

const LayerThroughput = ({ label, value, percentage, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded-md ${color} text-white`}><TrendingUp size={12}/></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] font-black text-slate-900 uppercase">{value}</span>
    </div>
    <div className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{percentage}%</div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

const EcmpThroughput = ({ label, value, percentage, color }: any) => (
  <div>
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 px-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-400">{value} <span className="text-slate-800 ml-1">{percentage}%</span></span>
    </div>
    <div className="h-3 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
      <div className={`h-full ${color} rounded-r-lg`} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

const TopInterface = ({ rank, name, port, rate, percentage, type, color = 'bg-[#0ABAB5]' }: any) => (
  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition-all">
    <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[10px] font-black text-[#0ABAB5]">#{rank}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-black text-slate-800">{name}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase">{port}</p>
    </div>
    <div className="text-right w-16">
      <p className="text-[10px] font-bold text-slate-600">{rate}</p>
      <p className="text-[8px] font-black text-slate-400 uppercase">{type}</p>
    </div>
    <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
    </div>
    <span className="text-[10px] font-black text-slate-800 w-8 text-right">{percentage}%</span>
  </div>
);

const BlueprintCard = ({ name, category, version, devices, time, tags, draft = false, color }: any) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 ${color}`}>
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
        {category === 'Spine' ? <Database size={16} /> : category === 'Leaf' ? <Box size={16} /> : <Share2 size={16} />}
      </div>
      <div className="text-right">
        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${draft ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
          {draft ? 'Draft' : 'Synced'}
        </span>
        <p className="text-[9px] font-bold text-slate-400 mt-1">{version}</p>
      </div>
    </div>
    <h3 className="text-base font-black text-slate-900 tracking-tight mb-3">{name}</h3>
    <div className="flex flex-wrap gap-1 mb-3">
      {tags.map((t: string) => (
        <span key={t} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100">{t}</span>
      ))}
    </div>
    <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-slate-400">
      <div className="flex items-center gap-1.5">
        <Monitor size={12} />
        <span className="text-[9px] font-black uppercase tracking-widest">{devices} Nodes</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock size={12} />
        <span className="text-[9px] font-black uppercase tracking-widest">{time}</span>
      </div>
    </div>
  </div>
);

export default DCFabricApp;

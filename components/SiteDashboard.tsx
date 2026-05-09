import React, { useState } from 'react';
import { Site } from '../types';
import {
  AlertTriangle, AlertCircle, Bell, Info, ChevronDown,
  Server, Cpu, MemoryStick, Thermometer, Activity,
  Shield, Zap, Link2, ArrowRightLeft, AlertOctagon
} from 'lucide-react';

interface SiteDashboardProps {
  site: Site;
}

/* ── SVG Donut Ring ─────────────────────────────────────────── */
const HealthRing = ({ score }: { score: number }) => {
  const size = 140;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - filled}
        strokeLinecap="round"
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        className="text-3xl font-bold"
        fill={color}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {score}
      </text>
    </svg>
  );
};

/* ── Progress Bar ───────────────────────────────────────────── */
const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
    <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
  </div>
);

/* ── Main Component ─────────────────────────────────────────── */
export default function SiteDashboard({ site }: SiteDashboardProps) {
  const [cpuTab, setCpuTab] = useState<'CPU' | '内存' | '温度'>('CPU');
  const [eventFilter, setEventFilter] = useState('All');
  const [eventDropdown, setEventDropdown] = useState('All');

  const healthScore = site.health ?? 100;
  const healthColor = healthScore >= 90 ? 'text-emerald-500' : healthScore >= 70 ? 'text-amber-500' : 'text-red-500';

  const alarmData = [
    { label: '严重告警', count: 12, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertOctagon className="w-5 h-5 text-red-500" /> },
    { label: '重要告警', count: 34, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', icon: <AlertTriangle className="w-5 h-5 text-orange-500" /> },
    { label: '一般告警', count: 89, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: <Bell className="w-5 h-5 text-yellow-500" /> },
    { label: '提示告警', count: 156, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info className="w-5 h-5 text-blue-500" /> },
  ];

  const eventFilters = ['All', 'CRITICAL', 'MAJOR', 'MINOR', 'WARNING'];

  const events = [
    { dot: 'bg-red-500', shape: 'circle', time: '2026-04-02 07:43:51', site: 'WuHan-DC-01', msg: 'Core-Switch-01交换机端口Down' },
    { dot: 'bg-orange-500', shape: 'triangle', time: '2026-04-01 23:50:12', site: 'ShangHai-DC-01', msg: 'Core-Switch-01交换机CPU超过阈值' },
    { dot: 'bg-blue-500', shape: 'circle', time: '2026-04-01 23:50:12', site: 'ShangHai-DC-01', msg: 'Core-Switch-01交换机配置备份任务已完成' },
  ];

  const topAssets = [
    { rank: 1, name: 'Core-Switch-01', ip: '192.167.10.2', site: 'WuHan-DC-01', usage: 90, color: 'bg-red-500' },
    { rank: 2, name: 'Dist-Switch-A2', ip: '192.167.10.2', site: 'WuHan-DC-01', usage: 80, color: 'bg-orange-500' },
    { rank: 3, name: 'Cache-R-01', ip: '192.167.10.2', site: 'WuHan-DC-01', usage: 60, color: 'bg-blue-500' },
    { rank: 4, name: 'Dist-Switch-A2', ip: '192.167.10.2', site: 'WuHan-DC-01', usage: 60, color: 'bg-blue-500' },
    { rank: 5, name: 'Spine-Switch-01', ip: '192.167.10.2', site: 'WuHan-DC-01', usage: 60, color: 'bg-blue-500' },
  ];

  const deviceRoles = [
    { label: 'Spine', count: 8, color: 'bg-indigo-500' },
    { label: 'Leaf', count: 24, color: 'bg-emerald-500' },
    { label: 'Border', count: 2, color: 'bg-amber-500' },
    { label: 'Gateway', count: 2, color: 'bg-sky-500' },
  ];
  const maxRoleCount = Math.max(...deviceRoles.map(r => r.count));

  const portMetrics = [
    { label: '端口利用率', value: 72, color: 'bg-blue-500' },
    { label: '缓冲区使用率', value: 45, color: 'bg-emerald-500' },
    { label: 'CPU 利用率', value: 68, color: 'bg-amber-500' },
    { label: '内存利用率', value: 55, color: 'bg-purple-500' },
  ];

  const thresholdTop5 = [
    { name: 'Core-Switch-01', metric: 'CPU', value: '92%' },
    { name: 'Leaf-03', metric: '内存', value: '88%' },
    { name: 'Spine-02', metric: '端口', value: '85%' },
    { name: 'Leaf-07', metric: '缓冲区', value: '82%' },
    { name: 'Border-01', metric: 'CPU', value: '78%' },
  ];


  const congestionTriggerPorts = [
    { port: 'Leaf-03 Eth1/1', count: '342 次', type: 'PFC' },
    { port: 'Spine-02 Eth1/49', count: '289 次', type: 'PFC' },
    { port: 'Leaf-07 Eth1/12', count: '201 次', type: 'ECN' },
    { port: 'Core-01 Eth1/1', count: '178 次', type: 'ECN' },
    { port: 'Leaf-05 Eth1/24', count: '156 次', type: 'PFC' },
  ];

  const linkQualityTop5 = [
    { link: 'Leaf-03 → Spine-02', metric: '时延 4.8μs', status: '超阈值', color: 'text-red-500', bg: 'bg-red-50' },
    { link: 'Leaf-07 → Spine-01', metric: '误码 0.02%', status: '预警', color: 'text-orange-500', bg: 'bg-orange-50' },
    { link: 'Core-01 → Border-01', metric: '丢包 0.05%', status: '预警', color: 'text-orange-500', bg: 'bg-orange-50' },
    { link: 'Leaf-05 → Spine-03', metric: '时延 3.2μs', status: '关注', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { link: 'Leaf-12 → Spine-04', metric: '乱序 0.01%', status: '关注', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  const riskList = [
    { level: '严重', levelColor: 'text-red-500', levelBg: 'bg-red-50', desc: 'Spine-02 单链路运行，无冗余保护', impact: '影响 Pod-2 全部流量', time: '10分钟前', site: 'Frankfurt-DC' },
    { level: '严重', levelColor: 'text-red-500', levelBg: 'bg-red-50', desc: 'Leaf-03 PFC 风暴，持续反压', impact: '影响 Rack-C 算力节点', time: '15分钟前', site: 'WuHan-DC-01' },
    { level: '重要', levelColor: 'text-orange-500', levelBg: 'bg-orange-50', desc: 'Core-Switch-01 CPU 持续高于 90%', impact: '影响全站转发性能', time: '30分钟前', site: 'WuHan-DC-01' },
    { level: '重要', levelColor: 'text-orange-500', levelBg: 'bg-orange-50', desc: '链路中断 Leaf-07 ↔ Spine-01', impact: '影响 ECMP 负载均衡', time: '45分钟前', site: 'Frankfurt-DC' },
    { level: '一般', levelColor: 'text-yellow-600', levelBg: 'bg-yellow-50', desc: '误码率超阈值 Leaf-05 Eth1/24', impact: '影响 RoCE 流量质量', time: '1小时前', site: 'WuHan-DC-01' },
    { level: '一般', levelColor: 'text-yellow-600', levelBg: 'bg-yellow-50', desc: '算力节点 GPU-Server-12 网络不可达', impact: '影响 AI 训练任务', time: '2小时前', site: 'ShangHai-DC-01' },
  ];

  return (
    <div className="bg-slate-50 p-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* ═══ ROW 1: Overview + Alarms ═══ */}
        <div className="grid grid-cols-5 gap-5">

          {/* LEFT: 站点网络核心概览 (3/5 = 60%) */}
          <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-800 mb-4">站点网络核心概览</h3>
            <div className="flex items-center justify-between">
              {/* Left info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Server className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">数据中心场景</div>
                    <div className="text-sm font-medium text-slate-700">{site.name}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">运行状态</div>
                  <div className={`text-lg font-bold ${healthColor}`}>
                    {healthScore >= 90 ? '健康（Healthy）' : healthScore >= 70 ? '一般（Fair）' : '异常（Critical）'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500">设备总数</div>
                    <div className="text-lg font-bold text-slate-800">{site.deviceCount}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500">告警总数</div>
                    <div className="text-lg font-bold text-slate-800">{site.alertCount}</div>
                  </div>
                </div>
              </div>
              {/* Right ring */}
              <div className="flex-shrink-0 ml-6">
                <HealthRing score={healthScore} />
              </div>
            </div>
          </div>

          {/* RIGHT: 告警汇总 (2/5 = 40%) */}
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-[14px] font-bold text-slate-800 mb-3">告警汇总</h3>
            {/* 2x2 alarm grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {alarmData.map((a) => (
                <div key={a.label} className={`${a.bg} border ${a.border} rounded-lg p-3 flex items-center gap-2`}>
                  {a.icon}
                  <div>
                    <div className="text-xs text-slate-500">{a.label}</div>
                    <div className={`text-xl font-bold ${a.color}`}>{a.count}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Events section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Events</span>
                  <div className="relative">
                    <select
                      value={eventDropdown}
                      onChange={(e) => setEventDropdown(e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600 appearance-none pr-6"
                    >
                      <option>All</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="flex gap-1">
                  {eventFilters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setEventFilter(f)}
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        eventFilter === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {events.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    {e.shape === 'triangle' ? (
                      <div className="w-2 h-2 mt-1 flex-shrink-0" style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #f97316' }} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${e.dot}`} />
                    )}
                    <span className="text-slate-400">{e.time}</span>
                    <span className="text-slate-500">{e.site}</span>
                    <span className="text-slate-700">{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ═══ ROW 2: 资产负载排名 TOP 5 ═══ */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-slate-800">资产负载排名（TOP 5）</h3>
            <div className="flex gap-1">
              {(['CPU', '内存', '温度'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCpuTab(tab)}
                  className={`text-xs px-3 py-1 rounded ${
                    cpuTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left py-2 font-medium w-16">排名</th>
                <th className="text-left py-2 font-medium">设备名</th>
                <th className="text-left py-2 font-medium">IP</th>
                <th className="text-left py-2 font-medium">Site</th>
                <th className="text-left py-2 font-medium w-48">当前利用率</th>
              </tr>
            </thead>
            <tbody>
              {topAssets.map((a) => (
                <tr key={a.rank} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                      a.rank === 1 ? 'bg-red-100 text-red-600' :
                      a.rank === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {a.rank}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-700 font-medium">{a.name}</td>
                  <td className="py-2.5 text-slate-500">{a.ip}</td>
                  <td className="py-2.5 text-slate-500">{a.site}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full ${a.color}`} style={{ width: `${a.usage}%` }} />
                      </div>
                      <span className="text-xs text-slate-600 w-8 text-right">{a.usage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ═══ ROW 3: 无损网络设备总览 + 端口与资源水位 ═══ */}
        <div className="grid grid-cols-2 gap-5">

          {/* LEFT: 无损网络设备总览 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-800 mb-4">无损网络设备总览</h3>
            {/* Stats grid 2x3 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: '智算核心交换机', value: '4', unit: '台', color: 'text-blue-600' },
                { label: 'Leaf 交换机', value: '24', unit: '台', color: 'text-emerald-600' },
                { label: 'Spine 交换机', value: '8', unit: '台', color: 'text-indigo-600' },
                { label: '在线率', value: '97.2', unit: '%', color: 'text-emerald-600' },
                { label: '离线设备', value: '1', unit: '台', color: 'text-slate-600' },
                { label: '异常设备', value: '2', unit: '台', color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>
                    {s.value}<span className="text-xs font-normal text-slate-400 ml-1">{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* 设备角色分类 bar chart */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-3">设备角色分类</div>
              <div className="space-y-2.5">
                {deviceRoles.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-14 text-right">{r.label}</span>
                    <div className="flex-1 bg-slate-100 h-5 rounded overflow-hidden">
                      <div
                        className={`h-5 rounded ${r.color} flex items-center justify-end pr-2`}
                        style={{ width: `${(r.count / maxRoleCount) * 100}%` }}
                      >
                        <span className="text-[10px] text-white font-medium">{r.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: 端口与资源水位 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-800 mb-4">端口与资源水位</h3>
            {/* 4 metric rows */}
            <div className="space-y-4 mb-5">
              {portMetrics.map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{m.label}</span>
                    <span className="text-xs font-bold text-slate-700">{m.value}%</span>
                  </div>
                  <ProgressBar value={m.value} color={m.color} />
                </div>
              ))}
            </div>
            {/* 超阈值设备 TOP5 */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-3">超阈值设备 TOP5</div>
              <div className="space-y-2">
                {thresholdTop5.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-4">{i + 1}.</span>
                      <span className="text-slate-700 font-medium">{t.name}</span>
                    </div>
                    <span className="text-slate-500">{t.metric} <span className="font-bold text-slate-700">{t.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ═══ ROW 4: 拥塞与反压管控 + 链路质量指标 ═══ */}
        <div className="grid grid-cols-2 gap-5">

          {/* LEFT: 拥塞与反压管控 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-800 mb-4">拥塞与反压管控</h3>
            {/* Key metrics row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">PFC 反压触发</div>
                <div className="text-lg font-bold text-indigo-600">1,247<span className="text-xs font-normal text-slate-400 ml-1">次</span></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">ECN 标记</div>
                <div className="text-lg font-bold text-amber-600">3,891<span className="text-xs font-normal text-slate-400 ml-1">次</span></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">网络拥塞事件</div>
                <div className="text-lg font-bold text-red-500">156<span className="text-xs font-normal text-slate-400 ml-1">次</span></div>
              </div>
            </div>
            {/* 触发端口 TOP5 */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-600 mb-3">触发端口 TOP5</div>
              <div className="space-y-2">
                {congestionTriggerPorts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-4">{i + 1}.</span>
                      <span className="text-slate-700 font-medium">{p.port}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{p.count}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.type === 'PFC' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                      }`}>{p.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Warning */}
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 font-medium">持续反压端口: 2 个</span>
            </div>
          </div>

          {/* RIGHT: 链路质量指标 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-800 mb-4">链路质量指标</h3>
            {/* Key metrics row */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: '平均时延', value: '1.2', unit: 'μs' },
                { label: '乱序率', value: '0.003', unit: '%' },
                { label: '丢包率', value: '0.001', unit: '%' },
                { label: '误码率', value: '0.0001', unit: '%' },
              ].map((m) => (
                <div key={m.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                  <div className="text-base font-bold text-slate-800">{m.value}<span className="text-xs font-normal text-slate-400 ml-0.5">{m.unit}</span></div>
                </div>
              ))}
            </div>
            {/* 性能劣化链路 TOP5 */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-3">性能劣化链路 TOP5</div>
              <div className="space-y-2">
                {linkQualityTop5.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-4">{i + 1}.</span>
                      <span className="text-slate-700 font-medium">{l.link}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{l.metric}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${l.bg} ${l.color}`}>{l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ═══ ROW 5: 高危风险清单 ═══ */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-slate-800 mb-4">高危风险清单</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left py-2 font-medium w-20">风险等级</th>
                <th className="text-left py-2 font-medium">风险描述</th>
                <th className="text-left py-2 font-medium">影响范围</th>
                <th className="text-left py-2 font-medium w-24">发现时间</th>
                <th className="text-left py-2 font-medium w-28">站点</th>
              </tr>
            </thead>
            <tbody>
              {riskList.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${r.levelBg} ${r.levelColor}`}>
                      {r.level}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-700">{r.desc}</td>
                  <td className="py-2.5 text-slate-500">{r.impact}</td>
                  <td className="py-2.5 text-slate-400 text-xs">{r.time}</td>
                  <td className="py-2.5 text-slate-500 text-xs">{r.site}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
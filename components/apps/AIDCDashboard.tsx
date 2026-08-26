import React, { useState } from 'react';
import { ChevronDown, Copy, Download, FilePlus, LayoutDashboard, Maximize2, MoreHorizontal, Star, Trash2, Upload } from 'lucide-react';
import { Site } from '../../types';

type CardProps = { title: string; action?: React.ReactNode; children: React.ReactNode };
const Card = ({ title, action, children }: CardProps) => (
  <section className="min-h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="flex h-11 items-center justify-between border-b border-slate-100 px-4">
      <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>{action}
    </header>
    <div className="h-[calc(100%-44px)] p-4">{children}</div>
  </section>
);

const DashboardToolbar = () => {
  const [viewOpen, setViewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [view, setView] = useState('AIDC Overview');
  const views = ['AIDC Overview', 'RoCE Performance', 'Fabric Health'];
  return <div className="flex h-9 flex-shrink-0 items-center justify-between">
    <div className="flex items-center gap-3 text-xs text-slate-500"><span>Views:</span><div className="relative">
      <button onClick={() => setViewOpen(!viewOpen)} className="flex min-w-[150px] items-center justify-between gap-6 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700">{view}<ChevronDown size={12}/></button>
      {viewOpen && <div className="absolute left-0 top-full z-30 mt-1 min-w-[170px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">{views.map(item => <button key={item} onClick={() => { setView(item); setViewOpen(false); }} className={`block w-full px-3 py-2 text-left text-xs hover:bg-slate-50 ${item === view ? 'bg-blue-50 font-semibold text-blue-600' : 'text-slate-600'}`}>{item}</button>)}</div>}
    </div></div>
    <div className="flex items-center gap-0.5 text-slate-400">
      <button className="rounded p-1.5 hover:bg-slate-100" title="New dashboard"><FilePlus size={15}/></button>
      <button className="rounded p-1.5 hover:bg-slate-100" title="Add panel"><LayoutDashboard size={15}/></button>
      <button className="rounded p-1.5 hover:bg-slate-100" title="Fullscreen"><Maximize2 size={15}/></button>
      <div className="relative"><button onClick={() => setMoreOpen(!moreOpen)} className="rounded p-1.5 hover:bg-slate-100"><MoreHorizontal size={15}/></button>
        {moreOpen && <div className="absolute right-0 top-full z-30 mt-1 min-w-[150px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">{[{i:<Star size={12}/>,l:'Set as default'},{i:<Copy size={12}/>,l:'Copy'},{i:<Trash2 size={12}/>,l:'Delete'},{i:<Download size={12}/>,l:'Export JSON'},{i:<Download size={12}/>,l:'Export JPEG'},{i:<Upload size={12}/>,l:'Import'}].map(x => <button key={x.l} onClick={() => setMoreOpen(false)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">{x.i}{x.l}</button>)}</div>}
      </div>
    </div>
  </div>;
};

const SimpleLineChart = ({ variant = 'green', labels = true }: { variant?: 'green' | 'blue'; labels?: boolean }) => {
  const first = variant === 'green' ? '#42c7ad' : '#4cc9c0';
  const second = variant === 'green' ? '#696de5' : '#6875df';
  return <svg viewBox="0 0 560 170" className="h-full min-h-[125px] w-full" preserveAspectRatio="none">
    {[25,55,85,115,145].map(y => <line key={y} x1="38" y1={y} x2="550" y2={y} stroke="#eef1f5" strokeWidth="1"/>)}
    {labels && ['10:08','10:09','10:10','10:11','10:12','10:13','10:14','10:15','10:16','10:17'].map((x,i) => <text key={x} x={40+i*56} y="165" fontSize="8" fill="#94a3b8">{x}</text>)}
    <path d="M38 118 C70 82 95 92 125 100 S178 60 215 93 S267 68 305 101 S360 58 402 80 S458 55 550 75" fill="none" stroke={first} strokeWidth="2"/>
    <path d="M38 132 C80 118 100 116 135 124 S190 85 225 112 S280 100 315 124 S375 85 420 108 S480 91 550 105" fill="none" stroke={second} strokeWidth="2"/>
    <path d="M38 118 C70 82 95 92 125 100 S178 60 215 93 S267 68 305 101 S360 58 402 80 S458 55 550 75 L550 145 L38 145Z" fill={first} opacity=".08"/>
  </svg>;
};

const DeviceStatistics = ({ site }: { site: Site }) => (
  <Card title="Device Statistics"><div className="flex h-full flex-col justify-between">
    <div className="flex items-center justify-around"><div className="relative h-24 w-36 overflow-hidden">
      <svg viewBox="0 0 140 90" className="h-full w-full"><path d="M15 75 A55 55 0 0 1 125 75" fill="none" stroke="#eef1f4" strokeWidth="14"/><path d="M15 75 A55 55 0 0 1 116 43" fill="none" stroke="#43c9b5" strokeWidth="14"/><text x="70" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill="#43c9b5">88%</text><text x="70" y="78" textAnchor="middle" fontSize="9" fill="#64748b">Online Rate</text></svg>
    </div><div className="grid grid-cols-3 gap-10 text-center"><div><b className="text-xl text-slate-700">{site.deviceCount || 68}</b><p className="text-[10px] text-slate-400">Total Devices</p></div><div><b className="text-xl text-emerald-400">60</b><p className="text-[10px] text-slate-400">Online Devices</p></div><div><b className="text-xl text-slate-300">8</b><p className="text-[10px] text-slate-400">Offline Devices</p></div></div></div>
    <div><div className="mb-1 flex text-[10px] text-slate-500"><span className="w-[16%]">10</span><span className="w-[47%]">32</span><span>20</span></div><div className="flex h-1.5 overflow-hidden rounded-full"><i className="w-[16%] bg-emerald-400"/><i className="w-[47%] bg-indigo-500"/><i className="w-[30%] bg-sky-400"/></div><div className="mt-2 flex text-[10px] text-slate-400"><span className="w-[16%]">Spine</span><span className="w-[47%]">Leaf</span><span>Other</span></div></div>
  </div></Card>
);

const TrafficStratification = () => <Card title="Traffic Stratification" action={<div className="flex gap-2"><button className="rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">fabric-prod⌄</button><button className="rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">24H⌄</button></div>}>
  <div className="space-y-5 pt-2">{[
    {name:'Spine',sub:'8 Spine',pct:45,bw:'1.2 Tbps/2.5 Tbps',ports:'1',color:'bg-emerald-400'},
    {name:'Leaf',sub:'32 Leafs',pct:75,bw:'3.6 Tbps/4.8 Tbps',ports:'3',color:'bg-amber-400'},
    {name:'Server',sub:'47 Users',pct:90,bw:'8.5 Tbps/9.5 Tbps',ports:'2',color:'bg-red-400'},
  ].map(row => <div key={row.name} className="grid grid-cols-[55px_1fr_145px_70px] items-center gap-3"><div><b className="text-xs text-slate-700">{row.name}</b><p className="text-[9px] text-slate-400">{row.sub}</p></div><div><span className="text-[10px] text-slate-500">{row.pct}% <em className="not-italic text-slate-300">Aggregated Bandwidth</em></span><div className="mt-1 h-1 rounded bg-slate-100"><div className={`h-1 rounded ${row.color}`} style={{width:`${row.pct}%`}}/></div></div><span className="text-[10px] text-slate-500">{row.bw}</span><div><b className="text-base text-slate-700">{row.ports}</b><p className="text-[9px] text-slate-400">Overloaded Port</p></div></div>)}
    <div className="flex items-center justify-between text-[9px] text-slate-400"><span>Overload Threshold: Port utilization rate &gt; 80%</span><span><i className="mr-1 inline-block h-2 w-2 bg-emerald-400"/>Normal　<i className="mr-1 inline-block h-2 w-2 bg-amber-400"/>Warning　<i className="mr-1 inline-block h-2 w-2 bg-red-400"/>Overloaded</span></div>
  </div></Card>;

const OpticalModuleHealth = () => <Card title="Optical Module Health"><div className="flex h-full flex-col"><div className="mb-1 flex justify-center gap-6 text-[10px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 bg-emerald-400"/><b className="text-base">22</b> Good</span><span><i className="mr-1 inline-block h-2 w-2 bg-amber-400"/><b className="text-base">17</b> Fair</span><span><i className="mr-1 inline-block h-2 w-2 bg-rose-500"/><b className="text-base">2</b> Poor</span></div><svg viewBox="0 0 540 170" className="min-h-[135px] flex-1 w-full" preserveAspectRatio="none">{[28,60,92,124].map(y=><line key={y} x1="28" y1={y} x2="530" y2={y} stroke="#eef1f4"/>)}<path d="M28 82 C70 62 86 82 120 72 S170 35 210 62 S255 100 290 72 S350 38 395 65 S465 98 530 63" fill="none" stroke="#88d9bc" strokeWidth="2"/><path d="M28 112 C70 122 110 105 145 85 S195 110 235 110 S285 70 330 101 S395 118 430 96 S490 82 530 105" fill="none" stroke="#efcc86" strokeWidth="2"/><path d="M28 142 C70 120 105 150 145 140 S205 105 245 130 S300 142 345 125 S410 150 455 138 S500 145 530 135" fill="none" stroke="#e99b9f" strokeWidth="2"/>{['00:00','04:00','08:00','12:00','16:00','20:00','24:00'].map((x,i)=><text key={x} x={28+i*82} y="165" fontSize="8" fill="#94a3b8">{x}</text>)}</svg></div></Card>;

const HeadroomBuffer = () => <Card title="Headroom Buffer Usage (%)"><div className="relative h-full"><SimpleLineChart/><div className="absolute left-[47%] top-6 rounded bg-slate-800/90 px-3 py-2 text-[9px] text-white shadow"><p className="mb-1 text-slate-300">2026-04-28 02:27:15</p><p><i className="mr-1 inline-block h-2 w-2 bg-teal-400"/>PicOS-1-le-1/1/3　 64%</p><p><i className="mr-1 inline-block h-2 w-2 bg-indigo-400"/>PicOS-1-le-1/1/3　 38%</p></div><div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-5 whitespace-nowrap text-[9px] text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 bg-teal-400"/>PicOS-1-le-1/1/3</span><span><i className="mr-1 inline-block h-2 w-2 bg-indigo-400"/>PicOS-1-le-1/1/3</span></div></div></Card>;
const QueuePacketDrops = () => <Card title="Queue Packet Drops"><div className="relative h-full"><SimpleLineChart variant="blue"/><div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-5 whitespace-nowrap text-[9px] text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 bg-teal-400"/>PicOS-1-le-1/1/3</span><span><i className="mr-1 inline-block h-2 w-2 bg-indigo-400"/>PicOS-1-le-1/1/3</span></div></div></Card>;

const ServerBandwidth = () => {
  const bars = [35,45,82,80,64,55,40,28,12,9];
  return <Card title="Server Bandwidth Utilization"><div className="flex h-full flex-col"><div className="mb-2 flex justify-center gap-6 text-[10px] text-slate-400"><span><b className="text-base text-slate-700">34%</b> Average Utilization Rate</span><span><b className="text-base text-rose-500">7 (1.4%)</b> Overloaded Number</span><span><b className="text-base text-slate-700">457</b> Total</span></div><div className="flex flex-1 items-end justify-around border-b border-slate-100 px-2">{bars.map((h,i)=><div key={i} className={`w-[5%] rounded-t ${i<7?'bg-emerald-400':i===7?'bg-amber-400':'bg-rose-500'}`} style={{height:`${h}%`}}/>)}</div><div className="mt-2 flex justify-around text-[8px] text-slate-400">{['0-10%','10-20%','20-30%','30-40%','40-50%','50-60%','60-70%','70-80%','80-90%','90-100%'].map(x=><span key={x}>{x}</span>)}</div></div></Card>;
};

const Ranking = () => {
  const [tab,setTab] = useState<'Switch'|'Server'>('Switch');
  const groups = [
    {title:'Queue Packet Loss',values:['1240','560','560']},
    {title:'PFC Pause Send Count',values:['3200','2100','1800']},
    {title:'CNP Packet Count',values:['8500','6200','4100']},
    {title:'ECN Mark Count',values:['15200','12000','9400']},
  ];
  return <Card title="RoCE Congestion Ranking (Top3)" action={<div className="rounded bg-slate-100 p-0.5">{(['Switch','Server'] as const).map(x=><button key={x} onClick={()=>setTab(x)} className={`rounded px-2 py-1 text-[9px] ${tab===x?'bg-white text-slate-700 shadow-sm':'text-slate-400'}`}>{x}</button>)}</div>}><div className="grid h-full grid-cols-2 gap-x-6 gap-y-3">{groups.map(g=><div key={g.title}><p className="mb-1 text-[9px] text-slate-400">{g.title}</p>{g.values.map((v,i)=><div key={v+i} className="grid grid-cols-[20px_1fr_55px] border-b border-slate-50 py-1 text-[10px]"><span>{i+1}</span><span className="text-slate-600">{tab}-{String(i+1).padStart(2,'0')}</span><span className="text-right text-slate-500">{v}</span></div>)}</div>)}</div></Card>;
};

const CongestionEvents = () => {
  const bars = [8,6,7,9,5,11,6,31,13,6,8,5,9,7,10,12,8,10,26,29,27,12,8,4];
  return <Card title="Congestion Events"><div className="flex h-full flex-col"><div className="relative flex flex-1 items-end gap-1.5 border-b border-slate-200 px-2"><div className="absolute left-0 right-0 top-[38%] border-t border-dashed border-rose-200"/>{bars.map((h,i)=><div key={i} className={`z-10 flex-1 rounded-t ${h>20?'bg-rose-400':'bg-emerald-400'}`} style={{height:`${Math.max(10,h*2.5)}%`}}/>)}</div><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span></div></div></Card>;
};

const Events = () => {
  const [filter,setFilter] = useState('All');
  const items = [
    {level:'CRITICAL',dot:'bg-rose-500',msg:'Core-Switch-02 Switch Configuration Backup Task Has Been Completed.',time:'2026-04-02 07:43:51'},
    {level:'MAJOR',dot:'bg-amber-400',msg:'Core-Switch-01 Switch CPU Exceeds The Threshold.',time:'2026-04-02 07:43:51'},
    {level:'MINOR',dot:'bg-orange-400',msg:'Core-Switch-01 Switch Port Down.',time:'2026-04-02 07:43:51'},
    {level:'INFO',dot:'bg-teal-400',msg:'Core-Switch-02 Switch Configuration Backup Task Has Been Completed.',time:'2026-04-02 07:42:51'},
  ];
  const shown = filter==='All'?items:items.filter(x=>x.level===filter);
  return <Card title="Events" action={<select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded border-0 bg-slate-50 px-2 py-1 text-[10px] text-slate-500 outline-none"><option>All</option><option>CRITICAL</option><option>MAJOR</option><option>MINOR</option><option>INFO</option></select>}><div className="space-y-3">{shown.map((event,i)=><div key={i} className="flex items-start gap-2 text-[10px]"><i className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${event.dot}`}/><p className="min-w-0 flex-1 text-slate-500">{event.msg}</p><time className="whitespace-nowrap text-[9px] text-slate-400">{event.time}</time></div>)}</div></Card>;
};

const AIDCDashboard = ({ site }: { site: Site }) => (
  <div className="h-full overflow-auto bg-[#f5f6f8]">
    <div className="flex min-h-full flex-col gap-3 p-4 pb-8">
      <DashboardToolbar/>
      <div className="grid min-w-[1180px] grid-cols-3 gap-3">
        <DeviceStatistics site={site}/><TrafficStratification/><OpticalModuleHealth/>
        <HeadroomBuffer/><QueuePacketDrops/><ServerBandwidth/>
        <Ranking/><CongestionEvents/><Events/>
      </div>
    </div>
  </div>
);

export default AIDCDashboard;
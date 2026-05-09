import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Site, Device } from '../types';
import { Server, Globe, Share2, Wifi, Video, Cpu, Network, CheckCircle, Minus, Plus, ChevronDown, RotateCcw, Pause, Play, MapPin, Building2, HardDrive, Radio } from 'lucide-react';
import { OverviewDrawer, InterSiteLinkSelection } from './OverviewDrawer';
import { MOCK_DEVICES, MOCK_ALARMS } from '../constants.tsx';

interface SiteMapProps { sites: Site[]; onSelectSite: (id: string) => void; }
interface FabricLink { from: string; to: string; latency: string; load: number; quality: 'optimal' | 'congested' | 'degraded'; }
interface DeviceConnection { fromDeviceId: string; fromPort: string; toDeviceId: string; toPort: string; bandwidth: string; status: 'active' | 'degraded'; }
interface ManualLink { 
  id: string;
  fromSiteId: string;
  fromDeviceId: string; 
  fromPort: string; 
  toSiteId: string;
  toDeviceId: string; 
  toPort: string; 
  bandwidth?: string;
  type: 'fiber' | 'ethernet';
}
interface ManualLinkRow {
  fromSiteId: string;
  fromDeviceId: string;
  fromPort: string;
  toSiteId: string;
  toDeviceId: string;
  toPort: string;
}

const FABRIC_LINKS: FabricLink[] = [
  { from: 'wh-hq', to: 'bj-dc', latency: '24ms', load: 45, quality: 'optimal' },
  { from: 'wh-hq', to: 'nj-branch', latency: '12ms', load: 12, quality: 'optimal' },
  { from: 'wh-hq', to: 'ldn-branch', latency: '140ms', load: 28, quality: 'optimal' },
  { from: 'bj-dc', to: 'ldn-branch', latency: '18ms', load: 35, quality: 'optimal' },
];
const INTER_SITE_DEVICE_LINKS: DeviceConnection[] = [
  { fromDeviceId: 'sw-f-01', fromPort: 'Eth1/49', toDeviceId: 'border-01', toPort: 'Eth1/1', bandwidth: '10G', status: 'active' },
  { fromDeviceId: 'sw-f-02', fromPort: 'Eth1/49', toDeviceId: 'border-02', toPort: 'Eth1/1', bandwidth: '10G', status: 'active' },
  { fromDeviceId: 'sw-f-01', fromPort: 'Eth1/50', toDeviceId: 'sw-01', toPort: 'Eth1/49', bandwidth: '10G', status: 'active' },
];
const SITE_INTERNAL_LINKS: Record<string, { from: string; to: string }[]> = {
  'wh-hq': [
    { from: 'sw-f-01', to: 'sw-f-02' }, { from: 'sw-f-01', to: 'sw-f-03' }, { from: 'sw-f-01', to: 'sw-f-04' },
    { from: 'sw-f-02', to: 'sw-f-03' }, { from: 'sw-f-02', to: 'sw-f-04' }, { from: 'sw-f-03', to: 'sw-f-05' },
    { from: 'sw-f-04', to: 'sw-f-06' }, { from: 'sw-f-05', to: 'ap-wh-01' }, { from: 'sw-f-05', to: 'ap-wh-02' },
    { from: 'sw-f-06', to: 'ap-wh-03' }, { from: 'sw-f-06', to: 'cam-wh-01' }, { from: 'sw-f-06', to: 'cam-wh-02' },
  ],
  'bj-dc': [
    { from: 'border-01', to: 'spine-01' }, { from: 'border-01', to: 'spine-02' },
    { from: 'border-02', to: 'spine-03' }, { from: 'border-02', to: 'spine-04' },
    { from: 'spine-01', to: 'leaf-01' }, { from: 'spine-01', to: 'leaf-02' }, { from: 'spine-01', to: 'leaf-03' },
    { from: 'spine-02', to: 'leaf-04' }, { from: 'spine-02', to: 'leaf-05' }, { from: 'spine-02', to: 'leaf-06' },
    { from: 'spine-03', to: 'leaf-07' }, { from: 'spine-03', to: 'leaf-08' }, { from: 'spine-03', to: 'leaf-09' },
    { from: 'spine-04', to: 'leaf-10' }, { from: 'spine-04', to: 'leaf-11' }, { from: 'spine-04', to: 'leaf-12' },
    { from: 'optical-01', to: 'border-01' }, { from: 'optical-02', to: 'border-02' },
  ],
  'nj-branch': [
    { from: 'sw-01', to: 'sw-02' }, { from: 'sw-01', to: 'sw-03' }, { from: 'sw-01', to: 'sw-04' },
    { from: 'sw-02', to: 'ap-01' }, { from: 'sw-03', to: 'ap-02' }, { from: 'sw-04', to: 'ap-03' },
  ],
};
const SITE_COORDS: Record<string, { lat: number; lon: number }> = {
  'Wuhan': { lat: 30.6, lon: 114.3 }, 'Beijing': { lat: 39.9, lon: 116.4 }, 'Nanjing': { lat: 32.1, lon: 118.8 },
  'Shanghai': { lat: 31.2, lon: 121.5 }, 'Guangzhou': { lat: 23.1, lon: 113.3 }, 'Shenzhen': { lat: 22.5, lon: 114.1 },
  'Hangzhou': { lat: 30.3, lon: 120.2 }, 'San Francisco': { lat: 37.8, lon: -122.4 }, 'Singapore': { lat: 1.35, lon: 103.8 },
  'San Jose': { lat: 37.3, lon: -121.9 }, 'Frankfurt': { lat: 50.1, lon: 8.7 }, 'Santa Clara': { lat: 37.4, lon: -121.9 },
  'Sossenheim': { lat: 50.1, lon: 8.6 }, 'Pudong': { lat: 31.2, lon: 121.5 },
  'London': { lat: 51.5, lon: -0.1 }, 'Canary Wharf': { lat: 51.5, lon: -0.02 },
};

// Helper functions
const getRoleColor = (role: string) => {
  const colors: Record<string, string> = { Core: '#0ABAB5', Aggregation: '#6366f1', Access: '#10b981', Spine: '#8b5cf6', Leaf: '#06b6d4', Border: '#f59e0b', Optical: '#ec4899', AP: '#22c55e', Camera: '#ef4444', OTN: '#f59e0b' };
  return colors[role] || '#94a3b8';
};
const getRoleIcon = (role: string) => {
  const icons: Record<string, string> = { Core: '◆', Aggregation: '▲', Access: '●', Spine: '⬡', Leaf: '◇', Border: '◈', Optical: '◎', AP: '◉', Camera: '◐', OTN: '◎' };
  return icons[role] || '●';
};
const stColor = (st: string) => st === 'online' ? '#10b981' : st === 'offline' ? '#ef4444' : st === 'provisioning' ? '#f59e0b' : '#94a3b8';
const siteColor = (type: string) => type === 'DataCenter' ? '#6366f1' : type === 'Optical' ? '#f59e0b' : '#0ABAB5';
const siteNameLabel = (name: string) => name.length > 18 ? name.substring(0, 16) + '...' : name;
const getDeviceLayout = (devices: Device[], width: number, height: number) => {
  const roles = ['Core', 'Border', 'Spine', 'Aggregation', 'Leaf', 'Access', 'AP', 'Camera', 'Optical', 'OTN'];
  const grouped: Record<string, Device[]> = {};
  devices.forEach(d => { if (!grouped[d.role]) grouped[d.role] = []; grouped[d.role].push(d); });
  const sortedRoles = roles.filter(r => grouped[r]);
  const positions: Record<string, { x: number; y: number }> = {};
  sortedRoles.forEach((role, ri) => {
    const devs = grouped[role];
    const y = 40 + (ri / Math.max(sortedRoles.length - 1, 1)) * (height - 80);
    devs.forEach((d, di) => { positions[d.id] = { x: 40 + ((di + 1) / (devs.length + 1)) * (width - 80), y }; });
  });
  return positions;
};
// 3D math
const latLonTo3D = (lat: number, lon: number, radius: number = 220) => {
  const phi = (90 - lat) * (Math.PI / 180), theta = (lon + 180) * (Math.PI / 180);
  return { x: -(radius * Math.sin(phi) * Math.cos(theta)), y: radius * Math.cos(phi), z: radius * Math.sin(phi) * Math.sin(theta) };
};
const rotatePoint = (x: number, y: number, z: number, rotX: number, rotY: number) => {
  const cosY = Math.cos(rotY * Math.PI / 180), sinY = Math.sin(rotY * Math.PI / 180);
  const x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
  const cosX = Math.cos(rotX * Math.PI / 180), sinX = Math.sin(rotX * Math.PI / 180);
  return { x: x1, y: y * cosX - z1 * sinX, z: y * sinX + z1 * cosX };
};
const project3DTo2D = (x: number, y: number, z: number, cx: number, cy: number) => {
  const p = 900, s = p / (p + z);
  return { x: cx + x * s, y: cy + y * s, scale: s, visible: z > -220 };
};
const getSiteCoords = (location: string) => {
  for (const city in SITE_COORDS) { if (location.includes(city) || location.toLowerCase().includes(city.toLowerCase())) return SITE_COORDS[city]; }
  return { lat: 30, lon: 114 };
};

// ==================== StatRow & TypeBar helpers ====================
const StatRow = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="text-[12px] font-bold" style={{ color: color || '#334155' }}>{value}</span>
  </div>
);
const TypeBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => (
  <div className="mb-2">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] text-slate-600 font-medium">{label}</span>
      <span className="text-[11px] font-bold text-slate-700">{count}</span>
    </div>
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${(count / Math.max(total, 1)) * 100}%`, backgroundColor: color }} />
    </div>
  </div>
);

// ==================== GlobeView Component ====================
const GlobeView: React.FC<{ sites: Site[]; onSelectSite: (id: string) => void }> = ({ sites, onSelectSite }) => {
  const [rotation, setRotation] = useState({ x: -15, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    let last = performance.now();
    const tick = (t: number) => {
      if (autoRotate && !isDragging) { const dt = t - last; setRotation(p => ({ ...p, y: p.y + dt * 0.006 })); }
      last = t; animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoRotate, isDragging]);

  const onDown = useCallback((e: React.MouseEvent) => { setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, rotX: rotation.x, rotY: rotation.y }; }, [rotation]);
  const onMove = useCallback((e: React.MouseEvent) => { if (!isDragging) return; setRotation({ x: dragStart.current.rotX + (e.clientY - dragStart.current.y) * 0.3, y: dragStart.current.rotY + (e.clientX - dragStart.current.x) * 0.3 }); }, [isDragging]);
  const onUp = useCallback(() => setIsDragging(false), []);

  const R = 210, cx = 360, cy = 290;

  const gridLines = useMemo(() => {
    const lines: { d: string; major: boolean }[] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      let pts = '';
      for (let lon = 0; lon <= 360; lon += 3) {
        const p = latLonTo3D(lat, lon, R), r = rotatePoint(p.x, p.y, p.z, rotation.x, rotation.y), s = project3DTo2D(r.x, r.y, r.z, cx, cy);
        if (s.visible) pts += `${pts ? 'L' : 'M'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
      }
      if (pts) lines.push({ d: pts, major: lat % 30 === 0 });
    }
    for (let lon = 0; lon < 360; lon += 15) {
      let pts = '';
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = latLonTo3D(lat, lon, R), r = rotatePoint(p.x, p.y, p.z, rotation.x, rotation.y), s = project3DTo2D(r.x, r.y, r.z, cx, cy);
        if (s.visible) pts += `${pts ? 'L' : 'M'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
      }
      if (pts) lines.push({ d: pts, major: lon % 30 === 0 });
    }
    return lines;
  }, [rotation]);

  const projected = useMemo(() => sites.map(site => {
    const c = getSiteCoords(site.location), p = latLonTo3D(c.lat, c.lon, R), r = rotatePoint(p.x, p.y, p.z, rotation.x, rotation.y);
    return { site, ...project3DTo2D(r.x, r.y, r.z, cx, cy) };
  }), [sites, rotation]);

  const labels = useMemo(() => {
    const vis = projected.filter(s => s.visible);
    return vis.map((s, i) => {
      const dx = s.x - cx, dy = s.y - cy, dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const push = R + 75 + (i % 2) * 30;
      return { ...s, lx: cx + (dx / dist) * push, ly: cy + (dy / dist) * push };
    });
  }, [projected]);

  // Arcs on globe surface between sites
  const arcs = useMemo(() => FABRIC_LINKS.map(link => {
    const f = projected.find(s => s.site.id === link.from), t = projected.find(s => s.site.id === link.to);
    if (!f || !t || !f.visible || !t.visible) return null;
    const fc = getSiteCoords(f.site.location), tc = getSiteCoords(t.site.location);
    let d = '';
    for (let i = 0; i <= 20; i++) {
      const frac = i / 20, lat = fc.lat + (tc.lat - fc.lat) * frac, lon = fc.lon + (tc.lon - fc.lon) * frac;
      const lift = Math.sin(frac * Math.PI) * 25;
      const p = latLonTo3D(lat, lon, R + lift), r = rotatePoint(p.x, p.y, p.z, rotation.x, rotation.y), s = project3DTo2D(r.x, r.y, r.z, cx, cy);
      if (s.visible) d += `${d ? 'L' : 'M'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
    }
    return { ...link, d };
  }).filter(Boolean) as (FabricLink & { d: string })[], [projected, rotation]);

  // Orbiting data particles
  const particles = useMemo(() => {
    const pts: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const lat = Math.sin(i * 1.7 + rotation.y * 0.015) * 65, lon = (i * 12 + rotation.y * 0.4) % 360;
      const p = latLonTo3D(lat, lon, R + 8), r = rotatePoint(p.x, p.y, p.z, rotation.x, rotation.y), s = project3DTo2D(r.x, r.y, r.z, cx, cy);
      if (s.visible) pts.push({ x: s.x, y: s.y, r: 1.2 * s.scale, o: 0.2 + s.scale * 0.5 });
    }
    return pts;
  }, [rotation]);

  const totalDevices = sites.reduce((a, s) => a + s.deviceCount, 0);
  const totalAlerts = sites.reduce((a, s) => a + s.alertCount, 0);
  const campusCount = sites.filter(s => s.siteType === 'Campus').length;
  const dcCount = sites.filter(s => s.siteType === 'DataCenter').length;
  const avgHealth = sites.length ? Math.round(sites.reduce((a, s) => a + s.health, 0) / sites.length) : 0;

  return (
    <div className="flex h-full bg-[#f8fafb]">
      <div className="flex-1 relative overflow-hidden" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <svg className="w-full h-full" viewBox="0 0 720 580" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
          <defs>
            <radialGradient id="gBody" cx="36%" cy="30%">
              <stop offset="0%" stopColor="#f0fdfa" /><stop offset="25%" stopColor="#ccfbf1" />
              <stop offset="55%" stopColor="#5eead4" /><stop offset="85%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
            <radialGradient id="gShine" cx="32%" cy="28%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" /><stop offset="40%" stopColor="rgba(255,255,255,0.1)" /><stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="gEdge" cx="50%" cy="50%">
              <stop offset="85%" stopColor="transparent" /><stop offset="100%" stopColor="rgba(13,148,136,0.12)" />
            </radialGradient>
            <filter id="gAmbient"><feGaussianBlur stdDeviation="30" /></filter>
            <filter id="dotGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="cardDrop"><feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0d9488" floodOpacity="0.1" /></filter>
            <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0ABAB5" /><stop offset="100%" stopColor="#6366f1" /></linearGradient>
            <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0ABAB5" stopOpacity="0.15" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" /></linearGradient>
          </defs>

          {/* Outer decorative rings */}
          <circle cx={cx} cy={cy} r={R + 55} fill="none" stroke="url(#ringG)" strokeWidth="1" strokeDasharray="2,6" />
          <circle cx={cx} cy={cy} r={R + 75} fill="none" stroke="#6366f1" strokeWidth="0.4" opacity="0.06" strokeDasharray="1,10" />
          <circle cx={cx} cy={cy} r={R + 95} fill="none" stroke="#0d9488" strokeWidth="0.3" opacity="0.04" strokeDasharray="1,14" />
          {/* Tilted orbit ellipses */}
          <ellipse cx={cx} cy={cy} rx={R + 30} ry={55} fill="none" stroke="#0d9488" strokeWidth="0.6" opacity="0.08" transform={`rotate(-25,${cx},${cy})`} />
          <ellipse cx={cx} cy={cy} rx={R + 45} ry={35} fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.06" transform={`rotate(18,${cx},${cy})`} />
          <ellipse cx={cx} cy={cy} rx={R + 60} ry={25} fill="none" stroke="#0ABAB5" strokeWidth="0.4" opacity="0.04" transform={`rotate(-8,${cx},${cy})`} />

          {/* Ambient glow behind globe */}
          <circle cx={cx} cy={cy} r={R + 20} fill="#14b8a6" opacity="0.06" filter="url(#gAmbient)" />

          {/* Globe body */}
          <circle cx={cx} cy={cy} r={R} fill="url(#gBody)" />
          <circle cx={cx} cy={cy} r={R} fill="url(#gEdge)" />
          <circle cx={cx} cy={cy} r={R} fill="url(#gShine)" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#0d9488" strokeWidth="1.2" opacity="0.35" />
          {/* Inner subtle ring */}
          <circle cx={cx} cy={cy} r={R - 3} fill="none" stroke="white" strokeWidth="0.5" opacity="0.15" />

          {/* Grid lines */}
          {gridLines.map((l, i) => <path key={i} d={l.d} fill="none" stroke={l.major ? '#0d9488' : '#99f6e4'} strokeWidth={l.major ? 0.5 : 0.25} opacity={l.major ? 0.2 : 0.1} />)}

          {/* Orbiting particles */}
          {particles.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#0ABAB5" opacity={p.o} />)}

          {/* Inter-site arcs */}
          {arcs.map((a, i) => (
            <g key={`a${i}`}>
              <path d={a.d} fill="none" stroke="url(#arcG)" strokeWidth="2" opacity="0.55" />
              <path d={a.d} fill="none" stroke="#0ABAB5" strokeWidth="5" opacity="0.06" />
              {/* Animated traveling dot */}
              <circle r="3" fill="#0ABAB5" opacity="0.8">
                <animateMotion dur={`${3 + i}s`} repeatCount="indefinite" path={a.d} />
              </circle>
            </g>
          ))}

          {/* Site markers + labels */}
          {labels.map(({ site, x, y, scale, lx, ly }) => {
            const col = siteColor(site.siteType);
            const isH = hovered === site.id;
            return (
              <g key={site.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); onSelectSite(site.id); }}
                onMouseEnter={() => setHovered(site.id)} onMouseLeave={() => setHovered(null)}>
                {/* Leader line */}
                <line x1={x} y1={y} x2={lx} y2={ly} stroke={col} strokeWidth="0.8" opacity="0.25" strokeDasharray="3,5" />
                {/* Pulse rings */}
                <circle cx={x} cy={y} r={14 * scale} fill="none" stroke={col} strokeWidth="0.7" opacity="0">
                  <animate attributeName="r" from={`${10 * scale}`} to={`${22 * scale}`} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.25" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r={10 * scale} fill="none" stroke={col} strokeWidth="0.5" opacity="0">
                  <animate attributeName="r" from={`${8 * scale}`} to={`${18 * scale}`} dur="2.5s" begin="0.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.2" to="0" dur="2.5s" begin="0.7s" repeatCount="indefinite" />
                </circle>
                {/* Core marker */}
                <circle cx={x} cy={y} r={6 * scale} fill={col} filter="url(#dotGlow)" />
                <circle cx={x} cy={y} r={2.5 * scale} fill="white" opacity="0.9" />
                {/* Label card */}
                <rect x={lx - 74} y={ly - 26} width="148" height="52" rx="12" fill="white" stroke={isH ? col : '#e2e8f0'} strokeWidth={isH ? 2 : 1} filter="url(#cardDrop)" opacity="0.96" />
                <rect x={lx - 74} y={ly - 26} width="4" height="52" rx="2" fill={col} />
                <text x={lx - 60} y={ly - 7} fontSize="11.5" fontWeight="700" fill="#0f172a">{siteNameLabel(site.name)}</text>
                <text x={lx - 60} y={ly + 9} fontSize="9" fill="#94a3b8">{site.siteType} · {site.deviceCount} devices</text>
                <circle cx={lx + 62} cy={ly - 12} r="5" fill={site.health >= 95 ? '#10b981' : site.health >= 80 ? '#f59e0b' : '#ef4444'} />
                <text x={lx + 62} y={ly + 6} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={site.health >= 95 ? '#10b981' : '#f59e0b'}>{site.health}%</text>
              </g>
            );
          })}
        </svg>

        {/* Controls */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <button onClick={() => setAutoRotate(!autoRotate)} className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-sm hover:bg-white text-xs font-medium text-slate-600 transition-colors">
            {autoRotate ? <Pause size={14} /> : <Play size={14} />} {autoRotate ? 'Pause' : 'Rotate'}
          </button>
          <button onClick={() => setRotation({ x: -15, y: 40 })} className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-sm hover:bg-white text-xs font-medium text-slate-600 transition-colors">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        {/* Live badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-lg border border-slate-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live · {sites.length} Sites Active</span>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-72 border-l border-slate-200/80 bg-white p-5 overflow-y-auto shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Global Overview</h3>
        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-xl p-4 mb-5 border border-slate-100">
          <StatRow label="Total Sites" value={sites.length} color="#0ABAB5" />
          <StatRow label="Total Devices" value={totalDevices} color="#6366f1" />
          <StatRow label="Active Alerts" value={totalAlerts} color={totalAlerts > 0 ? '#ef4444' : '#10b981'} />
          <StatRow label="Avg Health" value={`${avgHealth}%`} color={avgHealth >= 95 ? '#10b981' : '#f59e0b'} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Site Types</h3>
        <div className="mb-5">
          <TypeBar label="Campus" count={campusCount} total={sites.length} color="#0ABAB5" />
          <TypeBar label="Data Center" count={dcCount} total={sites.length} color="#6366f1" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Sites</h3>
        <div className="space-y-2">
          {sites.map(site => {
            const col = siteColor(site.siteType);
            return (
              <button key={site.id} onClick={() => onSelectSite(site.id)} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col }} /><span className="text-[12px] font-bold text-slate-700 group-hover:text-teal-700">{site.name}</span></div>
                  <span className="text-[10px] text-slate-400 font-medium">{site.siteType}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-4">
                  <span className="text-[10px] text-slate-400">{site.deviceCount} devices</span>
                  <span className="text-[10px] font-medium" style={{ color: site.health >= 95 ? '#10b981' : '#f59e0b' }}>Health {site.health}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==================== CollapsedSiteContent ====================
const CollapsedSiteContent: React.FC<{ site: Site; devices: Device[]; x: number; y: number; w: number; h: number }> = ({ site, devices, x, y, w, h }) => {
  const roleCounts: Record<string, number> = {};
  devices.forEach(d => { roleCounts[d.role] = (roleCounts[d.role] || 0) + 1; });
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const col = siteColor(site.siteType);
  const typeLabel = site.siteType === 'DataCenter' ? 'Data Center' : site.siteType === 'Optical' ? 'Optical' : 'Campus';
  const healthColor = site.health >= 90 ? '#0ABAB5' : site.health >= 70 ? '#FADB14' : '#FF4D4F';
  const p = 10; // padding
  // precise y layout (all relative to card top y=0)
  const hH = 44;           // header height
  const hlY = hH + 13;     // 健康度 label baseline
  const barTop = hH + 18;  // progress bar top
  const numY = barTop + 20; // stat numbers baseline
  const lblY = numY + 12;  // stat labels baseline
  const divY = lblY + 8;   // divider
  const roleY = divY + 16; // role circle center
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      {/* header */}
      <rect x={x} y={y} width={w} height={hH} rx="12" fill={col} />
      <rect x={x} y={y + hH - 8} width={w} height="8" fill={col} />
      {/* icon */}
      {site.siteType === 'DataCenter' ? (
        <g transform={`translate(${x + 9}, ${y + hH / 2 - 8})`}>
          <rect x="0" y="0" width="14" height="16" rx="2" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <line x1="3" y1="5" x2="11" y2="5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
          <line x1="3" y1="8" x2="11" y2="8" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
          <line x1="3" y1="11" x2="11" y2="11" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
          <circle cx="10" cy="5" r="1" fill="rgba(255,255,255,0.9)" />
          <circle cx="10" cy="8" r="1" fill="rgba(255,255,255,0.9)" />
          <circle cx="10" cy="11" r="1" fill="rgba(255,255,255,0.9)" />
        </g>
      ) : site.siteType === 'Optical' ? (
        <g transform={`translate(${x + 9}, ${y + hH / 2 - 8})`}>
          <circle cx="7" cy="8" r="3" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <path d="M7 1 L7 5 M7 11 L7 15 M1 8 L4 8 M10 8 L13 8" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7" cy="8" r="6.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeDasharray="2,2" />
        </g>
      ) : (
        <g transform={`translate(${x + 9}, ${y + hH / 2 - 8})`}>
          <path d="M2 15 L2 6 L7 2 L12 6 L12 15 Z" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="5" y="9" width="4" height="6" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
          <line x1="4" y1="15" x2="10" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
        </g>
      )}
      {/* site name */}
      <text x={x + 28} y={y + 18} fontSize="10" fontWeight="800" fill="white">{siteNameLabel(site.name)}</text>
      {/* site type */}
      <text x={x + 28} y={y + 32} fontSize="8" fill="rgba(255,255,255,0.7)">{'Site Type: ' + typeLabel}</text>

      {/* 健康度 label + value */}
      <text x={x + p} y={y + hlY} fontSize="9" fill="#475569">健康度</text>
      <text x={x + w - p} y={y + hlY} textAnchor="end" fontSize="9" fontWeight="700" fill={healthColor}>{site.health}</text>
      {/* progress bar */}
      <rect x={x + p} y={y + barTop} width={w - p * 2} height="5" rx="2.5" fill="#e2e8f0" />
      <rect x={x + p} y={y + barTop} width={(w - p * 2) * site.health / 100} height="5" rx="2.5" fill={healthColor} />

      {/* stats numbers */}
      <text x={x + w / 6} y={y + numY} textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e293b">{devices.length}</text>
      <text x={x + w / 2} y={y + numY} textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e293b">{onlineCount}</text>
      <text x={x + w * 5 / 6} y={y + numY} textAnchor="middle" fontSize="13" fontWeight="800" fill={site.alertCount > 0 ? '#ef4444' : '#1e293b'}>{site.alertCount}</text>
      {/* stats labels */}
      <text x={x + w / 6} y={y + lblY} textAnchor="middle" fontSize="8" fill="#94a3b8">设备</text>
      <text x={x + w / 2} y={y + lblY} textAnchor="middle" fontSize="8" fill="#94a3b8">在线</text>
      <text x={x + w * 5 / 6} y={y + lblY} textAnchor="middle" fontSize="8" fill="#94a3b8">告警</text>

      {/* divider */}
      <line x1={x + p} y1={y + divY} x2={x + w - p} y2={y + divY} stroke="#f1f5f9" strokeWidth="1" />

      {/* role icons */}
      {Object.entries(roleCounts).slice(0, 4).map(([role, count], i) => {
        const rcx = x + 14 + i * 30, rcy = y + roleY, rc = getRoleColor(role);
        return (
        <g key={role}>
          <rect x={rcx - 9} y={rcy - 9} width="18" height="18" rx="5" fill={rc} opacity="0.1" stroke={rc} strokeWidth="0.5" opacity2="0.3" />
          {role === 'Core' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><rect x="1" y="1.5" width="8" height="2.5" rx="0.5" fill={rc} /><rect x="1" y="5" width="8" height="2.5" rx="0.5" fill={rc} /><circle cx="7.5" cy="2.8" r="0.7" fill="white" /><circle cx="7.5" cy="6.2" r="0.7" fill="white" /></g>
          ) : role === 'Aggregation' || role === 'Spine' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><rect x="1" y="1" width="8" height="2" rx="0.5" fill={rc} /><rect x="1" y="4" width="8" height="2" rx="0.5" fill={rc} /><rect x="1" y="7" width="8" height="2" rx="0.5" fill={rc} /></g>
          ) : role === 'Access' || role === 'Leaf' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><rect x="2.5" y="1" width="5" height="4" rx="1" fill="none" stroke={rc} strokeWidth="1" /><circle cx="5" cy="3" r="1" fill={rc} /><line x1="2.5" y1="6.5" x2="5" y2="6.5" stroke={rc} strokeWidth="0.8" /><line x1="5" y1="6.5" x2="7.5" y2="6.5" stroke={rc} strokeWidth="0.8" /><line x1="2.5" y1="6.5" x2="2.5" y2="9" stroke={rc} strokeWidth="0.8" /><line x1="5" y1="5" x2="5" y2="9" stroke={rc} strokeWidth="0.8" /><line x1="7.5" y1="6.5" x2="7.5" y2="9" stroke={rc} strokeWidth="0.8" /></g>
          ) : role === 'AP' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><path d="M2.5 7 Q5 1.5 7.5 7" fill="none" stroke={rc} strokeWidth="1.2" strokeLinecap="round" /><path d="M3.5 6 Q5 3 6.5 6" fill="none" stroke={rc} strokeWidth="1" strokeLinecap="round" /><circle cx="5" cy="7.5" r="1" fill={rc} /></g>
          ) : role === 'Camera' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><rect x="1.5" y="2.5" width="7" height="5.5" rx="1" fill="none" stroke={rc} strokeWidth="1" /><circle cx="5" cy="5.3" r="2" fill="none" stroke={rc} strokeWidth="0.8" /><circle cx="5" cy="5.3" r="0.8" fill={rc} /></g>
          ) : role === 'Border' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><rect x="1.5" y="2" width="7" height="7" rx="1.5" fill="none" stroke={rc} strokeWidth="1" /><line x1="1.5" y1="5" x2="8.5" y2="5" stroke={rc} strokeWidth="0.7" /><circle cx="3.5" cy="3.5" r="0.7" fill={rc} /><circle cx="5.5" cy="3.5" r="0.7" fill={rc} /></g>
          ) : role === 'Optical' || role === 'OTN' ? (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><circle cx="5" cy="5" r="3.5" fill="none" stroke={rc} strokeWidth="1" /><circle cx="5" cy="5" r="1.2" fill={rc} opacity="0.5" /><line x1="5" y1="0.5" x2="5" y2="2.5" stroke={rc} strokeWidth="0.8" /><line x1="5" y1="7.5" x2="5" y2="9.5" stroke={rc} strokeWidth="0.8" /></g>
          ) : (
            <g transform={`translate(${rcx - 5}, ${rcy - 5})`}><rect x="2" y="2" width="6" height="6" rx="1.5" fill="none" stroke={rc} strokeWidth="1" /><circle cx="5" cy="5" r="1.5" fill={rc} opacity="0.4" /></g>
          )}
          <text x={rcx} y={rcy + 14} textAnchor="middle" fontSize="7" fill="#94a3b8">{count}</text>
        </g>
        );
      })}
    </g>
  );
};

// ==================== ExpandedSiteContent ====================
const ExpandedSiteContent: React.FC<{ site: Site; devices: Device[]; x: number; y: number; w: number; h: number; onDeviceClick?: (d: Device) => void; selectedDeviceId?: string | null; highlightedDeviceId?: string | null; onHeaderClick?: () => void; onLinkClick?: (link: { from: string; to: string; fromPort: string; toPort: string; type: string }) => void; selectedLink?: { from: string; to: string } | null }> = ({ site, devices, x, y, w, h, onDeviceClick, selectedDeviceId, highlightedDeviceId, onHeaderClick, onLinkClick, selectedLink }) => {
  const positions = getDeviceLayout(devices, w, h);
  const links = SITE_INTERNAL_LINKS[site.id] || [];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="16" fill="white" stroke={siteColor(site.siteType)} strokeWidth="2" />
      <rect x={x} y={y} width={w} height="36" rx="16" fill={siteColor(site.siteType)} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); if (onHeaderClick) onHeaderClick(); }} />
      <rect x={x} y={y + 20} width={w} height="16" fill={siteColor(site.siteType)} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); if (onHeaderClick) onHeaderClick(); }} />
      <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize="12" fontWeight="700" fill="white" style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); if (onHeaderClick) onHeaderClick(); }}>{site.name} <tspan fontSize="10" opacity="0.8">{devices.length} devices · {site.location}</tspan></text>
      {links.map((link, i) => {
        const fp = positions[link.from], tp = positions[link.to];
        if (!fp || !tp) return null;
        const isLinkSel = selectedLink && ((selectedLink.from === link.from && selectedLink.to === link.to) || (selectedLink.from === link.to && selectedLink.to === link.from));
        return (
          <g key={i} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); if (onLinkClick) onLinkClick({ from: link.from, to: link.to, fromPort: 'Eth1/' + (i + 1), toPort: 'Eth1/' + (i + 49), type: 'ethernet' }); }}>
            <line x1={x + fp.x} y1={y + 36 + fp.y} x2={x + tp.x} y2={y + 36 + tp.y} stroke={isLinkSel ? '#0ABAB5' : '#f5a623'} strokeWidth={isLinkSel ? 3 : 1.2} opacity={isLinkSel ? 1 : 0.6} />
            <line x1={x + fp.x} y1={y + 36 + fp.y} x2={x + tp.x} y2={y + 36 + tp.y} stroke="transparent" strokeWidth="10" />
          </g>
        );
      })}
      {devices.map(d => {
        const pos = positions[d.id]; if (!pos) return null;
        const dx = x + pos.x, dy = y + 36 + pos.y;
        const isSel = selectedDeviceId === d.id;
        const isHighlighted = highlightedDeviceId === d.id;
        const roleCol = getRoleColor(d.role);
        const cardSize = 18;
        return (
          <g key={d.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); if (onDeviceClick) onDeviceClick(d); }}>
            {isHighlighted && <rect x={dx - cardSize - 4} y={dy - cardSize - 4} width={(cardSize + 4) * 2} height={(cardSize + 4) * 2} rx="12" fill="none" stroke="#0ABAB5" strokeWidth="2" strokeDasharray="3,2" opacity="0.7" />}
            {/* Card background */}
            <rect x={dx - cardSize} y={dy - cardSize} width={cardSize * 2} height={cardSize * 2} rx="8" fill="white" stroke={isSel ? '#0ABAB5' : isHighlighted ? '#0ABAB5' : '#e2e8f0'} strokeWidth={isSel ? 2.5 : isHighlighted ? 2.5 : 1.5} filter={isSel ? undefined : undefined} />
            {/* Shadow effect */}
            <rect x={dx - cardSize + 1} y={dy - cardSize + 2} width={cardSize * 2 - 2} height={cardSize * 2 - 2} rx="7" fill="none" stroke="#00000008" strokeWidth="2" />
            {/* Device icon by role + site type */}
            {(() => {
              const isDC = site.siteType === 'DataCenter';
              if (d.role === 'Core') {
                return isDC ? (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <rect x="1" y="2" width="14" height="4" rx="1.5" fill={roleCol} opacity="0.9" />
                    <rect x="1" y="7.5" width="14" height="4" rx="1.5" fill={roleCol} opacity="0.9" />
                    <rect x="1" y="13" width="14" height="4" rx="1.5" fill={roleCol} opacity="0.6" />
                    <circle cx="3.5" cy="4" r="0.8" fill="white" /><circle cx="3.5" cy="9.5" r="0.8" fill="white" /><circle cx="3.5" cy="15" r="0.8" fill="white" />
                    <rect x="6" y="3.2" width="7" height="1.6" rx="0.5" fill="white" opacity="0.5" />
                    <rect x="6" y="8.7" width="7" height="1.6" rx="0.5" fill="white" opacity="0.5" />
                  </g>
                ) : (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <rect x="1" y="2" width="14" height="4" rx="1" fill={roleCol} opacity="0.85" />
                    <rect x="1" y="7.5" width="14" height="4" rx="1" fill={roleCol} opacity="0.85" />
                    <circle cx="12" cy="4" r="1" fill="white" /><circle cx="12" cy="9.5" r="1" fill="white" />
                    <rect x="1" y="13" width="14" height="4" rx="1" fill={roleCol} opacity="0.5" />
                    <circle cx="12" cy="15" r="1" fill="white" />
                  </g>
                );
              } else if (d.role === 'Spine') {
                // DC Spine: pink/orange dot array (high-density ports)
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <circle cx="4" cy="4" r="2" fill={roleCol} opacity="0.8" /><circle cx="9" cy="4" r="2" fill={roleCol} opacity="0.8" /><circle cx="14" cy="4" r="2" fill={roleCol} opacity="0.5" />
                    <circle cx="4" cy="9" r="2" fill={roleCol} opacity="0.8" /><circle cx="9" cy="9" r="2" fill={roleCol} opacity="0.8" /><circle cx="14" cy="9" r="2" fill={roleCol} opacity="0.5" />
                    <circle cx="4" cy="14" r="2" fill={roleCol} opacity="0.5" /><circle cx="9" cy="14" r="2" fill={roleCol} opacity="0.5" />
                  </g>
                );
              } else if (d.role === 'Aggregation') {
                // Campus Aggregation: stacked switch
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <rect x="2" y="1" width="12" height="3.5" rx="1" fill={roleCol} opacity="0.8" />
                    <rect x="2" y="5.5" width="12" height="3.5" rx="1" fill={roleCol} opacity="0.8" />
                    <rect x="2" y="10" width="12" height="3.5" rx="1" fill={roleCol} opacity="0.8" />
                    <line x1="5" y1="14" x2="5" y2="16" stroke={roleCol} strokeWidth="1" /><line x1="8" y1="14" x2="8" y2="16" stroke={roleCol} strokeWidth="1" /><line x1="11" y1="14" x2="11" y2="16" stroke={roleCol} strokeWidth="1" />
                  </g>
                );
              } else if (d.role === 'Leaf') {
                // DC Leaf: green square grid (ToR switch)
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <rect x="2" y="2" width="5" height="5" rx="1" fill={roleCol} opacity="0.7" />
                    <rect x="9" y="2" width="5" height="5" rx="1" fill={roleCol} opacity="0.7" />
                    <rect x="2" y="9" width="5" height="5" rx="1" fill={roleCol} opacity="0.7" />
                    <rect x="9" y="9" width="5" height="5" rx="1" fill={roleCol} opacity="0.5" />
                    <line x1="7" y1="4.5" x2="9" y2="4.5" stroke={roleCol} strokeWidth="0.8" />
                    <line x1="7" y1="11.5" x2="9" y2="11.5" stroke={roleCol} strokeWidth="0.8" />
                    <line x1="4.5" y1="7" x2="4.5" y2="9" stroke={roleCol} strokeWidth="0.8" />
                    <line x1="11.5" y1="7" x2="11.5" y2="9" stroke={roleCol} strokeWidth="0.8" />
                  </g>
                );
              } else if (d.role === 'Access') {
                // Campus Access: network branch
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <rect x="4" y="2" width="8" height="6" rx="1.5" fill="none" stroke={roleCol} strokeWidth="1.5" />
                    <circle cx="8" cy="5" r="1.5" fill={roleCol} />
                    <line x1="4" y1="10" x2="8" y2="10" stroke={roleCol} strokeWidth="1.2" /><line x1="8" y1="10" x2="12" y2="10" stroke={roleCol} strokeWidth="1.2" />
                    <line x1="4" y1="10" x2="4" y2="14" stroke={roleCol} strokeWidth="1.2" /><line x1="8" y1="8" x2="8" y2="14" stroke={roleCol} strokeWidth="1.2" /><line x1="12" y1="10" x2="12" y2="14" stroke={roleCol} strokeWidth="1.2" />
                    <circle cx="4" cy="14.5" r="1.2" fill={roleCol} /><circle cx="8" cy="14.5" r="1.2" fill={roleCol} /><circle cx="12" cy="14.5" r="1.2" fill={roleCol} />
                  </g>
                );
              } else if (d.role === 'AP') {
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 7})`}>
                    <path d="M4 10 Q8 2 12 10" fill="none" stroke={roleCol} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M5.5 8 Q8 4 10.5 8" fill="none" stroke={roleCol} strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="1.5" fill={roleCol} />
                    <line x1="8" y1="12.5" x2="8" y2="15" stroke={roleCol} strokeWidth="1.5" />
                  </g>
                );
              } else if (d.role === 'Camera') {
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 7})`}>
                    <rect x="2" y="4" width="12" height="9" rx="2" fill="none" stroke={roleCol} strokeWidth="1.5" />
                    <circle cx="8" cy="8.5" r="3" fill="none" stroke={roleCol} strokeWidth="1.3" />
                    <circle cx="8" cy="8.5" r="1.2" fill={roleCol} />
                    <circle cx="11.5" cy="5.5" r="0.8" fill={roleCol} />
                  </g>
                );
              } else if (d.role === 'Border') {
                // DC Border: gateway with arrows
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke={roleCol} strokeWidth="1.5" />
                    <line x1="2" y1="7" x2="14" y2="7" stroke={roleCol} strokeWidth="1" />
                    <path d="M5 9.5 L8 12 L11 9.5" fill="none" stroke={roleCol} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="5" cy="5" r="1" fill={roleCol} /><circle cx="8" cy="5" r="1" fill={roleCol} />
                  </g>
                );
              } else if (d.role === 'Optical' || d.role === 'OTN') {
                return (
                  <g transform={`translate(${dx - 8}, ${dy - 8})`}>
                    <circle cx="8" cy="8" r="5.5" fill="none" stroke={roleCol} strokeWidth="1.5" />
                    <circle cx="8" cy="8" r="2" fill={roleCol} opacity="0.6" />
                    <line x1="8" y1="1" x2="8" y2="4" stroke={roleCol} strokeWidth="1.2" /><line x1="8" y1="12" x2="8" y2="15" stroke={roleCol} strokeWidth="1.2" />
                    <line x1="1" y1="8" x2="4" y2="8" stroke={roleCol} strokeWidth="1.2" /><line x1="12" y1="8" x2="15" y2="8" stroke={roleCol} strokeWidth="1.2" />
                  </g>
                );
              } else {
                return (
                  <g transform={`translate(${dx - 7}, ${dy - 7})`}>
                    <rect x="2" y="2" width="10" height="10" rx="2" fill="none" stroke={roleCol} strokeWidth="1.5" />
                    <circle cx="7" cy="7" r="2.5" fill={roleCol} opacity="0.4" />
                  </g>
                );
              }
            })()}
            {/* Status indicator */}
            <circle cx={dx + cardSize - 3} cy={dy - cardSize + 3} r="3.5" fill={stColor(d.status)} />
            {/* Device name */}
            <text x={dx} y={dy + cardSize + 12} textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="500">{d.name.length > 12 ? d.name.substring(0, 10) + '..' : d.name}</text>
          </g>
        );
      })}
    </g>
  );
};

// ==================== NetworkView Component ====================
const NetworkView: React.FC<{ sites: Site[]; onSelectSite: (id: string) => void; filterRegion: string; filterType: string }> = ({ sites, onSelectSite, filterRegion, filterType }) => {
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [highlightedSiteId, setHighlightedSiteId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<{ from: string; to: string; fromPort: string; toPort: string; type: string } | null>(null);
  const [selectedSiteNeighborId, setSelectedSiteNeighborId] = useState<string | null>(null);
  const [selectedInterSiteLink, setSelectedInterSiteLink] = useState<InterSiteLinkSelection | null>(null);
  // toolbar state
  const [activeTool, setActiveTool] = useState<'interact' | 'draw'>('interact');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Manual link drawing state
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
  const [linkStartDevice, setLinkStartDevice] = useState<string | null>(null);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [manualLinkRows, setManualLinkRows] = useState<ManualLinkRow[]>([{ fromSiteId: '', fromDeviceId: '', fromPort: '', toSiteId: '', toDeviceId: '', toPort: '' }]);
  const [hoveredManualLink, setHoveredManualLink] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string[] | null>(null);

  // Select site from Overview, View dropdown, or card click
  const handleSelectSite = (id: string | null) => {
    setSelectedSiteId(id);
    setHighlightedSiteId(id);
    setSelectedSiteNeighborId(null);
    setSelectedInterSiteLink(null);
    if (id) {
      setExpandedSites(prev => { const n = new Set(prev); n.add(id); return n; });
    }
  };

  const toggleExpand = (id: string) => {
    if (activeTool === 'draw') return;
    const willExpand = !expandedSites.has(id);
    const newExpanded = new Set(expandedSites);
    if (willExpand) {
      newExpanded.add(id);
    } else {
      newExpanded.delete(id);
    }
    setExpandedSites(newExpanded);
    setSelectedDeviceId(null); // always clear device selection on site toggle
    setSelectedLink(null); // always clear link selection on site toggle
    setSelectedSiteNeighborId(null); // always clear neighbor view on site toggle
    setSelectedInterSiteLink(null); // always clear inter-site link on site toggle
    
    if (willExpand) {
      // expanding: show this site's overview
      setSelectedSiteId(id);
      setHighlightedSiteId(id);
    } else {
      // collapsing: show last expanded site's overview, or global if none
      const remaining = Array.from(newExpanded);
      if (remaining.length > 0) {
        const lastId = remaining[remaining.length - 1];
        setSelectedSiteId(lastId);
        setHighlightedSiteId(lastId);
      } else {
        setSelectedSiteId(null);
        setHighlightedSiteId(null);
      }
    }
  };

  // Drag state for site cards
  const [dragOffsets, setDragOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const dragRef = React.useRef<{ siteId: string; startX: number; startY: number; origDx: number; origDy: number } | null>(null);

  const onSiteMouseDown = (e: React.MouseEvent, siteId: string) => {
    if (activeTool !== 'interact') return;
    e.preventDefault();
    const off = dragOffsets[siteId] || { dx: 0, dy: 0 };
    dragRef.current = { siteId, startX: e.clientX, startY: e.clientY, origDx: off.dx, origDy: off.dy };
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { siteId, startX, startY, origDx, origDy } = dragRef.current;
      setDragOffsets(prev => ({ ...prev, [siteId]: { dx: origDx + (e.clientX - startX) / zoom, dy: origDy + (e.clientY - startY) / zoom } }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [zoom]);
  // Expand all / collapse all
  const handleExpandAll = () => {
    if (expandedSites.size === filteredSites.length) {
      setExpandedSites(new Set());
    } else {
      setExpandedSites(new Set(filteredSites.map(s => s.id)));
    }
  };

  // Fit view: reset zoom and pan
  const handleFitView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Zoom in/out
  const handleZoomIn = () => setZoom(z => Math.min(5, parseFloat((z * 1.1).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.2, parseFloat((z * 0.8).toFixed(2))));

  // Refresh
  const handleRefresh = () => { setRefreshKey(k => k + 1); setExpandedSites(new Set()); setZoom(1); setPan({ x: 0, y: 0 }); setSelectedSiteId(null); setHighlightedSiteId(null); setDragOffsets({}); setSelectedDeviceId(null); setSelectedLink(null); setSelectedSiteNeighborId(null); setSelectedInterSiteLink(null); };

  // Export as PNG
  const handleExport = () => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'topology.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSites = useMemo(() => sites.filter(s => (filterRegion === 'All' || s.region === filterRegion) && (filterType === 'All' || s.siteType === filterType)), [sites, filterRegion, filterType]);
  const anyExpanded = expandedSites.size > 0;
  const collapsedW = 160, collapsedH = 140, expandedW = 480, expandedH = 380, svgW = 1200, svgH = 600;

  const sitePositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
    if (anyExpanded) {
      const gap = 40;
      const totalW = filteredSites.reduce((a, s) => a + (expandedSites.has(s.id) ? expandedW : collapsedW), 0) + (filteredSites.length - 1) * gap;
      let curX = Math.max(30, (svgW - totalW) / 2);
      filteredSites.forEach(s => {
        const isExp = expandedSites.has(s.id), w = isExp ? expandedW : collapsedW, h = isExp ? expandedH : collapsedH;
        pos[s.id] = { x: curX, y: isExp ? 30 : 30 + (expandedH - collapsedH) / 2, w, h }; curX += w + gap;
      });
    } else {
      const topY = 40, bottomY = 280, centerX = svgW / 2, sp = 280;
      if (filteredSites.length === 1) pos[filteredSites[0].id] = { x: centerX - collapsedW / 2, y: 120, w: collapsedW, h: collapsedH };
      else if (filteredSites.length === 2) { pos[filteredSites[0].id] = { x: centerX - sp / 2 - collapsedW / 2, y: 120, w: collapsedW, h: collapsedH }; pos[filteredSites[1].id] = { x: centerX + sp / 2 - collapsedW / 2, y: 120, w: collapsedW, h: collapsedH }; }
      else if (filteredSites.length >= 3) {
        // 2x2 grid layout centered in viewport
        const cols = 2, gapX = 100, gapY = 70;
        const rows = Math.ceil(filteredSites.length / cols);
        const gridW = cols * collapsedW + (cols - 1) * gapX;
        const gridH = rows * collapsedH + (rows - 1) * gapY;
        const startX = (svgW - gridW) / 2;
        const startY = (svgH - gridH) / 2;
        filteredSites.forEach((s, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          pos[s.id] = { x: startX + col * (collapsedW + gapX), y: startY + row * (collapsedH + gapY), w: collapsedW, h: collapsedH };
        });
      }
    }
    return pos;
  }, [filteredSites, expandedSites, anyExpanded]);

  const interSiteLines = useMemo(() => FABRIC_LINKS.map(link => {
    const fp = sitePositions[link.from], tp = sitePositions[link.to]; if (!fp || !tp) return null;
    const fOff = dragOffsets[link.from] || { dx: 0, dy: 0 };
    const tOff = dragOffsets[link.to] || { dx: 0, dy: 0 };

    // When a site is expanded, connect to the first core/border device inside it
    let fx: number, fy: number, tx: number, ty: number;

    if (expandedSites.has(link.from)) {
      // Find a border/core device in the expanded site to connect to
      const siteDevs = MOCK_DEVICES.filter(d => d.siteId === link.from);
      const connectDev = siteDevs.find(d => d.role === 'Core' || d.role === 'Border') || siteDevs[0];
      if (connectDev) {
        const layout = getDeviceLayout(siteDevs, fp.w, fp.h);
        const devPos = layout[connectDev.id];
        if (devPos) {
          fx = fp.x + devPos.x + fOff.dx;
          fy = fp.y + 36 + devPos.y + fOff.dy;
        } else {
          fx = fp.x + fp.w / 2 + fOff.dx;
          fy = fp.y + fp.h / 2 + fOff.dy;
        }
      } else {
        fx = fp.x + fp.w / 2 + fOff.dx;
        fy = fp.y + fp.h / 2 + fOff.dy;
      }
    } else {
      fx = fp.x + fp.w / 2 + fOff.dx;
      fy = fp.y + fp.h / 2 + fOff.dy;
    }

    if (expandedSites.has(link.to)) {
      const siteDevs = MOCK_DEVICES.filter(d => d.siteId === link.to);
      const connectDev = siteDevs.find(d => d.role === 'Core' || d.role === 'Border') || siteDevs[0];
      if (connectDev) {
        const layout = getDeviceLayout(siteDevs, tp.w, tp.h);
        const devPos = layout[connectDev.id];
        if (devPos) {
          tx = tp.x + devPos.x + tOff.dx;
          ty = tp.y + 36 + devPos.y + tOff.dy;
        } else {
          tx = tp.x + tp.w / 2 + tOff.dx;
          ty = tp.y + tp.h / 2 + tOff.dy;
        }
      } else {
        tx = tp.x + tp.w / 2 + tOff.dx;
        ty = tp.y + tp.h / 2 + tOff.dy;
      }
    } else {
      tx = tp.x + tp.w / 2 + tOff.dx;
      ty = tp.y + tp.h / 2 + tOff.dy;
    }

    const mx = (fx + tx) / 2, my = (fy + ty) / 2, dx = tx - fx, dy = ty - fy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { ...link, fx, fy, tx, ty, lx: mx + (-dy / len) * 14, ly: my + (dx / len) * 14 };
  }).filter(Boolean) as (FabricLink & { fx: number; fy: number; tx: number; ty: number; lx: number; ly: number })[], [sitePositions, dragOffsets, expandedSites]);

  const deviceLinks = useMemo(() => {
    if (!anyExpanded) return [];
    return INTER_SITE_DEVICE_LINKS.map(link => {
      const fd = MOCK_DEVICES.find(d => d.id === link.fromDeviceId), td = MOCK_DEVICES.find(d => d.id === link.toDeviceId);
      if (!fd || !td || !expandedSites.has(fd.siteId) || !expandedSites.has(td.siteId)) return null;
      const fsp = sitePositions[fd.siteId], tsp = sitePositions[td.siteId]; if (!fsp || !tsp) return null;
      const fl = getDeviceLayout(MOCK_DEVICES.filter(d => d.siteId === fd.siteId), fsp.w, fsp.h);
      const tl = getDeviceLayout(MOCK_DEVICES.filter(d => d.siteId === td.siteId), tsp.w, tsp.h);
      const fp = fl[link.fromDeviceId], tp = tl[link.toDeviceId]; if (!fp || !tp) return null;
      const fOff = dragOffsets[fd.siteId] || { dx: 0, dy: 0 };
      const tOff = dragOffsets[td.siteId] || { dx: 0, dy: 0 };
      return { ...link, x1: fsp.x + fp.x + fOff.dx, y1: fsp.y + 36 + fp.y + fOff.dy, x2: tsp.x + tp.x + tOff.dx, y2: tsp.y + 36 + tp.y + tOff.dy };
    }).filter(Boolean) as (DeviceConnection & { x1: number; y1: number; x2: number; y2: number })[];
  }, [sitePositions, expandedSites, anyExpanded, dragOffsets]);

  return (
    <div className="h-full flex flex-row bg-[#f8fafb] overflow-hidden">
      <OverviewDrawer sites={sites} selectedSiteId={selectedSiteId} onSelectSite={handleSelectSite} selectedDeviceId={selectedDeviceId} onSelectDevice={setSelectedDeviceId} selectedLink={selectedLink} onSelectLink={setSelectedLink} selectedSiteNeighborId={selectedSiteNeighborId} onSelectSiteNeighbor={setSelectedSiteNeighborId} selectedInterSiteLink={selectedInterSiteLink} onSelectInterSiteLink={setSelectedInterSiteLink} manualLinks={manualLinks} onDrillDevice={(siteId, deviceName) => {
        // Expand the site
        setExpandedSites(prev => { const n = new Set(prev); n.add(siteId); return n; });
        // Find device by name in that site and select it
        const dev = MOCK_DEVICES.find(d => d.siteId === siteId && d.name === deviceName);
        if (dev) {
          setSelectedDeviceId(dev.id);
          setSelectedSiteId(siteId);
          setHighlightedSiteId(siteId);
          setSelectedLink(null);
          setSelectedSiteNeighborId(null);
          setSelectedInterSiteLink(null);
        }
      }} onDrillLink={(fromSiteId, fromDeviceName, toSiteId, toDeviceName) => {
        // Expand both sites
        setExpandedSites(prev => { const n = new Set(prev); n.add(fromSiteId); n.add(toSiteId); return n; });
        // Find both devices and select the link between them
        const fromDev = MOCK_DEVICES.find(d => d.siteId === fromSiteId && d.name === fromDeviceName);
        const toDev = MOCK_DEVICES.find(d => d.siteId === toSiteId && d.name === toDeviceName);
        if (fromDev && toDev) {
          setSelectedLink({ from: fromDev.id, to: toDev.id, fromPort: 'Eth1/49', toPort: 'Eth1/1', type: 'ethernet' });
          setSelectedDeviceId(null);
          setSelectedSiteId(null);
          setSelectedSiteNeighborId(null);
          setSelectedInterSiteLink(null);
        }
      }} />
      <div className="flex-1 overflow-auto relative" ref={svgContainerRef}>

        {/* ── Canvas Toolbar (top-left) ── */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-sm px-2 py-1.5">
          {[
            { icon: '☞', label: '交互', key: 'interact' as const, title: '交互工具：拖拽画布、点击节点查看详情、滚轮缩放', onClick: () => setActiveTool('interact') },
            { icon: '⊞', label: '展开', key: null, title: '展开/折叠拓扑：双向展开或折叠所有网络层级', onClick: handleExpandAll },
            { icon: '⤢', label: '自适应', key: null, title: '自适应：自动缩放画布至合适比例', onClick: handleFitView },
            { icon: '⊕', label: '放大', key: null, title: '放大：以画布中心为基准放大10%（最大500%）', onClick: handleZoomIn },
            { icon: '⊖', label: '缩小', key: null, title: '缩小：以画布中心为基准缩小20%', onClick: handleZoomOut },
          ].map((tool, i) => (
            <button
              key={i}
              title={tool.title}
              onClick={tool.onClick}
              className={'w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-base ' + (tool.key && activeTool === tool.key ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
            >
              {tool.icon}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-0.5" />
          {[
            { icon: '↺', label: '刷新', title: '刷新：重新加载所有节点数据', onClick: handleRefresh },
            { icon: '✎', label: '添加', key: 'draw' as const, title: '手动添加：打开手动连线对话框', onClick: () => { setShowLinkEditor(true); setManualLinkRows([{ fromSiteId: '', fromDeviceId: '', fromPort: '', toSiteId: '', toDeviceId: '', toPort: '' }]); } },
            { icon: '⬆', label: '导出', title: '导出：导出当前拓扑视图为 SVG 文件', onClick: handleExport },
          ].map((tool, i) => (
            <button
              key={i}
              title={tool.title}
              onClick={tool.onClick}
              className={'w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-base ' + (tool.key && activeTool === tool.key ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* draw mode hint */}
        {activeTool === 'draw' && (
          <div className="absolute top-14 left-3 z-20 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-[11px] text-amber-700 font-medium shadow-sm">
            ✎ 绘制模式 — 点击两个已展开站点的设备创建连线
            {linkStartDevice && <span className="ml-2 text-amber-900">| 已选起点设备</span>}
          </div>
        )}
        <svg key={refreshKey} viewBox={Math.round(svgW / 2 - svgW / zoom / 2) + ' ' + Math.round(svgH / 2 - svgH / zoom / 2) + ' ' + Math.round(svgW / zoom) + ' ' + Math.round(svgH / zoom)} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* 渲染所有跨站连线（FABRIC + 手动），按站点对分组并偏移避免重叠 */}
          {(() => {
            // 收集所有需要在折叠态显示的跨站连线
            type CollapsedLink = { type: 'fabric'; data: typeof interSiteLines[0] } | { type: 'manual'; siteKey: string; links: ManualLink[] };
            const sitePairMap: Record<string, CollapsedLink[]> = {};

            // 1. FABRIC_LINKS
            interSiteLines.forEach(link => {
              if (expandedSites.has(link.from) && expandedSites.has(link.to)) return;
              const key = [link.from, link.to].sort().join('::');
              if (!sitePairMap[key]) sitePairMap[key] = [];
              sitePairMap[key].push({ type: 'fabric', data: link });
            });

            // 2. 手动连线按站点对聚合
            const siteGroupMap: Record<string, ManualLink[]> = {};
            manualLinks.forEach(link => {
              const key = [link.fromSiteId, link.toSiteId].sort().join('::');
              siteGroupMap[key] = siteGroupMap[key] || [];
              siteGroupMap[key].push(link);
            });
            Object.entries(siteGroupMap).forEach(([siteKey, groupLinks]) => {
              const first = groupLinks[0];
              if (expandedSites.has(first.fromSiteId) && expandedSites.has(first.toSiteId)) return;
              const key = [first.fromSiteId, first.toSiteId].sort().join('::');
              if (!sitePairMap[key]) sitePairMap[key] = [];
              sitePairMap[key].push({ type: 'manual', siteKey, links: groupLinks });
            });

            // 渲染每个站点对的所有连线，带垂直偏移
            const rendered: React.ReactNode[] = [];
            Object.entries(sitePairMap).forEach(([pairKey, items]) => {
              const total = items.length;
              const offsetStep = 18; // 每条线之间的垂直偏移像素

              items.forEach((item, idx) => {
                // 计算垂直偏移：居中分布
                const offsetAmount = (idx - (total - 1) / 2) * offsetStep;

                if (item.type === 'fabric') {
                  const link = item.data;
                  const dx = link.tx - link.fx, dy = link.ty - link.fy;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  // 垂直方向单位向量
                  const nx = -dy / len, ny = dx / len;
                  const ofx = nx * offsetAmount, ofy = ny * offsetAmount;
                  const x1 = link.fx + ofx, y1 = link.fy + ofy;
                  const x2 = link.tx + ofx, y2 = link.ty + ofy;
                  const mx = (x1 + x2) / 2, my2 = (y1 + y2) / 2;
                  const lx = mx + nx * 14, ly = my2 + ny * 14;

                  const lineColor = link.quality === 'congested' ? '#f59e0b' : link.quality === 'degraded' ? '#ef4444' : '#0ABAB5';
                  const dashArr = link.quality === 'optimal' ? 'none' : '6,4';
                  const isSelected = selectedInterSiteLink && ((selectedInterSiteLink.fromSiteId === link.from && selectedInterSiteLink.toSiteId === link.to) || (selectedInterSiteLink.fromSiteId === link.to && selectedInterSiteLink.toSiteId === link.from));
                  const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedInterSiteLink({ fromSiteId: link.from, toSiteId: link.to });
                    setSelectedSiteId(null); setSelectedDeviceId(null); setSelectedLink(null); setSelectedSiteNeighborId(null);
                  };
                  rendered.push(
                    <g key={'fabric-' + pairKey + '-' + idx} style={{ cursor: 'pointer' }} onClick={handleClick}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="12" />
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth={isSelected ? 4 : 2} strokeDasharray={dashArr} opacity={isSelected ? 1 : 0.7} />
                      {isSelected && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth="8" opacity="0.15" />}
                      <rect x={lx - 30} y={ly - 10} width="60" height="20" rx="6" fill="white" stroke={isSelected ? lineColor : '#e2e8f0'} strokeWidth={isSelected ? 2 : 1} />
                      <text x={lx} y={ly + 4} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">{link.latency}</text>
                    </g>
                  );
                } else {
                  const { siteKey, links: groupLinks } = item;
                  const first = groupLinks[0];
                  const fsp = sitePositions[first.fromSiteId];
                  const tsp = sitePositions[first.toSiteId];
                  if (!fsp || !tsp) return;
                  const fOff2 = dragOffsets[first.fromSiteId] || { dx: 0, dy: 0 };
                  const tOff2 = dragOffsets[first.toSiteId] || { dx: 0, dy: 0 };
                  const bfx = fsp.x + fsp.w / 2 + fOff2.dx;
                  const bfy = fsp.y + fsp.h / 2 + fOff2.dy;
                  const btx = tsp.x + tsp.w / 2 + tOff2.dx;
                  const bty = tsp.y + tsp.h / 2 + tOff2.dy;
                  const dx = btx - bfx, dy = bty - bfy;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const nx = -dy / len, ny = dx / len;
                  const ofx = nx * offsetAmount, ofy = ny * offsetAmount;
                  const x1 = bfx + ofx, y1 = bfy + ofy;
                  const x2 = btx + ofx, y2 = bty + ofy;
                  const mx = (x1 + x2) / 2, my2 = (y1 + y2) / 2;
                  const lx = mx + nx * 14, ly = my2 + ny * 14;

                  const memberCount = groupLinks.length;
                  const linkColor = '#6366f1';
                  const isSelected = selectedInterSiteLink && ((selectedInterSiteLink.fromSiteId === first.fromSiteId && selectedInterSiteLink.toSiteId === first.toSiteId) || (selectedInterSiteLink.fromSiteId === first.toSiteId && selectedInterSiteLink.toSiteId === first.fromSiteId));
                  const isHovered = hoveredManualLink === siteKey;
                  const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedInterSiteLink({ fromSiteId: first.fromSiteId, toSiteId: first.toSiteId, manualLinkIds: groupLinks.map(l => l.id) });
                    setSelectedSiteId(null); setSelectedDeviceId(null); setSelectedLink(null); setSelectedSiteNeighborId(null);
                  };
                  rendered.push(
                    <g key={'manual-site-' + pairKey + '-' + idx} style={{ cursor: 'pointer' }} 
                      onMouseEnter={() => setHoveredManualLink(siteKey)}
                      onMouseLeave={() => setHoveredManualLink(null)}
                      onClick={handleClick}
                    >
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />
                      {(isSelected || isHovered) && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={linkColor} strokeWidth="8" opacity="0.12" />}
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={linkColor} strokeWidth={isSelected || isHovered ? 3.5 : 2.5} strokeDasharray="8,4" opacity={isSelected || isHovered ? 1 : 0.7} />
                      <rect x={lx - (memberCount > 1 ? 18 : 14)} y={ly - 10} width={memberCount > 1 ? 36 : 28} height="20" rx="10" fill="white" stroke={linkColor} strokeWidth={isSelected || isHovered ? 2 : 1.2} />
                      <text x={lx} y={ly + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={linkColor}>{memberCount > 1 ? `×${memberCount}` : '1'}</text>
                      {isHovered && (
                        <g 
                          style={{ cursor: 'pointer' }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLinkToDelete(groupLinks.map(l => l.id));
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <circle cx={lx + (memberCount > 1 ? 26 : 20)} cy={ly} r="9" fill="#ef4444" />
                          <line x1={lx + (memberCount > 1 ? 26 : 20) - 3.5} y1={ly - 3.5} x2={lx + (memberCount > 1 ? 26 : 20) + 3.5} y2={ly + 3.5} stroke="white" strokeWidth="2" strokeLinecap="round" />
                          <line x1={lx + (memberCount > 1 ? 26 : 20) + 3.5} y1={ly - 3.5} x2={lx + (memberCount > 1 ? 26 : 20) - 3.5} y2={ly + 3.5} stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </g>
                      )}
                    </g>
                  );
                }
              });
            });
            return rendered;
          })()}
          {filteredSites.map(site => {
            const pos = sitePositions[site.id]; if (!pos) return null;
            const isExp = expandedSites.has(site.id), devs = MOCK_DEVICES.filter(d => d.siteId === site.id);
            const isHL = highlightedSiteId === site.id;
            const off = dragOffsets[site.id] || { dx: 0, dy: 0 };
            const tx = pos.x + off.dx, ty = pos.y + off.dy;
            return (
              <g key={site.id} style={{ cursor: activeTool === 'interact' ? 'grab' : 'pointer' }}
                onDoubleClick={() => toggleExpand(site.id)}
                onClick={() => { if (!isExp) { setSelectedSiteNeighborId(site.id); setSelectedSiteId(null); setSelectedDeviceId(null); setSelectedLink(null); setHighlightedSiteId(site.id); setSelectedInterSiteLink(null); } }}
                onMouseDown={(e) => onSiteMouseDown(e, site.id)}
                transform={'translate(' + off.dx + ',' + off.dy + ')'}
              >
                {isHL && <rect x={pos.x - 4} y={pos.y - 4} width={pos.w + 8} height={pos.h + 8} rx="20" fill="none" stroke="#0ABAB5" strokeWidth="3" opacity="0.7" strokeDasharray="6,3" />}
                {isExp ? <ExpandedSiteContent 
                  site={site} 
                  devices={devs} 
                  x={pos.x} y={pos.y} w={pos.w} h={pos.h} 
                  onDeviceClick={(d) => {
                    if (activeTool === 'draw') {
                      // 绘制模式:选择设备进行连线
                      if (!linkStartDevice) {
                        // 选择起点
                        setLinkStartDevice(d.id);
                      } else if (linkStartDevice !== d.id) {
                        // 选择终点,打开手动连线对话框并预填
                        const fromDev = MOCK_DEVICES.find(dev => dev.id === linkStartDevice);
                        const toDev = d;
                        setManualLinkRows([{ 
                          fromSiteId: fromDev?.siteId || '', 
                          fromDeviceId: linkStartDevice, 
                          fromPort: '', 
                          toSiteId: toDev.siteId, 
                          toDeviceId: toDev.id, 
                          toPort: '' 
                        }]);
                        setShowLinkEditor(true);
                        setLinkStartDevice(null);
                      }
                    } else {
                      // 正常模式:选择设备查看详情
                      setSelectedDeviceId(d.id); 
                      setSelectedLink(null);
                    }
                  }} 
                  selectedDeviceId={selectedDeviceId} 
                  highlightedDeviceId={linkStartDevice}
                  onHeaderClick={() => { setSelectedDeviceId(null); setSelectedLink(null); setSelectedSiteId(site.id); setHighlightedSiteId(site.id); }} 
                  onLinkClick={(l) => { setSelectedLink(l); setSelectedDeviceId(null); }} 
                  selectedLink={selectedLink} 
                /> : <CollapsedSiteContent site={site} devices={devs} x={pos.x} y={pos.y} w={pos.w} h={pos.h} />}
              </g>
            );
          })}
          {deviceLinks.map((link, i) => {
            const isDeg = link.status === 'degraded', col = isDeg ? '#f59e0b' : '#0ABAB5';
            const midX = (link.x1 + link.x2) / 2, cpY = Math.min(link.y1, link.y2) - 60 - i * 30;
            const ly = cpY + (Math.min(link.y1, link.y2) - cpY) * 0.35;
            const pathD = 'M' + link.x1 + ',' + link.y1 + ' Q' + midX + ',' + cpY + ' ' + link.x2 + ',' + link.y2;
            const dashArr2 = isDeg ? '8,4' : 'none';
            const isSelected = selectedLink && ((selectedLink.from === link.fromDeviceId && selectedLink.to === link.toDeviceId) || (selectedLink.from === link.toDeviceId && selectedLink.to === link.fromDeviceId));
            const handleDevLinkClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedLink({ from: link.fromDeviceId, to: link.toDeviceId, fromPort: link.fromPort, toPort: link.toPort, type: 'ethernet' });
              setSelectedDeviceId(null); setSelectedSiteId(null); setSelectedSiteNeighborId(null); setSelectedInterSiteLink(null);
            };
            return (<g key={'dl' + i} style={{ cursor: 'pointer' }} onClick={handleDevLinkClick}>
              <path d={pathD} fill="none" stroke="transparent" strokeWidth="12" />
              {isSelected && <path d={pathD} fill="none" stroke={col} strokeWidth="8" opacity="0.2" />}
              <path d={pathD} fill="none" stroke={col} strokeWidth={isSelected ? 4 : 2.5} strokeDasharray={dashArr2} opacity={isSelected ? 1 : 0.85} />
              <circle cx={link.x1} cy={link.y1} r={isSelected ? 8 : 6} fill={col} opacity={isSelected ? 0.5 : 0.35} />
              <circle cx={link.x2} cy={link.y2} r={isSelected ? 8 : 6} fill={col} opacity={isSelected ? 0.5 : 0.35} />
              <rect x={midX - 22} y={ly - 11} width="44" height="22" rx="11" fill="white" stroke={col} strokeWidth={isSelected ? 2.5 : 1.5} />
              <text x={midX} y={ly + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={col}>{link.bandwidth}</text>
            </g>);
          })}
          {/* 渲染手动添加的连线（聚合显示） */}
          {(() => {
            // 按设备对聚合：同一对设备间的多条链路合并为一组
            const groupMap: Record<string, ManualLink[]> = {};
            manualLinks.forEach(link => {
              const key = [link.fromDeviceId, link.toDeviceId].sort().join('::');
              if (!groupMap[key]) groupMap[key] = [];
              groupMap[key].push(link);
            });
            return Object.entries(groupMap).map(([groupKey, groupLinks], gi) => {
              const first = groupLinks[0];
              const fd = MOCK_DEVICES.find(d => d.id === first.fromDeviceId);
              const td = MOCK_DEVICES.find(d => d.id === first.toDeviceId);
              if (!fd || !td || !expandedSites.has(fd.siteId) || !expandedSites.has(td.siteId)) return null;
              const fsp = sitePositions[fd.siteId];
              const tsp = sitePositions[td.siteId];
              if (!fsp || !tsp) return null;
              const fl = getDeviceLayout(MOCK_DEVICES.filter(d => d.siteId === fd.siteId), fsp.w, fsp.h);
              const tl = getDeviceLayout(MOCK_DEVICES.filter(d => d.siteId === td.siteId), tsp.w, tsp.h);
              const fp = fl[first.fromDeviceId];
              const tp = tl[first.toDeviceId];
              if (!fp || !tp) return null;
              const fOff = dragOffsets[fd.siteId] || { dx: 0, dy: 0 };
              const tOff = dragOffsets[td.siteId] || { dx: 0, dy: 0 };
              const x1 = fsp.x + fp.x + fOff.dx;
              const y1 = fsp.y + 36 + fp.y + fOff.dy;
              const x2 = tsp.x + tp.x + tOff.dx;
              const y2 = tsp.y + 36 + tp.y + tOff.dy;
              const midX = (x1 + x2) / 2;
              const cpY = Math.min(y1, y2) - 60 - (deviceLinks.length + gi) * 30;
              const pathD = 'M' + x1 + ',' + y1 + ' Q' + midX + ',' + cpY + ' ' + x2 + ',' + y2;
              const curveMidX = 0.25 * x1 + 0.5 * midX + 0.25 * x2;
              const curveMidY = 0.25 * y1 + 0.5 * cpY + 0.25 * y2;
              const linkColor = '#6366f1';
              const memberCount = groupLinks.length;
              const isAgg = memberCount > 1;
              const isSelected = selectedLink && ((selectedLink.from === first.fromDeviceId && selectedLink.to === first.toDeviceId) || (selectedLink.from === first.toDeviceId && selectedLink.to === first.fromDeviceId));
              const isHovered = hoveredManualLink === groupKey;
              const strokeW = isAgg ? (isSelected || isHovered ? 5 : 3.5) : (isSelected || isHovered ? 3.5 : 2);
              return (
                <g 
                  key={'agg-' + gi} 
                  style={{ cursor: 'pointer' }} 
                  onMouseEnter={() => setHoveredManualLink(groupKey)}
                  onMouseLeave={() => setHoveredManualLink(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLink({ from: first.fromDeviceId, to: first.toDeviceId, fromPort: first.fromPort, toPort: first.toPort, type: first.type });
                    setSelectedDeviceId(null);
                    setSelectedSiteId(null);
                    setSelectedSiteNeighborId(null);
                    setSelectedInterSiteLink(null);
                  }}
                >
                  {/* 宽透明区域用于捕获鼠标悬停 */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />
                  {(isSelected || isHovered) && <path d={pathD} fill="none" stroke={linkColor} strokeWidth={strokeW + 5} opacity="0.12" />}
                  {/* 聚合时画双线效果 */}
                  {isAgg && <path d={pathD} fill="none" stroke={linkColor} strokeWidth={strokeW + 2} strokeDasharray="8,4" opacity={0.25} />}
                  <path d={pathD} fill="none" stroke={linkColor} strokeWidth={strokeW} strokeDasharray="8,4" opacity={isSelected || isHovered ? 1 : 0.75} />
                  <circle cx={x1} cy={y1} r={isSelected || isHovered ? 7 : 5} fill={linkColor} opacity={isSelected || isHovered ? 0.5 : 0.3} />
                  <circle cx={x2} cy={y2} r={isSelected || isHovered ? 7 : 5} fill={linkColor} opacity={isSelected || isHovered ? 0.5 : 0.3} />
                  {/* 聚合数量标签 */}
                  {isAgg && (
                    <g>
                      <rect x={curveMidX - 14} y={curveMidY - 10} width="28" height="20" rx="10" fill="white" stroke={linkColor} strokeWidth="1.5" />
                      <text x={curveMidX} y={curveMidY + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={linkColor}>×{memberCount}</text>
                    </g>
                  )}
                  {/* 删除按钮 */}
                  <g 
                    style={{ cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLinkToDelete(groupLinks.map(l => l.id));
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <circle cx={curveMidX + (isAgg ? 22 : 0)} cy={curveMidY + (isAgg ? 0 : 0)} r={isHovered ? 11 : 9} fill={isHovered ? '#ef4444' : 'white'} stroke={isHovered ? 'white' : '#ef4444'} strokeWidth="1.5" style={{ display: isAgg ? undefined : undefined }} />
                    <line x1={curveMidX + (isAgg ? 22 : 0) - 3.5} y1={curveMidY - 3.5} x2={curveMidX + (isAgg ? 22 : 0) + 3.5} y2={curveMidY + 3.5} stroke={isHovered ? 'white' : '#ef4444'} strokeWidth="2" strokeLinecap="round" />
                    <line x1={curveMidX + (isAgg ? 22 : 0) + 3.5} y1={curveMidY - 3.5} x2={curveMidX + (isAgg ? 22 : 0) - 3.5} y2={curveMidY + 3.5} stroke={isHovered ? 'white' : '#ef4444'} strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
              );
            });
          })()}
        </svg>
        <div className="absolute bottom-3 right-3 flex items-center gap-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-sm px-4 py-2.5" style={{ fontSize: 10, color: '#64748b' }}>
          <div className="flex items-center gap-1.5"><div className="w-5 h-[2px] bg-[#0ABAB5]" /><span>Optimal</span></div>
          <div className="flex items-center gap-1.5"><div className="w-5 h-[2px] border-t-2 border-dashed border-[#f59e0b]" /><span>Congested</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]" /><span>Online</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /><span>Provisioning</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /><span>Offline</span></div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Click site to expand</span>
        </div>
      </div>
      
      {/* 手动连线弹窗 */}
      {showLinkEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-[900px] max-w-[95vw] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">手动连线</h3>
              <button 
                onClick={() => { setShowLinkEditor(false); setManualLinkRows([{ fromSiteId: '', fromDeviceId: '', fromPort: '', toSiteId: '', toDeviceId: '', toPort: '' }]); }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="text-slate-400 text-xl">×</span>
              </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_1fr_1fr_1fr_auto] gap-2 mb-3 px-1">
              <div className="w-6" />
              <span className="text-xs font-bold text-slate-500 text-center">源Site</span>
              <span className="text-xs font-bold text-slate-500 text-center">源设备</span>
              <span className="text-xs font-bold text-slate-500 text-center">源接口</span>
              <div className="w-10" />
              <span className="text-xs font-bold text-slate-500 text-center">目标Site</span>
              <span className="text-xs font-bold text-slate-500 text-center">目标设备</span>
              <span className="text-xs font-bold text-slate-500 text-center">目标接口</span>
              <div className="w-6" />
            </div>

            {/* Rows */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {manualLinkRows.map((row, idx) => {
                const fromSiteDevices = row.fromSiteId ? MOCK_DEVICES.filter(d => d.siteId === row.fromSiteId) : [];
                const toSiteDevices = row.toSiteId ? MOCK_DEVICES.filter(d => d.siteId === row.toSiteId) : [];
                const fromDevice = MOCK_DEVICES.find(d => d.id === row.fromDeviceId);
                const toDevice = MOCK_DEVICES.find(d => d.id === row.toDeviceId);
                const fromPorts = fromDevice ? Array.from({ length: 8 }, (_, i) => `Eth1/${i + 1}`) : [];
                const toPorts = toDevice ? Array.from({ length: 8 }, (_, i) => `Eth1/${i + 1}`) : [];

                return (
                  <div key={idx} className="grid grid-cols-[auto_1fr_1fr_1fr_auto_1fr_1fr_1fr_auto] gap-2 items-center">
                    {/* Row number */}
                    <span className="text-xs text-slate-400 w-6 text-center font-medium">{idx + 1}</span>

                    {/* Source Site */}
                    <div className="relative">
                      <select
                        value={row.fromSiteId}
                        onChange={(e) => {
                          const newRows = [...manualLinkRows];
                          newRows[idx] = { ...newRows[idx], fromSiteId: e.target.value, fromDeviceId: '', fromPort: '' };
                          setManualLinkRows(newRows);
                        }}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5]"
                      >
                        <option value="">选择Site</option>
                        {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Source Device */}
                    <div className="relative">
                      <select
                        value={row.fromDeviceId}
                        onChange={(e) => {
                          const newRows = [...manualLinkRows];
                          newRows[idx] = { ...newRows[idx], fromDeviceId: e.target.value, fromPort: '' };
                          setManualLinkRows(newRows);
                        }}
                        disabled={!row.fromSiteId}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">选择设备</option>
                        {fromSiteDevices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Source Port */}
                    <div className="relative">
                      <select
                        value={row.fromPort}
                        onChange={(e) => {
                          const newRows = [...manualLinkRows];
                          newRows[idx] = { ...newRows[idx], fromPort: e.target.value };
                          setManualLinkRows(newRows);
                        }}
                        disabled={!row.fromDeviceId}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">选择接口</option>
                        {fromPorts.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center justify-center w-10">
                      <svg width="32" height="12" viewBox="0 0 32 12">
                        <line x1="0" y1="6" x2="24" y2="6" stroke="#0ABAB5" strokeWidth="1.5" strokeDasharray="3,2" />
                        <polygon points="24,2 32,6 24,10" fill="#0ABAB5" />
                      </svg>
                    </div>

                    {/* Destination Site */}
                    <div className="relative">
                      <select
                        value={row.toSiteId}
                        onChange={(e) => {
                          const newRows = [...manualLinkRows];
                          newRows[idx] = { ...newRows[idx], toSiteId: e.target.value, toDeviceId: '', toPort: '' };
                          setManualLinkRows(newRows);
                        }}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5]"
                      >
                        <option value="">选择Site</option>
                        {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Destination Device */}
                    <div className="relative">
                      <select
                        value={row.toDeviceId}
                        onChange={(e) => {
                          const newRows = [...manualLinkRows];
                          newRows[idx] = { ...newRows[idx], toDeviceId: e.target.value, toPort: '' };
                          setManualLinkRows(newRows);
                        }}
                        disabled={!row.toSiteId}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">选择设备</option>
                        {toSiteDevices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Destination Port */}
                    <div className="relative">
                      <select
                        value={row.toPort}
                        onChange={(e) => {
                          const newRows = [...manualLinkRows];
                          newRows[idx] = { ...newRows[idx], toPort: e.target.value };
                          setManualLinkRows(newRows);
                        }}
                        disabled={!row.toDeviceId}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">选择接口</option>
                        {toPorts.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Delete row button */}
                    <button
                      onClick={() => {
                        if (manualLinkRows.length > 1) {
                          setManualLinkRows(manualLinkRows.filter((_, i) => i !== idx));
                        }
                      }}
                      disabled={manualLinkRows.length <= 1}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add row button */}
            <button
              onClick={() => setManualLinkRows([...manualLinkRows, { fromSiteId: '', fromDeviceId: '', fromPort: '', toSiteId: '', toDeviceId: '', toPort: '' }])}
              className="flex items-center gap-2 mt-4 text-[#0ABAB5] text-sm font-medium hover:text-[#09a5a0] transition-colors"
            >
              <Plus size={14} className="border border-[#0ABAB5] rounded-full" /> 添加连线
            </button>

            {/* Footer buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowLinkEditor(false); setManualLinkRows([{ fromSiteId: '', fromDeviceId: '', fromPort: '', toSiteId: '', toDeviceId: '', toPort: '' }]); }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const validRows = manualLinkRows.filter(r => r.fromSiteId && r.fromDeviceId && r.fromPort && r.toSiteId && r.toDeviceId && r.toPort);
                  if (validRows.length > 0) {
                    const newLinks: ManualLink[] = validRows.map(r => ({
                      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      fromSiteId: r.fromSiteId,
                      fromDeviceId: r.fromDeviceId,
                      fromPort: r.fromPort,
                      toSiteId: r.toSiteId,
                      toDeviceId: r.toDeviceId,
                      toPort: r.toPort,
                      type: 'ethernet' as const
                    }));
                    setManualLinks([...manualLinks, ...newLinks]);
                    setShowLinkEditor(false);
                    setManualLinkRows([{ fromSiteId: '', fromDeviceId: '', fromPort: '', toSiteId: '', toDeviceId: '', toPort: '' }]);
                  }
                }}
                className="flex-1 px-4 py-2 bg-[#0ABAB5] text-white rounded-lg text-sm font-bold hover:bg-[#09a5a0] transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 删除确认弹窗 */}
      {showDeleteConfirm && linkToDelete && linkToDelete.length > 0 && (() => {
        const linksToRemove = manualLinks.filter(l => linkToDelete.includes(l.id));
        const isAgg = linksToRemove.length > 1;
        // 按设备对分组
        const devicePairGroups: Record<string, typeof linksToRemove> = {};
        linksToRemove.forEach(link => {
          const key = link.fromDeviceId + '::' + link.toDeviceId;
          if (!devicePairGroups[key]) devicePairGroups[key] = [];
          devicePairGroups[key].push(link);
        });
        const groups = Object.values(devicePairGroups);
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-[720px] max-w-[95vw] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-2xl">!</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
              {isAgg ? `确认删除聚合连线（${linksToRemove.length}条）` : '确认删除连线'}
            </h3>
            <p className="text-sm text-slate-600 text-center mb-4">
              以下连线将被永久删除，此操作无法撤销。请仔细确认。
            </p>
            
            {/* 表格形式展示，和添加弹窗格式一致 */}
            <div className="max-h-[260px] overflow-y-auto mb-5 border border-slate-200 rounded-xl">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500">本端站点</th>
                    <th className="text-left px-2 py-2 text-[10px] font-bold text-slate-500">本端设备</th>
                    <th className="text-left px-2 py-2 text-[10px] font-bold text-slate-500">本端链路</th>
                    <th className="text-center px-1 py-2 w-6"></th>
                    <th className="text-left px-2 py-2 text-[10px] font-bold text-slate-500">对端站点</th>
                    <th className="text-left px-2 py-2 text-[10px] font-bold text-slate-500">对端设备</th>
                    <th className="text-left px-2 py-2 text-[10px] font-bold text-slate-500">对端链路</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, gi) => {
                    const gFirst = group[0];
                    const gFromDev = MOCK_DEVICES.find(d => d.id === gFirst.fromDeviceId);
                    const gToDev = MOCK_DEVICES.find(d => d.id === gFirst.toDeviceId);
                    const gFromSite = filteredSites.find(s => s.id === gFirst.fromSiteId);
                    const gToSite = filteredSites.find(s => s.id === gFirst.toSiteId);
                    return group.map((link, li) => (
                      <tr key={link.id} className={gi > 0 && li === 0 ? 'border-t-2 border-slate-200' : li > 0 ? 'border-t border-slate-50' : 'border-t border-slate-100'}>
                        {li === 0 && <td className="px-3 py-2 text-slate-700 font-medium align-top" rowSpan={group.length}>{gFromSite?.name || '—'}</td>}
                        {li === 0 && <td className="px-2 py-2 text-slate-700 font-medium align-top" rowSpan={group.length}>{gFromDev?.name || '—'}</td>}
                        <td className="px-2 py-2 text-[#6366f1] font-medium">{link.fromPort}</td>
                        <td className="px-1 py-2 text-center text-slate-300">→</td>
                        {li === 0 && <td className="px-2 py-2 text-slate-700 font-medium align-top" rowSpan={group.length}>{gToSite?.name || '—'}</td>}
                        {li === 0 && <td className="px-2 py-2 text-slate-700 font-medium align-top" rowSpan={group.length}>{gToDev?.name || '—'}</td>}
                        <td className="px-2 py-2 text-[#6366f1] font-medium">{link.toPort}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setLinkToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setManualLinks(links => links.filter(l => !linkToDelete.includes(l.id)));
                  setShowDeleteConfirm(false);
                  setLinkToDelete(null);
                  setSelectedLink(null);
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
              >
                {isAgg ? `删除全部 ${linksToRemove.length} 条` : '确认删除'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

// ==================== Main SiteMap Component ====================
const SiteMap: React.FC<SiteMapProps> = ({ sites, onSelectSite }) => {
  const [activeTab, setActiveTab] = useState<'globe' | 'network'>('network');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [networkKey, setNetworkKey] = useState(0);

  const regions = useMemo(() => ['All', ...Array.from(new Set(sites.map(s => s.region)))], [sites]);

  return (
    <div className="h-full flex flex-col bg-[#f8fafb]">
      {/* Top bar: Tab 左侧，下拉框右侧，同一行 */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200/80 shadow-sm">
        {/* Left: View tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('network'); setNetworkKey(k => k + 1); }}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ' + (activeTab === 'network' ? 'bg-white text-[#0ABAB5] shadow-sm' : 'text-slate-500 hover:text-slate-700')}
          >
            <Network size={14} /> Network View
          </button>
          <button
            onClick={() => setActiveTab('globe')}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ' + (activeTab === 'globe' ? 'bg-white text-[#0ABAB5] shadow-sm' : 'text-slate-500 hover:text-slate-700')}
          >
            <Globe size={14} /> Globe View
          </button>
        </div>

        {/* Right: Filter dropdowns */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Region:</span>
            <select
              value={filterRegion}
              onChange={e => setFilterRegion(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#0ABAB5]/40 focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5] cursor-pointer transition-colors"
            >
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#0ABAB5]/40 focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5] cursor-pointer transition-colors"
            >
              {['All', 'Campus', 'DataCenter', 'Optical'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'globe'
          ? <GlobeView sites={sites} onSelectSite={onSelectSite} />
          : <NetworkView key={networkKey} sites={sites} onSelectSite={onSelectSite} filterRegion={filterRegion} filterType={filterType} />
        }
      </div>
    </div>
  );
};

export default SiteMap;
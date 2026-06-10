import React, { useState } from 'react';
import { Search, Upload, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Download, Trash2, Eye, CloudUpload, FileUp, Zap, ExternalLink, RotateCcw } from 'lucide-react';

const MOCK_LICENSES = [
  { id: 'LIC-2024-00128', sysname: 'DC-Core-01', ip: '10.1.1.1', switchSN: 'SN-A1B2C3', mac: '00:1A:2B:3C:4D:01', version: 'PicOS 4.6.1', hwid: '0A:1B:2C:3D:4E:5F', expiryDate: '2026-12-15', activationTime: '2025-12-15', totalDays: 365, remainingDays: 217, status: 'activated' as const, type: 'Subscription', group: 'DC-Fabric-1' },
  { id: 'LIC-2024-00129', sysname: 'DC-Leaf-03', ip: '10.1.2.3', switchSN: 'SN-D4E5F6', mac: '00:1A:2B:3C:4D:02', version: 'PicOS 4.6.1', hwid: '2C:3D:4E:5F:6A:7B', expiryDate: '2026-06-20', activationTime: '2025-06-20', totalDays: 365, remainingDays: 39, status: 'expiring_soon' as const, type: 'Subscription', group: 'DC-Fabric-1' },
  { id: 'LIC-2024-00130', sysname: 'DC-Spine-02', ip: '10.1.1.2', switchSN: 'SN-G7H8I9', mac: '00:1A:2B:3C:4D:03', version: 'PicOS 4.5.2', hwid: '4E:5F:6A:7B:8C:9D', expiryDate: '2027-03-01', activationTime: '', totalDays: 0, remainingDays: 0, status: 'not_activated' as const, type: 'Perpetual', group: 'DC-Fabric-2' },
  { id: 'LIC-2024-00131', sysname: 'DC-Leaf-07', ip: '10.1.3.7', switchSN: 'SN-J1K2L3', mac: '00:1A:2B:3C:4D:04', version: 'PicOS 4.6.0', hwid: '6A:7B:8C:9D:AE:BF', expiryDate: '2025-04-30', activationTime: '2024-04-30', totalDays: 365, remainingDays: 0, status: 'expired' as const, type: 'Subscription', group: 'DC-Fabric-1' },
  { id: 'LIC-2024-00132', sysname: 'DC-Core-02', ip: '10.1.1.3', switchSN: 'SN-M4N5O6', mac: '00:1A:2B:3C:4D:05', version: 'PicOS 4.6.1', hwid: '8C:9D:AE:BF:C0:D1', expiryDate: '2027-01-10', activationTime: '2026-01-10', totalDays: 365, remainingDays: 243, status: 'activated' as const, type: 'Subscription', group: 'DC-Fabric-2' },
  { id: 'LIC-2024-00133', sysname: 'DC-Leaf-12', ip: '10.1.4.12', switchSN: 'SN-P7Q8R9', mac: '00:1A:2B:3C:4D:06', version: 'PicOS 4.5.2', hwid: 'AE:BF:C0:D1:E2:F3', expiryDate: '2026-08-22', activationTime: '2025-08-22', totalDays: 365, remainingDays: 102, status: 'activated' as const, type: 'Perpetual', group: 'DC-Fabric-2' },
  { id: 'LIC-2024-00134', sysname: 'DC-Border-01', ip: '10.1.5.1', switchSN: 'SN-S1T2U3', mac: '00:1A:2B:3C:4D:07', version: 'PicOS 4.6.1', hwid: 'C0:D1:E2:F3:04:15', expiryDate: '2026-11-05', activationTime: '2025-11-05', totalDays: 365, remainingDays: 177, status: 'activated' as const, type: 'Subscription', group: 'DC-Fabric-1' },
  { id: 'LIC-2024-00135', sysname: 'DC-Leaf-15', ip: '10.1.4.15', switchSN: 'SN-V4W5X6', mac: '00:1A:2B:3C:4D:08', version: 'PicOS 4.6.0', hwid: 'E2:F3:04:15:26:37', expiryDate: '2026-05-28', activationTime: '2025-05-28', totalDays: 365, remainingDays: 16, status: 'expiring_soon' as const, type: 'Subscription', group: 'DC-Fabric-2' },
];

type LicenseStatus = 'activated' | 'not_activated' | 'expiring_soon' | 'expired';
type TabType = 'overview' | 'online_activate' | 'import';
type StatusFilter = 'all' | LicenseStatus;

const STATUS_CONFIG: Record<LicenseStatus, { label: string; color: string; bg: string; icon: any }> = {
  activated: { label: 'Activated', color: '#10b981', bg: '#ecfdf5', icon: CheckCircle2 },
  not_activated: { label: 'Not Activated', color: '#94a3b8', bg: '#f8fafc', icon: Clock },
  expiring_soon: { label: 'Expiring Soon', color: '#f59e0b', bg: '#fffbeb', icon: AlertTriangle },
  expired: { label: 'Expired', color: '#ef4444', bg: '#fef2f2', icon: XCircle },
};

// ===== Donut Chart Component (SVG) =====
const DonutChart: React.FC = () => {
  const stats = { activated: MOCK_LICENSES.filter(l => l.status === 'activated').length, not_activated: MOCK_LICENSES.filter(l => l.status === 'not_activated').length, expiring_soon: MOCK_LICENSES.filter(l => l.status === 'expiring_soon').length, expired: MOCK_LICENSES.filter(l => l.status === 'expired').length };
  const total = MOCK_LICENSES.length;
  const segments = [
    { value: stats.activated, color: '#10b981', label: 'Activated' },
    { value: stats.expiring_soon, color: '#f59e0b', label: 'Expiring Soon' },
    { value: stats.not_activated, color: '#94a3b8', label: 'Not Activated' },
    { value: stats.expired, color: '#ef4444', label: 'Expired' },
  ];
  const radius = 52, strokeWidth = 14, circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '20px 24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => {
            const segLen = (seg.value / total) * circumference;
            const dash = `${segLen} ${circumference - segLen}`;
            const currentOffset = offset;
            offset += segLen;
            return <circle key={i} cx="65" cy="65" r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={dash} strokeDashoffset={-currentOffset} strokeLinecap="round" transform="rotate(-90 65 65)" style={{ transition: 'all 0.5s' }} />;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{total}</span>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Total</span>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', flex: 1 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '11px', color: '#64748b' }}>{seg.label}</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{seg.value} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>({total > 0 ? Math.round(seg.value / total * 100) : 0}%)</span></p>
            </div>
          </div>
        ))}
      </div>
      {/* Compliance Score - inspired by Cisco */}
      <div style={{ textAlign: 'center', padding: '16px 24px', borderLeft: '1px solid #f1f5f9', flexShrink: 0 }}>
        <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Compliance</p>
        <p style={{ fontSize: '32px', fontWeight: 800, color: stats.expired > 0 ? '#f59e0b' : '#10b981' }}>{total > 0 ? Math.round((stats.activated / total) * 100) : 0}%</p>
        <p style={{ fontSize: '10px', color: '#94a3b8' }}>{stats.activated}/{total} compliant</p>
      </div>
    </div>
  );
};

const ValidityBar: React.FC<{ remainingDays: number; totalDays: number; status: LicenseStatus }> = ({ remainingDays, totalDays, status }) => {
  if (status === 'not_activated' || totalDays === 0) return <span style={{ fontSize: '12px', color: '#94a3b8' }}>--</span>;
  const ratio = Math.max(0, Math.min(1, remainingDays / totalDays));
  const barColor = status === 'expired' ? '#ef4444' : status === 'expiring_soon' ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
      <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${ratio * 100}%`, height: '100%', background: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>{remainingDays > 0 ? `${remainingDays}d` : 'Expired'}</span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: LicenseStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: config.color, background: config.bg }}>
      <Icon size={12} />{config.label}
    </span>
  );
};

// ===== License Detail Panel =====
const MOCK_HISTORY: Record<string, Array<{time: string; user: string; action: string}>> = {
  'LIC-2024-00128': [
    { time: '2025-12-15 10:30', user: 'admin', action: 'Activated via Online Activate' },
    { time: '2025-12-15 10:29', user: 'system', action: 'Portal API queried - License found' },
    { time: '2025-12-15 10:28', user: 'system', action: 'HWID matched from Parking Lot' },
  ],
  'LIC-2024-00129': [
    { time: '2025-06-20 14:15', user: 'admin', action: 'Activated via Import' },
    { time: '2025-06-20 14:14', user: 'system', action: 'License file parsed successfully' },
    { time: '2025-06-20 14:13', user: 'admin', action: 'License file uploaded' },
  ],
};

const LicenseDetailPanel: React.FC<{ license: typeof MOCK_LICENSES[0]; onClose: () => void }> = ({ license, onClose }) => {
  const history = MOCK_HISTORY[license.id] || [{ time: license.activationTime || '--', user: 'system', action: 'License created' }];
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button onClick={onClose} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>← Back</button>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>License Details</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{license.sysname}</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{license.id}</p>
          </div>
          <StatusBadge status={license.status} />
        </div>
      </div>
      {/* Scrollable Content: Info + History */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {/* Info Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            ['License ID', license.id],
            ['Switch SN', license.switchSN],
            ['Hardware ID', license.hwid],
            ['Type', license.type],
            ['IP Address', license.ip],
            ['PicOS Version', license.version],
            ['Activation Time', license.activationTime || '--'],
            ['Expiry Date', license.expiryDate],
            ['Total Validity', license.totalDays > 0 ? `${license.totalDays} days` : '--'],
            ['Remaining', license.remainingDays > 0 ? `${license.remainingDays} days` : license.status === 'not_activated' ? '--' : 'Expired'],
            ['Source', 'Online Activate'],
            ['Group', license.group],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', fontFamily: label === 'Hardware ID' || label === 'IP Address' ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
          {license.totalDays > 0 && (
            <div style={{ marginTop: '4px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Validity Progress</p>
              <ValidityBar remainingDays={license.remainingDays} totalDays={license.totalDays} status={license.status} />
            </div>
          )}
        </div>
        {/* History Section - soft separator */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>Activity History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {history.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < history.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? '#3b82f6' : '#cbd5e1', flexShrink: 0 }} />
                  {i < history.length - 1 && <div style={{ width: '1px', flex: 1, background: '#e2e8f0' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{entry.action}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{entry.time} · {entry.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Action Menu Component =====
const ActionMenu: React.FC<{ status: LicenseStatus; licId: string; onViewDetails?: () => void }> = ({ status, licId, onViewDetails }) => {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  // 操作可用性矩阵
  const actions = [
    { label: 'View Details', icon: Eye, color: '#64748b', enabled: true, onClick: () => { setOpen(false); onViewDetails?.(); } },
    { label: 'Activate', icon: Zap, color: '#10b981', enabled: status === 'not_activated' || status === 'expired', onClick: () => setOpen(false) },
    { label: 'Renew', icon: RefreshCw, color: '#3b82f6', enabled: status === 'expiring_soon' || status === 'expired', onClick: () => setOpen(false) },
  ];
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = actions.length * 36 + 8;
      if (spaceBelow < menuHeight) {
        setMenuPos({ top: rect.top - menuHeight, left: rect.right - 150 });
      } else {
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 150 });
      }
    }
    setOpen(!open);
  };
  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={handleOpen} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: '11px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      {open && (<>
        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '150px', overflow: 'hidden' }}>
          {actions.map((action, i) => { const Icon = action.icon; return (
            <button key={action.label} onClick={action.enabled ? action.onClick : undefined} disabled={!action.enabled} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: action.enabled ? 'pointer' : 'not-allowed', fontSize: '12px', color: action.enabled ? action.color : '#cbd5e1', fontWeight: 500, textAlign: 'left', borderBottom: i < actions.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <Icon size={13} />{action.label}
            </button>
          ); })}
        </div>
      </>)}
    </div>
  );
};

// ===== Tab 1: License Overview =====
const LicenseOverviewTab: React.FC = () => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailLicense, setDetailLicense] = useState<typeof MOCK_LICENSES[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const filtered = MOCK_LICENSES.filter(l => { if (filter !== 'all' && l.status !== filter) return false; if (searchQuery) { const q = searchQuery.toLowerCase(); return l.sysname.toLowerCase().includes(q) || l.hwid.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.ip.includes(q); } return true; });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  React.useEffect(() => { setCurrentPage(1); }, [filter, searchQuery]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Donut Chart Statistics - only in Overview */}
      <DonutChart />
      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['all', 'activated', 'not_activated', 'expiring_soon', 'expired'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid', borderColor: filter === s ? '#3b82f6' : '#e2e8f0', background: filter === s ? '#eff6ff' : '#fff', color: filter === s ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label} <span style={{ marginLeft: '4px', opacity: 0.7 }}>{s === 'all' ? MOCK_LICENSES.length : MOCK_LICENSES.filter(l => l.status === s).length}</span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search name, HWID, IP..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', width: '220px', outline: 'none' }} />
        </div>
      </div>
      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
            {['Sysname','IP Address','Version','Hardware ID','SN','MAC','Status','Validity','Expiry','Action'].map(h => <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc', whiteSpace: 'nowrap' }}>{h}</th>)}
          </tr></thead>
          <tbody>{paginatedData.map((lic, idx) => (
            <tr key={lic.id} style={{ borderBottom: idx < paginatedData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{lic.sysname}</td>
              <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{lic.ip}</td>
              <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{lic.version}</td>
              <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{lic.hwid}</td>
              <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{lic.switchSN}</td>
              <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap' }}>{lic.mac}</td>
              <td style={{ padding: '12px 14px' }}><StatusBadge status={lic.status} /></td>
              <td style={{ padding: '12px 14px' }}><ValidityBar remainingDays={lic.remainingDays} totalDays={lic.totalDays} status={lic.status} /></td>
              <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{lic.expiryDate}</td>
              <td style={{ padding: '12px 14px', textAlign: 'center' }}><ActionMenu status={lic.status} licId={lic.id} onViewDetails={() => setDetailLicense(lic)} /></td>
            </tr>
          ))}</tbody>
        </table>
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', color: '#64748b', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>显示</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
              {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>条/页</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>共 {filtered.length} 条</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#cbd5e1' : '#64748b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid', borderColor: currentPage === page ? '#3b82f6' : '#e2e8f0', background: currentPage === page ? '#eff6ff' : '#fff', color: currentPage === page ? '#3b82f6' : '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: currentPage === page ? 700 : 400 }}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#cbd5e1' : '#64748b', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px' }}>›</button>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>共 {totalPages} 页</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>跳至</span>
            <input type="number" min={1} max={totalPages} value={currentPage} onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }} style={{ width: '42px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
            <span style={{ color: '#94a3b8' }}>页</span>
          </div>
        </div>
      </div>
      {/* Detail Panel */}
      {detailLicense && <LicenseDetailPanel license={detailLicense} onClose={() => setDetailLicense(null)} />}
    </div>
  );
};

// ===== Tab 2: Online Activate =====
const OnlineActivateTab: React.FC = () => {
  const [portalStatus, setPortalStatus] = useState<'connected' | 'disconnected'>('connected');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activationLog, setActivationLog] = useState<Array<{device: string; status: 'success'|'failed'; msg: string}>>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [portalConfig, setPortalConfig] = useState({ url: 'https://test-pica8-license.whgxwl.com', user: 'api_user', password: '********' });
  const unactivated = MOCK_LICENSES.filter(l => l.status === 'not_activated' || l.status === 'expired' || l.status === 'expiring_soon');
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [oaPage, setOaPage] = useState(1);
  const [oaPageSize, setOaPageSize] = useState(50);
  const oaTotalPages = Math.ceil(unactivated.length / oaPageSize);
  const oaPaginated = unactivated.slice((oaPage - 1) * oaPageSize, oaPage * oaPageSize);
  const cloudAvailability: Record<string, boolean> = { 'LIC-2024-00130': true, 'LIC-2024-00131': false, 'LIC-2024-00129': true, 'LIC-2024-00135': true };
  const toggleSelect = (id: string) => { if (!synced || cloudAvailability[id]) { setSelectedDevices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); } };
  const handleSync = () => { setSyncing(true); setTimeout(() => { setSyncing(false); setSynced(true); }, 1500); };
  const handleBatchActivate = () => {
    setActivating(true); setProgress(0); setActivationLog([]);
    const iv = setInterval(() => { setProgress(p => { if (p >= 100) { clearInterval(iv); setActivating(false); setActivationLog([{device:'DC-Spine-02',status:'success',msg:'License activated'},{device:'DC-Leaf-07',status:'failed',msg:'No license found on Cloud'}]); return 100; } return p + 25; }); }, 500);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Cloud Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: portalStatus === 'connected' ? '#ecfdf5' : '#fef2f2', borderRadius: '12px', marginBottom: showConfig ? '0' : '20px', borderBottomLeftRadius: showConfig ? '0' : '12px', borderBottomRightRadius: showConfig ? '0' : '12px', border: `1px solid ${portalStatus === 'connected' ? '#a7f3d0' : '#fecaca'}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {portalStatus === 'connected' ? <Wifi size={20} color="#10b981" /> : <WifiOff size={20} color="#ef4444" />}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: portalStatus === 'connected' ? '#065f46' : '#991b1b' }}>{portalStatus === 'connected' ? 'License Cloud Connected' : 'License Cloud Disconnected'}</p>
            <p style={{ fontSize: '11px', color: portalStatus === 'connected' ? '#047857' : '#b91c1c', marginTop: '2px' }}>{portalStatus === 'connected' ? `${portalConfig.url} | Latency: 45ms | Last sync: 2 min ago` : 'Cloud not configured. Click Settings to configure.'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowConfig(!showConfig)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: showConfig ? '#f1f5f9' : '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
          <button onClick={() => setPortalStatus(portalStatus === 'connected' ? 'disconnected' : 'connected')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} /> Test</button>
          <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}><ExternalLink size={12} /> Open Cloud</button>
        </div>
      </div>
      {/* Cloud Configuration Panel */}
      {showConfig && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', padding: '20px', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>License Cloud URL <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={portalConfig.url} onChange={e => setPortalConfig({...portalConfig, url: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>License Cloud User <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={portalConfig.user} onChange={e => setPortalConfig({...portalConfig, user: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>License Cloud Password <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" value={portalConfig.password} onChange={e => setPortalConfig({...portalConfig, password: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>Save</button>
              <button onClick={() => setShowConfig(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Batch Activate */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Devices Pending Activation <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>({unactivated.length})</span></h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSync} disabled={syncing || portalStatus !== 'connected'} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: portalStatus === 'connected' ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: syncing ? '#94a3b8' : '#6366f1' }}><RefreshCw size={12} /> {syncing ? 'Syncing...' : 'Sync from Cloud'}</button>
            <button onClick={handleBatchActivate} disabled={selectedDevices.length === 0 || activating || portalStatus !== 'connected'} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: selectedDevices.length > 0 && !activating && portalStatus === 'connected' ? '#3b82f6' : '#cbd5e1', color: '#fff', cursor: selectedDevices.length > 0 ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} /> Quick Activate ({selectedDevices.length})</button>
          </div>
        </div>
        {activating && (<div style={{ marginBottom: '16px', padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', flexShrink: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}>Activating licenses via Cloud API...</span><span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>{progress}%</span></div><div style={{ height: '4px', background: '#dbeafe', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }} /></div></div>)}
        {activationLog.length > 0 && (<div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>{activationLog.map((log, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', background: log.status === 'success' ? '#ecfdf5' : '#fef2f2', fontSize: '12px' }}>{log.status === 'success' ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}<span style={{ fontWeight: 600, color: '#1e293b' }}>{log.device}</span><span style={{ color: '#64748b' }}>{log.msg}</span>{log.status === 'failed' && <button style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}><RotateCcw size={10} />Retry</button>}</div>))}</div>)}
        {/* Device Table */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', width: '30px', background: '#f8fafc' }}><input type="checkbox" checked={selectedDevices.length === unactivated.length && unactivated.length > 0} onChange={() => setSelectedDevices(selectedDevices.length === unactivated.length ? [] : unactivated.map(d => d.id))} style={{ accentColor: '#3b82f6' }} /></th>
            {['Sysname','IP Address','Version','Hardware ID','SN','MAC','Status','Validity','Expiry','Cloud'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc', whiteSpace: 'nowrap' }}>{h}</th>)}
          </tr></thead>
          <tbody>
          {oaPaginated.map((device, idx) => {
            const available = synced ? cloudAvailability[device.id] : undefined;
            const selectable = !synced || available;
            return (
            <tr key={device.id} onClick={() => toggleSelect(device.id)} style={{ borderBottom: idx < oaPaginated.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: selectable ? 'pointer' : 'default', opacity: synced && !available ? 0.5 : 1, background: selectedDevices.includes(device.id) ? '#eff6ff' : 'transparent' }}>
              <td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selectedDevices.includes(device.id)} readOnly disabled={!selectable} style={{ accentColor: '#3b82f6' }} /></td>
              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{device.sysname}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{device.ip}</td>
              <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{device.version}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{device.hwid}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{device.switchSN}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{device.mac}</td>
              <td style={{ padding: '10px 12px' }}><StatusBadge status={device.status} /></td>
              <td style={{ padding: '10px 12px' }}><ValidityBar remainingDays={device.remainingDays} totalDays={device.totalDays} status={device.status} /></td>
              <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{device.expiryDate}</td>
              <td style={{ padding: '10px 12px' }}>{synced ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: available ? '#ecfdf5' : '#fef2f2', color: available ? '#059669' : '#dc2626' }}>{available ? '● Available' : '○ Not Found'}</span> : <span style={{ fontSize: '11px', color: '#cbd5e1' }}>--</span>}</td>
            </tr>
          );})}
          </tbody>
        </table>
        {unactivated.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><CheckCircle2 size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} /><p style={{ fontSize: '13px', fontWeight: 600 }}>All devices are activated</p></div>}
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', marginTop: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>显示</span>
            <select value={oaPageSize} onChange={e => { setOaPageSize(Number(e.target.value)); setOaPage(1); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
              {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>条/页</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>共 {unactivated.length} 条</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => setOaPage(p => Math.max(1, p - 1))} disabled={oaPage === 1} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: oaPage === 1 ? '#f1f5f9' : '#fff', color: oaPage === 1 ? '#cbd5e1' : '#64748b', cursor: oaPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>‹</button>
            {Array.from({ length: oaTotalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setOaPage(page)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid', borderColor: oaPage === page ? '#3b82f6' : '#e2e8f0', background: oaPage === page ? '#eff6ff' : '#fff', color: oaPage === page ? '#3b82f6' : '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: oaPage === page ? 700 : 400 }}>{page}</button>
            ))}
            <button onClick={() => setOaPage(p => Math.min(oaTotalPages, p + 1))} disabled={oaPage === oaTotalPages} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: oaPage === oaTotalPages ? '#f1f5f9' : '#fff', color: oaPage === oaTotalPages ? '#cbd5e1' : '#64748b', cursor: oaPage === oaTotalPages ? 'not-allowed' : 'pointer', fontSize: '12px' }}>›</button>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>共 {oaTotalPages} 页</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>跳至</span>
            <input type="number" min={1} max={oaTotalPages} value={oaPage} onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= oaTotalPages) setOaPage(v); }} style={{ width: '42px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
            <span style={{ color: '#94a3b8' }}>页</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Tab 3: Import License =====
const ImportLicenseTab: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [importResults, setImportResults] = useState<Array<{ file: string; hwid: string; status: 'matched' | 'pooled' | 'failed'; device?: string }>>([]);
  const [showSingleAdd, setShowSingleAdd] = useState(false);
  const [singleSN, setSingleSN] = useState('');
  const [selectedPool, setSelectedPool] = useState<string[]>([]);
  const [singleLicenseKey, setSingleLicenseKey] = useState('');
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); setImportResults([{ file: 'license_0A1B2C.lic', hwid: '0A:1B:2C:3D:4E:5F', status: 'matched', device: 'DC-Core-01' }, { file: 'license_2C3D4E.lic', hwid: '2C:3D:4E:5F:6A:7B', status: 'matched', device: 'DC-Leaf-03' }, { file: 'license_FF0011.lic', hwid: 'FF:00:11:22:33:44', status: 'pooled' }, { file: 'license_corrupt.lic', hwid: '--', status: 'failed' }]); };
  const handleLicenseKeyPaste = (value: string) => { setSingleLicenseKey(value); };
  const parkingLotDevices = MOCK_LICENSES.filter(l => l.status === 'not_activated').map(l => ({ sn: l.switchSN, hwid: l.hwid }));
  const preImportPool = [{ id: 'pool-1', licenseId: 'LIC-2024-00140', hwid: 'FF:00:11:22:33:44', switchSN: 'SN-Y7Z8A9', fileName: 'license_FF0011.lic', uploadTime: '2026-05-10 14:30' }, { id: 'pool-2', licenseId: 'LIC-2024-00141', hwid: 'AA:BB:CC:DD:EE:FF', switchSN: 'SN-B1C2D3', fileName: 'license_AABBCC.lic', uploadTime: '2026-05-08 09:15' }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Single Add Section */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSingleAdd ? '16px' : '0' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Add License</h3>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Add license for a single device by Switch SN</p>
          </div>
          <button onClick={() => setShowSingleAdd(!showSingleAdd)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: showSingleAdd ? '#f1f5f9' : '#3b82f6', color: showSingleAdd ? '#64748b' : '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>{showSingleAdd ? 'Close' : '+ Add License'}</button>
        </div>
        {showSingleAdd && (
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Left: SN Selection */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Switch SN <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={singleSN} onChange={e => setSingleSN(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', background: '#fff' }}>
                <option value="">Select Switch SN...</option>
                {parkingLotDevices.map(d => <option key={d.sn} value={d.sn}>{d.sn}</option>)}
              </select>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Select from registered devices or type SN manually</p>
            </div>
            {/* Right: License Key */}
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>License Key <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea value={singleLicenseKey} onChange={e => handleLicenseKeyPaste(e.target.value)} placeholder="Paste the License Key for this device..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'monospace', outline: 'none', resize: 'vertical', minHeight: '60px' }} />
            </div>
            {/* Apply Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>Apply</button>
            </div>
          </div>
        )}
      </div>
      {/* Batch Upload Area */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} style={{ border: `2px dashed ${dragOver ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '32px', textAlign: 'center', background: dragOver ? '#eff6ff' : '#fafafa', marginBottom: '20px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
        <CloudUpload size={36} style={{ margin: '0 auto 10px', color: dragOver ? '#3b82f6' : '#94a3b8' }} />
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Batch Import: Drag & Drop License Files</p>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>Supports .lic single file or .zip batch package (auto-parse & match by HWID)</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><FileUp size={14} /> Select File</button>
          <button style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Upload size={14} /> Batch (ZIP)</button>
        </div>
      </div>
      {/* Import Results */}
      {importResults.length > 0 && (<div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Import Results</h3>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Matched: {importResults.filter(r=>r.status==='matched').length}</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pooled: {importResults.filter(r=>r.status==='pooled').length}</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Failed: {importResults.filter(r=>r.status==='failed').length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{importResults.map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', background: r.status === 'matched' ? '#ecfdf5' : r.status === 'pooled' ? '#eff6ff' : '#fef2f2', fontSize: '12px' }}>{r.status === 'matched' ? <CheckCircle2 size={14} color="#10b981" /> : r.status === 'pooled' ? <Clock size={14} color="#3b82f6" /> : <XCircle size={14} color="#ef4444" />}<span style={{ fontWeight: 600, color: '#1e293b' }}>{r.file}</span><span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}>{r.hwid}</span><span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: r.status === 'matched' ? '#059669' : r.status === 'pooled' ? '#2563eb' : '#dc2626' }}>{r.status === 'matched' ? `→ ${r.device}` : r.status === 'pooled' ? 'Pre-Import Pool' : 'Invalid format'}</span></div>))}</div>
      </div>)}
      {/* Pre-Import Pool */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Pre-Import Pool <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>({preImportPool.length} pending)</span></h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={selectedPool.length === 0} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid', borderColor: selectedPool.length > 0 ? '#fecaca' : '#e2e8f0', background: selectedPool.length > 0 ? '#fef2f2' : '#f8fafc', cursor: selectedPool.length > 0 ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: selectedPool.length > 0 ? '#ef4444' : '#cbd5e1' }}><Trash2 size={12} /> Delete ({selectedPool.length})</button>
            <button style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}><Download size={12} /> Export</button>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px', flexShrink: 0 }}>Licenses waiting for device registration. Auto-activates when a matching HWID device registers.</p>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}><thead><tr style={{ borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 1, background: '#fff' }}><th style={{ padding: '8px 12px', textAlign: 'left', width: '32px', background: '#fff' }}><input type="checkbox" checked={selectedPool.length === preImportPool.length && preImportPool.length > 0} onChange={() => setSelectedPool(selectedPool.length === preImportPool.length ? [] : preImportPool.map(p => p.id))} style={{ accentColor: '#3b82f6' }} /></th>{['File','License ID','HWID','Upload Time','Status','ACTION'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '11px', background: '#fff', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead><tbody>{preImportPool.map(item => (<tr key={item.id} style={{ borderBottom: '1px solid #f8fafc', background: selectedPool.includes(item.id) ? '#f8fafc' : 'transparent' }}><td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selectedPool.includes(item.id)} onChange={() => setSelectedPool(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])} style={{ accentColor: '#3b82f6' }} /></td><td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{item.fileName}</td><td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.licenseId}</td><td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{item.hwid}</td><td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.uploadTime}</td><td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, color: '#2563eb', background: '#eff6ff' }}>Pending</span></td><td style={{ padding: '10px 12px' }}><div style={{ display: 'flex', gap: '4px' }}><button style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={11} /> View</button><button style={{ padding: '3px 6px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button></div></td></tr>))}</tbody></table>
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', marginTop: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>显示</span>
            <select defaultValue={50} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
              {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>条/页</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>共 {preImportPool.length} 条</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button disabled style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#cbd5e1', cursor: 'not-allowed', fontSize: '12px' }}>‹</button>
            <button style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>1</button>
            <button disabled style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#cbd5e1', cursor: 'not-allowed', fontSize: '12px' }}>›</button>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>共 1 页</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>跳至</span>
            <input type="number" min={1} max={1} defaultValue={1} style={{ width: '42px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
            <span style={{ color: '#94a3b8' }}>页</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Main Component =====
const LicenseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const tabs: { id: TabType; label: string; sublabel: string }[] = [
    { id: 'overview', label: 'License Overview', sublabel: 'Status & compliance' },
    { id: 'online_activate', label: 'Online Activate', sublabel: 'Quick Activate via Cloud' },
    { id: 'import', label: 'Import License', sublabel: 'Local import & pre-import pool' },
  ];
  return (
    <div style={{ padding: '24px 32px', background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 }}>
        <div><h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>License Management</h1><p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Manage PicOS switch licenses across your data center fabric</p></div>
      </div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', background: '#e2e8f0', borderRadius: '10px', padding: '3px', flexShrink: 0 }}>
        {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', background: activeTab === tab.id ? '#fff' : 'transparent', boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}><p style={{ fontSize: '13px', fontWeight: 700, color: activeTab === tab.id ? '#0f172a' : '#64748b', margin: 0 }}>{tab.label}</p><p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', margin: 0 }}>{tab.sublabel}</p></button>))}
      </div>
      {activeTab === 'overview' && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}><LicenseOverviewTab /></div>}
      {activeTab === 'online_activate' && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}><OnlineActivateTab /></div>}
      {activeTab === 'import' && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}><ImportLicenseTab /></div>}
    </div>
  );
};

export default LicenseManager;

import React, { useState } from 'react';
import {
  Save, CheckCircle2, Globe, Server, Clock, Database,
  Code, Eye, EyeOff, Mail, HardDrive
} from 'lucide-react';

type SettingsTab = 'base' | 'maintenance' | 'integration';

const GlobalSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('base');
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const handleSave = () => { setSaved(true); setHasChanges(false); setTimeout(() => setSaved(false), 2000); };
  const markChanged = () => setHasChanges(true);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'base', label: 'Base Services', icon: <Globe size={15} /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Database size={15} /> },
    { id: 'integration', label: 'Integration', icon: <Code size={15} /> },
  ];

  return (
    <div className="h-full overflow-auto bg-slate-50/50 animate-in fade-in duration-500">
      <div className="max-w-[1200px] mx-auto p-8 pb-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System <span className="text-[#0ABAB5]">Settings</span></h1>
            <p className="text-xs text-slate-400 mt-1">Controller platform configuration & system administration</p>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === t.id ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 animate-in fade-in duration-300" onChange={() => markChanged()} onClick={() => markChanged()}>
          {activeTab === 'base' && <BaseServicesTab />}
          {activeTab === 'maintenance' && <MaintenanceTab />}
          {activeTab === 'integration' && <IntegrationTab />}
        </div>
      </div>

      {(hasChanges || saved) && (
        <div className="fixed bottom-0 left-14 right-0 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-[1200px] mx-auto px-8 pb-4">
            <div className={`flex items-center justify-between px-6 py-3 rounded-xl shadow-2xl transition-all ${saved ? 'bg-emerald-500' : 'bg-slate-900'}`}>
              <p className="text-sm font-bold text-white">{saved ? 'Changes saved successfully' : 'You have unsaved changes'}</p>
              {!saved && (
                <div className="flex items-center gap-3">
                  <button onClick={() => setHasChanges(false)} className="px-4 py-2 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-widest">Discard</button>
                  <button onClick={handleSave} className="px-5 py-2 bg-[#0ABAB5] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#099e9a] active:scale-95 transition-all shadow-sm flex items-center gap-2">
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Base Services: NTP + Syslog ───
const BaseServicesTab = () => {
  const [ntpEnabled, setNtpEnabled] = useState(true);
  const [dstEnabled, setDstEnabled] = useState(false);
  const [syslogEnabled, setSyslogEnabled] = useState(true);

  return (
    <div className="space-y-5">
      {/* NTP */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0ABAB5]/10 rounded-xl flex items-center justify-center text-[#0ABAB5]"><Clock size={20} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900">NTP Time Synchronization</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ensure consistent time across all managed devices for syslog, certificates, and troubleshooting</p>
            </div>
          </div>
          <ToggleBtn on={ntpEnabled} onChange={setNtpEnabled} />
        </div>
        {ntpEnabled && (
          <div className="border-t border-slate-100 px-6 py-5 space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Basic Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="NTP Server 1 (Primary)" defaultValue="10.1.1.100" placeholder="IP or FQDN" />
              <InputField label="NTP Server 2 (Backup)" defaultValue="202.108.6.95" placeholder="IP or FQDN" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Timezone</label>
                <select defaultValue="Asia/Shanghai" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0ABAB5]">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-1">IANA standard timezone ID. Auto-mapped to device-specific format.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Daylight Saving Time</label>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <span className="text-sm text-slate-700">{dstEnabled ? 'Enabled' : 'Disabled'}</span>
                  <ToggleBtn on={dstEnabled} onChange={setDstEnabled} small />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic">NTP parameters are stored at the platform level. Each App reads these settings and pushes device-native commands to its managed devices.</p>
          </div>
        )}
        {!ntpEnabled && <DisabledPlaceholder icon={<Clock size={28} />} title="NTP synchronization is disabled" sub="Device clocks may drift, affecting logs and certificates" />}
      </div>

      {/* Syslog */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><Server size={20} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Syslog Server</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Centralized log collection for all managed devices. Apps read this config and push to devices.</p>
            </div>
          </div>
          <ToggleBtn on={syslogEnabled} onChange={setSyslogEnabled} />
        </div>
        {syslogEnabled && (
          <div className="border-t border-slate-100 px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <InputField label="Syslog Server Address" defaultValue="" placeholder="IP or FQDN, e.g. 10.0.0.200" />
              </div>
              <InputField label="Port" defaultValue="514" placeholder="514" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Protocol</label>
              <SegmentToggle options={['UDP', 'TCP']} defaultValue="UDP" />
            </div>
            <p className="text-[9px] text-slate-400 italic">Syslog parameters are stored globally. Each App pushes the appropriate syslog config to its managed devices. Sites can override this in Site Settings.</p>
          </div>
        )}
        {!syslogEnabled && <DisabledPlaceholder icon={<Server size={28} />} title="Syslog forwarding is disabled" sub="Device logs will not be sent to a central collector" />}
      </div>
    </div>
  );
};

// ─── Maintenance: Data Retention only ───
const MaintenanceTab = () => (
  <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
    <div className="px-6 py-5 flex items-center gap-4">
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><HardDrive size={20} /></div>
      <div>
        <h3 className="text-sm font-black text-slate-900">Data Retention</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Configure how long alarm/event logs and monitoring data are kept. Expired data is automatically cleaned up.</p>
      </div>
    </div>
    <div className="border-t border-slate-100 px-6 py-5 space-y-5">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Alarm & Event Log Retention</label>
          <div className="flex items-center gap-3">
            <input type="number" defaultValue="90" min="1" max="365" className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0ABAB5] text-center" />
            <span className="text-xs text-slate-500">days</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Default: 90 days. Range: 1–365 days.</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Monitoring & Statistics Data Retention</label>
          <div className="flex items-center gap-3">
            <input type="number" defaultValue="30" min="1" max="180" className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0ABAB5] text-center" />
            <span className="text-xs text-slate-500">days</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Default: 30 days. Range: 1–180 days. Affects dashboard charts and performance graphs.</p>
        </div>
      </div>

      {/* DB Usage */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500">Database Usage</span>
          <span className="text-xs font-black text-slate-800">12.4 GB <span className="text-slate-400 font-normal">/ 50 GB</span></span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#0ABAB5] rounded-full transition-all" style={{ width: '24.8%' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-slate-400">24.8% used</span>
          <span className="text-[9px] text-slate-400">37.6 GB free</span>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 italic">Data older than the configured retention period is automatically removed during nightly maintenance. No manual cleanup needed.</p>
    </div>
  </div>
);

// ─── Integration: SMTP only ───
const IntegrationTab = () => {
  const [smtpEnabled, setSmtpEnabled] = useState(true);
  const [useAuth, setUseAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [secureMode, setSecureMode] = useState('SSL');
  const [testSent, setTestSent] = useState(false);
  const handleSendTest = () => { setTestSent(true); setTimeout(() => setTestSent(false), 2000); };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0ABAB5]/10 rounded-xl flex items-center justify-center text-[#0ABAB5]"><Mail size={20} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Email Notifications</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Configure SMTP to send alarm alerts, reports, and system notifications</p>
            </div>
          </div>
          <ToggleBtn on={smtpEnabled} onChange={setSmtpEnabled} />
        </div>

        {smtpEnabled && (
          <div className="border-t border-slate-100">
            <div className="px-6 py-5 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Server Configuration</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><InputField label="SMTP Server Address" defaultValue="" placeholder="smtp.example.com" /></div>
                <InputField label="Port" defaultValue="" placeholder="587" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500">Secure Connection</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                  {['SSL', 'TLS', 'None'].map(opt => (
                    <button key={opt} onClick={() => setSecureMode(opt)}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${secureMode === opt ? 'bg-white text-[#0ABAB5] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{opt}</button>
                  ))}
                </div>
              </div>
              <InputField label="Sender Email" defaultValue="" placeholder="noreply@yourcompany.com" />
            </div>

            <div className="border-t border-slate-100 px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Authentication</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Enable if your SMTP server requires login credentials</p>
                </div>
                <ToggleBtn on={useAuth} onChange={setUseAuth} />
              </div>
              {useAuth && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                  <InputField label="Username" defaultValue="" placeholder="smtp_user" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0ABAB5] transition-all pr-10" />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-end">
              <button onClick={handleSendTest}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  testSent ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#0ABAB5] hover:text-[#0ABAB5]'
                }`}>
                {testSent ? <><CheckCircle2 size={14} /> Sent!</> : <><Mail size={14} /> Send Test Email</>}
              </button>
            </div>
          </div>
        )}
        {!smtpEnabled && <DisabledPlaceholder icon={<Mail size={28} />} title="Email notifications are disabled" sub="Enable SMTP to send alarm alerts and system notifications" />}
      </div>

      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center">
        <p className="text-xs font-bold text-slate-400">Webhook & API Key management coming in a future release</p>
      </div>
    </div>
  );
};

// ─── Shared Sub-components ───
const ToggleBtn = ({ on, onChange, small }: { on: boolean; onChange: (v: boolean) => void; small?: boolean }) => (
  <button onClick={() => onChange(!on)}
    className={`${small ? 'w-9 h-5' : 'w-11 h-6'} rounded-full p-0.5 transition-all ${on ? 'bg-[#0ABAB5]' : 'bg-slate-300'}`}>
    <div className={`${small ? 'w-4 h-4' : 'w-5 h-5'} bg-white rounded-full shadow-sm transition-all ${on ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'}`} />
  </button>
);

const InputField = ({ label, defaultValue, placeholder }: { label: string; defaultValue: string; placeholder: string }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{label}</label>
    <input type="text" defaultValue={defaultValue} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#0ABAB5] focus:bg-white transition-all" />
  </div>
);

const SegmentToggle = ({ options, defaultValue }: { options: string[]; defaultValue: string }) => {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 w-fit">
      {options.map(opt => (
        <button key={opt} onClick={() => setSelected(opt)}
          className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selected === opt ? 'bg-white text-[#0ABAB5] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{opt}</button>
      ))}
    </div>
  );
};

const DisabledPlaceholder = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) => (
  <div className="border-t border-slate-100 px-6 py-10 text-center">
    <div className="mx-auto text-slate-200 mb-3 flex justify-center">{icon}</div>
    <p className="text-sm font-bold text-slate-400">{title}</p>
    <p className="text-[11px] text-slate-300 mt-1">{sub}</p>
  </div>
);

export default GlobalSettings;

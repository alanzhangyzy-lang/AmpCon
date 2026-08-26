import React, { useState } from 'react';
import { ArrowLeft, Cable, Plus, Save, Trash2 } from 'lucide-react';
import { TopologyLink, TopologyRole } from '../topology/TopologyCanvas';
import { Device, InventoryTopologyState } from './AIDCInventoryTopology';

const standardRoles:TopologyRole[]=['Core','Spine','Aggregation','Leaf','Border','Access','Endpoint','Unclassified'];
const customRoles:{name:string;baseRole:TopologyRole}[]=[
  {name:'Super Spine',baseRole:'Spine'},
  {name:'GPU Leaf',baseRole:'Leaf'},
  {name:'Storage Leaf',baseRole:'Leaf'},
  {name:'Service Leaf',baseRole:'Leaf'},
  {name:'DCI Border',baseRole:'Border'},
];
type Props={
  device:Device;
  inventory:InventoryTopologyState;
  onInventoryStateChange:React.Dispatch<React.SetStateAction<InventoryTopologyState>>;
  assignmentLabel?:string;
  workspace:string;
  onAssignmentInvalidated:()=>void;
  onChanged:()=>void;
  onBack:()=>void;
};
type ConnectionDraft={localInterface:string;peerDeviceId:string;peerInterface:string;speed:string};
const emptyConnection:ConnectionDraft={localInterface:'',peerDeviceId:'',peerInterface:'',speed:'400G'};

const RegisteredDeviceDetail:React.FC<Props>=({device,inventory,onInventoryStateChange,assignmentLabel,workspace,onAssignmentInvalidated,onChanged,onBack})=>{
  const [hostname,setHostname]=useState(device.hostname);
  const [managementIp,setManagementIp]=useState(device.managementIp);
  const [mac,setMac]=useState(device.mac);
  const [roleValue,setRoleValue]=useState(device.customRole||device.role);
  const [nodeId,setNodeId]=useState(device.nodeId||'');
  const [message,setMessage]=useState('');
  const [addingConnection,setAddingConnection]=useState(false);
  const [connectionDraft,setConnectionDraft]=useState<ConnectionDraft>(emptyConnection);
  const sourceWorkspace=workspace||'network-design-reconcile';
  const connections=inventory.connections.filter(link=>link.source===device.id||link.target===device.id);
  const resolveRole=()=>{const custom=customRoles.find(item=>item.name===roleValue);return{role:custom?.baseRole||(roleValue as TopologyRole),customRole:custom?.name}};
  const markModified=(current:Device):Device=>({...current,state:current.state==='workspace-added'?'workspace-added':'workspace-modified',sourceWorkspace});
  const saveDevice=()=>{
    const nextName=hostname.trim();const nextIp=managementIp.trim();const nextMac=mac.trim().toLowerCase();const nextNodeId=nodeId.trim();
    if(!nextName||!nextIp||!nextMac){setMessage('Device name, Management IP and System MAC are required.');return}
    if(nextNodeId&&!/^\d+$/.test(nextNodeId)){setMessage('Node ID must be a positive numeric value.');return}
    const duplicate=inventory.registered.find(item=>item.id!==device.id&&(item.hostname.toLowerCase()===nextName.toLowerCase()||item.managementIp===nextIp||item.mac.toLowerCase()===nextMac||Boolean(nextNodeId)&&item.nodeId===nextNodeId));
    if(duplicate){setMessage(`Identity conflict with ${duplicate.hostname}. Device name, Management IP, System MAC and Node ID must be unique.`);return}
    const role=resolveRole();
    const changed:Device=markModified({...device,hostname:nextName,managementIp:nextIp,mac:nextMac,nodeId:nextNodeId||undefined,nodeIdSource:nextNodeId===device.autoNodeId?'Auto':'Override',role:role.role,customRole:role.customRole,roleSource:'Assigned'});
    onInventoryStateChange(current=>({...current,registered:current.registered.map(item=>item.id===device.id?changed:item)}));
    if(changed.role!==device.role)onAssignmentInvalidated();
    onChanged();setMessage('Device information saved to shared Inventory.');
  };

  const removeConnection=(link:TopologyLink)=>{
    onInventoryStateChange(current=>({...current,connections:current.connections.filter(item=>item.id!==link.id),removedConnectionIds:link.state==='workspace-added'?current.removedConnectionIds:[...new Set([...current.removedConnectionIds,link.id])],registered:current.registered.map(item=>item.id===device.id?markModified(item):item)}));
    onChanged();setMessage('Interface connection removed from the current Inventory change set.');
  };
  const addConnection=()=>{
    if(!connectionDraft.localInterface||!connectionDraft.peerDeviceId||!connectionDraft.peerInterface){setMessage('Local interface, peer device and peer interface are required.');return}
    const localInUse=inventory.connections.some(link=>(link.source===device.id&&link.sourceInterface===connectionDraft.localInterface)||(link.target===device.id&&link.targetInterface===connectionDraft.localInterface));
    const peerInUse=inventory.connections.some(link=>(link.source===connectionDraft.peerDeviceId&&link.sourceInterface===connectionDraft.peerInterface)||(link.target===connectionDraft.peerDeviceId&&link.targetInterface===connectionDraft.peerInterface));
    if(localInUse||peerInUse){setMessage(`${localInUse?connectionDraft.localInterface:connectionDraft.peerInterface} is already owned by another connection.`);return}
    const link:TopologyLink={id:`CONN-RECONCILE-${Date.now()}`,source:device.id,target:connectionDraft.peerDeviceId,sourceInterface:connectionDraft.localInterface,targetInterface:connectionDraft.peerInterface,speed:connectionDraft.speed,state:'workspace-added',confidence:'High'};
    onInventoryStateChange(current=>({...current,connections:[...current.connections,link],registered:current.registered.map(item=>item.id===device.id?markModified(item):item)}));
    setConnectionDraft(emptyConnection);setAddingConnection(false);onChanged();setMessage('Interface connection added to shared Inventory.');
  };
  return <div className="fixed inset-0 z-[135] flex justify-end bg-slate-900/20"><aside className="flex h-full w-[700px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl">
    <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4"><div><button type="button" onClick={onBack} className="mb-2 flex items-center gap-1 text-[9px] font-semibold text-blue-600 hover:underline"><ArrowLeft size={11}/>Registered Devices</button><h2 className="text-[15px] font-semibold text-slate-900">{device.hostname}</h2><p className="mt-1 text-[9px] text-slate-500">Review and modify the shared registered identity, topology role, Node ID and physical connections.</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${device.state==='mainline'?'bg-slate-100 text-slate-600':device.state==='workspace-added'?'bg-emerald-50 text-emerald-700':'bg-violet-50 text-violet-700'}`}>{device.state==='mainline'?'Mainline':device.state==='workspace-added'?'Added':'Modified'}</span></div>
    {message&&<div className={`mx-6 mt-4 rounded-lg border px-3 py-2 text-[8px] ${message.includes('conflict')||message.includes('required')||message.includes('must')||message.includes('owned')?'border-red-200 bg-red-50 text-red-700':'border-blue-200 bg-blue-50 text-blue-700'}`}>{message}</div>}
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <section className="rounded-xl border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><div><b className="text-[10px] text-slate-800">Registered identity</b><p className="mt-0.5 text-[8px] text-slate-500">Identity values are validated across the shared Inventory scope.</p></div>{assignmentLabel&&<span className="rounded-full bg-blue-100 px-2 py-1 text-[8px] font-semibold text-blue-700">{assignmentLabel}</span>}</div>
        <div className="grid grid-cols-2 gap-4 p-4"><Field label="Device name"><input value={hostname} onChange={event=>setHostname(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-[9px] outline-none focus:border-blue-400"/></Field><Field label="Device / Serial ID"><ReadOnly value={device.id}/></Field><Field label="Management IP"><input value={managementIp} onChange={event=>setManagementIp(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-[9px] outline-none focus:border-blue-400"/></Field><Field label="System MAC"><input value={mac} onChange={event=>setMac(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-[9px] outline-none focus:border-blue-400"/></Field><Field label="Model"><ReadOnly value={device.model}/></Field><Field label="EOS"><ReadOnly value={device.os}/></Field><Field label="Topology role"><select value={roleValue} onChange={event=>setRoleValue(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[9px]">{standardRoles.map(role=><option key={role}>{role}</option>)}<optgroup label="Custom roles">{customRoles.map(role=><option key={role.name}>{role.name}</option>)}</optgroup></select></Field><Field label="Fabric Node ID"><div className="flex gap-2"><input value={nodeId} onChange={event=>setNodeId(event.target.value)} placeholder="Not assigned" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono text-[9px] outline-none focus:border-blue-400"/>{device.autoNodeId&&<button type="button" onClick={()=>setNodeId(device.autoNodeId||'')} className="rounded-md border border-slate-300 px-2 text-[8px] text-slate-600">Use Auto</button>}</div></Field></div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><span className="text-[8px] text-slate-500">Source: {sourceWorkspace} · Role source becomes Assigned after save.</span><button type="button" onClick={saveDevice} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white"><Save size={12}/>Save Device</button></div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><div><b className="flex items-center gap-1.5 text-[10px] text-slate-800"><Cable size={12}/>Physical interface connections</b><p className="mt-0.5 text-[8px] text-slate-500">Observed or accepted peer relationships owned by Inventory and Topology.</p></div><button type="button" onClick={()=>setAddingConnection(value=>!value)} className="flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-[8px] font-semibold text-blue-700"><Plus size={10}/>Add Connection</button></div>
        {addingConnection&&<div className="grid grid-cols-[1fr_1.4fr_1fr_90px_auto] items-end gap-2 border-b border-blue-100 bg-blue-50/50 p-4"><Field label="Local interface"><input value={connectionDraft.localInterface} onChange={event=>setConnectionDraft(current=>({...current,localInterface:event.target.value}))} placeholder="Ethernet1" className="w-full rounded border border-slate-300 px-2 py-2 text-[8px]"/></Field><Field label="Peer device"><select value={connectionDraft.peerDeviceId} onChange={event=>setConnectionDraft(current=>({...current,peerDeviceId:event.target.value}))} className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-[8px]"><option value="">Select peer</option>{inventory.registered.filter(item=>item.id!==device.id).map(item=><option key={item.id} value={item.id}>{item.hostname}</option>)}</select></Field><Field label="Peer interface"><input value={connectionDraft.peerInterface} onChange={event=>setConnectionDraft(current=>({...current,peerInterface:event.target.value}))} placeholder="Ethernet1" className="w-full rounded border border-slate-300 px-2 py-2 text-[8px]"/></Field><Field label="Speed"><select value={connectionDraft.speed} onChange={event=>setConnectionDraft(current=>({...current,speed:event.target.value}))} className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-[8px]"><option>400G</option><option>100G</option><option>25G</option><option>10G</option><option>1G</option></select></Field><button type="button" onClick={addConnection} className="rounded bg-blue-600 px-3 py-2 text-[8px] font-semibold text-white">Add</button></div>}
        <div className="divide-y divide-slate-100">{connections.map(link=>{const localIsSource=link.source===device.id;const peerId=localIsSource?link.target:link.source;const peer=inventory.registered.find(item=>item.id===peerId);return <div key={link.id} className="grid grid-cols-[1fr_24px_1fr_70px_30px] items-center gap-2 px-4 py-3 text-[8px]"><span><b className="block text-slate-700">{localIsSource?link.sourceInterface:link.targetInterface}</b><span className="text-slate-400">{device.hostname}</span></span><span className="text-center text-slate-300">↔</span><span><b className="block text-slate-700">{peer?.hostname||peerId}</b><span className="text-slate-400">{localIsSource?link.targetInterface:link.sourceInterface}</span></span><span className="text-right"><b className="text-violet-700">{link.speed||'—'}</b><span className="mt-0.5 block text-[7px] text-slate-400">{link.confidence||'Manual'}</span></span><button type="button" title="Remove connection" onClick={()=>removeConnection(link)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={12}/></button></div>})}{!connections.length&&<div className="py-10 text-center text-[8px] text-slate-400">No physical interface connections are registered for this device.</div>}</div>
      </section>
      <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-[8px] leading-4 text-blue-700"><b>Inventory ownership remains unchanged.</b> Changes here update shared physical facts and invalidate Reconcile. They do not run Workspace Build, submit configuration, or update Running state.</div>
    </div>
    <div className="flex justify-end border-t border-slate-200 px-6 py-4"><button type="button" onClick={onBack} className="rounded-md bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white">Back to Devices</button></div>
  </aside></div>;
};

const Field=({label,children}:{label:string;children:React.ReactNode})=><label className="block text-[8px] font-semibold text-slate-500"><span className="mb-1.5 block">{label}</span>{children}</label>;
const ReadOnly=({value}:{value:string})=><div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[9px] text-slate-600">{value}</div>;
export default RegisteredDeviceDetail;
import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Network, RefreshCw, Search, Server, X } from 'lucide-react';
import { TopologyRole } from '../topology/TopologyCanvas';
import { acceptInventoryUpdates, Device, ignoreInventoryUpdates, InventoryTopologyState, Update } from './AIDCInventoryTopology';
import RegisteredDeviceDetail from './RegisteredDeviceDetail';
import { isAidcFabricDevice } from './aidcTopologyDomain';

type Drawer = 'registered'|'updates'|null;
type UpdateStatusFilter = 'All'|'New'|'Ignored';
type PlannedNode = { id:string; label:string; role:TopologyRole };
type Props = {
  inventory:InventoryTopologyState;
  onInventoryStateChange:React.Dispatch<React.SetStateAction<InventoryTopologyState>>;
  plannedNodes:PlannedNode[];
  assignments:Record<string,string>;
  setAssignments:React.Dispatch<React.SetStateAction<Record<string,string>>>;
  workspace:string;
  onReconcileChange:()=>void;
};

const ReconcileInventoryDrawers:React.FC<Props> = ({inventory,onInventoryStateChange,plannedNodes,assignments,setAssignments,workspace,onReconcileChange}) => {
  const [drawer,setDrawer]=useState<Drawer>(null);
  const [deviceQuery,setDeviceQuery]=useState('');
  const [roleFilter,setRoleFilter]=useState<'All'|TopologyRole>('All');
  const [updateQuery,setUpdateQuery]=useState('');
  const [updateStatus,setUpdateStatus]=useState<UpdateStatusFilter>('All');
  const [selectedUpdateIds,setSelectedUpdateIds]=useState<Set<string>>(new Set());
  const [reviewOpen,setReviewOpen]=useState(false);
  const [viewDeviceId,setViewDeviceId]=useState<string>();
  const scopedDevices=useMemo(()=>inventory.registered.filter(isAidcFabricDevice),[inventory.registered]);
  const registeredIds=useMemo(()=>new Set(scopedDevices.map(device=>device.id)),[scopedDevices]);
  const inventoryToPlanned=useMemo(()=>new Map(Object.entries(assignments).map(([plannedId,deviceId])=>[deviceId,plannedId])),[assignments]);
  const assignedCount=Object.values(assignments).filter(deviceId=>registeredIds.has(deviceId)).length;
  const newUpdateCount=inventory.updates.filter(update=>update.status==='New').length;
  const roleOptions=useMemo(()=>[...new Set(scopedDevices.map(device=>device.role))],[scopedDevices]);
  const filteredDevices=useMemo(()=>scopedDevices.filter(device=>{
    const text=`${device.hostname} ${device.id} ${device.managementIp} ${device.mac} ${device.model} ${device.nodeId||''} ${device.role} ${device.customRole||''}`.toLowerCase();
    return (!deviceQuery||text.includes(deviceQuery.toLowerCase()))&&(roleFilter==='All'||device.role===roleFilter);
  }),[deviceQuery,roleFilter,scopedDevices]);
  const filteredUpdates=useMemo(()=>inventory.updates.filter(update=>{
    const text=`${update.hostname} ${update.kind} ${update.details} ${update.source} ${update.conflict||''}`.toLowerCase();
    return (!updateQuery||text.includes(updateQuery.toLowerCase()))&&(updateStatus==='All'||update.status===updateStatus);
  }),[inventory.updates,updateQuery,updateStatus]);
  const selectedUpdates=inventory.updates.filter(update=>selectedUpdateIds.has(update.id));
  const viewedDevice=inventory.registered.find(device=>device.id===viewDeviceId);
  const allFilteredSelected=filteredUpdates.length>0&&filteredUpdates.every(update=>selectedUpdateIds.has(update.id));

  const openDrawer=(next:Exclude<Drawer,null>)=>{setDrawer(next);setViewDeviceId(undefined);setSelectedUpdateIds(new Set());setReviewOpen(false)};
  const closeDrawer=()=>{setDrawer(null);setViewDeviceId(undefined);setSelectedUpdateIds(new Set());setReviewOpen(false)};
  const toggleDevice=(device:Device)=>{
    const currentPlannedId=inventoryToPlanned.get(device.id);
    const availableTarget=plannedNodes.find(node=>node.role===device.role&&!assignments[node.id]);
    if(!currentPlannedId&&!availableTarget)return;
    setAssignments(current=>{
      const validNodeIds=new Set(plannedNodes.map(node=>node.id));
      const next=Object.fromEntries(Object.entries(current).filter(([plannedId,deviceId])=>validNodeIds.has(plannedId)&&deviceId!==device.id));
      if(!currentPlannedId){
        const target=plannedNodes.find(node=>node.role===device.role&&!next[node.id]);
        if(target)next[target.id]=device.id;
      }
      return next;
    });
    onReconcileChange();
  };
  const filteredAssignedCount=filteredDevices.filter(device=>inventoryToPlanned.has(device.id)).length;
  const allFilteredDevicesAssigned=filteredDevices.length>0&&filteredAssignedCount===filteredDevices.length;
  const toggleAllDevices=()=>{
    const filteredDeviceIds=new Set(filteredDevices.map(device=>device.id));
    setAssignments(current=>{
      if(allFilteredDevicesAssigned)return Object.fromEntries(Object.entries(current).filter(([,deviceId])=>!filteredDeviceIds.has(deviceId)));
      const plannedIds=new Set(plannedNodes.map(node=>node.id));
      const scopedDeviceIds=new Set(scopedDevices.map(device=>device.id));
      const next:Record<string,string>=Object.fromEntries(Object.entries(current).filter(([plannedId,deviceId])=>plannedIds.has(plannedId)&&scopedDeviceIds.has(deviceId)));
      const usedDeviceIds=new Set(Object.values(next));
      filteredDevices.forEach(device=>{
        if(usedDeviceIds.has(device.id))return;
        const target=plannedNodes.find(node=>node.role===device.role&&!next[node.id]);
        if(target){next[target.id]=device.id;usedDeviceIds.add(device.id)}
      });
      return next;
    });
    onReconcileChange();
  };
  const toggleUpdate=(id:string)=>setSelectedUpdateIds(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next});
  const toggleAllUpdates=()=>setSelectedUpdateIds(current=>{
    const next=new Set(current);
    if(allFilteredSelected)filteredUpdates.forEach(update=>next.delete(update.id));else filteredUpdates.forEach(update=>next.add(update.id));
    return next;
  });
  const ignoreSelected=()=>{
    const ids=selectedUpdates.filter(update=>update.status==='New').map(update=>update.id);
    if(!ids.length)return;
    onInventoryStateChange(current=>ignoreInventoryUpdates(current,ids));
    setSelectedUpdateIds(new Set());
    onReconcileChange();
  };
  const acceptSelected=()=>{
    const ids=selectedUpdates.map(update=>update.id);
    if(!ids.length)return;
    onInventoryStateChange(current=>acceptInventoryUpdates(current,ids,workspace||'network-design-reconcile'));
    setSelectedUpdateIds(new Set());setReviewOpen(false);
    onReconcileChange();
  };
  const hasSelectedNew=selectedUpdates.some(update=>update.status==='New');

  return <>
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={()=>openDrawer('registered')} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[9px] font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><Server size={12}/>Registered Devices<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] text-slate-600">{assignedCount}/{plannedNodes.length}</span></button>
      <button type="button" onClick={()=>openDrawer('updates')} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-[9px] font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><RefreshCw size={12}/>Network Updates{newUpdateCount>0&&<span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-semibold text-white">{newUpdateCount}</span>}</button>
    </div>

    {drawer==='registered'&&<div className="fixed inset-0 z-[130] flex justify-end bg-slate-900/30"><aside className="flex h-full w-[620px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4"><div><h2 className="text-[14px] font-semibold text-slate-900">Registered Devices</h2><p className="mt-1 text-[9px] text-slate-500">Select reviewed and accepted Inventory devices for this Fabric.</p></div><button type="button" onClick={closeDrawer} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={17}/></button></div>
      <div className="border-b border-slate-200 bg-blue-50/60 px-6 py-3 text-[8px] leading-4 text-blue-700"><b>Fabric-scoped selection</b> · Inventory remains the device identity owner. Selecting a device creates only a Planned Node ↔ Registered Device Assignment.</div>
      <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-2 border-b border-slate-200 px-6 py-3"><div className="relative"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={deviceQuery} onChange={event=>setDeviceQuery(event.target.value)} placeholder="Search name, model, IP, MAC or Node ID" className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-[9px] outline-none focus:border-blue-400"/></div><select value={roleFilter} onChange={event=>setRoleFilter(event.target.value as 'All'|TopologyRole)} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-[9px] text-slate-600"><option value="All">All roles</option>{roleOptions.map(role=><option key={role} value={role}>{role}</option>)}</select></div>
      <label className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2 text-[8px] text-slate-500"><span className="flex items-center gap-2"><input type="checkbox" checked={allFilteredDevicesAssigned} disabled={!filteredDevices.length} onChange={toggleAllDevices} className="h-3 w-3 accent-blue-600"/>Select all shown</span><span>{filteredDevices.length} devices · {filteredAssignedCount} assigned</span></label>
      <div className="min-h-0 flex-1 overflow-auto p-4">{filteredDevices.map(device=>{
        const plannedId=inventoryToPlanned.get(device.id);const plannedNode=plannedNodes.find(node=>node.id===plannedId);const availableTarget=plannedNodes.find(node=>node.role===device.role&&!assignments[node.id]);const selectable=Boolean(plannedNode||availableTarget);
        return <div key={device.id} className={`mb-2 grid grid-cols-[18px_minmax(0,1fr)] items-center gap-3 rounded-lg border p-3 transition ${plannedNode?'border-blue-300 bg-blue-50':selectable?'border-slate-200 bg-white hover:border-blue-200':'border-slate-200 bg-slate-50'}`}><input type="checkbox" aria-label={`${plannedNode?'Remove':'Add'} ${device.hostname} ${plannedNode?'from':'to'} this Fabric`} checked={Boolean(plannedNode)} disabled={!selectable} onChange={()=>toggleDevice(device)} className="h-3.5 w-3.5 accent-blue-600 disabled:opacity-40"/><button type="button" onClick={()=>setViewDeviceId(device.id)} className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_150px] items-center gap-3 text-left"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${plannedNode?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-500'}`}><Network size={15}/></span><span className="min-w-0"><span className="flex items-center gap-2"><b className="truncate text-[10px] text-slate-800">{device.hostname}</b>{plannedNode&&<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[7px] font-semibold text-blue-700">Selected</span>}</span><span className="mt-1 block truncate text-[8px] text-slate-500">{device.model} · {device.managementIp} · Node {device.nodeId||'—'}</span><span className="mt-0.5 block truncate font-mono text-[7px] text-slate-400">{device.id} · {device.mac}</span></span><span className="text-right"><b className={`block text-[8px] ${plannedNode?'text-blue-700':'text-slate-600'}`}>{plannedNode?.label||availableTarget?.label||'No compatible target'}</b><span className="mt-1 block text-[7px] text-slate-400">{device.customRole||device.role} · Open details</span></span></button></div>;
      })}{!filteredDevices.length&&<div className="py-16 text-center text-[9px] text-slate-400">No registered devices match the current filters.</div>}</div>
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4"><span className="text-[8px] text-slate-500">A device can be assigned once and only to a compatible planned role.</span><button type="button" onClick={closeDrawer} className="rounded-md bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white">Done</button></div>
    </aside></div>}
    {drawer==='registered'&&viewedDevice&&<RegisteredDeviceDetail key={viewedDevice.id} device={viewedDevice} inventory={inventory} onInventoryStateChange={onInventoryStateChange} assignmentLabel={plannedNodes.find(node=>node.id===inventoryToPlanned.get(viewedDevice.id))?.label} workspace={workspace} onAssignmentInvalidated={()=>setAssignments(current=>Object.fromEntries(Object.entries(current).filter(([,deviceId])=>deviceId!==viewedDevice.id)))} onChanged={onReconcileChange} onBack={()=>setViewDeviceId(undefined)}/>}


    {drawer==='updates'&&<div className="fixed inset-0 z-[130] flex justify-end bg-slate-900/30"><aside className="flex h-full w-[680px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4"><div><div className="flex items-center gap-2"><h2 className="text-[14px] font-semibold text-slate-900">Network Updates</h2>{newUpdateCount>0&&<span className="rounded-full bg-red-500 px-2 py-0.5 text-[8px] font-semibold text-white">{newUpdateCount} New</span>}</div><p className="mt-1 text-[9px] text-slate-500">Review discovered device and physical connection evidence for this Fabric.</p></div><button type="button" onClick={closeDrawer} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={17}/></button></div>
      <div className="border-b border-slate-200 bg-blue-50/60 px-6 py-3 text-[8px] leading-4 text-blue-700"><b>AMPCon Reconcile extension</b> · Accepting here updates shared Inventory and LLDP evidence only. Configuration Build, authoritative Diff, Submit and deployment remain in Workspace and Change Control.</div>
      <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-2 border-b border-slate-200 px-6 py-3"><div className="relative"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={updateQuery} onChange={event=>setUpdateQuery(event.target.value)} placeholder="Search updates, source or conflict" className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-[9px] outline-none focus:border-blue-400"/></div><select value={updateStatus} onChange={event=>setUpdateStatus(event.target.value as UpdateStatusFilter)} className="rounded-md border border-slate-300 bg-white px-2 py-2 text-[9px] text-slate-600"><option>All</option><option>New</option><option>Ignored</option></select></div>
      <label className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2 text-[8px] text-slate-500"><span className="flex items-center gap-2"><input type="checkbox" checked={allFilteredSelected} disabled={!filteredUpdates.length} onChange={toggleAllUpdates} className="h-3 w-3 accent-blue-600"/>Select all shown</span><span>{filteredUpdates.length} updates · {inventory.updates.filter(update=>update.status==='Ignored').length} ignored</span></label>
      <div className="min-h-0 flex-1 overflow-auto p-4">{filteredUpdates.map(update=><UpdateRow key={update.id} update={update} selected={selectedUpdateIds.has(update.id)} onToggle={()=>toggleUpdate(update.id)}/>)}{!filteredUpdates.length&&<div className="py-16 text-center text-[9px] text-slate-400">No network updates match the current filters.</div>}</div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4"><span className="text-[8px] text-slate-500">{selectedUpdates.length?`${selectedUpdates.length} selected · Ignored updates can be accepted later.`:'Select updates to review, accept or ignore.'}</span><div className="flex gap-2"><button type="button" disabled={!hasSelectedNew} onClick={ignoreSelected} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-[9px] font-semibold text-slate-600 disabled:opacity-40">Ignore</button><button type="button" disabled={!selectedUpdates.length} onClick={()=>setReviewOpen(true)} className="rounded-md bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white disabled:opacity-40">Review &amp; Accept</button></div></div>
    </aside></div>}

    {reviewOpen&&<div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40 p-6"><div className="flex max-h-[82vh] w-[680px] max-w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4"><div><h2 className="text-[14px] font-semibold text-slate-900">Review Network Updates</h2><p className="mt-1 text-[9px] text-slate-500">Confirm the observed identities, interfaces, links and conflicts before accepting.</p></div><button type="button" onClick={()=>setReviewOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={17}/></button></div>
      <div className="grid grid-cols-4 gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">{[['Updates',selectedUpdates.length],['Devices',selectedUpdates.filter(update=>update.kind==='Device Added').length],['Connections',selectedUpdates.filter(update=>update.connection).length],['Conflicts',selectedUpdates.filter(update=>update.conflict).length]].map(([label,value])=><div key={String(label)} className={`rounded-lg border p-3 ${label==='Conflicts'&&Number(value)>0?'border-red-200 bg-red-50':'border-slate-200 bg-white'}`}><span className="text-[8px] text-slate-500">{label}</span><b className={`mt-1 block text-lg ${label==='Conflicts'&&Number(value)>0?'text-red-700':'text-slate-800'}`}>{value}</b></div>)}</div>
      <div className="min-h-0 flex-1 overflow-auto p-5">{selectedUpdates.map(update=><div key={update.id} className={`mb-2 rounded-lg border p-3 ${update.conflict?'border-red-200 bg-red-50/40':'border-slate-200'}`}><div className="flex items-start justify-between gap-3"><span><b className="text-[10px] text-slate-800">{update.hostname}</b><span className="ml-2 text-[8px] text-slate-400">{update.kind}</span></span><UpdateStatus status={update.status}/></div><p className="mt-2 text-[8px] leading-4 text-slate-600">{update.details}</p>{update.connection&&<p className="mt-2 rounded bg-violet-50 px-2 py-1.5 text-[8px] text-violet-700">{update.connection.sourceDeviceId} {update.connection.sourceInterface} → {update.connection.targetDeviceId} {update.connection.targetInterface} · {update.connection.speed}</p>}{update.conflict&&<p className="mt-2 flex items-center gap-1 text-[8px] text-red-700"><AlertTriangle size={10}/>{update.conflict}</p>}<p className="mt-2 text-[7px] text-slate-400">{update.detected} · {update.source} · {update.confidence} confidence</p></div>)}</div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4"><span className="max-w-[390px] text-[8px] leading-4 text-slate-500">Accepted evidence is recorded as <b>{workspace||'network-design-reconcile'}</b>. It does not submit configuration or update Running state.</span><div className="flex gap-2"><button type="button" onClick={()=>setReviewOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-[9px] text-slate-600">Cancel</button><button type="button" onClick={acceptSelected} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white"><CheckCircle2 size={12}/>Accept Updates</button></div></div>
    </div></div>}
  </>;
};

const UpdateStatus=({status}:{status:Update['status']})=><span className={`rounded-full px-2 py-0.5 text-[7px] font-semibold ${status==='New'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-600'}`}>{status}</span>;
const UpdateRow=({update,selected,onToggle}:{update:Update;selected:boolean;onToggle:()=>void})=><label className={`mb-2 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${selected?'border-blue-300 bg-blue-50':update.conflict?'border-red-200 bg-red-50/30':'border-slate-200 bg-white hover:border-blue-200'}`}><input type="checkbox" checked={selected} onChange={onToggle} className="mt-0.5 h-3.5 w-3.5 accent-blue-600"/><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span><b className="block truncate text-[10px] text-slate-800">{update.hostname}</b><span className="mt-0.5 block text-[8px] text-slate-400">{update.kind} · {update.detected}</span></span><UpdateStatus status={update.status}/></span><span className="mt-2 block text-[8px] leading-4 text-slate-600">{update.details}</span><span className="mt-1 block text-[7px] text-slate-400">{update.source} · {update.confidence} confidence · {update.interfaces} interface record{update.interfaces===1?'':'s'}</span>{update.connection&&<span className="mt-2 block rounded bg-violet-50 px-2 py-1.5 text-[8px] text-violet-700">{update.connection.sourceInterface} → {update.connection.targetInterface} · {update.connection.speed}</span>}{update.conflict&&<span className="mt-2 flex items-center gap-1 text-[8px] text-red-700"><AlertTriangle size={10}/>{update.conflict}</span>}</span></label>;

export default ReconcileInventoryDrawers;
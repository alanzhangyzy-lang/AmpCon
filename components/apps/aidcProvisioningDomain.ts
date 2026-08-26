import type { InventoryTopologyState } from './AIDCInventoryTopology';

export type ReconcileFindingSeverity = 'blocking' | 'deployment';
export type ReconcileFinding = {
  code: 'UNKNOWN_DEVICE' | 'DUPLICATE_ASSIGNMENT' | 'IDENTITY_CONFLICT' | 'PORT_OWNERSHIP_CONFLICT' | 'UNASSIGNED_NODE' | 'MISSING_LLDP' | 'UNEXPECTED_LLDP';
  severity: ReconcileFindingSeverity;
  title: string;
  detail: string;
};
export type SolutionTargetManifest = {
  designId: string;
  designRevision: number;
  inventoryRevision: string;
  generatedAt: string;
  plannedNodes: { id:string; name:string; role:string }[];
  expectedRelationshipIds: string[];
  assignments: { plannedNodeId:string; registeredDeviceId:string }[];
  resolvedInterfaces: { linkId:string; sourceDeviceId:string; sourceInterface:string; targetDeviceId:string; targetInterface:string }[];
  findings: ReconcileFinding[];
};

type HardBlockerInput = { assignments:Record<string,string>; inventory:InventoryTopologyState };
const duplicateIdentityFindings=(inventory:InventoryTopologyState,assignedIds:Set<string>):ReconcileFinding[]=>{
  const devices=inventory.registered.filter(device=>assignedIds.has(device.id));
  const fields:[string,(device:typeof devices[number])=>string|undefined][]=[['Management IP',device=>device.managementIp],['System MAC',device=>device.mac],['Node ID',device=>device.nodeId]];
  return fields.flatMap(([label,read])=>{
    const owners=new Map<string,string[]>();
    devices.forEach(device=>{const value=read(device);if(value)owners.set(value,[...(owners.get(value)||[]),device.hostname])});
    return [...owners.entries()].filter(([,names])=>names.length>1).map(([value,names])=>({code:'IDENTITY_CONFLICT' as const,severity:'blocking' as const,title:`Duplicate ${label}`,detail:`${value} is owned by ${names.join(', ')}.`}));
  });
};

export const evaluateReconcileHardBlockers=({assignments,inventory}:HardBlockerInput):ReconcileFinding[]=>{
  const findings:ReconcileFinding[]=[];
  const assignmentOwners=new Map<string,string[]>();
  Object.entries(assignments).forEach(([plannedId,deviceId])=>assignmentOwners.set(deviceId,[...(assignmentOwners.get(deviceId)||[]),plannedId]));
  assignmentOwners.forEach((plannedIds,deviceId)=>{if(!inventory.registered.some(device=>device.id===deviceId))findings.push({code:'UNKNOWN_DEVICE',severity:'blocking',title:'Registered device unavailable',detail:`${deviceId} is assigned but no longer exists in Inventory.`});if(plannedIds.length>1)findings.push({code:'DUPLICATE_ASSIGNMENT',severity:'blocking',title:'Duplicate Assignment',detail:`${deviceId} is assigned to ${plannedIds.join(', ')}.`})});
  findings.push(...duplicateIdentityFindings(inventory,new Set(assignmentOwners.keys())));
  const portOwners=new Map<string,string[]>();
  inventory.connections.forEach(link=>[[link.source,link.sourceInterface],[link.target,link.targetInterface]].forEach(([deviceId,port])=>{if(!port)return;const key=`${deviceId}::${port}`;portOwners.set(key,[...(portOwners.get(key)||[]),link.id])}));
  portOwners.forEach((linkIds,key)=>{if(linkIds.length>1)findings.push({code:'PORT_OWNERSHIP_CONFLICT',severity:'blocking',title:'Port ownership conflict',detail:`${key.replace('::',' / ')} is used by ${linkIds.join(', ')}.`})});
  return findings;
};

type ManifestInput = {
  designId:string;
  designRevision:number;
  plannedNodes:{id:string;name:string;role:string}[];
  expectedRelationshipIds:string[];
  assignments:Record<string,string>;
  inventory:InventoryTopologyState;
  findings:ReconcileFinding[];
};

export const createSolutionTargetManifest=(input:ManifestInput):SolutionTargetManifest=>{
  const assignedIds=new Set(Object.values(input.assignments));
  const inventorySignature=JSON.stringify({devices:input.inventory.registered.map(device=>[device.id,device.hostname,device.managementIp,device.mac,device.role,device.customRole,device.nodeId,device.state]).sort(),connections:input.inventory.connections.map(link=>[link.id,link.source,link.sourceInterface,link.target,link.targetInterface,link.speed,link.state]).sort(),updates:input.inventory.updates.map(update=>[update.id,update.status]).sort(),acceptedTotal:input.inventory.acceptedTotal});
  let revisionHash=0;for(let index=0;index<inventorySignature.length;index+=1)revisionHash=(revisionHash*31+inventorySignature.charCodeAt(index))>>>0;
  return {
    designId:input.designId,
    designRevision:input.designRevision,
    inventoryRevision:`INV-${revisionHash.toString(16).padStart(8,'0')}`,
    generatedAt:new Date().toISOString(),
    plannedNodes:input.plannedNodes,
    expectedRelationshipIds:input.expectedRelationshipIds,
    assignments:Object.entries(input.assignments).map(([plannedNodeId,registeredDeviceId])=>({plannedNodeId,registeredDeviceId})),
    resolvedInterfaces:input.inventory.connections.filter(link=>assignedIds.has(link.source)&&assignedIds.has(link.target)).map(link=>({linkId:link.id,sourceDeviceId:link.source,sourceInterface:link.sourceInterface||'',targetDeviceId:link.target,targetInterface:link.targetInterface||''})),
    findings:input.findings,
  };
};
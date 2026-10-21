export const AIDC_FABRIC_01 = {
  id:'FAB-AIDC-01',
  name:'AIDC-Fabric-01',
  dcId:'AIDC-DC-01',
  dcName:'AIDC Fabric',
  podId:'AIDC-POD-01',
  podName:'AI Pod 01',
  domainId:'AIDC-GPU-DOMAIN-01',
  domainName:'GPU Leaf Domain 01',
  workspaceId:'WS-AIDC-021',
  workspaceName:'GPU cluster expansion',
  revision:18,
  pods:1,
  spines:8,
  leafs:8,
  plannedDevices:16,
  mappedSpines:8,
  mappedLeafs:8,
  mappedDevices:16,
  unmappedDevices:0,
  expectedLinks:64,
  observedLinks:64,
} as const;

export const AIDC_WORKSPACE_OPTIONS=[
  {id:'WS-AIDC-021',name:'GPU cluster expansion'},
  {id:'WS-AIDC-018',name:'AIDC inventory onboarding'},
] as const;
export const aidcDeviceId=(role:'Spine'|'Leaf',index:number)=>`AIDC-${role.toUpperCase()}-${String(index).padStart(2,'0')}`;
export const aidcDeviceName=(role:'Spine'|'Leaf',index:number)=>role==='Spine'?`AIDC-Spine-${String(index).padStart(2,'0')}`:`AIDC-GPU-Leaf-${String(index).padStart(2,'0')}`;
export const AIDC_MAPPED_DEVICE_IDS=Array.from({length:AIDC_FABRIC_01.mappedSpines},(_,index)=>index+1).flatMap(index=>[aidcDeviceId('Spine',index),aidcDeviceId('Leaf',index)]);
export const AIDC_SPINE_IDS=Array.from({length:AIDC_FABRIC_01.spines},(_,index)=>aidcDeviceId('Spine',index+1));
export const AIDC_LEAF_IDS=Array.from({length:AIDC_FABRIC_01.leafs},(_,index)=>aidcDeviceId('Leaf',index+1));
export const AIDC_LIFECYCLE_DEVICE_NAMES=[...Array.from({length:AIDC_FABRIC_01.mappedSpines},(_,index)=>aidcDeviceName('Spine',index+1)),...Array.from({length:AIDC_FABRIC_01.mappedLeafs},(_,index)=>aidcDeviceName('Leaf',index+1))];
export const isAidcFabricDevice=(device:{id:string})=>AIDC_SPINE_IDS.includes(device.id)||AIDC_LEAF_IDS.includes(device.id);
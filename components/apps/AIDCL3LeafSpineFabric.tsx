import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, Check, ChevronDown, ChevronLeft, ChevronRight, GitBranch, Layers3, Maximize2, Minimize2, Network, Plus, Save, Search, Server, Trash2, X } from 'lucide-react';
import TopologyCanvas, { TopologyHierarchyGroup, TopologyLink, TopologyNode } from '../topology/TopologyCanvas';
import { Device } from './AIDCInventoryTopology';
import { createFabricHierarchyGroups } from './l3FabricHierarchyDomain';
import { AIDC_FABRIC_01, AIDC_LEAF_IDS, AIDC_SPINE_IDS, aidcDeviceName } from './aidcTopologyDomain';

type LeafDomainType = 'L3'|'L2';
type LeafDomain = { id:string; name:string; type:LeafDomainType; asn:string; mlag:boolean; leafIds:string[] };
type PodConfiguration = { name:string; loopbackPool:string; p2pPool:string; vtepPool:string; spanningTreeMode:string; spineIds:string[] };
type Pod = PodConfiguration & { id:string; domains:LeafDomain[] };
type SuperSpinePlane = { id:string; name:string; asn:string; deviceIds:string[] };
type PlatformSettings = { profile:string; eosImage:string; managementVrf:string; ntpServers:string };
type AdvancedSettings = {
  bgpPeerGroup:{name:string;password:string;bfd:boolean};
  interfaceDescriptions:{spineToLeaf:string;mlagPeer:string};
  p2pInterfaces:{mtu:string;ipv6Unnumbered:boolean};
  mlag:{peerLinkPortChannelId:string;reloadDelay:string};
};
type DcConfiguration = { name:string; superSpinePlanes:SuperSpinePlane[]; platformSettings:PlatformSettings; advancedSettings:AdvancedSettings };
type DataCenter = DcConfiguration & { id:string; podDefault:PodConfiguration; pods:Pod[] };
type ValidationState = 'none'|'valid'|'warning'|'error';
type Selection = { kind:'devices'|'root'|'dc-default' } | { kind:'dc';dcId:string } | { kind:'pod-default';dcId:string } | { kind:'pod';dcId:string;podId:string } | { kind:'domain';dcId:string;podId:string;domainId:string };
type ConfigSelection = Exclude<Selection,{kind:'devices'|'root'}>;
type CreateDraft = { kind:'dc'|'pod'|'domain';dcId?:string;podId?:string;domainType?:LeafDomainType;name:string };
type Props = { workspace:string;devices:Device[];links:TopologyLink[];onBack:()=>void;onReviewWorkspace?:()=>void };

const defaultPodConfiguration:PodConfiguration={name:'Pod Default',loopbackPool:'10.255.0.0/24',p2pPool:'10.255.16.0/20',vtepPool:'10.255.1.0/24',spanningTreeMode:'MSTP',spineIds:[]};
const defaultPlatformSettings:PlatformSettings={profile:'Arista validated L3LS',eosImage:'EOS 4.33.1F',managementVrf:'MGMT',ntpServers:'10.0.0.10, 10.0.0.11'};
const defaultAdvancedSettings:AdvancedSettings={
  bgpPeerGroup:{name:'UNDERLAY-PEERS',password:'',bfd:true},
  interfaceDescriptions:{spineToLeaf:'P2P_LINK_TO_{peer}',mlagPeer:'MLAG_PEER_{peer}'},
  p2pInterfaces:{mtu:'9214',ipv6Unnumbered:false},
  mlag:{peerLinkPortChannelId:'2000',reloadDelay:'300'},
};
const makeDcConfiguration=(name:string):DcConfiguration=>({name,superSpinePlanes:[{id:'plane-a',name:'Plane A',asn:'65000',deviceIds:[]}],platformSettings:{...defaultPlatformSettings},advancedSettings:{bgpPeerGroup:{...defaultAdvancedSettings.bgpPeerGroup},interfaceDescriptions:{...defaultAdvancedSettings.interfaceDescriptions},p2pInterfaces:{...defaultAdvancedSettings.p2pInterfaces},mlag:{...defaultAdvancedSettings.mlag}}});
const seedFabric:DataCenter[]=[{id:AIDC_FABRIC_01.dcId,...makeDcConfiguration(AIDC_FABRIC_01.dcName),podDefault:{...defaultPodConfiguration},pods:[
  {id:AIDC_FABRIC_01.podId,name:AIDC_FABRIC_01.podName,spineIds:AIDC_SPINE_IDS,loopbackPool:'10.255.0.0/24',p2pPool:'10.255.16.0/20',vtepPool:'10.255.1.0/24',spanningTreeMode:'MSTP',domains:[{id:AIDC_FABRIC_01.domainId,name:AIDC_FABRIC_01.domainName,type:'L3',asn:'65101',mlag:false,leafIds:AIDC_LEAF_IDS}]},
]}];

const uid=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const inputClass='mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100';
const labelClass='block text-[8px] font-semibold uppercase tracking-wide text-slate-400';
const buttonClass='rounded-md border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-50';
const Field=({label,value,onChange,placeholder,readOnly=false}:{label:string;value:string;onChange?:(value:string)=>void;placeholder?:string;readOnly?:boolean})=><label className="block"><span className={labelClass}>{label}</span><input value={value} readOnly={readOnly} onChange={event=>onChange?.(event.target.value)} placeholder={placeholder} className={`${inputClass} ${readOnly?'bg-slate-50 text-slate-500':''}`}/></label>;
const Toggle=({label,checked,onChange}:{label:string;checked:boolean;onChange:(checked:boolean)=>void})=><label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-2.5"><span className="text-[10px] font-medium text-slate-700">{label}</span><input type="checkbox" checked={checked} onChange={event=>onChange(event.target.checked)} className="accent-blue-600"/></label>;
const SectionCard=({title,description,children}:{title:string;description?:string;children:React.ReactNode})=><section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4"><h3 className="text-[11px] font-semibold text-slate-800">{title}</h3>{description&&<p className="mt-1 text-[9px] leading-4 text-slate-500">{description}</p>}</div>{children}</section>;
const NavigationRow=({label,description,onClick,tone='blue'}:{label:string;description?:string;onClick:()=>void;tone?:'blue'|'violet'|'emerald'})=>{
  const hoverTone={blue:'hover:border-blue-300',violet:'hover:border-violet-300',emerald:'hover:border-emerald-300'}[tone];
  return <button onClick={onClick} className={`flex w-full items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-3 text-left transition-colors ${hoverTone}`}><span className="min-w-0"><b className="block truncate text-[10px] text-slate-700">{label}</b>{description&&<span className="mt-0.5 block text-[8px] text-slate-400">{description}</span>}</span><ChevronRight size={14} className="shrink-0 text-slate-400"/></button>;
};

const AIDCL3LeafSpineFabric:React.FC<Props>=({workspace,devices,links,onBack,onReviewWorkspace})=>{
  const [dataCenters,setDataCenters]=useState<DataCenter[]>(seedFabric);
  const [dcDefault,setDcDefault]=useState<DcConfiguration>(()=>makeDcConfiguration('Data Center Default'));
  const [selection,setSelection]=useState<Selection>({kind:'dc',dcId:AIDC_FABRIC_01.dcId});
  const [expanded,setExpanded]=useState<Set<string>>(()=>new Set([AIDC_FABRIC_01.dcId,AIDC_FABRIC_01.podId,`${AIDC_FABRIC_01.podId}-l3-domains`,`${AIDC_FABRIC_01.podId}-l2-domains`]));
  const [createDraft,setCreateDraft]=useState<CreateDraft|null>(null);
  const [query,setQuery]=useState('');
  const [deviceQuery,setDeviceQuery]=useState('');
  const [studioDeviceIds,setStudioDeviceIds]=useState<Set<string>>(()=>new Set([...AIDC_SPINE_IDS,...AIDC_LEAF_IDS]));
  const [selectedDeviceId,setSelectedDeviceId]=useState<string>();
  const [selectedLink,setSelectedLink]=useState<TopologyLink|null>(null);
  const [changeCount,setChangeCount]=useState(0);
  const [saved,setSaved]=useState(true);
  const [editorOpen,setEditorOpen]=useState(false);
  const [editorMaximized,setEditorMaximized]=useState(false);
  const [editorSection,setEditorSection]=useState('overview');

  const markChanged=()=>{setChangeCount(1);setSaved(false)};
  const toggleExpanded=(id:string)=>setExpanded(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next});
  const findDc=(id:string)=>dataCenters.find(dc=>dc.id===id);
  const findPod=(dcId:string,podId:string)=>findDc(dcId)?.pods.find(pod=>pod.id===podId);
  const findDomain=(dcId:string,podId:string,domainId:string)=>findPod(dcId,podId)?.domains.find(domain=>domain.id===domainId);
  const selectedDc=selection.kind==='dc'||selection.kind==='pod-default'||selection.kind==='pod'||selection.kind==='domain'?findDc(selection.dcId):undefined;
  const selectedPod=selection.kind==='pod'||selection.kind==='domain'?findPod(selection.dcId,selection.podId):undefined;
  const selectedDomain=selection.kind==='domain'?findDomain(selection.dcId,selection.podId,selection.domainId):undefined;

  const firstSection=(next:ConfigSelection)=>next.kind==='domain'?'overview':'overview';
  const openConfiguration=(next:ConfigSelection,section?:string)=>{setSelection(next);setEditorSection(section||firstSection(next));setEditorOpen(true);setSelectedDeviceId(undefined);setSelectedLink(null)};
  const closeConfiguration=()=>{setEditorOpen(false);setEditorMaximized(false)};
  const saveConfiguration=(close=false)=>{setSaved(true);if(close)closeConfiguration()};
  const navigateEditorBack=()=>{
    if(editorSection!=='overview'){setEditorSection('overview');return}
    if(selection.kind==='domain')return openConfiguration({kind:'pod',dcId:selection.dcId,podId:selection.podId},`${selectedDomain?.type.toLowerCase()||'l3'}-domains`);
    if(selection.kind==='pod'||selection.kind==='pod-default')return openConfiguration({kind:'dc',dcId:selection.dcId});
    closeConfiguration();
  };
  const updateDc=(dcId:string,update:(dc:DataCenter)=>DataCenter)=>{setDataCenters(current=>current.map(dc=>dc.id===dcId?update(dc):dc));markChanged()};
  const updatePod=(dcId:string,podId:string,update:(pod:Pod)=>Pod)=>updateDc(dcId,dc=>({...dc,pods:dc.pods.map(pod=>pod.id===podId?update(pod):pod)}));
  const updateDomain=(dcId:string,podId:string,domainId:string,update:(domain:LeafDomain)=>LeafDomain)=>updatePod(dcId,podId,pod=>({...pod,domains:pod.domains.map(domain=>domain.id===domainId?update(domain):domain)}));
  const updateDcDefault=(update:(value:DcConfiguration)=>DcConfiguration)=>{setDcDefault(update);markChanged()};
  const updatePodDefault=(dcId:string,update:(value:PodConfiguration)=>PodConfiguration)=>updateDc(dcId,dc=>({...dc,podDefault:update(dc.podDefault)}));

  const beginCreate=(draft:Omit<CreateDraft,'name'>)=>setCreateDraft({...draft,name:''});
  const confirmCreate=()=>{
    if(!createDraft?.name.trim())return;
    if(createDraft.kind==='dc'){
      const id=uid('dc');const next:DataCenter={id,...makeDcConfiguration(createDraft.name.trim()),podDefault:{...defaultPodConfiguration},pods:[]};
      setDataCenters(current=>[...current,next]);setExpanded(current=>new Set(current).add(id));markChanged();openConfiguration({kind:'dc',dcId:id});
    }else if(createDraft.kind==='pod'&&createDraft.dcId){
      const id=uid('pod');const dcId=createDraft.dcId;const defaults=findDc(dcId)?.podDefault||defaultPodConfiguration;
      updateDc(dcId,dc=>({...dc,pods:[...dc.pods,{...defaults,id,name:createDraft.name.trim(),spineIds:[],domains:[]}]}));setExpanded(current=>new Set(current).add(dcId).add(id).add(`${id}-l3-domains`).add(`${id}-l2-domains`));openConfiguration({kind:'pod',dcId,podId:id});
    }else if(createDraft.kind==='domain'&&createDraft.dcId&&createDraft.podId&&createDraft.domainType){
      const id=uid('domain');const {dcId,podId,domainType}=createDraft;
      updatePod(dcId,podId,pod=>({...pod,domains:[...pod.domains,{id,name:createDraft.name.trim(),type:domainType,asn:'',mlag:true,leafIds:[]}]}));setExpanded(current=>new Set(current).add(podId).add(`${podId}-${domainType.toLowerCase()}-domains`));openConfiguration({kind:'domain',dcId,podId,domainId:id});
    }
    setCreateDraft(null);
  };
  const removeSelected=()=>{
    if(selection.kind==='dc')setDataCenters(current=>current.filter(dc=>dc.id!==selection.dcId));
    if(selection.kind==='pod')setDataCenters(current=>current.map(dc=>dc.id===selection.dcId?{...dc,pods:dc.pods.filter(pod=>pod.id!==selection.podId)}:dc));
    if(selection.kind==='domain')setDataCenters(current=>current.map(dc=>dc.id===selection.dcId?{...dc,pods:dc.pods.map(pod=>pod.id===selection.podId?{...pod,domains:pod.domains.filter(domain=>domain.id!==selection.domainId)}:pod)}:dc));
    setSelection({kind:'root'});markChanged();closeConfiguration();
  };

  const assignedIds=useMemo(()=>new Set(dataCenters.flatMap(dc=>dc.pods.flatMap(pod=>[...pod.spineIds,...pod.domains.flatMap(domain=>domain.leafIds)]))),[dataCenters]);
  const configurationScopeIds=useMemo(()=>{
    if(selection.kind==='devices')return studioDeviceIds;
    if(selection.kind==='root'||selection.kind==='dc-default')return assignedIds;
    const dc=findDc(selection.dcId);if(!dc)return new Set<string>();
    if(selection.kind==='dc'||selection.kind==='pod-default')return new Set(dc.pods.flatMap(pod=>[...pod.spineIds,...pod.domains.flatMap(domain=>domain.leafIds)]));
    const pod=dc.pods.find(item=>item.id===selection.podId);if(!pod)return new Set<string>();
    if(selection.kind==='pod')return new Set([...pod.spineIds,...pod.domains.flatMap(domain=>domain.leafIds)]);
    const domain=pod.domains.find(item=>item.id===selection.domainId);return new Set([...pod.spineIds,...(domain?.leafIds||[])]);
  },[selection,dataCenters,assignedIds,studioDeviceIds]);
  const topologyScopeIds=selection.kind==='devices'?studioDeviceIds:assignedIds;
  const devicePath=(deviceId:string)=>{
    for(const dc of dataCenters)for(const pod of dc.pods){
      if(pod.spineIds.includes(deviceId))return{label:`${dc.name} / ${pod.name} / Spines`,selection:{kind:'pod',dcId:dc.id,podId:pod.id} as ConfigSelection};
      for(const domain of pod.domains)if(domain.leafIds.includes(deviceId))return{label:`${dc.name} / ${pod.name} / ${domain.type} Leaf Domains / ${domain.name}`,selection:{kind:'domain',dcId:dc.id,podId:pod.id,domainId:domain.id} as ConfigSelection};
    }
    return undefined;
  };
  const selectGraphDevice=(deviceId:string)=>{setSelectedDeviceId(deviceId);setSelectedLink(null);if(selection.kind!=='devices'){const path=devicePath(deviceId);if(path)setSelection(path.selection)}};
  const graphNodes=useMemo<TopologyNode<Device|{kind:'planned'}>[]>(()=>{
    const registered=devices.filter(device=>topologyScopeIds.has(device.id)).map(device=>({id:device.id,label:device.hostname,subtitle:`${device.customRole||device.role} · Registered`,role:device.role,state:device.state,data:device} as TopologyNode<Device|{kind:'planned'}>));
    const registeredIds=new Set(registered.map(node=>node.id));
    const planned=[...topologyScopeIds].filter(id=>!registeredIds.has(id)).map(id=>{const role=id.includes('SPINE')?'Spine' as const:'Leaf' as const;const index=Number(id.slice(-2));return{id,label:aidcDeviceName(role,index),subtitle:`${role==='Spine'?'Super Spine':'GPU Leaf'} · Planned / unassigned`,role,state:'design' as const,data:{kind:'planned' as const}}});
    return [...registered,...planned];
  },[devices,topologyScopeIds]);
  const assignmentOwnership=useMemo(()=>{
    const owner=new Map<string,{dcId:string;podId:string;domainId?:string}>();const duplicates=new Set<string>();
    dataCenters.forEach(dc=>dc.pods.forEach(pod=>{
      pod.spineIds.forEach(id=>{
        if(owner.has(id))duplicates.add(id);
        else owner.set(id,{dcId:dc.id,podId:pod.id});
      });
      pod.domains.forEach(domain=>domain.leafIds.forEach(id=>{
        if(owner.has(id))duplicates.add(id);
        else owner.set(id,{dcId:dc.id,podId:pod.id,domainId:domain.id});
      }));
    }));
    return{owner,duplicates};
  },[dataCenters]);
  const domainValidation=(domain:LeafDomain):ValidationState=>domain.leafIds.some(id=>assignmentOwnership.duplicates.has(id))||(domain.type==='L3'&&!domain.asn)||domain.leafIds.length===0?'error':domain.mlag&&domain.leafIds.length!==2?'warning':'valid';
  const podValidation=(pod:Pod|PodConfiguration):ValidationState=>{
    if(!pod.loopbackPool||!pod.p2pPool||!pod.vtepPool)return'warning';
    if('domains' in pod){if(pod.spineIds.some(id=>assignmentOwnership.duplicates.has(id))||pod.spineIds.length===0||pod.domains.length===0)return'error';const states=pod.domains.map(domainValidation);return states.includes('error')?'error':states.includes('warning')?'warning':'valid'}
    return'valid';
  };
  const dcValidation=(dc:DataCenter|DcConfiguration):ValidationState=>{
    if(!dc.name||!dc.platformSettings.profile||!dc.superSpinePlanes.length)return'warning';
    if('pods' in dc){if(!dc.pods.length)return'error';const states=dc.pods.map(podValidation);return states.includes('error')?'error':states.includes('warning')?'warning':'valid'}
    return'valid';
  };
  const validationDot:Record<ValidationState,string>={none:'bg-slate-300',valid:'bg-emerald-500',warning:'bg-amber-400',error:'bg-red-500'};
  const graphLinks=useMemo(()=>{
    if(selection.kind==='devices')return links.filter(link=>topologyScopeIds.has(link.source)&&topologyScopeIds.has(link.target)).map(link=>({...link,relationship:'inventory' as const}));
    const result:TopologyLink[]=[];
    dataCenters.forEach(dc=>dc.pods.forEach(pod=>{
      const spines=pod.spineIds.filter(id=>topologyScopeIds.has(id)&&assignmentOwnership.owner.get(id)?.podId===pod.id);
      const leaves=pod.domains.flatMap(domain=>domain.leafIds.filter(id=>assignmentOwnership.owner.get(id)?.domainId===domain.id)).filter(id=>topologyScopeIds.has(id));
      spines.forEach(spineId=>leaves.forEach(leafId=>{
        const observed=links.find(link=>(link.source===spineId&&link.target===leafId)||(link.source===leafId&&link.target===spineId));
        result.push(observed?{...observed,relationship:'inventory'}:{id:`planned-${pod.id}-${spineId}-${leafId}`,source:spineId,target:leafId,speed:'Planned',state:'workspace-modified',confidence:'High',relationship:'planned'});
      }));
    }));
    return result;
  },[selection.kind,dataCenters,links,topologyScopeIds,assignmentOwnership]);
  const observedLinkCount=graphLinks.filter(link=>link.relationship==='inventory').length;
  const plannedLinkCount=graphLinks.filter(link=>link.relationship==='planned').length;
  const hierarchyGroups=useMemo<TopologyHierarchyGroup[]>(()=>{
    if(selection.kind==='devices')return[];
    return createFabricHierarchyGroups(dataCenters.map(dc=>{
      const dcIds=dc.pods.flatMap(pod=>[...pod.spineIds,...pod.domains.flatMap(domain=>domain.leafIds)]).filter(id=>topologyScopeIds.has(id)&&assignmentOwnership.owner.get(id)?.dcId===dc.id);
      return{id:dc.id,name:dc.name,nodeIds:dcIds,validation:dcValidation(dc),pods:dc.pods.map(pod=>{
        const podIds=[...pod.spineIds,...pod.domains.flatMap(domain=>domain.leafIds)].filter(id=>topologyScopeIds.has(id)&&assignmentOwnership.owner.get(id)?.podId===pod.id);
        return{id:pod.id,name:pod.name,nodeIds:podIds,validation:podValidation(pod),domains:pod.domains.map(domain=>({id:domain.id,name:domain.name,nodeIds:domain.leafIds.filter(id=>topologyScopeIds.has(id)&&assignmentOwnership.owner.get(id)?.domainId===domain.id),validation:domainValidation(domain)}))};
      })};
    }));
  },[selection.kind,dataCenters,topologyScopeIds,assignmentOwnership]);
  const selectedGroupId=selection.kind==='dc'?selection.dcId:selection.kind==='pod'?selection.podId:selection.kind==='domain'?selection.domainId:undefined;
  const pathLabels=selection.kind==='devices'?['Studio Devices']:selection.kind==='root'?['Data Centers']:selection.kind==='dc-default'?['DC Default']:selection.kind==='dc'?[selectedDc?.name||'Data Center']:selection.kind==='pod-default'?[selectedDc?.name||'Data Center','Pod Default']:selection.kind==='pod'?[selectedDc?.name||'Data Center',selectedPod?.name||'Pod']:[selectedDc?.name||'Data Center',selectedPod?.name||'Pod',selectedDomain?.name||'Domain'];
  const selectedDevice=devices.find(device=>device.id===selectedDeviceId);
  const filteredTree=dataCenters.filter(dc=>!query||`${dc.name} ${dc.pods.map(pod=>`${pod.name} ${pod.domains.map(domain=>domain.name).join(' ')}`).join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  const toggleAssignment=(deviceId:string)=>{
    if(selection.kind==='pod'&&selectedPod){updatePod(selection.dcId,selection.podId,pod=>({...pod,spineIds:pod.spineIds.includes(deviceId)?pod.spineIds.filter(id=>id!==deviceId):[...pod.spineIds,deviceId]}));return}
    if(selection.kind==='pod-default'&&selectedDc){updatePodDefault(selection.dcId,pod=>({...pod,spineIds:pod.spineIds.includes(deviceId)?pod.spineIds.filter(id=>id!==deviceId):[...pod.spineIds,deviceId]}));return}
    if(selection.kind==='domain'&&selectedDomain)updateDomain(selection.dcId,selection.podId,selection.domainId,domain=>({...domain,leafIds:domain.leafIds.includes(deviceId)?domain.leafIds.filter(id=>id!==deviceId):[...domain.leafIds,deviceId]}));
  };
  const toggleStudioDevice=(deviceId:string)=>{
    const removing=studioDeviceIds.has(deviceId);setStudioDeviceIds(current=>{const next=new Set(current);removing?next.delete(deviceId):next.add(deviceId);return next});
    if(removing)setDataCenters(current=>current.map(dc=>({...dc,podDefault:{...dc.podDefault,spineIds:dc.podDefault.spineIds.filter(id=>id!==deviceId)},superSpinePlanes:dc.superSpinePlanes.map(plane=>({...plane,deviceIds:plane.deviceIds.filter(id=>id!==deviceId)})),pods:dc.pods.map(pod=>({...pod,spineIds:pod.spineIds.filter(id=>id!==deviceId),domains:pod.domains.map(domain=>({...domain,leafIds:domain.leafIds.filter(id=>id!==deviceId)}))}))})));
    markChanged();
  };
  const visibleDeviceCandidates=devices.filter(device=>{const text=`${device.hostname} ${device.managementIp} ${device.mac} ${device.model} ${device.role} ${device.customRole||''}`.toLowerCase();return !deviceQuery||text.includes(deviceQuery.toLowerCase())});
  const editorKind=selection.kind==='dc'||selection.kind==='dc-default'?'dc':selection.kind==='pod'||selection.kind==='pod-default'?'pod':selection.kind==='domain'?'domain':null;
  const editorSectionTitle:Record<string,string>={overview:'Overview',pods:'Pods',planes:'Super-Spine Planes',roles:'Role',platform:'Platform Settings',advanced:'Advanced Fabric Settings',addressing:'Addressing',spines:'Spine Assignment','l3-domains':'L3 Leaf Domains','l2-domains':'L2 Leaf Domains','asn-mlag':'ASN & MLAG',mlag:'MLAG',leaves:'Leaf Assignment'};
  const editorTitle=selection.kind==='dc-default'?'DC Default':selection.kind==='pod-default'?'Pod Default':selection.kind==='dc'?selectedDc?.name:selection.kind==='pod'?selectedPod?.name:selection.kind==='domain'?`${selectedDomain?.type||'L3'} Leaf Domain · ${selectedDomain?.name}`:'Configuration';
  const workbenchBreadcrumb:{label:string;onClick?:()=>void}[]=[{label:'Data Centers',onClick:()=>{setSelection({kind:'root'});closeConfiguration()}}];
  if(selection.kind==='dc-default')workbenchBreadcrumb.push({label:'DC Default',onClick:()=>setEditorSection('overview')});
  if(selection.kind==='dc'||selection.kind==='pod-default'||selection.kind==='pod'||selection.kind==='domain')workbenchBreadcrumb.push({label:selectedDc?.name||'Data Center',onClick:()=>openConfiguration({kind:'dc',dcId:selection.dcId})});
  if(selection.kind==='pod-default')workbenchBreadcrumb.push({label:'Pod Default',onClick:()=>setEditorSection('overview')});
  if(selection.kind==='pod'||selection.kind==='domain')workbenchBreadcrumb.push({label:selectedPod?.name||'Pod',onClick:()=>openConfiguration({kind:'pod',dcId:selection.dcId,podId:selection.podId})});
  if(selection.kind==='domain'){
    const collectionSection=`${selectedDomain?.type.toLowerCase()||'l3'}-domains`;
    workbenchBreadcrumb.push({label:`${selectedDomain?.type||'L3'} Leaf Domains`,onClick:()=>openConfiguration({kind:'pod',dcId:selection.dcId,podId:selection.podId},collectionSection)});
    workbenchBreadcrumb.push({label:selectedDomain?.name||'Domain',onClick:()=>setEditorSection('overview')});
  }
  if(editorSection!=='overview')workbenchBreadcrumb.push({label:editorSectionTitle[editorSection]||editorSection});
  const editorValidation:ValidationState=selection.kind==='dc-default'?dcValidation(dcDefault):selection.kind==='dc'&&selectedDc?dcValidation(selectedDc):selection.kind==='pod-default'&&selectedDc?podValidation(selectedDc.podDefault):selection.kind==='pod'&&selectedPod?podValidation(selectedPod):selection.kind==='domain'&&selectedDomain?domainValidation(selectedDomain):'none';
  const validationLabel=editorValidation==='valid'?'Validation passed':editorValidation==='warning'?'Validation warning':editorValidation==='error'?'Blocking validation error':'Not validated';
  const dcConfig=selection.kind==='dc-default'?dcDefault:selection.kind==='dc'?selectedDc:undefined;
  const podConfig=selection.kind==='pod-default'?selectedDc?.podDefault:selection.kind==='pod'?selectedPod:undefined;
  const updateCurrentDc=(update:(value:DcConfiguration)=>DcConfiguration)=>{
    if(selection.kind==='dc-default')updateDcDefault(update);
    if(selection.kind==='dc')updateDc(selection.dcId,dc=>({...dc,...update(dc)}));
  };
  const updateCurrentPod=(update:(value:PodConfiguration)=>PodConfiguration)=>{
    if(selection.kind==='pod-default')updatePodDefault(selection.dcId,update);
    if(selection.kind==='pod')updatePod(selection.dcId,selection.podId,pod=>({...pod,...update(pod)}));
  };
  const dcDevices=devices.filter(device=>studioDeviceIds.has(device.id)&&(selection.kind==='dc-default'||configurationScopeIds.has(device.id)));

  const renderStudioDeviceSelection=()=> <div className="min-h-0 flex-1 overflow-auto p-4"><p className="text-[9px] leading-4 text-slate-500">Select registered Inventory devices that this Studio may assign to Data Centers, Pods and Leaf Domains.</p><div className="relative mt-3"><Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/><input value={deviceQuery} onChange={event=>setDeviceQuery(event.target.value)} placeholder="Search registered devices" className="w-full rounded border border-slate-200 py-2 pl-7 pr-2 text-[8px] outline-none focus:border-blue-400"/></div><div className="mt-3 space-y-1">{visibleDeviceCandidates.map(device=><label key={device.id} className={`flex items-center gap-2 rounded border px-2.5 py-2 text-[9px] ${studioDeviceIds.has(device.id)?'border-blue-200 bg-blue-50/40':'border-slate-200 bg-white'}`}><input type="checkbox" checked={studioDeviceIds.has(device.id)} onChange={()=>toggleStudioDevice(device.id)} className="accent-blue-600"/><Server size={11} className="text-slate-400"/><span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-700">{device.hostname}</span><span className="mt-0.5 block truncate font-mono text-[8px] text-slate-400">{device.mac}</span></span><span className="text-right text-[8px] text-slate-500"><span className="block">{device.customRole||device.role}</span><span className="mt-0.5 block font-mono text-slate-400">Node {device.nodeId||'—'} · {device.nodeIdSource||'Unassigned'}</span></span></label>)}</div></div>;

  const renderDcSection=()=>{
    if(!dcConfig)return null;
    if(editorSection==='overview')return <SectionCard title="Overview" description={selection.kind==='dc-default'?'A complete reusable configuration node. It can be saved, but it is not a runtime Data Center instance.':'Identity and hierarchy summary for this Data Center.'}>
      <Field label="Data Center name" value={dcConfig.name} onChange={value=>updateCurrentDc(current=>({...current,name:value}))}/>
      <div className="mt-4 space-y-2">
        <NavigationRow label="Pods" description={selection.kind==='dc-default'?'Review the default schema boundary':'Open Pod Default and named Pods'} onClick={()=>setEditorSection('pods')}/>
        <NavigationRow label="Super-Spine Planes" description={`${dcConfig.superSpinePlanes.length} configured plane${dcConfig.superSpinePlanes.length===1?'':'s'}`} onClick={()=>setEditorSection('planes')}/>
        <NavigationRow label="Role" description="Canonical Role and Node ID references from Inventory" onClick={()=>setEditorSection('roles')}/>
        <NavigationRow label="Platform Settings" description={dcConfig.platformSettings.profile} onClick={()=>setEditorSection('platform')}/>
        <NavigationRow label="Advanced Fabric Settings" description="BGP, interface, P2P and MLAG controls" onClick={()=>setEditorSection('advanced')}/>
      </div>
      {selection.kind==='dc'&&<button onClick={removeSelected} className="mt-5 flex items-center gap-1.5 text-[9px] font-semibold text-red-600"><Trash2 size={12}/>Delete Data Center</button>}
    </SectionCard>;
    if(editorSection==='pods')return <SectionCard title="Pods" description={selection.kind==='dc-default'?'This configuration default defines DC-level values and is not a runtime container.':'Open the Pod Default or a named Pod in this Data Center.'}>{selection.kind==='dc'?<div className="space-y-4">
      <div><p className={`${labelClass} mb-2`}>Pod Default</p><NavigationRow label="Pod Default" description="Open the complete Pod default configuration node" tone="violet" onClick={()=>openConfiguration({kind:'pod-default',dcId:selectedDc!.id})}/></div>
      <div><p className={`${labelClass} mb-2`}>Named Pods</p><div className="space-y-2">{selectedDc?.pods.map(pod=><NavigationRow key={pod.id} label={pod.name} description={`${pod.domains.filter(domain=>domain.type==='L3').length} L3 · ${pod.domains.filter(domain=>domain.type==='L2').length} L2 domains · ${pod.spineIds.length} spines`} tone="violet" onClick={()=>openConfiguration({kind:'pod',dcId:selectedDc.id,podId:pod.id})}/>)}</div><button onClick={()=>beginCreate({kind:'pod',dcId:selectedDc!.id})} className="flex items-center gap-1.5 pt-3 text-[9px] font-semibold text-blue-600"><Plus size={12}/>Create Pod</button></div>
    </div>:<p className="rounded-md bg-blue-50 p-3 text-[9px] text-blue-700">DC Default is saveable DC configuration data. It is not a runtime container and has no Pod Default or named Pod instances.</p>}</SectionCard>;
    if(editorSection==='planes')return <SectionCard title="Super-Spine Planes" description="Define the control-plane identity and optional inventory membership for each super-spine plane."><div className="space-y-3">{dcConfig.superSpinePlanes.map(plane=><div key={plane.id} className="rounded-md border border-slate-200 p-3"><div className="grid grid-cols-2 gap-3"><Field label="Plane name" value={plane.name} onChange={value=>updateCurrentDc(current=>({...current,superSpinePlanes:current.superSpinePlanes.map(item=>item.id===plane.id?{...item,name:value}:item)}))}/><Field label="ASN" value={plane.asn} onChange={value=>updateCurrentDc(current=>({...current,superSpinePlanes:current.superSpinePlanes.map(item=>item.id===plane.id?{...item,asn:value}:item)}))}/></div><p className={`${labelClass} mt-3`}>Super-Spine devices</p><div className="mt-2 grid grid-cols-2 gap-2">{devices.filter(device=>studioDeviceIds.has(device.id)&&(device.role==='Spine'||device.customRole==='Super Spine')).map(device=><label key={device.id} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-2 text-[9px]"><input type="checkbox" checked={plane.deviceIds.includes(device.id)} onChange={()=>updateCurrentDc(current=>({...current,superSpinePlanes:current.superSpinePlanes.map(item=>item.id===plane.id?{...item,deviceIds:item.deviceIds.includes(device.id)?item.deviceIds.filter(id=>id!==device.id):[...item.deviceIds,device.id]}:item)}))}/><span className="truncate">{device.hostname}</span></label>)}</div></div>)}<button onClick={()=>updateCurrentDc(current=>({...current,superSpinePlanes:[...current.superSpinePlanes,{id:uid('plane'),name:`Plane ${current.superSpinePlanes.length+1}`,asn:'',deviceIds:[]}]}))} className="flex items-center gap-1.5 text-[9px] font-semibold text-blue-600"><Plus size={12}/>Add Plane</button></div></SectionCard>;
    if(editorSection==='roles')return <SectionCard title="Role & Node ID" description="Read-only references from Inventory devices. Roles and Node IDs are not duplicated in this Studio."><div className="overflow-hidden rounded-md border border-slate-200"><table className="w-full text-left text-[9px]"><thead className="bg-slate-50 text-[8px] uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-2">Device</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Node ID</th><th className="px-3 py-2">Source</th></tr></thead><tbody>{dcDevices.map(device=><tr key={device.id} className="border-t border-slate-100"><td className="px-3 py-2"><b className="block text-slate-700">{device.hostname}</b><span className="font-mono text-[8px] text-slate-400">{device.mac}</span></td><td className="px-3 py-2">{device.customRole||device.role}</td><td className="px-3 py-2 font-mono">{device.nodeId||'—'}</td><td className="px-3 py-2">{device.nodeIdSource||'Unassigned'}</td></tr>)}</tbody></table></div></SectionCard>;
    if(editorSection==='platform')return <SectionCard title="Platform Settings"><div className="grid grid-cols-2 gap-4"><Field label="Platform profile" value={dcConfig.platformSettings.profile} onChange={value=>updateCurrentDc(current=>({...current,platformSettings:{...current.platformSettings,profile:value}}))}/><Field label="EOS image" value={dcConfig.platformSettings.eosImage} onChange={value=>updateCurrentDc(current=>({...current,platformSettings:{...current.platformSettings,eosImage:value}}))}/><Field label="Management VRF" value={dcConfig.platformSettings.managementVrf} onChange={value=>updateCurrentDc(current=>({...current,platformSettings:{...current.platformSettings,managementVrf:value}}))}/><Field label="NTP servers" value={dcConfig.platformSettings.ntpServers} onChange={value=>updateCurrentDc(current=>({...current,platformSettings:{...current.platformSettings,ntpServers:value}}))}/></div></SectionCard>;
    return <SectionCard title="Advanced Fabric Settings" description="Fabric-wide protocol, description, routed-interface and MLAG controls."><div className="space-y-5"><div><h4 className="mb-2 text-[9px] font-semibold text-slate-700">BGP Peer Group Settings</h4><div className="grid grid-cols-2 gap-3"><Field label="Peer group name" value={dcConfig.advancedSettings.bgpPeerGroup.name} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,bgpPeerGroup:{...current.advancedSettings.bgpPeerGroup,name:value}}}))}/><Field label="Peer password" value={dcConfig.advancedSettings.bgpPeerGroup.password} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,bgpPeerGroup:{...current.advancedSettings.bgpPeerGroup,password:value}}}))}/></div><div className="mt-3"><Toggle label="Enable BFD" checked={dcConfig.advancedSettings.bgpPeerGroup.bfd} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,bgpPeerGroup:{...current.advancedSettings.bgpPeerGroup,bfd:value}}}))}/></div></div><div><h4 className="mb-2 text-[9px] font-semibold text-slate-700">Interface Descriptions</h4><div className="grid grid-cols-2 gap-3"><Field label="Spine to Leaf" value={dcConfig.advancedSettings.interfaceDescriptions.spineToLeaf} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,interfaceDescriptions:{...current.advancedSettings.interfaceDescriptions,spineToLeaf:value}}}))}/><Field label="MLAG peer" value={dcConfig.advancedSettings.interfaceDescriptions.mlagPeer} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,interfaceDescriptions:{...current.advancedSettings.interfaceDescriptions,mlagPeer:value}}}))}/></div></div><div><h4 className="mb-2 text-[9px] font-semibold text-slate-700">P2P Interface Settings</h4><div className="grid grid-cols-2 gap-3"><Field label="MTU" value={dcConfig.advancedSettings.p2pInterfaces.mtu} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,p2pInterfaces:{...current.advancedSettings.p2pInterfaces,mtu:value}}}))}/><Toggle label="IPv6 unnumbered" checked={dcConfig.advancedSettings.p2pInterfaces.ipv6Unnumbered} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,p2pInterfaces:{...current.advancedSettings.p2pInterfaces,ipv6Unnumbered:value}}}))}/></div></div><div><h4 className="mb-2 text-[9px] font-semibold text-slate-700">MLAG Settings</h4><div className="grid grid-cols-2 gap-3"><Field label="Peer-link Port-Channel" value={dcConfig.advancedSettings.mlag.peerLinkPortChannelId} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,mlag:{...current.advancedSettings.mlag,peerLinkPortChannelId:value}}}))}/><Field label="Reload delay" value={dcConfig.advancedSettings.mlag.reloadDelay} onChange={value=>updateCurrentDc(current=>({...current,advancedSettings:{...current.advancedSettings,mlag:{...current.advancedSettings.mlag,reloadDelay:value}}}))}/></div></div></div></SectionCard>;
  };

  const renderPodSection=()=>{
    if(!podConfig)return null;
    if(editorSection==='overview')return <SectionCard title="Overview" description={selection.kind==='pod-default'?'A complete Pod configuration node that can be saved without becoming a runtime Pod.':'Identity and hierarchy summary for this Pod.'}>
      <Field label="Pod name" value={podConfig.name} onChange={value=>updateCurrentPod(current=>({...current,name:value}))}/>
      <div className="mt-4 space-y-2">
        <NavigationRow label="Addressing" description="Loopback, P2P link and VTEP pools" tone="violet" onClick={()=>setEditorSection('addressing')}/>
        <NavigationRow label="Spine Assignment" description={`${podConfig.spineIds.length} selected spine${podConfig.spineIds.length===1?'':'s'}`} tone="violet" onClick={()=>setEditorSection('spines')}/>
        <NavigationRow label="L3 Leaf Domains" description={selection.kind==='pod-default'?'Review the L3 Domain schema boundary':`${selectedPod?.domains.filter(domain=>domain.type==='L3').length||0} named L3 domain${selectedPod?.domains.filter(domain=>domain.type==='L3').length===1?'':'s'}`} tone="violet" onClick={()=>setEditorSection('l3-domains')}/>
        <NavigationRow label="L2 Leaf Domains" description={selection.kind==='pod-default'?'Review the L2 Domain schema boundary':`${selectedPod?.domains.filter(domain=>domain.type==='L2').length||0} named L2 domain${selectedPod?.domains.filter(domain=>domain.type==='L2').length===1?'':'s'}`} tone="violet" onClick={()=>setEditorSection('l2-domains')}/>
      </div>
      {selection.kind==='pod'&&<button onClick={removeSelected} className="mt-5 flex items-center gap-1.5 text-[9px] font-semibold text-red-600"><Trash2 size={12}/>Delete Pod</button>}
    </SectionCard>;
    if(editorSection==='addressing')return <SectionCard title="Addressing" description="Address pools used by this Pod configuration."><div className="grid grid-cols-2 gap-4"><Field label="Loopback pool" value={podConfig.loopbackPool} onChange={value=>updateCurrentPod(current=>({...current,loopbackPool:value}))}/><Field label="P2P link pool" value={podConfig.p2pPool} onChange={value=>updateCurrentPod(current=>({...current,p2pPool:value}))}/><Field label="VTEP pool" value={podConfig.vtepPool} onChange={value=>updateCurrentPod(current=>({...current,vtepPool:value}))}/><label><span className={labelClass}>Spanning tree mode</span><select value={podConfig.spanningTreeMode} onChange={event=>updateCurrentPod(current=>({...current,spanningTreeMode:event.target.value}))} className={inputClass}><option>MSTP</option><option>RSTP</option><option>Rapid-PVST</option></select></label></div></SectionCard>;
    if(editorSection==='spines')return <SectionCard title="Spine Assignment" description={selection.kind==='pod-default'?'Assignment values are saved on this configuration default and do not establish runtime ownership.':'A Spine can belong to only one runtime Pod.'}><div className="space-y-2">{devices.filter(device=>studioDeviceIds.has(device.id)&&device.role==='Spine').map(device=>{const usedElsewhere=selection.kind==='pod'&&dataCenters.some(dc=>dc.pods.some(pod=>pod.id!==selectedPod?.id&&pod.spineIds.includes(device.id)));return <label key={device.id} className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-[9px] ${usedElsewhere?'border-red-100 bg-red-50 text-red-600':'border-slate-200 bg-white'}`}><input type="checkbox" disabled={usedElsewhere} checked={podConfig.spineIds.includes(device.id)} onChange={()=>toggleAssignment(device.id)} className="accent-blue-600"/><Server size={12} className="text-slate-400"/><span className="min-w-0 flex-1"><b className="block truncate">{device.hostname}</b><span className="text-[8px] text-slate-400">Node {device.nodeId||'—'} · {device.nodeIdSource||'Unassigned'}</span></span><span className="text-[8px]">{usedElsewhere?'Assigned to another Pod':device.model}</span></label>})}</div></SectionCard>;
    const domainType:LeafDomainType=editorSection==='l2-domains'?'L2':'L3';
    const domains=selectedPod?.domains.filter(domain=>domain.type===domainType)||[];
    return <SectionCard title={`${domainType} Leaf Domains`} description={selection.kind==='pod-default'?`Pod Default exposes the ${domainType} Leaf Domain schema, but is not a runtime Domain container and cannot create instances.`:`Open a named ${domainType} Leaf Domain in this Pod.`}>{selection.kind==='pod'?<div><p className={`${labelClass} mb-2`}>Named {domainType} Domains</p><div className="space-y-2">{domains.map(domain=><NavigationRow key={domain.id} label={domain.name} description={`${domain.type==='L3'?`ASN ${domain.asn||'Not set'} · `:''}MLAG ${domain.mlag?'enabled':'disabled'} · ${domain.leafIds.length} leaves`} tone="emerald" onClick={()=>openConfiguration({kind:'domain',dcId:selection.dcId,podId:selection.podId,domainId:domain.id})}/>)}</div><button onClick={()=>beginCreate({kind:'domain',dcId:selection.dcId,podId:selection.podId,domainType})} className="flex items-center gap-1.5 pt-3 text-[9px] font-semibold text-blue-600"><Plus size={12}/>Create {domainType} Leaf Domain</button></div>:<div className="space-y-2"><p className="rounded-md bg-violet-50 p-3 text-[9px] text-violet-700">Pod Default is saveable Pod configuration data. It is not a runtime Domain container and cannot create {domainType} Domain instances.</p><p className="text-[9px] text-slate-500">This entry documents the reusable {domainType} Leaf Domain schema boundary.</p></div>}</SectionCard>;
  };

  const renderDomainSection=()=>{
    if(selection.kind!=='domain'||!selectedDomain)return null;
    if(editorSection==='overview')return <SectionCard title={`${selectedDomain.type} Leaf Domain Overview`} description={`Identity and hierarchy placement for this ${selectedDomain.type} Leaf Domain.`}>
      <Field label={`${selectedDomain.type} Leaf Domain name`} value={selectedDomain.name} onChange={value=>updateDomain(selection.dcId,selection.podId,selection.domainId,domain=>({...domain,name:value}))}/>
      <div className="mt-4 space-y-2">
        <NavigationRow label={selectedDomain.type==='L3'?'ASN & MLAG':'MLAG'} description={`${selectedDomain.type==='L3'?`ASN ${selectedDomain.asn||'Not set'} · `:''}MLAG ${selectedDomain.mlag?'enabled':'disabled'}`} tone="emerald" onClick={()=>setEditorSection(selectedDomain.type==='L3'?'asn-mlag':'mlag')}/>
        <NavigationRow label="Leaf Assignment" description={`${selectedDomain.leafIds.length} selected leaf${selectedDomain.leafIds.length===1?'':'s'}`} tone="emerald" onClick={()=>setEditorSection('leaves')}/>
      </div>
      <button onClick={removeSelected} className="mt-5 flex items-center gap-1.5 text-[9px] font-semibold text-red-600"><Trash2 size={12}/>Delete {selectedDomain.type} Leaf Domain</button>
    </SectionCard>;
    if(editorSection==='asn-mlag'&&selectedDomain.type==='L3')return <SectionCard title="ASN & MLAG"><div className="grid grid-cols-2 gap-4"><Field label="ASN" value={selectedDomain.asn} onChange={value=>updateDomain(selection.dcId,selection.podId,selection.domainId,domain=>({...domain,asn:value}))}/><Toggle label="Enable MLAG" checked={selectedDomain.mlag} onChange={value=>updateDomain(selection.dcId,selection.podId,selection.domainId,domain=>({...domain,mlag:value}))}/></div></SectionCard>;
    if(editorSection==='mlag'&&selectedDomain.type==='L2')return <SectionCard title="MLAG" description="Configure MLAG behavior for this L2 Leaf Domain."><Toggle label="Enable MLAG" checked={selectedDomain.mlag} onChange={value=>updateDomain(selection.dcId,selection.podId,selection.domainId,domain=>({...domain,mlag:value}))}/></SectionCard>;
    return <SectionCard title="Leaf Assignment" description="A Leaf can belong to only one runtime Domain; MLAG Domains expect exactly two Leafs."><div className="space-y-2">{devices.filter(device=>studioDeviceIds.has(device.id)&&device.role==='Leaf').map(device=>{const usedElsewhere=assignedIds.has(device.id)&&!selectedDomain.leafIds.includes(device.id);const atLimit=!selectedDomain.leafIds.includes(device.id)&&selectedDomain.leafIds.length>=2;return <label key={device.id} className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-[9px] ${usedElsewhere?'border-slate-100 bg-slate-50 text-slate-400':'border-slate-200'}`}><input type="checkbox" disabled={usedElsewhere||atLimit} checked={selectedDomain.leafIds.includes(device.id)} onChange={()=>toggleAssignment(device.id)} className="accent-blue-600"/><Network size={12}/><span className="min-w-0 flex-1"><b className="block truncate">{device.hostname}</b><span className="text-[8px] text-slate-400">Node {device.nodeId||'—'} · {device.nodeIdSource||'Unassigned'}</span></span><span className="text-[8px]">{usedElsewhere?'Assigned elsewhere':device.customRole||device.role}</span></label>})}</div></SectionCard>;
  };
  const renderConfigurationSection=()=>editorKind==='dc'?renderDcSection():editorKind==='pod'?renderPodSection():renderDomainSection();
  const openHierarchyGroup=(group:TopologyHierarchyGroup)=>{
    for(const dc of dataCenters){
      if(group.id===dc.id){openConfiguration({kind:'dc',dcId:dc.id});return}
      for(const pod of dc.pods){
        if(group.id===pod.id){openConfiguration({kind:'pod',dcId:dc.id,podId:pod.id});return}
        for(const domain of pod.domains){
          if(group.id===domain.id){openConfiguration({kind:'domain',dcId:dc.id,podId:pod.id,domainId:domain.id});return}
        }
      }
    }
  };

  const renderConfigurationWorkbench=()=>{
    if(!editorOpen||!editorKind)return null;
    return <div className="relative z-[120] flex min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white shadow-xl">
      <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div className="min-w-0"><div className="flex items-center gap-2"><button onClick={navigateEditorBack} title={editorSection!=='overview'?'Back to overview':'Back to parent configuration'} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronLeft size={15}/></button><h2 className="truncate text-base font-semibold text-slate-900">{editorTitle}</h2><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-semibold ${editorValidation==='valid'?'bg-emerald-50 text-emerald-700':editorValidation==='warning'?'bg-amber-50 text-amber-700':editorValidation==='error'?'bg-red-50 text-red-700':'bg-slate-100 text-slate-600'}`}><i className={`h-1.5 w-1.5 rounded-full ${validationDot[editorValidation]}`}/>{validationLabel}</span></div><div className="mt-2 flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto whitespace-nowrap text-[8px] text-slate-400">{workbenchBreadcrumb.map((item,index)=><React.Fragment key={`${item.label}-${index}`}>{item.onClick?<button onClick={item.onClick} className={`${index===workbenchBreadcrumb.length-1?'font-semibold text-slate-600':'hover:text-blue-600 hover:underline'}`}>{item.label}</button>:<span className="font-semibold text-slate-600">{item.label}</span>}{index<workbenchBreadcrumb.length-1&&<ChevronRight size={9}/>}</React.Fragment>)}</div></div><div className="flex items-center gap-1"><button onClick={()=>setEditorMaximized(value=>!value)} title={editorMaximized?'Restore workbench':'Maximize workbench'} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">{editorMaximized?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button><button onClick={closeConfiguration} title="Close configuration" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={17}/></button></div></header>
      <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-5">{renderConfigurationSection()}</div>
      <footer className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3"><button onClick={closeConfiguration} className={buttonClass}>Close</button><div className="flex items-center gap-2">{selection.kind==='dc'&&<button onClick={()=>{saveConfiguration();setEditorSection('pods')}} className={buttonClass}>Save & Configure Pods</button>}{selection.kind==='pod'&&<button onClick={()=>{saveConfiguration();setEditorSection('l3-domains')}} className={buttonClass}>Save & Configure Leaf Domains</button>}<button onClick={()=>saveConfiguration()} className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-semibold text-blue-700"><Save size={12}/>Save to Workspace</button><button onClick={()=>saveConfiguration(true)} className="rounded-md bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white">Save & Close</button></div></footer>
    </div>;
  };

  return <div className="provisioning-readable flex h-full min-h-0 flex-col overflow-hidden bg-[#edf3f8] text-slate-700">
    <header className="flex-shrink-0 border-b border-slate-200 bg-white px-5 py-3"><div className="flex items-start justify-between gap-4"><div><button onClick={onBack} className="mb-1 flex items-center gap-1 text-[9px] text-blue-600 hover:underline"><ArrowLeft size={11}/>Studios</button><div className="flex items-center gap-2"><h1 className="text-lg font-semibold text-slate-900">L3 Leaf-Spine Fabric</h1><span className="rounded-full bg-blue-50 px-2 py-1 text-[8px] font-semibold text-blue-700">Topology Workbench</span></div><p className="mt-1 text-[9px] text-slate-500">Create Data Centers, Pods and Leaf Domains, assign registered devices, and review the proposed hierarchy against Inventory topology.</p></div><div className="flex items-center gap-2"><button onClick={onReviewWorkspace} className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-semibold text-blue-700">Review Workspace</button><button disabled={saved} onClick={()=>saveConfiguration()} className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-2 text-[9px] font-semibold text-white disabled:bg-slate-300"><Save size={12}/>{saved?'Saved':'Save to Workspace'}</button></div></div><div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2 text-[9px]"><span className="font-semibold text-slate-500">Workspace</span><span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700">{workspace||'No Workspace selected'}</span><span className={`rounded-full px-2 py-1 font-semibold ${changeCount?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-500'}`}>{changeCount?'Workspace Build Required':'No Changes'}</span><span className="text-slate-400">{changeCount} proposed change{changeCount===1?'':'s'}</span></div></header>
    <main
      style={{gridTemplateColumns:editorOpen?(editorMaximized?'390px minmax(0,1fr)':'390px clamp(460px,34%,640px) minmax(280px,1fr)'):'390px minmax(0,1fr)'}}
      className="relative m-5 grid min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white shadow-sm transition-[grid-template-columns] duration-300"
    >
      <aside className="flex min-h-0 flex-col border-r border-slate-200"><div className="flex-shrink-0 border-b border-slate-200 bg-slate-50/60 p-3"><div><h2 className="text-[11px] font-semibold text-slate-800">Fabric Configuration</h2><p className="mt-1 text-[8px] text-slate-400">{selection.kind==='devices'?'Studio scope from registered Inventory devices':'Configuration defaults · Runtime hierarchy · Assignments'}</p></div><div className="mt-3 grid grid-cols-2 border-b border-slate-200"><button onClick={()=>{setSelection({kind:'devices'});closeConfiguration();setSelectedDeviceId(undefined);setSelectedLink(null)}} className={`flex items-center justify-center gap-2 border-b-2 px-2 py-2 text-[9px] font-semibold ${selection.kind==='devices'?'border-blue-600 bg-blue-50/60 text-blue-700':'border-transparent text-slate-500 hover:bg-white'}`}><Server size={11}/>Studio Devices</button><button onClick={()=>{setSelection({kind:'root'});closeConfiguration();setSelectedDeviceId(undefined);setSelectedLink(null)}} className={`flex items-center justify-center gap-2 border-b-2 px-2 py-2 text-[9px] font-semibold ${selection.kind!=='devices'?'border-blue-600 bg-blue-50/60 text-blue-700':'border-transparent text-slate-500 hover:bg-white'}`}><Layers3 size={11}/>Data Centers</button></div>{selection.kind!=='devices'&&<div className="relative mt-3"><Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search Data Centers, Pods or Domains" className="w-full rounded border border-slate-200 bg-white py-2 pl-7 pr-2 text-[8px] outline-none focus:border-blue-400"/></div>}</div>
        {selection.kind==='devices'?renderStudioDeviceSelection():<div className="min-h-0 flex-1 overflow-auto p-2"><div className={`mb-1 grid grid-cols-[minmax(0,1fr)_22px] items-center gap-1 rounded px-2 py-1.5 ${selection.kind==='root'?'bg-emerald-50 text-emerald-700':'text-slate-500'}`}><button onClick={()=>{setSelection({kind:'root'});closeConfiguration()}} className="flex min-w-0 items-center gap-2 text-left text-[9px] font-semibold"><Layers3 size={12} className="text-blue-500"/><span className="truncate">Hierarchy</span></button><button onClick={()=>beginCreate({kind:'dc'})} title="Create Data Center" className="rounded border border-blue-100 bg-white p-1 text-blue-600 hover:bg-blue-50"><Plus size={10}/></button></div><div className="ml-4 border-l border-slate-200 pl-2"><button onClick={()=>openConfiguration({kind:'dc-default'})} className={`mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[9px] ${selection.kind==='dc-default'?'bg-emerald-50 font-semibold text-emerald-700':'text-slate-500 hover:bg-slate-50'}`}><Building2 size={10} className="text-blue-500"/><span className="flex-1">DC Default</span><ChevronRight size={11} className="text-slate-400"/></button>
          {filteredTree.map(dc=><div key={dc.id}><div className={`grid grid-cols-[20px_minmax(0,1fr)_16px] items-center rounded px-1 py-1 ${selection.kind==='dc'&&selection.dcId===dc.id?'bg-emerald-50 text-emerald-700':'text-slate-500'}`}><button onClick={()=>toggleExpanded(dc.id)} className="p-1 text-slate-400">{expanded.has(dc.id)?<ChevronDown size={11}/>:<ChevronRight size={11}/>}</button><button onClick={()=>openConfiguration({kind:'dc',dcId:dc.id})} className="flex min-w-0 items-center gap-2 py-1 text-left text-[9px]"><Building2 size={12} className="text-blue-500"/><span className="min-w-0 flex-1 truncate font-medium">{dc.name}</span></button><i title={dcValidation(dc)==='valid'?'Validation passed':dcValidation(dc)==='warning'?'Validation warning':'Blocking validation error'} className={`h-2 w-2 justify-self-center rounded-full ${validationDot[dcValidation(dc)]}`}/></div>{expanded.has(dc.id)&&<div className="ml-5 border-l border-slate-200 pl-2"><div className="mb-0.5 grid grid-cols-[minmax(0,1fr)_22px] items-center gap-1 rounded px-2 py-1"><span className="flex min-w-0 items-center gap-2 text-[8px] font-semibold uppercase tracking-wide text-slate-500"><GitBranch size={10}/><span className="truncate">Pods</span></span><button onClick={()=>beginCreate({kind:'pod',dcId:dc.id})} title="Create Pod" className="rounded border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"><Plus size={9}/></button></div><div className={`mb-0.5 flex items-center rounded px-1 py-1 ${selection.kind==='pod-default'&&selection.dcId===dc.id?'bg-emerald-50 text-emerald-700':'text-slate-500'}`}><span className="w-[19px] shrink-0"/><button onClick={()=>openConfiguration({kind:'pod-default',dcId:dc.id})} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-[9px]"><GitBranch size={11} className="text-slate-400"/><span className="min-w-0 flex-1 truncate">Pod Default</span><ChevronRight size={11} className="text-slate-400"/></button></div>{dc.pods.map(pod=><div key={pod.id}><div className={`grid grid-cols-[20px_minmax(0,1fr)_16px] items-center rounded px-1 py-1 ${selection.kind==='pod'&&selection.podId===pod.id&&(!editorOpen||!['l3-domains','l2-domains'].includes(editorSection))?'bg-emerald-50 text-emerald-700':'text-slate-500'}`}><button onClick={()=>toggleExpanded(pod.id)} className="p-1 text-slate-400">{expanded.has(pod.id)?<ChevronDown size={10}/>:<ChevronRight size={10}/>}</button><button onClick={()=>openConfiguration({kind:'pod',dcId:dc.id,podId:pod.id})} className="flex min-w-0 items-center gap-2 py-1 text-left text-[9px]"><GitBranch size={11} className="text-violet-500"/><span className="min-w-0 flex-1 truncate">{pod.name}</span></button><i className={`h-2 w-2 justify-self-center rounded-full ${validationDot[podValidation(pod)]}`}/></div>{expanded.has(pod.id)&&<div className="ml-5 border-l border-slate-200 pl-2">{(['L3','L2'] as LeafDomainType[]).map(domainType=>{const collectionKey=`${pod.id}-${domainType.toLowerCase()}-domains`;const typedDomains=pod.domains.filter(domain=>domain.type===domainType);return <div key={collectionKey}><div className="mb-0.5 grid grid-cols-[22px_minmax(0,1fr)_22px] items-center gap-1 rounded px-1 py-1"><button onClick={()=>toggleExpanded(collectionKey)} className="p-1 text-slate-400">{expanded.has(collectionKey)?<ChevronDown size={9}/>:<ChevronRight size={9}/>}</button><button onClick={()=>openConfiguration({kind:'pod',dcId:dc.id,podId:pod.id},`${domainType.toLowerCase()}-domains`)} className={`flex min-w-0 items-center gap-2 text-left text-[8px] font-semibold uppercase tracking-wide ${selection.kind==='pod'&&selection.podId===pod.id&&editorOpen&&editorSection===`${domainType.toLowerCase()}-domains`?'text-emerald-700':'text-slate-500'}`}><Network size={9}/><span className="truncate">{domainType} Leaf Domains</span></button><button onClick={()=>beginCreate({kind:'domain',dcId:dc.id,podId:pod.id,domainType})} title={`Create ${domainType} Leaf Domain`} className="rounded border border-emerald-100 bg-white p-1 text-emerald-600 hover:bg-emerald-50"><Plus size={9}/></button></div>{expanded.has(collectionKey)&&<div className="ml-5 border-l border-slate-200 pl-2">{typedDomains.map(domain=><button key={domain.id} onClick={()=>openConfiguration({kind:'domain',dcId:dc.id,podId:pod.id,domainId:domain.id})} className={`mb-0.5 grid w-full grid-cols-[minmax(0,1fr)_16px] items-center rounded px-1 py-1.5 text-left text-[9px] ${selection.kind==='domain'&&selection.domainId===domain.id?'bg-emerald-50 text-emerald-700':'text-slate-500 hover:bg-slate-50'}`}><span className="flex min-w-0 items-center gap-2"><Network size={9} className={`shrink-0 ${selection.kind==='domain'&&selection.domainId===domain.id?'text-emerald-600':'text-slate-400'}`}/><span className="min-w-0 flex-1 truncate">{domain.name}</span></span><i className={`h-2 w-2 justify-self-center rounded-full ${validationDot[domainValidation(domain)]}`}/></button>)}</div>}</div>})}</div>}</div>)}</div>}</div>)}</div>{!filteredTree.length&&<p className="py-8 text-center text-[9px] text-slate-400">No hierarchy objects match the search.</p>}</div>}
      </aside>
      {renderConfigurationWorkbench()}
      <section className={`${editorOpen&&editorMaximized?'hidden':'flex'} min-h-0 min-w-0 flex-col`}><div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5"><div><div className="flex items-center gap-1.5">{pathLabels.map((label,index)=><React.Fragment key={`${label}-${index}`}><span className={`rounded px-2 py-1 text-[8px] font-semibold ${index===0?'bg-blue-50 text-blue-700':index===1?'bg-violet-50 text-violet-700':'bg-emerald-50 text-emerald-700'}`}>{label}</span>{index<pathLabels.length-1&&<ChevronRight size={9} className="text-slate-300"/>}</React.Fragment>)}</div><p className="mt-1 text-[8px] text-slate-400">{graphNodes.length} {selection.kind==='devices'?'selected':'assigned'} devices · {observedLinkCount} observed links{selection.kind!=='devices'&&` · ${plannedLinkCount} planned links`}</p></div><div className="flex items-center gap-2"><span className="rounded border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[8px] font-semibold text-violet-700">{selection.kind==='devices'?'Studio Scope':'Workspace Proposed'}</span><span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[8px] font-medium text-slate-500">Inventory Links</span></div></div>
        <div className="relative min-h-0 flex-1 bg-slate-50"><TopologyCanvas nodes={graphNodes} links={graphLinks} hierarchyGroups={selection.kind==='devices'?[]:hierarchyGroups} selectedHierarchyGroupId={selection.kind==='devices'||!editorOpen?undefined:selectedGroupId} selectedNodeId={selectedDeviceId} showLinkBadges={false} fitToContainer={selection.kind!=='devices'||editorOpen} emptyMessage={selection.kind==='devices'?'No Inventory devices match the current Studio Device Selection.':'No devices are assigned to the selected hierarchy. Use Assignment in the configuration workbench.'} onHierarchyGroupClick={openHierarchyGroup} onNodeClick={node=>selectGraphDevice(node.id)} onLinkClick={link=>{setSelectedLink(link);setSelectedDeviceId(undefined)}}/></div>
        <div className="min-h-[82px] flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">{selectedDevice?<div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-semibold text-slate-800">{selectedDevice.hostname}</p><p className="mt-1 text-[8px] text-slate-500">{devicePath(selectedDevice.id)?.label} · {selectedDevice.customRole||selectedDevice.role}</p></div><div className="grid grid-cols-4 gap-6 text-right text-[8px]"><span><b className="block text-[9px] text-slate-700">{selectedDevice.managementIp}</b>Management IP</span><span><b className="block font-mono text-[9px] text-slate-700">{selectedDevice.mac}</b>System MAC</span><span><b className="block font-mono text-[9px] text-slate-700">{selectedDevice.nodeId||'—'}</b>Node ID · {selectedDevice.nodeIdSource||'Unassigned'}</span><span><b className="block text-[9px] text-slate-700">{selectedDevice.model}</b>Inventory model</span></div></div>:selectedLink?<div><p className="text-[9px] font-semibold text-slate-800">{selectedLink.relationship==='planned'?'Planned Studio link':selectedLink.relationship==='expected'?'Inventory discovery preview':'Observed Inventory link'}</p><p className="mt-1 text-[8px] text-slate-500">{selectedLink.relationship==='planned'?`Spine–Leaf adjacency defined by the current Studio hierarchy · ${selectedLink.speed}.`:selectedLink.relationship==='expected'?`Uncertain adjacency from Inventory discovery · ${selectedLink.speed}.`:`${selectedLink.sourceInterface} → ${selectedLink.targetInterface} · ${selectedLink.speed} · Read-only here; physical connection ownership remains in Inventory and Topology.`}</p></div>:<div><p className="text-[9px] font-semibold text-slate-700">Topology projection</p><p className="mt-1 text-[8px] text-slate-500">Hierarchy and assignments come from L3 Leaf-Spine Fabric. Devices and interface-to-interface links come from Inventory and Topology.</p></div>}</div>
      </section>
    </main>
    {createDraft&&<div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/35 p-6"><div className="w-[420px] rounded-xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Create {createDraft.kind==='dc'?'Data Center':createDraft.kind==='pod'?'Pod':`${createDraft.domainType} Leaf Domain`}</h2><p className="mt-1 text-[9px] text-slate-500">The new hierarchy object will be staged in {workspace} and opened for configuration.</p></div><button onClick={()=>setCreateDraft(null)} className="text-slate-400"><X size={16}/></button></div><div className="p-5"><Field label="Name" value={createDraft.name} onChange={name=>setCreateDraft(current=>current&&({...current,name}))} placeholder={createDraft.kind==='dc'?'Example: Frankfurt DC':createDraft.kind==='pod'?'Example: AI Pod 02':createDraft.domainType==='L2'?'Example: L2 Storage Leaf Domain 01':'Example: L3 GPU Leaf Domain 02'}/></div><div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4"><button onClick={()=>setCreateDraft(null)} className={buttonClass}>Cancel</button><button disabled={!createDraft.name.trim()} onClick={confirmCreate} className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-[9px] font-semibold text-white disabled:bg-slate-300"><Check size={11}/>Create</button></div></div></div>}
  </div>;
};

export default AIDCL3LeafSpineFabric;

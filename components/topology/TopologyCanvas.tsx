import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Maximize2, Network, Server, ZoomIn, ZoomOut } from 'lucide-react';

export type TopologyRole = 'Core' | 'Spine' | 'Aggregation' | 'Leaf' | 'Border' | 'Access' | 'Endpoint' | 'Unclassified';
export type TopologyNodeState = 'design' | 'mainline' | 'workspace-added' | 'workspace-modified' | 'ignored' | 'discovered' | 'conflict';
export type TopologyNodeIcon = 'network' | 'server';
export type TopologyNodeVariant = 'default' | 'device' | 'nic';
export type TopologyNode<T = unknown> = { id:string; label:string; subtitle?:string; role:TopologyRole; state:TopologyNodeState; icon?:TopologyNodeIcon; variant?:TopologyNodeVariant; ports?:string[]; data:T };
export type TopologyLinkAnnotation = { title:string; subtitle?:string };
export type TopologyLink = { id:string; source:string; target:string; sourceInterface?:string; targetInterface?:string; speed?:string; annotation?:TopologyLinkAnnotation; state:TopologyNodeState; confidence?:'High'|'Medium'|'Low'; relationship?:'inventory'|'expected'|'planned'|'mlag-peer' };
export type TopologyRegion = { id:string; label:string; nodeIds:string[]; kind:'domain'|'server' };
export type TopologyHierarchyGroup = { id:string; label:string; nodeIds:string[]; level:0|1|2; parentId?:string; validation?:'none'|'valid'|'warning'|'error'; summary?:string; layout?:'horizontal'|'vertical'; compactChildren?:boolean };
export type TopologyRolePresentation = { ranks?:Partial<Record<TopologyRole,number>>; bandLabels?:Partial<Record<TopologyRole,string>> };

type Props<T> = {
  nodes: TopologyNode<T>[];
  links: TopologyLink[];
  hierarchyGroups?: TopologyHierarchyGroup[];
  regions?: TopologyRegion[];
  rolePresentation?: TopologyRolePresentation;
  selectedHierarchyGroupId?: string;
  selectedNodeId?: string;
  selectedLinkId?: string;
  showLinkBadges?: boolean;
  showRoleBands?: boolean;
  showLegend?: boolean;
  fitToContainer?: boolean;
  vlanAccessLayout?: boolean;
  visualMode?: 'default'|'design'|'lldp'|'compare';
  emptyMessage?: string;
  topRightAccessory?: React.ReactNode;
  externalNodeDropEnabled?: boolean;
  onExternalNodeDrop?: (role:TopologyRole)=>void;
  onHierarchyGroupClick?: (group:TopologyHierarchyGroup)=>void;
  onNodeClick?: (node:TopologyNode<T>)=>void;
  onLinkClick?: (link:TopologyLink)=>void;
};
type PositionedNode<T> = TopologyNode<T> & { x:number; y:number };
const roleOrder: TopologyRole[] = ['Core','Spine','Aggregation','Leaf','Border','Access','Endpoint','Unclassified'];
const roleRank: Record<TopologyRole,number> = { Core:0, Spine:0, Aggregation:1, Leaf:1, Border:2, Access:2, Endpoint:3, Unclassified:4 };
const stateStyle: Record<TopologyNodeState,{stroke:string;fill:string;dash?:string}> = {
  design:{stroke:'#64748b',fill:'#f8fafc',dash:'6 4'},
  mainline:{stroke:'#64748b',fill:'#f8fafc'},
  'workspace-added':{stroke:'#16a34a',fill:'#f0fdf4'},
  'workspace-modified':{stroke:'#7c3aed',fill:'#f5f3ff'},
  ignored:{stroke:'#d97706',fill:'#fffbeb',dash:'6 4'},
  discovered:{stroke:'#94a3b8',fill:'#f8fafc',dash:'6 4'},
  conflict:{stroke:'#dc2626',fill:'#fef2f2'},
};
const stateLabel: Record<TopologyNodeState,string> = { design:'Design intent', mainline:'Registered / Mainline', 'workspace-added':'Workspace added', 'workspace-modified':'Workspace modified', ignored:'Ignored update', discovered:'Discovered preview', conflict:'Conflict' };
const stateDescription: Record<TopologyNodeState,string> = {
  design:'Expected device or link defined by Network Design before Workspace modification.',
  mainline:'Registered physical inventory or submitted topology evidence currently owned by Inventory and Topology.',
  'workspace-added':'Device or topology link newly staged in the selected Workspace.',
  'workspace-modified':'Existing Mainline inventory changed in the selected Workspace.',
  ignored:'Discovered Network Update marked Ignored and shown only when selected for preview.',
  discovered:'Selected Network Update preview that has not been accepted into the Workspace.',
  conflict:'Discovered peer data conflicts with an existing registered topology link.',
};

const NODE_WIDTH=120;
const NODE_HEIGHT=28;
const NODE_GAP=48;
const ROLE_BAND_HEIGHT=58;
const PORT_COLUMNS=8;
const nodeWidth=(node:TopologyNode<unknown>,vlanAccessLayout=false)=>node.variant==='device'?(vlanAccessLayout?64:56):node.variant==='nic'?(vlanAccessLayout?108:92):NODE_WIDTH;
const nodeHeight=(node:TopologyNode<unknown>,vlanAccessLayout=false)=>node.variant==='device'?(vlanAccessLayout?56:48):node.variant==='nic'?(vlanAccessLayout?48:42):node.ports?.length?Math.max(50,38+Math.ceil(node.ports.length/PORT_COLUMNS)*12):NODE_HEIGHT;
const compactRow=(nodes:TopologyNode<unknown>[])=>nodes.length>0&&nodes.every(node=>node.variant==='device'||node.variant==='nic');
const rowMetrics=(nodes:TopologyNode<unknown>[],vlanAccessLayout=false)=>{
  if(!compactRow(nodes))return{slotWidth:NODE_WIDTH,gap:NODE_GAP};
  if(!vlanAccessLayout)return{slotWidth:80,gap:nodes.length<=2?140:nodes.length<=4?120:40};
  const longestLabel=Math.min(18,Math.max(...nodes.map(node=>node.label.length)));
  const slotWidth=nodes.every(node=>node.variant==='device')?Math.max(100,longestLabel*7.4):96;
  const gap=nodes.length<=2?140:nodes.length<=4?112:32;
  return{slotWidth,gap};
};

export function layoutByRole<T>(nodes:TopologyNode<T>[], canvasWidth=1000, links:TopologyLink[]=[], canvasHeight=620, ranks:Record<TopologyRole,number>=roleRank, vlanAccessLayout=false): PositionedNode<T>[] {
  const rows = new Map<number,TopologyNode<T>[]>();
  nodes.forEach(node=>{const rank=ranks[node.role];rows.set(rank,[...(rows.get(rank)||[]),node])});
  const orderedRows=[...rows.entries()].sort(([a],[b])=>a-b);
  const compactLayout=compactRow(nodes);
  const compactStep=vlanAccessLayout?260:144;
  const availableHeight=canvasHeight-(vlanAccessLayout?120:160);
  const rowStep=orderedRows.length<=1?0:Math.min(compactLayout?compactStep:120,availableHeight/(orderedRows.length-1));
  const firstY=canvasHeight/2-((orderedRows.length-1)*rowStep)/2;
  const placed=new Map<string,PositionedNode<T>>();
  const result:PositionedNode<T>[]=[];
  const connectedX=(nodeId:string)=>{
    const values=links.flatMap(link=>link.source===nodeId&&placed.has(link.target)?[placed.get(link.target)!.x]:link.target===nodeId&&placed.has(link.source)?[placed.get(link.source)!.x]:[]);
    return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
  };
  orderedRows.forEach(([,sourceRow],rowIndex)=>{
    const row=[...sourceRow].sort((a,b)=>(connectedX(a.id)??Number.POSITIVE_INFINITY)-(connectedX(b.id)??Number.POSITIVE_INFINITY));
    const {slotWidth,gap}=rowMetrics(row,vlanAccessLayout);
    const rowWidth=row.length*slotWidth+Math.max(0,row.length-1)*gap;
    const firstX=(canvasWidth-rowWidth)/2+slotWidth/2;
    const baseXs=row.map((_,index)=>firstX+index*(slotWidth+gap));
    const aligned=row.map((node,index)=>({index,target:connectedX(node.id)})).filter(item=>item.target!==null) as {index:number;target:number}[];
    const canDirectAlign=vlanAccessLayout&&aligned.length===row.length&&new Set(aligned.map(item=>Math.round(item.target))).size===row.length;
    if(canDirectAlign){row.forEach(node=>{const positioned={...node,x:connectedX(node.id)!,y:firstY+rowIndex*rowStep};placed.set(node.id,positioned);result.push(positioned)});return}
    const desiredShift=aligned.length?aligned.reduce((sum,item)=>sum+item.target-baseXs[item.index],0)/aligned.length:0;
    const minShift=48+slotWidth/2-baseXs[0];
    const maxShift=canvasWidth-48-slotWidth/2-baseXs[baseXs.length-1];
    const shift=Math.max(minShift,Math.min(maxShift,desiredShift));
    row.forEach((node,index)=>{const positioned={...node,x:baseXs[index]+shift,y:firstY+rowIndex*rowStep};placed.set(node.id,positioned);result.push(positioned)});
  });
  if(vlanAccessLayout&&compactLayout&&orderedRows.length===2){const parentIds=new Set(orderedRows[0][1].map(node=>node.id));parentIds.forEach(parentId=>{const childPositions=links.flatMap(link=>link.source===parentId&&placed.has(link.target)?[placed.get(link.target)!]:link.target===parentId&&placed.has(link.source)?[placed.get(link.source)!]:[]);if(childPositions.length<=1)return;const parent=placed.get(parentId);if(!parent)return;const centered={...parent,x:childPositions.reduce((sum,node)=>sum+node.x,0)/childPositions.length};placed.set(parentId,centered);const resultIndex=result.findIndex(node=>node.id===parentId);if(resultIndex>=0)result[resultIndex]=centered})}
  return result;
}

function layoutByHierarchy<T>(nodes:TopologyNode<T>[], groups:TopologyHierarchyGroup[], minimumWidth:number,collapsedPodIds:Set<string>):{nodes:PositionedNode<T>[];width:number;bounds:Map<string,{x:number;y:number;width:number;height:number}>} {
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const result:PositionedNode<T>[]=[];
  const bounds=new Map<string,{x:number;y:number;width:number;height:number}>();
  const placed=new Set<string>();
  const hiddenNodeIds=new Set<string>();
  const dataCenters=groups.filter(group=>group.level===0);
  const defaultPodGap=24;
  const domainGap=16;
  let cursorX=48;
  const requiredRowWidth=(count:number,gap:number)=>count?count*NODE_WIDTH+Math.max(0,count-1)*gap:0;
  const placeRow=(ids:string[],startX:number,width:number,y:number)=>{
    const usable=ids.map(id=>byId.get(id)).filter((item):item is TopologyNode<T>=>Boolean(item&&!placed.has(item.id)&&!hiddenNodeIds.has(item.id)));
    if(!usable.length)return;
    const spacing=usable.length<=1?0:Math.min(NODE_WIDTH+28,(width-NODE_WIDTH)/(usable.length-1));
    const rowWidth=NODE_WIDTH+Math.max(0,usable.length-1)*spacing;
    const first=startX+(width-rowWidth)/2+NODE_WIDTH/2;
    usable.forEach((node,index)=>{result.push({...node,x:first+index*spacing,y});placed.add(node.id)});
  };
  dataCenters.forEach(dc=>{
    const podGap=dc.compactChildren?16:defaultPodGap;
    const dcPaddingX=dc.compactChildren?14:24;
    const dcPaddingTop=dc.compactChildren?32:44;
    const dcPaddingBottom=dc.compactChildren?18:28;
    const pods=groups.filter(group=>group.level===1&&group.parentId===dc.id);
    const podSpecs=pods.map(pod=>{
      const domains=groups.filter(group=>group.level===2&&group.parentId===pod.id);
      const domainIds=new Set(domains.flatMap(domain=>domain.nodeIds));
      const spineIds=pod.nodeIds.filter(id=>!domainIds.has(id));
      const collapsed=collapsedPodIds.has(pod.id);
      const verticalDomains=pod.layout==='vertical';
      const domainWidths=domains.map(domain=>Math.max(178,requiredRowWidth(domain.nodeIds.length,28)+28));
      const domainsWidth=verticalDomains?Math.max(0,...domainWidths):domainWidths.reduce((sum,width)=>sum+width,0)+Math.max(0,domainWidths.length-1)*domainGap;
      const spineWidth=requiredRowWidth(spineIds.length,28);
      const expandedHeight=verticalDomains?Math.max(338,198+domains.length*(122+domainGap)):310;
      return{pod,domains,domainIds,spineIds,domainWidths,verticalDomains,collapsed,width:collapsed?156:Math.max(320,domainsWidth+36,spineWidth+36),height:collapsed?118:expandedHeight};
    });
    const contentWidth=podSpecs.reduce((sum,item)=>sum+item.width,0)+Math.max(0,podSpecs.length-1)*podGap;
    const dcWidth=Math.max(382,contentWidth+dcPaddingX*2);
    const dcHeight=dcPaddingTop+Math.max(84,...podSpecs.map(item=>item.height))+dcPaddingBottom;
    const dcX=cursorX;
    const dcY=52;
    bounds.set(dc.id,{x:dcX,y:dcY,width:dcWidth,height:dcHeight});
    let podX=dcX+(dcWidth-contentWidth)/2;
    const podY=dcY+dcPaddingTop;
    podSpecs.forEach(spec=>{
      bounds.set(spec.pod.id,{x:podX,y:podY,width:spec.width,height:spec.height});
      if(spec.collapsed){
        spec.pod.nodeIds.forEach(id=>hiddenNodeIds.add(id));
        podX+=spec.width+podGap;
        return;
      }
      const innerX=podX+18;
      const innerWidth=spec.width-36;
      placeRow(spec.spineIds,innerX,innerWidth,podY+(spec.verticalDomains?64:88));
      const domainsWidth=spec.verticalDomains?Math.max(0,...spec.domainWidths):spec.domainWidths.reduce((sum,width)=>sum+width,0)+Math.max(0,spec.domainWidths.length-1)*domainGap;
      let domainX=podX+(spec.width-domainsWidth)/2;
      spec.domains.forEach((domain,index)=>{
        const domainWidth=spec.domainWidths[index];
        const domainY=podY+(spec.verticalDomains?178:150)+(spec.verticalDomains?index*(122+domainGap):0);
        const currentDomainX=spec.verticalDomains?podX+(spec.width-domainWidth)/2:domainX;
        bounds.set(domain.id,{x:currentDomainX,y:domainY,width:domainWidth,height:122});
        placeRow(domain.nodeIds,currentDomainX,domainWidth,domainY+64);
        if(!spec.verticalDomains)domainX+=domainWidth+domainGap;
      });
      const ungrouped=spec.pod.nodeIds.filter(id=>!spec.spineIds.includes(id)&&!spec.domainIds.has(id));
      placeRow(ungrouped,innerX,innerWidth,podY+spec.height-48);
      podX+=spec.width+podGap;
    });
    cursorX+=dcWidth+32;
  });
  const remaining=nodes.filter(node=>!placed.has(node.id)&&!hiddenNodeIds.has(node.id));
  if(remaining.length){
    const width=Math.max(320,requiredRowWidth(remaining.length,28)+36);
    placeRow(remaining.map(node=>node.id),cursorX,width,260);
    cursorX+=width+32;
  }
  return{nodes:result,width:Math.max(minimumWidth,cursorX),bounds};
}

const TopologyCanvas = <T,>({nodes,links,hierarchyGroups=[],regions=[],rolePresentation,selectedHierarchyGroupId,selectedNodeId,selectedLinkId,showLinkBadges=true,showRoleBands=true,showLegend=true,fitToContainer=false,vlanAccessLayout=false,visualMode='default',emptyMessage='No registered topology to display.',topRightAccessory,externalNodeDropEnabled=false,onExternalNodeDrop,onHierarchyGroupClick,onNodeClick,onLinkClick}:Props<T>) => {
  const effectiveRoleRank=useMemo<Record<TopologyRole,number>>(()=>({...roleRank,...rolePresentation?.ranks}),[rolePresentation]);
  const roleBandLabels=rolePresentation?.bandLabels;
  const containerRef=useRef<HTMLDivElement>(null);
  const [externalDragOver,setExternalDragOver]=useState(false);
  const topologyRoleMime='application/x-ampcon-topology-role';
  const handleExternalDragOver=(event:React.DragEvent<HTMLDivElement>)=>{
    if(!externalNodeDropEnabled||!event.dataTransfer.types.includes(topologyRoleMime))return;
    event.preventDefault();event.dataTransfer.dropEffect='copy';setExternalDragOver(true);
  };
  const handleExternalDragLeave=(event:React.DragEvent<HTMLDivElement>)=>{
    if(!event.currentTarget.contains(event.relatedTarget as Node|null))setExternalDragOver(false);
  };
  const handleExternalDrop=(event:React.DragEvent<HTMLDivElement>)=>{
    if(!externalNodeDropEnabled)return;
    const role=event.dataTransfer.getData(topologyRoleMime) as TopologyRole;
    setExternalDragOver(false);
    if(!roleOrder.includes(role))return;
    event.preventDefault();onExternalNodeDrop?.(role);
  };
  const [zoom,setZoom] = useState(1);
  useEffect(()=>{if(fitToContainer)setZoom(1)},[fitToContainer]);
  const [showPortLabels,setShowPortLabels] = useState(false);
  const [hoveredLink,setHoveredLink] = useState<TopologyLink|null>(null);
  const hasPortData=useMemo(()=>links.some(link=>Boolean(link.sourceInterface||link.targetInterface)),[links]);
  const availableStates=useMemo(()=>(Object.keys(stateLabel) as TopologyNodeState[]).filter(state=>nodes.some(node=>node.state===state)||links.some(link=>link.state===state)),[links,nodes]);
  const [focusedState,setFocusedState]=useState<TopologyNodeState|null>(null);
  useEffect(()=>{if(focusedState&&!availableStates.includes(focusedState))setFocusedState(null)},[availableStates,focusedState]);
  const hierarchyMode=hierarchyGroups.length>0;
  const podIdsByDc=useMemo(()=>Object.fromEntries(hierarchyGroups.filter(group=>group.level===0).map(dc=>[dc.id,hierarchyGroups.filter(group=>group.level===1&&group.parentId===dc.id).map(group=>group.id)])) as Record<string,string[]>,[hierarchyGroups]);
  const [expandedPodIdsByDc,setExpandedPodIdsByDc]=useState<Record<string,string[]>>(()=>Object.fromEntries(Object.entries(podIdsByDc).map(([dcId,ids])=>[dcId,ids.slice(0,2)])));
  useEffect(()=>{
    setExpandedPodIdsByDc(current=>Object.fromEntries(Object.entries(podIdsByDc).map(([dcId,ids])=>{
      const next=(current[dcId]||[]).filter(id=>ids.includes(id)).slice(-2);
      const targetCount=Math.min(2,ids.length);
      for(const id of ids){if(next.length>=targetCount)break;if(!next.includes(id))next.push(id)}
      return[dcId,next];
    })));
  },[podIdsByDc]);
  const collapsedPodIds=useMemo(()=>new Set(Object.entries(podIdsByDc).flatMap(([dcId,ids])=>ids.filter(id=>!(expandedPodIdsByDc[dcId]||[]).includes(id)))),[podIdsByDc,expandedPodIdsByDc]);
  const expandCollapsedPod=(podId:string)=>{
    const dcId=hierarchyGroups.find(group=>group.id===podId&&group.level===1)?.parentId;
    if(!dcId)return;
    const podIds=podIdsByDc[dcId]||[];
    setExpandedPodIdsByDc(current=>{
      const expanded=(current[dcId]||[]).filter(id=>podIds.includes(id));
      return expanded.includes(podId)?current:{...current,[dcId]:[...expanded,podId].slice(-2)};
    });
  };
  const viewHeight=620;
  const [canvasWidth,setCanvasWidth]=useState(1000);
  useEffect(()=>{const container=containerRef.current;if(!container)return;const update=()=>{const {width,height}=container.getBoundingClientRect();if(width>0&&height>0)setCanvasWidth(Math.max(1000,(viewHeight*width)/height))};update();const observer=new ResizeObserver(update);observer.observe(container);return()=>observer.disconnect()},[viewHeight]);
  const roleLayoutWidth=useMemo(()=>{const rows=new Map<number,TopologyNode<T>[]>();nodes.forEach(node=>rows.set(effectiveRoleRank[node.role],[...(rows.get(effectiveRoleRank[node.role])||[]),node]));const required=Math.max(1,...[...rows.values()].map(row=>{const {slotWidth,gap}=rowMetrics(row,vlanAccessLayout);return row.length*slotWidth+Math.max(0,row.length-1)*gap+120}));return Math.max(canvasWidth,required)},[nodes,canvasWidth,effectiveRoleRank,vlanAccessLayout]);
  const hierarchyLayout=useMemo(()=>hierarchyMode?layoutByHierarchy(nodes,hierarchyGroups,canvasWidth,collapsedPodIds):null,[hierarchyMode,nodes,hierarchyGroups,canvasWidth,collapsedPodIds]);
  const layoutWidth=hierarchyLayout?.width||roleLayoutWidth;
  const positioned=useMemo(()=>hierarchyLayout?.nodes||layoutByRole(nodes,layoutWidth,links,viewHeight,effectiveRoleRank,vlanAccessLayout),[hierarchyLayout,nodes,layoutWidth,links,viewHeight,effectiveRoleRank,vlanAccessLayout]);
  const positions=useMemo(()=>new Map(positioned.map(node=>[node.id,node])),[positioned]);
  const regionBounds=useMemo(()=>regions.flatMap(region=>{
    const members=region.nodeIds.map(id=>positions.get(id)).filter(Boolean) as PositionedNode<T>[];
    if(!members.length)return[];
    const paddingX=region.kind==='domain'?42:26;
    const paddingTop=region.kind==='domain'?50:24;
    const paddingBottom=region.kind==='domain'?52:34;
    const minX=Math.min(...members.map(node=>node.x-nodeWidth(node,vlanAccessLayout)/2))-paddingX;
    const maxX=Math.max(...members.map(node=>node.x+nodeWidth(node,vlanAccessLayout)/2))+paddingX;
    const minY=Math.min(...members.map(node=>node.y-nodeHeight(node,vlanAccessLayout)/2))-paddingTop;
    const maxY=Math.max(...members.map(node=>node.y+nodeHeight(node,vlanAccessLayout)/2))+paddingBottom;
    return[{region,x:Math.max(18,minX),y:Math.max(18,minY),width:Math.min(layoutWidth-18,maxX)-Math.max(18,minX),height:Math.min(viewHeight-18,maxY)-Math.max(18,minY)}];
  }).sort((a,b)=>a.region.kind==='domain'?-1:b.region.kind==='domain'?1:0),[regions,positions,layoutWidth,viewHeight,vlanAccessLayout]);
  const incidentLinkIds=useMemo(()=>{
    const result=new Map<string,{id:string;port?:string}[]>();
    const add=(nodeId:string,id:string,port?:string)=>result.set(nodeId,[...(result.get(nodeId)||[]),{id,port}]);
    links.forEach(link=>{add(link.source,link.id,link.sourceInterface);add(link.target,link.id,link.targetInterface)});
    const portOrder=(value:string|undefined)=>{const match=value?.match(/(\d+)(?!.*\d)/);return match?Number(match[1]):Number.MAX_SAFE_INTEGER};
    return new Map([...result].map(([nodeId,items])=>[nodeId,items.sort((a,b)=>portOrder(a.port)-portOrder(b.port)||(a.port||'').localeCompare(b.port||'')).map(item=>item.id)]));
  },[links]);
  const getPortPlacement=(endpoint:PositionedNode<T>,other:PositionedNode<T>,linkId:string)=>{
    const ids=incidentLinkIds.get(endpoint.id)||[];
    const index=Math.max(0,ids.indexOf(linkId));
    const dx=other.x-endpoint.x;
    const dy=other.y-endpoint.y;
    const height=nodeHeight(endpoint,vlanAccessLayout);
    const vertical=effectiveRoleRank[endpoint.role]!==effectiveRoleRank[other.role]||Math.abs(dy)>height;
    if(vertical){
      const usableWidth=Math.max(12,nodeWidth(endpoint,vlanAccessLayout)-8);
      const x=ids.length<=1?endpoint.x:endpoint.x-usableWidth/2+(usableWidth*index)/(ids.length-1);
      const direction=Math.sign(dy)||1;
      const edgeY=endpoint.y+direction*height/2;
      return{anchorX:x,anchorY:edgeY,labelX:x,labelY:edgeY+direction*(9+(index%3)*8)+2.5};
    }
    const capacity=Math.max(2,Math.floor((height-8)/12));
    const row=Math.floor(index/capacity);
    const positionInColumn=index%capacity;
    const countInColumn=Math.min(capacity,Math.max(1,ids.length-row*capacity));
    const spacing=Math.min(12,(height-8)/Math.max(1,countInColumn-1));
    const y=endpoint.y+(positionInColumn-(countInColumn-1)/2)*spacing;
    const direction=Math.sign(dx)||1;
    const edgeX=endpoint.x+direction*nodeWidth(endpoint,vlanAccessLayout)/2;
    return{anchorX:edgeX,anchorY:y,labelX:edgeX+direction*(17+row*24),labelY:y+2.5};
  };
  const roleBands=useMemo(()=>{
    const makeBand=(key:string,row:PositionedNode<T>[],containerId?:string)=>{
      const rank=effectiveRoleRank[row[0].role];
      const container=containerId?hierarchyLayout?.bounds.get(containerId):undefined;
      const rawX=Math.min(...row.map(node=>node.x-NODE_WIDTH/2))-12;
      const rawMaxX=Math.max(...row.map(node=>node.x+NODE_WIDTH/2))+12;
      const x=container?Math.max(container.x+8,rawX):Math.max(24,rawX);
      const maxX=container?Math.min(container.x+container.width-8,rawMaxX):Math.min(layoutWidth-24,rawMaxX);
      const roles=roleOrder.filter(role=>row.some(node=>node.role===role)).map(role=>roleBandLabels?.[role]||role).join(' / ');
      const height=Math.max(ROLE_BAND_HEIGHT,...row.map(node=>nodeHeight(node,vlanAccessLayout)+28));
      return{key,rank,y:row[0].y,x,width:Math.max(80,maxX-x),height,roles};
    };
    const bandsFor=(key:string,members:PositionedNode<T>[],containerId:string)=>{
      const ranks=[...new Set(members.map(node=>effectiveRoleRank[node.role]))].sort((a,b)=>a-b);
      return ranks.map(rank=>makeBand(`${key}-${rank}`,members.filter(node=>effectiveRoleRank[node.role]===rank),containerId));
    };
    if(hierarchyMode)return hierarchyGroups.filter(group=>group.level===1).flatMap(pod=>{
      const domains=hierarchyGroups.filter(group=>group.level===2&&group.parentId===pod.id);
      const domainNodeIds=new Set(domains.flatMap(domain=>domain.nodeIds));
      const podMembers=pod.nodeIds.filter(id=>!domainNodeIds.has(id)).map(id=>positions.get(id)).filter(Boolean) as PositionedNode<T>[];
      return[
        ...bandsFor(pod.id,podMembers,pod.id),
        ...domains.flatMap(domain=>bandsFor(domain.id,domain.nodeIds.map(id=>positions.get(id)).filter(Boolean) as PositionedNode<T>[],domain.id)),
      ];
    });
    const ranks=[...new Set(positioned.map(node=>effectiveRoleRank[node.role]))].sort((a,b)=>a-b);
    return ranks.map(rank=>makeBand(String(rank),positioned.filter(node=>effectiveRoleRank[node.role]===rank)));
  },[positioned,positions,layoutWidth,hierarchyMode,hierarchyGroups,hierarchyLayout,effectiveRoleRank,roleBandLabels,vlanAccessLayout]);
  const visibleHierarchyGroups=useMemo(()=>hierarchyGroups.filter(group=>group.level!==2||!group.parentId||!collapsedPodIds.has(group.parentId)),[hierarchyGroups,collapsedPodIds]);
  const hierarchyBounds=useMemo(()=>visibleHierarchyGroups.flatMap(group=>{
    const fixed=hierarchyLayout?.bounds.get(group.id);if(fixed)return[{group,...fixed}];
    const members=group.nodeIds.map(id=>positions.get(id)).filter(Boolean) as PositionedNode<T>[];
    if(!members.length)return[];
    const padding=[44,30,18][group.level];
    const minX=Math.min(...members.map(node=>node.x-NODE_WIDTH/2))-padding;
    const maxX=Math.max(...members.map(node=>node.x+NODE_WIDTH/2))+padding;
    const minY=Math.min(...members.map(node=>node.y-NODE_HEIGHT/2))-padding;
    const maxY=Math.max(...members.map(node=>node.y+NODE_HEIGHT/2))+padding;
    const x=Math.max(12,minX);const y=Math.max(18,minY);
    return[{group,x,y,width:Math.max(100,Math.min(layoutWidth-24,maxX)-x),height:Math.max(60,Math.min(viewHeight-16,maxY)-y)}];
  }).sort((a,b)=>a.group.level-b.group.level),[visibleHierarchyGroups,positions,layoutWidth,viewHeight,hierarchyLayout]);
  const fittedViewBox=useMemo(()=>{
    if(!fitToContainer)return `0 0 ${layoutWidth} ${viewHeight}`;
    const outerRegions=regionBounds.filter(item=>item.region.kind==='domain');
    const outerHierarchy=hierarchyBounds.filter(item=>item.group.level===0);
    const bounds=outerRegions.length?outerRegions:outerHierarchy.length?outerHierarchy:regionBounds.length?regionBounds:hierarchyMode?hierarchyBounds:[];
    if(!bounds.length)return `0 0 ${layoutWidth} ${viewHeight}`;
    const minX=Math.min(...bounds.map(item=>item.x));
    const minY=Math.min(...bounds.map(item=>item.y));
    const maxX=Math.max(...bounds.map(item=>item.x+item.width));
    const maxY=Math.max(...bounds.map(item=>item.y+item.height));
    const contentWidth=maxX-minX;
    const contentHeight=maxY-minY;
    const paddingX=vlanAccessLayout?Math.max(36,contentWidth*0.03):Math.max(56,contentWidth*0.05);
    const paddingY=vlanAccessLayout?Math.max(56,contentHeight*0.14):Math.max(72,contentHeight*0.18);
    const naturalWidth=contentWidth+paddingX*2;
    const fittedWidth=regionBounds.length?Math.max(vlanAccessLayout?800:960,naturalWidth):naturalWidth;
    const horizontalPadding=(fittedWidth-contentWidth)/2;
    return `${minX-horizontalPadding} ${minY-paddingY} ${fittedWidth} ${contentHeight+paddingY*2}`;
  },[fitToContainer,hierarchyMode,hierarchyBounds,regionBounds,layoutWidth,viewHeight,vlanAccessLayout]);
  const compactPortLabel=(value:string|undefined)=>value?.replace(/^Ethernet/i,'Et').replace(/^Management/i,'Mgmt')||'Port not reported';
  const hoveredLinkText=hoveredLink?(()=>{
    const sourceLabel=positions.get(hoveredLink.source)?.label||hoveredLink.source;
    const targetLabel=positions.get(hoveredLink.target)?.label||hoveredLink.target;
    const hasPhysicalEndpoint=Boolean(hoveredLink.sourceInterface||hoveredLink.targetInterface);
    const endpoints=hasPhysicalEndpoint?`${sourceLabel} ${compactPortLabel(hoveredLink.sourceInterface)} ↔ ${targetLabel} ${compactPortLabel(hoveredLink.targetInterface)}`:`${sourceLabel} ↔ ${targetLabel}`;
    if(vlanAccessLayout)return `${sourceLabel}${hoveredLink.sourceInterface?` ${compactPortLabel(hoveredLink.sourceInterface)}`:''} ↔ ${targetLabel}`;
    const meaning=visualMode==='compare'?(hoveredLink.state==='conflict'?(hoveredLink.relationship==='planned'?'Design relationship missing from LLDP':'Unexpected LLDP link'):'Design and LLDP matched'):visualMode==='design'?'Expected logical relationship':visualMode==='lldp'?'LLDP observed':stateLabel[hoveredLink.state];
    return `${endpoints}${hoveredLink.speed?` · ${hoveredLink.speed}`:''} · ${meaning}`;
  })():'';
  if(!nodes.length) return <div className="flex h-full min-h-0 items-center justify-center bg-slate-50 text-[11px] text-slate-400">{emptyMessage}</div>;
  return <div ref={containerRef} onDragOver={handleExternalDragOver} onDragLeave={handleExternalDragLeave} onDrop={handleExternalDrop} className={`relative h-full min-h-0 w-full overflow-hidden bg-[radial-gradient(#dbe3ee_0.7px,transparent_0.7px)] [background-size:16px_16px] ${externalDragOver?'ring-2 ring-inset ring-blue-500':''}`}>
    {externalDragOver&&<div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/85"><div className="rounded-lg border border-blue-200 bg-white px-5 py-3 text-center shadow-lg"><b className="block text-[10px] text-blue-800">Release to add planned device</b><span className="mt-1 block text-[8px] text-blue-600">The node will be placed automatically in its design role.</span></div></div>}
    <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
      {topRightAccessory&&<div className="flex-shrink-0">{topRightAccessory}</div>}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <button title="Zoom in" onClick={()=>setZoom(value=>Math.min(1.6,value+0.1))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ZoomIn size={13}/></button>
        <button title="Zoom out" onClick={()=>setZoom(value=>Math.max(0.6,value-0.1))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ZoomOut size={13}/></button>
        <button title="Fit view" onClick={()=>setZoom(1)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Maximize2 size={13}/></button>
        {hasPortData&&<><span className="mx-0.5 h-5 w-px bg-slate-200"/>
        <button
          type="button"
          title={showPortLabels?'Hide all ports':'View all ports'}
          aria-label={showPortLabels?'Hide all ports':'View all ports'}
          aria-pressed={showPortLabels}
          onClick={()=>setShowPortLabels(value=>!value)}
          className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[9px] font-medium transition-colors ${showPortLabels?'bg-blue-50 text-blue-700':'text-slate-500 hover:bg-slate-100'}`}
        >
          {showPortLabels?<Eye size={13}/>:<EyeOff size={13}/>}<span>{showPortLabels?'Hide ports':'View ports'}</span>
        </button></>}
      </div>
    </div>
    {hoveredLink&&<div className="absolute left-1/2 top-3 z-20 max-w-[calc(100%-15rem)] -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-[9px] text-white shadow-xl">
      {hoveredLinkText}
    </div>}
    <div className={`absolute inset-0 transition-transform ${fitToContainer?'overflow-hidden':'overflow-auto'}`} style={{transform:`scale(${zoom})`,transformOrigin:'center'}}>
      <svg viewBox={fittedViewBox} preserveAspectRatio="xMidYMid meet" className={fitToContainer?'h-full w-full':'h-full'} style={fitToContainer?undefined:{width:`${layoutWidth}px`,minWidth:'100%'}} role="img" aria-label="Registered device topology">
        {regionBounds.map(({region,x,y,width,height})=>{const server=region.kind==='server';const labelWidth=Math.min(180,Math.max(104,region.label.length*7+30));return <g key={region.id} className="pointer-events-none"><rect x={x} y={y} width={Math.max(100,width)} height={Math.max(60,height)} rx={server?5:11} fill={server?'#f8fafc':'#ffffff66'} stroke="#e2e8f0" strokeWidth="1.1"/>{server?<text x={x+width/2} y={y+height-11} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">{region.label}</text>:<><rect x={x+16} y={y-12} width={labelWidth} height="24" rx="12" fill="#f8fafc" stroke="#e2e8f0"/><text x={x+29} y={y+4} fontSize="10.6" fontWeight="600" fill="#64748b">{region.label}</text></>}</g>})}
        {hierarchyBounds.map(({group,x,y,width,height})=>{
          const collapsed=group.level===1&&collapsedPodIds.has(group.id);
          const selected=group.id===selectedHierarchyGroupId;
          const regionStyle=selected?{stroke:'#2563eb',fill:'#eff6ff',text:'#1d4ed8'}:{stroke:'#cbd5e1',fill:'#f8fafc',text:'#64748b'};
          const labelWidth=Math.min(Math.max(68,group.label.length*5.2+28),Math.max(68,width-20));
          const maxLabelChars=Math.max(6,Math.floor((labelWidth-28)/5.2));
          const displayLabel=group.label.length>maxLabelChars?`${group.label.slice(0,maxLabelChars-1)}…`:group.label;
          const domainCount=collapsed?hierarchyGroups.filter(item=>item.level===2&&item.parentId===group.id).length:0;
          const groupInteractive=Boolean(onHierarchyGroupClick)||collapsed;
          return <g key={group.id} role={groupInteractive?'button':undefined} tabIndex={groupInteractive?0:undefined} aria-label={collapsed?`${group.label}, collapsed, double-click to expand`:group.label} className={`${collapsed?'cursor-zoom-in':onHierarchyGroupClick?'cursor-pointer':'cursor-default'} outline-none`} onClick={()=>{if(!collapsed)onHierarchyGroupClick?.(group)}} onDoubleClick={event=>{if(collapsed){event.stopPropagation();expandCollapsedPod(group.id)}}} onKeyDown={event=>{if(groupInteractive&&(event.key==='Enter'||event.key===' ')){collapsed?expandCollapsedPod(group.id):onHierarchyGroupClick?.(group)}}}>
          <rect x={x} y={y} width={Math.max(80,width)} height={Math.max(54,height)} rx={12-group.level*2} fill={regionStyle.fill} fillOpacity={selected?0.42:group.level===2?0.22:0.14} stroke={regionStyle.stroke} strokeWidth={selected?2.5:1.25}/>
          <rect x={x+10} y={y-8} width={labelWidth} height="16" rx="8" fill="white" stroke={regionStyle.stroke}/>
          <circle cx={x+19} cy={y} r="3" fill={regionStyle.stroke}/><text x={x+26} y={y+3} fontSize="7.2" fontWeight="600" fill={regionStyle.text}>{displayLabel}</text>
          {collapsed&&<><text x={x+width/2} y={y+48} textAnchor="middle" fontSize="7.2" fontWeight="600" fill="#475569">{group.summary||`${group.nodeIds.length} devices · ${domainCount} domains`}</text><text x={x+width/2} y={y+68} textAnchor="middle" fontSize="6.8" fill="#64748b">Double-click to expand</text></>}
        </g>})}
        {showRoleBands&&roleBands.map(band=>hierarchyMode?<g key={band.key} className="pointer-events-none">
          <rect x={band.x} y={band.y-band.height/2} width={band.width} height={band.height} rx="8" fill="#ffffffa8" stroke="#e2e8f0"/>
          <text x={band.x+10} y={band.y-band.height/2+15} fontSize="7.2" fontWeight="600" fill="#64748b">{band.roles}</text>
        </g>:<g key={band.rank}>
          <rect x="48" y={band.y-band.height/2} width={layoutWidth-96} height={band.height} rx="8" fill="#ffffffb8" stroke="#e2e8f0"/>
          <text x="62" y={band.y-band.height/2+15} fontSize="7.2" fontWeight="600" fill="#64748b">{band.roles}</text>
        </g>)}
        {links.map(link=>{
          const source=positions.get(link.source);
          const target=positions.get(link.target);
          if(!source||!target)return null;
          const style=stateStyle[link.state];
          const expected=link.relationship==='expected';
          const planned=link.relationship==='planned';
          const mlagPeer=link.relationship==='mlag-peer';
          const designVisual=visualMode==='design';
          const annotated=Boolean(link.annotation);
          const compareConflict=visualMode==='compare'&&link.state==='conflict';
          const selected=link.id===selectedLinkId;
          const linkStroke=selected?'#2563eb':annotated?'#cbd5e1':designVisual?style.stroke:compareConflict?'#dc2626':hierarchyMode?'#64748b':expected?'#2563eb':planned||mlagPeer?'#64748b':style.stroke;
          const linkDash=mlagPeer?'6 4':annotated?undefined:designVisual?'7 5':compareConflict&&planned?'7 5':expected?'7 5':planned?undefined:style.dash;
          const linkOpacity=selected?1:annotated?1:compareConflict?0.95:designVisual?0.78:hierarchyMode?0.58:expected?0.62:planned||mlagPeer?0.58:0.82;
          const sourcePort=getPortPlacement(source,target,link.id);
          const targetPort=getPortPlacement(target,source,link.id);
          const sourceLineX=sourcePort.anchorX;
          const sourceLineY=sourcePort.anchorY;
          const targetLineX=targetPort.anchorX;
          const targetLineY=targetPort.anchorY;
          const lineLength=Math.hypot(targetLineX-sourceLineX,targetLineY-sourceLineY)||1;
          const parallelOffsetX=-(targetLineY-sourceLineY)/lineLength*3;
          const parallelOffsetY=(targetLineX-sourceLineX)/lineLength*3;
          const sourceDegree=links.filter(candidate=>candidate.relationship==='planned'&&(candidate.source===link.source||candidate.target===link.source)).length;
          const targetDegree=links.filter(candidate=>candidate.relationship==='planned'&&(candidate.source===link.target||candidate.target===link.target)).length;
          const useFanoutCurve=vlanAccessLayout&&designVisual&&planned&&!mlagPeer&&(sourceDegree>1||targetDegree>1);
          const verticalDelta=targetLineY-sourceLineY;
          const horizontalDelta=targetLineX-sourceLineX;
          const curveSourceX=useFanoutCurve&&sourceDegree>1?source.x+(sourceLineX-source.x)*0.4:sourceLineX;
          const curveTargetX=useFanoutCurve&&targetDegree>1?target.x:targetLineX;
          const annotationX=useFanoutCurve?curveTargetX:(sourceLineX+targetLineX)/2;
          const accessPlannedLayout=vlanAccessLayout&&designVisual&&planned;
          const annotationY=accessPlannedLayout?sourceLineY+verticalDelta*0.64:(sourceLineY+targetLineY)/2;
          const annotationHalfWidth=vlanAccessLayout?54:47;
          const annotationInnerWidth=annotationHalfWidth-6;
          const splitAtAnnotation=useFanoutCurve&&Boolean(link.annotation?.subtitle);
          const curveEndY=splitAtAnnotation?annotationY-22:targetLineY;
          const curveDelta=curveEndY-sourceLineY;
          const curveSourceControlX=curveSourceX+(curveTargetX-curveSourceX)*0.34;
          const curveSourceControlY=sourceLineY+curveDelta*0.1;
          const curveTargetControlY=curveEndY-curveDelta*0.42;
          const lowerConnector=splitAtAnnotation?` M ${curveTargetX} ${annotationY+22} L ${targetLineX} ${targetLineY}`:'';
          const curvePath=`M ${curveSourceX} ${sourceLineY} C ${curveSourceControlX} ${curveSourceControlY}, ${curveTargetX} ${curveTargetControlY}, ${curveTargetX} ${curveEndY}${lowerConnector}`;
          return <g key={link.id} className={`${onLinkClick?'cursor-pointer':'cursor-default'} transition-opacity`} opacity={focusedState&&link.state!==focusedState?0.12:1} onMouseEnter={()=>setHoveredLink(link)} onMouseLeave={()=>setHoveredLink(null)} onClick={()=>onLinkClick?.(link)}>
          {mlagPeer?<><line x1={sourceLineX+parallelOffsetX} y1={sourceLineY+parallelOffsetY} x2={targetLineX+parallelOffsetX} y2={targetLineY+parallelOffsetY} stroke={linkStroke} strokeWidth={selected?2.4:1.5} strokeDasharray={linkDash} opacity={linkOpacity}/><line x1={sourceLineX-parallelOffsetX} y1={sourceLineY-parallelOffsetY} x2={targetLineX-parallelOffsetX} y2={targetLineY-parallelOffsetY} stroke={linkStroke} strokeWidth={selected?2.4:1.5} strokeDasharray={linkDash} opacity={linkOpacity}/></>:useFanoutCurve?<path d={curvePath} fill="none" stroke={linkStroke} strokeWidth={selected?3:planned?1.5:2.2} strokeDasharray={linkDash} strokeLinecap="round" opacity={linkOpacity}/>:<line x1={sourceLineX} y1={sourceLineY} x2={targetLineX} y2={targetLineY} stroke={linkStroke} strokeWidth={selected?3:hierarchyMode?1.6:expected?1.7:planned?1.5:2.2} strokeDasharray={linkDash} opacity={linkOpacity}/>}
          {useFanoutCurve?<path d={curvePath} fill="none" stroke="transparent" strokeWidth="16"/>:<line x1={sourceLineX} y1={sourceLineY} x2={targetLineX} y2={targetLineY} stroke="transparent" strokeWidth="16"/>}
          {showLinkBadges&&link.annotation?<g className="pointer-events-none"><title>{link.annotation.subtitle?`${link.annotation.title} · ${link.annotation.subtitle}`:link.annotation.title}</title>{link.annotation.subtitle?<><rect x={annotationX-annotationHalfWidth} y={annotationY-21} width={annotationHalfWidth*2} height="42" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2"/><path d={`M ${annotationX-annotationInnerWidth} ${annotationY-21} H ${annotationX+annotationInnerWidth} Q ${annotationX+annotationHalfWidth} ${annotationY-21} ${annotationX+annotationHalfWidth} ${annotationY-15} V ${annotationY-1} H ${annotationX-annotationHalfWidth} V ${annotationY-15} Q ${annotationX-annotationHalfWidth} ${annotationY-21} ${annotationX-annotationInnerWidth} ${annotationY-21} Z`} fill="#edf7f6"/><line x1={annotationX-annotationHalfWidth} y1={annotationY} x2={annotationX+annotationHalfWidth} y2={annotationY} stroke="#dbe7e6" strokeWidth="1"/><text x={annotationX} y={annotationY-8} textAnchor="middle" fontSize={vlanAccessLayout?'11.4':'10.4'} fontWeight="700" fill="#06706d">{link.annotation.title.length>12?`${link.annotation.title.slice(0,11)}…`:link.annotation.title}</text><text x={annotationX} y={annotationY+14} textAnchor="middle" fontSize={vlanAccessLayout?'10':'9.2'} fontWeight="600" fill="#475569">{link.annotation.subtitle.length>18?`${link.annotation.subtitle.slice(0,17)}…`:link.annotation.subtitle}</text></>:<><rect x={annotationX-26} y={annotationY-13} width="52" height="26" rx="4" fill="#f8fafc" stroke="#cbd5e1"/><text x={annotationX} y={annotationY+4} textAnchor="middle" fontSize={vlanAccessLayout?'11.4':'10.4'} fontWeight="600" fill="#475569">{link.annotation.title}</text></>}</g>:showLinkBadges&&link.speed&&<><rect x={annotationX-23} y={annotationY-8} width="46" height="15" rx="7" fill="white" stroke="#e2e8f0"/>
          <text x={annotationX} y={annotationY+3} textAnchor="middle" fontSize="6.8" fill="#64748b">{link.speed}</text></>}
        </g>})}
        {links.map(link=>{
          const source=positions.get(link.source);
          const target=positions.get(link.target);
          const revealPortLabels=showPortLabels||hoveredLink?.id===link.id;
          if(!source||!target||!revealPortLabels||(!link.sourceInterface&&!link.targetInterface))return null;
          const sourcePort=getPortPlacement(source,target,link.id);
          const targetPort=getPortPlacement(target,source,link.id);
          const sourcePortCount=incidentLinkIds.get(source.id)?.length||1;
          const vlanPortLabelOffset=sourcePortCount<=1?35:sourcePortCount<=4?37:39;
          const vlanAnnotationY=sourcePort.anchorY+(targetPort.anchorY-sourcePort.anchorY)*0.64;
          const vlanSourcePort=vlanAccessLayout&&link.relationship==='planned'?{...sourcePort,labelX:targetPort.anchorX,labelY:vlanAnnotationY-vlanPortLabelOffset}:sourcePort;
          const compareConflict=visualMode==='compare'&&link.state==='conflict';
          const renderPortLabel=(label:string|undefined,endpoint:PositionedNode<T>,placement:ReturnType<typeof getPortPlacement>,side:'source'|'target')=>{
            if(!label)return null;
            return <text key={`${link.id}-${side}`} x={placement.labelX} y={placement.labelY} textAnchor="middle" fontSize={vlanAccessLayout?'9':'6.5'} fontWeight={vlanAccessLayout?'500':'600'} fill={compareConflict?'#b91c1c':'#334155'} stroke="white" strokeWidth={vlanAccessLayout?'3.2':'2.8'} strokeLinejoin="round" paintOrder="stroke" className="pointer-events-none"><title>{endpoint.label} · {label}</title>{compactPortLabel(label)}</text>;
          };
          return <g key={`ports-${link.id}`} opacity={focusedState&&link.state!==focusedState?0.12:1}>{renderPortLabel(link.sourceInterface,source,vlanSourcePort,'source')}{renderPortLabel(link.targetInterface,target,targetPort,'target')}</g>;
        })}
        {positioned.map(node=>{ const style=stateStyle[node.state]; const selected=node.id===selectedNodeId; const displayLabel=node.label.length>18?`${node.label.slice(0,17)}…`:node.label; const nodeStroke=visualMode==='compare'&&node.state==='conflict'?'#dc2626':selected?'#2563eb':style.stroke; const nodeDash=visualMode==='design'?'6 4':style.dash; const nodeInteractive=Boolean(onNodeClick); const interaction={role:nodeInteractive?'button':undefined,tabIndex:nodeInteractive?0:undefined,onClick:()=>onNodeClick?.(node),onKeyDown:(event:React.KeyboardEvent<SVGGElement>)=>{if(nodeInteractive&&(event.key==='Enter'||event.key===' '))onNodeClick?.(node)}}; if(node.variant==='device')return <g key={node.id} {...interaction} className={`${nodeInteractive?'cursor-pointer':'cursor-default'} outline-none transition-opacity`} opacity={focusedState&&node.state!==focusedState?0.12:1}><text x={node.x} y={node.y-(vlanAccessLayout?40:35)} textAnchor="middle" fontSize={vlanAccessLayout?'10.8':'12.4'} fontWeight={vlanAccessLayout?'400':'650'} fill="#475569">{displayLabel}</text><circle cx={node.x} cy={node.y} r={vlanAccessLayout?28:24} fill={selected?'#d9efed':'#edf7f6'} stroke={selected?'#06706d':'#0f7f7b'} strokeWidth={selected?2.8:1.8}/><foreignObject x={node.x-(vlanAccessLayout?16:14)} y={node.y-(vlanAccessLayout?16:14)} width={vlanAccessLayout?32:28} height={vlanAccessLayout?32:28}><div className={vlanAccessLayout?'flex h-8 w-8 items-center justify-center':'flex h-7 w-7 items-center justify-center'}><Network size={vlanAccessLayout?28:24} strokeWidth={1.9} color="#06706d"/></div></foreignObject><title>{node.label}{node.subtitle&&` · ${node.subtitle}`} · {stateLabel[node.state]}</title></g>; if(node.variant==='nic')return <g key={node.id} {...interaction} className={`${nodeInteractive?'cursor-pointer':'cursor-default'} outline-none transition-opacity`} opacity={focusedState&&node.state!==focusedState?0.12:1}><rect x={node.x-(vlanAccessLayout?54:46)} y={node.y-(vlanAccessLayout?24:21)} width={vlanAccessLayout?108:92} height={vlanAccessLayout?48:42} rx="5" fill="#f8fafc" stroke={selected?'#2563eb':'#cbd5e1'} strokeWidth={selected?2.6:1.4}/><text x={node.x} y={node.y+4} textAnchor="middle" fontSize={vlanAccessLayout?'10.4':'11.8'} fontWeight={vlanAccessLayout?'400':'650'} fill="#475569">{displayLabel}</text><title>{node.label}{node.subtitle&&` · ${node.subtitle}`} · {stateLabel[node.state]}</title></g>; const height=nodeHeight(node); const top=node.y-height/2; const hasPorts=Boolean(node.ports?.length); return <g key={node.id} {...interaction} className={`${nodeInteractive?'cursor-pointer':'cursor-default'} outline-none transition-opacity`} opacity={focusedState&&node.state!==focusedState?0.12:1}>
          <rect x={node.x-NODE_WIDTH/2} y={top} width={NODE_WIDTH} height={height} rx="8" fill={style.fill} stroke={nodeStroke} strokeWidth={selected?2.5:1.5} strokeDasharray={nodeDash}/>
          <foreignObject x={node.x-NODE_WIDTH/2+9} y={hasPorts?top+5:node.y-8} width="16" height="16"><div className="flex h-4 w-4 items-center justify-center text-slate-500">{node.icon==='network'||(!node.icon&&node.role==='Endpoint')?<Network size={12}/>:<Server size={12}/>}</div></foreignObject>
          <text x={node.x-NODE_WIDTH/2+31} y={hasPorts?top+16:node.y+3} fontSize="7.2" fontWeight="600" fill="#334155">{displayLabel}</text>
          <circle cx={node.x+NODE_WIDTH/2-10} cy={top+9} r="3" fill={style.stroke}/>
          {hasPorts&&<><line x1={node.x-NODE_WIDTH/2+8} y1={top+24} x2={node.x+NODE_WIDTH/2-8} y2={top+24} stroke="#dbe4ee"/>{node.ports!.map((port,index)=>{const row=Math.floor(index/PORT_COLUMNS);const rowPorts=node.ports!.slice(row*PORT_COLUMNS,(row+1)*PORT_COLUMNS);const column=index%PORT_COLUMNS;const chipWidth=9;const chipGap=3;const rowWidth=rowPorts.length*chipWidth+Math.max(0,rowPorts.length-1)*chipGap;const x=node.x-rowWidth/2+column*(chipWidth+chipGap);const y=top+29+row*12;return <g key={port}><rect x={x} y={y} width={chipWidth} height="9" rx="2" fill="white" stroke="#94a3b8"/><text x={x+chipWidth/2} y={y+6.4} textAnchor="middle" fontSize="4.8" fontWeight="600" fill="#475569">{port.replace(/^NIC-?/i,'')}</text><title>{port}</title></g>})}</>}
          <title>{node.label}{node.subtitle&&` · ${node.subtitle}`} · {stateLabel[node.state]}</title>
        </g>})}
      </svg>
    </div>
    {showLegend&&!hierarchyMode&&<div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-nowrap items-center gap-x-1 overflow-x-auto whitespace-nowrap rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 text-[8px] text-slate-500 shadow-sm">
      {focusedState&&<button onClick={()=>setFocusedState(null)} className="rounded px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50">Show all</button>}
      {(Object.keys(stateLabel) as TopologyNodeState[]).map(state=>{const available=availableStates.includes(state);return <button key={state} type="button" disabled={!available} aria-pressed={focusedState===state} title={available?`${stateDescription[state]} Click to ${focusedState===state?'show all':'focus this state'}.`:`${stateDescription[state]} This state is not present in the current topology.`} onClick={()=>setFocusedState(current=>current===state?null:state)} className={`flex items-center gap-1 rounded px-2 py-1 transition ${focusedState===state?'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200':available?'hover:bg-slate-50':'cursor-default opacity-45'}`}><i className="h-2 w-2 rounded-full" style={{background:stateStyle[state].stroke}}/>{stateLabel[state]}</button>})}
      {links.some(link=>link.relationship==='expected')&&<span title="Uncertain adjacency preview from Inventory discovery" className="flex items-center gap-1 px-2 text-blue-700"><i className="h-0 w-4 border-t border-dashed border-blue-600"/>Inventory discovery preview</span>}
    </div>}
  </div>;
};

export default TopologyCanvas;

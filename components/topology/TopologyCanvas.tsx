import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Maximize2, Network, Server, ZoomIn, ZoomOut } from 'lucide-react';

export type TopologyRole = 'Core' | 'Spine' | 'Aggregation' | 'Leaf' | 'Border' | 'Access' | 'Endpoint' | 'Unclassified';
export type TopologyNodeState = 'design' | 'mainline' | 'workspace-added' | 'workspace-modified' | 'ignored' | 'discovered' | 'conflict';
export type TopologyNode<T = unknown> = { id:string; label:string; subtitle?:string; role:TopologyRole; state:TopologyNodeState; data:T };
export type TopologyLink = { id:string; source:string; target:string; sourceInterface?:string; targetInterface?:string; speed?:string; state:TopologyNodeState; confidence?:'High'|'Medium'|'Low'; relationship?:'inventory'|'expected'|'planned' };
export type TopologyHierarchyGroup = { id:string; label:string; nodeIds:string[]; level:0|1|2; parentId?:string; validation?:'none'|'valid'|'warning'|'error'; summary?:string; layout?:'horizontal'|'vertical'; compactChildren?:boolean };
export type TopologyRolePresentation = { ranks?:Partial<Record<TopologyRole,number>>; bandLabels?:Partial<Record<TopologyRole,string>> };

type Props<T> = {
  nodes: TopologyNode<T>[];
  links: TopologyLink[];
  hierarchyGroups?: TopologyHierarchyGroup[];
  rolePresentation?: TopologyRolePresentation;
  selectedHierarchyGroupId?: string;
  selectedNodeId?: string;
  selectedLinkId?: string;
  showLinkBadges?: boolean;
  fitToContainer?: boolean;
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

export function layoutByRole<T>(nodes:TopologyNode<T>[], canvasWidth=1000, links:TopologyLink[]=[], canvasHeight=620, ranks:Record<TopologyRole,number>=roleRank): PositionedNode<T>[] {
  const rows = new Map<number,TopologyNode<T>[]>();
  nodes.forEach(node=>{const rank=ranks[node.role];rows.set(rank,[...(rows.get(rank)||[]),node])});
  const orderedRows=[...rows.entries()].sort(([a],[b])=>a-b);
  const rowStep=orderedRows.length<=1?0:Math.min(120,(canvasHeight-160)/(orderedRows.length-1));
  const firstY=canvasHeight/2-((orderedRows.length-1)*rowStep)/2;
  const placed=new Map<string,PositionedNode<T>>();
  const result:PositionedNode<T>[]=[];
  const connectedX=(nodeId:string)=>{
    const values=links.flatMap(link=>link.source===nodeId&&placed.has(link.target)?[placed.get(link.target)!.x]:link.target===nodeId&&placed.has(link.source)?[placed.get(link.source)!.x]:[]);
    return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
  };
  orderedRows.forEach(([,sourceRow],rowIndex)=>{
    const row=[...sourceRow].sort((a,b)=>(connectedX(a.id)??Number.POSITIVE_INFINITY)-(connectedX(b.id)??Number.POSITIVE_INFINITY));
    const rowWidth=row.length*NODE_WIDTH+Math.max(0,row.length-1)*NODE_GAP;
    const firstX=(canvasWidth-rowWidth)/2+NODE_WIDTH/2;
    const baseXs=row.map((_,index)=>firstX+index*(NODE_WIDTH+NODE_GAP));
    const aligned=row.map((node,index)=>({index,target:connectedX(node.id)})).filter(item=>item.target!==null) as {index:number;target:number}[];
    const desiredShift=aligned.length?aligned.reduce((sum,item)=>sum+item.target-baseXs[item.index],0)/aligned.length:0;
    const minShift=48+NODE_WIDTH/2-baseXs[0];
    const maxShift=canvasWidth-48-NODE_WIDTH/2-baseXs[baseXs.length-1];
    const shift=Math.max(minShift,Math.min(maxShift,desiredShift));
    row.forEach((node,index)=>{const positioned={...node,x:baseXs[index]+shift,y:firstY+rowIndex*rowStep};placed.set(node.id,positioned);result.push(positioned)});
  });
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

const TopologyCanvas = <T,>({nodes,links,hierarchyGroups=[],rolePresentation,selectedHierarchyGroupId,selectedNodeId,selectedLinkId,showLinkBadges=true,fitToContainer=false,visualMode='default',emptyMessage='No registered topology to display.',topRightAccessory,externalNodeDropEnabled=false,onExternalNodeDrop,onHierarchyGroupClick,onNodeClick,onLinkClick}:Props<T>) => {
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
  const roleLayoutWidth=useMemo(()=>{const rowCounts=new Map<number,number>();nodes.forEach(node=>rowCounts.set(effectiveRoleRank[node.role],(rowCounts.get(effectiveRoleRank[node.role])||0)+1));const largestRow=Math.max(1,...rowCounts.values());return Math.max(canvasWidth,largestRow*(NODE_WIDTH+NODE_GAP)+120)},[nodes,canvasWidth,effectiveRoleRank]);
  const hierarchyLayout=useMemo(()=>hierarchyMode?layoutByHierarchy(nodes,hierarchyGroups,canvasWidth,collapsedPodIds):null,[hierarchyMode,nodes,hierarchyGroups,canvasWidth,collapsedPodIds]);
  const layoutWidth=hierarchyLayout?.width||roleLayoutWidth;
  const positioned=useMemo(()=>hierarchyLayout?.nodes||layoutByRole(nodes,layoutWidth,links,viewHeight,effectiveRoleRank),[hierarchyLayout,nodes,layoutWidth,links,viewHeight,effectiveRoleRank]);
  const positions=useMemo(()=>new Map(positioned.map(node=>[node.id,node])),[positioned]);
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
    const vertical=effectiveRoleRank[endpoint.role]!==effectiveRoleRank[other.role]||Math.abs(dy)>NODE_HEIGHT;
    if(vertical){
      const capacity=5;
      const row=Math.floor(index/capacity);
      const positionInRow=index%capacity;
      const centerOut=positionInRow===0?0:Math.ceil(positionInRow/2)*(positionInRow%2===1?-1:1);
      const x=endpoint.x+centerOut*22+(row%2?4:0);
      const direction=Math.sign(dy)||1;
      const edgeY=endpoint.y+direction*NODE_HEIGHT/2;
      return{anchorX:x,anchorY:edgeY,labelX:x,labelY:edgeY+direction*(7+row*9)+2.5};
    }
    const capacity=2;
    const row=Math.floor(index/capacity);
    const column=index%capacity;
    const countInRow=Math.min(capacity,Math.max(1,ids.length-row*capacity));
    const spacing=Math.min(15,(NODE_HEIGHT-8)/Math.max(1,countInRow-1));
    const y=endpoint.y+(column-(countInRow-1)/2)*spacing;
    const direction=Math.sign(dx)||1;
    const edgeX=endpoint.x+direction*NODE_WIDTH/2;
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
      return{key,rank,y:row[0].y,x,width:Math.max(80,maxX-x),roles};
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
  },[positioned,positions,layoutWidth,hierarchyMode,hierarchyGroups,hierarchyLayout,effectiveRoleRank,roleBandLabels]);
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
    if(!fitToContainer||!hierarchyMode||!hierarchyBounds.length)return `0 0 ${layoutWidth} ${viewHeight}`;
    const outerBounds=hierarchyBounds.filter(item=>item.group.level===0);
    const bounds=outerBounds.length?outerBounds:hierarchyBounds;
    const minX=Math.min(...bounds.map(item=>item.x));
    const minY=Math.min(...bounds.map(item=>item.y));
    const maxX=Math.max(...bounds.map(item=>item.x+item.width));
    const maxY=Math.max(...bounds.map(item=>item.y+item.height));
    const contentWidth=maxX-minX;
    const contentHeight=maxY-minY;
    const paddingX=Math.max(72,contentWidth*0.06);
    const paddingY=Math.max(104,contentHeight*0.22);
    return `${minX-paddingX} ${minY-paddingY} ${contentWidth+paddingX*2} ${contentHeight+paddingY*2}`;
  },[fitToContainer,hierarchyMode,hierarchyBounds,layoutWidth,viewHeight]);
  const compactPortLabel=(value:string|undefined)=>value?.replace(/^Ethernet/i,'Et').replace(/^Management/i,'Mgmt')||'Port not reported';
  const hoveredLinkText=hoveredLink?(()=>{
    const sourceLabel=positions.get(hoveredLink.source)?.label||hoveredLink.source;
    const targetLabel=positions.get(hoveredLink.target)?.label||hoveredLink.target;
    const hasPhysicalEndpoint=Boolean(hoveredLink.sourceInterface||hoveredLink.targetInterface);
    const endpoints=hasPhysicalEndpoint?`${sourceLabel} ${compactPortLabel(hoveredLink.sourceInterface)} ↔ ${targetLabel} ${compactPortLabel(hoveredLink.targetInterface)}`:`${sourceLabel} ↔ ${targetLabel}`;
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
          title={showPortLabels?'Hide all port labels':'Show all port labels'}
          aria-label={showPortLabels?'Hide all port labels':'Show all port labels'}
          aria-pressed={showPortLabels}
          onClick={()=>setShowPortLabels(value=>!value)}
          className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[9px] font-medium transition-colors ${showPortLabels?'bg-blue-50 text-blue-700':'text-slate-500 hover:bg-slate-100'}`}
        >
          {showPortLabels?<Eye size={13}/>:<EyeOff size={13}/>}<span>Port labels</span>
        </button></>}
      </div>
    </div>
    {hoveredLink&&<div className="absolute left-1/2 top-3 z-20 max-w-[calc(100%-15rem)] -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-[9px] text-white shadow-xl">
      {hoveredLinkText}
    </div>}
    <div className={`absolute inset-0 transition-transform ${fitToContainer?'overflow-hidden':'overflow-auto'}`} style={{transform:`scale(${zoom})`,transformOrigin:'center'}}>
      <svg viewBox={fittedViewBox} preserveAspectRatio="xMidYMid meet" className={fitToContainer?'h-full w-full':'h-full'} style={fitToContainer?undefined:{width:`${layoutWidth}px`,minWidth:'100%'}} role="img" aria-label="Registered device topology">
        {hierarchyBounds.map(({group,x,y,width,height})=>{
          const collapsed=group.level===1&&collapsedPodIds.has(group.id);
          const selected=group.id===selectedHierarchyGroupId;
          const regionStyle=selected?{stroke:'#2563eb',fill:'#eff6ff',text:'#1d4ed8'}:{stroke:'#cbd5e1',fill:'#f8fafc',text:'#64748b'};
          const labelWidth=Math.min(Math.max(68,group.label.length*5.2+28),Math.max(68,width-20));
          const maxLabelChars=Math.max(6,Math.floor((labelWidth-28)/5.2));
          const displayLabel=group.label.length>maxLabelChars?`${group.label.slice(0,maxLabelChars-1)}…`:group.label;
          const domainCount=collapsed?hierarchyGroups.filter(item=>item.level===2&&item.parentId===group.id).length:0;
          return <g key={group.id} role="button" tabIndex={0} aria-label={collapsed?`${group.label}, collapsed, double-click to expand`:group.label} className={`${collapsed?'cursor-zoom-in':'cursor-pointer'} outline-none`} onClick={()=>{if(!collapsed)onHierarchyGroupClick?.(group)}} onDoubleClick={event=>{if(collapsed){event.stopPropagation();expandCollapsedPod(group.id)}}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){collapsed?expandCollapsedPod(group.id):onHierarchyGroupClick?.(group)}}}>
          <rect x={x} y={y} width={Math.max(80,width)} height={Math.max(54,height)} rx={12-group.level*2} fill={regionStyle.fill} fillOpacity={selected?0.42:group.level===2?0.22:0.14} stroke={regionStyle.stroke} strokeWidth={selected?2.5:1.25}/>
          <rect x={x+10} y={y-8} width={labelWidth} height="16" rx="8" fill="white" stroke={regionStyle.stroke}/>
          <circle cx={x+19} cy={y} r="3" fill={regionStyle.stroke}/><text x={x+26} y={y+3} fontSize="7.2" fontWeight="600" fill={regionStyle.text}>{displayLabel}</text>
          {collapsed&&<><text x={x+width/2} y={y+48} textAnchor="middle" fontSize="7.2" fontWeight="600" fill="#475569">{group.summary||`${group.nodeIds.length} devices · ${domainCount} domains`}</text><text x={x+width/2} y={y+68} textAnchor="middle" fontSize="6.8" fill="#64748b">Double-click to expand</text></>}
        </g>})}
        {roleBands.map(band=>hierarchyMode?<g key={band.key} className="pointer-events-none">
          <rect x={band.x} y={band.y-ROLE_BAND_HEIGHT/2} width={band.width} height={ROLE_BAND_HEIGHT} rx="8" fill="#ffffffa8" stroke="#e2e8f0"/>
          <text x={band.x+10} y={band.y-NODE_HEIGHT/2-7} fontSize="7.2" fontWeight="600" fill="#64748b">{band.roles}</text>
        </g>:<g key={band.rank}>
          <rect x="48" y={band.y-ROLE_BAND_HEIGHT/2} width={layoutWidth-96} height={ROLE_BAND_HEIGHT} rx="8" fill="#ffffffb8" stroke="#e2e8f0"/>
          <text x="62" y={band.y-ROLE_BAND_HEIGHT/2+15} fontSize="7.2" fontWeight="600" fill="#64748b">{band.roles}</text>
        </g>)}
        {links.map(link=>{
          const source=positions.get(link.source);
          const target=positions.get(link.target);
          if(!source||!target)return null;
          const style=stateStyle[link.state];
          const expected=link.relationship==='expected';
          const planned=link.relationship==='planned';
          const designVisual=visualMode==='design';
          const compareConflict=visualMode==='compare'&&link.state==='conflict';
          const selected=link.id===selectedLinkId;
          const linkStroke=selected?'#2563eb':designVisual?style.stroke:compareConflict?'#dc2626':hierarchyMode?'#64748b':expected?'#2563eb':planned?'#64748b':style.stroke;
          const linkDash=designVisual?'7 5':compareConflict&&planned?'7 5':expected?'7 5':planned?undefined:style.dash;
          const linkOpacity=selected?1:compareConflict?0.95:designVisual?0.78:hierarchyMode?0.58:expected?0.62:planned?0.58:0.82;
          const dx=target.x-source.x;
          const dy=target.y-source.y;
          const verticalRoleLink=effectiveRoleRank[source.role]!==effectiveRoleRank[target.role]||Math.abs(dy)>NODE_HEIGHT;
          const horizontal=verticalRoleLink?false:Math.abs(dx)>Math.abs(dy);
          const directionX=Math.sign(dx)||1;
          const directionY=Math.sign(dy)||1;
          const sourceLineX=source.x+(horizontal?directionX*NODE_WIDTH/2:0);
          const sourceLineY=source.y+(horizontal?0:directionY*NODE_HEIGHT/2);
          const targetLineX=target.x-(horizontal?directionX*NODE_WIDTH/2:0);
          const targetLineY=target.y-(horizontal?0:directionY*NODE_HEIGHT/2);
          const revealPortLabels=showPortLabels||hoveredLink?.id===link.id;
          return <g key={link.id} className="cursor-pointer transition-opacity" opacity={focusedState&&link.state!==focusedState?0.12:1} onMouseEnter={()=>setHoveredLink(link)} onMouseLeave={()=>setHoveredLink(null)} onClick={()=>onLinkClick?.(link)}>
          <line x1={sourceLineX} y1={sourceLineY} x2={targetLineX} y2={targetLineY} stroke={linkStroke} strokeWidth={selected?3:hierarchyMode?1.6:expected?1.7:planned?1.5:2.2} strokeDasharray={linkDash} opacity={linkOpacity}/>
          <line x1={sourceLineX} y1={sourceLineY} x2={targetLineX} y2={targetLineY} stroke="transparent" strokeWidth="16"/>
          {showLinkBadges&&link.speed&&<><rect x={(source.x+target.x)/2-23} y={(source.y+target.y)/2-8} width="46" height="15" rx="7" fill="white" stroke="#e2e8f0"/>
          <text x={(source.x+target.x)/2} y={(source.y+target.y)/2+3} textAnchor="middle" fontSize="6.8" fill="#64748b">{link.speed}</text></>}
        </g>})}
        {links.map(link=>{
          const source=positions.get(link.source);
          const target=positions.get(link.target);
          const revealPortLabels=showPortLabels||hoveredLink?.id===link.id;
          if(!source||!target||!revealPortLabels||(!link.sourceInterface&&!link.targetInterface))return null;
          const sourcePort=getPortPlacement(source,target,link.id);
          const targetPort=getPortPlacement(target,source,link.id);
          const compareConflict=visualMode==='compare'&&link.state==='conflict';
          const renderPortLabel=(label:string|undefined,endpoint:PositionedNode<T>,placement:ReturnType<typeof getPortPlacement>,side:'source'|'target')=>{
            if(!label)return null;
            return <text key={`${link.id}-${side}`} x={placement.labelX} y={placement.labelY} textAnchor="middle" fontSize="6.5" fontWeight="600" fill={compareConflict?'#b91c1c':'#334155'} stroke="white" strokeWidth="2.8" strokeLinejoin="round" paintOrder="stroke" className="pointer-events-none"><title>{endpoint.label} · {label}</title>{compactPortLabel(label)}</text>;
          };
          return <g key={`ports-${link.id}`} opacity={focusedState&&link.state!==focusedState?0.12:1}>{renderPortLabel(link.sourceInterface,source,sourcePort,'source')}{renderPortLabel(link.targetInterface,target,targetPort,'target')}</g>;
        })}
        {positioned.map(node=>{ const style=stateStyle[node.state]; const selected=node.id===selectedNodeId; const displayLabel=node.label.length>18?`${node.label.slice(0,17)}…`:node.label; const nodeStroke=visualMode==='compare'&&node.state==='conflict'?'#dc2626':selected?'#2563eb':style.stroke; const nodeDash=visualMode==='design'?'6 4':style.dash; return <g key={node.id} role="button" tabIndex={0} className="cursor-pointer outline-none transition-opacity" opacity={focusedState&&node.state!==focusedState?0.12:1} onClick={()=>onNodeClick?.(node)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' ')onNodeClick?.(node)}}>
          <rect x={node.x-NODE_WIDTH/2} y={node.y-NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} rx="8" fill={style.fill} stroke={nodeStroke} strokeWidth={selected?2.5:1.5} strokeDasharray={nodeDash}/>
          <foreignObject x={node.x-NODE_WIDTH/2+9} y={node.y-8} width="16" height="16"><div className="flex h-4 w-4 items-center justify-center text-slate-500">{node.role==='Endpoint'?<Network size={12}/>:<Server size={12}/>}</div></foreignObject>
          <text x={node.x-NODE_WIDTH/2+31} y={node.y+3} fontSize="7.2" fontWeight="600" fill="#334155">{displayLabel}</text>
          <circle cx={node.x+NODE_WIDTH/2-10} cy={node.y-NODE_HEIGHT/2+9} r="3" fill={style.stroke}/>
          <title>{node.label}{node.subtitle&&` · ${node.subtitle}`} · {stateLabel[node.state]}</title>
        </g>})}
      </svg>
    </div>
    {!hierarchyMode&&<div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-nowrap items-center gap-x-1 overflow-x-auto whitespace-nowrap rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 text-[8px] text-slate-500 shadow-sm">
      {focusedState&&<button onClick={()=>setFocusedState(null)} className="rounded px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50">Show all</button>}
      {(Object.keys(stateLabel) as TopologyNodeState[]).map(state=>{const available=availableStates.includes(state);return <button key={state} type="button" disabled={!available} aria-pressed={focusedState===state} title={available?`${stateDescription[state]} Click to ${focusedState===state?'show all':'focus this state'}.`:`${stateDescription[state]} This state is not present in the current topology.`} onClick={()=>setFocusedState(current=>current===state?null:state)} className={`flex items-center gap-1 rounded px-2 py-1 transition ${focusedState===state?'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200':available?'hover:bg-slate-50':'cursor-default opacity-45'}`}><i className="h-2 w-2 rounded-full" style={{background:stateStyle[state].stroke}}/>{stateLabel[state]}</button>})}
      {links.some(link=>link.relationship==='expected')&&<span title="Uncertain adjacency preview from Inventory discovery" className="flex items-center gap-1 px-2 text-blue-700"><i className="h-0 w-4 border-t border-dashed border-blue-600"/>Inventory discovery preview</span>}
    </div>}
  </div>;
};

export default TopologyCanvas;

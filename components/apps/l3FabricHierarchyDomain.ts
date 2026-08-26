import { TopologyHierarchyGroup } from '../topology/TopologyCanvas';

export type FabricHierarchyDomainProjection = {
  id:string;
  name:string;
  nodeIds:string[];
  validation?:TopologyHierarchyGroup['validation'];
};

export type FabricHierarchyPodProjection = {
  id:string;
  name:string;
  nodeIds:string[];
  domains:FabricHierarchyDomainProjection[];
  validation?:TopologyHierarchyGroup['validation'];
  summary?:string;
  layout?:TopologyHierarchyGroup['layout'];
};

export type FabricHierarchyDcProjection = {
  id:string;
  name:string;
  nodeIds:string[];
  pods:FabricHierarchyPodProjection[];
  validation?:TopologyHierarchyGroup['validation'];
  compactChildren?:TopologyHierarchyGroup['compactChildren'];
};

export const createFabricHierarchyGroups = (dataCenters:FabricHierarchyDcProjection[]):TopologyHierarchyGroup[] => dataCenters.flatMap(dc=>[
  {id:dc.id,label:dc.name,nodeIds:dc.nodeIds,level:0 as const,validation:dc.validation,compactChildren:dc.compactChildren},
  ...dc.pods.flatMap(pod=>[
    {id:pod.id,label:pod.name,nodeIds:pod.nodeIds,level:1 as const,parentId:dc.id,validation:pod.validation,summary:pod.summary,layout:pod.layout},
    ...pod.domains.map(domain=>({id:domain.id,label:domain.name,nodeIds:domain.nodeIds,level:2 as const,parentId:pod.id,validation:domain.validation})),
  ]),
]);
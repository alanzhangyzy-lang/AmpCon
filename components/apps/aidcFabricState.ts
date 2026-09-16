import { AIDC_FABRIC_01, AIDC_LEAF_IDS, AIDC_SPINE_IDS } from './aidcTopologyDomain';

export type LeafDomainType = 'L3'|'L2';
export type LeafDomain = { id:string; name:string; type:LeafDomainType; asn:string; mlag:boolean; leafIds:string[] };
export type PodConfiguration = { name:string; loopbackPool:string; p2pPool:string; vtepPool:string; spanningTreeMode:string; spineIds:string[] };
export type Pod = PodConfiguration & { id:string; domains:LeafDomain[] };
export type SuperSpinePlane = { id:string; name:string; asn:string; deviceIds:string[] };
export type PlatformSettings = { profile:string; eosImage:string; managementVrf:string; ntpServers:string };
export type AdvancedSettings = {
  bgpPeerGroup:{name:string;password:string;bfd:boolean};
  interfaceDescriptions:{spineToLeaf:string;mlagPeer:string};
  p2pInterfaces:{mtu:string;ipv6Unnumbered:boolean};
  mlag:{peerLinkPortChannelId:string;reloadDelay:string};
};
export type DcConfiguration = { name:string; superSpinePlanes:SuperSpinePlane[]; platformSettings:PlatformSettings; advancedSettings:AdvancedSettings };
export type DataCenter = DcConfiguration & { id:string; podDefault:PodConfiguration; pods:Pod[] };
export type AIDCFabricState = { dataCenters:DataCenter[]; dcDefault:DcConfiguration; studioDeviceIds:string[]; revision:number; updatedAt:string };

export const defaultPodConfiguration:PodConfiguration={name:'Pod Default',loopbackPool:'10.255.0.0/24',p2pPool:'10.255.16.0/20',vtepPool:'10.255.1.0/24',spanningTreeMode:'MSTP',spineIds:[]};
export const defaultPlatformSettings:PlatformSettings={profile:'Arista validated L3LS',eosImage:'EOS 4.33.1F',managementVrf:'MGMT',ntpServers:'10.0.0.10, 10.0.0.11'};
export const defaultAdvancedSettings:AdvancedSettings={
  bgpPeerGroup:{name:'UNDERLAY-PEERS',password:'',bfd:true},
  interfaceDescriptions:{spineToLeaf:'P2P_LINK_TO_{peer}',mlagPeer:'MLAG_PEER_{peer}'},
  p2pInterfaces:{mtu:'9214',ipv6Unnumbered:false},
  mlag:{peerLinkPortChannelId:'2000',reloadDelay:'300'},
};
export const makeDcConfiguration=(name:string):DcConfiguration=>({name,superSpinePlanes:[{id:'plane-a',name:'Plane A',asn:'65000',deviceIds:[]}],platformSettings:{...defaultPlatformSettings},advancedSettings:{bgpPeerGroup:{...defaultAdvancedSettings.bgpPeerGroup},interfaceDescriptions:{...defaultAdvancedSettings.interfaceDescriptions},p2pInterfaces:{...defaultAdvancedSettings.p2pInterfaces},mlag:{...defaultAdvancedSettings.mlag}}});
export const fabricIdForDataCenter=(dcId:string)=>dcId===AIDC_FABRIC_01.dcId?AIDC_FABRIC_01.id:`FAB-${dcId}`;
export const createInitialAIDCFabricState=():AIDCFabricState=>({
  dataCenters:[{id:AIDC_FABRIC_01.dcId,...makeDcConfiguration(AIDC_FABRIC_01.dcName),podDefault:{...defaultPodConfiguration},pods:[{id:AIDC_FABRIC_01.podId,name:AIDC_FABRIC_01.podName,spineIds:[...AIDC_SPINE_IDS],loopbackPool:'10.255.0.0/24',p2pPool:'10.255.16.0/20',vtepPool:'10.255.1.0/24',spanningTreeMode:'MSTP',domains:[{id:AIDC_FABRIC_01.domainId,name:AIDC_FABRIC_01.domainName,type:'L3',asn:'65101',mlag:false,leafIds:[...AIDC_LEAF_IDS]}]}]}],
  dcDefault:makeDcConfiguration('Data Center Default'),studioDeviceIds:[...AIDC_SPINE_IDS,...AIDC_LEAF_IDS],revision:AIDC_FABRIC_01.revision,updatedAt:'10 min ago',
});
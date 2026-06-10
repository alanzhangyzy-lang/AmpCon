# AIDC vs IDC 深度对比分析

| 项目 | 内容 |
|------|------|
| 文档编号 | ANALYSIS-AMPCON-AIDC-IDC-COMPARE-001 |
| 版本 | v1.0 |
| 日期 | 2026-05-22 |

---

## 一、拓扑（Topology）对比

| 对比维度 | IDC | AIDC | 差异 |
|----------|-----|------|------|
| 基础架构 | 两层/三层 Spine-Leaf CLOS | 双平面/多平面 | 🔴 |
| 拓扑层级 | Spine→Leaf→Server | Plane→Spine→Leaf→GPU Server | 🔴 |
| 核心视图 | 单一 Fabric 视图 | Plane分层 + 全局聚合 | 🔴 |
| 连接模型 | 设备-端口-链路 1:1 | GPU-NIC-多端口-多Plane 1:N | 🔴 |
| 特殊节点 | Border Leaf | Shuffle Box | 🔴 |
| 链路类型 | 10G/25G/100G 以太网 | 200G/400G/800G RoCE | 🟡 |
| 冗余模型 | ECMP + MLAG | 多Plane冗余 | 🔴 |
| 拓扑发现 | LLDP/CDP | LLDP + Plane归属 + NIC映射 | 🟡 |
| 拓扑规模 | 数百~数千服务器 | 数千~十万GPU | 🟡 |
| 拓扑交互 | 点击设备/链路 | 按Plane筛选切换 | 🔴 |
| 布局算法 | 标准分层布局 | 多Plane并列 + Plane内分层 | 🔴 |
| 故障域展示 | 单设备/单链路 | Plane级故障域 | 🔴 |

### 拓扑数据模型

| 数据实体 | IDC | AIDC | 说明 |
|----------|-----|------|------|
| Fabric | ✅ 单一 | ✅ 多Plane | AIDC需Plane维度 |
| Spine | ✅ | ✅ 按Plane分组 | — |
| Leaf/ToR | ✅ | ✅ 按Plane分组 | — |
| Super-Spine | ✅ 三层时 | ❌ 多Plane替代 | — |
| Border Leaf | ✅ | ❌ | AIDC无南北向出口 |
| Shuffle Box | ❌ | ✅ | AIDC特有 |
| GPU Server | ❌ | ✅ | AIDC核心节点 |
| NIC多端口 | ❌ | ✅ | 单NIC连多Plane |
| Plane | ❌ | ✅ | AIDC核心维度 |
| Rail Group | ❌ | ✅ | GPU轨道分组 |

---

## 二、设备（Device）对比

| 对比维度 | IDC | AIDC | 差异 |
|----------|-----|------|------|
| 核心设备 | Spine/Leaf/Border | Spine-Px/Leaf-Px/ShuffleBox | 🟡 |
| 计算节点 | 通用服务器 | GPU Server (8GPU+8NIC) | 🔴 |
| 网卡模型 | 标准NIC | RDMA NIC (CX-7/CX-8多端口) | 🔴 |
| 交换芯片 | Memory Memory Broadcom TH通用 | TH5/Jericho3-AI (支持ARS) | 🟡 |
| 端口速率 | 10G/25G/100G | 200G/400G/800G | 🟡 |
| 端口模式 | 标准端口 | 端口拆分 400G→2×200G | 🔴 |
| 设备角色 | Core/Spine/Leaf/Border | Spine-P0/Leaf-P0/GPU/Shuffle | 🔴 |
| 关键指标 | CPU/内存/温度/利用率 | ECN/PFC/Buffer/队列深度 | 🔴 |
| 设备详情 | 信息+端口+邻居+告警 | +Plane归属+ECN统计+Buffer热力图 | 🔴 |
| 健康评估 | 可用性+基础资源 | RoCE质量+拥塞贡献度 | 🔴 |
| 固件管理 | NOS升级 | NOS+NIC固件+GPU驱动协同 | 🟡 |

### 设备属性模型

| 属性 | IDC | AIDC | 说明 |
|------|-----|------|------|
| id/name/model/ip/mac | ✅ | ✅ | 通用 |
| role | Spine/Leaf/Border | Spine-P0/Leaf-P0/Shuffle/GPU | 需Plane标识 |
| status | online/offline/provisioning | +degraded | 多一个降级态 |
| ports[] | 标准端口列表 | +Plane归属+拆分子端口 | 更复杂 |
| planeId | ❌ | ✅ | 设备所属Plane |
| gpuCount | ❌ | ✅ | GPU数量 |
| nicPorts[] | ❌ | ✅ | NIC多端口Plane映射 |
| ecnStats | ❌ | ✅ | ECN报文统计 |
| pfcStats | ❌ | ✅ | PFC暂停统计 |
| bufferUtil | ❌ | ✅ | Buffer利用率 |
| vxlanTunnels | ✅ | ❌ | VXLAN隧道 |
| vrfInstances | ✅ | ❌ | VRF实例 |
| tenantBindings | ✅ | ❌ | 租户绑定 |

---

## 三、系统/配置（System）对比

| 对比维度 | IDC | AIDC | 差异 |
|----------|-----|------|------|
| Underlay协议 | eBGP/OSPF | eBGP per-Plane / IB SM | 🟡 |
| Overlay协议 | VXLAN EVPN（核心） | ❌ 不适用 | 🔴 |
| 路由设计 | 标准ECMP | NIC分流+Plane内ECMP+ARS | 🔴 |
| QoS配置 | DSCP/CoS队列 | PFC/ECN阈值/DCQCN参数 | 🔴 |
| 流量控制 | TCP拥塞控制 | PFC+DCQCN+ECN无损保障 | 🔴 |
| 租户管理 | VRF/VLAN/VNI隔离 | GPU集群/训练任务隔离 | 🔴 |
| Fabric构建 | ZTP+Fabric Wizard | 多Plane部署+Rail分配 | 🟡 |
| 配置模板 | VXLAN/VRF/ACL | PFC/ECN/DCQCN/Buffer | 🔴 |
| 资源池 | IP/VLAN/VNI分配 | Plane/Rail/GPU分组分配 | 🔴 |
| 合规检查 | VXLAN/BGP一致性 | RoCE配置一致性 | 🟡 |
| 容量规划 | 链路带宽/端口密度 | GPU规模/Plane带宽/任务容量 | 🔴 |

### 配置对象

| 配置域 | IDC | AIDC |
|--------|-----|------|
| Underlay | BGP AS/Peer/Loopback | BGP per-Plane AS/Plane路由隔离 |
| Overlay | VXLAN VNI/VTEP/EVPN | ❌ 不适用 |
| QoS | DSCP/Queue Scheduling | PFC Priority/ECN Threshold/DCQCN |
| 安全 | 租户ACL/Micro-seg | GPU集群间隔离策略 |
| 采集 | SNMP/sFlow/NetFlow | gNMI Telemetry/INT |
| NIC | ❌ | 多端口Plane映射/MRC/逐包喷洒 |
| 集合通信 | ❌ | NCCL拓扑/AllReduce优化 |

---

## 四、告警（Alarm）对比

| 对比维度 | IDC | AIDC | 差异 |
|----------|-----|------|------|
| 告警分级 | Critical/Major/Minor/Warning | 同左 | 🟢 |
| 告警来源 | 设备/链路/协议 | 设备/链路/Plane/NIC/GPU/任务 | 🟡 |
| 核心告警 | 端口Down/BGP Down/VXLAN故障 | ECN超阈/PFC Storm/Plane降级 | 🔴 |
| 告警关联 | 设备→端口→链路 | Plane→设备→端口→队列→流 | 🔴 |
| 根因分析 | 拓扑关联(上游→下游) | 拥塞传播链(PFC反压追踪) | 🔴 |
| 业务影响 | 租户SLA/业务中断 | 训练效率/GPU利用率损失 | 🔴 |
| 告警抑制 | 拓扑风暴抑制 | Plane域隔离 | 🟡 |
| 告警阈值 | 利用率/CPU/内存/温度 | ECN数/PFC频率/Buffer/队列深度 | 🔴 |
| 处置建议 | 检查链路/重启协议 | 调ECN阈值/优化PFC/重分配任务 | 🔴 |

### 告警类型

| 告警类别 | IDC | AIDC |
|----------|-----|------|
| 链路层 | 端口Down/CRC/光衰 | 端口Down/CRC/光衰（可复用） |
| 协议层 | BGP Down/OSPF丢失/STP | BGP Down(per-Plane)/IB SM故障 |
| Overlay | VXLAN隧道故障/VNI冲突 | ❌ 不适用 |
| 性能层 | 利用率超阈/丢包超阈 | ECN超阈/PFC超阈/Buffer超阈 |
| 拥塞层 | ❌ 不关注 | PFC Storm/HoL Blocking/队列溢出 |
| 计算层 | ❌ | GPU过温/NIC异常/NCCL超时 |
| Plane层 | ❌ | Plane降级/Plane不均衡 |
| 任务层 | ❌ | 训练延迟超阈/AllReduce效率下降 |

---

## 五、业务层（Business）对比

| 对比维度 | IDC | AIDC | 差异 |
|----------|-----|------|------|
| 核心对象 | 租户/VRF/业务网络 | GPU集群/训练任务/推理服务 | 🔴 |
| 业务目标 | 快速上线+租户隔离 | 训练效率最大化+拥塞最小化 | 🔴 |
| SLA定义 | 可用性99.99%/延迟<5ms | 有效带宽>95%/延迟<10μs | 🔴 |
| 用户角色 | 网络运维 | 网络运维+AI平台+训练工程师 | 🟡 |
| Day 0 | Fabric构建/ZTP/VXLAN | 多Plane规划/Rail分配/RoCE | 🔴 |
| Day 1 | 租户开通/VRF/ACL | GPU分配/训练任务网络策略 | 🔴 |
| Day 2 | 监控/故障排查/扩容 | 拥塞治理/性能调优/效率优化 | 🔴 |
| 关键KPI | 在线率/利用率/MTTR | NCCL带宽/ECN率/训练MFU | 🔴 |

### 功能模块

| 模块 | IDC | AIDC | 复用 |
|------|-----|------|------|
| Dashboard | 设备/链路/租户SLA | ECN/PFC/Buffer/拥塞 | ❌ |
| Topology | 标准Spine-Leaf | 多Plane分层+切换 | ❌ |
| Inventory | Spine/Leaf/Border列表 | +GPU Server/NIC/Shuffle | 🟡 |
| Fabric | VXLAN EVPN构建 | 多Plane+RoCE配置 | ❌ |
| Tenant | VRF/VLAN/VNI | GPU集群/训练任务 | ❌ |
| Performance | 利用率/吞吐/延迟 | ECN/PFC/Buffer/拥塞热力图 | ❌ |
| Troubleshoot | Ping/VXLAN路径验证 | 拥塞路径/PFC反压链 | ❌ |
| Firmware | NOS升级 | NOS+NIC+GPU协同 | 🟡 |
| Alerts | 四级告警+事件流 | 四级告警+事件流 | 🟢 |
| Settings | BGP/VXLAN/QoS | BGP-Plane/PFC/ECN/DCQCN | ❌ |

---

## 六、GPU Server（AIDC 独有）

| 维度 | 说明 |
|------|------|
| GPU Server节点 | 8×GPU + 8×NIC，NVLink/PCIe互联 |
| NIC多端口映射 | 400G→2×200G / 800G→4×200G 连不同Plane |
| GPU-NIC-Plane关联 | GPU0→NIC0→Plane0, GPU1→NIC1→Plane1 |
| 节点内转发 | 跨Plane通信经NVLink/PCIe |
| NCCL拓扑感知 | Ring/Tree与物理Plane对齐 |
| 训练任务视图 | 任务→GPU→网络路径→性能 |
| MoE监控 | 全网状流量+逐包喷洒效果 |
| GPU-网络关联 | 网络拥塞→GPU等待→MFU下降 |
| Rail Group | 同Rail GPU共享ToR |

---

## 七、多平面架构（AIDC 独有）

| 维度 | 说明 |
|------|------|
| Plane管理 | 创建/编辑/删除Plane |
| Plane健康度 | 单Plane独立健康评分 |
| Plane负载均衡 | 各Plane流量均衡度 |
| Plane故障隔离 | 单Plane故障不影响其他 |
| Plane拓扑视图 | 按Plane筛选展示 |
| Plane告警 | 降级/不均衡告警 |
| NIC边缘路由 | 跨Plane路由决策监控 |
| 逐包喷洒 | 4-Plane Round-Robin效果 |
| Shuffle Box | 光纤通道映射配置 |
| Plane滚动升级 | 逐Plane升级，可不同NOS版本 |
| Plane容量规划 | 单Plane容量+扩展规划 |

---

## 八、可复用能力总结

| 能力层 | 复用 | 说明 |
|--------|------|------|
| App生命周期 | 🟢 | 安装/升级/卸载通用 |
| 告警框架 | 🟢 | 四级告警、事件流UI |
| RBAC权限 | 🟢 | SuperAdmin/SiteAdmin/Viewer |
| 站点管理 | 🟢 | 站点创建/绑定App |
| Dashboard工具栏 | 🟢 | 视图切换/面板管理/导出 |
| 设备纳管框架 | 🟡 | 框架通用，属性模型不同 |
| 拓扑渲染引擎 | 🟡 | 引擎通用，数据模型不同 |
| 固件升级框架 | 🟡 | 流程通用，对象不同 |
| Dashboard面板 | ❌ | 指标体系完全不同 |
| 拓扑数据模型 | ❌ | Plane/Rail/GPU vs Spine-Leaf |
| 配置管理 | ❌ | VXLAN/VRF vs PFC/ECN/DCQCN |
| 性能监控 | ❌ | 利用率 vs ECN/PFC/Buffer |
| 故障排查 | ❌ | VXLAN验证 vs 拥塞链分析 |
| 业务编排 | ❌ | 租户/VRF vs GPU集群/任务 |

---

## 九、结论

### 量化统计

| 类别 | 🔴 完全不同 | 🟡 有差异 | 🟢 可复用 |
|------|------------|----------|----------|
| 拓扑 | 9 | 3 | 0 |
| 设备 | 7 | 4 | 0 |
| 系统 | 8 | 3 | 0 |
| 告警 | 6 | 2 | 1 |
| 业务 | 7 | 1 | 0 |
| **合计** | **37** | **13** | **1** |

> **完全不同占比：72%（37/51）**

### 架构建议

```
AmpCon OS 底座
├── 共享能力（告警框架/RBAC/站点/Dashboard工具栏/App Center）
│
├── IDC Network App
│   ├── Topology（标准 Spine-Leaf）
│   ├── Dashboard（设备/链路/租户SLA）
│   ├── Fabric Builder（VXLAN EVPN）
│   ├── Tenant Manager（VRF/VLAN/VNI）
│   └── Performance（利用率/吞吐）
│
└── AIDC Network App
    ├── Topology（多Plane分层）
    ├── Dashboard（ECN/PFC/Buffer/拥塞）
    ├── Plane Manager（Plane规划/Rail分配）
    ├── RoCE Config（PFC/ECN/DCQCN）
    ├── GPU Cluster（训练任务/集群）
    └── Congestion Analytics（拥塞治理/追踪）
```

---

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-05-22 | 初始版本 |

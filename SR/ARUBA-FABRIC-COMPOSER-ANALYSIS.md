# Aruba解决方案 & Aruba Fabric Composer 深度分析报告

| 项目 | 内容 |
|------|------|
| 文档编号 | ANALYSIS-AMPCON-ARUBA-AFC-001 |
| 版本 | v1.0 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-05-15 |

---

## 一、分析背景与目标

### 1.1 分析背景

HPE Aruba Networking 作为全球领先的企业网络解决方案提供商，近年来持续向数据中心领域扩展。Aruba Fabric Composer（AFC）是其数据中心Fabric自动化编排的核心产品，定位为智能化、API驱动的软件定义编排解决方案。AFC结合Aruba CX系列数据中心交换机（CX 8xxx/CX 9300/CX 10000），构建了从园区到数据中心的统一网络管理生态。

本报告旨在系统分析Aruba整体解决方案架构及AFC产品能力，为AmpCon融合版DC Fabric管理模块提供竞品对标参考。

### 1.2 分析范围

- HPE Aruba Networking 整体解决方案架构（ESP平台）
- Aruba Fabric Composer 产品定位与核心能力
- Aruba CX 数据中心交换机产品矩阵
- AFC 与 Aruba Central 的协同关系
- AFC Day0/Day1/Day2 运维能力覆盖
- 商业模式与License体系
- 对AmpCon的借鉴意义与差距分析

---

## 二、HPE Aruba Networking 整体解决方案架构

### 2.1 Aruba ESP（Edge Services Platform）平台全景

HPE Aruba Networking 的产品战略围绕 ESP（Edge Services Platform）构建，实现从园区到数据中心的端到端统一架构：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HPE Aruba Networking ESP 平台                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Aruba Central（云管理平面）                        │   │
│  │  AI-Native · AIOps · 统一策略 · 跨域可视化 · GreenLake集成    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                    │                    │                 │
│  ┌────────┴────────┐ ┌────────┴────────┐ ┌────────┴────────┐       │
│  │   Campus/Branch  │ │    SD-WAN       │ │   Data Center    │       │
│  │   CX 6x/8x AP   │ │   EdgeConnect   │ │   CX 8x/93/10K  │       │
│  │   ClearPass NAC  │ │   SD-Branch     │ │   AFC 编排       │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                      │
│  统一OS：AOS-CX（园区+数据中心共用操作系统）                          │
│  统一API：REST API + Ansible + Terraform                             │
│  统一License：订阅制 Foundation/Advanced 分层                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```


### 2.2 Aruba 数据中心解决方案的核心组件

| 组件 | 定位 | 关键能力 |
|------|------|----------|
| **Aruba Fabric Composer (AFC)** | 本地Fabric编排控制器 | Fabric自动化部署、EVPN-VXLAN编排、微分段策略、Day0-Day2全生命周期 |
| **Aruba Central** | 云端统一管理平台 | AIOps、告警分析、AI-Insights、跨域可视化、配置管理 |
| **AOS-CX** | 统一网络操作系统 | 园区+DC统一OS、模块化架构、全面REST API、可编程性 |
| **CX 9300** | 高密度Spine/Leaf交换机 | 25.6Tbps、400GbE、1U、低延迟 |
| **CX 10000 (DSS)** | 分布式服务交换机 | AMD Pensando DPU、硬件加速微分段、有状态防火墙、线速安全 |
| **CX 8xxx** | 通用DC接入/汇聚交换机 | 10G/25G/100G、VSX高可用、成本优化 |
| **PSM (Policy & Services Manager)** | DPU策略管理器 | CX 10000 DPU服务编排、微分段策略定义、安全策略管理 |

### 2.3 Aruba 数据中心管理的双轨模式

Aruba在数据中心管理上提供两种互补的管理模式：

| 维度 | Aruba Central（云管理） | Aruba Fabric Composer（本地编排） |
|------|------------------------|----------------------------------|
| **部署模式** | SaaS / VPC / On-Prem（2025新增） | On-Premises |
| **核心价值** | AIOps智能分析、跨域统一视图 | Fabric自动化编排、精细化配置 |
| **适用场景** | 多站点统一监控、AI驱动运维 | 单站点/多站点Fabric精细化管理 |
| **配置深度** | 模板化配置、策略推送 | 完整Fabric生命周期编排 |
| **Fabric支持** | Two-Tier简单拓扑 | Spine-Leaf多级Fabric、Multi-Fabric |
| **安全管理** | 基础ACL/策略 | 微分段、DPU策略、零信任 |
| **API能力** | REST API + Webhook | 全面REST API + Ansible Collection |
| **协同关系** | 提供全局视图和AI分析 | 提供Fabric精细化编排能力 |

> **关键洞察**：Aruba的双轨模式（Central + AFC）与AmpCon的融合平台定位形成对比。Aruba将"云端智能分析"和"本地精细编排"分为两个产品，而AmpCon试图在一个平台中融合两者。

---

## 三、Aruba Fabric Composer (AFC) 深度分析

### 3.1 产品定位与核心理念

**官方定位**：AFC是一个智能化、API驱动的软件定义编排解决方案，用于简化和加速Leaf-Spine网络的部署和日常运维。

**核心设计理念**：

1. **意图驱动（Intent-Based）**：用户定义业务意图，AFC自动转化为设备配置
2. **工作流导向（Workflow-Guided）**：向导式操作流程，降低配置复杂度
3. **API-First**：所有功能通过REST API暴露，支持完整自动化
4. **统一管理引擎**：同时管理网络配置和安全策略（区别于其他方案需要多个工具）

### 3.2 AFC 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                  Aruba Fabric Composer                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              北向接口层                                │    │
│  │  REST API · Web UI · Ansible Collection · Terraform  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              编排引擎层                                │    │
│  │  Fabric建模 · 意图抽象 · 配置渲染 · 工作流引擎       │    │
│  │  资源池管理 · 冲突检测 · 变更验证                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              服务层                                    │    │
│  │  EVPN-VXLAN · 微分段 · Multi-Fabric · VSF/VSX       │    │
│  │  QoS · ACL · DHCP · DNS · NTP                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              南向接口层                                │    │
│  │  AOS-CX REST API · HTTPS · 设备发现 · 配置下发       │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ CX 9300  │  │ CX 10000 │  │ CX 8325  │  │ CX 8360  │   │
│  │ (Spine)  │  │  (DSS)   │  │ (Leaf)   │  │ (Leaf)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


### 3.3 AFC Day0/Day1/Day2 能力全景

#### Day 0：Fabric初始化与基础建设

| 能力 | 描述 | 实现方式 |
|------|------|----------|
| **Fabric创建向导** | 向导式创建Spine-Leaf Fabric，定义拓扑结构 | Web UI向导 + API |
| **设备发现与纳管** | 自动发现网络中的AOS-CX设备并纳入管理 | HTTPS + REST API |
| **Underlay自动配置** | 自动配置Spine-Leaf间的L3链路、OSPF/BGP路由 | 意图驱动自动渲染 |
| **VSF虚拟化** | 将两台物理设备虚拟化为一台Virtual Fabric | VSF技术 |
| **VSX高可用** | 配置Spine/Leaf的VSX双活对 | 自动化VSX配置 |
| **资源池分配** | 自动分配Loopback IP、VTEP IP、AS号等 | 内置资源池管理 |
| **ZTP支持** | 设备零配置上线，自动获取初始配置 | DHCP + TFTP/HTTP |

#### Day 1：业务网络开通

| 能力 | 描述 | 实现方式 |
|------|------|----------|
| **EVPN-VXLAN Overlay** | 自动构建VXLAN Overlay网络，配置VNI/VLAN映射 | 向导式配置 |
| **租户/VRF管理** | 创建多租户隔离的VRF实例 | 租户抽象模型 |
| **网络分段（Network Segment）** | 定义L2/L3网络段，自动关联到Fabric | 意图抽象 |
| **端口配置** | 批量配置服务器接入端口的VLAN/Trunk | 模板化配置 |
| **vCenter集成** | 与VMware vCenter联动，自动感知VM网络需求 | API集成 |
| **微分段策略** | 定义东西向安全策略，下发到CX 10000 DPU | PSM联动 |
| **Multi-Fabric互联** | 跨站点Fabric的EVPN-VXLAN DCI配置 | DC-DC工作流 |
| **外部网络连接** | 配置Fabric与外部网络（WAN/Internet）的互联 | Border Leaf配置 |

#### Day 2：运维监控与优化

| 能力 | 描述 | 实现方式 |
|------|------|----------|
| **Fabric拓扑可视化** | 图形化展示Fabric拓扑、设备状态、链路状态 | Web UI |
| **配置漂移检测** | 检测设备实际配置与期望配置的差异 | 配置快照对比 |
| **配置回滚** | 将设备配置回滚到之前的已知良好状态 | 检查点机制 |
| **固件管理** | 集中管理AOS-CX固件版本升级 | 批量升级工作流 |
| **告警与事件** | 设备/链路状态变化的告警通知 | 事件引擎 |
| **审计日志** | 记录所有配置变更操作的审计轨迹 | 内置审计 |
| **健康检查** | Fabric整体健康状态评估 | 多维度检查 |
| **API自动化** | 通过REST API实现运维自动化 | OpenAPI规范 |

### 3.4 AFC 核心差异化能力深度分析

#### 3.4.1 统一网络与安全管理引擎

AFC的最大差异化在于：**它是Aruba CX平台的统一网络和安全管理引擎**。

传统方案中，网络配置和安全策略由不同工具管理：
- 网络配置 → Fabric Controller
- 防火墙策略 → 安全管理平台
- DPU服务 → 独立管理器

AFC将这三者统一：
- 网络Fabric配置（EVPN-VXLAN、路由、QoS）
- 交换机ACL/安全策略
- CX 10000 DPU分布式防火墙策略（通过PSM联动）

> **对AmpCon的启示**：统一管理引擎的理念值得借鉴。AmpCon在设计DC Fabric模块时，应考虑将网络配置和安全策略管理整合，而非分离为独立模块。

#### 3.4.2 CX 10000 分布式服务架构（DSA）

CX 10000是Aruba的战略级产品，集成AMD Pensando DPU，实现：

| 能力 | 传统方案 | CX 10000 DSA方案 |
|------|---------|-----------------|
| 东西向防火墙 | 外挂物理/虚拟防火墙 | 交换机内置硬件加速有状态防火墙 |
| 微分段 | 依赖Hypervisor或Overlay | 硬件线速微分段，不依赖Hypervisor |
| 流量可视性 | 采样（sFlow/NetFlow） | 全流量DPI级可视性 |
| 性能影响 | 引入额外延迟和瓶颈 | 线速处理，零额外延迟 |
| 管理复杂度 | 多平台多策略 | AFC统一编排 |

**AFC + CX 10000 + PSM 的协同**：
```
AFC（Fabric编排）──→ CX 10000（数据面执行）
       │                      ↑
       └──→ PSM（DPU策略管理）─┘
```

> **对AmpCon的启示**：虽然AmpCon不绑定特定硬件，但应关注DPU/SmartNIC趋势。未来可考虑对接第三方DPU管理接口，提供类似的安全策略可视化能力。

#### 3.4.3 Multi-Fabric 跨站点编排

AFC 6.4+版本支持Multi-Fabric管理：

- **单实例管理多Fabric**：一个AFC实例可管理多个物理站点的Fabric
- **DC-DC互联工作流**：向导式配置跨站点EVPN-VXLAN DCI
- **远程Fabric纳管**：支持纳管远程站点的Fabric（延迟≤50ms）
- **L2/L3跨Fabric扩展**：跨站点的VLAN延伸和路由互通

```
┌─────────────┐         WAN          ┌─────────────┐
│  Site A     │◄─────────────────────►│  Site B     │
│  Fabric-1   │   EVPN-VXLAN DCI     │  Fabric-2   │
│  (Primary)  │                       │  (CoLo)     │
└──────┬──────┘                       └──────┬──────┘
       │                                      │
       └──────────────┬───────────────────────┘
                      │
              ┌───────┴───────┐
              │  AFC Instance  │
              │  (统一编排)     │
              └───────────────┘
```

> **对AmpCon的启示**：Multi-Site/Multi-Fabric管理是AmpCon已有的优势方向（SiteMap），但需要加强Fabric级别的跨站点编排能力。


### 3.5 AFC 自动化与集成生态

| 集成方式 | 描述 | 成熟度 |
|----------|------|--------|
| **REST API** | 全功能REST API，OpenAPI规范，支持所有AFC操作 | ★★★★★ |
| **Ansible Collection** | 官方Ansible Collection（arubanetworks.afc），覆盖Day0-Day2 | ★★★★☆ |
| **Terraform Provider** | 基础设施即代码支持 | ★★★☆☆ |
| **VMware vCenter** | 自动感知VM创建/迁移，动态调整网络配置 | ★★★★☆ |
| **Aruba Central** | 遥测数据上报、AI分析、统一告警 | ★★★★☆ |
| **PSM (Pensando)** | CX 10000 DPU策略编排 | ★★★★☆ |
| **Webhook/Syslog** | 事件通知与日志外发 | ★★★☆☆ |

### 3.6 AFC 支持的网络架构类型

| 架构类型 | 描述 | 适用场景 |
|----------|------|----------|
| **Spine-Leaf (EVPN-VXLAN)** | 标准三阶段Clos架构，EVPN控制面+VXLAN数据面 | 中大型DC，主推架构 |
| **Two-Tier (VSX)** | 两层架构，Core-Access，VSX双活 | 小型DC/边缘DC |
| **Multi-Fabric DCI** | 多站点Fabric通过Border VTEP互联 | 多数据中心互联 |
| **VSF Virtual Fabric** | 两台设备虚拟化为一台 | 高可用需求 |
| **Collapsed Spine-Leaf** | 精简版Spine-Leaf，Spine兼做Border | 小规模部署 |

---

## 四、Aruba CX 数据中心交换机产品矩阵

### 4.1 产品定位与规格对比

| 产品系列 | 定位 | 端口密度 | 交换容量 | 关键特性 | 典型角色 |
|----------|------|----------|----------|----------|----------|
| **CX 9300** | 高性能Spine | 32×400G 或 64×100G | 25.6Tbps | 1U、低延迟、高密度400G | Spine |
| **CX 10000** | 分布式服务交换机 | 48×25G + 6×100G | 3.6Tbps | AMD Pensando DPU、硬件微分段、有状态防火墙 | Leaf (安全增强) |
| **CX 8325** | 通用DC Leaf | 32×100G 或 48×25G+8×100G | 6.4Tbps | 高性能、灵活端口 | Leaf/Spine |
| **CX 8360** | 通用DC Leaf | 多种端口组合 | 可变 | VSX、灵活配置 | Leaf/Access |
| **CX 8400** | 模块化核心 | 模块化插槽 | 可扩展 | 模块化、高可用 | Core/Spine |

### 4.2 CX 9300 深度分析（Aruba DC旗舰Spine）

CX 9300是Aruba最新的数据中心旗舰交换机：

- **定位**：下一代25.6Tbps固定配置交换机
- **端口**：32×400GbE 或 32×200GbE 或 64×100GbE（灵活breakout）
- **延迟**：超低延迟设计，适合对延迟敏感的DC应用
- **OS**：AOS-CX 10.10+
- **AFC支持**：Fabric Composer 6.4+完整支持
- **适用场景**：高密度Spine、服务器/存储互联、Fabric内部互联

### 4.3 CX 10000 深度分析（战略级DPU交换机）

CX 10000是Aruba差异化竞争的核心产品：

**硬件架构**：
- 标准交换ASIC（网络转发）+ AMD Pensando DPU（服务处理）
- DPU提供硬件加速的有状态防火墙、微分段、遥测

**核心能力**：
- 线速有状态防火墙（东西向流量）
- 硬件加速微分段（不依赖Hypervisor）
- 全流量可视性（DPI级别）
- 零信任安全模型
- 与AFC/PSM统一管理

**竞争优势**：
- vs 传统方案：消除外挂防火墙瓶颈，降低延迟
- vs 虚拟化方案（NSX）：不消耗服务器CPU资源
- vs 其他DPU方案（NVIDIA BlueField）：交换机内置，无需改造服务器

---

## 五、AFC 与竞品对比分析

### 5.1 AFC vs 主流DC Fabric控制器

| 维度 | Aruba AFC | Cisco ACI/NDFC | Arista AVD/CVP | 华为 iMaster NCE | H3C AD-DC |
|------|-----------|----------------|----------------|-----------------|-----------|
| **产品形态** | 本地软件 | 硬件APIC/软件NDFC | 开源AVD+云CVP | 本地/云 | 本地软件 |
| **Fabric架构** | EVPN-VXLAN | ACI(私有)+VXLAN | EVPN-VXLAN | EVPN-VXLAN | EVPN-VXLAN |
| **设备绑定** | 仅Aruba CX | 仅Cisco Nexus/ACI | 仅Arista EOS | 仅华为CE | 仅H3C |
| **Day0自动化** | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★☆ |
| **Day1编排** | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ |
| **Day2运维** | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **微分段** | ★★★★★(DPU) | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ |
| **Multi-Site** | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ |
| **API成熟度** | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| **开放生态** | ★★★★☆ | ★★★☆☆ | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ |
| **学习曲线** | 低 | 高 | 中 | 中 | 中 |
| **部署复杂度** | 低（单VM） | 高（3节点集群） | 低（开源工具链） | 中 | 中 |

### 5.2 AFC 的竞争优势

1. **统一网络+安全管理**：唯一将Fabric编排和DPU安全策略统一管理的方案
2. **低门槛部署**：单VM即可运行，不需要专用硬件或集群
3. **向导式操作**：工作流导向的UI设计，降低运维人员学习成本
4. **API-First设计**：所有功能API可达，自动化友好
5. **园区+DC统一OS**：AOS-CX跨园区和DC，运维团队技能复用

### 5.3 AFC 的竞争劣势

1. **设备绑定**：仅支持Aruba CX系列，无法管理第三方设备
2. **市场份额小**：DC市场Aruba份额远低于Cisco/华为，生态较弱
3. **Day2深度不足**：相比Arista CVP的流式遥测和AI分析，AFC的Day2能力偏基础
4. **缺乏意图验证**：没有Cisco ACI级别的Pre/Post-change验证能力
5. **AI/ML能力弱**：缺乏智能化运维能力（AIOps依赖Central）


---

## 六、AFC 商业模式与License体系

### 6.1 License模型

AFC采用**按设备订阅制**（Per-Switch Subscription）：

| License层级 | 适用设备 | 订阅周期 | 包含能力 |
|-------------|----------|----------|----------|
| **Tier 1** | CX 6xxx（园区接入） | 1/3/5/7/10年 | 基础Fabric管理 |
| **Tier 2** | CX 8360（DC接入） | 1/3/5/7/10年 | Fabric编排 + 基础安全 |
| **Tier 3** | CX 8325（DC Leaf/Spine） | 1/3/5/7/10年 | 完整Fabric + 高级特性 |
| **Tier 4** | CX 9300/10000（高端DC） | 1/3/5/7/10年 | 全功能 + DSA + 微分段 |

### 6.2 商业模式分析

| 维度 | Aruba AFC | 对AmpCon的启示 |
|------|-----------|---------------|
| **计费单位** | 按交换机台数 | AmpCon可参考，按管理设备数计费 |
| **订阅周期** | 1-10年灵活选择 | 提供多年期折扣，锁定客户 |
| **分层定价** | 按设备型号分Tier | 可按功能模块分层（基础监控/高级编排/AI分析） |
| **捆绑销售** | 与硬件捆绑销售 | AmpCon优势：不绑定硬件，独立软件销售 |
| **试用策略** | 有限期评估License | 建议AmpCon提供30天全功能试用 |

### 6.3 Aruba Central License体系（参考）

Aruba Central采用Foundation/Advanced两层模型：

- **Foundation**：基础监控、配置管理、告警
- **Advanced**：AI-Insights、高级分析、自动化工作流

> **对AmpCon的启示**：可借鉴Foundation/Advanced分层思路，基础可视化免费或低价获客，高级自动化/AI功能作为增值付费。

---

## 七、AFC 对 AmpCon 的借鉴意义

### 7.1 功能差距分析（Gap Analysis）

| 能力维度 | AFC 成熟度 | AmpCon 当前状态 | 差距等级 | 追赶优先级 |
|----------|-----------|----------------|----------|-----------|
| Fabric拓扑可视化 | ★★★★☆ | ★★★★☆（已实现） | 小 | 低 |
| 设备发现与纳管 | ★★★★★ | ★★★☆☆ | 中 | P1 |
| EVPN-VXLAN自动编排 | ★★★★★ | ☆☆☆☆☆（未实现） | 极大 | P0（阶段2） |
| 微分段/安全策略 | ★★★★★ | ☆☆☆☆☆（未实现） | 极大 | P2 |
| Multi-Fabric管理 | ★★★★☆ | ★★☆☆☆（基础多站点） | 大 | P1 |
| 配置漂移检测 | ★★★★☆ | ☆☆☆☆☆（未实现） | 大 | P1 |
| API自动化生态 | ★★★★★ | ★★☆☆☆ | 大 | P1 |
| 告警与事件管理 | ★★★☆☆ | ★★★★☆（已实现） | 无（AmpCon领先） | — |
| Dashboard可视化 | ★★★☆☆ | ★★★★★（已实现） | 无（AmpCon领先） | — |
| 多厂商支持 | ☆☆☆☆☆（仅Aruba） | ★★★★★ | 无（AmpCon核心优势） | — |
| 健康度评估 | ★★★☆☆ | ★★★★☆（已设计） | 无（AmpCon领先） | — |

### 7.2 AmpCon 相对 AFC 的核心优势

| 优势维度 | 具体表现 | 战略意义 |
|----------|---------|----------|
| **多厂商支持** | 管理异构网络（PicOS + 第三方设备） | 不锁定客户，覆盖更广市场 |
| **可视化深度** | Dashboard/拓扑/健康度评估更丰富 | 用户体验差异化 |
| **融合场景** | DC + Campus + Optical 一个平台 | 减少客户工具碎片化 |
| **轻量部署** | 单机运行，快速上线 | 降低中小客户门槛 |
| **AIDC场景** | RoCE/拥塞治理可观测性 | AFC完全不覆盖的领域 |

### 7.3 可借鉴的设计理念

| 借鉴点 | AFC的做法 | AmpCon可采纳的方式 |
|--------|----------|-------------------|
| **意图驱动** | 用户定义业务意图，系统自动转化配置 | 在Fabric构建模块中引入意图抽象层 |
| **工作流向导** | 复杂操作拆解为步骤化向导 | 设备上线、Fabric部署等场景使用向导式UI |
| **统一管理引擎** | 网络+安全统一管理 | 将ACL/QoS策略管理整合到Fabric模块 |
| **API-First** | 所有功能API可达 | 优先建设北向REST API，支持自动化集成 |
| **资源池管理** | IP/VLAN/VNI自动分配 | 引入资源池概念，减少手动分配 |
| **配置检查点** | 支持配置回滚到已知良好状态 | 实现配置版本管理和一键回滚 |

### 7.4 产品策略建议

#### 短期（Quick Win，3个月内）

1. **强化API能力**：参考AFC的REST API设计，优先开放设备管理、拓扑查询、告警订阅等北向API
2. **设备发现增强**：支持LLDP/CDP自动发现，降低设备纳管门槛
3. **配置快照**：实现设备配置的定期快照和Diff对比

#### 中期（差异化投入，6个月内）

4. **轻量Fabric编排**：不做AFC级别的完整Fabric编排，做"Fabric可视化+验证"——展示Fabric状态、检测配置一致性
5. **多厂商Fabric视图**：AFC只能管Aruba设备，AmpCon可以展示混合厂商Fabric的统一拓扑和状态
6. **AIDC深度能力**：这是AFC完全不覆盖的领域，持续深耕RoCE可观测性

#### 长期（架构演进，12个月内）

7. **意图驱动编排**：引入意图抽象层，支持"声明式"网络配置（用户说"我要一个三层Fabric"，系统自动规划）
8. **跨厂商配置下发**：通过Netconf/gNMI/REST实现多厂商设备的配置自动化
9. **安全策略可视化**：展示跨设备的安全策略全景，即使不做策略下发，也提供策略审计价值

---

## 八、Aruba 产品战略对AmpCon融合版的启示

### 8.1 Aruba "从园区到DC" 的统一战略

Aruba的产品战略核心是**AOS-CX统一操作系统**：

- 园区交换机（CX 6xxx）和数据中心交换机（CX 9300/10000）运行同一OS
- 运维团队只需掌握一套CLI/API
- Central可以统一管理园区和DC设备
- License体系统一，简化采购

**对AmpCon的启示**：
- AmpCon的"融合版"定位与Aruba的统一战略方向一致
- 但AmpCon的优势在于**不绑定单一OS**，可以管理异构环境
- 应强化"一个平台管全部"的价值主张，这是Aruba做不到的（Aruba只管自家设备）

### 8.2 Aruba Central 2025年新动向

HPE在2025年推出了Aruba Central的新部署选项：
- **VPC部署**：在客户的虚拟私有云中运行Central
- **On-Premises部署**：满足数据主权要求的本地部署

这表明：**即使是云原生平台，也在向本地部署妥协**。这验证了AmpCon本地部署+轻量化的路线是正确的。

### 8.3 关键战略判断

| 判断 | 依据 | 对AmpCon的影响 |
|------|------|---------------|
| AFC不会成为多厂商平台 | HPE战略绑定自有硬件 | AmpCon的多厂商优势长期有效 |
| Central+AFC双轨会持续 | 云管理和本地编排各有价值 | AmpCon应在一个平台中融合两者的优点 |
| DPU/DSA是趋势 | CX 10000验证了DPU在DC的价值 | AmpCon应预留DPU管理接口的扩展性 |
| AIDC是AFC的盲区 | AFC完全没有RoCE/AI训练网络能力 | AmpCon的AIDC能力是独特差异化 |
| API-First是标配 | 所有主流平台都强调API | AmpCon必须加速API建设 |

---

## 九、总结

### 9.1 一页纸总结

```
┌─────────────────────────────────────────────────────────────────────┐
│           Aruba AFC 分析总结 & AmpCon 策略建议                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AFC 核心定位：Aruba CX 设备的 Fabric 自动化编排引擎                  │
│  AFC 核心优势：统一网络+安全管理、DPU微分段、API-First、低门槛        │
│  AFC 核心劣势：仅支持Aruba设备、Day2深度不足、缺乏AI/ML能力          │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  AmpCon vs AFC 的竞争定位：                                          │
│                                                                      │
│  AFC 强于 AmpCon：Day0/Day1 Fabric编排、微分段、配置下发             │
│  AmpCon 强于 AFC：多厂商、可视化、AIDC、融合场景、轻量部署           │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  AmpCon 策略建议：                                                    │
│  ✓ 不追赶AFC的Fabric编排深度（资源不够，且绑定单厂商无意义）          │
│  ✓ 强化多厂商Fabric可视化（AFC做不到的事）                            │
│  ✓ 深耕AIDC可观测性（AFC完全不覆盖的领域）                           │
│  ✓ 借鉴API-First和意图驱动理念                                       │
│  ✓ 做"轻量Fabric验证"而非"重型Fabric编排"                            │
│                                                                      │
│  一句话：不做"另一个AFC"，做"AFC管不了的事"。                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 后续行动项

| # | 行动项 | 负责人 | 时间 | 产出 |
|---|--------|--------|------|------|
| 1 | 完成AFC API文档研究，输出API设计参考 | 架构组 | 2周 | API设计规范 |
| 2 | 评估AmpCon引入"配置快照+Diff"的技术方案 | 后端组 | 2周 | 技术方案文档 |
| 3 | 调研CX 10000/DPU管理接口开放性 | 架构组 | 3周 | 可行性报告 |
| 4 | 设计AmpCon北向REST API v1.0规范 | 产品+架构 | 4周 | OpenAPI Spec |
| 5 | 完成AIDC场景与AFC的差异化定位文档 | 产品组 | 1周 | 竞争定位PPT |

---

## 十、参考资料

- [HPE Aruba Networking Fabric Composer 产品页](https://www.arubanetworks.com/products/switches/core-and-data-center/fabric-composer/)
- [AFC 7.1 技术文档](https://www.arubanetworks.com/techdocs/AFC/710/Content/afc71olh/abt-hpe-com-fab-man-lea-spi.htm)
- [AFC REST API 开发者文档](https://aruba-fabric-composer.readme.io/docs/getting-started-with-the-afc-api)
- [Aruba Validated Solution Guide - DC Design](https://www.arubanetworks.com/techdocs/VSG/docs/040-dc-design/esp-dc-design-027-management/)
- [AFC EVPN-VXLAN 部署指南](https://www.arubanetworks.com/techdocs/VSG/docs/050-dc-deploy/esp-dc-deploy-120-fabric-deploy/)
- [AFC Multi-Fabric 配置指南](https://www.arubanetworks.com/techdocs/VSG/docs/050-dc-deploy/esp-dc-deploy-140-multifabric/)
- [AFC Ansible Collection](https://developer.arubanetworks.com/afc/docs/getting-started-with-ansible-and-afc)
- [CX 10000 分布式服务交换机](https://www.arubanetworks.com/sea/products/switches/distributed-services-switches/)
- [HPE Aruba Networking Central](https://www.hpe.com/emea_middle_east/en/aruba-central.html)

> Content was rephrased for compliance with licensing restrictions. Information synthesized from multiple HPE/Aruba official documentation sources.

---

## 十一、变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-05-15 | 初始版本 | AmpCon Product Team |

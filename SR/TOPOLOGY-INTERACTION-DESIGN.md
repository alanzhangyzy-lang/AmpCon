# Topology 交互工具设计理念与业务实现流程

| 项目 | 内容 |
|------|------|
| 文档编号 | DESIGN-AMPCON-TOPOLOGY-INTERACTION-001 |
| 版本 | v1.0 |
| 日期 | 2026-05-11 |

---

# 第一部分：Arista CloudVision Topology 竞品分析

## 1. CloudVision Topology 核心设计哲学

基于 [Arista CloudVision Topology 官方配置指南](https://www.arista.com/en/cg-cv/cv-cloudvision-topology) 分析，CloudVision Topology 的设计理念围绕以下五大核心原则构建：

### 1.1 显式可视化表达（Explicit Visual Representation）

CloudVision Topology 提供网络连接关系的显式可视化表达，将抽象的网络拓扑关系转化为可交互的图形界面。其核心价值：

- 设备按 Container（容器）分组，以图形化方式展示网络层级结构
- 链路连线直观表达设备间的物理/逻辑连接关系
- 状态信息通过颜色、图标、徽章等视觉元素实时反馈

### 1.2 层次化折叠与过滤（Hierarchical Collapse and Filter）

大规模网络不可能一次性全部展示，CloudVision 提供三层机制解决这一问题：

**Container 折叠/展开：**
- 设备按容器分组，容器可折叠为单个图标或展开显示内部设备
- 折叠态显示容器级聚合信息（设备数、事件徽章）
- 展开态显示容器内所有设备及其连接关系

**Topology Hierarchy Manager（拓扑层级管理器）：**
- 允许用户自定义拓扑布局层级结构
- 通过 Device Role 标签构建多层级树状结构（如 DC Site → Spine/Leaf/DCI）
- 每层可配置 Display Alignment（水平/垂直排列）
- 设备通过 Tag 分配到对应层级位置

根据 [Arista ATD Lab Guide](https://labguides-dev.testdrive.arista.com/2024.3/cloudvision_portal/topo_hier_mgr/) 的实践：
1. 创建层级结构 → 2. 配置层属性（Device Role, Display Name, Alignment）→ 3. 为设备分配标签 → 4. 系统自动布局

**Topology Filter Builder（拓扑过滤器）：**
- 创建过滤规则排除无关设备
- 支持按设备属性（型号、角色、标签等）过滤
- 过滤后拓扑视图仅显示匹配设备

### 1.3 多协议链路统一展示（Multi-Protocol Link Unification）

CloudVision 统一展示四种协议发现的网络链路：

| 协议 | 全称 | 场景 |
|------|------|------|
| LLDP | Link Layer Discovery Protocol | 物理层邻居发现（所有场景） |
| VXLAN | Virtual Extensible LAN | 数据中心 Overlay 隧道 |
| IPsec | Internet Protocol Security | WAN 加密隧道 |
| DPS | Distributed Path Selection | SD-WAN 路径选择 |

设计意义：拓扑视图不仅展示物理连接，还能展示逻辑 Overlay 和安全隧道关系，提供完整的网络连接视图。

### 1.4 实时与历史双模态（Live and Historical Dual Mode）

- **实时模式**：观察网络当前状态，设备/链路状态实时更新
- **历史模式**：通过时间滑块回溯网络历史状态和性能，支持故障回溯分析

### 1.5 数据中心与园区双场景（DC and Campus Dual Scenario）

- **数据中心**：Spine-Leaf 架构，VXLAN Overlay，高密度设备
- **园区网络**：Core-Distribution-Access 三层架构，LLDP 邻居发现，无线 AP 接入

---

## 2. CloudVision Topology 界面架构分析

### 2.1 整体布局

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CloudVision Portal - Topology Tab                 │
├──────────────────┬──────────────────────────────────────────────────┤
│                  │                                                    │
│  Topology        │              Main Panel (主画布)                   │
│  Overview Pane   │                                                    │
│  (左侧面板)      │   ┌────────────────────────────────────────┐     │
│                  │   │  Container A (可折叠)                    │     │
│  ┌────────────┐  │   │    ├── Device 1 ──┐                    │     │
│  │ Layout Tab │  │   │    ├── Device 2    │ Link               │     │
│  │ Options Tab│  │   │    └── Device 3 ──┘                    │     │
│  └────────────┘  │   └────────────────────────────────────────┘     │
│                  │                    │                               │
│  选中对象时:      │              Link (链路连线)                       │
│  ┌────────────┐  │                    │                               │
│  │Container   │  │   ┌────────────────────────────────────────┐     │
│  │Details     │  │   │  Container B                            │     │
│  │  or        │  │   │    ├── Device 4                         │     │
│  │Device      │  │   │    └── Device 5                         │     │
│  │Details     │  │   └────────────────────────────────────────┘     │
│  │  or        │  │                                                    │
│  │Link        │  │                                                    │
│  │Details     │  │   ┌─────────────────────────────────────┐        │
│  └────────────┘  │   │  Time Slider (时间滑块 - 底部)        │        │
│                  │   └─────────────────────────────────────┘        │
└──────────────────┴──────────────────────────────────────────────────┘
```

### 2.2 核心组件功能

| 组件 | 功能描述 | 交互触发 |
|------|----------|----------|
| **Main Panel** | 网络拓扑主画布，设备按容器分组展示，支持缩放/平移 | 鼠标滚轮缩放、拖拽平移 |
| **Topology Overview Pane** | 左侧概览面板，包含 Layout 和 Options 两个 Tab | 默认显示 |
| **Topology Layout Pane** | 编辑设备布局提示（Layout Hints），调整设备在拓扑中的位置 | 点击设备后进入 Layout Tab |
| **Topology Options Pane** | 拓扑显示选项控制 | 点击 Options 按钮 |
| **Container Details Pane** | 容器详情：设备列表、容器属性、聚合状态 | 点击容器触发 |
| **Device Details Pane** | 设备详情：接口列表、邻居关系、配置信息、事件 | 点击设备触发 |
| **Link Details Panel** | 链路详情：成员链路列表、带宽统计、接口信息 | 点击链路触发 |
| **Topology Hierarchy Manager** | 自定义拓扑层级结构，创建/编辑/删除层级 | 设置入口 |
| **Topology Filter Builder** | 创建/管理过滤器，排除无关设备 | 设置入口 |
| **Flow Visibility** | 流量路径可视化，追踪数据包路径 | 高级功能入口 |

### 2.3 Topology Options 详细功能

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| Show active events | Toggle | 开启 | 在设备上显示活跃事件徽章，按最高严重程度显示；容器聚合显示内部设备事件 |
| Use device images | Toggle | 关闭 | 使用真实设备照片替代抽象图标 |
| Show link utilization | Toggle | 关闭 | 在链路上显示带宽利用率百分比 |
| Show interface labels | Toggle | 关闭 | 在链路端点显示接口名称标签 |

### 2.4 交互模式分析

**选中对象 → 侧面板动态切换：**

| 用户操作 | 主画布反馈 | 左侧面板内容 |
|----------|-----------|-------------|
| 无选中（默认） | 默认状态 | Topology Overview (Layout/Options) |
| 点击 Container | 容器高亮 | Container Details Pane |
| 点击 Device | 设备高亮 | Device Details Pane |
| 点击 Link | 链路高亮 | Link Details Panel |
| 展开 Container | 容器展开显示内部设备 | 保持当前面板 |
| 折叠 Container | 容器折叠为图标 | 保持当前面板 |

**Link Details Panel 关键特性：**
- 如果两个设备之间有多条物理连接，拓扑视图中仅显示一条聚合链路
- 点击聚合链路后，Link Details Panel 展示所有成员链路的详细信息
- 每条成员链路显示：接口名称、带宽、状态、统计数据

### 2.5 Topology Hierarchy Manager 工作流程

```
Step 1: 进入 Topology Settings → Edit Topology Hierarchy
         │
         ▼
Step 2: 创建新的 Network Hierarchy（命名）
         │
         ▼
Step 3: 配置顶层 Layer 属性
         ├── Device Role: (如 DC_Site_Number)
         ├── Display Name: (如 DC Site Number)
         └── Display Alignment: Vertical / Horizontal
         │
         ▼
Step 4: 添加 Sublayer（子层级）
         ├── DC_Spine → sublayer: spine
         ├── DC_Leaf → sublayer: leaf
         └── DCI_and_Hosts → sublayer: leaf, endpoint
         │
         ▼
Step 5: 为每台设备分配 Tags
         ├── Hierarchy: 选择层级名称
         ├── Device Role: spine / leaf / endpoint
         └── 对应层级标签值
         │
         ▼
Step 6: 拓扑视图自动按层级布局展示
```

---

## 3. CloudVision 关键设计模式总结

| 设计模式 | 描述 | 价值 |
|----------|------|------|
| Container 抽象 | 将设备分组为容器，支持折叠/展开 | 管理大规模网络的复杂度 |
| 侧面板联动 | 选中对象时侧面板动态切换内容 | 上下文感知的信息展示 |
| 链路聚合 | 多条物理链路聚合为一条逻辑链路展示 | 减少视觉噪音 |
| 标签驱动布局 | 通过 Tag 系统驱动设备在拓扑中的位置 | 灵活的自定义布局 |
| 事件徽章叠加 | 在设备/容器上叠加事件严重程度徽章 | 快速定位问题 |
| 时间维度 | 时间滑块支持历史状态回溯 | 故障根因分析 |
| 多协议融合 | LLDP/VXLAN/IPsec/DPS 统一展示 | 完整网络视图 |

---

# 第二部分：AmpConNew Topology 设计与业务实现流程

## 4. AmpConNew 参考 Arista CloudVision 的设计映射

### 4.1 设计理念继承与创新

AmpConNew Topology 在继承 CloudVision 核心设计理念的基础上，结合融合控制器的业务特点进行了适配和创新：

| CloudVision 设计理念 | AmpConNew 继承方式 | 创新/差异点 |
|---------------------|-------------------|------------|
| Container 折叠/展开 | Site 卡片折叠/展开 | 采用"就地展开"模式（In-place Expand），不跳转新页面，保持全局上下文 |
| 侧面板动态联动 | 左侧抽屉面板动态切换 | 统一 200px 宽度抽屉，5 种视图按选中对象自动切换 |
| 多协议链路统一展示 | FABRIC_LINKS 质量状态编码 | 简化为 optimal/congested/degraded 三态颜色编码 |
| Topology Hierarchy Manager | 设备角色自动分层 | 固定 4 层结构（Core/Spine → Leaf → Access → AP/Camera），无需手动配置 |
| Topology Filter Builder | 站点搜索过滤 | Overview 面板内置搜索框，实时过滤站点列表 |
| 时间滑块历史回溯 | V2.0 规划 | 当前版本仅支持实时状态 |
| Flow Visibility | V2.0 规划 | 当前版本不支持流量路径追踪 |
| 单一 2D 拓扑视图 | 2D Network + 3D Globe 双视图 | 增加地理维度展示站点分布 |
| 无手动连线能力 | 绘制模式（Draw Mode） | 支持手动添加设备间连线，用于规划态拓扑 |
| 无导出能力 | SVG 导出 | 一键导出当前画布为 SVG 文件 |

### 4.2 核心概念对应关系

| CloudVision 概念 | AmpConNew 概念 | 数据来源 | 说明 |
|-----------------|---------------|----------|------|
| Container | Site 卡片 | MOCK_SITES | 站点作为设备的逻辑容器 |
| Device | Device 节点 | MOCK_DEVICES | 网络设备（交换机、AP、摄像头等） |
| Link (聚合) | Site 间连线 | FABRIC_LINKS | 站点间的聚合链路 |
| Member Link | 跨站设备链路 | INTER_SITE_DEVICE_LINKS | 设备级物理/逻辑链路 |
| Internal Link | 站内设备链路 | SITE_INTERNAL_LINKS | 站点内部设备间连接 |
| Active Events | 告警徽章 | MOCK_ALARMS | 设备/站点级告警 |
| Device Role Tag | device.role | MOCK_DEVICES.role | Core/Spine/Leaf/Access/AP 等 |
| Topology Hierarchy | 4 层自动分层 | 按 role 计算 | 固定层级，无需手动配置 |

---

## 5. AmpConNew Topology 整体交互逻辑设计

### 5.1 页面整体布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AmpConNew Topology Page                           │
├────────────┬────────────────────────────────────────────────────────────┤
│            │  ┌─ Toolbar ──────────────────────────────────────────┐    │
│  Left      │  │ [Interact] [Expand] [Fit] [+] [-] [Refresh] [Draw]│    │
│  Drawer    │  │ [Export]                                           │    │
│  (200px)   │  └───────────────────────────────────────────────────┘    │
│            │                                                            │
│  动态内容:  │              SVG Canvas (主画布)                           │
│            │                                                            │
│  Overview  │   ┌─Site A─┐         ┌─Site B─┐                          │
│    or      │   │ 折叠态  │─────────│ 折叠态  │                          │
│  Device    │   │160×140 │  24ms   │160×140 │                          │
│  Detail    │   └────────┘         └────────┘                          │
│    or      │        │                   │                              │
│  Link      │        │     12ms          │                              │
│  Detail    │        │                   │                              │
│    or      │   ┌─Site C─┐         ┌─Site D─┐                          │
│  Site      │   │ 折叠态  │─────────│ 折叠态  │                          │
│  Neighbor  │   │160×140 │  8ms    │160×140 │                          │
│            │   └────────┘         └────────┘                          │
│            │                                                            │
│            │  ┌─ Legend ───────────────────────────────────────────┐    │
│            │  │ ● Optimal  ● Congested  ● Online  ● Provisioning  │    │
│            │  └───────────────────────────────────────────────────┘    │
│            │                                          [Network][Globe]  │
└────────────┴────────────────────────────────────────────────────────────┘
```

### 5.2 交互状态机

AmpConNew 参考 CloudVision 的"选中对象 → 侧面板联动"模式，设计了以下状态机：

```
                         ┌──────────────────────┐
                         │    IDLE (空闲态)      │
                         │  Drawer: Overview     │
                         └──────────┬───────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
        单击 Site 卡片        双击 Site 卡片       点击 Site 间连线
               │                    │                    │
               ▼                    ▼                    ▼
┌──────────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│  SITE_NEIGHBOR       │ │  SITE_EXPANDED  │ │  INTER_SITE_LINK     │
│  Drawer: SiteInter   │ │  画布: 展开态    │ │  Drawer: SiteInter   │
│  (Neighbors/Members) │ │  Drawer: 保持   │ │  (链路模式)           │
└──────────────────────┘ └────────┬────────┘ └──────────────────────┘
                                  │
                       ┌──────────┼──────────┐
                       │                     │
                点击设备节点            点击设备间链路
                       │                     │
                       ▼                     ▼
            ┌──────────────────┐  ┌──────────────────┐
            │  DEVICE_DETAIL   │  │  LINK_DETAIL     │
            │  Drawer: Device  │  │  Drawer: Link    │
            │  (Info/Neighbor/ │  │  (Metrics/Member/│
            │   Alarms)        │  │   Alarms)        │
            └──────────────────┘  └──────────────────┘

任何状态 → 点击画布空白区域 → 回到 IDLE
任何详情状态 → 点击 ← 返回按钮 → 回到 IDLE
```

### 5.3 左侧抽屉内容决策逻辑

参考 CloudVision 侧面板根据选中对象动态切换的模式：

```
优先级判断链（从高到低）：

1. selectedLink 存在？
   → 显示 LinkDetailView (TOPO-004)
   → 标题: "Connectivity between DeviceA ↕ DeviceB"
   → 内容: 链路指标 + 成员链路 Tab + 告警 Tab

2. selectedDeviceId 存在？
   → 显示 DeviceDetailView (TOPO-003)
   → 标题: "Device Details"
   → 内容: 设备信息 + 邻居 Tab + 告警 Tab

3. selectedInterSiteLink 存在？
   → 显示 SiteInterView 链路模式 (TOPO-006)
   → 标题: "Site or Selected Link"
   → 副标题: "SiteA ⟷ SiteB"
   → 内容: Neighbors Tab + Members Tab

4. selectedSiteNeighborId 存在？
   → 显示 SiteInterView 站点模式 (TOPO-005)
   → 标题: "Site or Selected Link"
   → 副标题: "Current Site: SiteName"
   → 内容: Neighbors Tab + Members Tab

5. 以上均不存在（默认）
   → 显示 GlobalOverview (TOPO-008)
   → 标题: "Overview"
   → 内容: 健康度 + 指标 + 站点列表 Tab + 告警 Tab
```

---

## 6. AmpConNew Topology 业务实现流程

### 6.1 页面加载流程

```
用户点击侧边栏 "Topology" 菜单
  │
  ▼
系统加载数据层：
  ├── MOCK_SITES (站点列表: id, name, siteType, health, deviceCount, alertCount)
  ├── MOCK_DEVICES (设备列表: id, name, role, status, siteId, ip, mac)
  ├── FABRIC_LINKS (站点间链路: from, to, latency, load, quality)
  ├── SITE_INTERNAL_LINKS (站内链路: siteId → [{from, to, fromPort, toPort}])
  ├── INTER_SITE_DEVICE_LINKS (跨站设备链路: fromDevice, toDevice, bandwidth)
  ├── SITE_NEIGHBOR_LINKS (站点邻居链路: fromSiteId, toSiteId, devices)
  └── MOCK_ALARMS (告警: id, severity, message, source, time, status)
  │
  ▼
计算布局：
  ├── Site 卡片网格布局: gridCols=2, spacingX=600, spacingY=500
  ├── 每个 Site 位置: x = col * spacingX, y = row * spacingY
  └── Site 间连线: 从 FABRIC_LINKS 计算起止坐标
  │
  ▼
渲染初始视图：
  ├── SVG 画布: Site 卡片(折叠态) + Site 间连线(颜色编码+延迟标签)
  ├── 左侧抽屉: GlobalOverview (默认)
  ├── 工具栏: 8 个功能按钮
  ├── 图例: 右下角状态图例
  └── 视图切换: 右上角 Network/Globe 按钮
```

### 6.2 Site 卡片展开流程（对标 CloudVision Container Expand）

```
用户双击折叠态 Site 卡片
  │
  ▼
状态更新: expandedSites.add(siteId)
  │
  ▼
数据查询:
  ├── 过滤设备: MOCK_DEVICES.filter(d => d.siteId === siteId)
  └── 查询站内链路: SITE_INTERNAL_LINKS[siteId]
  │
  ▼
设备分层布局（对标 CloudVision Hierarchy Manager 的自动分层）:
  ├── Layer 1 (顶层): role === 'Core' || role === 'Spine'
  ├── Layer 2: role === 'Aggregation' || role === 'Leaf'
  ├── Layer 3: role === 'Access' || role === 'Border'
  └── Layer 4 (底层): role === 'AP' || role === 'Camera' || role === 'OTN'
  │
  ▼
坐标计算:
  ├── 每层设备水平均匀分布: x = siteX + layerWidth / (deviceCount + 1) * index
  └── 层间垂直间距: y = siteY + headerHeight + layerIndex * 80
  │
  ▼
渲染展开态:
  ├── 卡片尺寸: 160×140 → 480×380
  ├── 设备节点: rect + icon + name + status dot
  ├── 站内链路: line (设备间连线)
  └── 检查相邻 Site 是否也展开 → 是则渲染跨站设备链路 (Bezier 曲线)
```

### 6.3 设备详情流程（对标 CloudVision Device Details Pane）

```
用户点击展开态 Site 内的设备节点
  │
  ▼
状态更新: selectedDeviceId = device.id
  │
  ▼
数据查询:
  ├── 设备信息: MOCK_DEVICES.find(d => d.id === deviceId)
  ├── 站内邻居: SITE_INTERNAL_LINKS[siteId].filter(涉及该设备)
  ├── 跨站邻居: INTER_SITE_DEVICE_LINKS.filter(涉及该设备)
  └── 设备告警: MOCK_ALARMS.filter(a => a.source === device.name)
  │
  ▼
左侧抽屉渲染 DeviceDetailView:
  ├── Header: ← 返回按钮 + "Device Details"
  ├── 设备基本信息 (8 字段):
  │   ├── Model: 设备型号
  │   ├── Software: 软件版本
  │   ├── MAC: MAC 地址
  │   ├── Serial No.: 序列号
  │   ├── Status: 在线状态 (Online/Offline/Provisioning)
  │   ├── Uptime: 运行时长
  │   └── Mgmt IP: 管理 IP
  ├── Tab 1 - 设备邻居:
  │   └── 每行: 邻居名称 + 本端端口 ↔ 对端端口 + [View Connectivity]
  └── Tab 2 - 告警列表:
      └── 每行: 严重程度图标 + 告警消息 + 时间
```

### 6.4 链路详情流程（对标 CloudVision Link Details Panel）

```
用户点击展开态 Site 内的设备间链路连线
  │
  ▼
状态更新: selectedLink = { from, to, fromPort, toPort, type }
  │
  ▼
数据查询:
  ├── 两端设备: MOCK_DEVICES.find(from/to)
  ├── 链路指标: Mock 生成 (Throughput, BW Util, Discard, Error, Latency)
  └── 链路告警: MOCK_ALARMS.filter(涉及两端设备)
  │
  ▼
左侧抽屉渲染 LinkDetailView:
  ├── Header: ← 返回按钮 + "Link Details"
  ├── 连接信息: DeviceA (可点击) ↕ DeviceB (可点击)
  ├── 链路指标 (5 项):
  │   ├── Throughput: 2.4 Gbps
  │   ├── Bandwidth Utilization: 45%
  │   ├── Discard Rate: 0.01%
  │   ├── Error Rate: 0.001%
  │   └── Latency: 0.5ms
  ├── Tab 1 - 成员链路 (对标 CloudVision Member Links):
  │   └── 每行: 本端端口 ↔ 对端端口 + 带宽 + 状态
  └── Tab 2 - 告警列表:
      └── 每行: 严重程度图标 + 告警消息 + 时间
```

### 6.5 Site 邻居关系流程（对标 CloudVision Container Details）

```
用户单击折叠态 Site 卡片
  │
  ▼
状态更新: selectedSiteNeighborId = site.id
画布反馈: 卡片蓝色边框高亮
  │
  ▼
数据查询:
  ├── 邻居站点: FABRIC_LINKS.filter(涉及该 Site) → 推导对端 Site 列表
  └── 跨站设备对: SITE_NEIGHBOR_LINKS.filter(涉及该 Site)
  │
  ▼
左侧抽屉渲染 SiteInterView (站点模式):
  ├── Header: ← 返回 + "Site or Selected Link"
  ├── 副标题: "Current Site: {SiteName}"
  ├── Tab 1 - Neighbors:
  │   └── 每行: 站点名称 + 类型 + 链路数 + 状态点(●)
  └── Tab 2 - Members:
      └── 每行: 本端设备 ↔ 对端设备
```

### 6.6 Site 间链路关系流程

```
用户点击 Site 间连线
  │
  ▼
状态更新: selectedInterSiteLink = { fromSiteId, toSiteId }
画布反馈: 连线加粗(strokeWidth: 3→5) + 发光(drop-shadow)
  │
  ▼
数据查询:
  ├── 两端站点: MOCK_SITES.find(fromSiteId/toSiteId)
  └── 设备对: SITE_NEIGHBOR_LINKS.filter(匹配两个站点)
  │
  ▼
左侧抽屉渲染 SiteInterView (链路模式):
  ├── Header: ← 返回 + "Site or Selected Link"
  ├── 副标题: "SiteA ⟷ SiteB"
  ├── Tab 1 - Neighbors: 两端站点各自的邻居列表
  └── Tab 2 - Members: 该连线上的设备对列表
      └── 每行: 本端设备 + 端口 ↔ 对端设备 + 端口 + 带宽 + 状态
```

### 6.7 跨站设备链路流程

```
两个相邻 Site 同时处于展开态
  │
  ▼
系统自动检测:
  INTER_SITE_DEVICE_LINKS.filter(
    fromDevice.siteId ∈ expandedSites &&
    toDevice.siteId ∈ expandedSites
  )
  │
  ▼
坐标计算:
  ├── fromDevice 绝对坐标: siteX + deviceRelativeX, siteY + deviceRelativeY
  ├── toDevice 绝对坐标: 同上
  └── Bezier 控制点: 曲线向上弯曲避免与 Site 卡片重叠
  │
  ▼
渲染:
  ├── SVG <path> Bezier 曲线
  ├── 颜色: active=#22c55e (绿), degraded=#f97316 (橙)
  └── 中点标签: 带宽值 (如 "10G")
  │
  ▼
用户点击曲线 → 复用 LinkDetailView (TOPO-004)
```

### 6.8 画布工具栏流程

| 按钮 | 操作 | 对标 CloudVision | 实现逻辑 |
|------|------|-----------------|----------|
| Interact Tool | 切换拖拽模式 | 默认选择模式 | interactMode = !interactMode |
| Expand All | 展开/折叠全部 | Expand/Collapse All | expandedSites = all / clear |
| Fit View | 自适应视图 | Fit to Screen | 计算边界框 → 最佳缩放 + 居中 |
| Zoom In | 放大 20% | Zoom In | zoom = min(zoom + 0.2, 5.0) |
| Zoom Out | 缩小 20% | Zoom Out | zoom = max(zoom - 0.2, 0.2) |
| Refresh | 重置所有状态 | Refresh | 清除 zoom/pan/selected/expanded |
| Draw Mode | 手动添加连线 | 无（AmpConNew 创新） | 选择起点设备 → 选择终点 → 编辑端口 |
| Export SVG | 导出画布 | 无（AmpConNew 创新） | SVG outerHTML → Blob → download |

---

## 7. AmpConNew 链路颜色编码体系

参考 CloudVision 的链路状态可视化（Show active events + 链路颜色），AmpConNew 采用：

### 7.1 Site 间链路颜色

| 质量状态 | 颜色 | 色值 | 判定条件 |
|----------|------|------|----------|
| Optimal | 绿色 | #22c55e | 延迟正常、无丢包、带宽利用率 < 70% |
| Congested | 橙色 | #f97316 | 带宽利用率 > 70% 或延迟偏高 |
| Degraded | 红色 | #ef4444 | 存在丢包、错误率高、链路劣化 |

### 7.2 设备状态颜色

| 状态 | 颜色 | 色值 | 说明 |
|------|------|------|------|
| Online | 绿色 | #22c55e | 设备在线正常 |
| Provisioning | 蓝色 | #3b82f6 | 设备配置中 |
| Offline | 灰色 | #94a3b8 | 设备离线 |

### 7.3 告警严重程度颜色

| 级别 | 颜色 | 图标 | 对标 CloudVision Events |
|------|------|------|------------------------|
| Critical | 红色 | 🔴 | Critical Event Badge |
| Major | 橙色 | 🟠 | Warning Event Badge |
| Minor | 黄色 | 🟡 | Info Event Badge |
| Warning | 灰色 | ⚪ | - |

---

## 8. 数据流架构

### 8.1 当前架构（Mock 数据）

```
┌─────────────────────────────────────────────────────────────┐
│                    constants.tsx (Mock Data)                  │
│                                                              │
│  MOCK_SITES ─────┐                                          │
│  MOCK_DEVICES ───┤                                          │
│  FABRIC_LINKS ───┼──→ SiteMap.tsx (React State)             │
│  SITE_INTERNAL ──┤         │                                │
│  INTER_SITE ─────┤         ├──→ SVG Canvas (渲染)           │
│  SITE_NEIGHBOR ──┤         └──→ OverviewDrawer (抽屉)       │
│  MOCK_ALARMS ────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 目标架构（REST API）

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Backend API │────→│  React Query /   │────→│  SiteMap.tsx     │
│              │     │  SWR Cache       │     │  (React State)   │
│  GET /sites  │     │                  │     │       │          │
│  GET /devices│     │  自动缓存/刷新    │     │       ├→ Canvas  │
│  GET /links  │     │  乐观更新        │     │       └→ Drawer  │
│  GET /alarms │     │                  │     │                  │
│  WebSocket   │     │  实时推送更新     │     │                  │
└──────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 9. 与 CloudVision 的差异化总结

### 9.1 AmpConNew 独有特性

| 特性 | 说明 | 业务价值 |
|------|------|----------|
| 3D Globe View | 地球视图展示站点地理分布 | 跨国/跨区域网络的直观展示 |
| 就地展开 (In-place Expand) | Site 卡片在画布上直接展开 | 保持全局上下文，无页面跳转 |
| 跨站 Bezier 曲线 | 两站展开后自动显示设备级跨站链路 | 直观展示跨站设备互联关系 |
| 绘制模式 (Draw Mode) | 手动添加设备间连线 | 支持网络规划和设计态拓扑 |
| SVG 导出 | 一键导出当前画布 | 便于文档编写和汇报展示 |
| 数值化健康度 | 0-100 分健康度评分 | 比事件徽章更量化的评估 |
| 三场景支持 | DC + Campus + Optical | 比 CloudVision 多一个光传输场景 |

### 9.2 后续演进路线（对标 CloudVision 能力补齐）

| 版本 | 功能 | 对标 CloudVision | 优先级 |
|------|------|-----------------|--------|
| V1.5 | Topology Filter Builder | 按条件过滤设备/站点 | P2 |
| V1.5 | 设备真实图片 | Use device images 选项 | P3 |
| V2.0 | 时间滑块历史回溯 | Historical State | P1 |
| V2.0 | Flow Visibility | 流量路径可视化 | P1 |
| V2.0 | VXLAN Overlay 拓扑 | 多协议链路展示 | P1 |
| V2.0 | 自定义 Hierarchy | Topology Hierarchy Manager | P2 |
| V3.0 | CloudVision Studios 对标 | 自动化工作流编排 | P3 |

---

## 10. 参考资料

| 来源 | URL | 内容 |
|------|-----|------|
| CloudVision Topology 官方文档 | https://www.arista.com/en/cg-cv/cv-cloudvision-topology | 拓扑功能总览与设计理念 |
| Main Panel of Topology Screen | https://www.arista.com/en/cg-cv/cv-main-panel-of-the-topology-screen | 主画布设计与容器分组 |
| Topology Options Pane | https://www.arista.com/zh/cg-cv/cv-topology-options-pane | 拓扑显示选项 |
| Topology Hierarchy Manager | https://www.arista.com/ko/cg-cv/cv-topology-hierarchy-manager | 自定义层级管理 |
| Topology Filter Builder | https://www.arista.com/zh/cg-cv/cv-topology-filter-builder | 设备过滤器 |
| Device Details Pane | https://www.arista.com/ko/cg-cv/cv-device-details-pane | 设备详情面板 |
| Link Details Panel | https://www.arista.com/zh/cg-cv/cv-link-details-panel | 链路详情面板 |
| ATD Lab Guide - Hierarchy Manager | https://labguides-dev.testdrive.arista.com/2024.3/cloudvision_portal/topo_hier_mgr/ | 层级管理实践指南 |

> Content was rephrased for compliance with licensing restrictions.

# 融合控制器拓扑视图 软件需求规格说明书（SR）

| 项目 | 内容 |
|------|------|
| 文档编号 | SR-AMPCON-TOPOLOGY-001 |
| 版本 | v1.0 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-04-23 |

---

## 1. 依赖与前置条件

### 1.1 SR表单拆解

| SR | SR描述 | 功能说明 | 功能优先级 | 本版SR |
|----|--------|----------|------------|--------|
| TOPO-001 | 全局拓扑视图 | 提供 Network View（2D SVG）和 Globe View（3D 地球）两种全局拓扑展示模式，展示所有 Site 卡片（2×2 网格布局）及 Site 间链路（按质量着色：optimal=绿色, congested=橙色, degraded=红色，带延迟标签） | P0 | ✅ |
| TOPO-002 | Site 卡片展开/折叠 | 双击 Site 卡片展开查看站内设备拓扑（设备按角色层级布局：Core/Spine → Aggregation/Leaf → Access → AP/Camera），再次双击折叠 | P0 | ✅ |
| TOPO-003 | 站内设备详情 | 点击展开后的设备节点，左侧抽屉展示设备基本信息（名称、型号、软件版本、MAC、序列号、在线状态、运行时长、管理IP），两个 Tab：设备邻居（含 "View Connectivity" 链接）和告警列表 | P0 | ✅ |
| TOPO-004 | 站内链路详情 | 点击展开后的设备间链路，左侧抽屉展示 "Connectivity between DeviceA ↕ DeviceB"，链路指标（吞吐量、带宽利用率、丢弃率、错误率、延迟），两个 Tab：成员链路和告警列表 | P0 | ✅ |
| TOPO-005 | Site 邻居关系视图 | 单击未展开的 Site 卡片，左侧抽屉展示 "Site or Selected Link"（副标题 "Current Site: SiteName"），两个 Tab：Neighbors（邻居站点名称、类型、链路数、状态点）和 Members（该站点所有跨站链路的设备对） | P0 | ✅ |
| TOPO-006 | Site 间链路关系视图 | 点击 Site 间连线，左侧抽屉展示 "Site or Selected Link"（副标题 "SiteA ⟷ SiteB"），两个 Tab：Neighbors 和 Members（该条连线上的设备对），连线高亮（加粗 + 发光） | P0 | ✅ |
| TOPO-007 | 跨站设备级链路 | 两个 Site 都展开后，设备级跨站链路以曲线显示（带带宽标签），点击曲线打开 LinkDetailView（复用 TOPO-004 链路详情） | P1 | ✅ |
| TOPO-008 | 全局概览面板 (Global Overview) | 左侧抽屉默认视图：Header "Overview"，全局健康度（3 个图标：DC/Campus/Optical 各自评分），关键指标（站点总数、站点类型分布进度条、设备总数），两个 Tab：站点列表（可搜索）和告警列表 | P0 | ✅ |
| TOPO-009 | 画布交互工具栏 | 左上角工具栏：交互工具、展开/折叠全部、自适应视图、放大、缩小、刷新、绘制模式、导出 SVG | P1 | ✅ |

### 1.2 系统依赖

| 依赖项 | 最低版本 | 说明 |
|--------|----------|------|
| React | ^19.2.3 | UI 框架 |
| TypeScript | ~5.8.2 | 类型检查 |
| Vite | ^6.2.0 | 开发服务器 + 构建工具 |
| Lucide React | ^0.562.0 | 图标组件库 |
| Tailwind CSS | CDN | 原子化 CSS |

### 1.3 网络依赖

| 场景 | 依赖 | 说明 |
|------|------|------|
| 数据加载 | 后端 REST API | 提供 Site、Device、Link、Alarm 数据（当前版本使用 Mock 数据） |
| 告警数据 | 告警采集模块 | 当前版本使用 Mock 数据 `MOCK_ALARMS` |
| 站点邻居链路 | 网络发现模块 | 提供跨站设备互联关系（当前版本使用 `SITE_NEIGHBOR_LINKS` Mock 数据） |

### 1.4 权限依赖

| 操作 | 最低权限 |
|------|----------|
| 查看全局拓扑 | Viewer |
| 展开 Site 卡片 | SiteAdmin |
| 查看设备/链路详情 | Viewer |
| 拖拽 Site 卡片 | SiteAdmin |
| 导出 SVG | SiteAdmin |

> 当前版本（V1.0）无权限控制，所有用户可查看完整拓扑并执行所有操作。后续版本按上表实现。

### 1.5 业务前置条件

| 条件 | 说明 |
|------|------|
| 拓扑数据依赖后端 REST API | 提供 Site、Device、Link 数据（当前版本使用 Mock 数据，定义在 `constants.tsx`） |
| 告警数据依赖告警采集模块 | 当前版本使用 Mock 数据 `MOCK_ALARMS` |
| 站点邻居链路数据依赖网络发现模块 | 提供跨站设备互联关系（当前版本使用 `SITE_NEIGHBOR_LINKS` Mock 数据） |
| 前端技术栈 | React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS + Lucide React Icons |
| 画布渲染 | SVG 原生渲染（后续可迁移至 AntV G6） |

---

## 2. 功能需求

### 2.1 全局拓扑视图 (TOPO-001)

#### 2.1.1 功能说明

**功能描述：** 提供统一的网络拓扑可视化界面，支持 Network View（2D SVG 拓扑图）和 Globe View（3D 地球视图）两种展示模式。Network View 以 SVG 画布展示所有 Site 卡片及 Site 间链路关系，Globe View 以 3D 地球展示站点地理分布。

**触发条件：** 用户进入拓扑页面（点击侧边栏 "Topology" 菜单），默认加载 Network View。

**处理逻辑：**
1. 加载所有 Site 数据（`MOCK_SITES`：名称、类型、位置、健康度、设备数、告警数）
2. 加载 Site 间链路数据（`FABRIC_LINKS`：延迟、负载、质量状态）
3. 根据 Site 数量自动计算 2×2 网格布局（`gridCols=2`，间距 `spacingX=600, spacingY=500`）
4. 渲染 Site 卡片（`CollapsedSiteContent`）和 Site 间连线（带延迟标签）
5. 连线颜色编码：`optimal`（绿色 `#22c55e`）、`congested`（橙色 `#f97316`）、`degraded`（红色 `#ef4444`）
6. 左侧默认展示 Global Overview 面板

**输出结果：** 画布展示所有 Site 卡片和 Site 间链路，左侧展示 Global Overview 面板。

#### 2.1.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Arista CloudVision、Cisco DNA Center 拓扑设计理念：
- 层次化下钻：全局 → Site → Device → Link 逐级深入
- 左侧抽屉面板随选中对象动态切换内容
- Site 间关系通过画布连线 + 抽屉面板双重展示
- 双视图模式（2D 拓扑 + 3D 地球）满足不同场景需求

**（二）业务实现流程**

```
用户进入拓扑页面
  ↓
系统加载 Site 列表 + Site 间链路数据
  ↓
渲染全局拓扑画布（默认 Network View）
  ↓
用户可执行以下操作：
  - 单击 Site 卡片 → 左侧显示 Site 邻居关系（TOPO-005）
  - 双击 Site 卡片 → 展开站内设备拓扑（TOPO-002）
  - 点击 Site 间连线 → 左侧显示链路成员（TOPO-006）
  - 点击展开后的设备节点 → 左侧显示设备详情（TOPO-003）
  - 点击展开后的设备链路 → 左侧显示链路详情（TOPO-004）
  - 切换 Globe View → 3D 地球展示站点地理分布
```

**（三）用户交互流程**

| 用户操作 | 画布反馈 | 左侧抽屉内容 |
|----------|----------|--------------|
| 无选中（默认） | 默认状态 | Global Overview（健康度、指标、站点列表、告警） |
| 单击未展开 Site 卡片 | 卡片高亮（蓝色边框） | Site or Selected Link → Neighbors tab |
| 双击 Site 卡片 | 卡片展开显示站内设备 | 保持当前抽屉内容 |
| 点击 Site 间连线 | 连线高亮加粗 + 发光 | Site or Selected Link → Members tab |
| 点击展开后的设备节点 | 设备节点高亮 | 设备详情（设备邻居、告警列表） |
| 点击展开后的设备链路 | 链路高亮 | 链路详情（成员链路、告警列表） |
| 点击跨站设备链路（两站都展开） | 曲线高亮 | 链路详情（复用 TOPO-004） |
| 点击画布空白区域 | 清除所有选中 | 返回 Global Overview |

#### 2.1.3 功能业务流程

```
全局拓扑加载流程：
  系统启动 → 获取 Site 列表（MOCK_SITES）
    → 获取 Site 间链路（FABRIC_LINKS）
    → 计算 2×2 网格布局
    → 渲染 SVG 画布（Site 卡片 + 连线）
    → 左侧展示 Global Overview

视图切换流程：
  用户点击 Globe View 按钮
    → 切换为 3D 地球视图
    → 站点以地理坐标标注在地球上
    → 站点间连线以弧线展示
  用户点击 Network View 按钮
    → 切换回 2D SVG 拓扑视图
```

#### 2.1.4 原型界面

**A区（画布区域）：**
- SVG 画布，支持缩放（20%~500%）和平移
- Site 卡片折叠态：160×140px，显示站点名称、类型图标、健康度、设备数/在线数/告警数
- Site 卡片展开态：480×380px，显示站内设备拓扑（设备节点 + 站内链路）
- Site 间连线：带延迟标签的彩色连线（颜色编码：绿/橙/红）
- 跨站设备链路：两站都展开后显示的曲线（带带宽标签）

**B区（左侧抽屉面板，宽度 200px）：**
- 可折叠/展开（ChevronLeft/ChevronRight 按钮）
- 根据选中对象动态切换内容（见交互流程表）

**C区（画布工具栏，左上角）：**
- 交互工具、展开/折叠全部、自适应、放大、缩小、刷新、绘制模式、导出 SVG

**D区（图例，右下角）：**
- Optimal / Congested / Online / Provisioning / Offline 状态图例

**E区（视图切换，右上角）：**
- Network View / Globe View 切换按钮

#### 2.1.5 交互说明

**画布交互：**
- 当用户滚动鼠标滚轮时，系统应以鼠标位置为基准缩放视图（范围 20%~500%，步长 10%）
- 当用户拖拽画布空白区域时，系统应平移画布（更新 `panOffset` 状态）
- 当用户拖拽 Site 卡片时，系统应移动该卡片位置（仅在交互模式 `interactMode=true` 下生效）
- 当用户双击 Site 卡片时，系统应展开/折叠该站点的设备拓扑（切换 `expandedSites` 状态）
- 当用户单击未展开的 Site 卡片时，系统应在左侧抽屉显示该站点的邻居关系视图
- 当用户点击 Site 间连线时，系统应高亮该连线（加粗 + 发光效果）并在左侧抽屉显示链路成员视图
- 当用户点击画布空白区域时，系统应清除所有选中状态，左侧抽屉返回 Global Overview

**抽屉面板交互：**
- 当用户点击抽屉中的 ← 返回按钮时，系统应关闭当前详情视图，返回 Global Overview
- 当用户在设备详情中点击 "View Connectivity" 时，系统应切换到链路详情视图
- 当用户在链路详情中点击设备名称时，系统应切换到该设备的详情视图

**视图切换交互：**
- 当用户点击 Globe View 按钮时，系统应切换为 3D 地球视图，保留当前选中状态
- 当用户点击 Network View 按钮时，系统应切换回 2D 拓扑视图

#### 2.1.6 列表字段

**Site 卡片（折叠态）字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 | 显示/隐藏 | 对齐方式 |
|----------|------|----------|------|-----------|----------|
| 1 | name | Site.name | 站点名称 | 显示 | 居中 |
| 2 | siteType | Site.siteType | 站点类型（Data Center / Campus / Optical） | 显示 | 居中 |
| 3 | health | Site.health | 健康度百分比（如 98%） | 显示 | 居中 |
| 4 | deviceCount | Site.deviceCount | 设备总数 | 显示 | 居中 |
| 5 | onlineCount | 计算字段 | 在线设备数（status='online' 的设备数） | 显示 | 居中 |
| 6 | alertCount | Site.alertCount | 告警数 | 显示 | 居中 |

**Site 间连线标签字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | latency | FabricLink.latency | 延迟值（如 "24ms"） |

#### 2.1.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| Site 列表为空 | "No sites available" | 画布居中文字 |
| 链路数据为空 | 不显示连线，无额外提示 | 静默处理 |
| Globe View 加载中 | 显示 Loading 动画 | 加载态 |

#### 2.1.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| Site 数据加载失败 | 保留画布空白状态 | 左侧 Overview 显示空列表 |
| FabricLink 数据缺失 | 仅渲染 Site 卡片，不渲染连线 | 画布无连线 |
| Site 坐标数据异常 | 使用默认网格布局 | 卡片按网格排列 |
| 浏览器不支持 SVG | 降级为文本列表 | 显示站点列表 |

**异常恢复流程：**
- 数据异常 → 用户点击工具栏刷新按钮 → 重置所有状态（缩放、平移、选中、展开） → 重新加载数据

#### 2.1.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看全局拓扑 + 所有站点 | 完整访问 |
| SiteAdmin | 查看全局拓扑 + 授权站点 | 仅可展开授权站点 |
| Viewer | 查看全局拓扑 | 只读，不可操作 |

> 当前版本（V1.0）无权限控制，所有用户可查看完整拓扑。后续版本按上表实现。

#### 2.1.10 功能约束与边界

- **功能边界：** 本期仅支持物理拓扑展示，不支持逻辑拓扑 / 虚拟网络拓扑 / Overlay 拓扑
- **数据约束：** 当前使用 Mock 数据（`constants.tsx`），后续对接后端 REST API
- **设备约束：** 支持 Campus（Core/Aggregation/Access/AP/Camera）、DataCenter（Spine/Leaf/Border/Optical）、Optical（OTN）三种场景设备
- **布局约束：** Site 卡片折叠态固定 160×140px，展开态固定 480×380px；2×2 网格布局
- **性能约束：** 当前无虚拟化渲染，大规模场景（>100 Site）可能存在性能问题
- **视图约束：** Globe View 使用 SVG + 数学投影实现，非真实 WebGL 3D 渲染

#### 2.1.11 非功能需求

| 项目 | 指标 |
|------|------|
| 拓扑页面首次加载 | ≤ 2000ms |
| 画布缩放/平移 | ≤ 16ms (60fps) |
| 抽屉面板切换 | ≤ 100ms |
| SVG 导出 | ≤ 3000ms |

---

### 2.2 Site 卡片展开/折叠 (TOPO-002)

#### 2.2.1 功能说明

**功能描述：** 用户双击 Site 卡片时，卡片从折叠态（160×140px）展开为展开态（480×380px），展示该站点内部的设备拓扑。设备按角色层级自上而下排列：Core/Spine → Aggregation/Leaf → Access → AP/Camera。站内设备之间的链路以直线连接。再次双击已展开的 Site 卡片 Header 区域，卡片折叠回初始状态。

**触发条件：** 用户双击画布上的 Site 卡片。

**处理逻辑：**
1. 用户双击折叠态 Site 卡片
2. 系统将该 Site ID 加入 `expandedSites` Set
3. 加载该 Site 下所有 Device 数据（从 `MOCK_DEVICES` 中按 `siteId` 过滤）
4. 加载站内 Device 间链路数据（从 `SITE_INTERNAL_LINKS` 中按 Site ID 查找）
5. 按设备角色分层计算布局：
   - 第一层（顶部）：Core / Spine 角色设备
   - 第二层：Aggregation / Leaf 角色设备
   - 第三层：Access / Border 角色设备
   - 第四层（底部）：AP / Camera / OTN 角色设备
6. 渲染展开态卡片（`ExpandedSiteContent`），包含设备节点和站内链路
7. 如果相邻 Site 也已展开，同时渲染跨站设备链路曲线

**输出结果：** Site 卡片展开，显示站内设备拓扑图。

#### 2.2.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Cisco DNA Center 的 Site Hierarchy 下钻模式：
- 全局视图中 Site 以卡片形式展示，双击进入站内视图
- 站内设备按网络层级（Core → Distribution → Access）分层排列
- 本方案采用"就地展开"模式（而非跳转新页面），保持全局上下文

**（二）业务实现流程**

```
用户双击折叠态 Site 卡片
  ↓
系统查询该 Site 下的 Device 列表
  ↓
按角色分层排列设备节点
  ↓
渲染站内链路连线
  ↓
卡片尺寸从 160×140 扩展为 480×380
  ↓
画布自动调整布局（其他卡片位置不变）
```

**（三）用户交互流程**

| 用户操作 | 系统响应 |
|----------|----------|
| 双击折叠态 Site 卡片 | 卡片展开，显示站内设备拓扑 |
| 双击展开态 Site 卡片 Header | 卡片折叠回 160×140px |
| 点击工具栏"展开全部"按钮 | 所有 Site 卡片同时展开 |
| 点击工具栏"折叠全部"按钮 | 所有 Site 卡片同时折叠 |

#### 2.2.3 功能业务流程

```
展开流程：
  双击 Site 卡片
    ↓
  expandedSites.add(siteId)
    ↓
  过滤 MOCK_DEVICES（siteId 匹配）
    ↓
  按 role 分层：
    tier1: Core, Spine
    tier2: Aggregation, Leaf
    tier3: Access, Border
    tier4: AP, Camera, OTN, Optical
    ↓
  计算每层设备的 x/y 坐标（水平均匀分布，垂直按层级递增）
    ↓
  渲染 ExpandedSiteContent（设备节点 + 站内链路）
    ↓
  检查相邻 Site 是否也已展开 → 是则渲染跨站设备链路

折叠流程：
  双击展开态 Site 卡片 Header
    ↓
  expandedSites.delete(siteId)
    ↓
  清除该 Site 相关的选中状态（selectedDevice, selectedLink）
    ↓
  卡片恢复为 CollapsedSiteContent（160×140px）
    ↓
  移除相关跨站设备链路曲线
```

#### 2.2.4 原型界面

**折叠态 Site 卡片（160×140px）：**
```
┌──────────────────────────┐
│  🏢 San Jose Campus      │
│  Campus                  │
│  ━━━━━━━━━━━━━━━━━━━━━━  │
│  Health: 98%             │
│  📦 12  ✅ 11  ⚠️ 2      │
│  [Core] [Agg] [AP] [Cam] │
└──────────────────────────┘
```

**展开态 Site 卡片（480×380px）：**
```
┌──────────────────────────────────────────────────┐
│  🏢 San Jose Campus (Campus)  Health: 98%        │
│  ─────────────────────────────────────────────── │
│         [Core-01]    [Core-02]                   │  ← Tier 1: Core
│            │  ╲      ╱  │                        │
│         [Agg-01]    [Agg-02]                     │  ← Tier 2: Aggregation
│            │            │                        │
│       [Access-01]  [Access-02]                   │  ← Tier 3: Access
│        ╱    ╲        ╱    ╲                      │
│   [AP-01] [AP-02] [AP-03] [Cam-01] [Cam-02]     │  ← Tier 4: AP/Camera
└──────────────────────────────────────────────────┘
```

#### 2.2.5 交互说明

- 当用户双击折叠态 Site 卡片时，系统应以动画过渡方式展开卡片（尺寸从 160×140 → 480×380）
- 当用户双击展开态 Site 卡片的 Header 区域时，系统应折叠卡片回初始尺寸
- 当用户双击展开态 Site 卡片内的设备节点时，系统不应触发折叠（双击事件仅在 Header 区域生效）
- 当 Site 卡片展开时，系统应保持其他 Site 卡片的位置不变
- 当用户点击工具栏"展开/折叠全部"按钮时，系统应同时展开或折叠所有 Site 卡片
- 展开态卡片内的设备节点支持单击选中（触发 TOPO-003 设备详情）
- 展开态卡片内的链路连线支持单击选中（触发 TOPO-004 链路详情）

#### 2.2.6 列表字段

**展开态 Site 卡片 Header 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | name | Site.name | 站点名称 |
| 2 | siteType | Site.siteType | 站点类型 |
| 3 | health | Site.health | 健康度百分比 |

**设备节点字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | 设备图标 | Device.role | 按角色显示不同图标（Server/Wifi/Video 等） |
| 2 | name | Device.name | 设备名称（截断显示，最多 12 字符） |
| 3 | status | Device.status | 状态指示点（绿色=online, 灰色=offline, 蓝色=provisioning） |

#### 2.2.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| Site 下无设备 | 展开后显示 "No devices in this site" | 卡片内居中文字 |
| 站内链路数据缺失 | 仅显示设备节点，不显示连线 | 静默处理 |
| 设备名称过长 | 截断为 12 字符 + "..." | 文字截断 |

#### 2.2.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| Device 数据加载失败 | 展开后显示空白区域 | 卡片展开但无设备节点 |
| 设备角色未知 | 归入最底层（tier4） | 设备显示在最底层 |
| 站内链路引用不存在的设备 ID | 跳过该链路，不渲染 | 部分链路缺失 |
| 展开/折叠动画异常 | 直接切换尺寸，跳过动画 | 无过渡效果 |

#### 2.2.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 可展开所有 Site | 完整访问 |
| SiteAdmin | 仅可展开授权 Site | 未授权 Site 双击无响应 |
| Viewer | 不可展开 | 双击无响应 |

> 当前版本（V1.0）无权限控制，所有用户可展开所有 Site。

#### 2.2.10 功能约束与边界

- **尺寸约束：** 折叠态固定 160×140px，展开态固定 480×380px，不支持自定义尺寸
- **层级约束：** 设备分层固定为 4 层（Core/Spine → Aggregation/Leaf → Access/Border → AP/Camera/OTN），不支持自定义层级
- **数量约束：** 每层最多显示 6 个设备节点（超出部分水平压缩），单 Site 最多 50 个设备
- **动画约束：** 当前版本无展开/折叠动画，直接切换尺寸
- **布局约束：** 展开后其他 Site 卡片位置不自动调整，可能出现重叠（用户可手动拖拽调整）

#### 2.2.11 非功能需求

| 项目 | 指标 |
|------|------|
| Site 卡片展开 | ≤ 200ms |
| Site 卡片折叠 | ≤ 200ms |

---

### 2.3 站内设备详情 (TOPO-003)

#### 2.3.1 功能说明

**功能描述：** 用户在展开的 Site 卡片中点击某个设备节点时，左侧抽屉面板切换为设备详情视图（`DeviceDetailView`）。面板展示设备基本信息（名称、型号、软件版本、MAC 地址、序列号、在线状态、运行时长、管理 IP），以及两个 Tab 页：设备邻居（Neighbors，显示与该设备直连的邻居设备列表，每行带 "View Connectivity" 链接）和告警列表（Alarms，显示该设备相关的活跃告警）。

**触发条件：** 用户单击展开态 Site 卡片内的设备节点。

**处理逻辑：**
1. 用户点击设备节点，系统设置 `selectedDeviceId = device.id`
2. 左侧抽屉切换为 `DeviceDetailView` 组件
3. 从 `MOCK_DEVICES` 中查找设备完整信息
4. 从 `SITE_INTERNAL_LINKS` 和 `INTER_SITE_DEVICE_LINKS` 中查找与该设备相关的链路
5. 根据链路数据推导邻居设备列表
6. 从 `MOCK_ALARMS` 中过滤该设备相关的告警（`alarm.source === device.name`）
7. 渲染设备详情面板

**输出结果：** 左侧抽屉显示设备详情，包含基本信息、邻居列表、告警列表。

#### 2.3.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Aruba Central 设备详情面板设计：
- 设备基本信息以 Key-Value 列表展示
- 邻居关系以列表形式展示，支持点击跳转
- 告警以时间线形式展示，按严重程度着色

**（二）业务实现流程**

```
用户点击展开态 Site 内的设备节点
  ↓
系统查询设备基本信息
  ↓
系统查询设备邻居关系（站内链路 + 跨站链路）
  ↓
系统查询设备相关告警
  ↓
左侧抽屉渲染 DeviceDetailView
  ↓
用户可执行：
  - 点击邻居设备的 "View Connectivity" → 跳转链路详情（TOPO-004）
  - 点击 ← 返回按钮 → 返回 Global Overview
```

#### 2.3.3 功能业务流程

```
设备详情加载流程：
  selectedDeviceId 变更
    ↓
  从 MOCK_DEVICES 查找设备信息
    ↓
  从 SITE_INTERNAL_LINKS[siteId] 查找站内链路
    ↓
  从 INTER_SITE_DEVICE_LINKS 查找跨站链路
    ↓
  合并链路数据，推导邻居设备列表
    ↓
  从 MOCK_ALARMS 过滤设备告警
    ↓
  渲染 DeviceDetailView

邻居跳转流程：
  用户点击邻居设备行的 "View Connectivity"
    ↓
  系统构造 link 对象 { from, to, fromPort, toPort, type }
    ↓
  设置 selectedLink = link
    ↓
  左侧抽屉切换为 LinkDetailView（TOPO-004）
```

#### 2.3.4 原型界面

```
┌─────────────────────────────────┐
│ ← Device Details                │
│ ─────────────────────────────── │
│ 📦 WH-Core-01                  │
│                                 │
│ Model        AmpX-Core-96      │
│ Software     PicOS 4.2.1       │
│ MAC          AA:BB:CC:DD:EE:01 │
│ Serial No.   SN-2024-001       │
│ Status       🟢 Online          │
│ Uptime       45d 12h 30m       │
│ Mgmt IP      10.0.1.1          │
│ ─────────────────────────────── │
│ [设备邻居]  [告警列表]           │
│ ─────────────────────────────── │
│ 📦 WH-Core-02                  │
│   Eth1/1 ↔ Eth1/1              │
│   [View Connectivity]          │
│ ─────────────────────────────── │
│ 📦 WH-Agg-01                   │
│   Eth1/2 ↔ Eth1/1              │
│   [View Connectivity]          │
└─────────────────────────────────┘
```

#### 2.3.5 交互说明

- 当用户点击展开态 Site 内的设备节点时，系统应在左侧抽屉显示该设备的详情面板
- 当用户点击设备详情面板的 ← 返回按钮时，系统应清除 `selectedDeviceId`，左侧抽屉返回 Global Overview
- 当用户点击"设备邻居" Tab 时，系统应显示与该设备直连的邻居设备列表
- 当用户点击"告警列表" Tab 时，系统应显示该设备相关的活跃告警
- 当用户点击邻居设备行的 "View Connectivity" 链接时，系统应切换到链路详情视图（TOPO-004），展示该设备与邻居设备之间的链路信息
- 当用户在告警列表中点击某条告警时，当前版本无跳转操作（后续版本支持跳转告警详情）
- 设备节点被选中时，画布上该节点应显示高亮效果（蓝色边框 + 阴影）

#### 2.3.6 列表字段

**设备基本信息字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 | 显示/隐藏 |
|----------|------|----------|------|-----------|
| 1 | name | Device.name | 设备名称 | 显示 |
| 2 | model | Device.model | 设备型号（如 AmpX-Core-96） | 显示 |
| 3 | softwareVersion | Mock 固定值 | 软件版本（如 PicOS 4.2.1） | 显示 |
| 4 | mac | Device.mac | MAC 地址（如 AA:BB:CC:DD:EE:01） | 显示 |
| 5 | serialNumber | Mock 固定值 | 设备序列号（如 SN-2024-001） | 显示 |
| 6 | status | Device.status | 在线状态（Online 🟢 / Offline 🔴 / Provisioning 🔵） | 显示 |
| 7 | uptime | Mock 固定值 | 运行时长（如 45d 12h 30m） | 显示 |
| 8 | ip | Device.ip | 管理 IP 地址 | 显示 |

**设备邻居 Tab 字段：**

| 显示顺序 | 字段 | 内容 |
|----------|------|------|
| 1 | neighborName | 邻居设备名称 |
| 2 | localPort | 本端端口（如 Eth1/1） |
| 3 | remotePort | 对端端口（如 Eth1/1） |
| 4 | action | "View Connectivity" 链接 |

**告警列表 Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | severity | Alarm.severity | 告警级别图标（🔴 critical / 🟠 major / 🟡 minor / ⚪ warning） |
| 2 | message | Alarm.message | 告警消息 |
| 3 | time | Alarm.time | 告警时间 |

#### 2.3.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 设备无邻居 | "No neighbors found" | Tab 内居中文字 |
| 设备无告警 | "No active alarms" | Tab 内居中文字 |
| 设备离线 | Status 字段显示红色 "Offline" | 状态标识 |
| 设备 provisioning | Status 字段显示蓝色 "Provisioning" | 状态标识 |

#### 2.3.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| 设备 ID 在 MOCK_DEVICES 中不存在 | 显示 "Device not found" | 抽屉显示错误提示 |
| 邻居设备数据缺失 | 邻居 Tab 显示空列表 | "No neighbors found" |
| 告警数据加载失败 | 告警 Tab 显示空列表 | "No active alarms" |
| "View Connectivity" 对应链路不存在 | 不触发跳转 | 链接不可点击 |

#### 2.3.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看所有设备详情 | 完整访问 |
| SiteAdmin | 查看授权站点内设备详情 | 仅授权站点 |
| Viewer | 查看设备基本信息 | 只读 |

> 当前版本（V1.0）无权限控制。

#### 2.3.10 功能约束与边界

- **数据约束：** 软件版本（softwareVersion）、序列号（serialNumber）、运行时长（uptime）当前为 Mock 固定值，后续对接设备管理 API
- **端口约束：** 邻居设备的端口信息来源于链路数据，当前 Mock 数据中部分链路无端口信息
- **告警约束：** 告警过滤基于 `alarm.source === device.name`，仅匹配设备名称
- **跳转约束：** "View Connectivity" 仅支持跳转到链路详情，不支持跳转到邻居设备详情（需先返回再点击）

#### 2.3.11 非功能需求

| 项目 | 指标 |
|------|------|
| 设备详情加载 | ≤ 100ms |
| 邻居列表渲染 | ≤ 50ms |

---

### 2.4 站内链路详情 (TOPO-004)

#### 2.4.1 功能说明

**功能描述：** 用户在展开的 Site 卡片中点击两个设备之间的链路连线时，左侧抽屉面板切换为链路详情视图（`LinkDetailView`）。面板标题显示 "Connectivity between DeviceA ↕ DeviceB"，展示链路关键指标（吞吐量 Throughput、带宽利用率 Bandwidth Utilization、丢弃率 Discard Rate、错误率 Error Rate、延迟 Latency），以及两个 Tab 页：成员链路（Members，显示该逻辑链路包含的物理成员链路列表）和告警列表（Alarms，显示该链路相关的活跃告警）。

**触发条件：** 用户单击展开态 Site 卡片内的设备间链路连线。

**处理逻辑：**
1. 用户点击链路连线，系统设置 `selectedLink = { from, to, fromPort, toPort, type }`
2. 左侧抽屉切换为 `LinkDetailView` 组件
3. 从 `MOCK_DEVICES` 中查找两端设备信息
4. 生成 Mock 链路指标数据（吞吐量、带宽利用率、丢弃率、错误率、延迟）
5. 从 `MOCK_ALARMS` 中过滤两端设备相关的告警
6. 渲染链路详情面板

**输出结果：** 左侧抽屉显示链路详情，包含连接信息、链路指标、成员链路、告警列表。

#### 2.4.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Arista CloudVision 链路详情设计：
- 链路以两端设备 + 端口形式展示
- 关键指标以仪表盘 / 数值形式展示
- 成员链路（LAG/ECMP 场景）以列表展示

**（二）业务实现流程**

```
用户点击展开态 Site 内的设备间链路
  ↓
系统查询两端设备信息
  ↓
系统生成链路指标数据
  ↓
系统查询链路相关告警
  ↓
左侧抽屉渲染 LinkDetailView
  ↓
用户可执行：
  - 点击设备名称 → 跳转设备详情（TOPO-003）
  - 切换 Tab 查看成员链路 / 告警
  - 点击 ← 返回按钮 → 返回上一视图
```

#### 2.4.3 功能业务流程

```
链路详情加载流程：
  selectedLink 变更
    ↓
  从 MOCK_DEVICES 查找 from/to 设备信息
    ↓
  生成 Mock 链路指标：
    - Throughput: "2.4 Gbps"
    - Bandwidth Utilization: "45%"
    - Discard Rate: "0.01%"
    - Error Rate: "0.001%"
    - Latency: "0.5ms"
    ↓
  从 MOCK_ALARMS 过滤两端设备告警
    ↓
  渲染 LinkDetailView

设备跳转流程：
  用户点击链路详情中的设备名称
    ↓
  设置 selectedDeviceId = 点击的设备 ID
    ↓
  清除 selectedLink
    ↓
  左侧抽屉切换为 DeviceDetailView（TOPO-003）
```

#### 2.4.4 原型界面

```
┌─────────────────────────────────┐
│ ← Link Details                  │
│ ─────────────────────────────── │
│ Connectivity between            │
│ 📦 WH-Core-01                  │
│        ↕                        │
│ 📦 WH-Agg-01                   │
│ ─────────────────────────────── │
│ LINK METRICS                    │
│ Throughput       2.4 Gbps       │
│ BW Utilization   45%            │
│ Discard Rate     0.01%          │
│ Error Rate       0.001%         │
│ Latency          0.5ms          │
│ ─────────────────────────────── │
│ [成员链路]  [告警列表]           │
│ ─────────────────────────────── │
│ Eth1/2 ↔ Eth1/1  10G  🟢       │
│ Eth1/3 ↔ Eth1/2  10G  🟢       │
└─────────────────────────────────┘
```

#### 2.4.5 交互说明

- 当用户点击展开态 Site 内的设备间链路连线时，系统应在左侧抽屉显示链路详情面板
- 当用户点击链路详情中的设备名称（DeviceA 或 DeviceB）时，系统应跳转到该设备的详情视图（TOPO-003）
- 当用户点击 ← 返回按钮时，系统应清除 `selectedLink`，返回上一视图（如果之前是从设备详情跳转来的，返回设备详情；否则返回 Global Overview）
- 当用户切换到"成员链路" Tab 时，系统应显示该逻辑链路包含的物理成员链路列表
- 当用户切换到"告警列表" Tab 时，系统应显示两端设备相关的活跃告警
- 链路连线被选中时，画布上该连线应显示高亮效果（加粗 + 颜色加深）

#### 2.4.6 列表字段

**链路连接信息字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | fromDeviceName | Device.name (from) | 本端设备名称（可点击） |
| 2 | separator | 固定值 | "↕" 分隔符 |
| 3 | toDeviceName | Device.name (to) | 对端设备名称（可点击） |

**链路指标字段：**

| 显示顺序 | 字段 | 内容 | 单位 |
|----------|------|------|------|
| 1 | throughput | 吞吐量 | Gbps / Mbps |
| 2 | bandwidthUtilization | 带宽利用率 | % |
| 3 | discardRate | 丢弃率 | % |
| 4 | errorRate | 错误率 | % |
| 5 | latency | 延迟 | ms |

**成员链路 Tab 字段：**

| 显示顺序 | 字段 | 内容 |
|----------|------|------|
| 1 | localPort | 本端端口（如 Eth1/2） |
| 2 | remotePort | 对端端口（如 Eth1/1） |
| 3 | bandwidth | 带宽（如 10G） |
| 4 | status | 状态指示点（🟢 active / 🟠 degraded） |

**告警列表 Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | severity | Alarm.severity | 告警级别图标 |
| 2 | message | Alarm.message | 告警消息 |
| 3 | time | Alarm.time | 告警时间 |

#### 2.4.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 成员链路为空 | "No member links" | Tab 内居中文字 |
| 告警为空 | "No active alarms" | Tab 内居中文字 |
| 链路指标数据缺失 | 显示 "N/A" | 字段值占位 |

#### 2.4.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| 链路两端设备 ID 不存在 | 显示 "Unknown Device" | 设备名称显示为 Unknown |
| 链路指标数据加载失败 | 所有指标显示 "N/A" | 指标区域显示占位符 |
| 成员链路数据缺失 | 成员 Tab 显示空列表 | "No member links" |
| 点击设备名称跳转失败 | 保持当前视图不变 | 无响应 |

#### 2.4.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看所有链路详情 | 完整访问 |
| SiteAdmin | 查看授权站点内链路详情 | 仅授权站点 |
| Viewer | 查看链路基本信息 | 只读 |

> 当前版本（V1.0）无权限控制。

#### 2.4.10 功能约束与边界

- **指标约束：** 链路指标当前为 Mock 固定值，后续对接监控 API 获取实时数据
- **成员链路约束：** 成员链路数据来源于 `SITE_INTERNAL_LINKS`，当前 Mock 数据中部分链路无端口/带宽信息
- **告警约束：** 告警过滤基于两端设备名称匹配，可能存在误匹配
- **跳转约束：** 从链路详情跳转到设备详情后，无法直接返回链路详情（需重新点击链路）

#### 2.4.11 非功能需求

| 项目 | 指标 |
|------|------|
| 链路详情加载 | ≤ 100ms |
| 成员链路渲染 | ≤ 50ms |

---

### 2.5 Site 邻居关系视图 (TOPO-005)

#### 2.5.1 功能说明

**功能描述：** 用户单击画布上未展开（折叠态）的 Site 卡片时，左侧抽屉面板切换为 Site 邻居关系视图（`SiteInterView`）。面板标题为 "Site or Selected Link"，副标题为 "Current Site: {SiteName}"。面板包含两个 Tab 页：Neighbors（显示与该站点有链路连接的邻居站点列表，每行包含站点名称、站点类型、链路数量、状态指示点）和 Members（显示该站点所有跨站链路的设备对列表，即所有从该站点出发或到达该站点的 `SITE_NEIGHBOR_LINKS` 记录）。

**触发条件：** 用户单击画布上折叠态的 Site 卡片。

**处理逻辑：**
1. 用户单击折叠态 Site 卡片，系统设置 `selectedSiteNeighborId = site.id`
2. 左侧抽屉切换为 `SiteInterView` 组件
3. 从 `FABRIC_LINKS` 中查找与该 Site 相关的所有链路，推导邻居站点列表
4. 从 `SITE_NEIGHBOR_LINKS` 中查找与该 Site 相关的所有跨站设备链路
5. 渲染 Neighbors Tab（邻居站点列表）和 Members Tab（设备对列表）

**输出结果：** 左侧抽屉显示 Site 邻居关系视图，包含邻居站点列表和跨站链路设备对。

#### 2.5.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Cisco DNA Center Site Topology 设计：
- 站点级别的邻居关系以列表形式展示
- 支持从站点级别下钻到设备级别的链路成员
- 邻居状态通过颜色指示点直观展示

**（二）业务实现流程**

```
用户单击折叠态 Site 卡片
  ↓
系统查询该 Site 的邻居站点（通过 FABRIC_LINKS）
  ↓
系统查询该 Site 的跨站设备链路（通过 SITE_NEIGHBOR_LINKS）
  ↓
左侧抽屉渲染 SiteInterView
  ↓
用户可执行：
  - 在 Neighbors Tab 查看邻居站点列表
  - 在 Members Tab 查看跨站设备对列表
  - 点击 ← 返回按钮 → 返回 Global Overview
```

#### 2.5.3 功能业务流程

```
Site 邻居关系加载流程：
  selectedSiteNeighborId 变更
    ↓
  从 MOCK_SITES 查找当前 Site 信息
    ↓
  从 FABRIC_LINKS 过滤：
    link.from === siteId || link.to === siteId
    ↓
  推导邻居站点列表：
    对每条 FabricLink，取对端 Site ID
    从 MOCK_SITES 查找对端 Site 信息
    统计每个邻居的链路数量
    ↓
  从 SITE_NEIGHBOR_LINKS 过滤：
    link.fromSiteId === siteId || link.toSiteId === siteId
    ↓
  渲染 SiteInterView（Neighbors Tab + Members Tab）

邻居站点点击流程：
  用户点击 Neighbors Tab 中的某个邻居站点
    ↓
  画布高亮该邻居 Site 卡片
    ↓
  （可选）切换 selectedSiteNeighborId 为该邻居站点
```

#### 2.5.4 原型界面

```
┌─────────────────────────────────┐
│ ← Site or Selected Link        │
│   Current Site: San Jose Campus │
│ ─────────────────────────────── │
│ [Neighbors]  [Members]          │
│ ─────────────────────────────── │
│                                 │
│ 🏢 Frankfurt Data Center       │
│    DataCenter · 2 links · 🟢   │
│ ─────────────────────────────── │
│ 🏢 Shanghai Branch             │
│    Campus · 1 link · 🟢        │
│ ─────────────────────────────── │
│ 🏢 London Optical Transport    │
│    Optical · 1 link · 🟢       │
│                                 │
└─────────────────────────────────┘

Members Tab:
┌─────────────────────────────────┐
│ [Neighbors]  [Members]          │
│ ─────────────────────────────── │
│ WH-Core-01 ↔ BJ-Spine-01      │
│ WH-Core-02 ↔ BJ-Spine-02      │
│ WH-Core-01 ↔ NJ-Core-01       │
│ WH-Core-01 ↔ LDN-OTN-01       │
└─────────────────────────────────┘
```

#### 2.5.5 交互说明

- 当用户单击折叠态 Site 卡片时，系统应在左侧抽屉显示该站点的邻居关系视图
- 当用户单击折叠态 Site 卡片时，画布上该卡片应显示高亮效果（蓝色边框）
- 当用户点击 Neighbors Tab 时，系统应显示邻居站点列表
- 当用户点击 Members Tab 时，系统应显示该站点所有跨站链路的设备对列表
- 当用户点击 ← 返回按钮时，系统应清除 `selectedSiteNeighborId`，左侧抽屉返回 Global Overview
- 当用户点击画布空白区域时，系统应清除选中状态，返回 Global Overview
- 当用户双击已选中的 Site 卡片时，系统应展开该 Site（TOPO-002），同时清除邻居关系视图

#### 2.5.6 列表字段

**Neighbors Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | siteName | Site.name | 邻居站点名称 |
| 2 | siteType | Site.siteType | 站点类型（DataCenter / Campus / Optical） |
| 3 | linkCount | 计算字段 | 与当前站点之间的链路数量 |
| 4 | statusDot | FabricLink.quality | 状态指示点（🟢 optimal / 🟠 congested / 🔴 degraded） |

**Members Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | fromDeviceName | SiteNeighborLink.fromDeviceName | 本端设备名称 |
| 2 | separator | 固定值 | "↔" 分隔符 |
| 3 | toDeviceName | SiteNeighborLink.toDeviceName | 对端设备名称 |

#### 2.5.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 无邻居站点 | "No neighbors" | Tab 内居中文字 |
| 无跨站链路成员 | "No connections" | Tab 内居中文字 |
| 站点名称过长 | 截断为 20 字符 + "..." | 文字截断 |

#### 2.5.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| Site ID 在 MOCK_SITES 中不存在 | 显示 "Site not found" | 抽屉显示错误提示 |
| FABRIC_LINKS 中无该 Site 的链路 | Neighbors Tab 显示空列表 | "No neighbors" |
| SITE_NEIGHBOR_LINKS 中无该 Site 的记录 | Members Tab 显示空列表 | "No connections" |
| 邻居站点 ID 在 MOCK_SITES 中不存在 | 跳过该邻居，不显示 | 部分邻居缺失 |

#### 2.5.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看所有站点邻居关系 | 完整访问 |
| SiteAdmin | 查看授权站点的邻居关系 | 仅授权站点 |
| Viewer | 查看邻居关系 | 只读 |

> 当前版本（V1.0）无权限控制。

#### 2.5.10 功能约束与边界

- **触发约束：** 仅折叠态 Site 卡片的单击触发邻居关系视图；展开态 Site 卡片的单击不触发（展开态内部点击触发设备/链路详情）
- **数据约束：** 邻居站点列表基于 `FABRIC_LINKS` 推导，Members 列表基于 `SITE_NEIGHBOR_LINKS` 查询
- **状态约束：** 邻居状态指示点取该邻居与当前站点之间最差链路的质量状态
- **交互约束：** Neighbors Tab 中的邻居站点当前不支持点击跳转（后续版本支持）

#### 2.5.11 非功能需求

| 项目 | 指标 |
|------|------|
| 邻居关系加载 | ≤ 100ms |
| 站点搜索过滤 | ≤ 50ms |

---

### 2.6 Site 间链路关系视图 (TOPO-006)

#### 2.6.1 功能说明

**功能描述：** 用户点击画布上两个 Site 之间的连线时，左侧抽屉面板切换为 Site 间链路关系视图（复用 `SiteInterView` 组件）。面板标题为 "Site or Selected Link"，副标题为 "SiteA ⟷ SiteB"。面板包含两个 Tab 页：Neighbors（显示两端站点的邻居列表）和 Members（显示该条连线上的设备对列表，即 `SITE_NEIGHBOR_LINKS` 中 fromSiteId/toSiteId 匹配该两个站点的记录）。连线在画布上高亮显示（加粗 + 发光效果）。

**触发条件：** 用户单击画布上 Site 间的连线。

**处理逻辑：**
1. 用户点击 Site 间连线，系统设置 `selectedInterSiteLink = { fromSiteId, toSiteId }`
2. 左侧抽屉切换为 `SiteInterView` 组件（链路模式）
3. 从 `MOCK_SITES` 中查找两端站点信息
4. 从 `SITE_NEIGHBOR_LINKS` 中过滤该两个站点之间的跨站设备链路
5. 画布上该连线高亮（`strokeWidth` 加粗 + `filter: drop-shadow` 发光）
6. 渲染 Neighbors Tab 和 Members Tab

**输出结果：** 左侧抽屉显示 Site 间链路关系视图，画布上连线高亮。

#### 2.6.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Juniper Mist 的 WAN Link 详情设计：
- 站点间链路以聚合视图展示
- 支持下钻到设备级别的成员链路
- 链路状态通过颜色和粗细直观展示

**（二）业务实现流程**

```
用户点击 Site 间连线
  ↓
系统识别连线两端 Site ID
  ↓
系统查询两站之间的跨站设备链路
  ↓
画布上连线高亮（加粗 + 发光）
  ↓
左侧抽屉渲染 SiteInterView（链路模式）
  ↓
用户可执行：
  - 在 Neighbors Tab 查看两端站点的邻居
  - 在 Members Tab 查看该连线上的设备对
  - 点击 ← 返回按钮 → 返回 Global Overview
```

#### 2.6.3 功能业务流程

```
Site 间链路关系加载流程：
  selectedInterSiteLink 变更
    ↓
  从 MOCK_SITES 查找 fromSite 和 toSite 信息
    ↓
  从 SITE_NEIGHBOR_LINKS 过滤：
    (link.fromSiteId === fromSiteId && link.toSiteId === toSiteId)
    || (link.fromSiteId === toSiteId && link.toSiteId === fromSiteId)
    ↓
  画布上高亮该连线：
    strokeWidth: 3 → 5
    添加 drop-shadow 发光效果
    ↓
  渲染 SiteInterView（副标题 "SiteA ⟷ SiteB"）

连线取消选中流程：
  用户点击画布空白区域
    ↓
  清除 selectedInterSiteLink
    ↓
  连线恢复正常样式
    ↓
  左侧抽屉返回 Global Overview
```

#### 2.6.4 原型界面

```
┌─────────────────────────────────┐
│ ← Site or Selected Link        │
│   San Jose Campus ⟷            │
│   Frankfurt Data Center         │
│ ─────────────────────────────── │
│ [Neighbors]  [Members]          │
│ ─────────────────────────────── │
│                                 │
│ Members:                        │
│ WH-Core-01 ↔ BJ-Spine-01      │
│   Eth1/49 → Eth1/1  10G  🟢   │
│ ─────────────────────────────── │
│ WH-Core-02 ↔ BJ-Spine-02      │
│   Eth1/49 → Eth1/1  10G  🟢   │
│                                 │
└─────────────────────────────────┘
```

#### 2.6.5 交互说明

- 当用户点击 Site 间连线时，系统应高亮该连线（加粗 `strokeWidth: 5` + 发光 `drop-shadow`）
- 当用户点击 Site 间连线时，系统应在左侧抽屉显示该连线的链路关系视图
- 当用户点击 Neighbors Tab 时，系统应显示两端站点各自的邻居列表
- 当用户点击 Members Tab 时，系统应显示该条连线上的设备对列表（仅该两个站点之间的跨站链路）
- 当用户点击 ← 返回按钮时，系统应清除 `selectedInterSiteLink`，连线恢复正常样式，左侧抽屉返回 Global Overview
- 当用户点击画布空白区域时，系统应清除选中状态，连线恢复正常样式
- 当用户点击另一条 Site 间连线时，系统应切换高亮到新连线，更新抽屉内容

#### 2.6.6 列表字段

**副标题字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | fromSiteName | Site.name (from) | 起始站点名称 |
| 2 | separator | 固定值 | "⟷" 分隔符 |
| 3 | toSiteName | Site.name (to) | 目标站点名称 |

**Neighbors Tab 字段：**（同 TOPO-005 Neighbors Tab）

| 显示顺序 | 字段 | 内容 |
|----------|------|------|
| 1 | siteName | 邻居站点名称 |
| 2 | siteType | 站点类型 |
| 3 | linkCount | 链路数量 |
| 4 | statusDot | 状态指示点 |

**Members Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | fromDeviceName | SiteNeighborLink.fromDeviceName | 本端设备名称 |
| 2 | fromPort | SiteNeighborLink.fromPort | 本端端口 |
| 3 | toDeviceName | SiteNeighborLink.toDeviceName | 对端设备名称 |
| 4 | toPort | SiteNeighborLink.toPort | 对端端口 |
| 5 | bandwidth | SiteNeighborLink.bandwidth | 带宽（如 10G） |
| 6 | status | SiteNeighborLink.status | 状态（🟢 active / 🟠 degraded） |

#### 2.6.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 该连线无设备级链路成员 | "No connections" | Tab 内居中文字 |
| 站点名称过长 | 截断为 18 字符 + "..." | 文字截断 |
| 连线被选中 | 连线加粗 + 发光效果 | 视觉反馈 |

#### 2.6.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| 连线两端 Site ID 不存在 | 显示 "Unknown Site" | 副标题显示 Unknown |
| SITE_NEIGHBOR_LINKS 中无匹配记录 | Members Tab 显示空列表 | "No connections" |
| 连线高亮渲染失败 | 保持默认样式 | 无高亮效果 |
| 两端站点数据不一致 | 以实际数据为准 | 可能显示不完整 |

#### 2.6.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看所有 Site 间链路关系 | 完整访问 |
| SiteAdmin | 查看涉及授权站点的链路关系 | 仅授权站点相关 |
| Viewer | 查看链路关系 | 只读 |

> 当前版本（V1.0）无权限控制。

#### 2.6.10 功能约束与边界

- **数据约束：** Members 列表仅显示 `SITE_NEIGHBOR_LINKS` 中匹配该两个站点的记录，不包含其他站点的链路
- **高亮约束：** 连线高亮效果使用 SVG `filter: drop-shadow`，部分浏览器可能渲染差异
- **交互约束：** 点击连线的判定区域为连线周围 8px 范围（`strokeWidth` 扩大点击热区）
- **与 TOPO-005 的区别：** TOPO-005 展示某个站点的所有邻居关系；TOPO-006 展示两个特定站点之间的链路关系

#### 2.6.11 非功能需求

| 项目 | 指标 |
|------|------|
| 链路关系加载 | ≤ 100ms |
| 连线高亮渲染 | ≤ 16ms |

---

### 2.7 跨站设备级链路 (TOPO-007)

#### 2.7.1 功能说明

**功能描述：** 当画布上两个相邻的 Site 卡片都处于展开态时，系统自动渲染两个站点之间的设备级跨站链路。这些链路以曲线（Bezier Curve）形式显示，从一个站点内的设备节点连接到另一个站点内的设备节点，曲线上带有带宽标签（如 "10G"）。用户点击跨站设备链路曲线时，左侧抽屉显示链路详情（复用 TOPO-004 的 `LinkDetailView`）。

**触发条件：** 两个有链路关系的 Site 卡片同时处于展开态。

**处理逻辑：**
1. 系统检测 `expandedSites` 中是否有两个站点同时展开且存在 `INTER_SITE_DEVICE_LINKS` 记录
2. 对于每条跨站设备链路，计算起始设备节点和目标设备节点在画布上的绝对坐标
3. 使用 Bezier 曲线（`<path>` 元素）连接两个设备节点，曲线向上弯曲以避免与 Site 卡片重叠
4. 在曲线中点位置渲染带宽标签（如 "10G"）
5. 曲线颜色根据链路状态着色：`active`（绿色）、`degraded`（橙色）
6. 用户点击曲线时，系统设置 `selectedLink` 并在左侧抽屉显示 `LinkDetailView`

**输出结果：** 画布上显示跨站设备级链路曲线，点击后左侧抽屉显示链路详情。

#### 2.7.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Arista CloudVision 的跨站链路展示：
- 站点展开后，跨站设备链路以曲线形式直观展示
- 曲线颜色和标签提供链路状态和带宽信息
- 点击曲线可查看详细的链路信息

**（二）业务实现流程**

```
两个相邻 Site 同时展开
  ↓
系统查询 INTER_SITE_DEVICE_LINKS
  ↓
过滤出两个展开站点之间的设备链路
  ↓
计算每条链路的起始/目标设备节点坐标
  ↓
渲染 Bezier 曲线 + 带宽标签
  ↓
用户点击曲线 → 左侧抽屉显示 LinkDetailView
```

#### 2.7.3 功能业务流程

```
跨站链路渲染流程：
  expandedSites 变更
    ↓
  遍历 INTER_SITE_DEVICE_LINKS
    ↓
  对每条链路：
    检查 fromDevice.siteId 和 toDevice.siteId 是否都在 expandedSites 中
    ↓
    是 → 计算 fromDevice 在画布上的绝对坐标 (x1, y1)
         计算 toDevice 在画布上的绝对坐标 (x2, y2)
         计算 Bezier 控制点（曲线向上弯曲）
         渲染 <path> 元素 + 带宽标签
    否 → 跳过

跨站链路点击流程：
  用户点击跨站设备链路曲线
    ↓
  系统构造 link 对象：
    { from: fromDeviceId, to: toDeviceId, fromPort, toPort, type: 'cross-site' }
    ↓
  设置 selectedLink = link
    ↓
  左侧抽屉切换为 LinkDetailView（复用 TOPO-004）
```

#### 2.7.4 原型界面

```
┌─────────── Site A (展开) ───────────┐     ┌─────────── Site B (展开) ───────────┐
│                                      │     │                                      │
│  [Core-01]    [Core-02]              │     │  [Spine-01]    [Spine-02]            │
│      │            │                  │     │      │              │                │
│  [Agg-01]    [Agg-02]               │     │  [Leaf-01]    [Leaf-02]              │
│      │            │                  │     │      │              │                │
│  [Access-01] [Access-02]            │     │  [Border-01]  [Border-02]            │
│                                      │     │                                      │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
         │                                              ↑
         └──────── 10G (曲线，绿色) ────────────────────┘
              Core-01 Eth1/49 → Spine-01 Eth1/1
```

#### 2.7.5 交互说明

- 当两个相邻 Site 同时展开时，系统应自动渲染跨站设备链路曲线
- 当用户点击跨站设备链路曲线时，系统应在左侧抽屉显示链路详情（复用 TOPO-004 LinkDetailView）
- 当用户点击跨站链路曲线时，画布上该曲线应高亮（加粗 + 颜色加深）
- 当任一 Site 折叠时，系统应移除相关的跨站设备链路曲线
- 跨站链路曲线应使用 Bezier 曲线，向上弯曲以避免与 Site 卡片重叠
- 曲线中点位置应显示带宽标签（如 "10G"），标签背景为半透明白色
- 曲线颜色：`active` 状态为绿色（`#22c55e`），`degraded` 状态为橙色（`#f97316`）

#### 2.7.6 列表字段

**跨站链路曲线标签字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | bandwidth | DeviceConnection.bandwidth | 带宽标签（如 "10G"） |

**链路详情字段：**（复用 TOPO-004 LinkDetailView 字段）

| 显示顺序 | 字段 | 内容 |
|----------|------|------|
| 1 | fromDeviceName | 本端设备名称 |
| 2 | fromPort | 本端端口 |
| 3 | toDeviceName | 对端设备名称 |
| 4 | toPort | 对端端口 |
| 5 | bandwidth | 带宽 |
| 6 | status | 链路状态 |
| 7 | 链路指标 | 吞吐量、带宽利用率、丢弃率、错误率、延迟 |

#### 2.7.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 两站之间无跨站设备链路 | 不显示曲线，无额外提示 | 静默处理 |
| 设备节点坐标计算失败 | 不渲染该条曲线 | 静默处理 |
| 带宽标签过长 | 截断为 6 字符 | 文字截断 |

#### 2.7.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| 跨站链路引用的设备不在展开的 Site 中 | 跳过该链路，不渲染 | 部分曲线缺失 |
| 设备节点坐标计算异常（NaN） | 跳过该链路 | 部分曲线缺失 |
| Bezier 曲线渲染异常 | 降级为直线连接 | 曲线变为直线 |
| 点击曲线判定失败 | 扩大点击热区（`strokeWidth: 8`） | 需精确点击 |

#### 2.7.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看所有跨站设备链路 | 完整访问 |
| SiteAdmin | 查看涉及授权站点的跨站链路 | 仅授权站点相关 |
| Viewer | 查看跨站链路 | 只读 |

> 当前版本（V1.0）无权限控制。

#### 2.7.10 功能约束与边界

- **触发约束：** 仅当两个 Site 同时展开时才渲染跨站设备链路，单个 Site 展开不显示
- **数据约束：** 跨站链路数据来源于 `INTER_SITE_DEVICE_LINKS`，当前 Mock 数据仅包含部分站点间的设备链路
- **渲染约束：** Bezier 曲线控制点计算基于两个 Site 卡片的相对位置，卡片位置变化时曲线自动更新
- **性能约束：** 大量跨站链路（>20 条）可能影响渲染性能
- **复用约束：** 点击跨站链路曲线后的详情面板完全复用 TOPO-004 的 `LinkDetailView`，无额外定制

#### 2.7.11 非功能需求

| 项目 | 指标 |
|------|------|
| 跨站链路渲染 | ≤ 200ms |
| 曲线点击响应 | ≤ 100ms |

---

### 2.8 全局概览面板 (TOPO-008)

#### 2.8.1 功能说明

**功能描述：** 左侧抽屉面板的默认视图为全局概览面板（`GlobalOverview`）。当用户未选中任何对象（Site、Device、Link）时，左侧抽屉显示 Global Overview。面板包含以下内容：

1. **Header：** "Overview" 标题
2. **全局健康度：** 3 个图标分别代表 DataCenter、Campus、Optical 三种站点类型，每个图标下方显示该类型站点的平均健康度评分
3. **关键指标：** 站点总数（Site Count）、站点类型分布（各类型占比进度条）、设备总数（Device Count）
4. **两个 Tab 页：**
   - 站点列表（Sites）：可搜索的站点列表，每行显示站点名称、类型、健康度、设备数
   - 告警列表（Alarms）：活跃告警列表，按严重程度排序

**触发条件：** 用户进入拓扑页面（默认显示）；或用户清除所有选中状态（点击画布空白区域、点击返回按钮）。

**处理逻辑：**
1. 从 `MOCK_SITES` 计算全局健康度（按 siteType 分组取平均值）
2. 从 `MOCK_SITES` 计算关键指标（站点总数、类型分布、设备总数）
3. 从 `MOCK_ALARMS` 过滤活跃告警（`status === 'active'`）
4. 渲染 GlobalOverview 面板

**输出结果：** 左侧抽屉显示全局概览面板。

#### 2.8.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Cisco DNA Center Dashboard 设计：
- 全局健康度以图标 + 评分形式直观展示
- 关键指标以数字 + 进度条形式展示
- 站点列表支持搜索和过滤
- 告警列表按严重程度排序，支持快速定位

**（二）业务实现流程**

```
用户进入拓扑页面 / 清除选中状态
  ↓
系统计算全局健康度（按站点类型分组）
  ↓
系统计算关键指标（站点数、类型分布、设备数）
  ↓
系统加载活跃告警列表
  ↓
左侧抽屉渲染 GlobalOverview
  ↓
用户可执行：
  - 在站点列表中搜索站点
  - 点击站点列表中的站点 → 画布定位到该站点
  - 查看告警列表
```

#### 2.8.3 功能业务流程

```
全局概览加载流程：
  无选中状态（默认）
    ↓
  计算全局健康度：
    DC 健康度 = avg(MOCK_SITES.filter(s => s.siteType === 'DataCenter').map(s => s.health))
    Campus 健康度 = avg(MOCK_SITES.filter(s => s.siteType === 'Campus').map(s => s.health))
    Optical 健康度 = avg(MOCK_SITES.filter(s => s.siteType === 'Optical').map(s => s.health))
    ↓
  计算关键指标：
    站点总数 = MOCK_SITES.length
    DC 数量 / Campus 数量 / Optical 数量
    设备总数 = sum(MOCK_SITES.map(s => s.deviceCount))
    ↓
  加载活跃告警：
    MOCK_ALARMS.filter(a => a.status === 'active')
    ↓
  渲染 GlobalOverview

站点搜索流程：
  用户在搜索框输入关键词
    ↓
  实时过滤站点列表（匹配 name 或 location）
    ↓
  更新站点列表显示
```

#### 2.8.4 原型界面

```
┌─────────────────────────────────┐
│ Overview                        │
│ ─────────────────────────────── │
│ GLOBAL HEALTH                   │
│                                 │
│  🏢 DC    🏫 Campus   🔗 Optical│
│   100       95          95      │
│ ─────────────────────────────── │
│ KEY METRICS                     │
│                                 │
│ Sites           4               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ DataCenter  ████░░░░░░  1 (25%) │
│ Campus      ████████░░  2 (50%) │
│ Optical     ████░░░░░░  1 (25%) │
│                                 │
│ Devices         68              │
│ ─────────────────────────────── │
│ [站点列表]  [告警列表]           │
│ ─────────────────────────────── │
│ 🔍 Search sites...              │
│ ─────────────────────────────── │
│ 🏢 San Jose Campus              │
│    Campus · 98% · 12 devices    │
│ ─────────────────────────────── │
│ 🏢 Frankfurt Data Center        │
│    DataCenter · 100% · 42 devs  │
│ ─────────────────────────────── │
│ 🏢 Shanghai Branch              │
│    Campus · 92% · 8 devices     │
│ ─────────────────────────────── │
│ 🏢 London Optical Transport     │
│    Optical · 95% · 6 devices    │
└─────────────────────────────────┘
```

#### 2.8.5 交互说明

- 当用户进入拓扑页面时，系统应默认在左侧抽屉显示 Global Overview
- 当用户清除所有选中状态时（点击画布空白区域、点击返回按钮），系统应在左侧抽屉显示 Global Overview
- 当用户在搜索框输入关键词时，系统应实时过滤站点列表（匹配站点名称或位置）
- 当用户点击站点列表中的某个站点时，系统应在画布上高亮该站点卡片，并切换到该站点的邻居关系视图（TOPO-005）
- 当用户切换到"站点列表" Tab 时，系统应显示可搜索的站点列表
- 当用户切换到"告警列表" Tab 时，系统应显示活跃告警列表（按严重程度排序：critical > major > minor > warning > info）
- 全局健康度图标应根据评分着色：≥90 绿色、70~89 橙色、<70 红色

#### 2.8.6 列表字段

**全局健康度字段：**

| 显示顺序 | 字段 | 内容 | 图标 |
|----------|------|------|------|
| 1 | dcHealth | DataCenter 平均健康度 | 🏢 Server 图标 |
| 2 | campusHealth | Campus 平均健康度 | 🏫 Globe 图标 |
| 3 | opticalHealth | Optical 平均健康度 | 🔗 Layers 图标 |

**关键指标字段：**

| 显示顺序 | 字段 | 内容 |
|----------|------|------|
| 1 | siteCount | 站点总数 |
| 2 | siteTypeDistribution | 站点类型分布（DC/Campus/Optical 各自数量和占比进度条） |
| 3 | deviceCount | 设备总数 |

**站点列表 Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | name | Site.name | 站点名称 |
| 2 | siteType | Site.siteType | 站点类型 |
| 3 | health | Site.health | 健康度百分比 |
| 4 | deviceCount | Site.deviceCount | 设备数量 |

**告警列表 Tab 字段：**

| 显示顺序 | 字段 | 数据来源 | 内容 |
|----------|------|----------|------|
| 1 | severity | Alarm.severity | 告警级别图标（🔴🟠🟡⚪） |
| 2 | message | Alarm.message | 告警消息 |
| 3 | source | Alarm.source | 告警来源 |
| 4 | time | Alarm.time | 告警时间 |

#### 2.8.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 站点列表为空 | "No sites available" | Tab 内居中文字 |
| 搜索无结果 | "No sites match your search" | Tab 内居中文字 |
| 告警列表为空 | "No active events" | Tab 内居中文字 |
| 某类型站点不存在 | 该类型健康度显示 "N/A" | 数值占位 |

#### 2.8.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| MOCK_SITES 数据为空 | 所有指标显示 0 或 N/A | 空面板 |
| 健康度计算异常（除零） | 显示 "N/A" | 健康度显示 N/A |
| MOCK_ALARMS 数据为空 | 告警 Tab 显示空列表 | "No active events" |
| 搜索输入特殊字符 | 转义处理，正常搜索 | 无异常 |

#### 2.8.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 查看全局概览（所有站点） | 完整访问 |
| SiteAdmin | 查看全局概览（仅授权站点） | 健康度和指标仅计算授权站点 |
| Viewer | 查看全局概览 | 只读 |

> 当前版本（V1.0）无权限控制。

#### 2.8.10 功能约束与边界

- **数据约束：** 全局健康度基于 `Site.health` 字段计算，当前为 Mock 固定值
- **搜索约束：** 站点搜索为前端本地过滤（匹配 `name` 和 `location` 字段），不支持模糊搜索
- **排序约束：** 告警列表按严重程度排序（critical > major > minor > warning > info），同级别按时间倒序
- **刷新约束：** 全局概览数据在页面加载时计算一次，不支持自动刷新（需手动点击工具栏刷新按钮）
- **进度条约束：** 站点类型分布进度条为静态渲染，不支持动画

#### 2.8.11 非功能需求

| 项目 | 指标 |
|------|------|
| 全局概览加载 | ≤ 100ms |
| 站点搜索过滤 | ≤ 50ms |
| 告警列表渲染 | ≤ 100ms |

---

### 2.9 画布交互工具栏 (TOPO-009)

#### 2.9.1 功能说明

**功能描述：** 画布左上角提供一组交互工具栏按钮，用于控制画布的缩放、平移、节点操作等。工具栏包含以下按钮（从上到下排列）：

1. **Interact Tool（交互工具）：** 切换交互模式，启用后可拖拽 Site 卡片调整位置
2. **Expand/Collapse All（展开/折叠全部）：** 一键展开或折叠所有 Site 卡片
3. **Fit View（自适应视图）：** 将所有节点缩放至当前视口可见范围
4. **Zoom In（放大）：** 以画布中心为基准放大视图（步长 20%）
5. **Zoom Out（缩小）：** 以画布中心为基准缩小视图（步长 20%）
6. **Refresh（刷新）：** 重置所有状态（缩放、平移、选中、展开），恢复初始视图
7. **Draw Mode（绘制模式）：** 切换绘制模式（当前版本为占位功能，后续支持手动绘制链路）
8. **Export SVG（导出）：** 将当前画布导出为 SVG 文件

**触发条件：** 用户点击工具栏中的任意按钮。

**处理逻辑：**
1. 工具栏渲染为垂直排列的按钮组，固定在画布左上角
2. 每个按钮使用 Lucide React 图标
3. 按钮点击后执行对应操作，部分按钮有 toggle 状态（Interact Tool、Draw Mode）
4. 缩放范围限制在 20%~500%

**输出结果：** 画布状态根据用户操作更新。

#### 2.9.2 竞品功能设计及流程说明

**（一）设计理念描述**

参考 Figma / draw.io 的画布工具栏设计：
- 工具栏固定在画布边缘，不随画布缩放/平移移动
- 按钮以图标形式展示，hover 显示 tooltip
- 常用操作（缩放、平移）放在显眼位置

**（二）业务实现流程**

```
用户点击工具栏按钮
  ↓
系统识别按钮类型
  ↓
执行对应操作：
  - Interact Tool → 切换 interactMode 状态
  - Expand/Collapse All → 展开或折叠所有 Site
  - Fit View → 计算最佳缩放比例和偏移量
  - Zoom In/Out → 调整 zoom 值
  - Refresh → 重置所有状态
  - Draw Mode → 切换 drawMode 状态
  - Export SVG → 生成并下载 SVG 文件
```

#### 2.9.3 功能业务流程

```
Interact Tool 流程：
  点击按钮 → interactMode = !interactMode
    ↓
  interactMode=true: Site 卡片可拖拽
  interactMode=false: Site 卡片不可拖拽（默认）

Expand/Collapse All 流程：
  点击按钮
    ↓
  检查当前是否有 Site 展开：
    有展开 → 折叠所有（expandedSites.clear()）
    无展开 → 展开所有（expandedSites = new Set(allSiteIds)）

Fit View 流程：
  点击按钮
    ↓
  计算所有 Site 卡片的边界框（minX, minY, maxX, maxY）
    ↓
  计算最佳缩放比例 = min(viewportWidth / boundingWidth, viewportHeight / boundingHeight)
    ↓
  计算居中偏移量
    ↓
  设置 zoom 和 panOffset

Zoom In/Out 流程：
  点击 Zoom In → zoom = min(zoom + 0.2, 5.0)
  点击 Zoom Out → zoom = max(zoom - 0.2, 0.2)

Refresh 流程：
  点击按钮
    ↓
  重置所有状态：
    zoom = 1.0
    panOffset = { x: 0, y: 0 }
    expandedSites.clear()
    selectedDeviceId = null
    selectedLink = null
    selectedSiteNeighborId = null
    selectedInterSiteLink = null
    interactMode = false
    drawMode = false

Export SVG 流程：
  点击按钮
    ↓
  获取 SVG 元素的 outerHTML
    ↓
  创建 Blob 对象（type: 'image/svg+xml'）
    ↓
  创建下载链接并触发下载
    ↓
  文件名格式：topology-export-{timestamp}.svg
```

#### 2.9.4 原型界面

```
┌──────┐
│  🖱️  │  ← Interact Tool (toggle)
├──────┤
│  ⬜  │  ← Expand/Collapse All
├──────┤
│  ⊞  │  ← Fit View
├──────┤
│  🔍+ │  ← Zoom In
├──────┤
│  🔍- │  ← Zoom Out
├──────┤
│  🔄  │  ← Refresh
├──────┤
│  ✏️  │  ← Draw Mode (toggle, 占位)
├──────┤
│  📥  │  ← Export SVG
└──────┘
```

工具栏位置：画布左上角，距离顶部 16px，距离左侧 16px（在抽屉面板右侧）。

#### 2.9.5 交互说明

- 当用户点击 Interact Tool 按钮时，系统应切换交互模式（按钮高亮表示激活状态），激活后 Site 卡片可拖拽
- 当用户点击 Expand/Collapse All 按钮时，系统应展开或折叠所有 Site 卡片（智能判断：有展开则全部折叠，无展开则全部展开）
- 当用户点击 Fit View 按钮时，系统应将所有节点缩放至当前视口可见范围，居中显示
- 当用户点击 Zoom In 按钮时，系统应以画布中心为基准放大视图（步长 20%，最大 500%）
- 当用户点击 Zoom Out 按钮时，系统应以画布中心为基准缩小视图（步长 20%，最小 20%）
- 当用户点击 Refresh 按钮时，系统应重置所有状态（缩放、平移、选中、展开），恢复初始视图
- 当用户点击 Draw Mode 按钮时，系统应切换绘制模式（当前版本为占位功能，按钮可点击但无实际效果）
- 当用户点击 Export SVG 按钮时，系统应将当前画布导出为 SVG 文件并触发浏览器下载
- 工具栏按钮 hover 时应显示 tooltip（按钮功能名称）
- Toggle 类按钮（Interact Tool、Draw Mode）激活时应显示高亮背景色

#### 2.9.6 列表字段

**工具栏按钮列表：**

| 显示顺序 | 按钮名称 | 图标（Lucide） | 类型 | 快捷键（后续） |
|----------|----------|----------------|------|----------------|
| 1 | Interact Tool | `MousePointer` | Toggle | V |
| 2 | Expand/Collapse All | `ChevronDown` / `Minus` | Action | E |
| 3 | Fit View | `Maximize` | Action | F |
| 4 | Zoom In | `Plus` | Action | Ctrl + = |
| 5 | Zoom Out | `Minus` | Action | Ctrl + - |
| 6 | Refresh | `RotateCcw` | Action | R |
| 7 | Draw Mode | `Pencil` | Toggle | D |
| 8 | Export SVG | `Download` | Action | Ctrl + S |

#### 2.9.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| Hover Interact Tool | "Toggle interact mode" | Tooltip |
| Hover Expand/Collapse | "Expand all / Collapse all" | Tooltip |
| Hover Fit View | "Fit to viewport" | Tooltip |
| Hover Zoom In | "Zoom in" | Tooltip |
| Hover Zoom Out | "Zoom out" | Tooltip |
| Hover Refresh | "Reset view" | Tooltip |
| Hover Draw Mode | "Draw mode (coming soon)" | Tooltip |
| Hover Export | "Export as SVG" | Tooltip |
| 缩放达到上限 | Zoom In 按钮变灰（disabled） | 按钮禁用 |
| 缩放达到下限 | Zoom Out 按钮变灰（disabled） | 按钮禁用 |

#### 2.9.8 异常与容错处理

| 异常场景 | 处理策略 | 用户感知 |
|----------|----------|----------|
| Fit View 计算异常（无节点） | 保持当前缩放和偏移 | 无变化 |
| Export SVG 失败（浏览器限制） | 显示 console.error | 无下载文件 |
| 缩放超出范围 | 限制在 20%~500% | 按钮禁用 |
| Refresh 后数据加载失败 | 保持空白画布 | 画布空白 |

#### 2.9.9 权限控制要求

| 角色 | 权限 | 说明 |
|------|------|------|
| SuperAdmin | 所有工具栏功能 | 完整访问 |
| SiteAdmin | 所有工具栏功能 | 完整访问 |
| Viewer | 缩放、平移、Fit View | 不可展开/折叠、不可拖拽 |

> 当前版本（V1.0）无权限控制，所有用户可使用所有工具栏功能。

#### 2.9.10 功能约束与边界

- **位置约束：** 工具栏固定在画布左上角，不随画布缩放/平移移动
- **Draw Mode 约束：** 当前版本为占位功能，按钮可点击但无实际绘制效果，后续版本实现
- **Export 约束：** 导出为 SVG 格式，不支持 PNG/PDF 导出（后续版本支持）
- **快捷键约束：** 当前版本不支持键盘快捷键，后续版本实现
- **缩放约束：** 缩放范围 20%~500%，步长 20%（滚轮缩放步长 10%）
- **Tooltip 约束：** 当前版本使用 HTML `title` 属性实现 tooltip，后续迁移为自定义 Tooltip 组件

#### 2.9.11 非功能需求

| 项目 | 指标 |
|------|------|
| 工具栏操作响应 | ≤ 100ms |
| SVG 导出 | ≤ 3000ms |
| 缩放/平移帧率 | ≥ 60fps |

---

## 3. 需求原理说明

### 3.1 功能实现原理

前端采用 React 19 + TypeScript 5.8 + SVG 原生渲染实现拓扑画布：

**画布渲染：**
- 使用 SVG `<g>` 元素组合 Site 卡片、设备节点、链路连线
- Site 卡片折叠态使用 `<foreignObject>` 嵌入 HTML 内容
- Site 卡片展开态使用 SVG 原生元素（`<rect>`, `<circle>`, `<text>`, `<line>`）
- Site 间连线使用 `<line>` 元素，跨站设备链路使用 `<path>` Bezier 曲线

**布局算法：**
- Site 卡片使用 2×2 网格布局（`gridCols=2`，`spacingX=600`, `spacingY=500`）
- 站内设备按角色分层排列（4 层：Core/Spine → Aggregation/Leaf → Access/Border → AP/Camera/OTN）
- 每层设备水平均匀分布，垂直间距固定

**状态管理：**
- 使用 React `useState` 管理所有交互状态
- 状态优先级链（决定左侧抽屉内容）：`selectedLink` → `selectedDevice` → `selectedSite`（展开态） → `selectedInterSiteLink` → `selectedSiteNeighbor` → `GlobalOverview`

**抽屉面板：**
- 条件渲染链：根据当前选中状态渲染对应的详情组件
- 面板宽度固定 200px，支持折叠/展开

### 3.2 技术选型对比

| 方案 | 选型 | 备选方案 | 选择理由 |
|------|------|----------|----------|
| 画布渲染 | SVG 原生 | Canvas 2D / WebGL | 轻量、无额外依赖、支持 CSS 样式、DOM 事件绑定简单、可导出 SVG |
| 图表库 | 未使用 | AntV G6 / D3.js / Cytoscape.js | 当前 Mock 阶段 SVG 足够，后续大规模场景迁移 G6 |
| 3D 地球 | SVG + 数学投影 | Three.js / CesiumJS / Mapbox GL | 纯前端实现，无 WebGL 依赖，轻量 |
| UI 组件 | Lucide React Icons + Tailwind CSS | Ant Design / Material UI | 轻量图标库 + 原子化 CSS，无重量级 UI 框架依赖 |
| 状态管理 | React useState | Zustand / Redux / MobX | 当前状态复杂度可控，后续迁移 Zustand |

### 3.3 规格类约束条件

| 约束类别 | 约束内容 | 当前值 | 目标值（后续） |
|----------|----------|--------|----------------|
| Site 数量 | 最大支持 Site 数 | ≤20 | ≤200 |
| Device/Site | 单 Site 最大设备数 | ≤50 | ≤500 |
| 链路数量 | 最大链路数 | ≤100 | ≤5000 |
| 画布缩放 | 缩放范围 | 20%~500% | 10%~1000% |
| 抽屉宽度 | 面板宽度 | 200px | 200~400px（可调） |
| SVG 导出 | 最大导出尺寸 | 无限制 | ≤10000×10000px |

### 3.4 外部依赖说明

#### 3.4.1 三方件依赖

| 类别 | 包名 | 版本约束 | 用途 |
|------|------|----------|------|
| 框架 | react | ^19.2.3 | UI 框架 |
| 框架 | react-dom | ^19.2.3 | DOM 渲染 |
| 图标 | lucide-react | ^0.562.0 | 图标组件库（Server, Globe, Wifi, Video, Cpu 等） |
| 构建 | vite | ^6.2.0 | 开发服务器 + 构建工具 |
| 类型 | typescript | ~5.8.2 | 类型检查 |
| 样式 | tailwindcss | CDN | 原子化 CSS（通过 CDN 引入） |

#### 3.4.2 内部依赖

| 模块 | 文件 | 依赖说明 |
|------|------|----------|
| 类型定义 | types.ts | Site, Device, Alarm, Client 等 TypeScript 接口 |
| Mock 数据 | constants.tsx | MOCK_SITES, MOCK_DEVICES, MOCK_ALARMS, SITE_NEIGHBOR_LINKS |
| 主应用 | App.tsx | 路由和页面切换 |

---

## 4. 总体技术方案

### 4.1 系统定位与边界

融合控制器拓扑视图是 AmpCon Fusion Controller 平台的核心可视化模块，负责：

- **上游：** 接收后端 REST API 提供的 Site / Device / Link / Alarm 数据（当前使用 Mock 数据）
- **下游：** 无直接下游，纯展示层；用户可从拓扑视图跳转到站点管理、设备管理等模块
- **边界：**
  - ✅ 负责：拓扑可视化、交互操作、状态管理、数据展示
  - ❌ 不负责：数据采集、告警处理、设备配置、网络发现、链路监控

### 4.2 总体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        前端 SPA (React 19)                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  SiteMap.tsx  │  │  Overview    │  │  Detail Views      │  │
│  │  (SVG 画布)   │  │  Drawer.tsx  │  │  (Device/Link/     │  │
│  │              │  │  (左侧抽屉)   │  │   Site/Global)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                 │                    │              │
│  ┌──────┴─────────────────┴────────────────────┴───────────┐  │
│  │              React State (useState)                      │  │
│  │  zoom, panOffset, expandedSites, selectedDeviceId,      │  │
│  │  selectedLink, selectedSiteNeighborId,                   │  │
│  │  selectedInterSiteLink, interactMode, drawMode           │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────────┐  │
│  │              Mock Data Layer (constants.tsx)              │  │
│  │  MOCK_SITES, MOCK_DEVICES, MOCK_ALARMS,                 │  │
│  │  FABRIC_LINKS, SITE_INTERNAL_LINKS,                     │  │
│  │  INTER_SITE_DEVICE_LINKS, SITE_NEIGHBOR_LINKS           │  │
│  │  → 后续替换为 REST API + React Query / SWR              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Type Definitions (types.ts)                  │  │
│  │  Site, Device, Alarm, FabricLink, SiteNeighborLink,      │  │
│  │  DeviceConnection, PluginMetadata                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 关键技术选型

| 技术领域 | 选型 | 版本 | 说明 |
|----------|------|------|------|
| 前端框架 | React | 19.2.3 | 组件化开发，Hooks API |
| 类型系统 | TypeScript | 5.8.2 | 静态类型检查 |
| 构建工具 | Vite | 6.2.0 | 快速 HMR，ESBuild 预构建 |
| 样式方案 | Tailwind CSS | CDN | 原子化 CSS，无构建步骤 |
| 图标库 | Lucide React | 0.562.0 | 轻量 SVG 图标组件 |
| 画布渲染 | SVG 原生 | - | 后续迁移 AntV G6 |
| 状态管理 | React useState | - | 后续迁移 Zustand |
| 数据获取 | Mock 数据 | - | 后续迁移 REST API + React Query |

---

## 5. 模块设计概述

### 5.1 模块划分

| 模块 | 文件 | 职责 | 代码行数（估） |
|------|------|------|----------------|
| 拓扑画布 | SiteMap.tsx | 全局拓扑渲染、Site 卡片（折叠/展开）、链路连线、画布交互（缩放/平移/拖拽）、工具栏 | ~1500 行 |
| 抽屉面板 | OverviewDrawer.tsx | 左侧面板容器、视图切换逻辑、GlobalOverview、DeviceDetailView、LinkDetailView、SiteInterView | ~1200 行 |
| 数据层 | constants.tsx | Mock 数据定义（MOCK_SITES, MOCK_DEVICES, MOCK_ALARMS, SITE_NEIGHBOR_LINKS, FABRIC_LINKS 等） | ~500 行 |
| 类型定义 | types.ts | TypeScript 接口定义（Site, Device, Alarm, Client, PluginMetadata 等） | ~100 行 |
| 设备详情抽屉 | DeviceDetailDrawer.tsx | 独立设备详情组件（从其他页面复用） | ~200 行 |

### 5.2 模块间关系

```
SiteMap.tsx (画布主组件)
  │
  ├── NetworkView (2D SVG 拓扑)
  │   ├── CollapsedSiteContent (折叠态 Site 卡片)
  │   │   └── 显示: name, siteType, health, deviceCount, onlineCount, alertCount
  │   ├── ExpandedSiteContent (展开态 Site 卡片)
  │   │   ├── Site Header (name, siteType, health)
  │   │   ├── Device Nodes (按角色分层排列)
  │   │   └── Internal Links (站内设备链路)
  │   ├── FabricLinks (Site 间连线)
  │   │   └── 显示: latency 标签, quality 颜色编码
  │   ├── CrossSiteDeviceLinks (跨站设备链路曲线)
  │   │   └── 显示: bandwidth 标签, status 颜色
  │   └── CanvasToolbar (画布工具栏)
  │       └── 8 个工具按钮
  │
  ├── GlobeView (3D 地球视图)
  │   └── SVG + 数学投影实现
  │
  └── OverviewDrawer (左侧抽屉面板)
      ├── GlobalOverview (全局概览 - 默认视图)
      │   ├── Global Health (DC/Campus/Optical 健康度)
      │   ├── Key Metrics (站点数、类型分布、设备数)
      │   ├── Sites Tab (可搜索站点列表)
      │   └── Alarms Tab (活跃告警列表)
      ├── DeviceDetailView (设备详情 - TOPO-003)
      │   ├── Device Info (8 个基本信息字段)
      │   ├── Neighbors Tab (设备邻居 + View Connectivity)
      │   └── Alarms Tab (设备告警)
      ├── LinkDetailView (链路详情 - TOPO-004)
      │   ├── Connection Info (DeviceA ↕ DeviceB)
      │   ├── Link Metrics (5 个指标)
      │   ├── Members Tab (成员链路)
      │   └── Alarms Tab (链路告警)
      └── SiteInterView (站点邻居/链路关系 - TOPO-005/006)
          ├── Header (Site or Selected Link)
          ├── Subtitle (Current Site / SiteA ⟷ SiteB)
          ├── Neighbors Tab (邻居站点列表)
          └── Members Tab (跨站设备对列表)
```

---

## 6. 性能与容量方案

### 6.1 前端页面加载响应时间目标

| 页面/操作 | 指标要求 | 当前实测 | 说明 |
|-----------|----------|----------|------|
| 拓扑页面首次加载 | ≤ 2000ms | ~800ms | Mock 数据无网络延迟 |
| Site 卡片展开 | ≤ 200ms | ~50ms | 本地状态切换 |
| Site 卡片折叠 | ≤ 200ms | ~30ms | 本地状态切换 |
| 抽屉面板切换 | ≤ 100ms | ~20ms | 条件渲染 |
| 画布缩放/平移 | ≤ 16ms (60fps) | ~8ms | SVG transform |
| 工具栏操作响应 | ≤ 100ms | ~10ms | 状态更新 |
| SVG 导出 | ≤ 3000ms | ~500ms | DOM 序列化 |
| 站点搜索过滤 | ≤ 50ms | ~5ms | 前端本地过滤 |

### 6.2 容量规划

| 维度 | 当前支持 | 目标支持（后续） | 瓶颈分析 |
|------|----------|------------------|----------|
| Site 数量 | ≤20 | ≤200 | SVG DOM 节点数，需迁移 Canvas/WebGL |
| Device/Site | ≤50 | ≤500 | 展开态卡片内节点数，需虚拟化渲染 |
| 总设备数 | ≤200 | ≤10000 | 内存占用，需分页加载 |
| 链路数量 | ≤100 | ≤5000 | SVG path 渲染性能 |
| 告警数量 | ≤500 | ≤10000 | 列表渲染，需虚拟滚动 |
| 并发用户 | 无限制（纯前端） | 无限制 | 无服务端状态 |

### 6.3 性能优化策略（后续版本）

| 优化方向 | 策略 | 预期收益 |
|----------|------|----------|
| 画布渲染 | 迁移至 AntV G6（Canvas 渲染） | 支持 >1000 节点 |
| 大列表 | 虚拟滚动（react-window） | 告警/设备列表 >1000 条 |
| 数据加载 | 分页 + 懒加载 | 减少首屏数据量 |
| 状态管理 | 迁移至 Zustand | 减少不必要的重渲染 |
| 缓存 | React Query 缓存 | 减少重复请求 |
| 布局计算 | Web Worker 离线计算 | 避免主线程阻塞 |

---

## 7. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-04-23 | 初始版本，覆盖全局拓扑、站点下钻、设备/链路详情、站点邻居/链路成员视图 | AmpCon Product Team |
| v1.0 | 2026-04-24 | 补全 TOPO-002 ~ TOPO-009 功能需求详述 | AmpCon Product Team |

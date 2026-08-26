# AIDC Node Addition UI 设计方案

## 设计目标

在现有 Node Addition > Create Bare Metal Node > Switch Port Group 的基础上，扩展 AIDC 场景的 VLAN/网关配置能力。通过 VLAN Domain 是否为空作为分支判断，在不破坏现有 Cloud DC 流程的前提下，为 AIDC 场景增加 L3 Direct 和 L2 VLAN Access 两种接入模式。

---

## 现有 UI 结构（保持不变的部分）

```
Create Bare Metal Node
├── [上方区域] Node 基本信息（IP、用户名、密码等）
│
└── Switch Port Group
    ├── Port Group Name *          [文本输入]
    ├── VLAN Domain *              [下拉选择]  ← 改为可选
    ├── Switch                     [下拉选择]（单选一台 Leaf）
    ├── NIC Port Group *           [下拉选择]
    ├── Port Mode *                [Radio: Access / Trunk]
    ├── LAG Mode *                 [Radio: LACP / Static LAG]
    ├── Physical Link Count per Leaf Switch *  [数字输入]
    ├── Select NIC Ports           [表格: VLAN Domain | Sysname | Port]
    └── + Switch Port Group        [添加更多 Port Group]
```

---

## 改造后的 UI 结构

### 状态 A：VLAN Domain 已填写（Cloud DC 模式 — 现有逻辑不变）

```
Switch Port Group
├── Port Group Name *          [文本输入]
├── VLAN Domain                [下拉选择] ← 有值
├── Switch                     [下拉选择]
├── NIC Port Group *           [下拉选择]
├── Port Mode *                [Radio: Access / Trunk]      ← 现有
├── LAG Mode *                 [Radio: LACP / Static LAG]
├── Physical Link Count per Leaf Switch *  [数字输入]
├── Select NIC Ports           [表格]
└── + Switch Port Group
```

**效果**：与当前完全一致，Cloud DC 用户无感知。

---

### 状态 B：VLAN Domain 为空（AIDC 模式 — 新增逻辑）

```
Switch Port Group
├── Port Group Name *          [文本输入]
├── VLAN Domain                [下拉选择] ← 留空 / 显示占位符 "None (AIDC Mode)"
├── Switch *                   [下拉选择]（单选一台 Leaf）
├── NIC Port Group *           [下拉选择]
│
├── ┌─────────────────────────────────────────────────────┐
│   │  ★ Access Configuration（VLAN Domain 为空时显示）    │
│   │                                                     │
│   │  Access Mode *    [Radio: ● L3 Direct (/31)         │
│   │                           ○ L2 VLAN Access    ]     │
│   │                                                     │
│   │  ── L3 Direct 模式 ──                               │
│   │  IP Pool *        [下拉选择: Select IP Pool ▼]      │
│   │  MTU              [数字输入: 9216]                   │
│   │                                                     │
│   │  ── 或 L2 VLAN Access 模式 ──                       │
│   │  VLAN ID *        [数字输入: 100]                    │
│   │  Gateway IP       [文本输入: 10.100.1.1/24]         │
│   │  MTU              [数字输入: 9216]                   │
│   └─────────────────────────────────────────────────────┘
│
├── LAG Mode *                 [Radio: LACP / Static LAG]
│   （L3 Direct 模式时可隐藏或置灰，因为通常不做 LAG）
├── Physical Link Count per Leaf Switch *  [数字输入]
├── Select NIC Ports           [表格: Sysname | Port]
│   （VLAN Domain 列隐藏，因为没有 VD）
└── + Switch Port Group        [克隆当前配置到下一个 Leaf]
```

---

## 交互细节

### 1. VLAN Domain 字段行为

- 默认显示下拉，占位符 "Select VLAN Domain (optional)"
- 用户选择后 → 走现有 Cloud DC 逻辑
- 用户不选（留空）→ 下方出现 "Access Configuration" 区块
- 如果用户先选了再清空 → 隐藏 Port Mode，显示 Access Configuration

### 2. Access Mode 切换

- 选择 L3 Direct → 显示 IP Pool + MTU，隐藏 VLAN ID / Gateway
- 选择 L2 VLAN Access → 显示 VLAN ID + Gateway + MTU，隐藏 IP Pool
- 默认选中 L3 Direct（AIDC GPU Backend 主流）

### 3. LAG Mode 在 L3 Direct 时

- L3 Direct 模式下 LAG 无意义（/31 点对点单链路）
- 可选方案：隐藏 LAG Mode 字段 / 或置灰显示 "N/A"
- L2 VLAN Access 模式下 LAG 仍可用

### 4. "+ Switch Port Group" 按钮增强

新增 "Clone" 功能：
- 点击后弹出提示："Clone current Port Group config to a new Leaf?"
- 自动复制所有配置（Access Mode / IP Pool / VLAN ID / Gateway / MTU）
- 只需用户重新选择 Switch（另一台 Leaf）和 NIC Port Group
- 适合 AIDC 场景快速为 8 台 Leaf 批量创建 Port Group

### 5. Select NIC Ports 表格适配

- VLAN Domain 有值时：表格列为 [VLAN Domain | Sysname | Port]（现有）
- VLAN Domain 为空时：表格列为 [Sysname | Port | Allocated IP]
  - Allocated IP 列在 L3 Direct 模式下自动填充（从 IP Pool 分配的 /31）
  - L2 VLAN Access 模式下隐藏此列

---

## IP 分配预览

L3 Direct 模式下，用户选择 IP Pool 后，Select NIC Ports 表格自动显示分配预览：

```
┌───────────────┬──────────────┬─────────────────────────────┐
│ Sysname       │ Port         │ Allocated IP                │
├───────────────┼──────────────┼─────────────────────────────┤
│ Leaf-01       │ Eth1/1       │ 10.100.0.0/31 → Server .1   │
│ Leaf-01       │ Eth1/2       │ 10.100.0.2/31 → Server .3   │
│ Leaf-01       │ Eth1/3       │ 10.100.0.4/31 → Server .5   │
│ ...           │ ...          │ ...                         │
│ Leaf-01       │ Eth1/8       │ 10.100.0.14/31 → Server .15 │
└───────────────┴──────────────┴─────────────────────────────┘
```

用户可在部署前确认 IP 分配是否符合预期。

---

## 页面完整 Wireframe（AIDC 场景）

```
┌─────────────────────────────────────────────────────────────────────┐
│  Resource > Resource Interconnection > Node Addition > Bare Metal > Create │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Create Bare Metal Node                                             │
│                                                                     │
│  [Node Info 区域 — 顶部，显示已添加的 Node 列表]                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │ No Data / 已有 Node 列表                         │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Switch Port Group                                        🗑️        │
│                                                                     │
│  Port Group Name *    [GPU-Rail-01                ]                 │
│                                                                     │
│  VLAN Domain          [None (AIDC Mode)          ▼]                │
│                                                                     │
│  Switch *             [Leaf-01 (10.0.1.1)        ▼]                │
│                                                                     │
│  NIC Port Group *     [AI-Fabric-8x400G          ▼]                │
│                                                                     │
│  ┌─ Access Configuration ─────────────────────────────────────┐    │
│  │                                                             │    │
│  │  Access Mode *                                              │    │
│  │  ● L3 Direct (/31)    ○ L2 VLAN Access                     │    │
│  │                                                             │    │
│  │  IP Pool *         [DC-Server-Link-Pool (10.100.0.0/16) ▼]  │    │
│  │                                                             │    │
│  │  MTU               [9216                ]                   │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Physical Link Count per Leaf Switch *  [1                ]         │
│                                                                     │
│  Select NIC Ports                                                   │
│  ┌──────────────┬──────────────┬──────────────────────────┐        │
│  │ Sysname      │ Port         │ Allocated IP             │        │
│  ├──────────────┼──────────────┼──────────────────────────┤        │
│  │ Leaf-01      │ Eth1/1       │ 10.100.0.0/31            │        │
│  │ Leaf-01      │ Eth1/2       │ 10.100.0.2/31            │        │
│  │ Leaf-01      │ Eth1/3       │ 10.100.0.4/31            │        │
│  │ Leaf-01      │ Eth1/4       │ 10.100.0.6/31            │        │
│  │ Leaf-01      │ Eth1/5       │ 10.100.0.8/31            │        │
│  │ Leaf-01      │ Eth1/6       │ 10.100.0.10/31           │        │
│  │ Leaf-01      │ Eth1/7       │ 10.100.0.12/31           │        │
│  │ Leaf-01      │ Eth1/8       │ 10.100.0.14/31           │        │
│  └──────────────┴──────────────┴──────────────────────────┘        │
│                                                                     │
│  + Switch Port Group (Clone)                                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                          [Cancel]  [Save]  [Deploy] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## L2 VLAN Access 模式 Wireframe

```
│  ┌─ Access Configuration ─────────────────────────────────────┐    │
│  │                                                             │    │
│  │  Access Mode *                                              │    │
│  │  ○ L3 Direct (/31)    ● L2 VLAN Access                     │    │
│  │                                                             │    │
│  │  VLAN ID *         [100                 ]                   │    │
│  │                                                             │    │
│  │  Gateway IP        [10.100.1.1/24       ]                   │    │
│  │                                                             │    │
│  │  MTU               [9216                ]                   │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Select NIC Ports                                                   │
│  ┌──────────────┬──────────────┐                                   │
│  │ Sysname      │ Port         │                                   │
│  ├──────────────┼──────────────┤                                   │
│  │ Leaf-01      │ Eth1/1       │                                   │
│  │ Leaf-01      │ Eth1/2       │                                   │
│  │ ...          │ ...          │                                   │
│  └──────────────┴──────────────┘                                   │
```

---

## UI 提示词（Prompt for UI/UX Designer or AI Tool）

### 提示词（中文）

```
请基于 FS AmpCon-DC 控制器的现有 "Create Bare Metal Node" 页面设计一个改进版 UI。

背景：
- 这是一个数据中心网络管理控制器的"裸金属节点添加"页面
- 当前页面有一个 "Switch Port Group" 区块，包含：Port Group Name、VLAN Domain（下拉）、Switch（下拉）、NIC Port Group（下拉）、Port Mode（Access/Trunk 单选）、LAG Mode（LACP/Static 单选）、Physical Link Count、Select NIC Ports 表格
- 设计风格：左侧青绿色(#0ABAB5)导航栏，白色内容区，表单使用标准输入框和下拉框，按钮为青绿色圆角

改造需求：
1. VLAN Domain 字段从必填改为可选（下拉中增加 "None" 选项或允许留空）
2. 当 VLAN Domain 为空时，在 NIC Port Group 下方、LAG Mode 上方，新增一个可折叠/展开的 "Access Configuration" 配置区块：
   - Access Mode 单选按钮：L3 Direct (/31) | L2 VLAN Access
   - L3 Direct 模式显示：IP Pool（下拉选择）、MTU（数字输入，默认9216）
   - L2 VLAN Access 模式显示：VLAN ID（数字输入）、Gateway IP（文本输入，带/掩码格式提示）、MTU
3. 当 VLAN Domain 有值时，隐藏 "Access Configuration" 区块，显示现有的 Port Mode（Access/Trunk）
4. Select NIC Ports 表格：
   - VLAN Domain 有值时：列为 [VLAN Domain | Sysname | Port]（现有）
   - VLAN Domain 为空 + L3 Direct 时：列为 [Sysname | Port | Allocated IP]，Allocated IP 自动填充
   - VLAN Domain 为空 + L2 VLAN 时：列为 [Sysname | Port]
5. "+ Switch Port Group" 按钮旁增加 "(Clone)" 文字提示，点击后复制当前配置到新的 Port Group
6. 底部操作栏：Cancel | Save | Deploy 三个按钮

请输出高保真 wireframe 或 mockup，保持与 AmpCon-DC 现有视觉风格一致。
```

### 提示词（English）

```
Design an improved UI for the "Create Bare Metal Node" page in the FS AmpCon-DC data center network management controller.

Current page context:
- Left sidebar: teal (#0ABAB5) navigation with menu items (Dashboard, Physical Network, Resource, Device, Service Provision, Monitor, Maintain, System)
- Main content area: white background, standard form inputs, teal action buttons
- Existing "Switch Port Group" section contains: Port Group Name, VLAN Domain (dropdown), Switch (dropdown), NIC Port Group (dropdown), Port Mode (Access/Trunk radio), LAG Mode (LACP/Static radio), Physical Link Count, Select NIC Ports table

Design requirements:
1. Make "VLAN Domain" optional (add "None" option or allow empty)
2. When VLAN Domain is empty, show a new "Access Configuration" card/section below NIC Port Group:
   - Access Mode radio: "L3 Direct (/31)" | "L2 VLAN Access"
   - L3 Direct shows: IP Pool (dropdown), MTU (number input, default 9216)
   - L2 VLAN Access shows: VLAN ID (number), Gateway IP (text with CIDR hint), MTU
3. When VLAN Domain has a value, hide Access Configuration and show existing Port Mode (Access/Trunk)
4. Select NIC Ports table adapts columns:
   - With VLAN Domain: [VLAN Domain | Sysname | Port]
   - Without + L3 Direct: [Sysname | Port | Allocated IP] (auto-populated)
   - Without + L2 VLAN: [Sysname | Port]
5. Add "Clone" capability to "+ Switch Port Group" button for quickly duplicating config to other Leaf switches
6. Bottom action bar: Cancel | Save | Deploy buttons

Output a high-fidelity wireframe or mockup consistent with AmpCon-DC's existing visual style (teal accent, clean white forms, minimal borders).
```

---

## 设计注意事项

1. **Access Configuration 区块**使用浅灰色背景或细边框卡片包裹，与其他字段形成视觉层次区分
2. **Allocated IP 列**使用等宽字体（monospace），方便核对 IP 地址
3. **Clone 操作**弹出确认对话框，预填所有配置项，只让用户重选 Switch 和 NIC Port Group
4. **Deploy 按钮**为主操作按钮（实心青绿色），Save 为次要（描边），Cancel 为文本按钮
5. **Gateway IP 字段**增加 placeholder 提示格式："e.g. 10.100.1.1/24"
6. **表格为空时**显示 "Select NIC Port Group to preview port allocation"

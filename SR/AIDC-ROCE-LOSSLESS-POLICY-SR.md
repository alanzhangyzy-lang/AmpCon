# RoCE Lossless Policy Studio 软件需求规格说明书（SR）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-ROCE-FORM-001 |
| Studio 名称 | RoCE Lossless Policy |
| 版本 | v1.3 |
| 日期 | 2026-09-16 |
| 状态 | Draft |
| 适用产品 | AmpCon-DC AIDC Network |

## 目录

1. SR清单
   - 1.1 SR表单拆解
   - 1.2 依赖与前置条件
2. 功能需求详述
   - 2.1 Policy & CNP
   - 2.2 Queue Configuration
   - 2.3 Device & Interface
   - 2.4 Switch Templates
   - 2.5 Studio公共表单
3. 功能评审（Review）
   - 3.1 评审人员
   - 3.2 评审结果
   - 3.3 遗留问题

> 本 SR 只拆解 `RoCE Lossless Policy` Studio 表单，不包含验收标准和测试场景矩阵，也不展开 Tasks、Change Control、设备执行、回滚或 API 设计。

## 1. SR清单

### 1.1 SR表单拆解

| SR编号 | 一级功能 | 二级功能 | 主要表单/操作 |
|---|---|---|---|
| SR-RLP-001 | Policy & CNP | Basic Configuration | Policy Name、Fabric |
| SR-RLP-002 | Policy & CNP | Congestion Notification | Trust Mode、CNP Value、CNP Queue ID |
| SR-RLP-003 | Queue Configuration | RoCE Queue | Create、Edit、Delete、调度参数 |
| SR-RLP-004 | Device & Interface | Assignment Management | Select Devices、Bulk Edit、Bulk Delete |
| SR-RLP-005 | Device & Interface | Device Selection | Role Filter、Search、Select All |
| SR-RLP-006 | Device & Interface | Interface Selection | Bulk RoCE、Bulk PFC、逐接口状态 |
| SR-RLP-007 | Switch Templates | Global Interface Configuration | PFC Watchdog、Deadlock 参数 |
| SR-RLP-008 | Switch Templates | PFC Configuration | Queue Buffer 参数 |
| SR-RLP-009 | Switch Templates | WRED Configuration | Threshold、Drop Probability、ECN |
| SR-RLP-010 | Studio公共表单 | Workspace Context | Workspace、Review、Save、Previous/Next/Apply |

### 1.2 依赖与前置条件

| 依赖项 | 前置条件 | 表单行为 |
|---|---|---|
| Workspace | 已选择可写 Workspace | 未选择时禁用新增、编辑、删除、保存和 Apply。 |
| Fabric | 至少存在一个可用 AIDC Fabric | Fabric 决定设备和接口候选范围。 |
| Inventory | Fabric 中存在已注册 Spine/Leaf | Device List 只显示 Fabric 范围设备。 |
| Interface Data | 存在设备接口或已观测连接接口 | 先选设备，再加载第一台设备接口。 |
| Device Capability | 可提供队列、Buffer、PFC/WRED 范围 | 原型使用通用范围；产品化由能力数据限制。 |
## 2. 功能需求详述

### 2.1 Policy & CNP

#### 2.1.1 功能说明

配置策略名称、目标 Fabric、流量信任模式及 CNP 分类。该模块只定义策略基础输入，不包含 RoCE Queue 行的创建和调度参数，后者由 2.2 独立描述。

#### 2.1.2 竞品功能设计及流程说明

采用结构化字段表达交换机侧拥塞通知分类。页面视觉与标签以用户确认原型为准；该 Studio 是 AmpCon 产品扩展，不声明为 CloudVision 原生内置 Studio。

设计要求：CNP 分类随 Trust Mode 切换；不适用字段必须同步清理或禁用；错误在字段下即时反馈。

#### 2.1.3 功能业务流程

```text
选择 Workspace → 输入 Policy Name → 选择 Fabric
→ 选择 DSCP/802.1q → 配置 CNP Value
→ 确认 CNP Queue ID → 进入 Queue Configuration
```

#### 2.1.4 原型界面&交互说明

Basic Configuration：

| 字段 | 控件 | 必填 | 默认值 | 交互规则 |
|---|---|---:|---|---|
| Policy Name | Text | 是 | `AIDC RoCE Lossless Policy` | Trim 后不能为空。 |
| Fabric | Select | 是 | 上游传入或首个可用 Fabric | 上游固定时只读；切换后失效 Assignment 不得静默保留。 |

Congestion Notification：

| 字段 | DSCP | 802.1q |
|---|---|---|
| CNP 字段标签 | DSCP Value of CNP Packets | 802.1q Value of CNP Packets |
| CNP 范围 | 0–63，默认 48 | 0–7；无效旧值切换为 6 |
| CNP Queue ID | 0–7，可编辑，默认 6 | 自动等于 CNP 值并禁用 |

切换到 802.1q 时，若旧 CNP 值超出 0–7，则设为 6；修改 CNP 值时 CNP Queue ID 实时同步；已有 Queue 行的 RoCE Queue 清空。

#### 2.1.5 列表字段

本模块无独立列表，仅包含基础字段和 Congestion Notification 字段。

#### 2.1.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| Policy Name 为空 | 阻止保存。 |
| Fabric 为空或引用失效 | 阻止保存并要求重新选择。 |
| CNP 为空、非整数或越界 | 红框并显示 `Permitted range: 0–N`。 |
| Trust Mode 切换导致旧值不适用 | 自动归一化 CNP；清空不适用 Queue ID。 |

#### 2.1.7 权限控制要求

未选择 Workspace 时字段禁用；Workspace 只读时所有字段只读；前端禁用不替代服务端鉴权。

#### 2.1.8 功能约束与边界

只配置交换机侧分类，不配置 NIC OS/DCQCN；Fabric 和设备身份由外部模块提供；保存不代表设备生效。

#### 2.1.9 非功能需求

Trust Mode 联动目标响应时间 ≤100ms；错误字段使用 `aria-invalid`；全部字段支持键盘访问。

### 2.2 Queue Configuration

#### 2.2.1 功能说明

创建、编辑和删除 RoCE Queue 分类规则，并配置 WRR、SP、WFQ 调度参数。

#### 2.2.2 竞品功能设计及流程说明

Queue Configuration 独立于 Policy & CNP 展开，但继承其 Trust Mode。DSCP 模式将多个业务 DSCP 映射到 Queue；802.1q 模式选择单个优先级值，并将 RoCE Queue 视为不适用。

#### 2.2.3 功能业务流程

```text
读取 Trust Mode → Create Queue → 填写分类值
→ 选择 Scheduling Mode → 填写条件字段
→ 字段校验 → Apply → 表格 Edit/Delete
```

#### 2.2.4 原型界面&交互说明

弹窗标题为 `Create RoCE Queue Configuration` 或 `Edit RoCE Queue Configuration`，底部操作为 Cancel、Apply。

| 字段 | DSCP | 802.1q |
|---|---|---|
| RoCE Queue | 必填，0–7，策略内唯一，新建默认 3 | 空并禁用 |
| Service Packet Values | 逗号分隔 0–63，新建默认 `26` | 单选 0–7 |
| Scheduling Mode | WRR/SP/WFQ，默认 WRR | 相同 |
| Weight | WRR/WFQ 显示，1–15，默认 1 | 相同 |
| Guaranteed Rate | 仅 WFQ 必填，8–40000000 | 相同 |

WRR 显示 Weight；SP 隐藏并清空 Weight/Guaranteed Rate；WFQ 显示 Weight 和 Guaranteed Rate。

#### 2.2.5 列表字段

| 列 | 说明 |
|---|---|
| RoCE Queue | DSCP 显示 0–7；802.1q 为空/不适用。 |
| DSCP Values / 802.1q Values of Service Packets | 表头随 Trust Mode 切换。 |
| Scheduling Mode | WRR、SP、WFQ。 |
| Weight | SP 显示 `—`。 |
| Operation | Edit、Delete。 |

#### 2.2.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| DSCP 为空 | 提示必填。 |
| DSCP 格式错误 | 提示逗号分隔整数示例。 |
| DSCP 越界/重复 | 显示范围或唯一性错误。 |
| 802.1q 未选 | 提示选择 0–7。 |
| Queue 为空/重复 | 字段报错并禁用 Apply。 |
| Weight 越界 | 提示整数范围 1–15。 |
| Guaranteed Rate 为空/越界 | 提示范围 8–40000000。 |
| Queue 被模板引用后删除 | [TARGET] 阻止并列出 PFC/WRED 引用；当前原型未实现。 |

#### 2.2.7 权限控制要求

无 Workspace 时 Create/Edit/Delete 禁用；只读 Workspace 不允许修改 Queue。

#### 2.2.8 功能约束与边界

Guaranteed Rate 单位由设备能力或后端契约定义；Queue 0–7 是表单范围，最终支持范围由设备型号确定；802.1q Queue 的 API 空值表达不在前端自行决定。

#### 2.2.9 非功能需求

弹窗最大高度不超过视口 88%；错误紧邻字段显示；Apply 在错误存在时禁用；Dialog 可键盘操作。
### 2.3 Device & Interface

#### 2.3.1 功能说明

从当前 Fabric 的 Inventory 中选择 Spine/Leaf 设备和接口，为每个接口设置 RoCE/PFC 状态，支持单行和批量管理。

#### 2.3.2 竞品功能设计及流程说明

采用 Device List + Interface List 双列表。设备与接口事实归 Inventory 所有，Studio 只保存设备 ID、接口名和策略状态。

#### 2.3.3 功能业务流程

```text
Select Devices → 筛选并选择设备 → 加载首台设备接口
→ 选择接口 → 配置 RoCE/PFC → Apply
→ Edit / Bulk Edit / Bulk Delete
```

#### 2.3.4 原型界面&交互说明

页面按钮顺序为 Bulk Edit、Bulk Delete、Select Devices；未选 Assignment 时批量按钮禁用。统计栏显示 assigned devices、device interfaces、devices with PFC 和 selected 数量。

弹窗标题按新建、编辑、批量编辑分别显示。Device List 支持 All/Spine/Leaf、Search 和筛选内全选；Interface List 支持 Search、Bulk RoCE、Bulk PFC 和筛选内全选。

PFC 依赖 RoCE；关闭 RoCE 同步关闭 PFC；设备选择变化后清空接口选择；多设备 Apply 使用同一组接口名和逐接口状态。

#### 2.3.5 列表字段

Assignment：Selection、Sysname/Model、Mgmt IP、Role、RoCE Interfaces、Operation。

Device List：Selection、Mgmt IP、Model、Role。

Interface List：Selection、RoCE Interface、RoCE Configuration、PFC Configuration。

接口摘要最多预览 3 个接口，并显示 `N selected`、`RoCE x/N`、`PFC x/N`。

#### 2.3.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| 未选设备或接口 | 禁用 Apply。 |
| RoCE Disabled 时启用 PFC | 阻止并显示依赖提示。 |
| 批量 PFC 依赖不满足 | 禁用 Bulk Enable PFC。 |
| 多设备接口名不一致 | 显示首台设备接口并明确提示。 |
| Bulk Edit 存在差异 | [TARGET] 显示 Mixed 和覆盖确认。 |
| 设备引用失效 | [TARGET] 标记失效并阻止保存。 |
| 删除 Assignment | [TARGET] 显示影响确认。 |

#### 2.3.7 权限控制要求

无 Workspace 时 Select Devices 禁用；无选择时批量操作禁用；只读状态禁用所有写操作；无 Inventory 读取权限时不展示设备数据。

#### 2.3.8 功能约束与边界

角色和接口由 Fabric/Inventory 提供；当前 Demo 最多补充 64 个 `EthernetN`；同批设备共享接口集合；Assignment 不代表配置生效。

#### 2.3.9 非功能需求

列表应支持分页或虚拟滚动；筛选响应 ≤100ms；Checkbox、Menu、图标按钮提供 aria-label/title；状态不能只用颜色表达。

### 2.4 Switch Templates

#### 2.4.1 功能说明

分别为 Spine、Leaf 配置 PFC Watchdog、Deadlock、PFC Buffer 和 WRED/ECN 参数。

#### 2.4.2 竞品功能设计及流程说明

模板以角色为边界，避免逐设备重复填写。型号差异由能力约束处理，不通过前端复制模板解决。

#### 2.4.3 功能业务流程

```text
选择 Spine/Leaf → 配置 Global Interface
→ Create/Edit PFC → Create/Edit WRED → 校验 → Apply
```

#### 2.4.4 原型界面&交互说明

角色页签只显示 Spine、Leaf，状态彼此独立。

Global Interface：PFC Watchdog 默认 Enabled；Deadlock Granularity 默认 10ms；Interval 默认 100ms，均须为正整数。

PFC 弹窗：RoCE Queue=3、Headroom=1024、Guaranteed=256、Shared Ratio=100%、Reset Offset=128。

WRED 弹窗：Queue=3、WRED Enabled、Min=256、Max=512、Drop Probability=10%、ECN Enabled。

#### 2.4.5 列表字段

PFC：RoCE Queue、Headroom、Guaranteed、Shared Ratio、Reset Offset、Operation。

WRED：RoCE Queue、WRED、Min Threshold、Max Threshold、Drop Probability、ECN、Operation。

#### 2.4.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| Deadlock 参数非正整数 | 阻止 Apply。 |
| PFC 数值为空/负数 | 阻止 Save。 |
| Shared Ratio 超出 0–100 | 阻止 Save。 |
| WRED Min > Max | 显示关系错误并禁用 Save。 |
| Drop Probability 越界 | 禁用 Save。 |
| Queue 重复或不存在 | [TARGET] 阻止保存并定位引用。 |
| 超出硬件能力 | [TARGET] 显示角色/设备能力错误。 |

#### 2.4.7 权限控制要求

无 Workspace 或只读状态时模板字段及 Create/Edit/Delete 禁用；模板操作不能修改 Inventory 角色。

#### 2.4.8 功能约束与边界

只支持 Spine、Leaf；Buffer 单位和上限由能力数据提供；WRED Disabled 时保留草稿参数；Watchdog 是角色模板参数。

#### 2.4.9 非功能需求

角色切换不丢失草稿；1280×720 可完整操作；Toggle 使用 aria-pressed；参数错误同时提供文字。

### 2.5 Studio公共表单

#### 2.5.1 功能说明

提供 Workspace 上下文、左侧目录、Previous/Next、Review、Save 和最终 Apply。

#### 2.5.2 竞品功能设计及流程说明

采用分步 Workbench。Workspace 仅作为表单编辑上下文；保存只表示输入写入 Workspace，不表示设备已部署。

#### 2.5.3 功能业务流程

```text
选择 Workspace → 按目录填写 4 个表单功能
→ Previous/Next → Save to Workspace 或最终 Apply
→ 统一表单校验 → 显示保存结果
```

#### 2.5.4 原型界面&交互说明

左侧目录保持当前 Studio 两级视觉结构，业务拆解按本 SR 的 5 个功能描述。顶部包含 Workspace、Review Workspace、Save to Workspace；底部包含 Previous、Next，最后一步显示 Apply。

任一字段、Queue、Assignment 或 Template 修改后进入未保存状态。成功文案为 `Saved to <Workspace>. Workspace Build is required.`。

#### 2.5.5 列表字段

公共模块无独立列表，沿用各功能表格。

#### 2.5.6 异常与容错处理

无 Workspace 时全部写操作禁用；任一阻断错误存在时不保存；至少要求有效 Policy/Fabric/CNP/Queue 和一个 Assignment；保存失败时应保留草稿并允许重试。

#### 2.5.7 权限控制要求

Workspace 可写性决定表单状态；Review 只读；禁用原因通过 Tooltip 或说明文本展示；服务端必须再次鉴权。

#### 2.5.8 功能约束与边界

Save/Apply 不等于设备生效；Studio 不创建私有 Workspace 生命周期；Intent Center 只可调用或预填；Templates & CLI 不属于本表单。

#### 2.5.9 非功能需求

页面切换不丢失草稿；保存防重复提交；Dialog 最大高度 88vh；错误、焦点和禁用状态满足键盘与可读性要求。

## 3. 功能评审（Review）

### 3.1 评审人员

| 角色 | 评审重点 |
|---|---|
| 产品经理 | 表单范围、目录、字段完整性 |
| RoCE 网络架构师 | 分类、Queue、PFC、WRED 参数语义 |
| 前端开发 | 联动、弹窗、表格、状态、可访问性 |
| 后端开发 | 参数契约、能力范围、引用关系 |
| 测试工程师 | 字段边界、异常提示、批量行为 |
| UX/UI | 层级、标签、控件位置和反馈 |

### 3.2 评审结果

| 功能 | 结果 | 待确认重点 |
|---|---|---|
| Policy & CNP | 待评审 | 802.1q CNP 与 Queue 联动。 |
| Queue Configuration | 待评审 | Guaranteed Rate 单位、引用删除。 |
| Device & Interface | 待评审 | 多设备接口不一致处理。 |
| Switch Templates | 待评审 | Buffer 单位、能力范围、Queue 唯一性。 |
| Studio公共表单 | 待评审 | Save 与 Apply 是否保留双入口。 |

### 3.3 遗留问题

| 编号 | 遗留问题 | 建议处理 |
|---|---|---|
| OI-001 | Guaranteed Rate 单位未明确 | 在字段标签和数据契约中固定单位。 |
| OI-002 | Buffer 参数单位未明确 | 由设备能力返回，前端禁止换算。 |
| OI-003 | 802.1q Queue 空值表达未固定 | 契约统一 null 或省略字段。 |
| OI-004 | Queue 引用删除未实现 | 增加 PFC/WRED 引用检查。 |
| OI-005 | Bulk Edit 混合值未表达 | 增加 Mixed 状态和覆盖确认。 |
| OI-006 | 多设备接口名不一致仍可 Apply | 使用接口交集，无法统一时阻止或拆分。 |
| OI-007 | PFC/WRED 重复 Queue 未校验 | 增加角色内唯一性校验。 |
| OI-008 | Save 与最终 Apply 功能重复 | 明确语义或合并入口。 |

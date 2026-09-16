# AIDC Studio 功能逻辑规格说明书（SR）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-STUDIO-LOGIC-001 |
| 版本 | v1.1 |
| 日期 | 2026-09-11 |
| 状态 | Draft |
| 适用范围 | AIDC Studios、Workspace、Build、Review 与受控执行流程 |
| 目标读者 | 产品经理、网络架构师、交互设计、开发与测试工程师 |

---

## 1. 文档目的

本文档从 **Studio 功能本身**定义统一配置逻辑，包括：

- Studio 配置对象、Inputs、Assignments、作用范围和生成结果；
- 对象创建、编辑、删除、继承、覆盖和引用行为；
- 设备与接口选择、自动规划、手工调整和影响范围；
- Save、Build、Review、Submit 与设备执行的功能边界；
- 网络新建、设备扩容、配置变更三种核心使用场景；
- 不同类型 Studio 应遵循的共同交互、状态、校验和验收规则。

本文档不重点讨论前后端架构、服务拆分或 API。具体 Studio 的字段、默认值、层级及业务约束由对应 SR 定义，例如 `STD-AI-004 / RoCE Access`。

---

## 2. Studio 的功能定位

### 2.1 Studio 是什么

Studio 是一套面向网络能力的结构化配置工作台。它把网络配置拆分为：

```text
配置对象（配置哪类网络能力）
+ Inputs（配置什么参数）
+ Assignments（作用到哪些目标）
+ 规则（如何校验、继承、生成和组合）
= 当前 Workspace 中的候选网络意图
```

Studio 不要求用户逐行编写设备 CLI，而是通过网络对象和参数表达期望状态。最终设备配置由 Studio 规则根据当前 Workspace、Inventory 和设备能力生成。

### 2.2 Studio 不是什么

Studio 不是：

- 设备 Inventory，不拥有物理设备身份、真实接口或 LLDP 事实；
- Intent Center，不负责业务请求和业务审批；
- Workspace，不拥有候选事务、Build 或 Submit 生命周期；
- Change Control，不负责审批、排期和设备执行；
- 设备终端，不直接把表单值立即写入 Running Configuration。

### 2.3 核心功能目标

1. 用网络对象而不是零散命令表达配置。
2. 将参数与设备作用范围分离，支持一次配置、多目标复用。
3. 允许用户清楚看到默认值、继承值、覆盖值和最终有效值。
4. 对自动生成结果提供来源、计算依据和手工调整入口。
5. 在保存和提交前发现对象缺失、设备不兼容和配置冲突。
6. 让所有变更可在 Workspace 中审阅、构建、提交和受控执行。
---

## 3. Studio 的通用功能模型

### 3.1 配置对象

每个 Studio 应围绕明确的配置对象组织页面，而不是围绕设备命令组织页面。常见对象包括：

| Studio 类型 | 典型配置对象 | 示例 |
|---|---|---|
| Foundation | Device、Interface、Connection、Role | Inventory and Topology |
| Fabric/Hierarchy | Data Center、Pod、Domain、Role Group | L3 Leaf-Spine Fabric |
| Access/Service | Access Domain、Network、VLAN、Gateway | RoCE Access |
| Policy | Policy、Queue、Template、Rule | RoCE Lossless Policy |
| Profile | Profile、Device、Interface Assignment | Interface Configuration |
| Advanced Source | Template、CLI Fragment、Target Scope | Templates & CLI |

配置对象可以形成父子层级。父对象提供公共上下文或默认值，子对象表达局部配置和 Assignment。

### 3.2 Inputs

Inputs 表示“配置什么”，包括：

- 标识信息：Name、Description、Fabric；
- 网络参数：ASN、IP Pool、VLAN、Gateway、MTU；
- 策略参数：Queue、PFC、ECN、调度方式；
- 行为开关：Enable、Discovery、Proxy ARP；
- 规模参数：设备数、端口数、Domain 数；
- 高级参数：平台特定或低频配置。

Inputs 必须具有明确的类型、必填性、允许值、默认值、单位、联动关系和作用层级。

### 3.3 Assignments

Assignments 表示“配置作用到哪里”，目标可以是：

- Device；
- Interface；
- Device Role；
- Tag；
- Fabric/Pod/Domain；
- 其他 Studio 创建的逻辑对象。

功能规则：

1. Assignment 只引用 Inventory 或其他 owner 提供的对象，不复制其身份数据。
2. 同一目标能否属于多个对象，必须由具体 Studio 明确定义。
3. 设备选择必须展示 eligibility，不兼容目标应说明原因。
4. 批量 Assignment 必须展示目标数量和影响范围。
5. 移除 Assignment 表示该 Studio 不再对目标声明此项期望配置，不代表立即删除设备配置。

### 3.4 生成结果

Studio 根据 Inputs 和 Assignments 产生三类结果：

| 结果 | 用途 |
|---|---|
| Derived Values | 公式、继承或资源分配产生的有效值 |
| Candidate Objects | 自动生成的 Domain、Leaf slot、VLAN、Profile reference 等逻辑结果 |
| Candidate Device Configuration | Build 后按设备生成的候选配置与 Diff |

自动结果必须可解释。用户应能知道结果来自默认值、父级继承、自动计算、Inventory/LLDP、资源池还是手工覆盖。

---

## 4. 配置层级、默认值、继承与覆盖

### 4.1 配置层级

Studio 可以根据网络模型提供多级对象，例如：

```text
Data Center
└─ Pod
   └─ Domain
      └─ Device / Interface Assignment
```

或：

```text
Policy
├─ Queue
├─ Device & Interface Assignment
└─ Role Template
```

父子层级必须反映真实配置职责。纯导航分组不能伪装成可保存配置对象。

### 4.2 值的来源

每个有效值应属于以下来源之一：

| 来源 | 含义 | 用户行为 |
|---|---|---|
| Default | Studio Definition 提供的初始值 | 可按规则修改 |
| Inherited | 从父对象或公共 Profile 获得 | 默认只读；可显式 Override 时必须有入口 |
| Explicit | 用户在当前对象直接设置 | 可编辑、可恢复默认/继承 |
| Derived | 根据其他 Inputs 计算 | 通常只读，显示计算依据 |
| Discovered | 来自 Inventory/LLDP 等事实 | 只读；允许调整的是候选映射，不修改发现事实 |
| Generated | 无发现事实时由规划规则生成 | 必须明确标识并在 Build 中验证 |

### 4.3 覆盖规则

- 用户执行 Override 后，界面必须显示覆盖来源和与父值的差异。
- `Reset` 应恢复父级有效值或 Definition 默认值，而不是写入一份相同常量。
- 父值变化时，未覆盖子对象自动获得新值；已覆盖对象保持自己的值并显示差异。
- 删除父对象前必须检查子对象、引用和 Assignment，不得产生悬空引用。
- 不允许继承的字段不得显示为 Inherited。

### 4.4 Profile 引用

Profile 是可复用参数集合，不直接拥有设备范围。设备或接口 Assignment 通过 `profileId` 引用 Profile：

```text
Profile：定义配置参数
Device / Interface：定义作用目标并引用 Profile
```

修改 Profile 会影响所有引用目标，Review 必须展示完整影响范围。删除被引用 Profile 时必须阻止并列出引用，或要求用户先替换/移除引用。

---

## 5. Studio 标准操作流程

### 5.1 进入 Studio

1. 用户从 Studios Explorer 选择 Studio。
2. 用户选择或创建一个可写 Workspace。
3. Studio 加载 Mainline 有效配置和当前 Workspace 修改。
4. 页面展示对象树/对象列表、配置工作区、Assignment 和必要的 Topology。
5. 未选择 Workspace 时允许查看，但禁止创建、编辑、删除和保存。

### 5.2 创建配置对象

创建对象应包含：

1. 选择父对象或目标集合；
2. 输入对象名称和必填 Inputs；
3. 根据规则生成默认值或候选子对象；
4. 选择 Assignment，或允许稍后分配；
5. 执行即时校验；
6. 保存到当前 Workspace。

新对象保存后属于 Workspace candidate，不立即进入 Mainline，也不立即作用于设备。

### 5.3 编辑配置对象

- 打开对象时显示当前 Effective Value 和来源。
- 任一修改使对象进入 `Modified / Build Required`。
- 修改父级、Profile 或公共 Policy 时，必须重新计算受影响子对象和引用目标。
- 不产生实际差异的修改应识别为 No-op，不应生成设备执行动作。
- 离开存在未保存修改的对象时，应提示保存、放弃或继续编辑。

### 5.4 删除配置对象

删除前必须检查：

- 是否有子对象；
- 是否被其他对象引用；
- 是否仍有 Device/Interface Assignment；
- 将删除哪些候选设备配置；
- 是否有其他 Studio/Source 共同拥有相关配置。

删除先形成 Workspace 中的候选删除 Diff，只有后续受控执行后才影响设备 Running。

### 5.5 Save、Build、Review 与 Submit

```text
Edit
→ Save to Workspace
→ Build Required
→ Build
→ Review Inputs / Assignments / Device Diff
→ Synchronize（Mainline 已变化时）
→ Submit
→ Change Control
→ Execute / Verify
```

功能边界：

- Save：保存 Studio 候选输入和 Assignment。
- Build：验证并生成候选设备配置。
- Review：查看本次修改和设备差异。
- Submit：将合格候选合并到 Designed/Mainline。
- Execute：由 Change Control 受控执行，不属于 Studio 页面直接操作。
---

## 6. Assignment 与作用范围逻辑

### 6.1 Eligible、Assigned 与Effective Scope

Studio 应区分：

| Scope | 含义 |
|---|---|
| Eligible | 满足 Fabric、Role、型号、接口和能力条件的可选目标 |
| Selected | 用户当前在选择器中临时选择的目标 |
| Assigned | 已保存到当前 Workspace 的目标 |
| Effective | 合并 Mainline、Workspace、继承和排除规则后的最终作用目标 |
| Impacted | 因依赖关系会产生配置 Diff 的目标，包括未被直接选择的邻居 |

### 6.2 选择规则

- 全选只作用于当前筛选结果，并清楚显示选择数量。
- 设备和接口分配应支持搜索、Role/Domain/Tag 筛选和批量操作。
- 同一对象存在互斥 Assignment 时必须阻止并列出占用者。
- 跨设备批量配置只能应用所有目标共同支持的参数；不兼容项不能静默忽略。
- 设备型号、接口命名或能力不一致时，应显示差异并要求拆分 scope 或确认兼容策略。

### 6.3 Assignment 变化

| 操作 | Studio 功能结果 |
|---|---|
| Add target | 新目标继承或引用当前对象配置，Build 生成新增配置 |
| Retain target | 保持原 Assignment；仅在 Inputs 变化时产生 Diff |
| Remove target | Build 生成该 Studio 所属配置的候选移除 Diff |
| Move target | 从旧对象移除并加入新对象，必须展示前后 Effective 配置 |
| Swap logical position | 交换逻辑映射，不修改 Inventory 设备身份 |

### 6.4 自动分配与手工调整

Studio 可以根据 Role、Tag、拓扑、LLDP、资源池或排序规则自动提出 Assignment。自动结果必须：

1. 标识依据和来源；
2. 允许用户查看每个目标的匹配原因；
3. 将无法匹配目标列为未完成项；
4. 将手工调整标记为 Adjusted/Override；
5. 保留原始 Inventory 事实，不因调整而改写 LLDP；
6. 输入或 Inventory 变化时判断调整是否仍然有效。

---

## 7. 校验与冲突逻辑

### 7.1 校验层级

| 层级 | 检查内容 | 反馈位置 |
|---|---|---|
| Field | 类型、必填、范围、格式 | 字段下方 |
| Object | 对象名称、子对象完整性、内部引用 | 对象页/树状态 |
| Assignment | Role、重复分配、目标能力 | 设备/接口行 |
| Topology | 连接、Domain 完整性、HA 数量 | Topology/Validation panel |
| Cross-object | Profile、Policy、资源池引用 | 引用对象和当前对象 |
| Cross-Studio | 配置所有权和重叠 | Build/Workspace Review |
| Device config | 型号、版本、语法、配置冲突 | Build 设备结果 |

### 7.2 Error、Warning 与 Info

- **Error**：配置无法生成、安全应用或保持一致，阻止 Submit。
- **Warning**：存在风险或非推荐行为，可以按策略继续，但 Review 必须展示。
- **Info**：说明自动结果、派生值或非阻断变化。

错误必须能定位到 Studio、对象、字段、Device/Interface 和修复建议。不能只显示笼统的“Build Failed”。

### 7.3 常见冲突

- 同一设备/接口被互斥对象重复分配；
- 多个 Studio 或 Templates & CLI 修改同一配置节点；
- Profile 被删除但仍被引用；
- 资源池重复、越界或耗尽；
- Inventory Role、接口或连接在编辑后发生变化；
- Mainline 已被其他 Workspace 修改；
- 设备能力无法满足当前 Policy；
- 用户移除 Assignment 后仍有依赖对象引用。

### 7.4 冲突处理原则

- 不采用“最后保存者覆盖”处理跨来源冲突。
- 冲突必须列出所有来源、目标和配置路径。
- 用户应回到 owning Studio 修改，不能在 Review 中直接篡改生成配置。
- 同步 Mainline 后需要重新计算 Effective Value、影响范围和 Build。

---

## 8. Topology 与配置预览

### 8.1 Topology 的职责

Topology 用于表达：

- 当前 Studio 对象层级；
- Assigned 设备和接口；
- Planned relationship 与 observed relationship；
- 配置影响范围和当前选中对象；
- 逻辑标签、生成端口与真实端口的差异。

Topology 不拥有设备或连接数据。物理事实仍来自 Inventory。

### 8.2 Planned 与 Observed

- Planned link 表示 Studio 期望关系，不得伪装成 LLDP 已发现连接。
- Observed link 表示 Inventory 已接受事实。
- 两者匹配、缺失或冲突时应有明确文本和图例。
- 设计阶段可使用逻辑端口标签；确认阶段才显示真实接口或明确标记的 Generated 目标接口。

### 8.3 配置预览

Preview 可以在 Build 前提供轻量结果，帮助用户理解设计，但必须明确：

- Preview 不是权威 Build；
- Preview 不等于设备完整最终配置；
- 正式配置、冲突和 Diff 以 Workspace Build 为准；
- Preview 变化不能直接更新 Mainline 或 Running。

---

## 9. Studio 功能状态

| 状态 | 含义 | 允许操作 |
|---|---|---|
| No Workspace | 未选择可写 Workspace | 查看、选择 Workspace |
| Clean | 当前页面与已保存 Workspace 内容一致 | 编辑、Build/Review（按条件） |
| Editing | 存在未保存本地修改 | 编辑、Save、Discard |
| Build Required | 修改已保存但尚未构建 | Build、继续编辑 |
| Building | 当前 revision 正在构建 | 查看进度、按权限取消 |
| Build Failed | 存在阻断问题 | 定位问题、修复、重新 Build |
| Build Succeeded | 当前 revision 构建成功 | Review、Submit |
| Out of Date | Mainline 已变化 | Synchronize、解决冲突 |
| Submitted | Workspace 已提交 | 只读、进入后续执行流程 |

`Saved`、`Built`、`Submitted` 和 `Deployed` 必须严格区分。Studio 页面不得把 Save 或 Build Success 显示为设备已应用。
---

## 10. 场景一：网络新建

### 10.1 场景目标

在没有现有网络配置对象的情况下，通过一个或多个 Studio 建立 Fabric 层级、设备分配、网络参数和策略，形成首个可审阅、可构建的网络期望状态。

### 10.2 Studio 功能流程

```text
选择/创建 Workspace
→ Inventory and Topology：确认设备和连接事实
→ Fabric Studio：创建 DC、Pod、Domain 等层级对象
→ 为层级对象分配 Spine、Leaf 等设备
→ 配置地址池、ASN、平台参数
→ Access/Service/Policy Studios：创建网络与策略对象
→ Assign 到 Fabric、Device 或 Interface
→ 查看 Topology 和配置预览
→ Save / Build / Review / Submit
```

### 10.3 新建对象逻辑

1. 用户从顶级配置对象开始创建，逐层完成必需子对象。
2. 新建对象自动带出 Definition 默认值，不自动假设为用户确认值。
3. 父对象创建后，Studio 可按规则生成默认子对象或建议结构。
4. 设备 Assignment 可以与 Inputs 分步完成，但缺失必需 Assignment 时对象为 Incomplete。
5. 一个 Studio 创建的逻辑对象可被其他 Studio 只读引用，但后者不能复制或修改 owner 数据。
6. 新网络中的 planned device 可以用于设计；需要实际部署的目标必须在提交/执行前绑定真实 Inventory device。

### 10.4 页面应呈现的信息

- 当前对象层级和完成状态；
- 每个对象的必填 Inputs、默认值和派生值；
- 可分配设备、已分配设备及不适用原因；
- Planned 与 observed Topology；
- 资源使用范围和生成摘要；
- 未完成对象、阻断错误和建议下一步。

### 10.5 新建场景门禁

- 必需层级对象完整；
- 每个运行对象具有合法 Assignment；
- 设备 Role、Node ID、接口和连接满足设计；
- 地址、ASN、VLAN/VNI 等资源无冲突；
- 依赖 Studio 已提供所需对象；
- 模拟或未绑定目标不能作为真实执行目标；
- Build 生成的所有设备配置可定位到 Studio 来源。

### 10.6 新建场景完成标准

- Studio 对象树完整且无阻断错误；
- Inputs、Assignments 和 Topology 一致；
- Build 成功并产生首个设备配置 Diff；
- Review 能按 Studio 和设备查看全部新增配置；
- Submit 后进入受控执行流程，不在 Studio 内直接部署。

---

## 11. 场景二：设备扩容

### 11.1 场景目标

在已有网络和 Studio 配置上增加设备、接口或容量，尽量复用原有对象和 Inputs，只扩展必要 Assignment 或新增必要层级对象。

### 11.2 扩容分类

| 扩容类型 | Studio 主要操作 |
|---|---|
| 同层增加设备 | 将新设备加入现有 Pod/Domain/Policy Assignment |
| 新增 Pod/Domain | 创建新子对象，继承父级值，再分配设备 |
| 新增 Access Leaf/服务器接入 | 扩展 Access Domain、接口或 VLAN Assignment |
| 增加接口容量 | 将新接口加入现有 Profile/Policy |
| 增加新角色 | 创建对应角色对象或模板并完成 Assignment |

### 11.3 Studio 功能流程

```text
Inventory 出现新增设备/接口
→ 在 Workspace 中确认新增事实
→ 打开现有 Studio 对象
→ 选择“Add Device / Add Assignment / Create Child Object”
→ 查看新目标的 eligibility 和建议归属
→ 复用现有 Inputs 或继承父级配置
→ 必要时新增局部 Override
→ 查看新增目标和受影响已有目标
→ Save / Build / Review / Submit
```

### 11.4 Inputs 与 Assignment 逻辑

- 加入现有对象时默认复用该对象的 Effective Inputs，不复制一份新 Policy。
- 新建同类子对象时，按具体 Studio 规则继承父值或使用 Definition 默认值。
- 新设备能力不兼容时，不得自动降低参数；应提示拆分对象、调整 Policy 或取消分配。
- Assignment 增加后，应区分：
  - New targets：新加入的设备/接口；
  - Existing targets：原有目标；
  - Impacted targets：因邻居或共享配置需要改变的原有设备。
- 扩容不得无提示重排已有地址、ASN、VLAN、逻辑编号或端口映射。

### 11.5 自动建议

Studio 可以根据以下信息建议扩容位置：

- 设备 Role 与 Custom Role；
- Fabric、Pod、Domain；
- 型号、端口和软件能力；
- LLDP 连接与预期拓扑；
- 当前对象容量和资源池余量；
- 现有 Assignment 的对称性或冗余要求。

建议结果必须可修改，并显示推荐原因。用户调整只修改候选 Assignment，不改写 Inventory 事实。

### 11.6 扩容场景门禁

- 新设备已注册且不与已有设备身份冲突；
- 新设备满足目标对象的 Role 和能力；
- 必需连接存在或已明确为待完成 planned relationship；
- 资源池有足够余量；
- HA、MLAG、Domain 数量和对称性规则满足；
- 已有目标未产生与扩容无关的大范围配置变化；
- Build 明确展示新增设备完整配置和已有设备必要 Diff。

### 11.7 扩容场景完成标准

- 新设备归属清晰，不存在重复 Assignment；
- 原有 Inputs 被复用，必要 Override 有明确来源；
- 已有资源未发生非预期重排；
- 无 Diff 的原有设备不进入执行范围；
- 扩容后 Topology、配置对象和设备 Assignment 一致。

---

## 12. 场景三：配置变更

### 12.1 场景目标

在现有 Studio 对象和设备范围基础上修改参数、引用、Assignment 或对象层级，并清楚展示变更前后值、影响范围和候选设备 Diff。

### 12.2 变更类型

| 变更类型 | 示例 | Studio 行为 |
|---|---|---|
| Input 修改 | MTU、ASN、VLAN、Queue | 重算 Effective Value 和受影响目标 |
| Profile/Policy 修改 | 修改公共 Profile | 展开所有引用目标的影响 |
| Assignment Add | 新增设备/接口 | 对新增目标生成配置 |
| Assignment Remove | 移出设备/接口 | 生成候选删除，并检查共享引用 |
| Assignment Move | Device 从 Domain A 移到 B | 同时展示旧对象移除与新对象新增 |
| Override | 子对象覆盖父值 | 标记覆盖来源和差异 |
| Reset | 恢复默认/继承 | 删除显式覆盖并重新计算有效值 |
| Object Delete | 删除 Domain/Profile/Policy | 检查子对象、引用、Assignment 和设备删除 Diff |

### 12.3 Studio 功能流程

```text
选择基于当前 Mainline 的 Workspace
→ 打开 owning Studio 和目标对象
→ 查看 Current / Effective Value
→ 修改 Input、Assignment 或引用
→ 查看影响对象和目标数量
→ Save to Workspace
→ Build
→ 查看 Add / Modify / Delete / No-op Diff
→ 处理 Warning、冲突和 Mainline 同步
→ Review / Submit
```

### 12.4 影响范围逻辑

Studio 必须区分：

- Direct impact：用户直接修改或重新分配的对象；
- Reference impact：引用 Profile、Policy、Pool 的其他对象；
- Hierarchy impact：继承该父值的子对象；
- Topology impact：邻居、Peer、HA 成员或端到端路径；
- Removal impact：将失去该 Studio 配置的目标；
- No-op：最终有效值或设备配置没有变化。

影响范围应在 Save 前提供摘要，在 Build 后以设备 Diff 为权威结果。

### 12.5 删除与回退逻辑

- 删除显式 Override：恢复继承或默认，不等同于删除整个配置对象。
- 删除 Assignment：只撤销该 Studio 对目标的配置声明。
- 删除对象：检查所有子对象、引用和目标，并展示完整候选删除。
- 恢复历史值：必须形成新的 Workspace 变更，不能直接改写历史 revision。
- 执行失败后的恢复由 Change Control/补偿变更负责，不在 Studio 中直接“回滚设备”。

### 12.6 配置变更门禁

- 修改必须发生在 owning Studio；
- 当前 Workspace 与 Mainline 冲突已解决；
- 公共对象修改的所有引用目标均可见；
- Delete Diff 无未知 owner 或悬空引用；
- 设备能力仍满足新参数；
- 高风险变化有 Warning、影响摘要和受控执行建议；
- Build 与 Review 属于当前最新修改。

### 12.7 配置变更完成标准

- 用户能看到 Before、Proposed 和 Effective Value；
- 所有直接、继承、引用和拓扑影响均可追踪；
- No-op 不生成执行变化；
- Add/Modify/Delete Diff 与 Studio 操作一致；
- Submit 后 Studio 只读，设备执行状态由后续流程反馈。
---

## 13. 三种场景功能对照

| 维度 | 网络新建 | 设备扩容 | 配置变更 |
|---|---|---|---|
| 初始对象 | 无或只有默认对象 | 已有完整对象 | 已有完整对象 |
| 主要操作 | Create Object + Initial Assignment | Add Child/Target | Edit/Delete/Move/Override |
| Inputs | 首次定义 | 以复用/继承为主 | 修改、重置或保持 |
| Assignments | 首次建立 | 以 Add 为主 | Add/Remove/Move 均可能 |
| 自动行为 | 生成层级、资源和初始建议 | 推荐归属和增量资源 | 重算继承、引用和影响范围 |
| 主要 Diff | Add | 新目标 Add + 必要邻居 Modify | Modify/Delete/Add/No-op |
| 关注风险 | 对象完整性和首次连通 | 能力差异、资源余量、旧资源重排 | 误删、引用扩散、业务中断 |
| Topology 重点 | Planned 与 Observed 完整关系 | 新设备位置和邻居影响 | 变更前后关系与影响路径 |

三种场景不是三个独立配置系统，而是同一 Studio 对象模型上的不同操作组合。

---

## 14. 多 Studio 协同逻辑

### 14.1 依赖关系

Studio 可以引用其他 Studio 提供的对象，但必须保持单一 owner。例如：

```text
Inventory and Topology
→ 提供 Device、Interface、Role、Connection

L3 Leaf-Spine Fabric
→ 提供 Fabric、Pod、Domain 和设备层级

RoCE Access
→ 引用 Fabric/Leaf，提供 Access Domain、VLAN/Gateway intent

RoCE Lossless Policy
→ 引用 Device/Interface，提供 QoS policy
```

被引用对象只能在 owner Studio 修改。引用 Studio 发现对象不存在或不适用时，应显示错误和跳转入口。

### 14.2 Workspace 内组合

一个 Workspace 可以同时修改多个 Studio。功能上必须支持：

- 按 Studio 查看修改数量和目标数量；
- 显示跨 Studio 依赖是否满足；
- Build 时统一检测配置重叠和设备能力；
- Review 时既可按 Studio 来源查看，也可按设备查看合并结果；
- 任一 Studio 新修改都会使当前 Workspace Build 失效。

### 14.3 Intent Center 与 Templates & CLI

- Intent Center 只能选择/预填 Studio，不拥有 Studio 对象和配置状态。
- 用户确认后，Intent 建议才成为当前 Workspace 中的 Studio 修改。
- Templates & CLI 是独立高级来源，不伪装成 Studio Inputs。
- Studio 与 Templates & CLI 的结果必须在共同 Build 中检查所有权和冲突。

---

## 15. 页面与交互要求

### 15.1 通用页面结构

Studio 页面建议包含：

1. Studio 标题与说明；
2. Workspace 上下文和状态；
3. 对象树、对象列表或阶段导航；
4. 当前对象配置工作区；
5. Assignment/Scope；
6. Topology、Preview 或结果表；
7. Validation 和底部操作。

页面结构以具体 Studio 对象关系为准，不强制所有 Studio 使用相同步骤导航。

### 15.2 对象导航

- 一级导航展示真正的配置对象或流程阶段。
- 二级页面展示单对象属性、引用和 Assignment。
- 当前对象、父对象和路径始终可识别。
- 新建对象后自动定位并打开该对象。
- 删除对象后返回最近有效父对象或列表。

### 15.3 表单

- 必填、默认值、单位和允许范围清楚可见。
- 字段联动立即更新显隐、禁用和校验状态。
- 高级设置默认折叠，但存在错误时自动提示。
- Inherited、Override、Generated、Discovered 使用一致标识。
- 不可编辑字段必须说明为何只读。

### 15.4 Assignment

- 大规模设备使用搜索、筛选、分页或虚拟滚动。
- 批量操作前显示目标数量，操作后显示逐设备结果或差异。
- 汇总数字应放在对应设备/接口上下文中，避免无意义全局汇总。
- 设备、接口和 Profile 选择控件不应重复堆叠确认按钮；操作方式应与风险匹配。

### 15.5 状态与提示

- 修改后显示 `Build Required`，不是 `Deployed`。
- Save 成功显示 Workspace 保存结果。
- Error、Warning、Info 同时使用图标、颜色和文字。
- 错误提示优先靠近字段/对象，页脚只显示最高优先级摘要。
- Build/Review 的状态不得由 Studio 页面本地模拟为真实平台结果。

---

## 16. 简要实现协作边界

本节只规定保证 Studio 功能成立所需的最小协作，不作为本文重点。

### 16.1 页面侧

- 根据 Studio 对象和字段规则展示表单、层级、Assignment 与 Topology；
- 维护未保存编辑和即时校验；
- 使用稳定对象 ID，不以名称或表格行号关联；
- Save 后采用平台返回的 Workspace 状态；
- 不在页面本地伪造 Build、Submit 或设备执行成功。

### 16.2 平台侧

- 保存版本化 Studio Inputs、Assignments 和对象引用；
- 提供 Inventory、设备能力和对象 eligibility；
- 执行权威 Build、跨 Studio 冲突和设备配置 Diff；
- 保证 Workspace revision、并发冲突和审计；
- 将已提交结果交给受控 Change Control，不允许 Studio 直接下发。

---

## 17. 当前原型与产品目标差距

| 能力 | 当前原型 | 产品目标 |
|---|---|---|
| Studio 对象 | 多数已具备可交互页面 | 版本化、可持久化、可跨会话恢复 |
| Inputs/Assignments | 组件本地状态为主 | 统一 Workspace revision |
| Inventory 引用 | 部分组件共享内存 | 稳定事实源和 revision |
| 自动规划 | 前端规则演示 | 可解释、可重放、与 Build 一致 |
| Build | 本地状态或静态文案 | 权威校验、生成结果和设备 Diff |
| 多 Studio Review | 静态摘要 | 来源视图和设备合并视图 |
| Submit/执行 | 静态流程演示 | Mainline、Change Control 和 Running 闭环 |
| RBAC | UI 禁用为主 | 服务端操作权限和拒绝原因 |

当前原型可用于验证 Studio 对象层级和交互，但不能据此认定真实配置已经生成、提交或部署。
---

## 18. 验收标准

### 18.1 通用对象与状态

| 编号 | Given / When / Then |
|---|---|
| AC-001 | 未选择 Workspace 时可以查看 Studio，但创建、编辑、删除和 Save 禁用。 |
| AC-002 | 创建对象后自动定位到新对象，并显示默认值、必填项和初始状态。 |
| AC-003 | 修改字段后显示 Editing；保存后显示 Build Required，不显示已部署。 |
| AC-004 | 父值变化时未覆盖子对象自动更新，已覆盖子对象保持值并显示差异。 |
| AC-005 | Reset Override 后恢复父级 Effective Value，而不是保留相同显式值。 |
| AC-006 | 删除存在子对象或引用的对象时操作被阻止并列出依赖。 |
| AC-007 | Build issue 可以定位到具体 Studio 对象、字段、Device 或 Interface。 |
| AC-008 | Submit 后 Studio 只读，设备执行状态由后续受控流程反馈。 |

### 18.2 Assignment

| 编号 | Given / When / Then |
|---|---|
| AC-010 | Assignment 选择器区分 Eligible、Assigned 和不适用目标。 |
| AC-011 | 全选只影响当前筛选结果，再次点击可以取消。 |
| AC-012 | 不兼容设备不能静默加入，并显示 Role/能力不匹配原因。 |
| AC-013 | 添加目标后继承当前对象 Effective Inputs，不复制新 Policy。 |
| AC-014 | 移除目标后 Review 显示候选删除和共享配置保留情况。 |
| AC-015 | 手工调整自动 Assignment 后显示 Adjusted，但 Inventory 事实不变。 |

### 18.3 网络新建

| 编号 | Given / When / Then |
|---|---|
| AC-101 | 新建网络可以按父子层级创建对象，并持续显示完整性状态。 |
| AC-102 | planned device 可参与设计，但必需目标未绑定真实设备时不能进入真实执行。 |
| AC-103 | 依赖 Studio 对象缺失时显示 owner 和修复入口。 |
| AC-104 | 首次 Build 的所有新增设备配置可追溯到 Studio 对象和 Inputs。 |

### 18.4 设备扩容

| 编号 | Given / When / Then |
|---|---|
| AC-201 | 新设备加入现有对象时默认复用原 Inputs，只新增 Assignment。 |
| AC-202 | 扩容前已分配的地址、ASN、VLAN 或逻辑编号不被无提示重排。 |
| AC-203 | Review 分开显示新设备和受影响已有设备。 |
| AC-204 | 无实际配置 Diff 的已有目标不进入执行范围。 |
| AC-205 | 新设备不支持当前 Policy 时要求拆分或调整，不自动降低配置。 |

### 18.5 配置变更

| 编号 | Given / When / Then |
|---|---|
| AC-301 | 修改公共 Profile 时显示全部引用目标和影响数量。 |
| AC-302 | Assignment Move 同时展示旧对象移除和新对象新增结果。 |
| AC-303 | 用户能区分 Before、Proposed、Effective 和 Value Source。 |
| AC-304 | 最终 Effective Value 未变化时识别为 No-op。 |
| AC-305 | 删除对象前展示子对象、引用、Assignment 和候选设备删除。 |
| AC-306 | Mainline 变化后旧 Build 失效，重新同步和 Build 前不能 Submit。 |

---

## 19. 官方参考与边界说明

截至 2026-09-11，本 SR 使用以下官方资料核对 Studio、Workspace 和 Change Control 语义：

1. [Arista CloudVision Workflow Overview](https://www.arista.com/cg-cv/cv-workflow-overview)：Workspace 承载一个或多个 Studio 的修改，提交后进入 Change Control。
2. [Arista Studio Elements and Functions](https://www.arista.com/jp/cg-cv/cv-studio-elements-and-functions)：Workspace Review 按受影响 Studio 和变更类型查看配置来源。
3. [Arista Studios Lab Setup](https://labguides-dev.testdrive.arista.com/0.1/advanced_routing/studios/setup/)：设备进入 Studios 管理范围是后续配置执行的前提。
4. [Arista Advanced Change Control Lab](https://labguides.testdrive.arista.com/2025.1/data_center/cvp_adv_cc_studio/)：Change Control、执行和恢复边界参考。

本文档中的 Intent Center、Fabric Blueprint、Network Design 场景编排、产品工作单及具体 AIDC Studio 均为 AmpCon 产品设计。它们不得被描述为 Arista 原生对象。

Content was rephrased for compliance with licensing restrictions.

---

## 20. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|---|---|---|---|
| v1.0 | 2026-09-11 | 初始版本：包含前后端架构和三类场景 | AmpCon Product Team |
| v1.1 | 2026-09-11 | 重构为纯 Studio 功能逻辑视角，弱化前后端实现，强化对象、Inputs、Assignments、继承覆盖及三类场景 | AmpCon Product Team |

# 需求文档：License 激活流程优化

## 简介

本文档定义 AmpCon 数据中心控制器交换机 License 激活流程的优化需求。通过分析当前流程痛点并对标业界主流网络控制器的 License 管理方案，提出针对性的优化设计，目标是简化 PicOS License 激活体验，支持联网与离线两种场景，优化极简 ZTP 上线流程中的 License 校验逻辑，并提升 License 管理界面的信息展示与视觉体验。

## 术语表

- **AmpCon**: 数据中心网络控制器平台，负责交换机设备的管理、配置下发和 ZTP 自动化上线
- **License_Portal**: Pica8 官方 License 管理门户网站，提供 License 创建、下载和 API 激活服务
- **PicOS**: 交换机操作系统，需要有效 License 才能正常运行
- **ZTP**: Zero Touch Provisioning，零接触自动化配置流程
- **HWID**: Hardware ID，设备硬件唯一标识符，用于绑定 License
- **Parking_Lot**: AmpCon 中设备注册后等待 ZTP 流程完成的暂存区域
- **Quick_Activate**: AmpCon 提供的在线快速激活功能，通过调用 License_Portal API 实现自动激活
- **License_File**: 由 License_Portal 生成的与特定 HWID 绑定的授权文件
- **System_Configuration**: AmpCon 系统配置模块，存储 License_Portal API 连接参数
- **CloudVision**: Arista 网络管理平台，提供集中式 License 管理功能
- **DNA_Center**: Cisco 数字化网络架构中心（现更名为 Catalyst Center），提供智能 License 管理
- **Mist**: Juniper 云原生网络管理平台，提供基于订阅的 License 管理

## 现状分析

### 当前 AmpCon License 激活流程

AmpCon 当前的 License 激活流程与设备 ZTP 上线流程紧密耦合，具体步骤如下：

1. **基础环境准备**：设备通电启动，进入初始化阶段
2. **设备注册**：设备通过 DHCP 消息后，发送消息进行设备注册
3. **暂存等待**：设备暂存于 Parking_Lot 中等待 ZTP 流程完成
4. **获取 HWID**：AmpCon 同步进行获取设备 HWID 的操作
   - 若成功获得设备 HWID，则需要用户根据 HWID 到 License_Portal 门户进行 License 创建，生成 License_File 和对外提供 API 供自动激活调用
   - 若失败则等待设备持续的消息发送，直到 AmpCon 获得 HWID
5. **License 校验判断**：根据设备 HWID 判断设备是否已导入 License
   - 若已导入：进行极简 ZTP 流程
   - 若未导入：持续进行极简 ZTP 并进行反复注册流程，同时进行 AmpCon License 导入操作
6. **License 激活方式**：AmpCon 平台提供两种 License 激活方式
   - **手动导入方式**：根据 License_Portal 网站得到 License_File，用户在 AmpCon 进行手动导入
   - **自动激活方式**：填写 System_Configuration 参数，通过 Quick_Activate 调用 License_Portal API 进行在线激活
7. **设备上线**：License 激活成功后，设备开始进行极简 ZTP 上线

### 现状痛点

| 编号 | 痛点描述 | 影响 |
|------|----------|------|
| P1 | 极简 ZTP 流程中对 License 的校验会阻断设备上线 | 部署效率低，设备无法快速投入使用 |
| P2 | License 激活方式虽有两种但界面不够直观，操作步骤多 | 用户操作体验差，学习成本高 |
| P3 | License 信息展示不完善，缺少有效期、剩余时间等关键信息 | 无法有效管理 License 生命周期 |
| P4 | 批量部署场景下效率不高 | 大规模部署时人工成本高、耗时长 |
| P5 | 无法在设备上架前预导入 License | 无法提前准备，影响部署节奏 |
| P6 | License 与设备的 HWID 绑定关系展示不清晰 | 难以快速定位设备 License 状态 |

## 竞品分析

### Arista CloudVision License 管理方案

| 维度 | 方案特点 |
|------|----------|
| 激活方式 | 支持云端自动激活，设备注册后自动从 Arista 云端拉取 License；支持离线场景通过导入 Token 文件激活 |
| 设备绑定 | 基于设备序列号（Serial Number）自动绑定，无需用户手动关联 |
| 批量管理 | 支持通过 CSV 批量导入 License，提供批量操作界面 |
| 信息展示 | 提供 License 仪表盘，展示使用率、到期时间线、合规状态等 |
| ZTP 集成 | License 校验与 ZTP 流程解耦，设备可先完成配置再激活 License |
| 预部署 | 支持 License 预分配（Pre-provisioning），设备上架前即可绑定 |

### Cisco DNA Center / Catalyst Center License 管理方案

| 维度 | 方案特点 |
|------|----------|
| 激活方式 | Smart Licensing 体系，支持在线直连 Cisco Smart Account 自动激活；离线场景支持 SLAC（Specific License Authorization Code）文件导入 |
| 设备绑定 | 基于设备 UDI（Unique Device Identifier）自动识别和绑定 |
| 批量管理 | 通过 Smart Account 统一管理，支持 License 池化和自动分配 |
| 信息展示 | 提供 License 合规性仪表盘、使用趋势图、到期预警通知 |
| ZTP 集成 | PnP（Plug and Play）流程中 License 为非阻塞项，设备可先上线再激活 |
| 预部署 | 支持 License Reservation，可在设备部署前预留和绑定 License |

### Juniper Mist License 管理方案

| 维度 | 方案特点 |
|------|----------|
| 激活方式 | 云原生订阅模式，设备 Claim 到组织后自动从订阅池分配 License；支持 Activation Code 离线激活 |
| 设备绑定 | 基于设备 Claim Code / Serial Number 自动关联，支持组织级 License 池 |
| 批量管理 | 订阅池模式天然支持批量，新设备加入自动消耗池中 License |
| 信息展示 | 提供订阅概览、使用量统计、到期提醒、自动续订状态 |
| ZTP 集成 | 设备 Claim 后即可开始配置下发，License 分配为异步后台操作 |
| 预部署 | 订阅池模式下无需预绑定，只需确保池中有足够 License 额度 |

### 竞品对比总结与启示

| 对比维度 | 竞品共性做法 | AmpCon 当前差距 | 优化方向 |
|----------|-------------|----------------|----------|
| 激活自动化 | 设备注册后自动完成激活，用户无需手动干预 | 需要用户手动触发或配置 | 提升自动化程度 |
| ZTP 解耦 | License 校验不阻塞设备上线流程 | License 校验阻断 ZTP | 解耦 License 与 ZTP |
| 批量效率 | 支持池化管理或批量操作 | 批量场景效率低 | 引入预导入池和批量操作 |
| 信息可视化 | 提供仪表盘、趋势图、到期预警 | 信息展示不完善 | 增强可视化展示 |
| 预部署能力 | 支持设备上架前预绑定或预分配 | 不支持预导入 | 增加预导入池功能 |

## 优化需求

### 需求 1：License 激活场景自动识别

**用户故事：** 作为网络管理员，我希望 AmpCon 能自动识别当前网络环境并推荐合适的 License 激活方式，以便我能快速选择最优激活路径。

#### 验收标准

1. WHEN AmpCon 启动 License 激活流程时, THE AmpCon SHALL 检测与 License_Portal 的网络连通性并在 10 秒内返回检测结果
2. WHEN 网络连通性检测成功时, THE AmpCon SHALL 推荐使用 Quick_Activate 在线激活方式并显示"在线激活可用"状态标识
3. WHEN 网络连通性检测失败时, THE AmpCon SHALL 推荐使用本地导入方式并显示"离线模式"状态标识
4. THE AmpCon SHALL 在 License 管理界面同时提供在线激活和本地导入两种激活入口，允许用户手动切换

### 需求 2：在线自动激活（联网场景）

**用户故事：** 作为网络管理员，我希望在 AmpCon 能联网的情况下，通过 Quick_Activate 功能自动完成 License 激活，以便减少手动操作步骤。

#### 验收标准

1. WHEN 用户在 System_Configuration 中配置了有效的 License_Portal API 凭证时, THE AmpCon SHALL 验证凭证有效性并显示连接状态
2. WHEN 新设备注册且 AmpCon 成功获取设备 HWID 时, THE AmpCon SHALL 自动调用 License_Portal API 查询该 HWID 是否已有可用 License
3. WHEN License_Portal 返回该 HWID 存在可用 License 时, THE AmpCon SHALL 自动下载并激活该 License，无需用户手动干预
4. WHEN License_Portal 返回该 HWID 无可用 License 时, THE AmpCon SHALL 通知用户需要在 License_Portal 创建 License，并提供跳转链接
5. IF 在线激活过程中 API 调用失败, THEN THE AmpCon SHALL 记录错误日志、显示失败原因，并提供重试按钮和切换到本地导入的选项
6. WHEN 批量设备注册时, THE AmpCon SHALL 支持批量在线激活，按队列顺序逐一调用 License_Portal API 完成激活

### 需求 3：本地导入激活（离线场景）

**用户故事：** 作为网络管理员，我希望在 AmpCon 无法联网的情况下，能通过本地导入 License 文件完成激活，以便在隔离网络环境中也能正常部署设备。

#### 验收标准

1. THE AmpCon SHALL 支持单个 License_File 的手动上传导入
2. THE AmpCon SHALL 支持批量 License_File 的打包上传导入（支持 ZIP 压缩包格式）
3. WHEN 用户上传 License_File 时, THE AmpCon SHALL 解析文件中的 HWID 信息并自动匹配 Parking_Lot 中对应的设备
4. WHEN License_File 中的 HWID 与 Parking_Lot 中某设备的 HWID 匹配成功时, THE AmpCon SHALL 自动将该 License 绑定到对应设备并完成激活
5. IF 上传的 License_File 格式无效或已损坏, THEN THE AmpCon SHALL 拒绝导入并显示具体的错误原因（如"文件格式错误"、"签名校验失败"）
6. IF 上传的 License_File 中的 HWID 在 Parking_Lot 中无匹配设备, THEN THE AmpCon SHALL 将该 License 存入预导入池，待对应设备注册后自动激活
7. WHEN 用户进行批量导入时, THE AmpCon SHALL 显示导入进度和每个 License 的匹配结果（成功/待匹配/失败）

### 需求 4：极简 ZTP 流程中 License 校验优化

**用户故事：** 作为网络管理员，我希望设备在极简 ZTP 上线过程中不因 License 未激活而阻塞，以便设备能尽快完成基础配置并投入使用。

#### 验收标准

1. WHEN 设备进入极简 ZTP 流程时, THE AmpCon SHALL 跳过 License 激活状态校验，允许设备继续完成 ZTP 配置下发
2. WHILE 设备处于 ZTP 流程中且 License 未激活时, THE AmpCon SHALL 在设备状态中标记"License 待激活"警告，但不阻断 ZTP 流程
3. WHEN ZTP 流程完成且设备 License 仍未激活时, THE AmpCon SHALL 在设备管理界面显示醒目的 License 激活提醒通知
4. THE AmpCon SHALL 支持 ZTP 完成后的异步 License 激活，设备正常运行不受 License 激活时序影响
5. IF 设备 License 超过配置的宽限期（默认 30 天）仍未激活, THEN THE AmpCon SHALL 升级告警级别为"严重"并通知管理员

### 需求 5：License 信息展示与状态管理优化

**用户故事：** 作为网络管理员，我希望能在统一界面中查看所有 License 的关键信息、设备绑定关系和状态，以便我能高效管理 License 生命周期并快速定位问题设备。

#### 验收标准

1. THE AmpCon SHALL 在 License 管理界面展示以下信息字段：License 编号、绑定设备名称、设备 HWID、License 类型、激活时间、License 总有效期、License 剩余有效期、License 状态
2. THE AmpCon SHALL 以可视化进度条形式展示每个 License 的剩余有效期占总有效期的比例
3. WHEN License 剩余有效期少于 30 天时, THE AmpCon SHALL 将该 License 的状态标识变更为黄色"即将过期"警告
4. WHEN License 已过期时, THE AmpCon SHALL 将该 License 的状态标识变更为红色"已过期"告警
5. THE AmpCon SHALL 提供 License 到期时间线视图，按到期时间排序展示所有 License
6. THE AmpCon SHALL 在 Dashboard 首页展示 License 概览统计卡片（包含：总数、已激活数、未激活数、即将过期数、已过期数）
7. THE AmpCon SHALL 在设备列表中为每台设备显示基于 HWID 绑定的 License 状态标识（已激活/未激活/已过期/即将过期）
8. WHEN 用户查看设备详情时, THE AmpCon SHALL 展示该设备 HWID 所绑定的 License 详细信息（包括 License 类型、激活时间、有效期）
9. THE AmpCon SHALL 提供按 License 状态筛选设备的过滤功能（筛选条件包括：全部、已激活、未激活、已过期、30天内即将过期）

### 需求 6：License 管理界面视觉优化

**用户故事：** 作为网络管理员，我希望 License 管理界面美观、直观且操作便捷，以便提升日常管理效率和使用体验。

#### 验收标准

1. THE AmpCon SHALL 采用卡片式布局展示 License 概览信息，每张卡片包含关键状态指标和快捷操作入口
2. THE AmpCon SHALL 使用统一的色彩编码体系标识 License 状态（绿色=已激活、灰色=未激活、黄色=即将过期、红色=已过期）
3. THE AmpCon SHALL 提供 License 列表视图和卡片视图两种展示模式，用户可自由切换
4. WHEN 用户执行 License 激活操作时, THE AmpCon SHALL 提供操作进度反馈动画和完成状态提示
5. THE AmpCon SHALL 支持 License 数据的表格排序（按激活时间、到期时间、设备名称排序）和关键字搜索功能
6. THE AmpCon SHALL 在移动端和桌面端均提供响应式布局，确保不同屏幕尺寸下的可用性

### 需求 7：License 预导入与自动匹配

**用户故事：** 作为网络管理员，我希望能在设备上架前预先导入 License 文件，设备注册后自动完成激活，以便加速大规模部署场景下的上线效率。

#### 验收标准

1. THE AmpCon SHALL 提供 License 预导入池功能，允许用户在设备注册前批量上传 License_File
2. WHEN 新设备注册并获取到 HWID 时, THE AmpCon SHALL 自动在预导入池中基于 HWID 检索匹配的 License 并完成激活
3. THE AmpCon SHALL 在预导入池界面展示每个预导入 License 的状态（待匹配/已匹配/已过期）及其对应的 HWID 信息
4. WHEN 预导入池中的 License 成功通过 HWID 匹配设备时, THE AmpCon SHALL 发送激活成功通知并更新设备 License 状态
5. THE AmpCon SHALL 支持从预导入池中删除或导出未匹配的 License 记录

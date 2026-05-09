# System Settings 软件需求规格说明书（SR）

| 项目 | 内容 |
|------|------|
| 文档编号 | SR-AMPCON-SYSTEM-001 |
| 版本 | v1.0 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-04-14 |

---

## 2. 功能需求

System Settings 包含 3 个功能模块（Tab）：Base Services（NTP + Syslog）、Maintenance（数据保留）、Integration（SMTP）。

### 2.1 NTP 时间同步

#### 2.1.1 功能说明

配置全局 NTP 参数（主备 NTP 服务器、时区、夏令时），确保全网设备（交换机、AP、防火墙等）时间同步，保证 Syslog 时间对齐、安全证书校验有效、排障数据一致性。

NTP 参数存储在底座层面，底座本身不直接与设备通信。各 App 读取底座的 NTP 配置后，按自己管理的设备类型翻译成设备原生命令并下发。例如：
- 交换机（PicOS）：`set system ntp server 10.1.1.100` + `set system timezone Asia/Shanghai`
- AP（OpenWrt）：`uci set system.@system[0].zonename='Asia/Shanghai'` + `uci set system.@system[0].timezone='CST-8'`

前置条件：
- AmpCon OS 底座 ≥ v2.0.0-LTS
- 操作用户需 SuperAdmin 权限（查看仅需 SiteAdmin/Viewer）

#### 2.1.2 竞品功能设计及流程说明

| 竞品 | 实现方式 |
|------|----------|
| UniFi (Ubiquiti) | NTP 在 System Settings 中全局配置，自动推送到所有 Adopted 设备 |
| Cisco DNA Center | NTP 在 Design → Network Settings 中按层级配置（Global / Site），支持继承和覆盖 |
| Aruba Central | NTP 在 Global Settings 中配置，自动同步到所有 Gateway 和 AP |

AmpCon 差异点：底座只存储参数，不直接下发；由各 App 负责翻译和下发，支持不同设备类型的差异化映射。

#### 2.1.3 功能业务流程

```
管理员进入 System Settings → Base Services
    │
    ▼
NTP 卡片默认启用，显示配置表单
    │
    ▼
填写/修改 NTP Server 1、NTP Server 2、Timezone、DST
    │
    ▼
底部浮出保存栏（"You have unsaved changes" + Discard / Save Changes）
    │
    ▼
点击 Save Changes → 参数写入底座数据库
    │
    ▼
各 App 下次同步时读取新参数 → 翻译为设备原生命令 → 下发到设备
```

#### 2.1.4 原型界面

```
┌──────────────────────────────────────────────────────────┐
│ [🕐] NTP Time Synchronization                     [ON]  │
│ Ensure consistent time across all managed devices        │
├──────────────────────────────────────────────────────────┤
│ BASIC SETTINGS                                           │
│                                                          │
│ NTP Server 1 (Primary)      NTP Server 2 (Backup)       │
│ ┌──────────────────┐        ┌──────────────────┐        │
│ │ 10.1.1.100       │        │ 202.108.6.95     │        │
│ └──────────────────┘        └──────────────────┘        │
│                                                          │
│ Timezone                    Daylight Saving Time         │
│ ┌──────────────────┐        ┌──────────────────┐        │
│ │ Asia/Shanghai ▼  │        │ Disabled    [OFF] │        │
│ └──────────────────┘        └──────────────────┘        │
│ IANA standard timezone ID    Auto-suggested by timezone  │
│                                                          │
│ ℹ NTP parameters stored at platform level. Each App     │
│   reads and pushes device-native commands.               │
└──────────────────────────────────────────────────────────┘

禁用状态：
┌──────────────────────────────────────────────────────────┐
│ [🕐] NTP Time Synchronization                    [OFF]  │
├──────────────────────────────────────────────────────────┤
│              🕐 NTP synchronization is disabled          │
│     Device clocks may drift, affecting logs and certs    │
└──────────────────────────────────────────────────────────┘
```

#### 2.1.5 交互说明

| 交互 | 说明 |
|------|------|
| 启用/禁用开关 | 控制整个 NTP 配置区域的显示/隐藏。禁用时显示居中图标+说明文字 |
| NTP Server 输入框 | 支持 IP 地址或 FQDN（如 pool.ntp.org） |
| Timezone 下拉 | IANA 标准时区 ID（如 Asia/Shanghai），底座自动映射到设备原生格式 |
| DST 开关 | 根据所选时区自动建议，用户可手动覆盖 |
| 修改任意字段 | 底部浮出保存栏："You have unsaved changes" + Discard / Save Changes |
| Save Changes | 保存所有修改，保存栏变绿色 "Changes saved successfully" 2 秒后消失 |
| Discard | 放弃修改，恢复上次保存状态，保存栏消失 |

#### 2.1.6 列表字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| Enable NTP | 开关 | — | Enabled | 全局 NTP 启用/禁用 |
| NTP Server 1 | 文本 | 是 | 空 | 主 NTP 服务器，支持 IP 或 FQDN |
| NTP Server 2 | 文本 | 否 | 空 | 备 NTP 服务器 |
| Timezone | 下拉 | 是 | UTC | IANA 标准时区 ID |
| DST | 开关 | — | Disabled | 夏令时开关 |

#### 2.1.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| NTP 禁用 | "NTP synchronization is disabled. Device clocks may drift." | 内联占位 |
| 保存成功 | "Changes saved successfully" | 浮动保存栏绿色 2s |
| NTP Server 1 为空 | "Primary NTP server is required" | 字段级错误 |
| 无效 IP/FQDN 格式 | "Invalid address format" | 字段级错误 |

#### 2.1.8 异常与容错处理

| 异常场景 | 处理方式 |
|----------|----------|
| NTP Server 地址不可达 | 底座不校验可达性（由 App 下发后设备自行重试） |
| 无效的 IP/FQDN 格式 | 前端格式校验，阻止保存 |
| App 读取配置失败 | App 使用上次缓存的配置，记录错误日志 |

#### 2.1.9 权限控制要求

| 操作 | 权限 |
|------|------|
| 查看 NTP 配置 | SiteAdmin / Viewer |
| 修改 NTP 配置 | SuperAdmin |

#### 2.1.10 功能约束与边界

| 约束 | 说明 |
|------|------|
| 底座只存储，不下发 | NTP 参数由各 App 读取后按设备类型翻译下发 |
| 站点可覆盖 | 站点级 Site Settings 可覆盖全局 NTP 配置 |
| 设备差异化映射由 App 负责 | 交换机用 `set system ntp`，AP 用 `uci set`，底座不关心 |
| 最多 2 个 NTP Server | 主备各一个 |
| 保存交互 | 所有 Tab 共享同一个浮动保存栏，跨 Tab 切换不丢失未保存修改 |

#### 2.1.11 非功能需求

| 项目 | 指标 |
|------|------|
| 配置保存响应时间 | ≤ 1 秒 |
| App 读取配置延迟 | ≤ 5 秒（下次同步周期） |

---

### 2.2 Syslog 日志服务器

#### 2.2.1 功能说明

配置全局 Syslog 服务器参数（地址、端口、协议），实现全网设备日志的集中收集。与 NTP 相同，Syslog 参数存储在底座层面，各 App 读取后按设备类型翻译下发。

前置条件：
- AmpCon OS 底座 ≥ v2.0.0-LTS
- 操作用户需 SuperAdmin 权限
- 需要一台可接收 Syslog 的日志服务器（如 Graylog、Splunk、rsyslog 等）

#### 2.2.2 竞品功能设计及流程说明

| 竞品 | 实现方式 |
|------|----------|
| UniFi | 在 System Settings → Remote Logging 中配置，支持 Syslog Server 地址和端口 |
| Cisco DNA Center | 在 Design → Network Settings → Syslog 中按层级配置，支持多个 Server |
| Aruba Central | 在 Global Settings → Syslog 中配置，支持多个 Syslog Server |

AmpCon 差异点：底座存储参数，App 负责下发；支持站点级覆盖；当前版本仅支持单个 Syslog Server。

#### 2.2.3 功能业务流程

```
管理员进入 System Settings → Base Services
    │
    ▼
Syslog 卡片默认启用，显示配置表单
    │
    ▼
填写 Syslog Server Address、Port、选择 Protocol（UDP/TCP）
    │
    ▼
底部浮出保存栏 → 点击 Save Changes
    │
    ▼
参数写入底座数据库 → 各 App 读取 → 翻译下发到设备
```

#### 2.2.4 原型界面

```
┌──────────────────────────────────────────────────────────┐
│ [📡] Syslog Server                                [ON]  │
│ Centralized log collection for all managed devices       │
├──────────────────────────────────────────────────────────┤
│ Syslog Server Address                    Port            │
│ ┌────────────────────────────┐  ┌──────────────┐        │
│ │ 10.0.0.200                 │  │ 514          │        │
│ └────────────────────────────┘  └──────────────┘        │
│                                                          │
│ Protocol                                                 │
│ ┌─────────┬─────────┐                                   │
│ │  UDP ✓  │   TCP   │                                   │
│ └─────────┴─────────┘                                   │
│                                                          │
│ ℹ Syslog parameters stored globally. Each App pushes    │
│   config to its devices. Sites can override.             │
└──────────────────────────────────────────────────────────┘

禁用状态：
┌──────────────────────────────────────────────────────────┐
│ [📡] Syslog Server                               [OFF]  │
├──────────────────────────────────────────────────────────┤
│         📡 Syslog forwarding is disabled                 │
│   Device logs will not be sent to a central collector    │
└──────────────────────────────────────────────────────────┘
```

#### 2.2.5 交互说明

| 交互 | 说明 |
|------|------|
| 启用/禁用开关 | 控制整个 Syslog 配置区域的显示/隐藏 |
| Server Address | 支持 IP 或 FQDN |
| Port | 默认 514，可自定义 |
| Protocol 切换 | UDP / TCP 二选一，segment toggle 样式，点击即切换 |
| 修改任意字段 | 触发底部浮动保存栏 |

#### 2.2.6 列表字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| Enable Syslog | 开关 | — | Enabled | 全局 Syslog 启用/禁用 |
| Server Address | 文本 | 是 | 空 | Syslog 服务器地址，支持 IP 或 FQDN |
| Port | 数字 | 是 | 514 | Syslog 端口，取值 1–65535 |
| Protocol | 切换 | 是 | UDP | UDP 或 TCP |

#### 2.2.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| Syslog 禁用 | "Syslog forwarding is disabled. Device logs will not be sent to a central collector." | 内联占位 |
| Server Address 为空 | "Syslog server address is required" | 字段级错误 |
| 无效端口号 | "Port must be between 1 and 65535" | 字段级错误 |

#### 2.2.8 异常与容错处理

| 异常场景 | 处理方式 |
|----------|----------|
| Syslog Server 不可达 | 底座不校验可达性，由设备端重试 |
| 无效端口号 | 前端校验（1–65535），阻止保存 |

#### 2.2.9 权限控制要求

| 操作 | 权限 |
|------|------|
| 查看 Syslog 配置 | SiteAdmin / Viewer |
| 修改 Syslog 配置 | SuperAdmin |

#### 2.2.10 功能约束与边界

| 约束 | 说明 |
|------|------|
| 底座只存储，不下发 | 与 NTP 相同，App 负责翻译和下发 |
| 站点可覆盖 | 站点级可配置不同的 Syslog Server（如跨国部署数据不出境） |
| 仅支持 UDP/TCP | 不支持 TLS（部分设备不支持） |
| 单个 Syslog Server | 当前版本仅支持配置一个全局 Syslog Server |

#### 2.2.11 非功能需求

| 项目 | 指标 |
|------|------|
| 配置保存响应时间 | ≤ 1 秒 |

---

### 2.3 数据保留策略

#### 2.3.1 功能说明

配置底座数据库中两类数据的保留时长：告警/事件日志 和 监控/统计数据。超过保留期的数据在每日夜间维护窗口自动清理，无需手动操作。同时展示当前数据库使用量（只读）。

前置条件：
- AmpCon OS 底座 ≥ v2.0.0-LTS
- 数据库服务 PostgreSQL 15+ 正常运行

#### 2.3.2 竞品功能设计及流程说明

| 竞品 | 实现方式 |
|------|----------|
| UniFi | 在 System Settings → Advanced 中配置 Data Retention，按天数设置 |
| Cisco DNA Center | 在 System → Settings → Data Retention 中分类配置（Assurance、Events、Audit） |
| Aruba Central | 数据保留由云端自动管理，用户不可配置 |

AmpCon 差异点：分为两类数据（告警日志 vs 监控数据），各有独立的保留天数和取值范围，自动清理无需手动触发。

#### 2.3.3 功能业务流程

```
管理员进入 System Settings → Maintenance
    │
    ▼
查看/修改两个保留天数
    │
    ▼
底部浮出保存栏 → 点击 Save Changes
    │
    ▼
参数写入底座数据库
    │
    ▼
每日夜间维护窗口自动清理超期数据
```

#### 2.3.4 原型界面

```
┌──────────────────────────────────────────────────────────┐
│ [💾] Data Retention                                      │
│ Configure how long data is kept. Expired data is         │
│ automatically cleaned up.                                │
├──────────────────────────────────────────────────────────┤
│ Alarm & Event Log Retention    Monitoring & Statistics   │
│ ┌──────┐                       ┌──────┐                 │
│ │  90  │ days                  │  30  │ days            │
│ └──────┘                       └──────┘                 │
│ Default: 90. Range: 1–365.     Default: 30. Range: 1–180│
│                                Affects charts & graphs.  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Database Usage              12.4 GB / 50 GB        │   │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│ │ 24.8% used                          37.6 GB free   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ℹ Data older than the configured retention period is     │
│   automatically removed during nightly maintenance.      │
└──────────────────────────────────────────────────────────┘
```

#### 2.3.5 交互说明

| 交互 | 说明 |
|------|------|
| 保留天数输入框 | 数字输入，带 HTML min/max 属性限制取值范围 |
| DB 使用量进度条 | 只读展示，不可交互。显示已用/总容量/百分比/剩余 |
| 修改天数 | 触发底部浮动保存栏 |
| DB 使用量 > 80% | 进度条变为琥珀色 |

#### 2.3.6 列表字段

| 字段 | 类型 | 必填 | 默认值 | 取值范围 | 说明 |
|------|------|------|--------|----------|------|
| Alarm & Event Log Retention | 数字 | 是 | 90 | 1–365 天 | 告警记录、操作日志、系统事件的保留时长 |
| Monitoring Data Retention | 数字 | 是 | 30 | 1–180 天 | 设备性能指标、流量统计、图表数据的保留时长 |
| Database Usage | 进度条 | — | — | — | 只读，显示已用/总容量/百分比/剩余 |

#### 2.3.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| 保留天数超出范围 | 浏览器原生 min/max 校验阻止输入 | 浏览器原生 |
| 保留天数为空 | "Retention period is required" | 字段级错误 |
| DB 使用量 > 80% | 进度条变琥珀色，提示 "Consider reducing retention period" | 内联警告 |
| DB 使用量 > 95% | 进度条变红色，提示 "Database nearly full" | 内联错误 |

#### 2.3.8 异常与容错处理

| 异常场景 | 处理方式 |
|----------|----------|
| 夜间清理任务失败 | 记录错误日志，下次维护窗口重试 |
| 磁盘空间不足 | DB 使用量展示区域显示红色警告 |

#### 2.3.9 权限控制要求

| 操作 | 权限 |
|------|------|
| 查看保留策略和 DB 使用量 | SiteAdmin / Viewer |
| 修改保留天数 | SuperAdmin |

#### 2.3.10 功能约束与边界

| 约束 | 说明 |
|------|------|
| 自动清理，无手动按钮 | 超期数据在每日夜间维护窗口自动删除 |
| 两类数据独立配置 | 告警日志和监控数据各有独立的保留天数和取值范围 |
| 修改保留天数不会立即清理 | 新的保留策略在下次夜间维护时生效 |
| DB 使用量为只读 | 不可手动释放空间 |

#### 2.3.11 非功能需求

| 项目 | 指标 |
|------|------|
| 夜间清理执行时间 | ≤ 10 分钟 |
| 清理期间性能影响 | 数据库查询延迟增加 ≤ 20% |

---

### 2.4 SMTP 邮件通知

#### 2.4.1 功能说明

配置 SMTP 邮件服务器，使底座能够发送告警通知邮件、定时报表、密码重置链接等系统邮件。与 NTP/Syslog 不同，SMTP 是底座自身使用的功能，不下发到设备。

支持 SSL/TLS/无加密 三种连接方式，支持可选的用户名密码认证。加密和认证是两个独立的维度，互不联动（不加密也可以启用认证，加密也可以不启用认证）。

前置条件：
- AmpCon OS 底座 ≥ v2.0.0-LTS
- 需要一台可用的 SMTP 邮件服务器（如企业 Exchange、Gmail SMTP 等）
- 操作用户需 SuperAdmin 权限

#### 2.4.2 竞品功能设计及流程说明

| 竞品 | 实现方式 |
|------|----------|
| UniFi (Ubiquiti) | 在 System Settings → Email 中配置，字段与 AmpCon 基本一致 |
| Cisco DNA Center | 在 System → Settings → SMTP 中配置，支持 TLS |
| Aruba Central | 云端内置邮件服务，无需用户配置 SMTP |

AmpCon 差异点：加密和认证独立配置，认证开启后才显示用户名密码字段（动态展开），支持 Send Test Email 验证。

#### 2.4.3 功能业务流程

```
管理员进入 System Settings → Integration
    │
    ▼
SMTP 卡片默认启用，显示配置表单
    │
    ▼
填写 SMTP Server、Port、选择 Secure Connection（SSL/TLS/None）、Sender Email
    │
    ├─ 需要认证 → 开启 Authentication → 展开 Username / Password 输入区域
    │
    └─ 不需要认证 → Authentication 保持关闭，Username/Password 隐藏
    │
    ▼
（可选）点击 Send Test Email → 发送测试邮件验证配置
    │
    ▼
底部浮出保存栏 → 点击 Save Changes
```

#### 2.4.4 原型界面

```
┌──────────────────────────────────────────────────────────┐
│ [✉] Email Notifications                           [ON]  │
│ Configure SMTP to send alarm alerts, reports, and        │
│ system notifications                                     │
├──────────────────────────────────────────────────────────┤
│ SERVER CONFIGURATION                                     │
│                                                          │
│ SMTP Server Address                    Port              │
│ ┌────────────────────────────┐  ┌──────────────┐        │
│ │ smtp.example.com           │  │ 587          │        │
│ └────────────────────────────┘  └──────────────┘        │
│                                                          │
│ Secure Connection          ┌─────┬─────┬──────┐         │
│                            │ SSL │ TLS │ None │         │
│                            └─────┴─────┴──────┘         │
│                                                          │
│ Sender Email                                             │
│ ┌──────────────────────────────────────────────┐        │
│ │ noreply@yourcompany.com                      │        │
│ └──────────────────────────────────────────────┘        │
├──────────────────────────────────────────────────────────┤
│ Authentication                                    [OFF]  │
│ Enable if your SMTP server requires login credentials    │
│                                                          │
│ (开启后动态展开)                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Username: ┌──────────────────┐                     │   │
│ │           │ smtp_user        │                     │   │
│ │           └──────────────────┘                     │   │
│ │ Password: ┌──────────────────┐ 👁                  │   │
│ │           │ ••••••••         │                     │   │
│ │           └──────────────────┘                     │   │
│ └────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│                              [✉ Send Test Email]         │
└──────────────────────────────────────────────────────────┘

禁用状态：
┌──────────────────────────────────────────────────────────┐
│ [✉] Email Notifications                          [OFF]  │
├──────────────────────────────────────────────────────────┤
│         ✉ Email notifications are disabled               │
│   Enable SMTP to send alarm alerts and notifications     │
└──────────────────────────────────────────────────────────┘
```

#### 2.4.5 交互说明

| 交互 | 说明 |
|------|------|
| SMTP 启用/禁用开关 | 控制整个 SMTP 配置区域的显示/隐藏。禁用时显示居中图标+说明 |
| Secure Connection 切换 | SSL / TLS / None 三选一，segment toggle 样式 |
| Authentication 开关 | 独立于 Secure Connection，开启后动态展开 Username/Password 输入区域（带动画） |
| Password 眼睛图标 | 切换密码明文/密文显示 |
| Send Test Email | 仅在 SMTP 启用时可用。点击后发送测试邮件，成功显示 "Sent!" 绿色勾 2 秒 |
| 修改任意字段 | 触发底部浮动保存栏 |

#### 2.4.6 列表字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| Enable SMTP | 开关 | — | Enabled | 全局 SMTP 启用/禁用 |
| SMTP Server Address | 文本 | 是 | 空 | SMTP 服务器地址（IP 或 FQDN） |
| Port | 数字 | 是 | 空 | 常用端口：25（无加密）、465（SSL）、587（STARTTLS） |
| Secure Connection | 切换 | 是 | SSL | SSL / TLS / None |
| Sender Email | 文本 | 是 | 空 | 发件人邮箱地址 |
| Use Authentication | 开关 | — | Disabled | 是否需要登录认证 |
| Username | 文本 | 条件必填 | 空 | 仅 Authentication 开启时显示和必填 |
| Password | 密码 | 条件必填 | 空 | 仅 Authentication 开启时显示和必填，支持明文/密文切换 |

#### 2.4.7 提示说明

| 场景 | 提示内容 | 类型 |
|------|----------|------|
| SMTP 禁用 | "Email notifications are disabled" | 内联占位 |
| 测试邮件成功 | "Sent!" + 绿色勾 | 按钮状态变化 2s |
| 测试邮件失败 | "Failed to send: [原因]" | Toast 错误 |
| SMTP Server 为空 | "SMTP server address is required" | 字段级错误 |
| Auth 开启但 Username 为空 | "Username is required when authentication is enabled" | 字段级错误 |

#### 2.4.8 异常与容错处理

| 异常场景 | 处理方式 |
|----------|----------|
| SMTP 服务器不可达 | 保存不阻止（可预填配置），Send Test Email 时报错 |
| 认证失败 | Send Test Email 返回 "Authentication failed" |
| 邮件发送超时 | 超时 10 秒后提示 "Connection timeout" |

#### 2.4.9 权限控制要求

| 操作 | 权限 |
|------|------|
| 查看 SMTP 配置 | SiteAdmin / Viewer（密码字段显示为 ••••） |
| 修改 SMTP 配置 | SuperAdmin |
| 发送测试邮件 | SuperAdmin |

#### 2.4.10 功能约束与边界

| 约束 | 说明 |
|------|------|
| 加密和认证独立 | Secure Connection 和 Authentication 互不联动，可任意组合 |
| 底座自身使用 | SMTP 不下发到设备，仅底座用于发送系统邮件 |
| 单个 SMTP Server | 当前版本仅支持配置一个 SMTP 服务器 |
| Webhook/API Key 后续版本 | Integration Tab 当前仅有 SMTP，其余标记 "Coming Soon" |

#### 2.4.11 非功能需求

| 项目 | 指标 |
|------|------|
| 配置保存响应时间 | ≤ 1 秒 |
| 测试邮件发送超时 | 10 秒 |
| 密码存储 | 加密存储，API 不返回明文 |

---

## 3. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-04-14 | 初始版本 | AmpCon Product Team |

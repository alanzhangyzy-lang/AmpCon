# Arista 遥测指标分析

## 概述

Arista EOS 平台通过 gNMI (gRPC Network Management Interface) 和 OpenConfig YANG 模型提供全面的遥测能力。所有实时状态存储在统一的 SysDB 数据库中，可通过 API 和 SDK 访问。EOS 支持 OpenConfig gNMI 接口进行设备管理，所有 EOS 版本（物理、虚拟、容器化、云）均支持 OpenConfig。

## 遥测协议与架构

### gNMI 配置

```bash
management api gnmi
   transport grpc openmgmt
      port 6030
      vrf management
      ssl profile PROFILE
      authorization requests
   provider eos-native
```

### Octa (OpenConfig + TerminAttr)

启用 Octa 后，gNMI 支持：
- OpenConfig 路径（标准路径）
- EOS Native 路径（origin: eos_native）

```bash
management api gnmi
   provider eos-native
```

---

## 一、接口指标 (Interface Metrics)

### 1.1 OpenConfig 接口路径

| 指标类别 | gNMI 路径 | 说明 |
|---------|-----------|------|
| 接口状态 | `/interfaces/interface[name=<name>]/state/oper-status` | UP/DOWN |
| 接口描述 | `/interfaces/interface[name=<name>]/subinterfaces/subinterface[index=0]/state/description` | 接口描述 |
| 管理状态 | `/interfaces/interface[name=<name>]/state/admin-status` | 管理状态 |
| MTU | `/interfaces/interface[name=<name>]/state/mtu` | 最大传输单元 |
| 速率 | `/interfaces/interface[name=<name>]/state/rate` | 接口速率 |

### 1.2 接口计数器

| 指标 | gNMI 路径 | 说明 |
|------|-----------|------|
| 入站单播包 | `/interfaces/interface[name=<name>]/state/counters/in-unicast-pkts` | ifInUcastPkts |
| 出站单播包 | `/interfaces/interface[name=<name>]/state/counters/out-unicast-pkts` | ifOutUcastPkts |
| 入站多播包 | `/interfaces/interface[name=<name>]/state/counters/in-multicast-pkts` | ifInMulticastPkts |
| 出站多播包 | `/interfaces/interface[name=<name>]/state/counters/out-multicast-pkts` | ifOutMulticastPkts |
| 入站广播包 | `/interfaces/interface[name=<name>]/state/counters/in-broadcast-pkts` | ifInBroadcastPkts |
| 出站广播包 | `/interfaces/interface[name=<name>]/state/counters/out-broadcast-pkts` | ifOutBroadcastPkts |
| 入站字节数 | `/interfaces/interface[name=<name>]/state/counters/in-octets` | ifInOctets |
| 出站字节数 | `/interfaces/interface[name=<name>]/state/counters/out-octets` | ifOutOctets |
| 入站丢包 | `/interfaces/interface[name=<name>]/state/counters/in-discards` | ifInDiscards |
| 出站丢包 | `/interfaces/interface[name=<name>]/state/counters/out-discards` | ifOutDiscards |
| 入站错误 | `/interfaces/interface[name=<name>]/state/counters/in-errors` | ifInErrors |
| 出站错误 | `/interfaces/interface[name=<name>]/state/counters/out-errors` | ifOutErrors |
| CRC 错误 | `/interfaces/interface[name=<name>]/state/counters/in-crc-errors` | CRC 校验错误 |
| 帧错误 | `/interfaces/interface[name=<name>]/state/counters/in-frame-errors` | 帧错误 |
| 超大帧 | `/interfaces/interface[name=<name>]/state/counters/in-oversize-frames` | 超大帧计数 |

### 1.3 详细丢包计数器

```bash
# CLI 命令
show interfaces counters discards
show interfaces counters errors
```

**健康评分关键指标：**
- `in-discards` / `in-errors`: 入方向丢弃和错误
- `out-discards` / `out-errors`: 出方向丢弃和错误
- `in-crc-errors`: CRC 校验错误（物理层问题）
- `in-frame-errors`: 帧错误（同步问题）

---

## 二、光模块指标 (Optics/Transceiver Metrics)

### 2.1 Digital Optical Monitoring (DOM)

Arista 支持数字光监控 (DOM) 参数，用于监控光模块的实时性能和健康状态。

| 指标类别 | gNMI 路径 | 说明 |
|---------|-----------|------|
| 光模块状态 | `/components/component[name=<name>]/transceiver/state/status` | 光模块状态 |
| 温度 | `/components/component[name=<name>]/transceiver/state/physical-channel/channel[index=<idx>]/state/tx-laser-bias-current` | 温度监测 |
| 电压 | `/components/component[name=<name>]/transceiver/state/power-supply-voltage` | 供电电压 |
| Tx 功率 | `/components/component[name=<name>]/transceiver/state/physical-channel/channel[index=<idx>]/state/output-power` | 发送光功率 |
| Rx 功率 | `/components/component[name=<name>]/transceiver/state/physical-channel/channel[index=<idx>]/state/input-power` | 接收光功率 |
| 偏置电流 | `/components/component[name=<name>]/transceiver/state/physical-channel/channel[index=<idx>]/state/tx-laser-bias-current` | 激光器偏置电流 |

### 2.2 光模块阈值告警

| 阈值类型 | 说明 |
|---------|------|
| Tx 功率高/低告警 | 发送光功率超出阈值 |
| Rx 功率高/低告警 | 接收光功率超出阈值 |
| 温度高/低告警 | 温度超出正常范围 |
| 电压高/低告警 | 供电电压异常 |
| 偏置电流高/低告警 | 激光器电流异常 |

### 2.3 CLI 查看命令

```bash
show interfaces transceiver
show interfaces <interface> transceiver detail
```

### 2.4 DOM 阈值监控脚本

Arista 提供 DOM 脚本 ([aristanetworks/dom](https://github.com/aristanetworks/dom))：
- 定期轮询光功率水平
- 当 Tx/Rx 功率超出阈值时生成 syslog 事件
- 支持 SNMP v2c trap 或 v3 inform

---

## 三、路由协议指标 (Routing Protocol Metrics)

### 3.1 BGP 指标

#### BGP 路径

```
/network-instances/network-instance[name=default]/protocols/protocol[identifier=BGP][name=BGP]/bgp
```

| 指标 | gNMI 路径 | 说明 |
|------|-----------|------|
| BGP 全局状态 | `/bgp/global/state/router-id` | BGP Router ID |
| AS 号 | `/bgp/global/state/as` | 本地 AS 号 |
| 邻居状态 | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/state/session-state` | ESTABLISHED/IDLE 等 |
| 邻居 uptime | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/state/uptime` | 会话持续时间 |
| 入站路由数 | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/afi-safis/afi-safi[afi-safi-name=<name>]/state/prefixes/received` | 接收的前缀数 |
| 出站路由数 | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/afi-safis/afi-safi-name[afi-safi-name=<name>]/state/prefixes/sent` | 发送的前缀数 |
| 消息统计 | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/state/messages/received/UPDATE` | 接收的 UPDATE 消息数 |
| 消息统计 | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/state/messages/sent/UPDATE` | 发送的 UPDATE 消息数 |
| 会话翻转 | `/bgp/neighbors/neighbor[neighbor-address=<ip>]/state/flap-count` | 会话翻转次数 |

#### 健康关键指标

```bash
# gNMI Get 示例
gnmic -a 192.0.2.1:6030 -u admin -p admin --insecure get \
  --path '/network-instances/network-instance[name=default]/protocols/protocol[name=BGP]/bgp/neighbors'
```

### 3.2 OSPF 指标

| 指标 | gNMI 路径 | 说明 |
|------|-----------|------|
| OSPF 状态 | `/network-instances/network-instance[name=default]/protocols/protocol[identifier=OSPF][name=OSPF]/ospf/state/router-id` | OSPF Router ID |
| 邻居状态 | `/ospf/areas/area[identifier=<area>]/interfaces/interface[name=<intf>]/neighbors/neighbor[neighbor-id=<id>]/state/adjacency-state` | FULL/DOWN 等 |
| 邻居优先级 | `/ospf/areas/area[identifier=<area>]/interfaces/interface[name=<intf>]/neighbors/neighbor[neighbor-id=<id>]/state/priority` | DR 选举优先级 |
| LSDB 信息 | `/ospf/areas/area[identifier=<area>]/lsdb/lsas` | LSA 数据库 |

#### 支持的 OSPF 功能

- 多 OSPF 实例 (VRF)
- 区域内和区域间路由
- Type 1 和 2 外部路由
- 广播和点对点接口
- MD5 认证

### 3.3 IS-IS 指标

| 指标 | gNMI 路径 | 说明 |
|------|-----------|------|
| IS-IS 状态 | `/network-instances/network-instance[name=default]/protocols/protocol[identifier=ISIS][name=ISIS]/isis/state/router-id` | IS-IS Router ID |
| 邻居状态 | `/isis/levels/level[level-number=<level>]/neighbors/neighbor[system-id=<id>]/state/adjacency-state` | UP/DOWN |
| LSP 数据库 | `/isis/lsp-database/lsp` | LSP 信息 |

### 3.4 BFD 指标

| 指标 | gNMI 路径 | 说明 |
|------|-----------|------|
| BFD 会话状态 | `/bfd/interfaces/interface[name=<intf>]/peers/peer[ip=<ip>]/state/session-state` | UP/DOWN |
| 远程鉴别器 | `/bfd/interfaces/interface[name=<intf>]/peers/peer[ip=<ip>]/state/remote-discriminator` | 远程标识 |
| 本地鉴别器 | `/bfd/interfaces/interface[name=<intf>]/peers/peer[ip=<ip>]/state/local-discriminator` | 本地标识 |

---

## 四、遥测技术 (Telemetry Technologies)

### 4.1 In-band Telemetry (INT)

基于 Inband Flow Analyzer (IFA) RFC Draft - IFA 2.0 和 IFA 1.0

| 能力 | 说明 |
|------|------|
| 流路径追踪 | 收集每条流的路径信息 |
| 逐跳延迟 | 测量每跳延迟（驻留时间） |
| 拥塞检测 | 检测每跳拥塞状态 |
| IPv4/IPv6 支持 | 同时支持 IPv4 和 IPv6 流量 |

### 4.2 IFA Latency Analyzer

| 指标 | 说明 |
|------|------|
| RTT | 源到目的交换机的往返时间 |
| Per-hop Latency | 每跳驻留时间 |
| Probe 模式 | 发送 IFA 探测包测量延迟 |

### 4.3 TerminAttr 状态流

```
EOS SysDB → TerminAttr → CloudVision/Collector
```

**TerminAttr 配置：**

```bash
daemon TerminAttr
   exec /usr/bin/TerminAttr -cvaddr=<cv-server>:9910 \
     -cvauth=key,<key> -cvvrf=<vrf> \
     -grpcaddr=0.0.0.0:6042 \
     -disableaaa \
     -taillogs
   no shutdown
```

### 4.4 Telemetry Collector (DMF)

**REST API 端点：** `/api/v1/data/controller/telemetry/data`

| 指标类别 | 说明 |
|---------|------|
| CPU 利用率 | 设备 CPU 使用率 |
| 内存利用率 | 设备内存使用率 |
| 磁盘利用率 | 磁盘使用率 |
| 接口计数器 | 接口统计信息 |
| 传感器状态 | 温度、电压等传感器状态 |

---

## 五、接口拥塞和队列指标 (Congestion & Queue Metrics)

### 5.1 LANZ (Latency Analyzer)

Arista LANZ 提供接口拥塞和排队延迟的实时监控。

**支持平台：** FM6000, Arad, Trident II, Trident 3, Jericho, Tomahawk, XP80

| 功能 | 说明 |
|------|------|
| 队列长度监控 | 监控输出队列长度 |
| 微突发检测 | 近实时检测微突发 |
| 拥塞报告 | 实时报告拥塞信息 |
| 应用层通知 | 向应用层发送拥塞事件 |
| LANZ 镜像 | 自动镜像拥塞队列流量 |

#### LANZ 配置

```bash
# 启用 LANZ
switch(config)# lanz
switch(config-lanz)# show lanz

# LANZ 事件导出
switch(config)# lanz exporter <exporter-name>
switch(config-lanz-exporter)# collector host <ip> port <port>
```

### 5.2 队列统计 (ARISTA-QUEUE-MIB)

| 指标 | 说明 |
|------|------|
| 入队包数 | 每队列入队包计数 |
| 出队包数 | 每队列出队包计数 |
| 尾丢弃包数 | 队列尾丢弃计数 |
| 队列深度 | 当前队列深度 |
| 缓冲使用 | 缓冲区使用量 |

### 5.3 PFC 缓冲计数器

| 指标 | 说明 |
|------|------|
| PFC 计数 | 按优先级的 PFC 帧计数 |
| 缓冲高水位 | 缓冲使用高水位标记 |
| 缓冲轮询间隔 | 默认 2 秒 |

### 5.4 VoQ (Virtual Output Queue)

| 指标 | 说明 |
|------|------|
| VoQ 深度 | 虚拟输出队列深度 |
| 时间阈值 | 以时间单位配置尾丢弃阈值 |
| WRR 带宽 | 加权轮询带宽分配 |

### 5.5 Temporal Tail Drop Thresholds

| 功能 | 说明 |
|------|------|
| 时间阈值 | 以时间单位配置 TX 队列尾丢弃阈值 |
| 动态计算 | 根据接口速度和 WRR 带宽动态计算队列占用 |

---

## 六、硬件指标 (Hardware Metrics)

### 6.1 系统 CPU/内存/磁盘

| 指标 | gNMI 路径 | 说明 |
|------|-----------|------|
| CPU 利用率 | `/system/state/cpus/cpu[index=<idx>]/state/total/interval/instant` | CPU 总利用率 |
| 内存利用率 | `/system/state/memory/state/physical/used` | 已用物理内存 |
| 内存利用率 | `/system/state/memory/state/physical/free` | 空闲物理内存 |
| 磁盘利用率 | `/system/state/filesystems/filesystem[name=<name>]/state/used` | 磁盘使用量 |

### 6.2 传感器状态

| 传感器类型 | 指标 | 说明 |
|-----------|------|------|
| 温度 | 当前温度 | 摄氏度 |
| 温度 | 高临界阈值 | 高温告警阈值 |
| 温度 | 低临界阈值 | 低温告警阈值 |
| 电压 | 当前电压 | 伏特 |
| 电压 | 高临界阈值 | 高压告警阈值 |
| 电压 | 低临界阈值 | 低压告警阈值 |
| 风扇 | 转速 | RPM |
| 风扇 | 状态 | OK/FAIL |
| 电源 | 状态 | OK/FAIL |
| 电源 | 功率 | 瓦特 |

### 6.3 ARISTA-ENTITY-SENSOR-MIB

```bash
# CLI 查看传感器
show environment temperature
show environment voltage
show environment fan
show environment power
```

### 6.4 硬件资源利用率 (ARISTA-HARDWARE-UTILIZATION-MIB)

| 资源类型 | 说明 |
|---------|------|
| L2 转发表 | MAC 地址表容量和使用率 |
| L3 转发表 | 路由表容量和使用率 |
| ACL 表 | 访问控制列表表项使用率 |
| TCAM | 三态内容寻址存储器使用率 |
| ECMP 组 | ECMP 组数量 |
| NH 组 | 下一跳组数量 |

---

## 七、OpenConfig 模型支持

### 7.1 支持的 OpenConfig 模块

| 模块 | 版本 | 说明 |
|------|------|------|
| openconfig-acl | v1.0.0 | 访问控制列表 |
| openconfig-interfaces | v2.0.0 | 接口配置和状态 |
| openconfig-lacp | v1.1.0 | LACP 协议 |
| openconfig-lldp | v0.1.0 | LLDP 协议 |
| openconfig-network-instance | v0.8.1 | 网络实例/VRF |
| openconfig-bgp | v4.0.1 | BGP 协议 |
| openconfig-isis | v0.3.3 | IS-IS 协议 |
| openconfig-local-routing | v1.0.1 | 本地路由 |
| openconfig-vlan | v2.0.0 | VLAN 配置 |
| openconfig-relay-agent | v0.1.0 | DHCP 中继 |
| openconfig-routing-policy | v3.0.0 | 路由策略 |
| openconfig-system | v0.3.0 | 系统配置 |
| openconfig-platform-transceiver | - | 光模块/收发器 |
| openconfig-platform | - | 硬件组件 |

### 7.2 gNMI 操作示例

#### Get 操作

```bash
# 获取所有接口状态
gnmic -a 192.0.2.1:6030 -u admin -p admin --insecure get \
  --path 'interfaces/interface/state/oper-status'

# 获取 BGP 配置
gnmic -a 192.0.2.1:6030 -u admin -p admin --insecure get \
  --path '/network-instances/network-instance[name=default]/protocols/protocol[identifier=BGP][name=BGP]/bgp'

# 获取接口描述
gnmic -a 192.0.2.1:6030 -u admin -p admin --insecure get \
  --path '/interfaces/interface[name=Ethernet1]/subinterfaces/subinterface/state/description'
```

#### Subscribe 操作

```bash
# 订阅接口状态变化
gnmic -a 192.0.2.1:6030 -u admin -p admin --insecure subscribe \
  --path 'interfaces/interface/state/oper-status' \
  --mode stream \
  --stream-mode target-defined
```

---

## 八、健康评分关键指标总结

### 8.1 高优先级指标

| 类别 | 指标 | 阈值建议 | 健康影响 |
|------|------|---------|---------|
| 接口 | `oper-status` | UP | 关键 - 链路状态 |
| 接口 | `in-errors` / `out-errors` | 持续增长 | 高 - 数据包损坏 |
| 接口 | `in-discards` / `out-discards` | 持续增长 | 高 - 拥塞/策略丢弃 |
| 光模块 | Tx/Rx Power | 超出阈值 | 高 - 信号质量问题 |
| BGP | `session-state` | ESTABLISHED | 关键 - 路由邻居 |
| OSPF | `adjacency-state` | FULL | 关键 - 路由邻居 |
| 系统 | CPU 利用率 | < 80% | 高 - 处理能力 |
| 系统 | 内存利用率 | < 85% | 高 - 系统稳定性 |
| LANZ | Queue Depth | 超过阈值 | 中 - 拥塞预警 |

### 8.2 中优先级指标

| 类别 | 指标 | 说明 |
|------|------|------|
| 接口 | CRC Errors | 物理层问题 |
| 接口 | Frame Errors | 帧同步问题 |
| 光模块 | Temperature | 光模块温度 |
| 光模块 | Bias Current | 激光器健康 |
| BGP | Flap Count | 会话稳定性 |
| 硬件 | TCAM Usage | 硬件资源 |
| 硬件 | Temperature | 设备温度 |

### 8.3 告警规则示例

```yaml
# 接口错误告警
- alert: InterfaceErrors
  expr: rate(interface_in_errors[5m]) > 100
  severity: warning

# BGP 会话断开告警
- alert: BGPSessionDown
  expr: bgp_session_state != 1
  severity: critical

# 光模块功率告警
- alert: OpticsPowerLow
  expr: optics_rx_power < -15
  severity: warning

# LANZ 拥塞告警
- alert: InterfaceCongestion
  expr: lanz_queue_depth > 100000
  severity: warning
```

---

## 九、集成方案

### 9.1 Prometheus + Grafana

使用 gNMIc 订阅遥测数据并写入 Prometheus：

```yaml
# gnmic.yml
targets:
  - 192.0.2.1:6030
    username: admin
    password: admin
    insecure: true

subscriptions:
  interfaces:
    paths:
      - interfaces/interface/state/counters
      - interfaces/interface/state/oper-status
    stream-mode: sample
    sample-interval: 10s

  bgp:
    paths:
      - /network-instances/network-instance[name=default]/protocols/protocol[name=BGP]/bgp/neighbors
    stream-mode: sample
    sample-interval: 30s

outputs:
  prometheus:
    type: prometheus
    listen: :9804
```

### 9.2 Telegraf + InfluxDB

```toml
# telegraf.conf
[[inputs.gnmi]]
  addresses = ["192.0.2.1:6030"]
  username = "admin"
  password = "admin"
  insecure = true
  
  [[inputs.gnmi.subscription]]
    name = "interfaces"
    origin = "openconfig"
    path = "/interfaces/interface/state/counters"
    sample_interval = "10s"

[[outputs.influxdb_v2]]
  urls = ["http://influxdb:8086"]
  token = "token"
  organization = "org"
  bucket = "network"
```

---

## 参考资料

- [Arista OpenConfig Configuration](https://aristanetworks.github.io/openmgmt/configuration/openconfig/)
- [Arista gNMIc Examples](https://aristanetworks.github.io/openmgmt/examples/gnmi-clients/gnmic/)
- [Arista LANZ Documentation](https://www.arista.com/en/um-eos/eos-latency-analyzer-lanz)
- [OpenConfig Yang Models](https://openconfig.net/projects/models/)
- [Arista Telemetry Lab](https://aclabs.arista.com/telemetry/)

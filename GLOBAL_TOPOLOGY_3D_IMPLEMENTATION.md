# 全球拓扑 3D 地球实现文档

## 版本信息
- 版本: v3.1
- 日期: 2026-02-11
- 状态: 已完成

## 实现概述

成功实现了基于数学投影的 3D 地球仪，站点固定在地球表面，地球通过鼠标拖拽旋转。

## 核心功能

### 1. 3D 地球旋转系统

#### 旋转状态管理
```typescript
const [globeRotation, setGlobeRotation] = useState({ x: -20, y: 0 });
// x: 俯仰角 (pitch), y: 偏航角 (yaw)
const [isRotating, setIsRotating] = useState(false);
```

#### 鼠标交互
- 拓扑视图：鼠标拖拽旋转地球
- 网络视图：鼠标拖拽平移画布
- 通过 `viewMode` 区分不同的交互模式

### 2. 3D 数学投影系统

#### 经纬度到 3D 坐标转换
```typescript
const latLonTo3D = (lat: number, lon: number, radius: number = 200) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return { x, y, z };
};
```

#### 旋转矩阵应用
```typescript
const rotatePoint = (x: number, y: number, z: number, rotX: number, rotY: number) => {
  // 绕Y轴旋转（偏航）
  const cosY = Math.cos(rotY * Math.PI / 180);
  const sinY = Math.sin(rotY * Math.PI / 180);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  
  // 绕X轴旋转（俯仰）
  const cosX = Math.cos(rotX * Math.PI / 180);
  const sinX = Math.sin(rotX * Math.PI / 180);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  
  return { x: x1, y: y2, z: z2 };
};
```

#### 3D 到 2D 投影
```typescript
const project3DTo2D = (x: number, y: number, z: number) => {
  const perspective = 800;
  const scale = perspective / (perspective + z);
  return {
    x: 600 + x * scale,
    y: 300 + y * scale,
    scale: scale,
    visible: z > -200 // 只显示前半球
  };
};
```

### 3. 站点定位系统

#### 城市经纬度坐标
```typescript
const siteCoordinates: { [key: string]: { lat: number; lon: number } } = {
  '北京': { lat: 39.9, lon: 116.4 },
  '上海': { lat: 31.2, lon: 121.5 },
  '广州': { lat: 23.1, lon: 113.3 },
  '深圳': { lat: 22.5, lon: 114.1 },
  '杭州': { lat: 30.3, lon: 120.2 },
  '南京': { lat: 32.1, lon: 118.8 }
};
```

#### 站点投影计算
```typescript
const getSiteProjectedPosition = (location: string) => {
  for (const city in siteCoordinates) {
    if (location.includes(city)) {
      const { lat, lon } = siteCoordinates[city];
      const { x, y, z } = latLonTo3D(lat, lon);
      const rotated = rotatePoint(x, y, z, globeRotation.x, globeRotation.y);
      return project3DTo2D(rotated.x, rotated.y, rotated.z);
    }
  }
  return { x: 600, y: 300, scale: 1, visible: true };
};
```

### 4. 视图分离

#### 拓扑视图
- 显示 3D 地球背景
- 站点使用 3D 投影位置
- 站点随地球旋转
- 只显示前半球的站点（z > -200）
- 站点大小根据深度缩放

#### 网络视图
- 不显示地球背景
- 站点使用圆形布局
- 显示站点内部交换机拓扑
- 独立的拖拽平移功能

## 技术实现细节

### 0. 关键架构决策

#### 事件层级管理
为了实现地球旋转和站点点击的正确交互，采用了以下层级结构：

```
画布容器 (onMouseDown/Move/Up)
├── 地球装饰层 (pointer-events: none)
└── SVG 层
    ├── 拓扑视图: pointer-events: none (整体)
    │   └── 站点节点: pointer-events: auto (单独)
    └── 网络视图: 正常交互
```

**关键点**：
1. 画布容器捕获所有鼠标事件
2. 拓扑视图中 SVG 容器不拦截事件（`pointerEvents: 'none'`）
3. 站点节点单独启用点击（`pointerEvents: 'auto'`）
4. 网络视图中 SVG 容器正常交互，应用 transform

#### Transform 应用策略
- 拓扑视图：不应用 panOffset 和 zoomLevel（地球旋转通过重新计算投影实现）
- 网络视图：应用 panOffset 和 zoomLevel（传统的平移缩放）

### 1. 地球视觉效果

#### CSS 3D 地球（仅装饰）
- 经线：12 条
- 纬线：8 条
- 赤道环：高亮显示
- 轨道环：外层和内层
- 发光效果：核心发光、大陆发光

#### 条件渲染
```typescript
{viewMode === 'topology' && (
  <div className="globe-container">
    {/* 地球装饰元素 */}
  </div>
)}
```

### 2. 站点渲染优化

#### 可见性检查
```typescript
const projected = getSiteProjectedPosition(site.location);
if (!projected.visible) return null; // 背面站点不渲染
```

#### 深度缩放
```typescript
const scale = projected.scale;
// 所有尺寸乘以 scale
r={20*scale}
fontSize={16*scale}
```

#### 透明度调整
```typescript
opacity={scale > 0.5 ? 1 : 0.5 + scale}
```

### 3. 连接线处理

#### 双端可见性检查
```typescript
const fromProjected = getSiteProjectedPosition(fromSite.location);
const toProjected = getSiteProjectedPosition(toSite.location);

if (!fromProjected.visible || !toProjected.visible) return null;
```

## 用户交互

### 拓扑视图交互
1. 鼠标按下：开始旋转
2. 鼠标移动：更新地球旋转角度
3. 鼠标释放：停止旋转
4. 站点点击：选中/取消选中站点

### 网络视图交互
1. 鼠标按下：开始拖拽
2. 鼠标移动：平移画布
3. 鼠标释放：停止拖拽
4. 站点点击：选中/取消选中站点

### 通用控制
- 缩放按钮：放大/缩小
- 重置按钮：恢复默认视图
- 视图切换：拓扑/网络
- 过滤器：全部/DC/园区/光网络

## 性能优化

1. 条件渲染：背面站点不渲染
2. 数学计算：使用高效的三角函数
3. 状态管理：最小化重渲染
4. CSS 动画：使用 GPU 加速

## 已知限制

1. 站点数量：建议不超过 50 个
2. 旋转速度：受浏览器性能影响
3. 投影精度：使用简化的透视投影
4. 地球装饰：纯 CSS，不随鼠标旋转

## 未来改进方向

1. 使用 Three.js 实现真实 3D 地球
2. 添加地球纹理贴图
3. 实现平滑的惯性旋转
4. 支持触摸手势
5. 添加站点间的弧线连接
6. 实现地球自动旋转模式（可选）

## 文件结构

```
Ampcon-ONE-network-manager/
├── pages/
│   └── GlobalTopology.tsx          # 主组件文件
├── types.ts                        # 类型定义
└── GLOBAL_TOPOLOGY_3D_IMPLEMENTATION.md  # 本文档
```

## 相关文档

- [全球拓扑重新设计](./GLOBAL_TOPOLOGY_REDESIGN.md)
- [全球拓扑完成文档](./GLOBAL_TOPOLOGY_COMPLETION.md)
- [统一平台设计](./ampcon_one_unified_platform_design.md)

## 变更日志

### v3.1.1 (2026-02-11) - 修复交互问题
- 🐛 修复地球无法旋转的问题
  - SVG 容器设置 `pointerEvents: 'none'` 在拓扑视图中
  - 只在网络视图应用 panOffset 和 zoomLevel transform
- 🐛 修复站点可以拖动的问题
  - 站点节点设置 `pointerEvents: 'auto'` 仅用于点击
  - 移除 `transition-all` 类避免拖动效果
- ✨ 改进鼠标光标
  - 拓扑视图：`cursor-grab` / `cursor-grabbing`
  - 网络视图：`cursor-move`

### v3.1 (2026-02-11)
- ✅ 实现基于数学投影的 3D 地球
- ✅ 地球通过鼠标拖拽旋转
- ✅ 站点固定在地球表面（经纬度）
- ✅ 站点随地球旋转
- ✅ 背面站点自动隐藏
- ✅ 站点大小根据深度缩放
- ✅ 网络视图移除地球背景
- ✅ 中文本地化
- ✅ 赛博朋克美学风格

### v3.0 (2026-02-10)
- 应用 frontend-design skill
- 赛博朋克/科技感美学
- 中文界面
- 缩小站点图标

### v2.0 (2026-02-09)
- 合并地理视图和站点视图
- 添加网络视图
- 显示站点内部拓扑

### v1.0 (2026-02-08)
- 初始实现
- 基础拓扑视图

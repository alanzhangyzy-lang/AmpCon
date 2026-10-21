# RoCE Lossless Policy Studio 源码包

导出日期：2026-09-08
来源项目：AmpCon AIDC

## 内容

- `components/apps/RoceLosslessPolicyStudio.tsx`：Studio 主组件、草稿类型和初始化函数。
- `components/apps/AIDCInventoryTopology.tsx`：设备/库存类型及初始状态依赖。
- `components/apps/aidcFabricState.ts`：AIDC Fabric 状态类型及初始状态依赖。
- `components/apps/aidcTopologyDomain.ts`：Fabric、设备及 Workspace 共享配置。
- `components/topology/TopologyCanvas.tsx`：库存拓扑组件的递归依赖。
- `components/apps/provisioning.css`：Studio 的可读性与无障碍样式覆盖。
- `INTEGRATION.md`：宿主状态与 Props 接入示例。

## 外部依赖

- React 19
- `lucide-react`
- Tailwind CSS utility classes

原项目通过 `index.html` 加载 Tailwind CDN，并在 `index.tsx` 全局导入 `provisioning.css`。接入其他项目时，应由应用入口导入该 CSS，并确保 Tailwind 能扫描包内 TSX 类名。

## 组件接入

```tsx
import RoceLosslessPolicyStudio, {
  createInitialRocePolicyDraft,
} from './components/apps/RoceLosslessPolicyStudio';
```

组件状态由宿主持有，完整示例见 `INTEGRATION.md`。

## 说明

此包是现有源码的原样摘取，不包含整个 AmpCon 应用、构建脚手架、后端 API 或持久化实现。Studio 当前通过 React state/callback 工作，并复用宿主的 Inventory、Fabric 与 Workspace 生命周期。
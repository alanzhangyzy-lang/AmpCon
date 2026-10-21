# 接入示例

宿主负责持有 Workspace、Inventory、Fabric 和 RoCE 草稿状态：

```tsx
import { useState } from 'react';
import RoceLosslessPolicyStudio, {
  createInitialRocePolicyDraft,
} from './components/apps/RoceLosslessPolicyStudio';
import {
  createInitialInventoryTopologyState,
} from './components/apps/AIDCInventoryTopology';
import {
  createInitialAIDCFabricState,
} from './components/apps/aidcFabricState';
import './components/apps/provisioning.css';

export function RoceStudioHost() {
  const [workspace, setWorkspace] = useState('');
  const [draft, setDraft] = useState(createInitialRocePolicyDraft);
  const [inventoryState] = useState(createInitialInventoryTopologyState);
  const [fabricState] = useState(createInitialAIDCFabricState);

  return (
    <div className="h-screen">
      <RoceLosslessPolicyStudio
        workspace={workspace}
        onWorkspaceChange={setWorkspace}
        draft={draft}
        onDraftChange={setDraft}
        inventoryState={inventoryState}
        fabricState={fabricState}
        onBack={() => history.back()}
        onReviewWorkspace={() => console.log('review', workspace)}
      />
    </div>
  );
}
```

若从 Network Design 打开，可传入可选的 `initialDataCenterId` 来锁定当前数据中心。生产接入时应把 `onReviewWorkspace` 替换为应用内 Workspace 路由，并把 Inventory/Fabric 状态接到真实宿主状态。
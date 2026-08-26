---
inclusion: always
---

# CloudVision UI Implementation Rules

For all AIDC Provisioning work involving Studios, Workspaces, Tasks, Change Control, Inventory and Topology, or related configuration workflows:

1. Treat user-provided screenshots as the primary visual reference for page hierarchy, layout, labels, visible controls, table columns, tabs, and interaction placement.
2. Before implementing functional details, verify them against current official Arista CloudVision documentation or official Arista lab guides.
3. Documentation verification must cover, when applicable:
   - object definitions and ownership boundaries;
   - prerequisites and dependencies;
   - complete fields and permitted values;
   - states, transitions, and status meanings;
   - Workspace and Build behavior;
   - device/tag/interface assignment rules;
   - validation, conflicts, warnings, and error handling;
   - RBAC and operation availability;
   - submission, Tasks, Change Control, execution, and rollback behavior.
4. Do not invent CloudVision behavior when an official source can be checked. Clearly identify any product-specific extension that is not an Arista behavior.
5. If screenshots and documentation differ, preserve the screenshot's visual target while using documented semantics, and explicitly note likely version differences.
6. Keep Intent Center separate: it expresses business intent and invokes Studios; it does not own device configuration or duplicate Workspace/Tasks/Change Control.
7. Templates & CLI is a separate advanced configuration source, but its changes must converge through the common Workspace, Tasks, and Change Control lifecycle.
8. Validate every UI change with IDE diagnostics and a production build.
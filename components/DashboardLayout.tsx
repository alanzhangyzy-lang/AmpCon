import React, { useState } from 'react';
import { ChevronDown, FilePlus, LayoutDashboard, Maximize2, MoreHorizontal, Star, Copy, Trash2, Download, Upload } from 'lucide-react';

/**
 * DashboardToolbar — 所有 Site App Dashboard 共享的工具栏
 * 包含：Views 下拉切换 + 新建/添加面板/全屏/更多操作
 */
export const DashboardToolbar = () => {
  const [viewOpen, setViewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Default');
  const views = ['Default', 'AmpCon Cluster', 'Device Health'];

  return (
    <div className="flex items-center justify-between flex-shrink-0">
      {/* Left: Views dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Views:</span>
        <div className="relative">
          <button onClick={() => setViewOpen(!viewOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors">
            <span>{currentView}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          {viewOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
              {views.map(v => (
                <button key={v} onClick={() => { setCurrentView(v); setViewOpen(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${currentView === v ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600'}`}>{v}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Action toolbar */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="新建Dashboard视图">
          <FilePlus size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="添加Dashboard面板">
          <LayoutDashboard size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="全屏">
          <Maximize2 size={16} />
        </button>
        <div className="relative">
          <button onClick={() => setMoreOpen(!moreOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="更多">
            <MoreHorizontal size={16} />
          </button>
          {moreOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
              {[
                { icon: <Star size={13} />, label: '设置为默认' },
                { icon: <Copy size={13} />, label: '复制' },
                { icon: <Trash2 size={13} />, label: '删除', danger: true },
                { icon: <Download size={13} />, label: '导出JSON' },
                { icon: <Download size={13} />, label: '导出JPEG' },
                { icon: <Upload size={13} />, label: '导入' },
              ].map(item => (
                <button key={item.label} onClick={() => setMoreOpen(false)} className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600'}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * DashboardCanvas — 所有 Site App Dashboard 共享的画布容器
 * 提供统一的工具栏 + 全宽画布 + 三列网格布局
 */
export const DashboardCanvas = ({ children }: { children: React.ReactNode }) => (
  <div className="h-full overflow-auto bg-[#f8fafb]">
    <div className="p-5 pb-24 space-y-4">
      <DashboardToolbar />
      {children}
    </div>
  </div>
);

/**
 * Panel — 单个数据面板卡片
 */
export const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

/**
 * PanelTitle — 面板标题
 */
export const PanelTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[13px] font-bold text-slate-800 mb-3">{children}</h3>
);

/**
 * PanelRow — 面板行容器（默认三列）
 */
export const PanelRow = ({ children, cols = 3 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) => {
  const colClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3';
  return <div className={`grid ${colClass} gap-4`}>{children}</div>;
};

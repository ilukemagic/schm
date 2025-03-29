import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { register, unregister } from "@tauri-apps/api/globalShortcut";
// 导入小窗模式CSS
import "./compact-mode.css";
// 导入 sonner
import { Toaster, toast } from "sonner";

// 添加主题切换按钮图标
import { CompactMode } from "@/components/CompactMode";
import { MainMode } from "@/components/MainMode";
import { useClipboardHistory } from "@/hooks/useClipboardHistory";
import { useFilteredHistory } from "@/hooks/useFilteredHistory";
import { useWindowManager } from "@/hooks/useWindowManager";

interface ClipboardEvent {
  id: string;
  content: string;
  content_type: "Text" | "Url" | "Code";
  create_time: string;
  tags: string[];
}

function App() {
  const { history } = useClipboardHistory();
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filteredHistory,
  } = useFilteredHistory(history);

  const { isCompactMode, showWindow, hideWindow, toggleAppWindow } =
    useWindowManager();

  // 主题管理
  const { theme, setTheme, resolvedTheme } = useTheme();

  // 强制按钮重新渲染的状态
  const [mounted, setMounted] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ClipboardEvent | null>(null);

  // 侧边栏宽度状态
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 在其他 state 定义附近添加
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);

  // 确保组件挂载后才渲染主题相关元素
  useEffect(() => {
    setMounted(true);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 拖拽相关处理函数
  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  // 处理鼠标移动
  useEffect(() => {
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizing) return;

      // 计算新宽度 (最小宽度 240px，最大宽度 500px)
      const newWidth = Math.max(240, Math.min(500, mouseMoveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    // 添加事件监听
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // 清理函数
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // 复制到剪贴板
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // 使用 sonner 的 toast
    toast.success("已复制到剪贴板", {
      description: "内容已成功复制到您的剪贴板",
      duration: 2000,
    });
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(parseInt(timeStr));
    return date.toLocaleString();
  };

  // 注册全局快捷键
  useEffect(() => {
    const registerShortcuts = async () => {
      // 注册 Ctrl+Shift+V (Windows/Linux) 或 Command+Shift+V (macOS) 为呼出快捷键
      await register("CommandOrControl+Shift+V", () => {
        toggleAppWindow();
      });

      // 添加 Escape 键关闭小窗功能
      document.addEventListener("keydown", handleKeyDown);
    };

    registerShortcuts().catch(console.error);

    return () => {
      // 清理快捷键
      unregister("CommandOrControl+Shift+V").catch(console.error);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 修改 handleKeyDown 函数
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isCompactMode) return;

    // 上下键导航
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredHistory.length > 0) {
        let newIndex;
        if (event.key === "ArrowDown") {
          newIndex =
            focusedItemIndex < filteredHistory.length - 1
              ? focusedItemIndex + 1
              : 0;
        } else {
          newIndex =
            focusedItemIndex > 0
              ? focusedItemIndex - 1
              : filteredHistory.length - 1;
        }
        setFocusedItemIndex(newIndex);

        // 确保选中项可见
        const element = document.querySelector(`[data-index="${newIndex}"]`);
        element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    // Escape 键关闭小窗
    if (event.key === "Escape") {
      hideWindow();
    }

    // Enter 键复制当前选中项
    if (event.key === "Enter" && focusedItemIndex !== -1) {
      const selectedItem = filteredHistory[focusedItemIndex];
      if (selectedItem) {
        copyToClipboard(selectedItem.content);
        hideWindow();
      }
    }
  };

  // 修改键盘事件监听的 useEffect
  useEffect(() => {
    if (isCompactMode) {
      window.addEventListener("keydown", handleKeyDown);
      // 打开小窗时默认选中第一项
      if (filteredHistory.length > 0) {
        setFocusedItemIndex(0);
      }
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactMode, filteredHistory, focusedItemIndex]); // 添加必要的依赖项

  // 在搜索和标签切换时重置选中项
  useEffect(() => {
    if (isCompactMode && filteredHistory.length > 0) {
      setFocusedItemIndex(0);
    } else {
      setFocusedItemIndex(-1);
    }
  }, [searchTerm, activeTab, filteredHistory.length, isCompactMode]);

  // 确保在客户端渲染时应用正确的颜色方案
  if (!mounted) {
    // 返回一个基础占位符状态，避免闪烁
    return <div className="flex h-screen overflow-hidden bg-background"></div>;
  }

  return (
    <div
      className={`flex h-screen overflow-hidden bg-background ${
        isCompactMode ? "compact-mode" : ""
      }`}
    >
      <Toaster
        position="top-center"
        richColors
        theme={resolvedTheme as "light" | "dark" | undefined}
      />

      {isCompactMode ? (
        <CompactMode
          filteredHistory={filteredHistory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onHide={hideWindow}
          theme={theme || "light"}
          onThemeToggle={toggleTheme}
        />
      ) : (
        <MainMode
          filteredHistory={filteredHistory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme || "light"}
          onThemeToggle={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;

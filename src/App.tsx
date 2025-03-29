import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useTheme } from "next-themes";
import { register, unregister } from "@tauri-apps/api/globalShortcut";
import { appWindow } from "@tauri-apps/api/window";
import { PhysicalSize } from "@tauri-apps/api/window";

// 导入小窗模式CSS
import "./compact-mode.css";

// shadcn/ui 组件导入
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// 导入 sonner
import { Toaster, toast } from "sonner";

// 添加主题切换按钮图标
import { SunIcon, MoonIcon } from "lucide-react";

interface ClipboardEvent {
  id: string;
  content: string;
  content_type: "Text" | "Url" | "Code";
  create_time: string;
  tags: string[];
}

function App() {
  // 主题管理
  const { theme, setTheme, resolvedTheme } = useTheme();

  // 强制按钮重新渲染的状态
  const [mounted, setMounted] = useState(false);

  const [history, setHistory] = useState<ClipboardEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"Text" | "Url" | "Code" | "All">(
    "All"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ClipboardEvent | null>(null);

  // 侧边栏宽度状态
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 添加小窗模式状态
  const [isCompactMode, setIsCompactMode] = useState(false);

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

  useEffect(() => {
    // 定期获取剪贴板历史
    const fetchHistory = async () => {
      try {
        const data = await invoke("get_clipboard_history");
        setHistory(data as ClipboardEvent[]);
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  // 过滤历史记录
  const filteredHistory = history.filter((item) => {
    const matchesTab = activeTab === "All" || item.content_type === activeTab;
    const matchesSearch = item.content
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

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

  // 处理按键事件
  const handleKeyDown = (event: KeyboardEvent) => {
    // Escape 键关闭小窗
    if (event.key === "Escape") {
      if (isCompactMode) {
        hideWindow();
      }
    }

    // 当聚焦在搜索框并按下上下键时，用于在列表中导航
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (
        document.activeElement === document.querySelector('input[type="text"]')
      ) {
        event.preventDefault();
        navigateResults(event.key === "ArrowDown" ? "next" : "prev");
      }
    }

    // Enter 键用于复制当前选中项
    if (event.key === "Enter" && selectedItem) {
      copyToClipboard(selectedItem.content);
      hideWindow();
    }
  };

  // 窗口控制函数
  const toggleAppWindow = async () => {
    const isVisible = await appWindow.isVisible();
    if (isVisible) {
      hideWindow();
    } else {
      showWindow();
    }
  };

  const hideWindow = async () => {
    setIsCompactMode(false);
    // 恢复窗口装饰 (如果之前移除了)
    await appWindow.setDecorations(true);
    await appWindow.hide();
  };

  const showWindow = async () => {
    setIsCompactMode(true);

    // 更新窗口尺寸
    await appWindow.setSize(new PhysicalSize(1000, 800));

    // 居中显示
    await appWindow.center();

    // 设置装饰样式
    await appWindow.setDecorations(false);

    await appWindow.show();
    await appWindow.setFocus();

    // 自动聚焦搜索框
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        (searchInput as HTMLInputElement).focus();
      }
    }, 100);
  };

  // 在结果列表中导航
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);

  const navigateResults = (direction: "next" | "prev") => {
    if (filteredHistory.length === 0) return;

    let newIndex = focusedItemIndex;
    if (direction === "next") {
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
    setSelectedItem(filteredHistory[newIndex]);
  };

  // 在小窗模式下添加的键盘提示组件
  const KeyboardHints = () => (
    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 text-xs text-muted-foreground">
      <span>↑↓ 导航</span>
      <span>|</span>
      <span>Enter 复制</span>
      <span>|</span>
      <span>Esc 关闭</span>
    </div>
  );

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
      {/* 添加 Sonner 的 Toaster 组件 */}
      <Toaster
        position="top-center"
        richColors
        theme={resolvedTheme as "light" | "dark" | undefined}
      />

      {/* 主窗口模式 */}
      {!isCompactMode ? (
        <>
          {/* 原有的主窗口布局 */}
          <div
            ref={sidebarRef}
            className="h-full border-r flex flex-col relative sidebar"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <h1 className="text-xl font-semibold">智能剪贴板</h1>
              </div>

              {/* 添加主题切换按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="切换主题"
                className="ml-2"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
                ) : (
                  <MoonIcon className="h-[1.2rem] w-[1.2rem] text-blue-700" />
                )}
              </Button>
            </div>

            <div className="p-4 border-b space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                <span className="absolute left-3 top-1.5 text-muted-foreground">
                  🔍
                </span>
              </div>

              <Tabs
                defaultValue="All"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="All">全部</TabsTrigger>
                  <TabsTrigger value="Text">文本</TabsTrigger>
                  <TabsTrigger value="Url">链接</TabsTrigger>
                  <TabsTrigger value="Code">代码</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 侧边栏滚动区域 */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => (
                      <Card
                        key={item.id}
                        className={`compact-item group ${
                          index === focusedItemIndex
                            ? "compact-item-focused"
                            : ""
                        }`}
                        onClick={() => {
                          copyToClipboard(item.content);
                          hideWindow();
                        }}
                      >
                        <CardContent className="p-4">
                          {" "}
                          {/* 增加内边距 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {" "}
                              {/* 增加图标和文本间距 */}
                              <span className="text-xl">
                                {" "}
                                {/* 增加图标大小 */}
                                {item.content_type === "Text" && "📄"}
                                {item.content_type === "Url" && "🔗"}
                                {item.content_type === "Code" && "📝"}
                              </span>
                              <div className="flex flex-col flex-1 min-w-0">
                                {" "}
                                {/* 添加两行布局 */}
                                <span className="truncate text-sm font-medium">
                                  {item.content.substring(0, 60)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(item.create_time)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.content);
                              }}
                            >
                              复制
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <span className="text-4xl mb-4">🔍</span>
                      <p>未找到匹配的剪贴板记录</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* 添加拖拽手柄 */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors z-10 
                          ${isResizing ? "bg-primary/30" : ""}`}
              onMouseDown={startResizing}
            />
          </div>
          <div className="flex-1 p-8 overflow-y-auto content-area">
            {selectedItem ? (
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-6">
                  <Badge
                    variant={
                      selectedItem.content_type === "Text"
                        ? "default"
                        : selectedItem.content_type === "Url"
                        ? "success"
                        : "warning"
                    }
                  >
                    {selectedItem.content_type === "Text"
                      ? "文本"
                      : selectedItem.content_type === "Url"
                      ? "链接"
                      : "代码"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(selectedItem.create_time)}
                  </span>
                  <Button
                    onClick={() => copyToClipboard(selectedItem.content)}
                    key={`copy-btn-${theme}`}
                  >
                    复制
                  </Button>
                </CardHeader>
                <Separator />
                <CardContent className="p-6 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                  {selectedItem.content_type === "Code" ? (
                    <pre
                      className={`font-mono p-6 rounded-md text-sm leading-relaxed overflow-x-auto whitespace-pre
                      dark:bg-gray-800 dark:text-gray-100
                      bg-gray-100 text-gray-800
                    `}
                    >
                      {selectedItem.content}
                    </pre>
                  ) : selectedItem.content_type === "Url" ? (
                    <div className="break-all">
                      <a
                        href={selectedItem.content}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedItem.content}
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {selectedItem.content}
                    </p>
                  )}
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-end p-4">
                  <div className="flex gap-2">
                    {selectedItem.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-6 opacity-70">📋</div>
                <h2 className="text-2xl font-semibold mb-3">智能剪贴板历史</h2>
                <p className="text-muted-foreground">
                  从左侧选择一个剪贴板项目查看详细内容
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        // 小窗模式的专属布局
        <div className="compact-window">
          {/* 小窗口顶部栏 */}
          <div className="compact-header">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📋</span>
              <h3 className="text-sm font-medium">快速访问</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="搜索剪贴板内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="compact-search"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="compact-theme-toggle"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 快速过滤标签 */}
          <div className="compact-tabs">
            <Tabs
              defaultValue="All"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="All">全部</TabsTrigger>
                <TabsTrigger value="Text">文本</TabsTrigger>
                <TabsTrigger value="Url">链接</TabsTrigger>
                <TabsTrigger value="Code">代码</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 剪贴板列表区域 */}
          <ScrollArea className="compact-list">
            <div className="space-y-2 p-2">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <Card
                    key={item.id}
                    className={`compact-item ${
                      index === focusedItemIndex ? "compact-item-focused" : ""
                    }`}
                    onClick={() => {
                      copyToClipboard(item.content);
                      hideWindow();
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span>
                            {item.content_type === "Text" && "📄"}
                            {item.content_type === "Url" && "🔗"}
                            {item.content_type === "Code" && "📝"}
                          </span>
                          <span className="truncate text-sm">
                            {item.content.substring(0, 50)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(item.content);
                          }}
                        >
                          复制
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-2xl mb-2">🔍</span>
                  <p className="text-sm text-muted-foreground">
                    未找到匹配的剪贴板记录
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 键盘快捷键提示 */}
          <div className="compact-footer">
            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <span>↑↓ 选择</span>
              <span>Enter 复制并关闭</span>
              <span>Esc 关闭</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

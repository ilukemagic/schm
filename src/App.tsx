import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useTheme } from "next-themes";

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

  // 确保在客户端渲染时应用正确的颜色方案
  if (!mounted) {
    // 返回一个基础占位符状态，避免闪烁
    return <div className="flex h-screen overflow-hidden bg-background"></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 添加 Sonner 的 Toaster 组件 */}
      <Toaster
        position="top-center"
        richColors
        theme={resolvedTheme as "light" | "dark" | undefined}
      />

      {/* 侧边栏 - 添加动态宽度 */}
      <div
        ref={sidebarRef}
        className="h-full border-r flex flex-col relative"
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
              className="pl-8"
            />
            <span className="absolute left-3 top-2.5 text-muted-foreground">
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
                filteredHistory.map((item) => (
                  <Card
                    key={item.id}
                    className={`group relative cursor-pointer border border-transparent transition-all duration-300 
                      hover:shadow-md hover:-translate-y-[2px] 
                      hover:border-gray-200 dark:hover:border-gray-700
                      ${
                        selectedItem?.id === item.id
                          ? "border-primary/30 bg-primary/5 shadow-[0_0_0_1px_rgba(37,99,235,0.3),0_4px_12px_rgba(37,99,235,0.15)]"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md transition-all duration-300 ${
                        selectedItem?.id === item.id
                          ? "bg-primary"
                          : "bg-transparent"
                      }`}
                    ></div>

                    <CardContent
                      className={`p-4 transition-all duration-300 ${
                        selectedItem?.id === item.id ? "pl-5" : ""
                      }`}
                    >
                      <div className="mb-3">
                        {item.content_type === "Url" ? (
                          <div className="flex items-center">
                            <span className="mr-2">🔗</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {item.content.substring(0, 30)}...
                            </span>
                          </div>
                        ) : item.content_type === "Code" ? (
                          <div className="flex items-center">
                            <span className="mr-2">📝</span>
                            <pre className="text-sm bg-secondary/10 p-1 rounded font-mono text-muted-foreground truncate">
                              {item.content.substring(0, 30)}...
                            </pre>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="mr-2">📄</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {item.content.substring(0, 30)}...
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(item.create_time)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
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

      {/* 内容区域 */}
      <div className="flex-1 p-8 overflow-y-auto">
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
    </div>
  );
}

export default App;

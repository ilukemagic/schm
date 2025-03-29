import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SunIcon, MoonIcon } from "lucide-react";
import { ClipboardEvent } from "@/types";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { toast } from "sonner";

interface CompactModeProps {
  filteredHistory: ClipboardEvent[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: "Text" | "Url" | "Code" | "All";
  onTabChange: (value: "Text" | "Url" | "Code" | "All") => void;
  onHide: () => void;
  theme: string;
  onThemeToggle: () => void;
}

export function CompactMode({
  filteredHistory,
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  onHide,
  theme,
  onThemeToggle,
}: CompactModeProps) {
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板", {
      description: "内容已成功复制到您的剪贴板",
      duration: 2000,
    });
  };

  const { focusedItemIndex } = useKeyboardNavigation(
    true,
    filteredHistory,
    copyToClipboard,
    onHide
  );

  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="compact-search"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
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
          onValueChange={(value) =>
            onTabChange(value as "Text" | "Url" | "Code" | "All")
          }
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
                data-index={index}
                className={`compact-item group ${
                  index === focusedItemIndex ? "compact-item-focused" : ""
                }`}
                onClick={() => {
                  copyToClipboard(item.content);
                  onHide();
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
  );
}

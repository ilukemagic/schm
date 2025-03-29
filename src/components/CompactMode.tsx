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
    toast.success("Copied to clipboard", {
      description: "Content has been successfully copied to your clipboard",
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
      {/* small screen header */}
      <div className="compact-header">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📋</span>
          <h3 className="text-sm font-medium">Quick Access</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search clipboard content..."
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

      {/* quick filter tabs */}
      <div className="compact-tabs">
        <Tabs
          defaultValue="All"
          value={activeTab}
          onValueChange={(value) =>
            onTabChange(value as "Text" | "Url" | "Code" | "All")
          }
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Text">Text</TabsTrigger>
            <TabsTrigger value="Url">Link</TabsTrigger>
            <TabsTrigger value="Code">Code</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* clipboard list area */}
      <ScrollArea
        className="compact-list"
        style={{ height: "calc(100% - 140px)" }}
      >
        <div
          className="space-y-2 p-2"
          style={{
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
                ref={
                  index === focusedItemIndex
                    ? (el) => {
                        if (el) {
                          el.scrollIntoView({
                            block: "nearest",
                            behavior: "auto",
                          });
                        }
                      }
                    : null
                }
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
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-2xl mb-2">🔍</span>
              <p className="text-sm text-muted-foreground">
                No matching clipboard records found
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* keyboard shortcut tips */}
      <div className="compact-footer">
        <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
          <span>↑↓ Select</span>
          <span>Enter to copy and close</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

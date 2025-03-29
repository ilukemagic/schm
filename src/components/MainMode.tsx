import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SunIcon, MoonIcon } from "lucide-react";
import { ClipboardEvent } from "@/types";
import { toast } from "sonner";
import { ClipboardItem } from "@/components/ClipboardItem";

interface MainModeProps {
  filteredHistory: ClipboardEvent[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: "Text" | "Url" | "Code" | "All";
  onTabChange: (value: "Text" | "Url" | "Code" | "All") => void;
  theme: string;
  onThemeToggle: () => void;
}

export function MainMode({
  filteredHistory,
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  theme,
  onThemeToggle,
}: MainModeProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<ClipboardEvent | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard", {
      description: "Content has been successfully copied to your clipboard",
      duration: 2000,
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(parseInt(timeStr));
    return date.toLocaleString();
  };

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(240, Math.min(500, mouseMoveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      <div
        ref={sidebarRef}
        className="h-full border-r flex flex-col relative sidebar"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <h1 className="text-xl font-semibold">Smart Clipboard</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
            <span className="absolute left-3 top-1.5 text-muted-foreground">
              🔍
            </span>
          </div>

          <Tabs
            defaultValue="All"
            value={activeTab}
            onValueChange={(value) =>
              onTabChange(value as "Text" | "Url" | "Code" | "All")
            }
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Text">Text</TabsTrigger>
              <TabsTrigger value="Url">Link</TabsTrigger>
              <TabsTrigger value="Code">Code</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <ClipboardItem
                    key={item.id}
                    item={item}
                    isCompact={false}
                    onCopy={copyToClipboard}
                    onClick={() => setSelectedItem(item)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <span className="text-4xl mb-4">🔍</span>
                  <p>No matching clipboard records found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

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
                  ? "Text"
                  : selectedItem.content_type === "Url"
                  ? "Link"
                  : "Code"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatTime(selectedItem.create_time)}
              </span>
              <Button onClick={() => copyToClipboard(selectedItem.content)}>
                Copy
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
              {selectedItem.content_type === "Code" ? (
                <pre className="font-mono p-6 rounded-md text-sm leading-relaxed overflow-x-auto whitespace-pre dark:bg-gray-800 dark:text-gray-100 bg-gray-100 text-gray-800">
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
            <h2 className="text-2xl font-semibold mb-3">
              Smart Clipboard History
            </h2>
            <p className="text-muted-foreground">
              Select a clipboard item from the left to view details
            </p>
          </div>
        )}
      </div>
    </>
  );
}

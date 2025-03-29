import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardEvent } from "@/types";

interface ClipboardItemProps {
  item: ClipboardEvent;
  isCompact: boolean;
  isFocused?: boolean;
  onCopy: (content: string) => void;
  onClick?: () => void;
}

export function ClipboardItem({
  item,
  isCompact,
  isFocused,
  onCopy,
  onClick,
}: ClipboardItemProps) {
  return (
    <Card
      className={`group relative cursor-pointer ${
        isCompact ? "compact-item" : ""
      } ${isFocused ? "compact-item-focused" : ""}`}
      onClick={onClick}
    >
      <CardContent className={isCompact ? "p-3" : "p-4"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span>
              {item.content_type === "Text" && "📄"}
              {item.content_type === "Url" && "🔗"}
              {item.content_type === "Code" && "📝"}
            </span>
            <span className="truncate text-sm">
              {item.content.substring(0, isCompact ? 50 : 30)}...
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(item.content);
            }}
          >
            复制
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

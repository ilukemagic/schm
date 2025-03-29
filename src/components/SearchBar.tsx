import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isCompact?: boolean;
}

export function SearchBar({ value, onChange, isCompact }: SearchBarProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={isCompact ? "Search clipboard content..." : "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={isCompact ? "compact-search" : "pl-9"}
      />
      {!isCompact && (
        <span className="absolute left-3 top-1.5 text-muted-foreground">
          🔍
        </span>
      )}
    </div>
  );
}

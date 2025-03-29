export interface ClipboardEvent {
  id: string;
  content: string;
  content_type: "Text" | "Url" | "Code";
  create_time: string;
  tags: string[];
} 
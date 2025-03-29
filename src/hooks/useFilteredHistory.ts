import { useState, useMemo } from 'react';
import { ClipboardEvent } from '@/types';

export function useFilteredHistory(history: ClipboardEvent[]) {
  const [activeTab, setActiveTab] = useState<"Text" | "Url" | "Code" | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesTab = activeTab === "All" || item.content_type === activeTab;
      const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [history, activeTab, searchTerm]);

  return { activeTab, setActiveTab, searchTerm, setSearchTerm, filteredHistory };
} 
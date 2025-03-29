import { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import { ClipboardEvent } from '@/types';

export function useClipboardHistory() {
  const [history, setHistory] = useState<ClipboardEvent[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await invoke("get_clipboard_history") as ClipboardEvent[];
      // Only update state when data actually changes
      setHistory(prevHistory => {
        if (prevHistory.length === 0) return data;

        // Check if the first record has changed
        if (prevHistory[0]?.id !== data[0]?.id ||
          prevHistory[0]?.content !== data[0]?.content) {
          return data;
        }
        return prevHistory;
      });
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return { history };
} 
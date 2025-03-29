import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import { ClipboardEvent } from '@/types';

export function useClipboardHistory() {
  const [history, setHistory] = useState<ClipboardEvent[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await invoke("get_clipboard_history");
        setHistory(data as ClipboardEvent[]);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  return { history };
} 
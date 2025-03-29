import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface ClipboardEvent {
  id: string;
  content: string;
  content_type: "Text" | "Url" | "Code";
  create_time: string;
  tags: string[];
}

function App() {
  const [history, setHistory] = useState<ClipboardEvent[]>([]);

  useEffect(() => {
    // 定期获取剪贴板历史
    const fetchHistory = async () => {
      try {
        const data = await invoke("get_clipboard_history");
        setHistory(data as ClipboardEvent[]);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1>剪贴板历史</h1>
      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <div className="content">{item.content}</div>
            <div className="meta">
              <span className="type">{item.content_type}</span>
              <span className="time">
                {new Date(item.create_time).toLocaleString()}
              </span>
            </div>
            <div className="tags">
              {item.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

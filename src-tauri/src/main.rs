mod db;
mod ui;

use arboard::Clipboard;
use db::Database;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::{Duration, SystemTime};
use tokio::sync::mpsc;
use ui::{create_system_tray, get_clipboard_history, handle_system_tray_event};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClipboardEvent {
    id: u64,
    content: String,
    content_type: ContentType,
    create_time: SystemTime,
    tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentType {
    Text,
    Url,
    Code,
}

impl ClipboardEvent {
    fn new(content: String, content_type: ContentType) -> Self {
        let id = rand::random::<u64>();
        let create_time = SystemTime::now();
        let tags = vec![];
        Self {
            id,
            content,
            content_type,
            create_time,
            tags,
        }
    }

    // 检测内容类型的辅助方法
    fn detect_content_type(content: &str) -> ContentType {
        if content.starts_with("http://") || content.starts_with("https://") {
            ContentType::Url
        } else if content.contains('{') && content.contains('}')
            || content.contains("fn ")
            || content.contains("function")
        {
            ContentType::Code
        } else {
            ContentType::Text
        }
    }
}

struct ClipboardWatcher {
    clipboard: Clipboard,
    last_content: String,
    tx: mpsc::Sender<ClipboardEvent>,
}

impl ClipboardWatcher {
    fn new(tx: mpsc::Sender<ClipboardEvent>) -> Result<Self, arboard::Error> {
        Ok(Self {
            clipboard: Clipboard::new()?,
            last_content: String::new(),
            tx,
        })
    }

    async fn watch(&mut self) {
        loop {
            if let Ok(content) = self.clipboard.get_text() {
                // handle new and not empty content
                if !content.is_empty() && content != self.last_content {
                    let content_type = ClipboardEvent::detect_content_type(&content);
                    let event = ClipboardEvent::new(content.clone(), content_type);

                    if let Err(e) = self.tx.send(event).await {
                        eprintln!("Failed to send clipboard event: {}", e);
                    }
                    self.last_content = content;
                }
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}

#[tokio::main]
async fn main() {
    let db_path = PathBuf::from("clipboard_history.db");
    let db = Database::new(&db_path).unwrap();

    // 创建通道用于传递剪贴板事件
    let (tx, mut rx) = mpsc::channel::<ClipboardEvent>(100);

    // 将数据库克隆一份用于在保存线程中使用
    let db_clone = db.clone();

    // 启动剪贴板监听器
    tokio::spawn(async move {
        let mut watcher = match ClipboardWatcher::new(tx) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("无法创建剪贴板监听器: {}", e);
                return;
            }
        };
        watcher.watch().await;
    });

    // 处理剪贴板事件并保存到数据库
    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            println!("收到新的剪贴板内容: {:?}", event.content_type);
            if let Err(e) = db_clone.save_event(&event) {
                eprintln!("保存剪贴板事件失败: {}", e);
            }
        }
    });

    // 创建 Tauri 应用
    tauri::Builder::default()
        .manage(db.clone()) // 注入数据库状态
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .invoke_handler(tauri::generate_handler![get_clipboard_history])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

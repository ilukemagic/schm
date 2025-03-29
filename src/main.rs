use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClipboardEvent {
    id: u64,
    content: String,
    content_type: ContentType,
    create_time: SystemTime,
    tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
enum ContentType {
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
    // 创建通道用于传递剪贴板事件
    // 使用 mpsc::channel 创建一个通道
    let (tx, mut rx) = mpsc::channel::<ClipboardEvent>(100);

    // 在单独的任务中运行剪贴板监听器
    // 使用 tx.clone() 创建一个独立的通道副本
    let watcher_tx = tx.clone();
    // 使用 tokio::spawn 创建一个新任务
    tokio::spawn(async move {
        let mut watcher =
            ClipboardWatcher::new(watcher_tx).expect("Failed to create clipboard watcher");
        watcher.watch().await;
    });

    // 在主任务中处理剪贴板事件
    // 使用 rx.recv() 接收剪贴板事件
    while let Some(event) = rx.recv().await {
        println!("New clipboard content: {:?}", event);
    }
}

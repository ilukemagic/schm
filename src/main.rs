use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::{
    sync::mpsc,
    time::{Duration, SystemTime},
};

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

                    if let Err(e) = self.tx.send(event) {
                        eprintln!("Failed to send clipboard event: {}", e);
                    }
                    self.last_content = content;
                }
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}

fn main() {
    println!("Hello, world!");
}

use crate::ClipboardEvent;
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::{Arc, Mutex};

// 使用 Arc 来共享连接
#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(path)?;
        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init()?;
        Ok(db)
    }

    // 初始化数据库
    fn init(&self) -> Result<(), rusqlite::Error> {
        self.conn.lock().unwrap().execute(
            "CREATE TABLE IF NOT EXISTS clipboard_history (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                content_type TEXT NOT NULL,
                create_time TEXT NOT NULL,
                tags TEXT
            )",
            [],
        )?;
        Ok(())
    }

    // 保存剪贴板事件
    pub fn save_event(&self, event: &ClipboardEvent) -> Result<(), rusqlite::Error> {
        let tags_json = serde_json::to_string(&event.tags).unwrap_or_default();
        // 计算毫秒级时间戳
        let time_ms = event
            .create_time
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64; // 转换为毫秒级并存储为 u64

        self.conn.lock().unwrap().execute(
            "INSERT INTO clipboard_history (id, content, content_type, create_time, tags)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                event.id.to_string(),
                event.content,
                format!("{:?}", event.content_type),
                time_ms.to_string(), // 存储毫秒级时间戳
                tags_json,
            ],
        )?;
        Ok(())
    }

    // 获取剪贴板历史记录
    pub fn get_history(&self, limit: i32) -> Result<Vec<serde_json::Value>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, content, content_type, create_time, tags 
             FROM clipboard_history 
             ORDER BY create_time DESC 
             LIMIT ?",
        )?;

        let events = stmt.query_map([limit as i64], |row| {
            let id_str: String = row.get(0)?;
            let content: String = row.get(1)?;
            let content_type: String = row.get(2)?;
            let create_time_str: String = row.get(3)?; // 作为字符串获取
            let tags_json: String = row.get(4)?;

            // 使用 serde_json::Value 来构建兼容前端的JSON结构
            let json = serde_json::json!({
                "id": id_str,
                "content": content,
                "content_type": content_type,
                "create_time": create_time_str,  // 直接使用字符串
                "tags": serde_json::from_str::<Vec<String>>(&tags_json).unwrap_or_default()
            });

            Ok(json)
        })?;

        events.collect()
    }
}

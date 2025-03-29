use crate::ClipboardEvent;
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::{Arc, Mutex};

// Use Arc to share connection
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

    // Initialize database
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

    // Save clipboard event
    pub fn save_event(&self, event: &ClipboardEvent) -> Result<(), rusqlite::Error> {
        let tags_json = serde_json::to_string(&event.tags).unwrap_or_default();
        // Calculate milliseconds timestamp
        let time_ms = event
            .create_time
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64; // Convert to milliseconds and store as u64

        self.conn.lock().unwrap().execute(
            "INSERT INTO clipboard_history (id, content, content_type, create_time, tags)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                event.id.to_string(),
                event.content,
                format!("{:?}", event.content_type),
                time_ms.to_string(), // Store milliseconds timestamp
                tags_json,
            ],
        )?;
        Ok(())
    }

    // Get clipboard history
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
            let create_time_str: String = row.get(3)?; // Get as string
            let tags_json: String = row.get(4)?;

            // Use serde_json::Value to build a compatible JSON structure for frontend
            let json = serde_json::json!({
                "id": id_str,
                "content": content,
                "content_type": content_type,
                "create_time": create_time_str,  // Use string directly
                "tags": serde_json::from_str::<Vec<String>>(&tags_json).unwrap_or_default()
            });

            Ok(json)
        })?;

        events.collect()
    }
}

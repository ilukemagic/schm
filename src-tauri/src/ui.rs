use crate::Database;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

pub fn create_system_tray() -> SystemTray {
    // Create system tray menu
    let show = CustomMenuItem::new("show".to_string(), "Show main window");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide to tray");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    // Simple system tray, no icon specified (use icon from config file)
    SystemTray::new().with_menu(tray_menu)
}

pub fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
            }
            "hide" => {
                let window = app.get_window("main").unwrap();
                window.hide().unwrap();
            }
            _ => {}
        },
        _ => {}
    }
}

// Tauri command, for getting clipboard history
#[tauri::command]
pub async fn get_clipboard_history(
    db: tauri::State<'_, Database>,
) -> Result<Vec<serde_json::Value>, String> {
    db.get_history(50).map_err(|e| e.to_string())
}

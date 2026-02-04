#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      set_opacity,
      set_always_on_top,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn set_opacity(window: tauri::Window, opacity: f64) -> Result<(), String> {
  window
    .set_ignore_cursor_events(false)
    .map_err(|e| format!("Failed to set cursor events: {}", e))?;

  window
    .set_decorations(false)
    .map_err(|e| format!("Failed to set decorations: {}", e))?;

  Ok(())
}

#[tauri::command]
fn set_always_on_top(window: tauri::Window, always_on_top: bool) -> Result<(), String> {
  window
    .set_always_on_top(always_on_top)
    .map_err(|e| format!("Failed to set always on top: {}", e))?;

  Ok(())
}

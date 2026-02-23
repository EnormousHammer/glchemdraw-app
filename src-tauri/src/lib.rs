// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod clipboard_emf;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
enum CommandError {
    #[error("File operation failed: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Invalid file path: {0}")]
    InvalidPath(String),
    
    #[error("Invalid file content")]
    InvalidContent,
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Result type alias for commands
type CommandResult<T> = Result<T, CommandError>;

#[derive(Debug, Serialize, Deserialize)]
struct FileContent {
    path: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RecentFile {
    path: String,
    name: String,
    last_accessed: u64,
}

/// Read MOL/SDF file content
#[tauri::command]
async fn read_mol_file(path: String) -> CommandResult<String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(CommandError::InvalidPath(format!("File not found: {}", path)));
    }
    
    if !file_path.is_file() {
        return Err(CommandError::InvalidPath(format!("Not a file: {}", path)));
    }
    
    // Validate file extension
    let ext = file_path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    
    if !matches!(ext.to_lowercase().as_str(), "mol" | "sdf" | "sd") {
        return Err(CommandError::InvalidPath(format!("Invalid file type: {}", ext)));
    }
    
    let content = fs::read_to_string(file_path)?;
    Ok(content)
}

/// Write MOL/SDF file content
#[tauri::command]
async fn write_mol_file(path: String, content: String) -> CommandResult<()> {
    if content.is_empty() {
        return Err(CommandError::InvalidContent);
    }
    
    let file_path = Path::new(&path);
    
    // Validate file extension
    let ext = file_path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    
    if !matches!(ext.to_lowercase().as_str(), "mol" | "sdf" | "sd") {
        return Err(CommandError::InvalidPath(format!("Invalid file type: {}", ext)));
    }
    
    // Create parent directory if it doesn't exist
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    
    fs::write(file_path, content)?;
    Ok(())
}

/// Read text file (generic)
#[tauri::command]
async fn read_text_file(path: String) -> CommandResult<String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(CommandError::InvalidPath(format!("File not found: {}", path)));
    }
    
    let content = fs::read_to_string(file_path)?;
    Ok(content)
}

/// Write text file (generic)
#[tauri::command]
async fn write_text_file(path: String, content: String) -> CommandResult<()> {
    let file_path = Path::new(&path);
    
    // Create parent directory if it doesn't exist
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    
    fs::write(file_path, content)?;
    Ok(())
}

/// Check if file exists
#[tauri::command]
async fn file_exists(path: String) -> CommandResult<bool> {
    let file_path = Path::new(&path);
    Ok(file_path.exists() && file_path.is_file())
}

/// Get file metadata
#[tauri::command]
async fn get_file_info(path: String) -> CommandResult<serde_json::Value> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(CommandError::InvalidPath(format!("File not found: {}", path)));
    }
    
    let metadata = fs::metadata(file_path)?;
    let file_name = file_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");
    
    let ext = file_path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    
    let info = serde_json::json!({
        "name": file_name,
        "extension": ext,
        "size": metadata.len(),
        "is_readonly": metadata.permissions().readonly(),
        "modified": metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
    });
    
    Ok(info)
}

/// Read directory contents (for file browser)
#[tauri::command]
async fn read_directory(path: String, filter_ext: Option<Vec<String>>) -> CommandResult<Vec<serde_json::Value>> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err(CommandError::InvalidPath(format!("Directory not found: {}", path)));
    }
    
    if !dir_path.is_dir() {
        return Err(CommandError::InvalidPath(format!("Not a directory: {}", path)));
    }
    
    let entries = fs::read_dir(dir_path)?;
    let mut files = Vec::new();
    
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        let metadata = entry.metadata()?;
        
        let file_name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();
        
        let ext = path.extension()
            .and_then(|e| e.to_str())
            .map(|s| s.to_lowercase())
            .unwrap_or_default();
        
        // Apply filter if specified
        if let Some(ref filters) = filter_ext {
            if !filters.is_empty() && !filters.iter().any(|f| f.to_lowercase() == ext) {
                continue;
            }
        }
        
        files.push(serde_json::json!({
            "name": file_name,
            "path": path.to_string_lossy(),
            "extension": ext,
            "is_file": metadata.is_file(),
            "is_dir": metadata.is_dir(),
            "size": metadata.len(),
            "modified": metadata.modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs()),
        }));
    }
    
    // Sort: directories first, then by name
    files.sort_by(|a, b| {
        let a_is_dir = a["is_dir"].as_bool().unwrap_or(false);
        let b_is_dir = b["is_dir"].as_bool().unwrap_or(false);
        
        match (a_is_dir, b_is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a["name"].as_str().unwrap_or("").cmp(b["name"].as_str().unwrap_or("")),
        }
    });
    
    Ok(files)
}

/// Copy PNG bytes to clipboard as EMF (Windows only, ChemDraw-style for FindMolecule)
#[tauri::command]
async fn copy_png_as_emf(png_bytes: Vec<u8>) -> Result<(), String> {
    clipboard_emf::write_png_as_emf_to_clipboard(&png_bytes)
}

/// Copy CDX only to clipboard (Windows only)
#[tauri::command]
async fn copy_cdx_to_clipboard(cdx_bytes: Vec<u8>) -> Result<(), String> {
    clipboard_emf::write_cdx_only_to_clipboard(&cdx_bytes)
}

/// Copy ChemDraw-style: EMF + MOL + CDX (Windows only)
#[tauri::command]
async fn copy_chemdraw_style(
    png_bytes: Vec<u8>,
    mol_text: String,
    cdx_bytes: Option<Vec<u8>>,
) -> Result<(), String> {
    clipboard_emf::write_chemdraw_style_to_clipboard(
        &png_bytes,
        &mol_text,
        cdx_bytes.as_deref(),
    )
}

/// Validate MOL file format
#[tauri::command]
async fn validate_mol_format(content: String) -> CommandResult<bool> {
    // Basic validation - MOL files should have specific structure
    let lines: Vec<&str> = content.lines().collect();
    
    if lines.len() < 4 {
        return Ok(false);
    }
    
    // Check if it's a valid MOL file (very basic check)
    // Line 4 should contain atom and bond counts
    if lines.len() >= 4 {
        let counts_line = lines[3];
        let parts: Vec<&str> = counts_line.split_whitespace().collect();
        
        // MOL files have specific format with atom/bond counts
        if parts.len() >= 2 {
            // Try to parse atom and bond counts
            let atoms = parts[0].parse::<i32>();
            let bonds = parts[1].parse::<i32>();
            
            return Ok(atoms.is_ok() && bonds.is_ok());
        }
    }
    
    Ok(false)
}

/// Read multiple files from a directory (for drag and drop support)
#[tauri::command]
async fn read_directory_files(path: String, extensions: Option<Vec<String>>) -> CommandResult<Vec<serde_json::Value>> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err(CommandError::InvalidPath(format!("Directory not found: {}", path)));
    }
    
    if !dir_path.is_dir() {
        return Err(CommandError::InvalidPath(format!("Not a directory: {}", path)));
    }
    
    let mut files = Vec::new();
    let allowed_extensions = extensions.unwrap_or_else(|| vec![
        "dx".to_string(), "jdx".to_string(), "jcamp".to_string(), 
        "zip".to_string(), "nmr".to_string(), "fid".to_string(),
        "pdata".to_string(), "acqus".to_string()
    ]);
    
    // Recursively read directory
    fn read_dir_recursive(dir: &Path, allowed_exts: &[String], files: &mut Vec<serde_json::Value>) -> std::io::Result<()> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                // Recursively read subdirectories
                read_dir_recursive(&path, allowed_exts, files)?;
            } else if path.is_file() {
                // Check if file has allowed extension
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if allowed_exts.iter().any(|allowed| allowed.eq_ignore_ascii_case(ext)) {
                        let metadata = fs::metadata(&path)?;
                        let file_name = path.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown");
                        
                        files.push(serde_json::json!({
                            "path": path.to_string_lossy(),
                            "name": file_name,
                            "extension": ext,
                            "size": metadata.len(),
                            "is_readonly": metadata.permissions().readonly(),
                            "modified": metadata.modified()
                                .ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs()),
                        }));
                    }
                }
            }
        }
        Ok(())
    }
    
    read_dir_recursive(dir_path, &allowed_extensions, &mut files)?;
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            copy_png_as_emf,
            copy_cdx_to_clipboard,
            copy_chemdraw_style,
            read_mol_file,
            write_mol_file,
            read_text_file,
            write_text_file,
            file_exists,
            get_file_info,
            read_directory,
            read_directory_files,
            validate_mol_format,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

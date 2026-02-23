//! ChemDraw-style clipboard: EMF + MOL + CDX (Windows).
//! FindMolecule and other apps expect multiple formats like ChemDraw.

#[cfg(windows)]
use std::ptr::null_mut;

#[cfg(windows)]
use windows::Win32::Foundation::{HWND, RECT};
#[cfg(windows)]
use windows::Win32::Graphics::Gdi::{
    CloseEnhMetaFile, CreateCompatibleDC, CreateEnhMetaFileW, CreateDIBSection,
    DeleteDC, DeleteEnhMetaFile, DeleteObject, GetDC, HDC, ReleaseDC, SelectObject, SetStretchBltMode,
    StretchBlt, DIB_RGB_COLORS, BITMAPINFO, BITMAPINFOHEADER, SRCCOPY, STRETCH_HALFTONE,
};
#[cfg(windows)]
use windows::Win32::System::DataExchange::{
    CloseClipboard, EmptyClipboard, OpenClipboard, SetClipboardData, CF_ENHMETAFILE, CF_UNICODETEXT,
};
#[cfg(windows)]
use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{GetDesktopWindow, RegisterClipboardFormatW};
#[cfg(windows)]
use windows::core::PCWSTR;

/// Write EMF + MOL + CDX to clipboard (ChemDraw-style, Windows only).
#[cfg(windows)]
pub fn write_chemdraw_style_to_clipboard(
    png_bytes: &[u8],
    mol_text: &str,
    cdx_bytes: Option<&[u8]>,
) -> Result<(), String> {
    let h_emf = create_emf_from_png(png_bytes)?;

    unsafe {
        if !OpenClipboard(HWND::default()).as_bool() {
            let _ = DeleteEnhMetaFile(h_emf);
            return Err("OpenClipboard failed".to_string());
        }
        let _ = EmptyClipboard();

        // 1. EMF
        let _ = SetClipboardData(CF_ENHMETAFILE, h_emf);

        // 2. MOL as text (CF_UNICODETEXT)
        if !mol_text.is_empty() {
            let utf16: Vec<u16> = mol_text.encode_utf16().chain(std::iter::once(0)).collect();
            let size = utf16.len() * 2;
            if let Some(h_mol) = GlobalAlloc(GMEM_MOVEABLE, size).ok() {
                if let Some(ptr) = GlobalLock(h_mol) {
                    std::ptr::copy_nonoverlapping(utf16.as_ptr() as *const u8, ptr as *mut u8, size);
                    let _ = GlobalUnlock(h_mol);
                    let _ = SetClipboardData(CF_UNICODETEXT, h_mol);
                }
            }
        }

        // 3. CDX (registered format "CDX")
        if let Some(cdx) = cdx_bytes {
            if !cdx.is_empty() {
                let name: Vec<u16> = "CDX\0".encode_utf16().collect();
                let cdx_format = RegisterClipboardFormatW(PCWSTR::from_raw(name.as_ptr()));
                if cdx_format != 0 {
                    let size = cdx.len();
                    if let Some(h_cdx) = GlobalAlloc(GMEM_MOVEABLE, size).ok() {
                        if let Some(ptr) = GlobalLock(h_cdx) {
                            std::ptr::copy_nonoverlapping(cdx.as_ptr(), ptr as *mut u8, size);
                            let _ = GlobalUnlock(h_cdx);
                            let _ = SetClipboardData(cdx_format, h_cdx);
                        }
                    }
                }
            }
        }

        let _ = CloseClipboard();
        Ok(())
    }
}

#[cfg(windows)]
fn create_emf_from_png(png_bytes: &[u8]) -> Result<windows::Win32::Graphics::Gdi::HENHMETAFILE, String> {
    use image::GenericImageView;

    let img = image::load_from_memory(png_bytes).map_err(|e| e.to_string())?;
    let (width, height) = img.dimensions();
    if width == 0 || height == 0 {
        return Err("Empty image".to_string());
    }

    let rgba = img.to_rgba8();
    let mut bgra: Vec<u8> = rgba.pixels().flat_map(|p| [p[2], p[1], p[0], p[3]]).collect();

    unsafe {
        let hwnd = GetDesktopWindow();
        let hdc_screen = GetDC(hwnd).map_err(|e| format!("GetDC failed: {}", e))?;

        let bmi = BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width as i32,
            biHeight: -(height as i32),
            biPlanes: 1,
            biBitCount: 32,
            biCompression: 0,
            biSizeImage: 0,
            biXPelsPerMeter: 0,
            biYPelsPerMeter: 0,
            biClrUsed: 0,
            biClrImportant: 0,
        };

        let bmi_full = BITMAPINFO {
            bmiHeader: bmi,
            bmiColors: [windows::Win32::Graphics::Gdi::RGBQUAD::default(); 1],
        };

        let mut bits_ptr: *mut std::ffi::c_void = null_mut();
        let hbm_dib = CreateDIBSection(
            hdc_screen,
            &bmi_full,
            DIB_RGB_COLORS,
            &mut bits_ptr,
            None,
            0,
        )
        .map_err(|e| format!("CreateDIBSection failed: {}", e))?;

        if bits_ptr.is_null() {
            let _ = DeleteObject(hbm_dib);
            let _ = ReleaseDC(hwnd, hdc_screen);
            return Err("CreateDIBSection null bits".to_string());
        }

        std::ptr::copy_nonoverlapping(bgra.as_ptr(), bits_ptr as *mut u8, bgra.len());

        let hdc_mem = CreateCompatibleDC(hdc_screen).map_err(|e| format!("CreateCompatibleDC failed: {}", e))?;
        let old_bm = SelectObject(hdc_mem, hbm_dib);

        let w_mm = (width as f64 * 25.4 / 96.0 * 100.0) as i32;
        let h_mm = (height as f64 * 25.4 / 96.0 * 100.0) as i32;
        let rect = RECT { left: 0, top: 0, right: w_mm, bottom: h_mm };

        let hdc_emf = CreateEnhMetaFileW(HDC::default(), None, &rect, None);
        if hdc_emf.is_invalid() {
            let _ = SelectObject(hdc_mem, old_bm);
            let _ = DeleteObject(hbm_dib);
            let _ = DeleteDC(hdc_mem);
            let _ = ReleaseDC(hwnd, hdc_screen);
            return Err("CreateEnhMetaFile failed".to_string());
        }

        SetStretchBltMode(hdc_emf, STRETCH_HALFTONE);
        let _ = StretchBlt(hdc_emf, 0, 0, w_mm, h_mm, hdc_mem, 0, 0, width as i32, height as i32, SRCCOPY);

        let h_emf = CloseEnhMetaFile(hdc_emf);
        let _ = SelectObject(hdc_mem, old_bm);
        let _ = DeleteObject(hbm_dib);
        let _ = DeleteDC(hdc_mem);
        let _ = ReleaseDC(hwnd, hdc_screen);

        if h_emf.is_invalid() {
            return Err("CloseEnhMetaFile failed".to_string());
        }

        Ok(h_emf)
    }
}

/// Write CDX only to clipboard (Windows).
#[cfg(windows)]
pub fn write_cdx_only_to_clipboard(cdx_bytes: &[u8]) -> Result<(), String> {
    if cdx_bytes.is_empty() {
        return Err("Empty CDX data".to_string());
    }
    let name: Vec<u16> = "CDX\0".encode_utf16().collect();
    let cdx_format = RegisterClipboardFormatW(PCWSTR::from_raw(name.as_ptr()));
    if cdx_format == 0 {
        return Err("RegisterClipboardFormat CDX failed".to_string());
    }
    unsafe {
        if !OpenClipboard(HWND::default()).as_bool() {
            return Err("OpenClipboard failed".to_string());
        }
        let _ = EmptyClipboard();
        let size = cdx_bytes.len();
        if let Some(h_cdx) = GlobalAlloc(GMEM_MOVEABLE, size).ok() {
            if let Some(ptr) = GlobalLock(h_cdx) {
                std::ptr::copy_nonoverlapping(cdx_bytes.as_ptr(), ptr as *mut u8, size);
                let _ = GlobalUnlock(h_cdx);
                let _ = SetClipboardData(cdx_format, h_cdx);
            }
        }
        let _ = CloseClipboard();
        Ok(())
    }
}

/// Legacy: EMF only (for backward compat).
#[cfg(windows)]
pub fn write_png_as_emf_to_clipboard(png_bytes: &[u8]) -> Result<(), String> {
    write_chemdraw_style_to_clipboard(png_bytes, "", None)
}

#[cfg(not(windows))]
pub fn write_chemdraw_style_to_clipboard(
    _png_bytes: &[u8],
    _mol_text: &str,
    _cdx_bytes: Option<&[u8]>,
) -> Result<(), String> {
    Err("ChemDraw-style clipboard is only supported on Windows".to_string())
}

#[cfg(not(windows))]
pub fn write_cdx_only_to_clipboard(_cdx_bytes: &[u8]) -> Result<(), String> {
    Err("CDX clipboard is only supported on Windows".to_string())
}

#[cfg(not(windows))]
pub fn write_png_as_emf_to_clipboard(_png_bytes: &[u8]) -> Result<(), String> {
    Err("EMF clipboard is only supported on Windows".to_string())
}

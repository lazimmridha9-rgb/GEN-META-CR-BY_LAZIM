
<p align="center">
  <img src="GenMeta_Source_Full/src/assets/icon.png" width="120" height="120" alt="GenMeta Logo"/>
</p>

<h1 align="center">
  ⚡ GenMeta <sub><sup>v6.5.10</sup></sub>
</h1>

<p align="center">
  <em>AI-Powered Metadata Generator for Microstock Contributors</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-6.5.10-00d4aa?style=flat&labelColor=1a1a2e" alt="Version"/>
  <img src="https://img.shields.io/badge/License-MIT-ff6b6b?style=flat&labelColor=1a1a2e" alt="License"/>
  <img src="https://img.shields.io/badge/Platform-Win_|_Mac_|_Linux-58a6ff?style=flat&labelColor=1a1a2e" alt="Platform"/>
  <img src="https://img.shields.io/badge/Electron-41.6.1-47848f?style=flat&logo=electron&labelColor=1a1a2e" alt="Electron"/>
  <img src="https://img.shields.io/badge/Gemini_AI-1.34.0-8e75f5?style=flat&logo=google&labelColor=1a1a2e" alt="Gemini AI"/>
  <img src="https://img.shields.io/badge/Status-Active-2ea44f?style=flat&labelColor=1a1a2e" alt="Status"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-ffd700?style=flat&labelColor=1a1a2e" alt="PRs"/>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage-guide">Usage</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-technologies">Tech Stack</a> •
  <a href="#-configuration">Config</a> •
  <a href="#-faq">FAQ</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

<br/>

---

<br/>

## 📖 Overview

**GenMeta** is a desktop application that harnesses **Google Gemini AI** to automatically generate SEO-optimized metadata — **titles, descriptions, keywords, and categories** — for images and videos. Built specifically for **microstock contributors**, it writes metadata directly into **EXIF / XMP / IPTC** fields and exports platform-ready CSV files for:

<p align="center">
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/adobe-stock.svg" width="40" height="40" alt="Adobe Stock"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/shutterstock.svg" width="40" height="40" alt="Shutterstock"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/istock.svg" width="40" height="40" alt="iStock"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/pond5.webp" width="40" height="40" alt="Pond5"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/123rf.svg" width="40" height="40" alt="123RF"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/freepik.svg" width="40" height="40" alt="Freepik"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/dreamstime.svg" width="40" height="40" alt="Dreamstime"/>&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/vecteezy.png" width="40" height="40" alt="Vecteezy"/>
</p>

> Say goodbye to hours of manual keywording. GenMeta processes **hundreds of files** in a single batch with intelligent API key rotation and automatic retry logic.

<br/>

---

<br/>

## ✨ Features

### 🤖 AI Engine

| Capability | Details |
|:-----------|:--------|
| **Multimodal Analysis** | Gemini AI analyzes image/video content visually — not just filenames |
| **Supported Models** | `gemini-3.1-flash-lite`, `gemini-3-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` |
| **Smart Prompting** | Adaptive prompts per media type (image vs video) with platform-specific categories |
| **JSON Validation** | Auto-repairs malformed AI responses before processing |

### 🏷 Metadata Writing

| Field | Standard | Written Via |
|:------|:---------|:------------|
| Title | IPTC + XMP | ExifTool |
| Description | IPTC + XMP + EXIF | ExifTool |
| Keywords | IPTC + XMP | ExifTool |
| Categories | Platform-specific | ExifTool + CSV |

### 📁 File Support

| Type | Formats | Notes |
|:-----|:--------|:------|
| 🖼 **Images** | JPG, JPEG, PNG, GIF, BMP, WebP | Smart resize before AI analysis |
| 🎬 **Videos** | MP4, MOV, AVI, MKV, WebM | Frame extraction via FFmpeg |
| 🎨 **Vector** | EPS, SVG | Ghostscript auto-convert to raster |

### ⚡ Processing Pipeline

- **Batch orchestration** with configurable concurrency (default: 5 parallel requests)
- **API key rotation** across multiple keys for rate-limit avoidance
- **Intelligent retry** with exponential backoff
- **Progress tracking** with real-time UI updates
- **Temporary file cleanup** (EPS/SVG conversions, video frames, processed images)
- **File renaming** based on AI-generated titles

### 📊 Export Support

| Platform | CSV Format | Editorial Support | Regional Config |
|:---------|:-----------|:-----------------|:----------------|
| Adobe Stock | ✅ | — | — |
| Shutterstock | ✅ | — | — |
| iStock | ✅ | ✅ | Artist name |
| Pond5 | ✅ | ✅ | — |
| 123RF | ✅ | — | Country code |
| Freepik | ✅ | — | — |
| Dreamstime | ✅ | — | — |
| Vecteezy | ✅ | — | — |

<br/>

---

<br/>

## 📦 Installation

### Prerequisites

| Dependency | Version | How It's Provided |
|:-----------|:--------|:------------------|
| [Node.js](https://nodejs.org) | ≥ 18.x | Install manually |
| [ExifTool](https://exiftool.org) | 35.13.1 | Bundled via `exiftool-vendored` |
| [FFmpeg](https://ffmpeg.org) | 5.2.0 | Bundled via `ffmpeg-static` |
| [Ghostscript](https://ghostscript.com) | 10.x | Auto-downloaded if missing |
| [Gemini API Key](https://ai.google.dev/) | — | Get from Google AI Studio |

### Setup

<details>
<summary><b>Windows</b></summary>

```powershell
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full
npm install
npm start
```

**Quick launch:** Double-click `run_genmeta.cmd`
</details>

<details>
<summary><b>macOS / Linux</b></summary>

```bash
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full
npm install
npm start
```
</details>

<br/>

---

<br/>

## 🚀 Usage Guide

<table>
<tr>
<td width="50%" valign="top">

### 1️⃣ Select Media
- Click **"Browse"** and pick a folder
- Supported: JPG, PNG, MP4, MOV, EPS, SVG
- Files are scanned and sorted automatically

</td>
<td width="50%" valign="top">

### 2️⃣ Configure Settings
| Parameter | Options |
|:----------|:--------|
| Platform | Adobe Stock / Shutterstock / iStock / Pond5 / 123RF / General |
| Title Length | Short / Medium / Long |
| Keyword Count | 10 – 50 |
| Keyword Format | Single / Double / Auto |

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 3️⃣ Generate Metadata
- Click **"Generate Metadata"**
- Gemini AI analyzes each file visually
- Metadata written to EXIF/XMP/IPTC in real time
- Live progress bar with per-file status

</td>
<td width="50%" valign="top">

### 4️⃣ Export & Rename
| Action | Details |
|:-------|:--------|
| 📄 **CSV Export** | Format per platform (Adobe, SS, iStock, Pond5, 123RF) |
| 🏷 **File Rename** | Auto-rename using AI-generated titles |
| 🔁 **Retry** | Re-process individual files or full batch |
| 👁 **Preview** | Inspect metadata before export |

</td>
</tr>
</table>

<br/>

---

<br/>

## 🔄 How It Works

```
┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│  Select     │    │  Analyze     │    │  Generate     │    │  Write &      │
│  Files      │ →  │  via Gemini  │ →  │  Metadata     │ →  │  Export       │
│  (Folder)   │    │  AI Vision   │    │  (JSON)       │    │  (EXIF/CSV)   │
└────────────┘    └──────────────┘    └──────────────┘    └───────────────┘
       │                 │                   │                   │
       ▼                 ▼                   ▼                   ▼
  JPG, PNG        Gemini AI model      Title, Desc,         EXIF/XMP/IPTC
  MP4, MOV        analyzes visual      Keywords,            headers updated
  EPS, SVG        content              Categories           + CSV exported
```

### Processing Flow Details

| Step | What Happens |
|:-----|:-------------|
| **1. Scan** | Recursively scans directory for supported media files |
| **2. Prepare** | Resizes images, extracts video frames, converts EPS/SVG to raster via Ghostscript |
| **3. Upload** | Sends prepared media to Google Gemini AI with a structured prompt |
| **4. Parse** | Receives JSON response containing title, description, keywords, and categories |
| **5. Validate** | Validates and repairs JSON if malformed; sanitizes keywords against forbidden lists |
| **6. Write** | Embeds metadata into file using ExifTool (IPTC + XMP + EXIF) |
| **7. Export** | Generates platform-formatted CSV files for direct upload to stock agencies |
| **8. Cleanup** | Removes temporary conversion files and processing artifacts |

<br/>

---

<br/>

## 📁 Project Structure

<details>
<summary><b>Click to expand</b> — full project tree with every file</summary>

<br/>

```
📦 GEN-META-CR-BY_LAZIM
 ┣━ 📜 .gitignore
 ┣━ 📜 README.md
 ┣━ 📜 run_genmeta.cmd
 ┗━ 📂 GenMeta_Source_Full/
    ┣━ 📜 LICENSE
    ┣━ 📜 package.json
    ┣━ 📜 run_genmeta.cmd
    ┗━ 📂 src/
       ┣━ 📜 index.html
       ┣━ 📜 main.js
       ┣━ 📜 preload.js
       ┣━ 📜 createMainWindow.js
       ┣━ 📂 assets/
       ┃  ┣━ 📜 google.svg
       ┃  ┣━ 📜 icon.ico
       ┃  ┣━ 📜 icon.ico.backup
       ┃  ┗━ 📜 icon.png
       ┣━ 📂 components/
       ┃  ┣━ 📜 navbar.html
       ┃  ┣━ 📜 profile-dropdown.html
       ┃  ┣━ 📜 progress-panel.html
       ┃  ┣━ 📜 results-panel.html
       ┃  ┗━ 📜 status-bar.html
       ┣━ 📂 config/
       ┃  ┣━ 📜 api.js              # API endpoints (dev/staging/prod)
       ┃  ┣━ 📜 app.js              # App constants & timeouts
       ┃  ┣━ 📜 constant.js
       ┃  ┣━ 📜 constants.js        # Processing constants
       ┃  ┗━ 📜 models.js           # Supported Gemini models
       ┣━ 📂 handlers/
       ┃  ┣━ 📜 index.js
       ┃  ┣━ 📜 appHandler.js
       ┃  ┣━ 📜 authHandler.js
       ┃  ┣━ 📜 exportHandler.js
       ┃  ┣━ 📜 ffmpegHandler.js
       ┃  ┣━ 📜 gsPathHandler.js
       ┃  ┣━ 📜 outputHandler.js
       ┃  ┣━ 📜 pathHandler.js
       ┃  ┣━ 📜 processingHandler.js
       ┃  ┣━ 📜 settingsHandler.js
       ┃  ┣━ 📜 updateHandler.js
       ┃  ┗━ 📂 settingsHandler/
       ┃     ┣━ 📜 index.js
       ┃     ┣━ 📜 apiKeyUtils.js
       ┃     ┣━ 📜 defaults.js
       ┃     ┗━ 📜 merger.js
       ┣━ 📂 main/                   # ── Electron main process ──
       ┃  ┣━ 📜 index.js             # Main entry point
       ┃  ┣━ 📜 preload.js           # Context bridge (contextBridge)
       ┃  ┣━ 📜 protocol.js          # Custom protocol handler
       ┃  ┣━ 📜 window.js            # Window state management
       ┃  ┣━ 📂 ipc/                 # IPC handlers (11 modules)
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 app.ipc.js
       ┃  ┃  ┣━ 📜 auth.ipc.js
       ┃  ┃  ┣━ 📜 export.ipc.js
       ┃  ┃  ┣━ 📜 ffmpeg.ipc.js
       ┃  ┃  ┣━ 📜 ghostscript.ipc.js
       ┃  ┃  ┣━ 📜 output.ipc.js
       ┃  ┃  ┣━ 📜 path.ipc.js
       ┃  ┃  ┣━ 📜 processing.ipc.js
       ┃  ┃  ┣━ 📜 settings.ipc.js
       ┃  ┃  ┗━ 📜 update.ipc.js
       ┃  ┣━ 📂 handlers/
       ┃  ┃  ┗━ 📂 processing/
       ┃  ┃     ┣━ 📜 index.js
       ┃  ┃     ┣━ 📜 apiUsageTracker.js
       ┃  ┃     ┣━ 📜 deviceManager.js
       ┃  ┃     ┣━ 📜 keyManager.js
       ┃  ┃     ┣━ 📜 metadataSaveHandler.js
       ┃  ┃     ┣━ 📜 processingHandlerIndex.js
       ┃  ┃     ┣━ 📜 progressTracker.js
       ┃  ┃     ┣━ 📜 regenerateHandler.js
       ┃  ┃     ┣━ 📜 renameHandler.js
       ┃  ┃     ┣━ 📜 sanitizeFilename.js
       ┃  ┃     ┣━ 📜 submitHandler.js
       ┃  ┃     ┗━ 📜 userValidator.js
       ┃  ┣━ 📂 services/
       ┃  ┃  ┣━ 📜 startup.js
       ┃  ┃  ┣━ 📜 subscription.js
       ┃  ┃  ┗━ 📜 updater.js
       ┃  ┗━ 📂 utils/
       ┃     ┗━ 📂 ghostscript/
       ┃        ┣━ 📜 index.js
       ┃        ┣━ 📜 config.js
       ┃        ┣━ 📜 detector.js
       ┃        ┣━ 📜 downloader.js
       ┃        ┣━ 📜 execHelper.js
       ┃        ┣━ 📜 installer.js
       ┃        ┣━ 📜 systemInfo.js
       ┃        ┗━ 📜 verifier.js
       ┣━ 📂 modals/                  # ── Modal dialogs (13) ──
       ┃  ┣━ 📜 api-key-modal.html
       ┃  ┣━ 📜 api-validation-dialog.html
       ┃  ┣━ 📜 bulk-edit-dialog.html
       ┃  ┣━ 📜 docs-panel.html
       ┃  ┣━ 📜 gs-manual-install-modal.html
       ┃  ┣━ 📜 help-dialog.html
       ┃  ┣━ 📜 login-dialog.html
       ┃  ┣━ 📜 rename-files-dialog.html
       ┃  ┣━ 📜 settings-dialog.html
       ┃  ┣━ 📜 settings-123rf-dialog.html
       ┃  ┣━ 📜 settings-istock-dialog.html
       ┃  ┣━ 📜 settings-pond5-dialog.html
       ┃  ┗━ 📜 update-dialog.html
       ┣━ 📂 modules/                 # ── Core business logic ──
       ┃  ┣━ 📂 ai/                   # Gemini AI integration
       ┃  ┃  ┣━ 📜 client.js
       ┃  ┃  ┣━ 📜 error-handler.js
       ┃  ┃  ┣━ 📜 error-messages.js
       ┃  ┃  ┣━ 📜 uploader.js
       ┃  ┃  ┗━ 📂 prompt/
       ┃  ┃     ┣━ 📜 index.js
       ┃  ┃     ┣━ 📜 builder.js
       ┃  ┃     ┣━ 📜 categories.js
       ┃  ┃     ┣━ 📜 format.js
       ┃  ┃     ┣━ 📜 keywords.js
       ┃  ┃     ┗━ 📜 templates.js
       ┃  ┣━ 📂 auth/                 # Authentication
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 client.js
       ┃  ┃  ┣━ 📜 login.js
       ┃  ┃  ┗━ 📜 store.js
       ┃  ┣━ 📂 ghostscript/          # Ghostscript manager
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 config.js
       ┃  ┃  ┣━ 📜 detector.js
       ┃  ┃  ┣━ 📜 downloader.js
       ┃  ┃  ┣━ 📜 executor.js
       ┃  ┃  ┣━ 📜 installer.js
       ┃  ┃  ┣━ 📜 system.js
       ┃  ┃  ┣━ 📜 validate.js
       ┃  ┃  ┗━ 📜 verifier.js
       ┃  ┣━ 📂 media/                # Media handling
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 format.js
       ┃  ┃  ┣━ 📜 mime.js
       ┃  ┃  ┣━ 📜 preparer.js
       ┃  ┃  ┣━ 📂 image/
       ┃  ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┃  ┣━ 📜 background.js
       ┃  ┃  ┃  ┣━ 📜 copy-creator.js
       ┃  ┃  ┃  ┣━ 📜 eps-converter.js
       ┃  ┃  ┃  ┣━ 📜 resizer.js
       ┃  ┃  ┃  ┗━ 📜 svg-converter.js
       ┃  ┃  ┗━ 📂 video/
       ┃  ┃     ┣━ 📜 compressor.js
       ┃  ┃     ┣━ 📜 gemini-retry.js
       ┃  ┃     ┣━ 📜 processor.js
       ┃  ┃     ┗━ 📜 utils.js
       ┃  ┣━ 📂 metadata/             # EXIF/XMP/IPTC
       ┃  ┃  ┣━ 📜 eps-writer.js
       ┃  ┃  ┣━ 📜 exif.js
       ┃  ┃  ┣━ 📜 file-writer.js
       ┃  ┃  ┣━ 📜 format.js
       ┃  ┃  ┣━ 📜 generator.js
       ┃  ┃  ┣━ 📜 json-repair.js
       ┃  ┃  ┣━ 📜 key-rotator.js
       ┃  ┃  ┣━ 📜 parser.js
       ┃  ┃  ┗━ 📜 validator.js
       ┃  ┣━ 📂 processing/           # Batch orchestration
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 device.js
       ┃  ┃  ┣━ 📜 gemini-retry.js
       ┃  ┃  ┣━ 📜 ipc.js
       ┃  ┃  ┣━ 📜 key-manager.js
       ┃  ┃  ┣━ 📜 metadata-save.js
       ┃  ┃  ┣━ 📜 mkdir.js
       ┃  ┃  ┣━ 📜 orchestrator.js
       ┃  ┃  ┣━ 📜 preprocessor.js
       ┃  ┃  ┣━ 📜 progress.js
       ┃  ┃  ┣━ 📜 regenerate.js
       ┃  ┃  ┣━ 📜 rename.js
       ┃  ┃  ┣━ 📜 sanitize.js
       ┃  ┃  ┣━ 📜 single.js
       ┃  ┃  ┣━ 📜 usage-tracker.js
       ┃  ┃  ┣━ 📜 user-validator.js
       ┃  ┃  ┣━ 📂 batch/
       ┃  ┃  ┃  ┣━ 📜 concurrency.js
       ┃  ┃  ┃  ┣━ 📜 files.js
       ┃  ┃  ┃  ┣━ 📜 processor.js
       ┃  ┃  ┃  ┣━ 📜 semaphore.js
       ┃  ┃  ┃  ┗━ 📜 wrapper.js
       ┃  ┃  ┗━ 📂 pipeline/
       ┃  ┃     ┣━ 📜 batch-processor.js
       ┃  ┃     ┣━ 📜 media-processor.js
       ┃  ┃     ┣━ 📜 metadata-generator.js
       ┃  ┃     ┣━ 📜 result-processor.js
       ┃  ┃     ┗━ 📜 state-manager.js
       ┃  ┣━ 📂 settings/             # Settings management
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 defaults.js
       ┃  ┃  ┣━ 📜 key-utils.js
       ┃  ┃  ┗━ 📜 merger.js
       ┃  ┗━ 📂 tracking/             # API key usage tracking
       ┃     ┣━ 📜 index.js
       ┃     ┣━ 📜 distributor.js
       ┃     ┣━ 📜 mask.js
       ┃     ┣━ 📜 stats.js
       ┃     ┗━ 📜 storage.js
       ┣━ 📂 partials/                # ── Reusable HTML sections ──
       ┃  ┣━ 📜 api-key-banner.html
       ┃  ┣━ 📜 drag-drop-overlay.html
       ┃  ┣━ 📜 settings-advanced-section.html
       ┃  ┣━ 📜 settings-ai-section.html
       ┃  ┣━ 📜 settings-appearance-section.html
       ┃  ┣━ 📜 settings-csv-section.html
       ┃  ┗━ 📜 settings-system-section.html
       ┣━ 📂 process/                 # ── Processing pipeline ──
       ┃  ┣━ 📜 addMetadataToFile.js
       ┃  ┣━ 📜 batchFiles.js
       ┃  ┣━ 📜 cleanupTempFilesAsync.js
       ┃  ┣━ 📜 processBatch.js
       ┃  ┣━ 📜 processBatchWithConcurrencyLimit.js
       ┃  ┣━ 📜 processImages.js
       ┃  ┣━ 📜 processSingleFile.js
       ┃  ┣━ 📜 repairJson.js
       ┃  ┣━ 📜 semaphore.js
       ┃  ┣━ 📜 uploadGemini.js
       ┃  ┣━ 📜 validateMetadata.js
       ┃  ┣━ 📂 ai/
       ┃  ┃  ┣━ 📜 config.js
       ┃  ┃  ┣━ 📜 errorHandler.js
       ┃  ┃  ┣━ 📂 errorHandler/
       ┃  ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┃  ┗━ 📜 errorMessages.js
       ┃  ┃  ┗━ 📂 prompt/
       ┃  ┃     ┣━ 📜 index.js
       ┃  ┃     ┣━ 📜 basePrompt.js
       ┃  ┃     ┣━ 📜 categories.js
       ┃  ┃     ┣━ 📜 generatePrompt.js
       ┃  ┃     ┣━ 📜 promptBuilders.js
       ┃  ┃     ┗━ 📜 sharedUtils.js
       ┃  ┣━ 📂 processSingleFile/
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 filePreprocessor.js
       ┃  ┃  ┗━ 📜 geminiRetry.js
       ┃  ┣━ 📂 services/
       ┃  ┃  ┣━ 📜 BatchProcessor.js
       ┃  ┃  ┣━ 📜 MediaProcessor.js
       ┃  ┃  ┣━ 📜 MetadataProcessor.js
       ┃  ┃  ┣━ 📜 ProcessingStateManager.js
       ┃  ┃  ┣━ 📜 ResultProcessor.js
       ┃  ┃  ┣━ 📂 MediaProcessor/
       ┃  ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┃  ┣━ 📜 copyCreator.js
       ┃  ┃  ┃  ┣━ 📜 fileFormat.js
       ┃  ┃  ┃  ┗━ 📜 mediaPreparer.js
       ┃  ┃  ┗━ 📂 metadata/
       ┃  ┃     ┣━ 📜 formatHelper.js
       ┃  ┃     ┣━ 📜 keyRotator.js
       ┃  ┃     ┣━ 📜 requestHandler.js
       ┃  ┃     ┗━ 📜 responseParser.js
       ┃  ┣━ 📂 utils/
       ┃  ┃  ┣━ 📜 ensureOutputDir.js
       ┃  ┃  ┣━ 📜 epsMetadata.js
       ┃  ┃  ┣━ 📜 exif.utils.js
       ┃  ┃  ┣━ 📜 getMimeType.js
       ┃  ┃  ┣━ 📜 imageUtils.js
       ┃  ┃  ┣━ 📜 validateGsPath.js
       ┃  ┃  ┣━ 📜 videoCompression.js
       ┃  ┃  ┗━ 📂 image/
       ┃  ┃     ┣━ 📜 index.js
       ┃  ┃     ┣━ 📜 backgroundManager.js
       ┃  ┃     ┣━ 📜 epsConverter.js
       ┃  ┃     ┣━ 📜 resizeUtils.js
       ┃  ┃     ┗━ 📜 svgConverter.js
       ┃  ┗━ 📂 video/
       ┃     ┣━ 📜 processVideo.js
       ┃     ┣━ 📜 videoUtils.js
       ┃     ┗━ 📂 processVideo/
       ┃        ┣━ 📜 index.js
       ┃        ┗━ 📜 videoGeminiRetry.js
       ┣━ 📂 renderer/                # ── Frontend UI ──
       ┃  ┣━ 📜 index.html            # Main HTML shell
       ┃  ┣━ 📂 assets/
       ┃  ┃  ┣━ 📂 icons/
       ┃  ┃  ┃  ┣━ 📜 123rf.svg
       ┃  ┃  ┃  ┣━ 📜 adobe-stock.svg
       ┃  ┃  ┃  ┣━ 📜 dreamstime.svg
       ┃  ┃  ┃  ┣━ 📜 freepik.svg
       ┃  ┃  ┃  ┣━ 📜 general.svg
       ┃  ┃  ┃  ┣━ 📜 google.svg
       ┃  ┃  ┃  ┣━ 📜 icon.ico
       ┃  ┃  ┃  ┣━ 📜 icon.ico.backup
       ┃  ┃  ┃  ┣━ 📜 icon.png
       ┃  ┃  ┃  ┣━ 📜 istock.svg
       ┃  ┃  ┃  ┣━ 📜 pond5.webp
       ┃  ┃  ┃  ┣━ 📜 shutterstock.svg
       ┃  ┃  ┃  ┗━ 📜 Vecteezy.png
       ┃  ┃  ┗━ 📂 images/
       ┃  ┃     ┣━ 📜 error-placeholder.png
       ┃  ┃     ┗━ 📜 gs-download.png
       ┃  ┣━ 📂 css/                  # ~61 stylesheets
       ┃  ┃  ┣━ 📜 alerts.css
       ┃  ┃  ┣━ 📜 animations.css
       ┃  ┃  ┣━ 📜 api-keys.css
       ┃  ┃  ┣━ 📜 api-key-styles.css
       ┃  ┃  ┣━ 📜 api-key-tabs.css
       ┃  ┃  ┣━ 📜 base.css
       ┃  ┃  ┣━ 📜 buttons.css
       ┃  ┃  ┣━ 📜 checkbox.css
       ┃  ┃  ┣━ 📜 csv-markets.css
       ┃  ┃  ┣━ 📜 dark-light.css
       ┃  ┃  ┣━ 📜 dialog.css
       ┃  ┃  ┣━ 📜 dialog-animations.css
       ┃  ┃  ┣━ 📜 dialog-base.css
       ┃  ┃  ┣━ 📜 dialog-buttons.css
       ┃  ┃  ┣━ 📜 dialog-layout.css
       ┃  ┃  ┣━ 📜 dialog-responsive.css
       ┃  ┃  ┣━ 📜 dialog-utilities.css
       ┃  ┃  ┣━ 📜 docs-panel.css
       ┃  ┃  ┣━ 📜 drag-drop.css
       ┃  ┃  ┣━ 📜 dropdowns.css
       ┃  ┃  ┣━ 📜 file-preview.css
       ┃  ┃  ┣━ 📜 forms.css
       ┃  ┃  ┣━ 📜 form-tabs.css
       ┃  ┃  ┣━ 📜 ghostscript.css
       ┃  ┃  ┣━ 📜 initial-state.css
       ┃  ┃  ┣━ 📜 inputs.css
       ┃  ┃  ┣━ 📜 keyword-styles.css
       ┃  ┃  ┣━ 📜 keyword-tabs.css
       ┃  ┃  ┣━ 📜 login-dialog.css
       ┃  ┃  ┣━ 📜 login-form.css
       ┃  ┃  ┣━ 📜 main-layout.css
       ┃  ┃  ┣━ 📜 navbar.css
       ┃  ┃  ┣━ 📜 pricing-badges.css
       ┃  ┃  ┣━ 📜 pricing-dialog.css
       ┃  ┃  ┣━ 📜 pricing-plan-actions.css
       ┃  ┃  ┣━ 📜 pricing-plan-card.css
       ┃  ┃  ┣━ 📜 pricing-tabs.css
       ┃  ┃  ┣━ 📜 profile.css
       ┃  ┃  ┣━ 📜 progress.css
       ┃  ┃  ┣━ 📜 radio.css
       ┃  ┃  ┣━ 📜 release-notes.css
       ┃  ┃  ┣━ 📜 responsive.css
       ┃  ┃  ┣━ 📜 results.css
       ┃  ┃  ┣━ 📜 scrollbar.css
       ┃  ┃  ┣━ 📜 scrollbars.css
       ┃  ┃  ┣━ 📜 settings.css
       ┃  ┃  ┣━ 📜 settings-sync.css
       ┃  ┃  ┣━ 📜 status-bar.css
       ┃  ┃  ┣━ 📜 styles.css
       ┃  ┃  ┣━ 📜 summary.css
       ┃  ┃  ┣━ 📜 toast.css
       ┃  ┃  ┣━ 📜 toggles.css
       ┃  ┃  ┣━ 📜 update-dialog.css
       ┃  ┃  ┣━ 📜 update-popup.css
       ┃  ┃  ┣━ 📜 utilities.css
       ┃  ┃  ┗━ 📜 variables.css
       ┃  ┣━ 📂 html/                 # HTML partials (nested)
       ┃  ┃  ┣━ 📂 components/
       ┃  ┃  ┃  ┣━ 📜 navbar.html
       ┃  ┃  ┃  ┣━ 📜 profile-dropdown.html
       ┃  ┃  ┃  ┣━ 📜 progress-panel.html
       ┃  ┃  ┃  ┣━ 📜 results-panel.html
       ┃  ┃  ┃  ┗━ 📜 status-bar.html
       ┃  ┃  ┣━ 📂 modals/
       ┃  ┃  ┃  ┣━ 📜 api-key-modal.html
       ┃  ┃  ┃  ┣━ 📜 api-validation-dialog.html
       ┃  ┃  ┃  ┣━ 📜 bulk-edit-dialog.html
       ┃  ┃  ┃  ┣━ 📜 docs-panel.html
       ┃  ┃  ┃  ┣━ 📜 gs-manual-install-modal.html
       ┃  ┃  ┃  ┣━ 📜 help-dialog.html
       ┃  ┃  ┃  ┣━ 📜 login-dialog.html
       ┃  ┃  ┃  ┣━ 📜 rename-files-dialog.html
       ┃  ┃  ┃  ┣━ 📜 settings-123rf-dialog.html
       ┃  ┃  ┃  ┣━ 📜 settings-dialog.html
       ┃  ┃  ┃  ┣━ 📜 settings-istock-dialog.html
       ┃  ┃  ┃  ┣━ 📜 settings-pond5-dialog.html
       ┃  ┃  ┃  ┗━ 📜 update-dialog.html
       ┃  ┃  ┣━ 📂 partials/
       ┃  ┃  ┃  ┣━ 📜 api-key-banner.html
       ┃  ┃  ┃  ┣━ 📜 drag-drop-overlay.html
       ┃  ┃  ┃  ┣━ 📜 settings-advanced-section.html
       ┃  ┃  ┃  ┣━ 📜 settings-ai-section.html
       ┃  ┃  ┃  ┣━ 📜 settings-appearance-section.html
       ┃  ┃  ┃  ┣━ 📜 settings-csv-section.html
       ┃  ┃  ┃  ┗━ 📜 settings-system-section.html
       ┃  ┃  ┗━ 📂 sections/
       ┃  ┃     ┗━ 📜 initial-state.html
       ┃  ┗━ 📂 js/                   # Renderer JavaScript
       ┃     ┣━ 📜 script.js                 # Main (8,288 lines)
       ┃     ┣━ 📜 api-key-manager.js
       ┃     ┣━ 📜 custom-dropdown.js
       ┃     ┣━ 📜 ghostscript-installer.js
       ┃     ┣━ 📜 html-loader.js
       ┃     ┣━ 📜 important-notes.js
       ┃     ┗━ 📜 settings-sync.js
       ┣━ 📂 resource/                # ── Duplicate resource dir ──
       ┃  ┣━ 📂 css/
       ┃  ┃  ┣━ 📜 api-key-styles.css
       ┃  ┃  ┣━ 📜 keyword-styles.css
       ┃  ┃  ┣━ 📜 settings-sync.css
       ┃  ┃  ┣━ 📜 styles.css
       ┃  ┃  ┗━ 📂 styles/
       ┃  ┃     ┣━ 📂 animations/animations.css
       ┃  ┃     ┣━ 📂 base/base.css
       ┃  ┃     ┣━ 📂 components/ (buttons, csv-markets, docs-panel,
       ┃  ┃     ┃                drag-drop, dropdowns, file-preview,
       ┃  ┃     ┃                forms, progress, toast, toggles)
       ┃  ┃     ┣━ 📂 dialog/ (animations, base, components,
       ┃  ┃     ┃             index.css, layout, responsive, utilities)
       ┃  ┃     ┣━ 📂 layouts/ (main-layout, navbar, status-bar)
       ┃  ┃     ┣━ 📂 responsive/responsive.css
       ┃  ┃     ┣━ 📂 sections/ (api-keys, ghostscript, initial-state,
       ┃  ┃     ┃              results, settings, summary)
       ┃  ┃     ┣━ 📂 themes/dark-light.css
       ┃  ┃     ┣━ 📂 utilities/ (scrollbars, utilities)
       ┃  ┃     ┗━ 📂 variables/variables.css
       ┃  ┣━ 📂 images/
       ┃  ┃  ┣━ 📜 error-placeholder.png
       ┃  ┃  ┣━ 📜 gs-download.png
       ┃  ┃  ┗━ 📂 icons/ (9 platform icons)
       ┃  ┗━ 📂 js/
       ┃     ┣━ 📜 script.js
       ┃     ┣━ 📜 api-key-manager.js
       ┃     ┣━ 📜 custom-dropdown.js
       ┃     ┣━ 📜 ghostscript-installer.js
       ┃     ┣━ 📜 important-notes.js
       ┃     ┗━ 📜 settings-sync.js
       ┣━ 📂 sections/
       ┃  ┗━ 📜 initial-state.html
       ┣━ 📂 services/                # ── API services ──
       ┃  ┣━ 📜 authService.js
       ┃  ┣━ 📜 startupService.js
       ┃  ┣━ 📜 subscriptionService.js
       ┃  ┣━ 📜 updateService.js
       ┃  ┣━ 📂 authService/
       ┃  ┃  ┣━ 📜 index.js
       ┃  ┃  ┣━ 📜 apiClient.js
       ┃  ┃  ┗━ 📜 login.js
       ┃  ┗━ 📂 guestAuthService/
       ┃     ┣━ 📜 index.js
       ┃     ┣━ 📜 session.js
       ┃     ┗━ 📜 store.js
       ┣━ 📂 shared/                  # ── Shared constants ──
       ┃  ┣━ 📂 constants/
       ┃  ┃  ┗━ 📜 formats.js
       ┃  ┗━ 📂 helpers/
       ┃     ┣━ 📜 csv-generators.js
       ┃     ┣━ 📜 csvGenerators.js
       ┃     ┣━ 📜 json-helpers.js
       ┃     ┣━ 📜 jsonHelpers.js
       ┃     ┣━ 📜 mask-utils.js
       ┃     ┗━ 📜 maskUtils.js
       ┗━ 📂 utils/                   # ── Utilities ──
          ┣━ 📜 apiKeyTracker.js
          ┣━ 📜 cleanup.js
          ┣━ 📜 debug.js
          ┣━ 📜 ghostscriptInstaller.js
          ┣━ 📜 html-loader.js
          ┣━ 📜 logStartup.js
          ┣━ 📜 protocolHandler.js
          ┣━ 📜 videoUtils.js
          ┗━ 📂 apiKeyTracker/
             ┣━ 📜 index.js
             ┣━ 📜 distribution.js
             ┣━ 📜 mask.js
             ┣━ 📜 models.js
             ┣━ 📜 stats.js
             ┗━ 📜 storage.js
```

</details>

<br/>

---

<br/>

## 🛠 Technologies

### Core Stack

<p align="center">
  <img src="https://img.shields.io/badge/Electron-41.6.1-47848f?style=for-the-badge&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Gemini_AI-1.34.0-8e75f5?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/>
</p>

### Key Dependencies

| Package | Version | Purpose |
|:--------|:--------|:--------|
| **@google/genai** | ^1.34.0 | Google Gemini AI SDK |
| **exiftool-vendored** | ^35.13.1 | EXIF/XMP/IPTC metadata R/W |
| **sharp** | ^0.34.0 | Image processing |
| **fluent-ffmpeg** | ^2.1.3 | Video frame extraction |
| **ffmpeg-static** | ^5.2.0 | Bundled FFmpeg binary |
| **ffprobe-static** | ^3.1.0 | Bundled FFprobe binary |
| **electron-updater** | ^6.6.2 | Auto-updates (GitHub releases) |
| **electron-log** | ^5.3.3 | Logging |

<br/>

---

<br/>

## ⚙️ Configuration

### App Settings

| File | Purpose |
|:-----|:--------|
| `src/config/api.js` | API endpoints (dev/staging/prod) |
| `src/config/app.js` | Timeouts, cleanup dirs, intervals |
| `src/config/constants.js` | Concurrency, retries, formats |
| `src/config/models.js` | Available Gemini AI models |

### Key Constants

| Constant | Value | Description |
|:---------|:------|:------------|
| `MAX_CONCURRENT_UPLOAD_REQUESTS` | 5 | Parallel AI requests |
| `MAX_RETRIES` | 1 | Retry attempts per file |
| `INITIAL_TIMEOUT` | 50,000ms | AI request timeout |
| `API_STATUS_CHECK_INTERVAL` | 10,000ms | Backend health check |
| `AUTH_TIMEOUT` | 5 min | Authentication window |

### Gemini Models

| Tier | Model ID |
|:-----|:---------|
| 🚀 Fast | `gemini-3.1-flash-lite-preview` |
| ⚡ Balanced | `gemini-3-flash-preview` |
| 🌟 High Quality | `gemini-2.5-flash` |
| 💨 Lightweight | `gemini-2.5-flash-lite` |

<br/>

---

<br/>

## ❓ FAQ

<details>
<summary><b>Do I need a Google Gemini API key?</b></summary>
Yes. GenMeta uses Google Gemini AI to analyze media and generate metadata. Get a key from <a href="https://ai.google.dev/">Google AI Studio</a>. Guest mode works with limited functionality.
</details>

<details>
<summary><b>What file types are supported?</b></summary>
Images: JPG, JPEG, PNG, GIF, BMP, WebP &nbsp;|&nbsp; Videos: MP4, MOV, AVI, MKV, WebM &nbsp;|&nbsp; Vector: EPS, SVG
</details>

<details>
<summary><b>Does GenMeta modify my original files?</b></summary>
Yes — metadata is embedded into EXIF/XMP/IPTC headers. Pixel data is never altered. Always keep backups before batch processing.
</details>

<details>
<summary><b>How does Ghostscript get installed?</b></summary>
Auto-detected on launch. If missing, it downloads and installs automatically on Windows. macOS/Linux users install via their package manager.
</details>

<details>
<summary><b>Can I use multiple API keys?</b></summary>
Yes — add multiple keys for automatic rotation across requests to avoid rate limits.
</details>

<details>
<summary><b>Is there a subscription fee?</b></summary>
Both guest and subscription tiers are available. Subscription unlocks higher batch limits, priority processing, and advanced export options.
</details>

<br/>

---

<br/>

## 🗺 Roadmap

- [x] Core AI metadata generation (images & videos)
- [x] Batch processing with parallel execution
- [x] EXIF/XMP/IPTC metadata writing
- [x] EPS/SVG conversion & metadata support
- [x] Multi-platform CSV export
- [ ] Web version (cloud-based processing)
- [ ] Adobe Stock API direct submission
- [ ] Shutterstock API direct submission
- [ ] AI model fine-tuning for stock-specific keywords
- [ ] Plugin system for custom metadata workflows

<br/>

---

<br/>

## 🔧 Troubleshooting

| Issue | Solution |
|:------|:---------|
| **Ghostscript not found** | Run auto-installer from UI, or install Ghostscript 10.x manually |
| **API timeouts** | Reduce `MAX_CONCURRENT_UPLOAD_REQUESTS` in config |
| **Metadata not writing** | Verify ExifTool permissions — run as admin if needed |
| **Large batches failing** | Decrease batch size or increase `INITIAL_TIMEOUT` |
| **Video processing slow** | Reduce video resolution or shorten clips before processing |

<br/>

---

<br/>

## 🔧 Build & Development

```bash
# Clone & install
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full
npm install

# Development
npm start               # or: npx electron .

# Packaging (add electron-builder first):
# npx electron-builder --win
# npx electron-builder --mac
# npx electron-builder --linux
```

> GenMeta runs directly from source. For packaged distribution, add `electron-builder` or `electron-forge`.

<br/>

---

<br/>

## 🙏 Credits

| Role | Name |
|:-----|:-----|
| **Original Author** | [Aminur Rahman](https://github.com/aminurdev) |
| **Repository** | [GEN-META-CR-BY_LAZIM](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM) |
| **AI Engine** | [Google Gemini AI](https://ai.google.dev/) |
| **Desktop Framework** | [Electron](https://www.electronjs.org/) |
| **Metadata Toolkit** | [ExifTool](https://exiftool.org/) by Phil Harvey |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) |
| **Video Processing** | [FFmpeg](https://ffmpeg.org/) |
| **Vector Conversion** | [Ghostscript](https://ghostscript.com/) |

<br/>

---

<br/>

## 📄 License

This project is licensed under the **MIT License** — see [`LICENSE`](GenMeta_Source_Full/LICENSE) for details.

```
MIT License
Copyright (c) 2024 Aminur Rahman
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

<br/>

---

<br/>

<p align="center">
  <img src="GenMeta_Source_Full/src/assets/icon.png" width="48" height="48" alt="GenMeta"/>
</p>

<p align="center">
  <b>⚡ GenMeta</b> — <i>Intelligent Metadata, Effortlessly Generated</i>
</p>

<p align="center">
  <a href="https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM">
    <img src="https://img.shields.io/badge/%F0%9F%93%81_View_on-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="View on GitHub"/>
  </a>
</p>

<p align="center">
  <sub>Built with ❤️ for microstock contributors worldwide</sub>
  <br/>
  <sub>© 2024 <a href="https://github.com/aminurdev">Aminur Rahman</a> &nbsp;·&nbsp; Maintained by <a href="https://github.com/lazimmridha9-rgb">lazimmridha9-rgb</a></sub>
</p>

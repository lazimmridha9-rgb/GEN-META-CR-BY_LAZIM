
<div align="center">
  <img src="GenMeta_Source_Full/src/assets/icon.png" width="120" height="120" alt="GenMeta Logo">
  <br><br>
  <h1>GenMeta <sup>v6.5.10</sup></h1>
  <p><strong>AI-Powered Metadata Engine</strong> — <em>for Microstock Contributors</em></p>
  <br>
  <a href="https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM/releases"><img src="https://img.shields.io/github/v/release/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM?style=for-the-badge&logo=github&color=00d4aa&labelColor=1a1a2e" alt="Release"></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-6.5.10-7c3aed?style=for-the-badge&labelColor=1a1a2e" alt="Version"></a>
  <a href="GenMeta_Source_Full/LICENSE"><img src="https://img.shields.io/badge/License-MIT-ff6b6b?style=for-the-badge&labelColor=1a1a2e" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/Platform-Win%20%7C%20Mac%20%7C%20Linux-58a6ff?style=for-the-badge&labelColor=1a1a2e" alt="Platform"></a>
  <br>
  <a href="#"><img src="https://img.shields.io/badge/Electron-41.6.1-47848f?style=for-the-badge&logo=electron&logoColor=white&labelColor=1a1a2e" alt="Electron"></a>
  <a href="#"><img src="https://img.shields.io/badge/Gemini_AI-1.34.0-8e75f5?style=for-the-badge&logo=google&logoColor=white&labelColor=1a1a2e" alt="Gemini AI"></a>
  <a href="#"><img src="https://img.shields.io/badge/Node.js-%E2%89%A518.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=1a1a2e" alt="Node.js"></a>
  <br><br>
  <a href="#features">Features</a> • <a href="#quick-start">Quick Start</a> • <a href="#usage">Usage</a> • <a href="#architecture">Architecture</a> • <a href="#tech-stack">Tech Stack</a> • <a href="#configuration">Configuration</a> • <a href="#faq">FAQ</a> • <a href="#roadmap">Roadmap</a>
  <br><br>
</div>

---

<div align="center">
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/adobe-stock.svg" width="40" height="40" alt="Adobe Stock">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/shutterstock.svg" width="40" height="40" alt="Shutterstock">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/istock.svg" width="40" height="40" alt="iStock">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/pond5.webp" width="40" height="40" alt="Pond5">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/123rf.svg" width="40" height="40" alt="123RF">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/freepik.svg" width="40" height="40" alt="Freepik">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/dreamstime.svg" width="40" height="40" alt="Dreamstime">&nbsp;&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/general.svg" width="40" height="40" alt="General">
</div>

<br>

> **GenMeta** is a desktop application that leverages **Google Gemini AI** to automatically generate SEO-optimized metadata — titles, descriptions, keywords, and categories — for images and videos. Built specifically for microstock contributors, it writes metadata directly into **EXIF / XMP / IPTC** fields and exports platform-ready CSV files — eliminating hours of manual keywording.

---

## ✦ Features

### AI Engine

| Capability | Description |
|:-----------|:------------|
| **Multimodal Vision** | Gemini AI analyzes image/video content visually — not just filenames |
| **Smart Prompting** | Adaptive prompts per media type with platform-specific categories |
| **JSON Auto-Repair** | Automatically validates and repairs malformed AI responses |
| **Model Flexibility** | Switch between 4 Gemini models based on speed vs quality needs |
| **Key Rotation** | Distributes requests across multiple API keys to avoid rate limits |

### Metadata Processing

| Field | Standard | Technology |
|:------|:---------|:-----------|
| Title | IPTC + XMP | ExifTool |
| Description | IPTC + XMP + EXIF | ExifTool |
| Keywords | IPTC + XMP | ExifTool |
| Categories | Platform-specific | ExifTool + CSV |

### Supported File Types

| Type | Formats |
|:-----|:--------|
| **Images** | JPG, JPEG, PNG, GIF, BMP, WebP |
| **Videos** | MP4, MOV, AVI, MKV, WebM |
| **Vector** | EPS, SVG (auto-converted via Ghostscript) |

### Processing Pipeline

- **Batch Orchestration** — configurable concurrency (default: 5 parallel requests)
- **Intelligent Retry** — exponential backoff with adaptive timeout
- **Real-Time Progress** — live UI updates with per-file status tracking
- **File Renaming** — auto-rename assets using AI-generated titles
- **Temp Cleanup** — automatic removal of processing artifacts

### Platform Export Matrix

| Platform | CSV | Editorial | Regional Config |
|:---------|:----|:----------|:----------------|
| Adobe Stock | ✓ | — | — |
| Shutterstock | ✓ | — | — |
| iStock | ✓ | ✓ | Artist name |
| Pond5 | ✓ | ✓ | — |
| 123RF | ✓ | — | Country code |
| Freepik | ✓ | — | — |
| Dreamstime | ✓ | — | — |
| Vecteezy | ✓ | — | — |

---

## ✦ Quick Start

### Prerequisites

| Dependency | Minimum Version | Notes |
|:-----------|:----------------|:------|
| [Node.js](https://nodejs.org) | >= 18.x | LTS recommended |
| [ExifTool](https://exiftool.org) | 35.13.1 | Vendored via `exiftool-vendored` |
| [FFmpeg](https://ffmpeg.org) | 5.2.0 | Vendored via `ffmpeg-static` |
| [Ghostscript](https://ghostscript.com) | 10.x | Auto-downloaded on Windows |
| [Gemini API Key](https://ai.google.dev/) | — | Obtain from Google AI Studio |

### Installation

<details open>
<summary><b>Windows</b></summary>

```powershell
# Clone the repository
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git

# Navigate to source directory
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full

# Install dependencies
npm install

# Launch the application
npm start
```

**Quick launch:** Simply double-click `run_genmeta.cmd`
</details>

<details>
<summary><b>macOS / Linux</b></summary>

```bash
# Clone the repository
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git

# Navigate to source directory
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full

# Install dependencies
npm install

# Launch the application
npm start
```
</details>

---

## ✦ Usage

### Workflow

| Step | Action |
|:-----|:-------|
| **1** | Click **Browse** and select a folder containing your media assets |
| **2** | Configure platform, title length, keyword count, and output format |
| **3** | Click **Generate Metadata** — Gemini AI analyzes each file visually |
| **4** | Metadata is embedded into EXIF / XMP / IPTC headers in real time |
| **5** | Export as platform-formatted CSV or rename files using AI titles |

### Post-Processing Capabilities

- **CSV Export** — formatted per platform (Adobe Stock, Shutterstock, iStock, Pond5, 123RF, Freepik, Dreamstime, Vecteezy)
- **File Rename** — automatically rename assets using AI-generated titles
- **Selective Retry** — re-process individual files or full batches
- **Metadata Preview** — inspect generated metadata before export

---

## ✦ Architecture

```
  ┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────────┐
  │  Select   │    │   Analyze    │    │  Generate  │    │   Write &    │
  │  Media    │ →  │   via Gemini │ →  │  Metadata  │ →  │    Export    │
  │  Folder   │    │   AI Vision  │    │   (JSON)   │    │  (EXIF/CSV)  │
  └──────────┘    └──────────────┘    └────────────┘    └──────────────┘
```

### Processing Lifecycle

| Phase | Description |
|:------|:------------|
| **Scan** | Recursively discovers supported media files in the selected directory |
| **Prepare** | Resizes images, extracts video frames, converts EPS/SVG to raster |
| **Analyze** | Sends prepared media to Google Gemini AI with a structured prompt |
| **Parse** | Receives structured JSON with title, description, keywords, categories |
| **Validate** | Sanitizes output, repairs malformed JSON, filters forbidden keywords |
| **Write** | Embeds metadata into file headers via ExifTool (IPTC + XMP + EXIF) |
| **Export** | Generates platform-formatted CSV files for stock agency upload |
| **Cleanup** | Removes all temporary conversion files and processing artifacts |

---

## ✦ Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/Electron-41.6.1-47848f?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Gemini_AI-1.34.0-8e75f5?style=for-the-badge&logo=google&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/ExifTool-35.13.1-ff6b6b?style=for-the-badge&logo=openexr&logoColor=white" alt="ExifTool">
  <img src="https://img.shields.io/badge/Sharp-0.34.0-99cc00?style=for-the-badge&logo=sharp&logoColor=white" alt="Sharp">
  <img src="https://img.shields.io/badge/FFmpeg-5.2.0-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg">
</div>

### Core Dependencies

| Package | Version | Purpose |
|:--------|:--------|:--------|
| **@google/genai** | ^1.34.0 | Google Gemini AI SDK |
| **exiftool-vendored** | ^35.13.1 | EXIF / XMP / IPTC metadata read/write |
| **sharp** | ^0.34.0 | Image processing (resize, convert, analyze) |
| **fluent-ffmpeg** | ^2.1.3 | Video frame extraction and processing |
| **ffmpeg-static** | ^5.2.0 | Bundled FFmpeg binary distribution |
| **ffprobe-static** | ^3.1.0 | Bundled FFprobe binary distribution |
| **electron-updater** | ^6.6.2 | Auto-update via GitHub releases |
| **electron-log** | ^5.3.3 | Structured application logging |

---

## ✦ Configuration

### Application Settings

| File | Purpose |
|:-----|:--------|
| `src/config/api.js` | API endpoint configuration (dev / staging / production) |
| `src/config/app.js` | Global application settings (timeouts, cleanup, intervals) |
| `src/config/constants.js` | Processing constants (concurrency, retries, supported formats) |
| `src/config/models.js` | Available Gemini AI model definitions |

### Key Constants

| Constant | Default | Description |
|:---------|:--------|:------------|
| `MAX_CONCURRENT_UPLOAD_REQUESTS` | 5 | Maximum parallel AI requests |
| `MAX_RETRIES` | 1 | Number of retry attempts per file |
| `INITIAL_TIMEOUT` | 50,000ms | AI request timeout duration |
| `API_STATUS_CHECK_INTERVAL` | 10,000ms | Backend health check polling interval |
| `AUTH_TIMEOUT` | 5 min | Authentication window expiration |

### Gemini Model Tiers

| Tier | Model ID | Best For |
|:-----|:---------|:---------|
| **Fast** | `gemini-3.1-flash-lite-preview` | Quick processing, large batches |
| **Balanced** | `gemini-3-flash-preview` | General purpose metadata generation |
| **High Quality** | `gemini-2.5-flash` | Premium accuracy, detailed analysis |
| **Lightweight** | `gemini-2.5-flash-lite` | Minimal resource consumption |

---

## ✦ Project Structure

<details>
<summary><b>Click to expand</b> — complete project tree</summary>

```
GEN-META-CR-BY_LAZIM/
├── .gitignore                      # Version control exclusions
├── README.md                       # Project documentation
├── run_genmeta.cmd                 # Quick-launch script
└── GenMeta_Source_Full/
    ├── LICENSE                     # MIT License
    ├── package.json                # Project manifest & dependencies
    ├── package-lock.json           # Locked dependency tree
    ├── run_genmeta.cmd             # Development launcher
    └── src/
        ├── index.html              # App entry point
        ├── main.js                 # Renderer process entry
        ├── preload.js              # Context bridge
        ├── createMainWindow.js     # Window factory
        ├── assets/                 # Application icons & branding assets
        ├── components/             # Reusable UI components (navbar, panels)
        ├── config/                 # Application configuration modules
        ├── handlers/               # IPC event handler modules
        ├── main/                   # Electron main process
        │   ├── index.js            # Main process entry point
        │   ├── preload.js          # Main process preload
        │   ├── protocol.js         # Custom protocol handler
        │   ├── window.js           # Window management
        │   ├── ipc/                # 11 IPC channel handlers
        │   ├── handlers/processing/# Batch processing orchestration
        │   ├── services/           # Startup, subscription, updater services
        │   └── utils/ghostscript/  # Ghostscript detection & installation
        ├── modals/                 # 13 modal dialog HTML templates
        ├── modules/                # Core business logic modules
        │   ├── ai/                 # Gemini AI client & prompt builder
        │   ├── auth/               # Authentication system
        │   ├── ghostscript/        # Ghostscript installer & manager
        │   ├── media/              # Image/video preprocessing
        │   ├── metadata/           # EXIF/XMP/IPTC writer & parser
        │   ├── processing/         # Batch orchestrator & pipeline
        │   ├── settings/           # Settings persistence & management
        │   └── tracking/           # API key usage tracking & distribution
        ├── partials/               # Reusable HTML partial templates
        ├── process/                # Processing pipeline implementation
        ├── renderer/               # Frontend UI layer
        │   ├── index.html          # Main renderer HTML
        │   ├── assets/icons/       # Platform-specific icons (9 formats)
        │   ├── css/                # ~60 modular stylesheets
        │   ├── html/               # HTML partials & sections
        │   └── js/                 # Renderer JavaScript (~8k LOC in main)
        ├── resource/               # Duplicated resource directory
        ├── sections/               # Initial state HTML sections
        ├── services/               # API & backend service clients
        ├── shared/                 # Shared constants & helper utilities
        └── utils/                  # Utility functions & helpers
```
</details>

---

## ✦ FAQ

<details>
<summary><b>Do I need a Google Gemini API key?</b></summary>

**Yes.** You can obtain one for free from [Google AI Studio](https://ai.google.dev/). Guest mode provides limited functionality without a key.
</details>

<details>
<summary><b>What file types are supported?</b></summary>

| Category | Formats |
|:---------|:--------|
| Images | JPG, JPEG, PNG, GIF, BMP, WebP |
| Videos | MP4, MOV, AVI, MKV, WebM |
| Vector | EPS, SVG (auto-converted via Ghostscript) |
</details>

<details>
<summary><b>Does GenMeta modify my original files?</b></summary>

Metadata is embedded exclusively into **EXIF / XMP / IPTC headers**. Pixel data is never altered. However, we recommend maintaining backups before processing large batches.
</details>

<details>
<summary><b>How is Ghostscript installed?</b></summary>

On **Windows**, GenMeta automatically detects and downloads Ghostscript if missing. On **macOS / Linux**, install via your package manager (`brew install ghostscript`, `apt install ghostscript`, etc.).
</details>

<details>
<summary><b>Can I use multiple API keys?</b></summary>

**Absolutely.** Adding multiple API keys enables automatic rotation across requests, effectively distributing rate limits and maximizing throughput.
</details>

<details>
<summary><b>Is there a subscription fee?</b></summary>

Both **guest** and **subscription** tiers are available. Subscriptions unlock higher batch limits, priority processing, and advanced export options.
</details>

---

## ✦ Roadmap

### Completed

- [x] Core AI metadata generation (images & videos)
- [x] Batch processing with parallel execution & concurrency control
- [x] EXIF / XMP / IPTC metadata writing via ExifTool
- [x] EPS / SVG vector conversion & metadata support
- [x] Multi-platform CSV export (8 platforms)
- [x] Intelligent API key rotation & rate-limit management

### In Progress / Planned

- [ ] **Web Platform** — cloud-based processing via browser
- [ ] **Adobe Stock API** — direct submission integration
- [ ] **Shutterstock API** — direct submission integration
- [ ] **Fine-Tuned Model** — custom Gemini model for stock-specific keywords
- [ ] **Plugin System** — extensible workflow plugin architecture
- [ ] **Batch Preview** — bulk metadata review before writing
- [ ] **Multi-Language Support** — localized metadata generation

---

## ✦ Troubleshooting

| Issue | Likely Cause | Solution |
|:------|:-------------|:---------|
| **Ghostscript not found** | Missing dependency | Run auto-installer from UI, or install Ghostscript 10.x manually |
| **API timeouts** | Excessive concurrency | Reduce `MAX_CONCURRENT_UPLOAD_REQUESTS` in configuration |
| **Metadata not writing** | Permission restrictions | Run application with administrator / sudo privileges |
| **Large batches failing** | Resource exhaustion | Decrease batch size or increase `INITIAL_TIMEOUT` |
| **Video processing slow** | High-resolution source | Reduce video resolution or shorten clips before processing |
| **AI response malformed** | Complex content | Enable JSON repair; retry individual files as needed |

---

## ✦ Development

```bash
# Clone & install
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full
npm install

# Development mode
npm start
# or: npx electron .

# Package for distribution (requires electron-builder)
# npx electron-builder --win    # Windows installer
# npx electron-builder --mac    # macOS DMG
# npx electron-builder --linux  # Linux AppImage / deb
```

GenMeta runs directly from source. For packaged distribution, add `electron-builder` or `electron-forge` as a dev dependency.

---

## ✦ Credits

| Role | Name |
|:-----|:-----|
| **Author & Developer** | [Aminur Rahman](https://github.com/aminurdev) |
| **Repository** | [GEN-META-CR-BY_LAZIM](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM) |
| **AI Engine** | [Google Gemini AI](https://ai.google.dev/) |
| **Desktop Framework** | [Electron](https://www.electronjs.org/) |
| **Metadata Toolkit** | [ExifTool](https://exiftool.org/) by Phil Harvey |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) |
| **Video Processing** | [FFmpeg](https://ffmpeg.org/) |
| **Vector Conversion** | [Ghostscript](https://ghostscript.com/) |

---

## ✦ License

This project is licensed under the **MIT License** — see the [`LICENSE`](GenMeta_Source_Full/LICENSE) file for full details.

```
MIT License
Copyright (c) 2024 Aminur Rahman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

<div align="center">
  <br>
  <img src="GenMeta_Source_Full/src/assets/icon.png" width="64" height="64" alt="GenMeta">
  <br><br>
  <h3>GenMeta</h3>
  <p><em>Intelligent Metadata, Effortlessly Generated</em></p>
  <br>
  <a href="https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM">
    <img src="https://img.shields.io/badge/View_on-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <br><br>
  <sub>Built with ❤️ for microstock contributors worldwide</sub>
  <br>
  <sub>&copy; 2024 <a href="https://github.com/aminurdev">Aminur Rahman</a></sub>
</div>


<p align="center">
  <img src="GenMeta_Source_Full/src/assets/icon.png" width="100" height="100" alt="GenMeta">
</p>

<h1 align="center">GenMeta <sup>v6.5.10</sup></h1>

<p align="center">
  <em>AI-Powered Metadata Generator for Microstock Contributors</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-6.5.10-00d4aa?style=flat&labelColor=1a1a2e" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-ff6b6b?style=flat&labelColor=1a1a2e" alt="License">
  <img src="https://img.shields.io/badge/Platform-Win%20%7C%20Mac%20%7C%20Linux-58a6ff?style=flat&labelColor=1a1a2e" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-41.6.1-47848f?style=flat&logo=electron&labelColor=1a1a2e" alt="Electron">
  <img src="https://img.shields.io/badge/Gemini_AI-1.34.0-8e75f5?style=flat&logo=google&labelColor=1a1a2e" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Status-Active-2ea44f?style=flat&labelColor=1a1a2e" alt="Status">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#faq">FAQ</a> •
  <a href="#license">License</a>
</p>

---

## Overview

**GenMeta** is a desktop application that harnesses **Google Gemini AI** to automatically generate SEO-optimized metadata — titles, descriptions, keywords, and categories — for images and videos. Built specifically for **microstock contributors**, it writes metadata directly into **EXIF / XMP / IPTC** fields and exports platform-ready CSV files.

<p align="center">
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/adobe-stock.svg" width="36" height="36" alt="Adobe Stock">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/shutterstock.svg" width="36" height="36" alt="Shutterstock">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/istock.svg" width="36" height="36" alt="iStock">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/pond5.webp" width="36" height="36" alt="Pond5">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/123rf.svg" width="36" height="36" alt="123RF">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/freepik.svg" width="36" height="36" alt="Freepik">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/dreamstime.svg" width="36" height="36" alt="Dreamstime">&nbsp;
  <img src="GenMeta_Source_Full/src/renderer/assets/icons/general.svg" width="36" height="36" alt="General">
</p>

> Say goodbye to hours of manual keywording. GenMeta processes hundreds of files in a single batch with intelligent API key rotation and automatic retry logic.

---

## Features

### AI Engine

| Capability | Details |
|:-----------|:--------|
| **Multimodal Analysis** | Gemini AI analyzes image/video content visually — not just filenames |
| **Supported Models** | `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview` |
| **Smart Prompting** | Adaptive prompts per media type with platform-specific categories |
| **JSON Validation** | Auto-repairs malformed AI responses before processing |

### Metadata Writing

| Field | Standard | Written Via |
|:------|:---------|:------------|
| Title | IPTC + XMP | ExifTool |
| Description | IPTC + XMP + EXIF | ExifTool |
| Keywords | IPTC + XMP | ExifTool |
| Categories | Platform-specific | ExifTool + CSV |

### File Support

| Type | Formats |
|:-----|:--------|
| Images | JPG, JPEG, PNG, GIF, BMP, WebP |
| Videos | MP4, MOV, AVI, MKV, WebM |
| Vector | EPS, SVG (auto-converted via Ghostscript) |

### Processing Pipeline

- **Batch orchestration** with configurable concurrency (default: 5 parallel requests)
- **API key rotation** across multiple keys for rate-limit avoidance
- **Intelligent retry** with exponential backoff
- **Progress tracking** with real-time UI updates
- **File renaming** based on AI-generated titles

### Export Support

| Platform | CSV | Editorial | Regional Config |
|:---------|:----|:----------|:----------------|
| Adobe Stock | Yes | — | — |
| Shutterstock | Yes | — | — |
| iStock | Yes | Yes | Artist name |
| Pond5 | Yes | Yes | — |
| 123RF | Yes | — | Country code |
| Freepik | Yes | — | — |
| Dreamstime | Yes | — | — |
| Vecteezy | Yes | — | — |

---

## Installation

### Prerequisites

| Dependency | Version | Notes |
|:-----------|:--------|:------|
| [Node.js](https://nodejs.org) | >= 18.x | Install manually |
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

---

## Usage

| Step | Action |
|:-----|:-------|
| **1** | Click **Browse** and select a folder containing your media |
| **2** | Choose platform, title length, keyword count, and format |
| **3** | Click **Generate Metadata** — Gemini AI analyzes each file visually |
| **4** | Metadata is written to EXIF/XMP/IPTC in real time |
| **5** | Export as platform-formatted CSV or rename files using AI-generated titles |

Features available during/after processing:
- **CSV Export** — formatted per platform (Adobe Stock, Shutterstock, iStock, Pond5, 123RF)
- **File Rename** — auto-rename using AI-generated titles
- **Retry** — re-process individual files or full batch
- **Preview** — inspect metadata before export

---

## How It Works

```
  Select Files  -->  Analyze via Gemini  -->  Generate Metadata  -->  Write & Export
  (Folder)           AI Vision              (JSON)                 (EXIF / CSV)
```

| Step | Description |
|:-----|:------------|
| **Scan** | Recursively scans directory for supported media files |
| **Prepare** | Resizes images, extracts video frames, converts EPS/SVG to raster |
| **Analyze** | Sends prepared media to Google Gemini AI with a structured prompt |
| **Parse** | Receives JSON response with title, description, keywords, categories |
| **Validate** | Validates and repairs JSON; sanitizes keywords against forbidden lists |
| **Write** | Embeds metadata into file via ExifTool (IPTC + XMP + EXIF) |
| **Export** | Generates platform-formatted CSV files for stock agency upload |
| **Cleanup** | Removes temporary conversion files and processing artifacts |

---

## Project Structure

<details>
<summary><b>Click to expand</b> — full project tree</summary>

```
GEN-META-CR-BY_LAZIM/
├── .gitignore
├── README.md
├── run_genmeta.cmd
└── GenMeta_Source_Full/
    ├── LICENSE
    ├── package.json
    ├── run_genmeta.cmd
    └── src/
        ├── index.html
        ├── main.js
        ├── preload.js
        ├── createMainWindow.js
        ├── assets/                  # App icons & branding
        ├── components/              # Navbar, profile, panels
        ├── config/                  # App settings, constants, models
        ├── handlers/                # IPC event handlers
        ├── main/                    # Electron main process
        │   ├── index.js
        │   ├── preload.js
        │   ├── protocol.js
        │   ├── window.js
        │   ├── ipc/                 # 11 IPC handler modules
        │   ├── handlers/processing/ # Batch processing logic
        │   ├── services/            # Startup, subscription, updater
        │   └── utils/ghostscript/   # Ghostscript manager
        ├── modals/                  # 13 modal dialog HTML files
        ├── modules/                 # Core business logic
        │   ├── ai/                  # Gemini AI client & prompts
        │   ├── auth/                # Authentication system
        │   ├── ghostscript/         # Ghostscript installer
        │   ├── media/               # Image/video processing
        │   ├── metadata/            # EXIF/XMP/IPTC writer
        │   ├── processing/          # Batch orchestrator
        │   ├── settings/            # Settings manager
        │   └── tracking/            # API key usage tracker
        ├── partials/                # Reusable HTML sections
        ├── process/                 # Processing pipeline
        ├── renderer/                # Frontend UI
        │   ├── index.html
        │   ├── assets/icons/        # Platform icons (9)
        │   ├── css/                 # ~60 stylesheets
        │   ├── html/                # HTML partials
        │   └── js/                  # Renderer JS (~8k lines main)
        ├── resource/                # Duplicate resource directory
        ├── sections/                # Initial state HTML
        ├── services/                # API services
        ├── shared/                  # Shared constants & helpers
        └── utils/                   # Utility functions
```
</details>

---

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Electron-41.6.1-47848f?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Gemini_AI-1.34.0-8e75f5?style=for-the-badge&logo=google&logoColor=white" alt="Gemini">
</p>

| Package | Version | Purpose |
|:--------|:--------|:--------|
| **@google/genai** | ^1.34.0 | Google Gemini AI SDK |
| **exiftool-vendored** | ^35.13.1 | EXIF/XMP/IPTC metadata read/write |
| **sharp** | ^0.34.0 | Image processing (resize, convert) |
| **fluent-ffmpeg** | ^2.1.3 | Video frame extraction |
| **ffmpeg-static** | ^5.2.0 | Bundled FFmpeg binary |
| **ffprobe-static** | ^3.1.0 | Bundled FFprobe binary |
| **electron-updater** | ^6.6.2 | Auto-updates via GitHub releases |
| **electron-log** | ^5.3.3 | Application logging |

---

## Configuration

### App Settings

| File | Purpose |
|:-----|:--------|
| `src/config/api.js` | API endpoints (dev/staging/prod) |
| `src/config/app.js` | Timeouts, cleanup dirs, intervals |
| `src/config/constants.js` | Concurrency, retries, supported formats |
| `src/config/models.js` | Available Gemini AI models |

### Key Constants

| Constant | Default | Description |
|:---------|:--------|:------------|
| `MAX_CONCURRENT_UPLOAD_REQUESTS` | 5 | Parallel AI requests |
| `MAX_RETRIES` | 1 | Retry attempts per file |
| `INITIAL_TIMEOUT` | 50,000ms | AI request timeout |
| `API_STATUS_CHECK_INTERVAL` | 10,000ms | Backend health check interval |
| `AUTH_TIMEOUT` | 5 min | Authentication window |

### Gemini Models

| Tier | Model ID |
|:-----|:---------|
| Fast | `gemini-3.1-flash-lite-preview` |
| Balanced | `gemini-3-flash-preview` |
| High Quality | `gemini-2.5-flash` |
| Lightweight | `gemini-2.5-flash-lite` |

---

## FAQ

<details>
<summary><b>Do I need a Google Gemini API key?</b></summary>
Yes. Get one from <a href="https://ai.google.dev/">Google AI Studio</a>. Guest mode works with limited functionality.
</details>

<details>
<summary><b>What file types are supported?</b></summary>
Images: JPG, JPEG, PNG, GIF, BMP, WebP &nbsp;|&nbsp; Videos: MP4, MOV, AVI, MKV, WebM &nbsp;|&nbsp; Vector: EPS, SVG
</details>

<details>
<summary><b>Does GenMeta modify my original files?</b></summary>
Metadata is embedded into EXIF/XMP/IPTC headers. Pixel data is never altered. Always keep backups before batch processing.
</details>

<details>
<summary><b>How is Ghostscript installed?</b></summary>
Auto-detected on launch. If missing, it downloads and installs automatically on Windows. macOS/Linux users install via package manager.
</details>

<details>
<summary><b>Can I use multiple API keys?</b></summary>
Yes — add multiple keys for automatic rotation across requests to avoid rate limits.
</details>

<details>
<summary><b>Is there a subscription fee?</b></summary>
Both guest and subscription tiers are available. Subscriptions unlock higher batch limits, priority processing, and advanced export options.
</details>

---

## Roadmap

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

---

## Troubleshooting

| Issue | Solution |
|:------|:---------|
| **Ghostscript not found** | Run auto-installer from UI, or install Ghostscript 10.x manually |
| **API timeouts** | Reduce `MAX_CONCURRENT_UPLOAD_REQUESTS` in config |
| **Metadata not writing** | Verify ExifTool permissions — run as admin if needed |
| **Large batches failing** | Decrease batch size or increase `INITIAL_TIMEOUT` |
| **Video processing slow** | Reduce video resolution or shorten clips before processing |

---

## Development

```bash
# Clone & install
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full
npm install

# Run in development mode
npm start
# or: npx electron .

# Packaging (requires electron-builder)
# npx electron-builder --win
# npx electron-builder --mac
# npx electron-builder --linux
```

GenMeta runs directly from source. For packaged distribution, add `electron-builder` or `electron-forge`.

---

## Credits

| Role | Name |
|:-----|:-----|
| **Author** | [Aminur Rahman](https://github.com/aminurdev) |
| **Repository** | [GEN-META-CR-BY_LAZIM](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM) |
| **AI Engine** | [Google Gemini AI](https://ai.google.dev/) |
| **Desktop Framework** | [Electron](https://www.electronjs.org/) |
| **Metadata Toolkit** | [ExifTool](https://exiftool.org/) by Phil Harvey |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) |
| **Video Processing** | [FFmpeg](https://ffmpeg.org/) |
| **Vector Conversion** | [Ghostscript](https://ghostscript.com/) |

---

## License

This project is licensed under the **MIT License** — see [`LICENSE`](GenMeta_Source_Full/LICENSE) for details.

```
MIT License
Copyright (c) 2024 Aminur Rahman
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

---

<p align="center">
  <img src="GenMeta_Source_Full/src/assets/icon.png" width="48" height="48" alt="GenMeta">
</p>

<p align="center">
  <b>GenMeta</b> — <em>Intelligent Metadata, Effortlessly Generated</em>
</p>

<p align="center">
  <a href="https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM">
    <img src="https://img.shields.io/badge/View_on-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</p>

<p align="center">
  <sub>Built with love for microstock contributors worldwide</sub>
  <br>
  <sub>&copy; 2024 <a href="https://github.com/aminurdev">Aminur Rahman</a></sub>
</p>

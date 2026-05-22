
<div align="center">

<img src="GenMeta_Source_Full/src/assets/icon.png" alt="GenMeta Logo" width="100" height="100"/>

# ⚡ **GenMeta** v6.5.10

### *AI-Powered Metadata Generator for Microstock Contributors*

[![Version](https://img.shields.io/badge/version-6.5.10-00d4aa?style=for-the-badge&labelColor=1a1a2e)](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6247aa?style=for-the-badge&labelColor=1a1a2e)]()
[![License](https://img.shields.io/badge/license-MIT-ff6b6b?style=for-the-badge&labelColor=1a1a2e)](GenMeta_Source_Full/LICENSE)
[![Electron](https://img.shields.io/badge/Electron-41.6.1-47848f?style=for-the-badge&logo=electron&labelColor=1a1a2e)]()
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-1.34.0-8e75f5?style=for-the-badge&logo=google&labelColor=1a1a2e)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-2ea44f?style=for-the-badge&labelColor=1a1a2e)]()

---

[✨ Features](#-features) •
[📦 Installation](#-installation) •
[🚀 Usage](#-usage-guide) •
[🖼 Preview](#-preview) •
[📁 Structure](#-project-structure) •
[⚙️ Config](#-configuration) •
[🔧 Build](#-build-instructions) •
[🤝 Contribute](#-contribution-guide)

---

</div>

<br/>

## 🌟 **Overview**

**GenMeta** is a powerful desktop application that leverages **Google Gemini AI** to automatically generate high-quality, SEO-optimized **metadata** (titles, descriptions, keywords, categories) for images and videos. Built for **microstock contributors** who sell on platforms like **Adobe Stock**, **Shutterstock**, **iStock**, **Pond5**, and **123RF**, GenMeta writes metadata directly into **EXIF/XMP/IPTC** fields — saving hours of manual work per batch.

<br/>

## ✨ **Features**

| Area | Capabilities |
|:-----|:-------------|
| 🤖 **AI-Powered** | Google Gemini multimodal AI analyzes images/videos and generates platform-optimized metadata |
| 📝 **Smart Metadata** | SEO-optimized titles, detailed descriptions, relevant keywords, and platform-specific categories |
| 📂 **Batch Processing** | Process hundreds of files concurrently with API key rotation and intelligent retry logic |
| 🏷 **EXIF/XMP/IPTC** | Writes metadata directly into file headers using ExifTool — works with all major stock platforms |
| 🎨 **EPS & SVG** | Automatic Ghostscript-powered conversion for vector files, then writes metadata |
| 🎬 **Video Support** | Full support for MP4, MOV with frame extraction for AI analysis using FFmpeg |
| 📊 **CSV Export** | Export results formatted for Adobe Stock, Shutterstock, iStock, Pond5, 123RF, and more |
| 🔄 **File Renaming** | Batch rename files based on AI-generated titles and descriptions |
| 🔐 **Auth System** | Guest mode + authenticated mode with API key management and subscription tiers |
| 🎨 **Dark/Light UI** | Beautiful modern interface with dark and light theme support |
| 🚀 **Auto-Update** | Built-in automatic updates via GitHub releases |

<br/>

## 📦 **Installation**

### Prerequisites

| Requirement | Notes |
|:------------|:------|
| **[Node.js](https://nodejs.org)** ≥ 18.x | Required runtime |
| **[ExifTool](https://exiftool.org)** | Bundled via `exiftool-vendored` (auto-installed) |
| **[FFmpeg](https://ffmpeg.org)** | Bundled via `ffmpeg-static` (auto-installed) |
| **[Ghostscript](https://ghostscript.com)** | Required for EPS/SVG files (auto-downloaded if missing) |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM.git
cd GEN-META-CR-BY_LAZIM/GenMeta_Source_Full

# 2. Install dependencies
npm install

# 3. Launch GenMeta
npm start
```

> 💡 **Windows users:** Double-click `run_genmeta.cmd` for instant launch.

<br/>

## 🚀 **Usage Guide**

### 1. Select Your Media

Click **"Browse"** to choose a folder containing your images (JPG, PNG) or videos (MP4, MOV). EPS and SVG vector files are also supported.

### 2. Configure Settings

| Setting | Description |
|:--------|:------------|
| **Target Platform** | Adobe Stock, Shutterstock, iStock, Pond5, 123RF, or General |
| **Title Length** | Short / Medium / Long |
| **Description Length** | Brief / Standard / Detailed |
| **Keyword Count** | 10–50 keywords per file |
| **Keyword Format** | Single words / Double phrases / Auto |

### 3. Start Processing

Click **"Generate Metadata"** — GenMeta will:
- Scan all supported files in your directory
- Convert EPS/SVG files to raster (if needed)
- Send each file to Google Gemini AI for analysis
- Parse and validate the AI response
- Write metadata directly into file EXIF/XMP/IPTC fields
- Display results in the interactive results panel

### 4. Export & Rename

- **Export** results to CSV for any supported stock platform
- **Rename** files using AI-generated titles or descriptions
- **Retry** individual files or entire batches
- **View** detailed metadata for each processed file

<br/>

## 🖼 **Preview**

<div align="center">

| Main Dashboard | Processing Results |
|:--------------:|:------------------:|
| ![Main UI](GenMeta_Source_Full/src/renderer/assets/images/gs-download.png) | ![Results](GenMeta_Source_Full/src/renderer/assets/images/error-placeholder.png) |

</div>

</details>

<br/>

## 📁 **Project Structure**

```
GEN-META-CR-BY_LAZIM/
├── GenMeta_Source_Full/           # Root application source
│   ├── src/
│   │   ├── main/                  # Electron main process
│   │   │   ├── ipc/               # IPC handlers (11 modules)
│   │   │   ├── handlers/          # Processing pipeline handlers
│   │   │   └── services/          # Startup, subscription, auto-updater
│   │   ├── renderer/              # Frontend UI
│   │   │   ├── js/                # Renderer JavaScript (~8K lines)
│   │   │   ├── css/               # Stylesheets (~61 files)
│   │   │   ├── html/              # HTML partials & modals
│   │   │   └── assets/            # Icons & images
│   │   ├── modules/               # Core business logic
│   │   │   ├── ai/                # Gemini AI client & prompts
│   │   │   ├── auth/              # Authentication (Google OAuth)
│   │   │   ├── media/             # Image/video format handling
│   │   │   ├── metadata/          # EXIF/XMP/IPTC writing
│   │   │   ├── ghostscript/       # Ghostscript management
│   │   │   ├── processing/        # Batch orchestration
│   │   │   ├── settings/          # Settings management
│   │   │   └── tracking/          # API key usage tracking
│   │   ├── process/               # Processing pipeline
│   │   ├── services/              # API services
│   │   ├── shared/                # Shared constants & helpers
│   │   ├── config/                # Config (API, app, models)
│   │   ├── assets/                # App icons (icon.ico, icon.png)
│   │   ├── main.js                # Main entry (legacy)
│   │   └── preload.js             # Context bridge preload
│   ├── package.json
│   ├── LICENSE
│   └── run_genmeta.cmd            # Windows launcher
├── run_genmeta.cmd                # Root launcher
└── README.md                      # You are here 📖
```

<br/>

## 🛠 **Technologies Used**

<div align="center">

| Category | Technologies |
|:---------|:-------------|
| **Framework** | ![Electron](https://img.shields.io/badge/Electron-41.6.1-47848f?logo=electron) |
| **AI Engine** | ![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.34.0-8e75f5?logo=google) |
| **Metadata** | ![ExifTool](https://img.shields.io/badge/ExifTool%20Vendored-35.13.1-00b4d8) |
| **Image** | ![Sharp](https://img.shields.io/badge/Sharp-0.34.0-99cc00) |
| **Video** | ![FFmpeg](https://img.shields.io/badge/FFmpeg%20Static-5.2.0-007acc) |
| **Vector** | ![Ghostscript](https://img.shields.io/badge/Ghostscript-10.x-green) |
| **Updates** | ![electron-updater](https://img.shields.io/badge/Auto%20Updates-6.6.2-ff6600) |
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.x-339933?logo=nodedotjs) |

</div>

<br/>

## ⚙️ **Configuration**

GenMeta is configured through the following source files:

| File | Purpose |
|:-----|:--------|
| `src/config/api.js` | API endpoints (development, staging, production) |
| `src/config/app.js` | App constants — timeouts, cleanup, intervals |
| `src/config/constants.js` | Processing limits, retries, supported formats |
| `src/config/models.js` | Available Gemini AI models |

### Environment

| Variable | Description | Default |
|:---------|:------------|:--------|
| `NODE_ENV` | Runtime environment | `development` |
| `API_BASE_URL` | Backend API URL | `https://apidev.genmeta.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Configured in source |

<br/>

## 🔧 **Build Instructions**

```bash
# Development mode
npm start
# or
npm run dev

# Production packaging (via electron-builder or similar)
# Not currently configured; runs directly from source
```

> ℹ️ GenMeta runs directly from source via `npx electron .`. For distribution packaging, you can add `electron-builder` or `electron-forge` to the project.

<br/>

## 🤝 **Contribution Guide**

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/GEN-META-CR-BY_LAZIM.git`
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to the branch: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Guidelines

- Follow the existing code style and architecture
- Ensure IPC handlers follow the established patterns
- Test with both guest and authenticated modes
- Verify metadata writing with actual file inspection
- Keep CSS changes within the component-based system

<br/>

## 🙏 **Credits**

| Role | Name |
|:-----|:-----|
| **Original Author** | [Aminur Rahman](https://github.com/aminurdev) |
| **Repository** | [GEN-META-CR-BY_LAZIM](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM) |
| **Technology** | [Google Gemini AI](https://ai.google.dev/) |
| **Framework** | [Electron](https://www.electronjs.org/) |
| **Metadata** | [ExifTool](https://exiftool.org/) by Phil Harvey |
| **Image** | [Sharp](https://sharp.pixelplumbing.com/) |
| **Video** | [FFmpeg](https://ffmpeg.org/) |
| **Vector** | [Ghostscript](https://ghostscript.com/) |

<br/>

## 📄 **License**

Distributed under the **MIT License**. See [`LICENSE`](GenMeta_Source_Full/LICENSE) for more information.

```
MIT License
Copyright (c) 2024 Aminur Rahman
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

<br/>

---

<div align="center">

### ⚡ **GenMeta** — *Intelligent Metadata, Effortlessly Generated*

[![GitHub stars](https://img.shields.io/github/stars/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM?style=social)](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM)
[![GitHub forks](https://img.shields.io/github/forks/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM?style=social)](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM)
[![GitHub issues](https://img.shields.io/github/issues/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM?style=social)](https://github.com/lazimmridha9-rgb/GEN-META-CR-BY_LAZIM)

**Built with ❤️ for microstock contributors worldwide**

</div>

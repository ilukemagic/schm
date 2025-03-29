# SCHM: Smart Clipboard History Manager

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Status](https://img.shields.io/badge/status-in%20development-orange)

SCHM is a modern desktop application built with Tauri (Rust) and React that intelligently manages and organizes clipboard content with AI-powered features.

## Overview

SCHM enhances your productivity by automatically capturing, categorizing, and managing clipboard contents. It provides quick access to your clipboard history through an intuitive interface and smart search capabilities.

## Features

### Core Functionality

- **Real-time Clipboard Monitoring**: Automatically captures and stores clipboard content
- **Multi-format Support**: Handles text, URLs, code snippets, and images
- **Intelligent Content Classification**: Automatically detects and categorizes content types
- **Customizable Retention**: Configure how long clipboard history is preserved

### User Experience

- **Global Shortcuts**: Access your clipboard history from anywhere with customizable shortcuts (default: `Ctrl+Shift+V` / `Cmd+Shift+V`)
- **Quick Search**: Rapidly find past clipboard items with powerful search capabilities
- **Compact & Full Modes**: Choose between a minimal interface for quick access or a comprehensive view for detailed management
- **System Tray Integration**: Always accessible while staying out of your way
- **Dark/Light Themes**: Adapt to your preferred visual style

### Security & Privacy

- **Local Storage**: All clipboard data remains on your device
- **No Cloud Synchronization**: Your data never leaves your computer
- **Minimal Permissions**: Only accesses what's necessary to function

## Usage Guide

SCHM integrates into your workflow with intuitive controls and keyboard shortcuts.

### Global Shortcuts

| Shortcut                                                | Action                      |
| ------------------------------------------------------- | --------------------------- |
| `Ctrl+Shift+V` (Windows/Linux)<br>`Cmd+Shift+V` (macOS) | Open SCHM clipboard manager |
| `Esc`                                                   | Close SCHM window           |

### Navigation

When the clipboard manager is open:

| Shortcut         | Action                                           |
| ---------------- | ------------------------------------------------ |
| `↑` (Up Arrow)   | Navigate to previous clipboard item              |
| `↓` (Down Arrow) | Navigate to next clipboard item                  |
| `Enter`          | Copy selected item to clipboard and close window |
| `Click` on item  | Copy item to clipboard and close window          |

### Interface Modes

#### Compact Mode

- Triggered by the global shortcut
- Streamlined interface for quick copy operations
- Features search bar and content tabs
- Shows keyboard shortcut hints at the bottom

#### Main Mode

- Full application window with comprehensive features
- Access through system tray icon
- Provides detailed view of clipboard items
- Includes advanced filtering and management options

### Content Filtering

SCHM automatically categorizes your clipboard content into:

- **Text**: Regular text snippets
- **Link**: URLs and web links
- **Code**: Programming code and syntax

Use the tabs at the top of the interface to filter by content type, or use the search bar to find specific items by keyword.

### System Tray

The application runs in the background with a system tray icon that provides quick access to:

- Show main window
- Hide to tray
- Quit application

## Technical Architecture

### Frontend

- React 18 with TypeScript
- TailwindCSS for styling
- Zustand for state management

### Backend

- Rust with Tauri framework
- SQLite for local storage
- Tokio for asynchronous runtime

## Development Status

SCHM is currently in active development. The core clipboard monitoring and storage functionality are operational, with AI capabilities and additional features planned for future releases.

### Current Progress

- [x] Core clipboard monitoring engine
- [x] Basic UI with dark/light theme support
- [x] Content type detection & classification
- [x] System tray integration
- [x] Local SQLite database storage
- [x] Global shortcut support
- [ ] AI-powered content analysis
- [ ] Advanced search capabilities
- [ ] Cross-device synchronization (optional)

## Building & Running

### Prerequisites

- Node.js (v16+)
- Rust (1.65+)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/schm.git
cd schm

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

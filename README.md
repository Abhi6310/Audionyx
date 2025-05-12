# Audionyx

> **An immersive 3D audio visualizer**  
> Course project by five students at the University of Colorado Boulder

**Live demo:** https://audionyx.onrender.com

---

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Architecture & Tech Stack](#architecture--tech-stack)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Local Install](#local-install)  
  - [Docker](#docker)  
- [Usage](#usage)  
- [Directory Structure](#directory-structure)  
- [Contributors](#contributors)  
- [License](#license)  

---

## Overview

Audionyx is a real-time, browser-based 3D visualizer that:  
1. **Loads audio** from YouTube links or local MP3 files  
2. **Analyzes** waveform, intensity, frequency, amplitude & tempo  
3. **Renders** an interactive Three.js scene synchronized to the beat  

---

## Features

- 🎵 **Input**  
  - Paste YouTube or other media URLs  
  - Upload local `.mp3` files  
- 🔊 **Audio Analysis**  
  - Real-time FFT for frequency bands  
  - Beat-detection & amplitude tracking  
- 🌐 **Visualization**  
  - Dynamic 3D geometry (particles, bars, meshes)  
  - Shader-driven effects responding to audio  
- ⚙️ **Deployment**  
  - One-click on Render.com  
  - Docker-ready for local hosting  

---

## Architecture & Tech Stack

- **Server**: Node.js & Express  
- **Audio Processing**: Web Audio API, FFT  
- **Visualization**: Three.js (WebGL), GLSL shaders  
- **Download Helpers**:  
  - `spotifyToMP3.js`  
  - `youtubeToMP3.js`  
- **Containerization**: Docker & Docker Compose  
- **Env Management**: `.env` for API keys & ports  

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+  
- [npm](https://npmjs.com/) or [yarn](https://yarnpkg.com/)  
- **Optional**: Docker & Docker Compose  

### Local Install

1. **Clone** the repo  
   ```bash
   git clone https://github.com/your-org/Audionyx.git
   cd Audionyx

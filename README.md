# ⚡ Sanskar's Local AI Workspace 

A hyper-optimized, privacy-first local AI workstation tailored for NVIDIA RTX 4050 (6GB VRAM) environments. Built with React and Vite, this custom Ollama frontend bridges the gap between lightweight hardware and heavy-duty AI workflows, featuring simultaneous multi-model execution, live web search retrieval, and a tactile, procedurally animated matte interface.

## 🚀 Core Features

### ⚔️ Dual Arena Mode
Pit two local models against each other side-by-side. Send a single prompt and watch **Llama 3.2** and **Phi 3.5** stream their reasoning simultaneously with independent `tokens/sec` performance metrics.

### 🌐 Live Web RAG Engine
Bypass static knowledge cutoffs without paying for API keys.
* **CORS-Free Vite Scraper:** A custom local proxy intercepts DuckDuckGo HTML results, bypassing browser restrictions.
* **Intelligent Injection:** Automatically scrapes live web snippets and injects them into the model's context window.
* **Source Badges:** Clickable citations appear natively inside the AI's response card.

### ⚡ RTX 4050 VRAM Optimization
Engineered to operate seamlessly within a 6GB VRAM limit. Pre-configured for highly capable, sub-5B parameter models:
* `llama3.2` (3B) - Smart General Reasoning
* `phi3.5` (3.8B) - Logic & Math Operations
* `qwen2.5-coder:3b` - Scripting & C++/Python Generation
* `qwen3.5:4b` - General Knowledge

### 🎨 Procedural "Matte Obsidian" UI
Rejects the standard "flat web" look for a raw, tactile hardware aesthetic.
* **Asymmetric Edge-Chaining:** Hovering over the custom matte-beveled keys triggers a live DOM-tracking script that loops crackling Tesla arcs around the specific button's perimeter.
* **High-Voltage Clicks:** A procedural SVG lightning engine generates unique, multi-branched plasma shockwaves at your exact cursor coordinates on every click.

### 📎 Drag-and-Drop Ingestion & Voice
* **Local File Analysis:** Drop `.py`, `.cpp`, `.md`, or `.csv` files directly onto the canvas to instantly append their contents to your prompt.
* **Hands-Free Operation:** Integrated Web Speech API for microphone dictation and text-to-speech (TTS) readouts of model responses.

---

## ⚙️ Installation & Setup

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (v18+ recommended).
2. Install [Ollama](https://ollama.com/) and ensure it is running in your system tray.
3. Configure Ollama to accept local API requests. Ensure your environment variables include:
   `OLLAMA_ORIGINS="*"`
   `OLLAMA_MAX_LOADED_MODELS="2"`

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone [git clone https://github.com/sanskar-0370/local-ai-workspace-ollama.git](git clone https://github.com/sanskar-0370/local-ai-workspace-ollama.git)
   cd local-ai-workspace-ollama
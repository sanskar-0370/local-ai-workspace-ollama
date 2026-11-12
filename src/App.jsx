import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const CORE_MODELS = [
  { id: 'llama3.2', label: 'Llama 3.2 · 3B' },
  { id: 'phi3.5', label: 'Phi 3.5 · 3.8B' },
  { id: 'qwen3.5:4b', label: 'Qwen 3.5 · 4B' },
  { id: 'qwen2.5-coder:3b', label: 'Qwen Coder · 3B' },
];

const KEY_SHAPES = [
  '16px 5px 14px 7px / 7px 15px 6px 16px',
  '6px 17px 7px 15px / 15px 6px 16px 5px',
  '14px 8px 18px 5px / 6px 16px 5px 14px',
  '8px 15px 6px 17px / 17px 7px 14px 6px',
];

// Generate a radial jagged lightning bolt from a click point
function buildLightningBolt(startX, startY, angle, length, segments = 6) {
  const points = [[startX, startY]];
  let currX = startX;
  let currY = startY;
  const branches = [];

  for (let i = 1; i <= segments; i++) {
    const progress = i / segments;
    const stepDist = length / segments;
    const jitter = (Math.random() - 0.5) * 24 * (1 - progress * 0.35);
    const perpAngle = angle + Math.PI / 2;

    currX += Math.cos(angle) * stepDist + Math.cos(perpAngle) * jitter;
    currY += Math.sin(angle) * stepDist + Math.sin(perpAngle) * jitter;
    points.push([currX, currY]);

    if (i > 1 && i < segments && Math.random() > 0.5) {
      const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.45);
      const branchLen = length * 0.38;
      let bx = currX;
      let by = currY;
      const bPoints = [[bx, by]];
      for (let b = 1; b <= 3; b++) {
        const bJitter = (Math.random() - 0.5) * 14;
        bx += Math.cos(branchAngle) * (branchLen / 3) + Math.cos(branchAngle + Math.PI / 2) * bJitter;
        by += Math.sin(branchAngle) * (branchLen / 3) + Math.sin(branchAngle + Math.PI / 2) * bJitter;
        bPoints.push([bx, by]);
      }
      branches.push(
        bPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ')
      );
    }
  }

  return {
    mainPath: points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' '),
    branches,
    endX: currX,
    endY: currY,
  };
}

// Generate an electric arc that chains directly along a key edge
function buildEdgeChain(x1, y1, x2, y2, jitterAmp = 6) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(5, Math.min(18, Math.floor(dist / 14)));
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  const pts = [[x1, y1]];
  const sparks = [];

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const offset = (Math.random() - 0.5) * jitterAmp * 2;
    const px = x1 + dx * t + nx * offset;
    const py = y1 + dy * t + ny * offset;
    pts.push([px, py]);

    if (Math.random() > 0.72) {
      const sLen = 8 + Math.random() * 14;
      const sDir = Math.random() > 0.5 ? 1 : -1;
      const sx = px + nx * sLen * sDir + (Math.random() - 0.5) * 8;
      const sy = py + ny * sLen * sDir + (Math.random() - 0.5) * 8;
      sparks.push(`M ${px.toFixed(1)} ${py.toFixed(1)} L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    }
  }
  pts.push([x2, y2]);

  return {
    path: pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '),
    sparks,
  };
}

// Build perimeter arcs wrapping the edges of a button's bounding box
function buildBoxPerimeterArcs(rect, isClickOverload = false) {
  const pad = isClickOverload ? 2 : 1;
  const l = rect.left - pad;
  const r = rect.right + pad;
  const t = rect.top - pad;
  const b = rect.bottom + pad;
  const jitter = isClickOverload ? 9 : 4.5;

  const edges = [
    [l, t, r, t],
    [r, t, r, b],
    [r, b, l, b],
    [l, b, l, t],
  ];

  const chosenEdges = isClickOverload ? edges : edges.filter(() => Math.random() > 0.35);
  if (chosenEdges.length === 0) chosenEdges.push(edges[Math.floor(Math.random() * 4)]);

  return chosenEdges.map(([x1, y1, x2, y2]) => buildEdgeChain(x1, y1, x2, y2, jitter));
}

export default function App() {
  useEffect(() => {
    document.title = "Sanskar's Personal AI Chatbots";
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
    const style = document.createElement('style');
    style.innerHTML = `
      body, html, #root {
        margin: 0; padding: 0; width: 100%; height: 100%;
        max-width: none !important; text-align: left !important;
        background-color: #050608; color: #d4d8df;
        user-select: none;
      }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #262930; border-radius: 2px; }

      .matte-key {
        background: linear-gradient(145deg, rgba(20, 23, 28, 0.86), rgba(9, 11, 14, 0.94));
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        border-left: 1px solid rgba(255, 255, 255, 0.06);
        border-right: 1px solid rgba(0, 0, 0, 0.75);
        border-bottom: 2px solid rgba(0, 0, 0, 0.9);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        transition: transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1),
                    border-color 0.18s ease,
                    box-shadow 0.18s ease,
                    background 0.18s ease;
      }
      .matte-key:hover:not(:disabled) {
        border-top-color: rgba(56, 189, 248, 0.75);
        border-left-color: rgba(37, 99, 235, 0.55);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.85), 0 0 22px rgba(56, 189, 248, 0.28);
        transform: translateY(-1.5px) rotate(-0.25deg);
      }
      .matte-key:active:not(:disabled) {
        transform: translateY(2px) scale(0.98);
        border-top-color: rgba(224, 242, 254, 1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.9), 0 0 36px rgba(56, 189, 248, 0.65);
      }
      .matte-key-active {
        background: linear-gradient(145deg, rgba(14, 28, 48, 0.92), rgba(8, 14, 24, 0.96));
        border-top: 1px solid rgba(56, 189, 248, 0.75);
        border-left: 1px solid rgba(37, 99, 235, 0.55);
        box-shadow: 0 4px 20px rgba(14, 165, 233, 0.22), inset 0 0 14px rgba(56, 189, 248, 0.1);
      }

      @keyframes arcFlicker {
        0% { opacity: 1; }
        25% { opacity: 0.3; }
        50% { opacity: 1; }
        75% { opacity: 0.2; }
        100% { opacity: 0; }
      }

      @keyframes plasmaFlash {
        0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
        30% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.85; }
        100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
      }

      .electric-svg-layer {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        overflow: visible;
      }

      .arc-outer-glow {
        fill: none;
        stroke: #38bdf8;
        stroke-width: 3.2px;
        stroke-linecap: round;
        stroke-linejoin: bevel;
        filter: drop-shadow(0 0 6px #38bdf8) drop-shadow(0 0 14px #2563eb);
        animation: arcFlicker 0.45s ease-out forwards;
      }

      .arc-inner-core {
        fill: none;
        stroke: #f0f9ff;
        stroke-width: 1.25px;
        stroke-linecap: round;
        animation: arcFlicker 0.45s ease-out forwards;
      }

      .hover-edge-glow {
        fill: none;
        stroke: #0ea5e9;
        stroke-width: 2.4px;
        stroke-linecap: round;
        filter: drop-shadow(0 0 5px #38bdf8) drop-shadow(0 0 10px #1d4ed8);
        opacity: 0.9;
      }

      .hover-edge-core {
        fill: none;
        stroke: #e0f2fe;
        stroke-width: 1px;
        stroke-linecap: round;
        opacity: 0.95;
      }

      .plasma-core-burst {
        position: fixed;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          #ffffff 0%,
          rgba(125, 211, 252, 0.85) 28%,
          rgba(37, 99, 235, 0.4) 60%,
          rgba(0, 0, 0, 0) 100%
        );
        mix-blend-mode: screen;
        pointer-events: none;
        z-index: 9998;
        animation: plasmaFlash 0.42s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Wallpaper State
  const [bgImage, setBgImage] = useState(() => {
    return localStorage.getItem('sanskar_matte_bg') || '/bg.png';
  });
  const bgInputRef = useRef(null);

  // Cursor, Click Discharges & Hover Key Edge-Chaining State
  const [cursorPos, setCursorPos] = useState({ x: -500, y: -500 });
  const [discharges, setDischarges] = useState([]);
  const [hoverArcs, setHoverArcs] = useState([]);
  const hoveredKeyRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = hoveredKeyRef.current;
      if (!el || !document.body.contains(el)) {
        setHoverArcs([]);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setHoverArcs(buildBoxPerimeterArcs(rect, false));
    }, 85);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMoveGlobal = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    const keyEl = e.target.closest('.matte-key');
    if (keyEl !== hoveredKeyRef.current) {
      hoveredKeyRef.current = keyEl;
      if (keyEl) {
        setHoverArcs(buildBoxPerimeterArcs(keyEl.getBoundingClientRect(), false));
      } else {
        setHoverArcs([]);
      }
    }
  };

  const triggerLightning = (e) => {
    const id = Date.now() + Math.random();
    const x = e.clientX;
    const y = e.clientY;

    const boltCount = 6;
    const bolts = Array.from({ length: boltCount }).map((_, idx) => {
      const baseAngle = (Math.PI * 2 * idx) / boltCount;
      const angle = baseAngle + (Math.random() - 0.5) * 0.55;
      const length = 45 + Math.random() * 65;
      return buildLightningBolt(x, y, angle, length, 6);
    });

    const clickedKey = e.target.closest('.matte-key');
    const edgeChains = clickedKey
      ? buildBoxPerimeterArcs(clickedKey.getBoundingClientRect(), true)
      : [];

    setDischarges((prev) => [...prev, { id, x, y, bolts, edgeChains }]);
    setTimeout(() => {
      setDischarges((prev) => prev.filter((d) => d.id !== id));
    }, 460);
  };

  // Models & Ollama Status State
  const [installedModels, setInstalledModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [secondModel, setSecondModel] = useState('phi3.5');
  const [arenaMode, setArenaMode] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [pullProgress, setPullProgress] = useState(null);

  // NEW: Web Search RAG State
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [tavilyKey, setTavilyKey] = useState(() => localStorage.getItem('sanskar_tavily_key') || '');

  // Chat Sessions State
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sanskar_ai_sessions');
    return saved
      ? JSON.parse(saved)
      : [{ id: Date.now(), title: 'Session // 01', messages: [] }];
  });
  const [activeId, setActiveId] = useState(() => sessions[0]?.id);

  // Input, Files & Controls
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disableThinking, setDisableThinking] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Sanskar’s personal AI assistant. Answer directly, technically, and concisely without filler.'
  );

  // Voice Input & TTS
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingText, setSpeakingText] = useState(null);
  const recognitionRef = useRef(null);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];

  useEffect(() => {
    localStorage.setItem('sanskar_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('sanskar_tavily_key', tavilyKey);
  }, [tavilyKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isStreaming, isSearchingWeb]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join('');
        setInput(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition requires Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingText === text) {
      setSpeakingText(null);
      return;
    }
    const cleanText = text.replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingText(null);
    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  const refreshInstalledModels = () => {
    fetch('http://localhost:11434/api/tags')
      .then((res) => res.json())
      .then((data) => {
        setIsOnline(true);
        if (data.models) setInstalledModels(data.models.map((m) => m.name));
      })
      .catch(() => setIsOnline(false));
  };

  useEffect(() => {
    refreshInstalledModels();
  }, []);

  const isModelInstalled = (modelId) =>
    installedModels.some(
      (inst) => inst === modelId || inst === `${modelId}:latest` || inst.split(':')[0] === modelId
    );

  const extraModels = installedModels.filter(
    (inst) =>
      !CORE_MODELS.some(
        (core) => core.id === inst || `${core.id}:latest` === inst || core.id === inst.split(':')[0]
      )
  );

  const handlePullModel = async (modelToPull) => {
    if (pullProgress) return;
    setPullProgress(`PULLING ${modelToPull}...`);
    try {
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelToPull, stream: true }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const parsed = JSON.parse(line);
            if (parsed.total && parsed.completed) {
              setPullProgress(`${modelToPull}: ${Math.round((parsed.completed / parsed.total) * 100)}%`);
            }
          }
        }
      }
      refreshInstalledModels();
    } catch {
      alert(`Failed to pull ${modelToPull}.`);
    } finally {
      setPullProgress(null);
    }
  };

  // NEW: Multi-Layer Web RAG Retriever
  // Layer 1: Optional Tavily API (if configured in CONFIG)
  // Layer 2: Local Vite DuckDuckGo HTML Scraper (/api/web-search)
  // Layer 3: Direct Browser CORS-Safe Fallback (Wikipedia + DuckDuckGo Instant + HN Algolia)
  const fetchWebRagContext = async (rawQuery) => {
    const cleanQuery = rawQuery.replace(/\n+/g, ' ').slice(0, 180).trim();
    const collected = [];

    // 1. Try Tavily Search API if user added a key in CONFIG
    if (tavilyKey.trim()) {
      try {
        const tRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey.trim(),
            query: cleanQuery,
            search_depth: 'basic',
            max_results: 5,
          }),
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          if (tData.results?.length) {
            return tData.results.map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.content,
            }));
          }
        }
      } catch {}
    }

    // 2. Try Local Vite Middleware Scraper (/api/web-search -> DuckDuckGo HTML)
    try {
      const vRes = await fetch(`/api/web-search?q=${encodeURIComponent(cleanQuery)}`);
      const contentType = vRes.headers.get('content-type') || '';
      if (vRes.ok && contentType.includes('application/json')) {
        const vData = await vRes.json();
        if (vData.results?.length > 0) {
          return vData.results;
        }
      }
    } catch {}

    // 3. Automatic Browser-Direct Fallback (Wikipedia API + DuckDuckGo Instant + HackerNews)
    try {
      const [wikiRes, ddgRes, hnRes] = await Promise.allSettled([
        fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            cleanQuery
          )}&utf8=&format=json&origin=*&srlimit=3`
        ).then((r) => r.json()),
        fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`
        ).then((r) => r.json()),
        fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(cleanQuery)}&hitsPerPage=2`
        ).then((r) => r.json()),
      ]);

      if (ddgRes.status === 'fulfilled' && ddgRes.value?.AbstractText) {
        collected.push({
          title: ddgRes.value.Heading || 'DuckDuckGo Instant Summary',
          url: ddgRes.value.AbstractURL || 'https://duckduckgo.com',
          snippet: ddgRes.value.AbstractText,
        });
      }

      if (wikiRes.status === 'fulfilled' && wikiRes.value?.query?.search) {
        wikiRes.value.query.search.forEach((item) => {
          const cleanSnippet = item.snippet.replace(/<[^>]+>/g, '');
          collected.push({
            title: `Wikipedia: ${item.title}`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
            snippet: cleanSnippet,
          });
        });
      }

      if (hnRes.status === 'fulfilled' && hnRes.value?.hits) {
        hnRes.value.hits.forEach((hit) => {
          if (hit.title && (hit.url || hit.story_text)) {
            collected.push({
              title: `HN: ${hit.title}`,
              url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
              snippet: hit.story_text
                ? hit.story_text.replace(/<[^>]+>/g, '').slice(0, 240)
                : `Discussion thread (${hit.points || 0} points, ${hit.num_comments || 0} comments).`,
            });
          }
        });
      }
    } catch {}

    return collected.slice(0, 5);
  };

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBgImage(ev.target.result);
      try {
        localStorage.setItem('sanskar_matte_bg', ev.target.result);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const processFiles = (fileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) return alert(`${file.name} exceeds 2MB.`);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: e.target.result },
        ]);
      };
      reader.readAsText(file);
    });
  };

  const createNewChat = () => {
    if (isStreaming) return;
    const newChat = { id: Date.now(), title: `Session // 0${sessions.length + 1}`, messages: [] };
    setSessions((prev) => [newChat, ...prev]);
    setActiveId(newChat.id);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const fresh = { id: Date.now(), title: 'Session // 01', messages: [] };
      setSessions([fresh]);
      setActiveId(fresh.id);
    } else {
      setSessions(filtered);
      if (activeId === id) setActiveId(filtered[0].id);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsSearchingWeb(false);
    }
  };

  const streamModelResponse = async (modelName, apiMessages, signal, onUpdate) => {
    let finalClean = '';
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          model: modelName,
          messages: apiMessages,
          stream: true,
          think: !disableThinking,
          options: { temperature: parseFloat(temperature) },
        }),
      });
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (line.trim() !== '') {
            const parsed = JSON.parse(line);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.message?.content) accumulated += parsed.message.content;
            finalClean = disableThinking
              ? accumulated.replace(/<think>[\s\S]*?<\/think>/g, '').trimStart()
              : accumulated;

            let speedStats = null;
            if (parsed.done && parsed.eval_count && parsed.eval_duration) {
              const tokPerSec = (parsed.eval_count / (parsed.eval_duration / 1e9)).toFixed(1);
              speedStats = `${tokPerSec} t/s · ${parsed.eval_count} tok`;
            }
            onUpdate(finalClean, speedStats);
          }
        }
      }
      setIsOnline(true);
      return finalClean;
    } catch (error) {
      if (error.name !== 'AbortError') {
        onUpdate(`[ERROR // ${modelName}]: ${error.message || 'Check Ollama connection.'}`, null);
      }
      return '';
    }
  };

  const handleSend = async (customPrompt) => {
    const rawText = typeof customPrompt === 'string' ? customPrompt : input;
    if ((!rawText.trim() && attachedFiles.length === 0) || isStreaming) return;

    let displayContent = rawText.trim();
    if (attachedFiles.length > 0) {
      const filesBlock = attachedFiles
        .map((f) => `### File: \`${f.name}\`\n\`\`\`\n${f.content}\n\`\`\``)
        .join('\n\n');
      displayContent = displayContent ? `${filesBlock}\n\n${displayContent}` : `Analyze file(s):\n\n${filesBlock}`;
    }

    const userMessage = { role: 'user', content: displayContent };
    const historyForApi = activeSession.messages.map((m) => ({
      role: m.role,
      content: m.isArena ? m.contentA || m.contentB || '' : m.content,
    }));

    const titleSource = rawText.trim() || attachedFiles[0]?.name || 'File Inspection';
    const newTitle =
      activeSession.messages.length === 0
        ? titleSource.slice(0, 26) + (titleSource.length > 26 ? '...' : '')
        : activeSession.title;

    const assistantPlaceholder = arenaMode
      ? {
          role: 'assistant',
          isArena: true,
          modelA: selectedModel,
          modelB: secondModel,
          contentA: '',
          contentB: '',
          statsA: null,
          statsB: null,
          sources: [],
        }
      : {
          role: 'assistant',
          isArena: false,
          model: selectedModel,
          content: '',
          stats: null,
          sources: [],
        };

    const currentSessionId = activeId;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: newTitle, messages: [...s.messages, userMessage, assistantPlaceholder] }
          : s
      )
    );

    setInput('');
    setAttachedFiles([]);
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // STEP 1: If WEB SEARCH KEY is ON, retrieve live web results first (RAG)
      let webSources = [];
      let augmentedUserPrompt = displayContent;

      if (webSearchEnabled && rawText.trim()) {
        setIsSearchingWeb(true);
        webSources = await fetchWebRagContext(rawText.trim());
        setIsSearchingWeb(false);

        if (webSources.length > 0) {
          const formattedSnippets = webSources
            .map(
              (src, idx) =>
                `[Source ${idx + 1}] Title: ${src.title}\nURL: ${src.url}\nSnippet: ${src.snippet}`
            )
            .join('\n\n');

          augmentedUserPrompt = `### LIVE WEB SEARCH RESULTS (Retrieved ${new Date().toDateString()}):\n${formattedSnippets}\n\n### INSTRUCTION:\nUse the live web search results above to accurately answer the user's question. Cite facts clearly. If the results do not contain the full answer, combine them with your technical knowledge.\n\n### USER QUESTION:\n${displayContent}`;

          // Attach clickable source badges to the assistant message card
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSessionId) return s;
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              msgs[msgs.length - 1] = { ...last, sources: webSources };
              return { ...s, messages: msgs };
            })
          );
        }
      }

      const apiMessages = systemPrompt.trim()
        ? [
            { role: 'system', content: systemPrompt.trim() },
            ...historyForApi,
            { role: 'user', content: augmentedUserPrompt },
          ]
        : [...historyForApi, { role: 'user', content: augmentedUserPrompt }];

      // STEP 2: Stream from local Ollama model(s) with augmented RAG context
      if (arenaMode) {
        await Promise.all([
          streamModelResponse(selectedModel, apiMessages, signal, (textA, statsA) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const msgs = [...s.messages];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, contentA: textA, statsA: statsA || last.statsA };
                return { ...s, messages: msgs };
              })
            );
          }),
          streamModelResponse(secondModel, apiMessages, signal, (textB, statsB) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const msgs = [...s.messages];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, contentB: textB, statsB: statsB || last.statsB };
                return { ...s, messages: msgs };
              })
            );
          }),
        ]);
      } else {
        const finalReply = await streamModelResponse(selectedModel, apiMessages, signal, (text, stats) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSessionId) return s;
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              msgs[msgs.length - 1] = { ...last, content: text, stats: stats || last.stats };
              return { ...s, messages: msgs };
            })
          );
        });
        if (autoSpeak && finalReply) speakText(finalReply);
      }
    } finally {
      setIsSearchingWeb(false);
      setIsStreaming(false);
    }
  };

  const CodeBlock = ({ inline, className, children, ...props }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (!inline && (match || codeString.includes('\n'))) {
      return (
        <div
          style={{ borderRadius: KEY_SHAPES[0] }}
          className="my-3 overflow-hidden border border-zinc-800 bg-[#090a0d]/95"
        >
          <div className="flex justify-between items-center px-3.5 py-1.5 bg-[#111318] border-b border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
            <span className="uppercase tracking-wider text-sky-400/90">{match ? match[1] : 'code'}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeString);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{ borderRadius: KEY_SHAPES[1] }}
              className="matte-key px-2.5 py-0.5 text-[11px] text-zinc-300 hover:text-sky-300"
            >
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed select-text">
            <code {...props}>{children}</code>
          </pre>
        </div>
      );
    }
    return (
      <code className="bg-zinc-900/90 border border-zinc-800 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono select-text" {...props}>
        {children}
      </code>
    );
  };

  // Render clickable RAG Web Source Badges inside message cards
  const SourceBadges = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    return (
      <div className="mb-3 pb-2.5 border-b border-zinc-800/70">
        <div className="text-[10px] font-mono uppercase tracking-widest text-sky-400/90 mb-1.5">
          WEB RAG SOURCES // {sources.length} RETRIEVED
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sources.map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noreferrer"
              style={{ borderRadius: KEY_SHAPES[i % KEY_SHAPES.length] }}
              className="matte-key px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:text-sky-300 truncate max-w-[230px]"
              title={src.snippet}
            >
              [{i + 1}] {src.title}
            </a>
          ))}
        </div>
      </div>
    );
  };

  const QUICK_KEYS = [
    {
      tag: '01 // EMBEDDED.PID',
      title: 'PID Control Loop Tuning',
      prompt: 'Compare PID tuning strategies and C++ implementation for an ESP32 line follower.',
    },
    {
      tag: '02 // SENSOR.FUSION',
      title: 'IMU & Barometer Trajectory Parser',
      prompt: 'Write a clean Python script to filter and reconstruct 3D trajectory from IMU and barometer data.',
    },
    {
      tag: '03 // ALGO.GRAPH',
      title: 'Shortest Path Complexity Breakdown',
      prompt: 'Compare Dijkstra and A* pathfinding algorithms with implementation tradeoffs and time complexity.',
    },
    {
      tag: '04 // SEC.FORENSICS',
      title: 'Linux Privilege & CTF Recon',
      prompt: 'List 5 essential Linux privilege escalation and digital forensics checks for CTF challenges.',
    },
  ];

  return (
    <div
      onMouseMove={handleMouseMoveGlobal}
      onMouseDown={triggerLightning}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
      }}
      className="flex h-screen w-screen bg-[#050608] text-zinc-200 font-sans overflow-hidden relative"
    >
      {/* Matte Wave SVG Fallback Filter */}
      <svg className="hidden">
        <filter id="obsidian-waves" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.028" numOctaves="4" seed="11" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#1c2026" surfaceScale="9" result="light">
            <feDistantLight azimuth="65" elevation="28" />
          </feDiffuseLighting>
        </filter>
      </svg>

      {/* Deep Matte Wave Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-45" style={{ filter: 'url(#obsidian-waves)' }} />
      <div
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-85 transition-opacity duration-500"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />

      {/* Ambient Blue Cursor Spotlight */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(340px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(37, 99, 235, 0.16), rgba(56, 189, 248, 0.04) 45%, transparent 80%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Matte Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(8, 10, 13, 0.4) 0%, rgba(4, 5, 7, 0.88) 100%)',
        }}
      />

      {/* LIVE HOVER EDGE-CHAINING ARCS AROUND MATTE KEYS */}
      {hoverArcs.length > 0 && (
        <svg className="electric-svg-layer">
          {hoverArcs.map((chain, idx) => (
            <g key={idx}>
              {chain.sparks.map((sp, sIdx) => (
                <path key={sIdx} d={sp} className="hover-edge-glow" />
              ))}
              <path d={chain.path} className="hover-edge-glow" />
              <path d={chain.path} className="hover-edge-core" />
            </g>
          ))}
        </svg>
      )}

      {/* CLICK HIGH-VOLTAGE LIGHTNING & 4-EDGE KEY OVERLOAD */}
      {discharges.map((d) => (
        <React.Fragment key={d.id}>
          <span className="plasma-core-burst" style={{ left: d.x, top: d.y }} />
          <svg className="electric-svg-layer">
            {d.bolts.map((bolt, bIdx) => (
              <g key={`bolt-${bIdx}`}>
                {bolt.branches.map((bPath, subIdx) => (
                  <path key={subIdx} d={bPath} className="arc-outer-glow" style={{ strokeWidth: '1.4px' }} />
                ))}
                <path d={bolt.mainPath} className="arc-outer-glow" />
                <path d={bolt.mainPath} className="arc-inner-core" />
              </g>
            ))}
            {d.edgeChains.map((chain, eIdx) => (
              <g key={`edge-${eIdx}`}>
                {chain.sparks.map((sp, sIdx) => (
                  <path key={sIdx} d={sp} className="arc-outer-glow" style={{ strokeWidth: '1.6px' }} />
                ))}
                <path d={chain.path} className="arc-outer-glow" />
                <path d={chain.path} className="arc-inner-core" />
              </g>
            ))}
          </svg>
        </React.Fragment>
      ))}

      {/* LEFT SIDEBAR */}
      {sidebarOpen && (
        <aside className="w-64 bg-[#0a0c0f]/85 backdrop-blur-md border-r border-zinc-800/70 flex flex-col z-10">
          <div className="p-4 border-b border-zinc-800/70 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-zinc-600'}`} />
                <span className="font-mono font-bold text-xs tracking-widest text-zinc-100">SANSKAR // AI</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5 pl-4">Personal AI Chatbots</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ borderRadius: KEY_SHAPES[1] }}
              className="matte-key text-zinc-400 hover:text-zinc-100 text-xs px-2.5 py-1 font-mono"
            >
              HIDE
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={createNewChat}
              style={{ borderRadius: KEY_SHAPES[0] }}
              className="matte-key w-full py-2.5 px-3 text-zinc-100 hover:text-sky-300 text-xs font-mono tracking-wider uppercase flex items-center justify-between"
            >
              <span>+ New Session</span>
              <span className="text-[10px] text-zinc-500">NEW</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1.5">
            {sessions.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                style={{ borderRadius: KEY_SHAPES[idx % KEY_SHAPES.length] }}
                className={`group matte-key flex items-center justify-between px-3 py-2.5 text-xs cursor-pointer ${
                  s.id === activeId ? 'matte-key-active text-sky-200 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="truncate pr-2 font-mono">{s.title}</span>
                <button
                  onClick={(e) => deleteChat(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition text-[11px] font-mono"
                >
                  DEL
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 border-t border-zinc-800/70 text-[11px] font-mono text-zinc-500 flex justify-between items-center bg-[#08090c]/90">
            <span>RTX 4050 · {webSearchEnabled ? 'WEB RAG' : 'LOCAL'}</span>
            <span className={isOnline ? 'text-sky-400' : 'text-rose-500'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </aside>
      )}

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        <header className="min-h-14 py-2.5 px-4 border-b border-zinc-800/70 bg-[#0a0c0f]/75 backdrop-blur-md flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ borderRadius: KEY_SHAPES[2] }}
                className="matte-key px-3 py-1.5 text-zinc-300 hover:text-sky-300 text-xs font-mono"
              >
                PANEL
              </button>
            )}

            <button
              onClick={() => setArenaMode(!arenaMode)}
              disabled={isStreaming}
              style={{ borderRadius: KEY_SHAPES[1] }}
              className={`matte-key px-3.5 py-1.5 text-xs font-mono tracking-wide ${
                arenaMode ? 'matte-key-active text-sky-300' : 'text-zinc-300'
              }`}
            >
              {arenaMode ? 'DUAL ARENA // ON' : 'SINGLE ENGINE'}
            </button>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isStreaming}
              style={{ borderRadius: KEY_SHAPES[0] }}
              className="matte-key bg-[#0e1014] text-zinc-200 px-3 py-1.5 text-xs font-mono focus:outline-none cursor-pointer"
            >
              {CORE_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0e1014] text-zinc-200">
                  {isModelInstalled(m.id) ? '●' : '↓'} {arenaMode ? `[A] ${m.label}` : m.label}
                </option>
              ))}
              {extraModels.map((ext) => (
                <option key={ext} value={ext} className="bg-[#0e1014] text-zinc-200">
                  ● {arenaMode ? `[A] ${ext}` : ext}
                </option>
              ))}
            </select>

            {arenaMode && (
              <>
                <span className="text-[11px] font-mono text-sky-400/80">VS</span>
                <select
                  value={secondModel}
                  onChange={(e) => setSecondModel(e.target.value)}
                  disabled={isStreaming}
                  style={{ borderRadius: KEY_SHAPES[3] }}
                  className="matte-key bg-[#0e1014] text-sky-200 px-3 py-1.5 text-xs font-mono focus:outline-none cursor-pointer"
                >
                  {CORE_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0e1014] text-zinc-200">
                      {isModelInstalled(m.id) ? '●' : '↓'} [B] {m.label}
                    </option>
                  ))}
                  {extraModels.map((ext) => (
                    <option key={ext} value={ext} className="bg-[#0e1014] text-zinc-200">
                      ● [B] {ext}
                    </option>
                  ))}
                </select>
              </>
            )}

            {!isModelInstalled(selectedModel) && isOnline && (
              <button
                onClick={() => handlePullModel(selectedModel)}
                disabled={!!pullProgress}
                style={{ borderRadius: KEY_SHAPES[2] }}
                className="matte-key matte-key-active px-3 py-1.5 text-sky-300 text-xs font-mono"
              >
                {pullProgress ? pullProgress : `PULL ${selectedModel}`}
              </button>
            )}

            <button
              onClick={() => setDisableThinking(!disableThinking)}
              style={{ borderRadius: KEY_SHAPES[3] }}
              className={`matte-key px-3 py-1.5 text-xs font-mono ${
                disableThinking ? 'text-zinc-300' : 'matte-key-active text-sky-300'
              }`}
            >
              {disableThinking ? 'MODE: DIRECT' : 'MODE: TRACE'}
            </button>

            {/* Top Navbar Web Search RAG Status Key */}
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              style={{ borderRadius: KEY_SHAPES[0] }}
              className={`matte-key px-3 py-1.5 text-xs font-mono transition ${
                webSearchEnabled ? 'matte-key-active text-sky-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Live Web Search RAG"
            >
              {webSearchEnabled ? '● WEB RAG: ON' : 'WEB RAG: OFF'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (autoSpeak) window.speechSynthesis?.cancel();
                setAutoSpeak(!autoSpeak);
              }}
              style={{ borderRadius: KEY_SHAPES[1] }}
              className={`matte-key px-3 py-1.5 text-xs font-mono ${
                autoSpeak ? 'matte-key-active text-sky-300' : 'text-zinc-400'
              }`}
            >
              {autoSpeak ? 'TTS: AUTO' : 'TTS: OFF'}
            </button>

            <input type="file" ref={bgInputRef} onChange={handleBgUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => bgInputRef.current?.click()}
              style={{ borderRadius: KEY_SHAPES[0] }}
              className="matte-key px-3 py-1.5 text-zinc-400 hover:text-sky-300 text-xs font-mono"
            >
              WALLPAPER
            </button>

            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{ borderRadius: KEY_SHAPES[2] }}
              className="matte-key px-3 py-1.5 text-zinc-400 hover:text-zinc-100 text-xs font-mono"
            >
              CONFIG
            </button>
          </div>
        </header>

        {settingsOpen && (
          <div className="bg-[#0b0d11]/95 border-b border-zinc-800/80 p-4 text-xs font-mono">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">System Directive</label>
                <input
                  type="text"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  style={{ borderRadius: KEY_SHAPES[0] }}
                  className="w-full matte-key px-3 py-2 text-zinc-200 focus:outline-none select-text"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Optional Tavily Search Key (Free API)
                </label>
                <input
                  type="password"
                  value={tavilyKey}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="Leave blank for built-in DuckDuckGo/Wiki RAG"
                  style={{ borderRadius: KEY_SHAPES[2] }}
                  className="w-full matte-key px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none select-text"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wider">Temperature // {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full accent-sky-500 mt-2 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto">
              <div className="w-full mb-8 text-left border-l-2 border-sky-500/70 pl-4">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-sky-400/90 mb-1">
                  LOCAL RTX 4050 WORKSTATION // {webSearchEnabled ? 'LIVE WEB RAG ARMED' : 'OFFLINE ENGINE'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                  Sanskar's Personal AI Chatbots
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Toggle the <span className="text-sky-300 font-mono">WEB: ON/OFF</span> key below to give your local models real-time internet search access.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {QUICK_KEYS.map((item, idx) => (
                  <button
                    key={item.tag}
                    onClick={() => handleSend(item.prompt)}
                    style={{ borderRadius: KEY_SHAPES[idx % KEY_SHAPES.length] }}
                    className="matte-key p-4 text-left group flex flex-col justify-between min-h-[96px]"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 group-hover:text-sky-400 transition-colors">
                        {item.tag}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-sky-400 group-hover:shadow-[0_0_8px_#38bdf8] transition-all" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white">{item.title}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-5">
              {activeSession.messages.map((msg, index) => {
                if (msg.role === 'user') {
                  return (
                    <div key={index} className="flex justify-end">
                      <div
                        style={{ borderRadius: KEY_SHAPES[1] }}
                        className="max-w-[80%] matte-key matte-key-active px-4 py-3 text-zinc-100 text-sm leading-relaxed select-text"
                      >
                        <ReactMarkdown components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  );
                }

                if (msg.isArena) {
                  return (
                    <div key={index} className="space-y-2">
                      {msg.sources?.length > 0 && (
                        <div style={{ borderRadius: KEY_SHAPES[1] }} className="matte-key px-4 py-2.5">
                          <SourceBadges sources={msg.sources} />
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div style={{ borderRadius: KEY_SHAPES[0] }} className="matte-key px-4 py-3 text-zinc-200 flex flex-col select-text">
                          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80 text-[11px] font-mono">
                            <span className="text-sky-400">[ENGINE A] {msg.modelA}</span>
                            <div className="flex items-center gap-2">
                              {msg.statsA && <span className="text-zinc-400">{msg.statsA}</span>}
                              {msg.contentA && (
                                <button onClick={() => speakText(msg.contentA)} className="text-zinc-500 hover:text-sky-300">
                                  {speakingText === msg.contentA ? 'STOP' : 'SPEAK'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm leading-relaxed space-y-2 flex-1">
                            <ReactMarkdown components={{ code: CodeBlock }}>
                              {msg.contentA || (isSearchingWeb ? 'Scanning live web sources...' : 'Generating...')}
                            </ReactMarkdown>
                          </div>
                        </div>

                        <div style={{ borderRadius: KEY_SHAPES[2] }} className="matte-key px-4 py-3 text-zinc-200 flex flex-col select-text">
                          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80 text-[11px] font-mono">
                            <span className="text-sky-300">[ENGINE B] {msg.modelB}</span>
                            <div className="flex items-center gap-2">
                              {msg.statsB && <span className="text-zinc-400">{msg.statsB}</span>}
                              {msg.contentB && (
                                <button onClick={() => speakText(msg.contentB)} className="text-zinc-500 hover:text-sky-300">
                                  {speakingText === msg.contentB ? 'STOP' : 'SPEAK'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm leading-relaxed space-y-2 flex-1">
                            <ReactMarkdown components={{ code: CodeBlock }}>
                              {msg.contentB || (isSearchingWeb ? 'Scanning live web sources...' : 'Generating...')}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="flex justify-start">
                    <div
                      style={{ borderRadius: KEY_SHAPES[index % KEY_SHAPES.length] }}
                      className="max-w-[85%] matte-key px-4 py-3 text-zinc-200 select-text"
                    >
                      <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] font-mono text-zinc-400 border-b border-zinc-800/60 pb-1.5">
                        <span className="text-sky-400 uppercase">{msg.model || selectedModel}</span>
                        <div className="flex items-center gap-3">
                          {msg.stats && <span className="text-zinc-500">{msg.stats}</span>}
                          {msg.content && (
                            <button onClick={() => speakText(msg.content)} className="text-zinc-400 hover:text-sky-300">
                              {speakingText === msg.content ? 'STOP AUDIO' : 'LISTEN'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display Retrieved Web Sources if Web Search was used */}
                      <SourceBadges sources={msg.sources} />

                      <div className="text-sm leading-relaxed space-y-2">
                        <ReactMarkdown components={{ code: CodeBlock }}>
                          {msg.content || (isSearchingWeb ? 'SCANNING LIVE WEB SOURCES...' : 'Generating...')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-zinc-800/70 bg-[#090b0e]/85 backdrop-blur-md">
          <div className="max-w-5xl mx-auto space-y-2">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{ borderRadius: KEY_SHAPES[idx % KEY_SHAPES.length] }}
                    className="matte-key flex items-center gap-2 px-3 py-1 text-xs font-mono text-zinc-300"
                  >
                    <span>{file.name}</span>
                    <span className="text-zinc-500">({file.size})</span>
                    <button
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-zinc-400 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2.5 items-end">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.length) processFiles(e.target.files);
                  e.target.value = '';
                }}
                multiple
                accept=".py,.js,.jsx,.ts,.tsx,.cpp,.c,.h,.ino,.txt,.md,.json,.csv,.html,.css,.sql,.sh,.bat,.yaml,.yml,.xml,.log"
                className="hidden"
              />

              {/* File Attach Key */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                style={{ borderRadius: KEY_SHAPES[0] }}
                className="matte-key px-3.5 py-3 text-xs font-mono text-zinc-300 hover:text-sky-300 disabled:opacity-50"
              >
                + FILE
              </button>

              {/* NEW: Dedicated Asymmetric Matte Key to Toggle Web Search RAG */}
              <button
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                disabled={isStreaming}
                style={{ borderRadius: KEY_SHAPES[3] }}
                title="Toggle Live Web Search RAG for current affairs & live data"
                className={`matte-key px-3.5 py-3 text-xs font-mono transition ${
                  webSearchEnabled
                    ? 'matte-key-active text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.28)]'
                    : 'text-zinc-400 hover:text-sky-300'
                }`}
              >
                {webSearchEnabled ? '● WEB: ON' : 'WEB: OFF'}
              </button>

              {/* Voice Input Key */}
              <button
                onClick={toggleVoiceInput}
                disabled={isStreaming}
                style={{ borderRadius: KEY_SHAPES[2] }}
                className={`matte-key px-3.5 py-3 text-xs font-mono transition ${
                  isListening ? 'matte-key-active text-sky-300 animate-pulse' : 'text-zinc-300 hover:text-sky-300'
                }`}
              >
                {isListening ? '● REC' : 'MIC'}
              </button>

              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ borderRadius: KEY_SHAPES[1] }}
                placeholder={
                  webSearchEnabled
                    ? `Search live web + ask ${selectedModel}...`
                    : arenaMode
                    ? `Dispatch prompt to ${selectedModel} & ${secondModel}...`
                    : `Query ${selectedModel} (Sanskar's Personal AI)...`
                }
                className="flex-1 matte-key bg-[#0c0e12]/90 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none select-text"
                disabled={isStreaming}
              />

              {isStreaming ? (
                <button
                  onClick={stopGeneration}
                  style={{ borderRadius: KEY_SHAPES[3] }}
                  className="matte-key px-5 py-3 text-xs font-mono text-rose-400 hover:text-rose-300"
                >
                  ABORT
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  style={{ borderRadius: KEY_SHAPES[3] }}
                  className="matte-key matte-key-active px-6 py-3 text-xs font-mono tracking-wider uppercase text-sky-300 hover:text-white"
                >
                  {arenaMode ? 'COMPARE' : 'EXECUTE'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
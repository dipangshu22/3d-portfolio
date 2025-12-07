import React, { useEffect, useRef, useState } from "react";
import "./computer.css";

/* -------------------------
   Beep player (safe)
------------------------- */
function playBeep(ctx, freq = 660, dur = 120) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + dur / 1000);
}

/* -------------------------
   Boot Screen (unchanged-ish)
------------------------- */
function BootScreen({ onFinished }) {
  const [lines, setLines] = useState([]);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  const bios = [
    "AMI BIOS v2.14",
    "CPU: Intel(R) Core(TM) i7-9750H @ 2.60GHz",
    "RAM: 16384MB OK",
    "SATA: 1 devices detected",
    "POST: All systems nominal",
  ];

  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = AudioCtx ? new AudioCtx() : null;

    let idx = 0;
    const id = setInterval(() => {
      if (idx < bios.length) {
        setLines((p) => [...p, bios[idx]]);
        if (ctx) playBeep(ctx, 600 + idx * 100, 120);
        idx++;
      } else {
        clearInterval(id);
        setTimeout(() => setPhase(1), 400);
      }
    }, 550);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== 1) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = AudioCtx ? new AudioCtx() : null;

    let p = 0;
    const id = setInterval(() => {
      p += Math.floor(Math.random() * 8) + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setProgress(100);
        if (ctx) playBeep(ctx, 1000, 180);
        setTimeout(() => {
          setPhase(2);
          setTimeout(() => onFinished(), 900);
        }, 300);
      } else {
        setProgress(p);
        if (ctx) playBeep(ctx, 820, 70);
      }
    }, 140);

    return () => clearInterval(id);
  }, [phase, onFinished]);

  return (
    <div className="boot-screen">
      <div className="boot-card">
        <div className="boot-lines">
          {lines.map((l, i) => (
            <div key={i} className="boot-line">
              <span className="boot-tag">[POST]</span> {l}
            </div>
          ))}
        </div>

        {phase >= 1 && (
          <>
            <div className="boot-progress">
              <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="boot-status">Loading OS modules… {progress}%</div>
          </>
        )}

        {phase === 2 && <div className="boot-ready">> Welcome — launching desktop...</div>}
      </div>
    </div>
  );
}

/* -------------------------
   Draggable hook
------------------------- */
function useDraggable(ref, onFocus) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bar = el.querySelector(".window-title-bar");
    if (!bar) return;

    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    const onMove = (e) => {
      if (!dragging) return;
      el.style.left = e.clientX - offsetX + "px";
      el.style.top = e.clientY - offsetY + "px";
    };

    const onUp = () => {
      dragging = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      dragging = true;
      onFocus?.();
      const r = el.getBoundingClientRect();
      offsetX = e.clientX - r.left;
      offsetY = e.clientY - r.top;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    };

    bar.addEventListener("pointerdown", onDown);
    return () => {
      bar.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [ref, onFocus]);
}

/* -------------------------
   Terminal engine (simple)
------------------------- */
function runCommand(cmd, state) {
  const parts = cmd.trim().split(/\s+/);
  const main = parts[0]?.toLowerCase() || "";
  const arg = parts.slice(1).join(" ");

  const push = (s, msg) => {
    s.logs.push(msg);
  };

  switch (main) {
    case "":
      break;
    case "help":
      push(state, "Commands: help, ls, open <name>, rm <name>, restore <name>, emptybin, clear, echo <text>, date");
      break;
    case "ls":
      if (state.files.length === 0) push(state, "(no files)");
      state.files.forEach((f) => push(state, "- " + f.name));
      break;
    case "open":
      if (!arg) push(state, "open: missing target");
      else {
        const exists = state.files.some((f) => f.name === arg);
        push(state, exists ? `Opening ${arg} (simulated)` : `open: ${arg}: no such file`);
      }
      break;
    case "rm":
      if (!arg) push(state, "rm: missing file");
      else {
        const file = state.files.find((f) => f.name === arg);
        if (!file) push(state, `rm: ${arg}: no such file`);
        else {
          state.files = state.files.filter((f) => f.name !== arg);
          state.recycle.unshift({ ...file, deletedAt: Date.now() });
          push(state, `${arg} moved to recycle`);
        }
      }
      break;
    case "restore":
      if (!arg) push(state, "restore: missing file");
      else {
        const item = state.recycle.find((r) => r.name === arg);
        if (!item) push(state, `restore: ${arg}: not in recycle`);
        else {
          state.recycle = state.recycle.filter((r) => r.name !== arg);
          state.files.unshift(item);
          push(state, `Restored ${arg}`);
        }
      }
      break;
    case "emptybin":
      state.recycle = [];
      push(state, "Recycle bin emptied");
      break;
    case "clear":
      state.logs = [];
      break;
    case "echo":
      push(state, arg);
      break;
    case "date":
      push(state, new Date().toString());
      break;
    default:
      push(state, `Unknown command: ${main}`);
  }

  return state;
}

/* -------------------------
   Main Component
------------------------- */
export default function Computer() {
  const [booted, setBooted] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);

  // z-index management
  const [z, setZ] = useState(1000);
  const bringToFront = (ref) =>
    setZ((prev) => {
      const next = prev + 1;
      if (ref?.current) ref.current.style.zIndex = next;
      return next;
    });

  // windows state
  const [openWindows, setOpenWindows] = useState([]);
  const [minimized, setMinimized] = useState([]);
  const [maximized, setMaximized] = useState([]);

  // fake fs
  const [files, setFiles] = useState([
    { id: 1, name: "project1.zip", size: "4.2MB" },
    { id: 2, name: "design.sketch", size: "2.6MB" },
    { id: 3, name: "notes.txt", size: "8KB" },
  ]);
  const [recycle, setRecycle] = useState([]);

  // terminal state
  const [termLogs, setTermLogs] = useState(["> FakeOS Terminal ready — type 'help'"]);
  const [termInput, setTermInput] = useState("");

  // start menu + search
  const [startOpen, setStartOpen] = useState(false);
  const [startQuery, setStartQuery] = useState("");

  // fullscreen
  const [isFull, setIsFull] = useState(false);

  // refs
  const refs = {
    explorer: useRef(null),
    recycle: useRef(null),
    terminal: useRef(null),
  };

  // taskbar clock
  const [timeStr, setTimeStr] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // keyboard escape closes start menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setStartOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // draggable
  useDraggable(refs.explorer, () => bringToFront(refs.explorer));
  useDraggable(refs.recycle, () => bringToFront(refs.recycle));
  useDraggable(refs.terminal, () => bringToFront(refs.terminal));

  // open/close windows
  const openWindow = (name) => {
    if (!openWindows.includes(name)) setOpenWindows((p) => [...p, name]);
    setMinimized((m) => m.filter((x) => x !== name));
    bringToFront(refs[name]);
    setStartOpen(false);
  };
  const closeWindow = (name) => {
    setOpenWindows((p) => p.filter((x) => x !== name));
    setMinimized((m) => m.filter((x) => x !== name));
    setMaximized((m) => m.filter((x) => x !== name));
  };
  const minimizeWindow = (name) => {
    setMinimized((p) => [...p, name]);
  };
  const restoreFromTaskbar = (name) => {
    setMinimized((p) => p.filter((x) => x !== name));
    bringToFront(refs[name]);
  };
  const toggleMaximize = (name) => {
    const el = refs[name]?.current;
    if (!el) return;
    if (!maximized.includes(name)) {
      // save prev
      el.dataset.prevLeft = el.style.left || "";
      el.dataset.prevTop = el.style.top || "";
      el.dataset.prevWidth = el.style.width || "";
      el.dataset.prevHeight = el.style.height || "";
      el.classList.add("maxed");
      setMaximized((p) => [...p, name]);
    } else {
      el.classList.remove("maxed");
      el.style.left = el.dataset.prevLeft;
      el.style.top = el.dataset.prevTop;
      el.style.width = el.dataset.prevWidth;
      el.style.height = el.dataset.prevHeight;
      setMaximized((p) => p.filter((x) => x !== name));
    }
    bringToFront(refs[name]);
  };

  // file ops (exposed to UI)
  const deleteFile = (id) => {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    setFiles((p) => p.filter((x) => x.id !== id));
    setRecycle((p) => [{ ...f, deletedAt: Date.now() }, ...p]);
    setTermLogs((t) => [...t, `Deleted ${f.name}`]);
  };
  const restoreFile = (id) => {
    const item = recycle.find((x) => x.id === id);
    if (!item) return;
    setRecycle((p) => p.filter((x) => x.id !== id));
    setFiles((p) => [item, ...p]);
    setTermLogs((t) => [...t, `Restored ${item.name}`]);
  };
  const emptyBin = () => {
    setRecycle([]);
    setTermLogs((t) => [...t, "Recycle bin emptied"]);
  };

  // terminal run
  const runTerminal = (raw) => {
    if (!raw.trim()) return;
    const state = { logs: [...termLogs], files: [...files], recycle: [...recycle] };
    const newState = runCommand(raw, state);
    // adopt resulting FS and recycle from engine
    setFiles(newState.files);
    setRecycle(newState.recycle);
    setTermLogs(newState.logs);
  };

  // terminal input handler
  const onTermKey = (e) => {
    if (e.key === "Enter") {
      runTerminal(termInput);
      setTermInput("");
    }
  };

  // Boot finish
  const onBootFinished = () => {
    setBooted(true);
    setTimeout(() => setShowDesktop(true), 220);
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFull(true);
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }
    } else {
      await document.exitFullscreen();
      setIsFull(false);
    }
  };

  // Start menu apps list
  const apps = [
    { id: "explorer", title: "File Explorer", icon: "/icons/folder.png" },
    { id: "terminal", title: "Terminal", icon: "/icons/terminal.png" },
    { id: "recycle", title: "Recycle Bin", icon: "/icons/recycle.png" },
  ];
  const filtered = apps.filter((a) => a.title.toLowerCase().includes(startQuery.toLowerCase()));

  return (
    <div className={`desktop ${isFull ? "fullscreen" : ""}`}>
      {!showDesktop && !booted && <BootScreen onFinished={onBootFinished} />}
      {!showDesktop && booted && <div className="boot-fade" onAnimationEnd={() => setShowDesktop(true)} />}

      {showDesktop && (
        <>
          {/* Desktop icons */}
          <div className="desktop-icons">
            <div className="icon" onDoubleClick={() => openWindow("explorer")}>
              <img src="/icons/folder.png" alt="Explorer" />
              <span>File Explorer</span>
            </div>
            <div className="icon" onDoubleClick={() => openWindow("terminal")}>
              <img src="/icons/terminal.png" alt="Terminal" />
              <span>Terminal</span>
            </div>
            <div className="icon" onDoubleClick={() => openWindow("recycle")}>
              <img src="/icons/recycle.png" alt="Recycle" />
              <span>Recycle Bin</span>
            </div>
          </div>

          {/* Start menu */}
          <div className={`start-menu ${startOpen ? "open" : ""}`}>
            <div className="start-panel">
              <div className="start-search">
                <input
                  placeholder="Type to search apps..."
                  value={startQuery}
                  onChange={(e) => setStartQuery(e.target.value)}
                  autoFocus={startOpen}
                />
              </div>
              <div className="start-list">
                {filtered.map((a) => (
                  <div className="start-app-row" key={a.id} onClick={() => openWindow(a.id)}>
                    <img src={a.icon} alt={a.title} />
                    <div className="start-app-title">{a.title}</div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="start-empty">No apps found</div>}
              </div>
            </div>
          </div>

          {/* Taskbar (centered) */}
          <div className="taskbar">
            <div className="task-left">
              <button
                className="start-button"
                onClick={() => {
                  setStartOpen((s) => !s);
                  setStartQuery("");
                }}
                aria-label="Start"
              >
                ⊞
              </button>
            </div>

            <div className="task-center">
              {openWindows.map((w) => (
                <button
                  key={w}
                  className={`task-item ${minimized.includes(w) ? "min" : ""}`}
                  onClick={() => (minimized.includes(w) ? restoreFromTaskbar(w) : bringToFront(refs[w]))}
                >
                  {w}
                </button>
              ))}
            </div>

            <div className="task-right">
              <button className="icon-btn" title="Toggle fullscreen" onClick={toggleFullscreen}>
                {isFull ? "🡼" : "⤢"}
              </button>
              <div className="clock">{timeStr}</div>
            </div>
          </div>

          {/* Explorer Window */}
          {openWindows.includes("explorer") && !minimized.includes("explorer") && (
            <div
              className="window window-explorer"
              ref={refs.explorer}
              style={{ left: 180 + Math.random() * 30, top: 140 + Math.random() * 30 }}
              onMouseDown={() => bringToFront(refs.explorer)}
            >
              <div className="window-title-bar">
                <span>File Explorer</span>
                <div className="window-controls">
                  <button onClick={() => minimizeWindow("explorer")}>_</button>
                  <button onClick={() => toggleMaximize("explorer")}>▢</button>
                  <button onClick={() => closeWindow("explorer")}>×</button>
                </div>
              </div>

              <div className="window-body">
                <h3>My Files</h3>
                <div className="file-list">
                  {files.length === 0 && <div className="muted">No files — create or upload one.</div>}
                  {files.map((f) => (
                    <div className="file-row" key={f.id}>
                      <div className="file-meta">
                        <img src="/icons/file.png" alt="file" />
                        <div>
                          <div className="file-name">{f.name}</div>
                          <div className="file-size">{f.size}</div>
                        </div>
                      </div>
                      <div className="file-actions">
                        <button onClick={() => deleteFile(f.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recycle window */}
          {openWindows.includes("recycle") && !minimized.includes("recycle") && (
            <div
              className="window window-recycle"
              ref={refs.recycle}
              style={{ left: 260 + Math.random() * 20, top: 200 + Math.random() * 20 }}
              onMouseDown={() => bringToFront(refs.recycle)}
            >
              <div className="window-title-bar">
                <span>Recycle Bin</span>
                <div className="window-controls">
                  <button onClick={() => minimizeWindow("recycle")}>_</button>
                  <button onClick={() => toggleMaximize("recycle")}>▢</button>
                  <button onClick={() => closeWindow("recycle")}>×</button>
                </div>
              </div>

              <div className="window-body">
                <h3>Recycle Bin</h3>
                <div className="file-list">
                  {recycle.length === 0 && <div className="muted">Recycle bin is empty</div>}
                  {recycle.map((r) => (
                    <div className="file-row" key={r.id}>
                      <div className="file-meta">
                        <img src="/icons/file.png" alt="file" />
                        <div>
                          <div className="file-name">{r.name}</div>
                          <div className="file-size">Deleted: {new Date(r.deletedAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="file-actions">
                        <button onClick={() => restoreFile(r.id)}>Restore</button>
                        <button onClick={() => setRecycle((p) => p.filter((x) => x.id !== r.id))}>
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {recycle.length > 0 && (
                  <div className="recycle-controls">
                    <button onClick={emptyBin}>Empty Recycle Bin</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal window */}
          {openWindows.includes("terminal") && !minimized.includes("terminal") && (
            <div
              className="window window-terminal"
              ref={refs.terminal}
              style={{ left: 340 + Math.random() * 20, top: 220 + Math.random() * 20 }}
              onMouseDown={() => bringToFront(refs.terminal)}
            >
              <div className="window-title-bar">
                <span>OS Terminal</span>
                <div className="window-controls">
                  <button onClick={() => minimizeWindow("terminal")}>_</button>
                  <button onClick={() => toggleMaximize("terminal")}>▢</button>
                  <button onClick={() => closeWindow("terminal")}>×</button>
                </div>
              </div>

              <div className="window-body terminal-body">
                <div className="terminal-output">
                  {termLogs.map((l, i) => (
                    <div key={i} className="term-line">
                      {l}
                    </div>
                  ))}
                </div>

                <div className="terminal-input-row">
                  <span className="prompt">user@fakeos:~$</span>
                  <input
                    className="terminal-input"
                    value={termInput}
                    onChange={(e) => setTermInput(e.target.value)}
                    onKeyDown={onTermKey}
                    placeholder="Type a command and press Enter"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

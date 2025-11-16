import React, { useEffect, useRef, useState } from "react";
import "./computer.css";

/* =============================
   BIOS BEEP SOUND GENERATOR
============================= */
function playBeepSequence(ctx, sequence = [{ f: 800, d: 120 }]) {
  if (!ctx) return;
  let t = ctx.currentTime;
  sequence.forEach((s) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = s.f;
    o.type = s.type || "sine";
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + s.d / 1000 - 0.01);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + s.d / 1000);
    t += (s.d + (s.pause || 80)) / 1000;
  });
}

/* =============================
   BOOT SCREEN
============================= */
function BootScreen({ onFinished }) {
  const [phase, setPhase] = useState(0);
  const [typedLines, setTypedLines] = useState([]);
  const [progress, setProgress] = useState(0);

  const biosLines = [
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
    const typing = setInterval(() => {
      if (idx < biosLines.length) {
        setTypedLines((p) => [...p, biosLines[idx]]);
        if (ctx) {
          const freq = 600 + idx * 120;
          playBeepSequence(ctx, [{ f: freq, d: 140 }, { f: freq + 60, d: 100 }]);
        }
        idx++;
      } else {
        clearInterval(typing);
        setTimeout(() => setPhase(1), 450);
      }
    }, 600);
  }, []);

  useEffect(() => {
    if (phase === 1) {
      let p = 0;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = AudioCtx ? new AudioCtx() : null;

      const interval = setInterval(() => {
        p += Math.floor(Math.random() * 8) + 3;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setProgress(100);
          setPhase(2);
          if (ctx) playBeepSequence(ctx, [{ f: 1000, d: 200 }]);
          setTimeout(() => onFinished(), 1200);
        } else {
          setProgress(p);
          if (ctx) playBeepSequence(ctx, [{ f: 880 + Math.random() * 120, d: 60 }]);
        }
      }, 150);
    }
  }, [phase]);

  return (
    <div className="boot-screen">
      <div className="boot-center">
        <div className="bios-box">
          {typedLines.map((line, i) => (
            <div key={i} className="bios-line">
              <span className="bios-prompt">[POST]</span> {line}
            </div>
          ))}

          {phase >= 1 && (
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-label">Loading OS modules... {progress}%</div>
            </div>
          )}

          {phase === 2 && (
            <div className="terminal">
              <div>&gt; initializing services...</div>
              <div>&gt; mounting virtual fs...</div>
              <div>&gt; starting window manager...</div>
              <div>&gt; welcome! launching desktop...</div>
            </div>
          )}
        </div>
      </div>
      <div className="boot-footer">Press ESC for boot options (simulated)</div>
    </div>
  );
}

/* =============================
   DRAGGABLE WINDOWS HOOK
============================= */
function useDraggable(ref, onFocus) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const bar = el.querySelector(".window-title-bar");
    if (!bar) return;

    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    const pointerDown = (e) => {
      if (e.button !== 0) return;
      dragging = true;
      onFocus?.();

      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      document.addEventListener("pointermove", pointerMove);
      document.addEventListener("pointerup", pointerUp);
    };

    const pointerMove = (e) => {
      if (!dragging) return;
      el.style.left = e.clientX - offsetX + "px";
      el.style.top = e.clientY - offsetY + "px";
    };

    const pointerUp = () => {
      dragging = false;
      document.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("pointerup", pointerUp);
    };

    bar.addEventListener("pointerdown", pointerDown);

    return () => {
      bar.removeEventListener("pointerdown", pointerDown);
    };
  }, [ref]);
}

/* =============================
   MAIN OS DESKTOP
============================= */

export default function Computer() {
  const [booted, setBooted] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);

  /* Z-index for window focus */
  const [z, setZ] = useState(50);
  const bringToFront = (ref) => {
    setZ((p) => p + 1);
    if (ref?.current) ref.current.style.zIndex = z + 1;
  };

  /* Windows tracking */
  const [openWindows, setOpenWindows] = useState([]); 
  const [minimized, setMinimized] = useState([]);
  const [maximized, setMaximized] = useState([]);

  /* Fake FileSystem */
  const initialFiles = [
    { id: 1, name: "project1.zip", size: "4.2MB" },
    { id: 2, name: "design.sketch", size: "2.6MB" },
    { id: 3, name: "notes.txt", size: "8KB" },
  ];
  const [files, setFiles] = useState(initialFiles);
  const [recycle, setRecycle] = useState([]);

  /* Terminal state */
  const [terminalLogs, setTerminalLogs] = useState([
    "> FakeOS Terminal initialized",
    "> Type 'help' to list commands",
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  /* Start menu */
  const [startOpen, setStartOpen] = useState(false);

  /* Window refs */
  const refs = {
    explorer: useRef(null),
    recycle: useRef(null),
    terminal: useRef(null),
  };

  /* -------------------------------
        FILE OPERATIONS
  --------------------------------*/

  const deleteFile = (id) => {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    setFiles((p) => p.filter((x) => x.id !== id));
    setRecycle((p) => [{ ...f, deletedAt: Date.now() }, ...p]);
  };

  const restoreFile = (id) => {
    const item = recycle.find((x) => x.id === id);
    if (!item) return;
    setRecycle((p) => p.filter((x) => x.id !== id));
    setFiles((p) => [item, ...files]);
  };

  const emptyRecycle = () => setRecycle([]);

  /* -------------------------------
        WINDOW CONTROL
  --------------------------------*/

  const openWindow = (name) => {
    if (!openWindows.includes(name)) {
      setOpenWindows((p) => [...p, name]);
    }
    setMinimized((p) => p.filter((x) => x !== name));
    bringToFront(refs[name]);
    setStartOpen(false);
  };

  const closeWindow = (name) => {
    setOpenWindows((p) => p.filter((x) => x !== name));
    setMinimized((p) => p.filter((x) => x !== name));
    setMaximized((p) => p.filter((x) => x !== name));
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
      el.dataset.prevLeft = el.style.left;
      el.dataset.prevTop = el.style.top;
      el.dataset.prevWidth = el.style.width;
      el.dataset.prevHeight = el.style.height;

      el.classList.add("maximized");
      setMaximized((p) => [...p, name]);
    } else {
      el.classList.remove("maximized");
      el.style.left = el.dataset.prevLeft;
      el.style.top = el.dataset.prevTop;
      el.style.width = el.dataset.prevWidth;
      el.style.height = el.dataset.prevHeight;

      setMaximized((p) => p.filter((x) => x !== name));
    }
    bringToFront(refs[name]);
  };

  /* -------------------------------
        TERMINAL COMMAND ENGINE
  --------------------------------*/

  const runTerminalCommand = () => {
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalInput("");

    const parts = cmd.split(" ");
    const main = parts[0];
    const arg = parts[1];

    const log = (msg) =>
      setTerminalLogs((prev) => [...prev, `> ${msg}`]);

    switch (main) {
      case "help":
        log("Commands: ls, cd, open, rm, restore, emptybin, clear");
        break;

      case "ls":
        files.forEach((f) => log("- " + f.name));
        break;

      case "cd":
        if (!arg) log("cd: missing folder");
        else if (["explorer", "terminal", "recycle"].includes(arg)) {
          openWindow(arg);
          log("Opened " + arg);
        } else {
          const exists = files.some((f) => f.name === arg);
          log(exists ? "Accessing " + arg : "cd: no such file");
        }
        break;

      case "open":
        if (!arg) log("open: missing target");
        else openWindow(arg);
        break;

      case "rm":
        if (!arg) log("rm: missing file name");
        else {
          const file = files.find((f) => f.name === arg);
          if (!file) log("rm: no such file");
          else {
            deleteFile(file.id);
            log("Deleted " + arg);
          }
        }
        break;

      case "restore":
        if (!arg) log("restore: missing file");
        else {
          const item = recycle.find((f) => f.name === arg);
          if (!item) log("restore: not in recycle bin");
          else {
            restoreFile(item.id);
            log("Restored " + arg);
          }
        }
        break;

      case "emptybin":
        emptyRecycle();
        log("Recycle Bin emptied");
        break;

      case "clear":
        setTerminalLogs([]);
        break;

      default:
        log("Unknown command: " + main);
    }
  };

  /* -------------------------------
        BOOT FINISH
  --------------------------------*/

  const onBootFinished = () => {
    setBooted(true);
    setTimeout(() => setShowDesktop(true), 250);
  };

  /* -------------------------------
        DRAG ENABLED
  --------------------------------*/
  useDraggable(refs.explorer, () => bringToFront(refs.explorer));
  useDraggable(refs.recycle, () => bringToFront(refs.recycle));
  useDraggable(refs.terminal, () => bringToFront(refs.terminal));
  /* -------------------------------
        RENDER (finish component)
  --------------------------------*/
  return (
    <div className="desktop-screen">
      {!showDesktop && !booted && <BootScreen onFinished={onBootFinished} />}
      {!showDesktop && booted && (
        <div className="boot-fade" onAnimationEnd={() => setShowDesktop(true)} />
      )}

      {showDesktop && (
        <>
          {/* DESKTOP ICONS */}
          <div className="desktop-icons">
            <div className="icon" onDoubleClick={() => openWindow("explorer")} onClick={() => openWindow("explorer")}>
              <img src="/icons/folder.png" alt="Explorer" />
              <span>File Explorer</span>
            </div>

            <div className="icon" onDoubleClick={() => openWindow("recycle")} onClick={() => openWindow("recycle")}>
              <img src="/icons/recycle.png" alt="Recycle Bin" />
              <span>Recycle Bin</span>
            </div>

            <div className="icon" onDoubleClick={() => openWindow("terminal")} onClick={() => openWindow("terminal")}>
              <img src="/icons/terminal.png" alt="Terminal" />
              <span>Terminal</span>
            </div>
          </div>

          {/* TASKBAR */}
          <div className="taskbar">
            <div className="start-area">
              <button className="start-btn" onClick={() => setStartOpen((s) => !s)}>⊞</button>

              {startOpen && (
                <div className="start-menu">
                  <div className="start-app" onClick={() => openWindow("explorer")}>File Explorer</div>
                  <div className="start-app" onClick={() => openWindow("terminal")}>Terminal</div>
                  <div className="start-app" onClick={() => openWindow("recycle")}>Recycle Bin</div>
                  <div
                    className="start-app"
                    onClick={() => {
                      setShowDesktop(false);
                      setBooted(false);
                      setTimeout(() => {
                        setBooted(true);
                        setTimeout(() => setShowDesktop(true), 900);
                      }, 80);
                    }}
                  >
                    Restart (simulated)
                  </div>
                </div>
              )}
            </div>

            {/* taskbar middle area: show task tiles (open windows) */}
            <div className="taskbar-tiles">
              {openWindows.map((w) => (
                <button
                  key={w}
                  className={`task-tile ${minimized.includes(w) ? "minimized" : ""}`}
                  onClick={() => {
                    if (minimized.includes(w)) restoreFromTaskbar(w);
                    else {
                      bringToFront(refs[w]);
                    }
                  }}
                >
                  {w}
                </button>
              ))}
            </div>

            <div className="taskbar-time">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>

          {/* EXPLORER WINDOW */}
          {openWindows.includes("explorer") && !minimized.includes("explorer") && (
            <div
              className="window explorer"
              ref={refs.explorer}
              style={{ left: "220px", top: "140px", zIndex: 60 }}
              onMouseDown={() => bringToFront(refs.explorer)}
            >
              <div className="window-title-bar">
                <span>File Explorer</span>
                <div className="window-title-bar-buttons">
                  <button className="min-btn" onClick={() => minimizeWindow("explorer")}>_</button>
                  <button className="max-btn" onClick={() => toggleMaximize("explorer")}>▢</button>
                  <button className="close-btn" onClick={() => closeWindow("explorer")}>×</button>
                </div>
              </div>

              <div className="window-body">
                <h3>My Files</h3>
                <div className="file-list">
                  {files.length === 0 && <div className="muted">No files — create one to test.</div>}
                  {files.map((f) => (
                    <div key={f.id} className="file-row">
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

          {/* RECYCLE WINDOW */}
          {openWindows.includes("recycle") && !minimized.includes("recycle") && (
            <div
              className="window recycle"
              ref={refs.recycle}
              style={{ left: "300px", top: "180px", zIndex: 60 }}
              onMouseDown={() => bringToFront(refs.recycle)}
            >
              <div className="window-title-bar">
                <span>Recycle Bin</span>
                <div className="window-title-bar-buttons">
                  <button className="min-btn" onClick={() => minimizeWindow("recycle")}>_</button>
                  <button className="max-btn" onClick={() => toggleMaximize("recycle")}>▢</button>
                  <button className="close-btn" onClick={() => closeWindow("recycle")}>×</button>
                </div>
              </div>

              <div className="window-body">
                <h3>Recycle Bin</h3>
                <div className="file-list">
                  {recycle.length === 0 && <div className="muted">Recycle Bin empty</div>}
                  {recycle.map((r) => (
                    <div key={r.id} className="file-row">
                      <div className="file-meta">
                        <img src="/icons/file.png" alt="file" />
                        <div>
                          <div className="file-name">{r.name}</div>
                          <div className="file-size">Deleted: {new Date(r.deletedAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="file-actions">
                        <button onClick={() => restoreFile(r.id)}>Restore</button>
                        <button onClick={() => setRecycle((p) => p.filter((x) => x.id !== r.id))}>Delete Permanently</button>
                      </div>
                    </div>
                  ))}
                </div>

                {recycle.length > 0 && (
                  <div className="recycle-controls">
                    <button onClick={emptyRecycle}>Empty Recycle Bin</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TERMINAL WINDOW */}
          {openWindows.includes("terminal") && !minimized.includes("terminal") && (
            <div
              className="window terminal"
              ref={refs.terminal}
              style={{ left: "380px", top: "210px", zIndex: 60 }}
              onMouseDown={() => bringToFront(refs.terminal)}
            >
              <div className="window-title-bar">
                <span>OS Terminal</span>
                <div className="window-title-bar-buttons">
                  <button className="min-btn" onClick={() => minimizeWindow("terminal")}>_</button>
                  <button className="max-btn" onClick={() => toggleMaximize("terminal")}>▢</button>
                  <button className="close-btn" onClick={() => closeWindow("terminal")}>×</button>
                </div>
              </div>

              <div className="window-body terminal-body">
                <div className="terminal-logs">
                  {terminalLogs.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>

                <div className="terminal-input-row">
                  <span className="prompt">user@fakeos:~$</span>
                  <input
                    className="terminal-input"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") runTerminalCommand();
                      if (e.key === "ArrowUp") {
                        // simple history could be implemented — placeholder
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden ghost windows kept for DOM references if minimized */}
          {["explorer", "recycle", "terminal"].map((name) => {
            if (!openWindows.includes(name)) return null;
            return (
              <div
                key={"ghost-" + name}
                className={`window ghost ${minimized.includes(name) ? "hidden" : ""}`}
                ref={refs[name]}
                style={{ left: "-9999px", top: "-9999px", width: "520px", display: "none" }}
              />
            );
          })}
        </>
      )}
    </div>
  );
} // <-- end Computer()

let _blocked = false;

export function initDevToolsBlock() {
  if (typeof window === "undefined" || _blocked) return;
  _blocked = true;

  // 1. Disable right-click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Block keyboard shortcuts
  document.addEventListener(
    "keydown",
    (e) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+I / J / C / K (DevTools)
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["i", "j", "c", "k"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+U (View source)
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Cmd+Option+I / J / C (Mac DevTools)
      if (e.metaKey && e.altKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );

  // 3. Clear console periodically
  const clearConsole = () => {
    try {
      console.clear();
      Object.defineProperty(console, "_commandLineAPI", { get: () => { throw new Error(); } });
    } catch {}
  };
  clearConsole();
  setInterval(clearConsole, 2000);

  // 4. Detect DevTools via window size (docked devtools)
  const THRESHOLD = 160;
  let devToolsOpen = false;

  const checkDevTools = () => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const isOpen = widthDiff > THRESHOLD || heightDiff > THRESHOLD;

    if (isOpen && !devToolsOpen) {
      devToolsOpen = true;
      showBlockOverlay();
    } else if (!isOpen && devToolsOpen) {
      devToolsOpen = false;
      removeBlockOverlay();
    }
  };

  setInterval(checkDevTools, 1000);

  // 5. Detect DevTools via debugger timing trick
  const detectViaDebugger = () => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();
    if (end - start > 200) {
      showBlockOverlay();
    }
  };
  setInterval(detectViaDebugger, 5000);

  // 6. Disable drag on images
  document.addEventListener("dragstart", (e) => e.preventDefault());

  // 7. Override console methods to prevent API logging
  const noop = () => {};
  if (process.env.NODE_ENV === "production") {
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
    console.table = noop;
    console.dir = noop;
  }
}

function showBlockOverlay() {
  if (document.getElementById("__adhyayxp-guard")) return;

  const overlay = document.createElement("div");
  overlay.id = "__adhyayxp-guard";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: #0f0f13;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: system-ui, sans-serif;
    color: #fff;
    text-align: center;
    padding: 2rem;
  `;
  overlay.innerHTML = `
    <svg width="56" height="56" fill="none" viewBox="0 0 24 24" style="margin-bottom:1.5rem">
      <circle cx="12" cy="12" r="11" stroke="#4f46e5" stroke-width="2"/>
      <path stroke="#4f46e5" stroke-width="2" stroke-linecap="round" d="M12 7v6M12 17v.01"/>
    </svg>
    <h1 style="font-size:1.4rem;font-weight:700;margin:0 0 0.5rem">Access Restricted</h1>
    <p style="font-size:0.875rem;color:#9ca3af;max-width:320px;margin:0">
      Developer tools are not allowed on AdhyayX. Please close them to continue.
    </p>
  `;
  document.body.appendChild(overlay);
}

function removeBlockOverlay() {
  document.getElementById("__adhyayxp-guard")?.remove();
}

const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealItems.forEach((el) => observer.observe(el));

const desktopQuery = window.matchMedia("(min-width: 1025px)");
const windows = [...document.querySelectorAll("[data-window]")];
const minimizedDock = document.getElementById("minimizedDock");
const minimizedSeparator = document.getElementById("minimizedSeparator");
const trashFan = document.getElementById("trashFan");
const trashIcon = document.getElementById("trashIcon");
const dockWrap = document.querySelector(".dock-wrap");
const dockHotzone = document.getElementById("dockHotzone");
let dockAutohideEnabled = false;
let dockIsHovered = false;

let zCounter = 20;
const closedWindowIds = [];

const iconMap = {
  "win-profile": "assets/icnsFile_5ed44f019baf7491c2fe8b96f7560e53_Facetime.png",
  "win-skills": "assets/icnsFile_d08d04b5946a45faad63c1bbe50b9f58_Finder_Beta_2__Liquid_Glass_.png",
  "win-terminal": "assets/icnsFile_09d89754e68576d8fa29676c09abb7de_Terminal.png",
  "win-education": "assets/notes.png",
  "win-experience": "assets/notes.png",
  "win-extra": "assets/notes.png",
};

function isDesktopMode() {
  return desktopQuery.matches;
}

function updateDockAutohideMode() {
  if (!dockWrap) return;
  if (isDesktopMode()) {
    dockWrap.classList.add("desktop-autohide");
    dockWrap.classList.toggle("is-hidden", dockAutohideEnabled);
  } else {
    dockWrap.classList.remove("desktop-autohide", "is-hidden");
  }
}

function getWindowMeta(win) {
  return {
    id: win.id,
    title: win.querySelector(".window-title")?.textContent?.trim() || win.id,
  };
}

function bringToFront(win) {
  zCounter += 1;
  win.style.zIndex = String(zCounter);
}

function setWindowState(win, state) {
  win.classList.remove("is-minimized", "is-closed");
  if (state === "minimized") win.classList.add("is-minimized");
  if (state === "closed") win.classList.add("is-closed");
}

function ensureWindowVisible(win) {
  setWindowState(win, "open");
  win.classList.remove("is-fullscreen");
  bringToFront(win);
  renderMinimizedDock();
}

function renderMinimizedDock() {
  if (!minimizedDock) return;
  minimizedDock.innerHTML = "";
  const minimized = windows.filter((w) => w.classList.contains("is-minimized"));
  minimized.forEach((win) => {
    const meta = getWindowMeta(win);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dock-icon minimized-item";
    const img = document.createElement("img");
    img.className = "dock-img";
    img.src = iconMap[meta.id] || "assets/notes.png";
    img.alt = "";
    btn.appendChild(img);
    btn.dataset.label = meta.title;
    btn.setAttribute("aria-label", `Restore ${meta.title}`);
    btn.addEventListener("click", () => ensureWindowVisible(win));
    minimizedDock.appendChild(btn);
  });

  if (minimizedSeparator) {
    minimizedSeparator.classList.toggle("is-hidden", minimized.length === 0);
  }
}

function renderTrashFan() {
  if (!trashFan) return;
  trashFan.innerHTML = "";
  if (!closedWindowIds.length) {
    const empty = document.createElement("div");
    empty.className = "trash-empty";
    empty.textContent = "No closed windows";
    trashFan.appendChild(empty);
    if (trashIcon) {
      trashIcon.src = "assets/icnsFile_71b1db871959449369348edca76e90fc_trash-empty.png";
    }
    return;
  }

  if (trashIcon) {
    trashIcon.src = "assets/icnsFile_a54a7827078f7cfe1abdcf7a6b14f2e4_trash-full.png";
  }

  closedWindowIds.forEach((id) => {
    const win = document.getElementById(id);
    if (!win) return;
    const meta = getWindowMeta(win);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "trash-item";
    const itemIcon = document.createElement("img");
    itemIcon.src = iconMap[id] || "assets/notes.png";
    itemIcon.alt = "";
    btn.appendChild(itemIcon);
    btn.appendChild(document.createTextNode(meta.title));
    btn.addEventListener("click", () => {
      const index = closedWindowIds.indexOf(id);
      if (index >= 0) closedWindowIds.splice(index, 1);
      ensureWindowVisible(win);
      renderTrashFan();
    });
    trashFan.appendChild(btn);
  });
}

function minimizeWindow(win) {
  if (!isDesktopMode()) return;
  win.classList.remove("is-fullscreen");
  setWindowState(win, "minimized");
  renderMinimizedDock();
}

function closeWindow(win) {
  if (!isDesktopMode()) return;
  win.classList.remove("is-fullscreen");
  setWindowState(win, "closed");
  if (!closedWindowIds.includes(win.id)) closedWindowIds.unshift(win.id);
  renderMinimizedDock();
  renderTrashFan();
}

function toggleFullscreen(win) {
  if (!isDesktopMode()) return;
  const fullscreen = win.classList.toggle("is-fullscreen");
  if (fullscreen) bringToFront(win);
}

windows.forEach((win) => {
  win.addEventListener("mousedown", () => bringToFront(win));

  const closeBtn = win.querySelector(".close-btn");
  const minBtn = win.querySelector(".min-btn");
  const maxBtn = win.querySelector(".max-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      closeWindow(win);
    });
  }

  if (minBtn) {
    minBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      minimizeWindow(win);
    });
  }

  if (maxBtn) {
    maxBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFullscreen(win);
    });
  }
});

function enableDesktopDragging() {
  windows.forEach((win) => {
    const handle = win.querySelector("[data-drag-handle]");
    if (!handle) return;

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (event) => {
      if (!dragging) return;
      win.style.left = `${event.clientX - offsetX}px`;
      win.style.top = `${event.clientY - offsetY}px`;
      win.style.right = "auto";
      win.style.bottom = "auto";
      win.style.transform = "none";
    };

    const onUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    handle.addEventListener("mousedown", (event) => {
      if (!isDesktopMode()) return;
      if (win.classList.contains("is-fullscreen")) return;
      if (event.target.closest("button, a")) return;
      const rect = win.getBoundingClientRect();
      dragging = true;
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      bringToFront(win);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  });
}

enableDesktopDragging();
renderMinimizedDock();
renderTrashFan();

const finderTree = document.getElementById("finderTree");
if (finderTree) {
  finderTree.addEventListener("click", (event) => {
    const row = event.target.closest(".finder-row");
    if (!row) return;
    const folder = row.closest("[data-folder]");
    const isCollapsed = folder.classList.toggle("collapsed");
    row.setAttribute("aria-expanded", String(!isCollapsed));
    const arrow = row.querySelector(".finder-arrow");
    if (arrow) arrow.textContent = isCollapsed ? "▸" : "▾";
  });
}

const scene = document.getElementById("scene");
const cityFadeLayer = document.getElementById("cityFadeLayer");
const speechBubble = document.getElementById("speechBubble");
const avatarTap = document.getElementById("avatarTap");
const sjcLocation = document.getElementById("sjcLocation");
const lgaLocation = document.getElementById("lgaLocation");
const bosLocation = document.getElementById("bosLocation");
const cmhLocation = document.getElementById("cmhLocation");
const cleLocation = document.getElementById("cleLocation");

const locations = ["sjc", "lga", "bos", "cmh", "cle"];
let locationIndex = 0;
const cityBackgrounds = {
  sjc: "assets/SJC_BG.png",
  lga: "assets/LGA_BG.png",
  bos: "assets/BOS_BG.png",
  cmh: "assets/CMH_BG.png",
  cle: "assets/CLE_BG.png",
};
const reduceMotionPref = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let cityFadeToken = 0;

function refreshLocationUI({ animateBg = false } = {}) {
  const current = locations[locationIndex];
  sjcLocation.style.fontWeight = current === "sjc" ? "700" : "400";
  lgaLocation.style.fontWeight = current === "lga" ? "700" : "400";
  bosLocation.style.fontWeight = current === "bos" ? "700" : "400";
  cmhLocation.style.fontWeight = current === "cmh" ? "700" : "400";
  cleLocation.style.fontWeight = current === "cle" ? "700" : "400";
  const label = current.toUpperCase();
  speechBubble.textContent = `hello ${label}!`;
  if (scene) {
    const bg = cityBackgrounds[current];
    if (bg && cityFadeLayer && animateBg && !reduceMotionPref) {
      cityFadeToken += 1;
      const token = cityFadeToken;
      cityFadeLayer.classList.remove("active");
      cityFadeLayer.style.backgroundImage = `url("${bg}")`;
      requestAnimationFrame(() => {
        if (token !== cityFadeToken) return;
        cityFadeLayer.classList.add("active");
      });
      cityFadeLayer.addEventListener(
        "transitionend",
        () => {
          if (token !== cityFadeToken) return;
          scene.style.setProperty("--city-bg", `url("${bg}")`);
          cityFadeLayer.classList.remove("active");
        },
        { once: true }
      );
    } else if (bg) {
      scene.style.setProperty("--city-bg", `url("${bg}")`);
      if (cityFadeLayer) cityFadeLayer.classList.remove("active");
    } else {
      scene.style.removeProperty("--city-bg");
      if (cityFadeLayer) cityFadeLayer.classList.remove("active");
    }
  }
}

function cycleLocation() {
  locationIndex = (locationIndex + 1) % locations.length;
  refreshLocationUI({ animateBg: true });
}

if (avatarTap) {
  avatarTap.addEventListener("click", cycleLocation);
  avatarTap.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      cycleLocation();
    }
  });
}

const pupilL = document.getElementById("pupilL");
const pupilR = document.getElementById("pupilR");
const eyes = document.querySelectorAll(".avatar-eye");
const terminalOutput = document.getElementById("terminalOutput");
const terminalInput = document.getElementById("terminalInput");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

if (!reduceMotion && finePointer && pupilL && pupilR && eyes.length === 2) {
  let pendingEyeMove = null;
  let eyeFrame = 0;

  const renderEyes = () => {
    eyeFrame = 0;
    if (!pendingEyeMove) return;

    const { x: mouseX, y: mouseY } = pendingEyeMove;
    eyes.forEach((eye, index) => {
      const rect = eye.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const radius = Math.min(4, distance);
      const x = (dx / distance) * radius;
      const y = (dy / distance) * radius;
      const pupil = index === 0 ? pupilL : pupilR;
      pupil.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    });
  };

  document.addEventListener("mousemove", (event) => {
    pendingEyeMove = { x: event.clientX, y: event.clientY };
    if (!eyeFrame) {
      eyeFrame = requestAnimationFrame(renderEyes);
    }
  });
}

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

if (terminalOutput && terminalInput) {
  const updateTerminalInputWidth = () => {
    const len = terminalInput.value.length;
    terminalInput.style.width = `${Math.max(1, len + 0.45)}ch`;
  };

  const createCommandLine = (value) => {
    const line = document.createElement("div");
    line.className = "terminal-command";
    const sigil = document.createElement("span");
    sigil.className = "terminal-prompt";
    sigil.textContent = "$";
    const text = document.createElement("span");
    text.textContent = value;
    line.appendChild(sigil);
    line.appendChild(text);
    return line;
  };

  const submitTerminalCommand = () => {
    const value = terminalInput.value.trim();
    if (!value) return;

    const cmdLine = createCommandLine(value);
    terminalOutput.appendChild(cmdLine);

    const errLine = document.createElement("p");
    errLine.className = "terminal-error";
    errLine.textContent = "Error: Out of GPT tokens :(";
    terminalOutput.appendChild(errLine);

    terminalInput.value = "";
    updateTerminalInputWidth();
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  };

  terminalInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitTerminalCommand();
    }
  });

  terminalInput.addEventListener("input", updateTerminalInputWidth);
  updateTerminalInputWidth();

  const terminalWindow = document.getElementById("win-terminal");
  if (terminalWindow) {
    terminalWindow.addEventListener("mousedown", () => terminalInput.focus());
  }
}

if (dockWrap) {
  let pendingDockY = null;
  let dockFrame = 0;

  const renderDock = () => {
    dockFrame = 0;
    if (!isDesktopMode() || !dockAutohideEnabled || pendingDockY === null) return;
    const nearBottom = pendingDockY >= window.innerHeight - 18;
    if (nearBottom || dockIsHovered) {
      dockWrap.classList.remove("is-hidden");
    } else {
      dockWrap.classList.add("is-hidden");
    }
  };

  document.addEventListener("mousemove", (event) => {
    pendingDockY = event.clientY;
    if (!dockFrame) {
      dockFrame = requestAnimationFrame(renderDock);
    }
  });

  dockWrap.addEventListener("mouseenter", () => {
    dockIsHovered = true;
    dockWrap.classList.remove("is-hidden");
  });

  dockWrap.addEventListener("mouseleave", () => {
    dockIsHovered = false;
    if (!isDesktopMode() || !dockAutohideEnabled) return;
    dockWrap.classList.add("is-hidden");
  });
}

if (dockHotzone) {
  dockHotzone.addEventListener("mouseenter", () => {
    if (!dockWrap || !isDesktopMode() || !dockAutohideEnabled) return;
    dockWrap.classList.remove("is-hidden");
  });
}

desktopQuery.addEventListener("change", updateDockAutohideMode);
window.addEventListener("resize", updateDockAutohideMode);

updateDockAutohideMode();
setTimeout(() => {
  dockAutohideEnabled = true;
  updateDockAutohideMode();
}, 5000);
refreshLocationUI();

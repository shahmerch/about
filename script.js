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
  "win-music": "assets/icnsFile_8c7d1eada399566dea1d36c7396d8550_Music.png",
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
  if (win.id === "win-music" && musicAudio) {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    if (musicSeek) musicSeek.value = "0";
    if (musicCurrent) musicCurrent.textContent = "0:00";
    updatePlayButton();
  }
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

function randomizeWindowPositions() {
  if (!isDesktopMode()) return;

  const margin = 22;
  const topPad = 54;
  const bottomPad = 140; // preserve dock space
  const spacing = 34;
  const trialsPerWindow = 140;
  const placeable = windows.filter(
    (win) =>
      !win.classList.contains("is-minimized") &&
      !win.classList.contains("is-closed") &&
      !win.classList.contains("is-fullscreen")
  );

  // Random order gives variety between refreshes while still keeping windows separated.
  const order = [...placeable].sort(() => Math.random() - 0.5);
  const placed = [];

  const overlapsWithPadding = (a, b, pad = spacing) => {
    return !(
      a.left + a.width + pad <= b.left ||
      b.left + b.width + pad <= a.left ||
      a.top + a.height + pad <= b.top ||
      b.top + b.height + pad <= a.top
    );
  };

  const centerDistance = (a, b) => {
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    return Math.hypot(ax - bx, ay - by);
  };

  order.forEach((win, index) => {
    const width = win.offsetWidth;
    const height = win.offsetHeight;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(topPad, window.innerHeight - height - bottomPad);

    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i < trialsPerWindow; i += 1) {
      // Seed one candidate near viewport center for first window to reduce edge clumping.
      const left =
        i === 0 && index === 0
          ? Math.floor((window.innerWidth - width) / 2)
          : Math.floor(margin + Math.random() * Math.max(1, maxLeft - margin));
      const top =
        i === 0 && index === 0
          ? Math.floor(topPad + (window.innerHeight - topPad - bottomPad - height) * 0.35)
          : Math.floor(topPad + Math.random() * Math.max(1, maxTop - topPad));

      const candidate = { left, top, width, height };
      const hasOverlap = placed.some((p) => overlapsWithPadding(candidate, p));

      // Prefer candidates far from existing windows, heavily penalize overlap.
      const minDistance = placed.length
        ? Math.min(...placed.map((p) => centerDistance(candidate, p)))
        : 9999;
      const score = minDistance - (hasOverlap ? 10000 : 0);

      if (!hasOverlap) {
        best = candidate;
        break;
      }

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (!best) return;

    win.style.left = `${best.left}px`;
    win.style.top = `${best.top}px`;
    win.style.right = "auto";
    win.style.bottom = "auto";
    win.style.transform = "none";
    placed.push(best);
  });

  const profileWindow = document.getElementById("win-profile");
  if (profileWindow) {
    bringToFront(profileWindow);
  }
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

const musicWindow = document.getElementById("win-music");
const musicAudio = document.getElementById("musicAudio");
const musicPlayBtn = document.getElementById("musicPlay");
const musicPrevBtn = document.getElementById("musicPrev");
const musicNextBtn = document.getElementById("musicNext");
const musicShuffleBtn = document.getElementById("musicShuffle");
const musicSeek = document.getElementById("musicSeek");
const musicVolume = document.getElementById("musicVolume");
const musicCurrent = document.getElementById("musicCurrent");
const musicDuration = document.getElementById("musicDuration");
const musicTitle = document.getElementById("musicTitle");
const musicArtist = document.getElementById("musicArtist");
const musicPlaylist = [
  { src: "assets/01 - Opening Movie.mp3" },
  { src: "assets/03 - Title Screen.mp3" },
  { src: "assets/04 - Introductions.mp3" },
  { src: "assets/05 - Littleroot Town.mp3" },
  { src: "assets/06 - Birch Pokémon Lab.mp3" },
  { src: "assets/11 - Route 101.mp3" },
  { src: "assets/12 - Oldale Town.mp3" },
  { src: "assets/13 - Pokémon Center.mp3" },
];
const musicMetadataCache = new Map();
let currentTrackIndex = 0;
let isShuffleMode = false;

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function updatePlayButton() {
  if (!musicAudio || !musicPlayBtn) return;
  musicPlayBtn.textContent = musicAudio.paused ? "▶" : "❚❚";
}

function getFallbackTrackMeta(src) {
  const name = decodeURIComponent(src.split("/").pop() || "")
    .replace(/\.mp3$/i, "")
    .replace(/^\d+\s*-\s*/, "")
    .trim();
  return {
    title: name || "Unknown Title",
    artist: "Unknown Artist",
  };
}

function parseSynchsafeInteger(bytes) {
  if (!bytes || bytes.length < 4) return 0;
  return ((bytes[0] & 0x7f) << 21)
    | ((bytes[1] & 0x7f) << 14)
    | ((bytes[2] & 0x7f) << 7)
    | (bytes[3] & 0x7f);
}

function decodeId3Text(buffer) {
  if (!buffer || !buffer.length) return "";
  const encoding = buffer[0];
  const payload = buffer.slice(1);

  try {
    if (encoding === 0) {
      return new TextDecoder("latin1").decode(payload).replace(/\0/g, "").trim();
    }
    if (encoding === 1) {
      if (payload.length >= 2) {
        if (payload[0] === 0xff && payload[1] === 0xfe) {
          return new TextDecoder("utf-16le").decode(payload.slice(2)).replace(/\0/g, "").trim();
        }
        if (payload[0] === 0xfe && payload[1] === 0xff) {
          return new TextDecoder("utf-16be").decode(payload.slice(2)).replace(/\0/g, "").trim();
        }
      }
      return new TextDecoder("utf-16le").decode(payload).replace(/\0/g, "").trim();
    }
    if (encoding === 2) {
      return new TextDecoder("utf-16be").decode(payload).replace(/\0/g, "").trim();
    }
    return new TextDecoder("utf-8").decode(payload).replace(/\0/g, "").trim();
  } catch {
    return "";
  }
}

function extractId3Metadata(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 10) return null;
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2]) !== "ID3") return null;

  const version = bytes[3];
  const tagSize = parseSynchsafeInteger(bytes.slice(6, 10));
  const end = Math.min(bytes.length, 10 + tagSize);

  let offset = 10;
  let title = "";
  let artist = "";

  while (offset + 10 <= end) {
    const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (!frameId.trim() || /\0/.test(frameId)) break;

    let frameSize;
    if (version === 4) {
      frameSize = parseSynchsafeInteger(bytes.slice(offset + 4, offset + 8));
    } else {
      frameSize = ((bytes[offset + 4] << 24) >>> 0)
        + (bytes[offset + 5] << 16)
        + (bytes[offset + 6] << 8)
        + bytes[offset + 7];
    }

    if (!frameSize || frameSize < 0) break;
    const dataStart = offset + 10;
    const dataEnd = dataStart + frameSize;
    if (dataEnd > end) break;

    if (frameId === "TIT2" || frameId === "TPE1") {
      const decoded = decodeId3Text(bytes.slice(dataStart, dataEnd));
      if (frameId === "TIT2" && decoded && !title) title = decoded;
      if (frameId === "TPE1" && decoded && !artist) artist = decoded;
    }

    if (title && artist) break;
    offset = dataEnd;
  }

  if (!title && !artist) return null;
  return { title, artist };
}

async function readTrackMetadata(src) {
  if (musicMetadataCache.has(src)) return musicMetadataCache.get(src);
  const fallback = getFallbackTrackMeta(src);

  try {
    const response = await fetch(src, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Failed to load ${src}`);
    const buffer = await response.arrayBuffer();
    const parsed = extractId3Metadata(buffer) || {};
    const meta = {
      title: parsed.title || fallback.title,
      artist: parsed.artist || fallback.artist,
    };
    musicMetadataCache.set(src, meta);
    return meta;
  } catch {
    musicMetadataCache.set(src, fallback);
    return fallback;
  }
}

function setNowPlaying(src, metadata) {
  const fallback = getFallbackTrackMeta(src);
  if (musicTitle) {
    musicTitle.textContent = (metadata && metadata.title) || fallback.title;
  }
  if (musicArtist) {
    musicArtist.textContent = (metadata && metadata.artist) || fallback.artist;
  }
}

function loadTrack(index, { autoplay = false } = {}) {
  if (!musicAudio || !musicPlaylist.length) return;
  const total = musicPlaylist.length;
  currentTrackIndex = ((index % total) + total) % total;
  const track = musicPlaylist[currentTrackIndex];
  if (!track) return;

  setNowPlaying(track.src, null);
  musicAudio.src = track.src;
  musicAudio.load();
  if (musicSeek) musicSeek.value = "0";
  if (musicCurrent) musicCurrent.textContent = "0:00";
  if (musicDuration) musicDuration.textContent = "0:00";

  readTrackMetadata(track.src).then((meta) => {
    if (!musicAudio || musicAudio.src !== new URL(track.src, window.location.href).href) return;
    setNowPlaying(track.src, meta);
  });

  if (autoplay) {
    musicAudio.play().catch(() => {});
  } else {
    updatePlayButton();
  }
}

function getNextTrackIndex() {
  if (isShuffleMode && musicPlaylist.length > 1) {
    let nextIndex = currentTrackIndex;
    while (nextIndex === currentTrackIndex) {
      nextIndex = Math.floor(Math.random() * musicPlaylist.length);
    }
    return nextIndex;
  }
  return currentTrackIndex + 1;
}

if (musicAudio && musicSeek && musicVolume) {
  musicVolume.value = "75";
  musicAudio.volume = 0.75;

  musicAudio.addEventListener("loadedmetadata", () => {
    if (musicDuration) musicDuration.textContent = formatTime(musicAudio.duration);
  });

  musicAudio.addEventListener("timeupdate", () => {
    const duration = Number.isFinite(musicAudio.duration) && musicAudio.duration > 0 ? musicAudio.duration : 0;
    const current = musicAudio.currentTime || 0;
    if (musicCurrent) musicCurrent.textContent = formatTime(current);
    if (duration > 0) {
      musicSeek.value = String(Math.round((current / duration) * 100));
      if (musicDuration) musicDuration.textContent = formatTime(duration);
    } else {
      musicSeek.value = "0";
    }
  });

  musicAudio.addEventListener("play", updatePlayButton);
  musicAudio.addEventListener("pause", updatePlayButton);
  musicAudio.addEventListener("ended", () => {
    loadTrack(getNextTrackIndex(), { autoplay: true });
  });

  if (musicPlayBtn) {
    musicPlayBtn.addEventListener("click", () => {
      if (musicAudio.paused) {
        musicAudio.play().catch(() => {});
      } else {
        musicAudio.pause();
      }
    });
  }

  if (musicPrevBtn) {
    musicPrevBtn.addEventListener("click", () => {
      const shouldPlay = !musicAudio.paused;
      loadTrack(currentTrackIndex - 1, { autoplay: shouldPlay });
    });
  }

  if (musicNextBtn) {
    musicNextBtn.addEventListener("click", () => {
      const shouldPlay = !musicAudio.paused;
      loadTrack(getNextTrackIndex(), { autoplay: shouldPlay });
    });
  }

  if (musicShuffleBtn) {
    musicShuffleBtn.addEventListener("click", () => {
      isShuffleMode = !isShuffleMode;
      musicShuffleBtn.classList.toggle("is-active", isShuffleMode);
      musicShuffleBtn.setAttribute("aria-pressed", String(isShuffleMode));
    });
  }

  musicSeek.addEventListener("input", () => {
    const duration = Number.isFinite(musicAudio.duration) && musicAudio.duration > 0 ? musicAudio.duration : 0;
    if (!duration) return;
    musicAudio.currentTime = (Number(musicSeek.value) / 100) * duration;
  });

  musicVolume.addEventListener("input", () => {
    musicAudio.volume = Number(musicVolume.value) / 100;
  });

  loadTrack(0);
  updatePlayButton();
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
desktopQuery.addEventListener("change", () => {
  if (isDesktopMode()) {
    randomizeWindowPositions();
  }
});
window.addEventListener("resize", updateDockAutohideMode);

updateDockAutohideMode();
setTimeout(() => {
  dockAutohideEnabled = true;
  updateDockAutohideMode();
}, 5000);
randomizeWindowPositions();
refreshLocationUI();

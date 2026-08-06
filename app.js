(() => {
  "use strict";

  const data = window.BOOK_DATA;
  const STORAGE_KEY = "el-ciclo-inmovil-audioweb-v1";
  const AUDIO_CACHE = "el-ciclo-inmovil-audio-v1";
  const $ = (id) => document.getElementById(id);

  const HOUSES = ["fulgur", "gelida", "assum"];
  const HOUSE_COLORS = { fulgur: "#050608", gelida: "#edf4f7", assum: "#140806" };

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 5.2v13.6L19.5 12z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 5h3.2v14H7.2z"/><path d="M13.6 5h3.2v14h-3.2z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.3v5.4h3.3L12 18.9V5.1L7.3 9.3z"/><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M14.8 9.3a3.9 3.9 0 0 1 0 5.4"/><path d="M17.3 6.9a7.3 7.3 0 0 1 0 10.2"/></g></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.3v5.4h3.3L12 18.9V5.1L7.3 9.3z"/><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m15.2 9.6 4.8 4.8"/><path d="m20 9.6-4.8 4.8"/></g></svg>'
  };

  const elements = {
    audio: $("audio"), chapterList: $("chapterList"), galleryGrid: $("galleryGrid"), filterRow: $("filterRow"),
    playButton: $("playButton"), previousButton: $("previousButton"), nextButton: $("nextButton"),
    backButton: $("backButton"), forwardButton: $("forwardButton"), timeline: $("timeline"),
    currentTime: $("currentTime"), duration: $("duration"), speedSelect: $("speedSelect"), muteButton: $("muteButton"),
    playerChapter: $("playerChapter"), playerTitle: $("playerTitle"), nowTitle: $("nowTitle"), nowPart: $("nowPart"),
    elapsedSummary: $("elapsedSummary"), durationSummary: $("durationSummary"), cardProgress: $("cardProgress"),
    overallProgress: $("overallProgress"), overallPercent: $("overallPercent"), resumeButton: $("resumeButton"),
    spoilerToggle: $("spoilerToggle"), offlineButton: $("offlineButton"), offlineNote: $("offlineNote"),
    themeButton: $("themeButton"), menuButton: $("menuButton"), mobileMenu: $("mobileMenu"), mobileClose: $("mobileClose"),
    lightbox: $("lightbox"), lightboxImage: $("lightboxImage"), lightboxTitle: $("lightboxTitle"),
    lightboxCategory: $("lightboxCategory"), lightboxCaption: $("lightboxCaption"), lightboxClose: $("lightboxClose"),
    toast: $("toast"), worldMapImage: $("worldMapImage"), worldMapSmall: $("worldMapSmall")
  };

  const defaultState = {
    currentIndex: 0,
    times: {},
    durations: {},
    completed: {},
    unavailable: {},
    speed: 1,
    theme: "dark",
    spoilerProtection: data.site.enableSpoilerMode !== false,
    activeFilter: "Todos"
  };

  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = { ...defaultState, ...(saved || {}) };
  state.times ||= {};
  state.durations ||= {};
  state.completed ||= {};
  state.unavailable ||= {};

  let selectedIndex = clamp(Number(state.currentIndex) || 0, 0, data.chapters.length - 1);
  let pendingAutoplay = false;
  let toastTimer;
  let lastSavedSecond = -1;
  let lastUnlockSignature = "";
  const expandedParts = new Set();

  expandedParts.add(data.chapters[selectedIndex]?.part || "");
  initContent();
  applyTheme("dark");
  applyHouse(state.house || "fulgur");
  document.querySelectorAll(".house-switcher button").forEach(btn =>
    btn.addEventListener("click", () => applyHouse(btn.dataset.house, true))
  );
  elements.speedSelect.value = String(state.speed || 1);
  elements.spoilerToggle.checked = state.spoilerProtection;
  renderFilters();
  renderChapters();
  renderGallery();
  selectChapter(selectedIndex, false, true);
  bindEvents();
  updateOverallProgress();
  registerServiceWorker();

  function initContent() {
    $("brandSaga").textContent = data.site.saga;
    $("partName").textContent = data.site.part;
    $("bookName").textContent = data.site.book;
    $("siteDescription").textContent = data.site.description;
    const authorEl = $("authorName");
    if (authorEl) authorEl.textContent = data.site.author;
    $("chapterCount").textContent = data.chapters.length;
    $("coverImage").src = data.site.cover;
    $("nowCover").src = data.site.cover;
    $("playerCover").src = data.site.cover;
    $("footerBook").textContent = data.site.book;
    $("year").textContent = new Date().getFullYear();
    document.title = `${data.site.saga} — Audiolibro`;
  }

  function bindEvents() {
    elements.playButton.addEventListener("click", togglePlay);
    elements.resumeButton.addEventListener("click", () => {
      selectChapter(selectedIndex, true);
      document.querySelector("#escuchar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.previousButton.addEventListener("click", () => selectChapter(selectedIndex - 1, true));
    elements.nextButton.addEventListener("click", () => selectChapter(selectedIndex + 1, true));
    elements.backButton.addEventListener("click", () => seekBy(-10));
    elements.forwardButton.addEventListener("click", () => seekBy(10));
    elements.timeline.addEventListener("input", () => {
      if (!Number.isFinite(elements.audio.duration)) return;
      elements.audio.currentTime = (Number(elements.timeline.value) / 100) * elements.audio.duration;
    });
    elements.speedSelect.addEventListener("change", () => {
      state.speed = Number(elements.speedSelect.value);
      elements.audio.playbackRate = state.speed;
      saveState();
      showToast(`Velocidad: ${state.speed}×`);
    });
    elements.muteButton.addEventListener("click", () => {
      elements.audio.muted = !elements.audio.muted;
      elements.muteButton.innerHTML = elements.audio.muted ? ICONS.muted : ICONS.volume;
    });
    elements.spoilerToggle.addEventListener("change", () => {
      state.spoilerProtection = elements.spoilerToggle.checked;
      saveState();
      renderGallery();
    });
    elements.themeButton?.addEventListener("click", () => applyTheme(document.body.classList.contains("light") ? "dark" : "light", true));
    elements.menuButton.addEventListener("click", openMenu);
    elements.mobileClose.addEventListener("click", closeMenu);
    elements.mobileMenu.addEventListener("click", (event) => { if (event.target.tagName === "A") closeMenu(); });
    elements.lightboxClose.addEventListener("click", () => elements.lightbox.close());
    elements.lightbox.addEventListener("click", (event) => { if (event.target === elements.lightbox) elements.lightbox.close(); });
    elements.offlineButton.addEventListener("click", saveCurrentAudioOffline);
    document.querySelectorAll(".atlas-toggle").forEach(button =>
      button.addEventListener("click", () => applyMapView(button.dataset.mapView))
    );

    elements.audio.addEventListener("loadedmetadata", onLoadedMetadata);
    elements.audio.addEventListener("timeupdate", onTimeUpdate);
    elements.audio.addEventListener("play", updatePlayState);
    elements.audio.addEventListener("pause", updatePlayState);
    elements.audio.addEventListener("ended", onEnded);
    elements.audio.addEventListener("error", onAudioError);
    elements.audio.addEventListener("canplay", () => {
      if (pendingAutoplay) {
        pendingAutoplay = false;
        elements.audio.play().catch(() => {});
      }
    });

    document.addEventListener("keydown", (event) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (event.code === "Space") { event.preventDefault(); togglePlay(); }
      if (event.code === "ArrowLeft") seekBy(-10);
      if (event.code === "ArrowRight") seekBy(10);
    });
  }

  function renderChapters() {
    elements.chapterList.innerHTML = "";
    const groups = [];
    data.chapters.forEach((chapter, index) => {
      const part = chapter.part || "";
      if (!groups.length || groups[groups.length - 1].part !== part) groups.push({ part, items: [] });
      groups[groups.length - 1].items.push(index);
    });

    groups.forEach(group => {
      const open = expandedParts.has(group.part);
      if (group.part) {
        const header = document.createElement("button");
        header.type = "button";
        header.className = `part-header${open ? " open" : ""}`;
        const done = group.items.filter(i => state.completed[i]).length;
        header.innerHTML = `
          <span class="part-title">${escapeHtml(group.part)}</span>
          <span class="part-meta">${done}/${group.items.length} · <b class="part-chevron">${open ? "▾" : "▸"}</b></span>`;
        header.addEventListener("click", () => {
          if (expandedParts.has(group.part)) expandedParts.delete(group.part);
          else expandedParts.add(group.part);
          renderChapters();
        });
        elements.chapterList.appendChild(header);
        if (!open) return;
      }
      group.items.forEach(index => {
        const chapter = data.chapters[index];
        const progress = getChapterProgress(index);
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.index = index;
        button.className = `chapter-item${index === selectedIndex ? " active" : ""}${state.unavailable[index] ? " unavailable" : ""}`;
        button.innerHTML = `
          <span class="chapter-number">${String(chapter.number).padStart(2, "0")}</span>
          <span class="chapter-copy">
            <strong>${escapeHtml(chapter.title)}</strong>
            <span>${state.unavailable[index] ? "Archivo de audio no encontrado" : index === selectedIndex && !elements.audio.paused ? "Reproduciendo ahora" : "Capítulo " + chapter.number}</span>
          </span>
          <span class="chapter-state">
            <strong>${Math.round(progress * 100)}%</strong>
            <span class="mini-progress"><span style="width:${progress * 100}%"></span></span>
          </span>`;
        button.addEventListener("click", () => selectChapter(index, true));
        elements.chapterList.appendChild(button);
      });
    });
  }

  function renderFilters() {
    const categories = ["Todos", ...new Set(data.library.map(item => item.category))];
    elements.filterRow.innerHTML = "";
    categories.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-button${state.activeFilter === category ? " active" : ""}`;
      button.textContent = category;
      button.addEventListener("click", () => {
        state.activeFilter = category;
        saveState();
        renderFilters();
        renderGallery();
      });
      elements.filterRow.appendChild(button);
    });
  }

  function renderGallery() {
    const unlockedChapter = getUnlockedChapter();
    lastUnlockSignature = `${unlockedChapter}|${state.spoilerProtection}`;
    const visible = data.library.filter(item => state.activeFilter === "Todos" || item.category === state.activeFilter);
    elements.galleryGrid.innerHTML = "";
    visible.forEach(item => {
      const locked = state.spoilerProtection && item.unlockChapter > unlockedChapter;
      const card = document.createElement("article");
      card.className = `gallery-card${item.fit === "contain" ? " gallery-card-contain" : ""}${locked ? " locked" : ""}`;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", locked ? `${item.title}, bloqueado hasta el capítulo ${item.unlockChapter}` : `Abrir ${item.title}`);
      card.innerHTML = `
        <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">
        ${locked ? `<div class="lock-badge"><b>⌁</b><span>Disponible tras el capítulo ${item.unlockChapter - 1}</span></div>` : ""}
        <div class="gallery-overlay"><span>${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3></div>`;
      const open = () => locked ? showToast(`Se desbloquea al avanzar hasta el capítulo ${item.unlockChapter}.`) : openLightbox(item);
      card.addEventListener("click", open);
      card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
      elements.galleryGrid.appendChild(card);
    });
  }

  function selectChapter(index, autoplay = false, initial = false) {
    if (index < 0 || index >= data.chapters.length) return;
    if (!initial) saveCurrentPosition();
    selectedIndex = index;
    state.currentIndex = index;
    const chapter = data.chapters[index];

    if (chapter.part) expandedParts.add(chapter.part);
    updateChapterLabels();
    renderChapters();
    updateMediaSession();
    saveState();

    const storedTime = Number(state.times[index] || 0);
    elements.currentTime.textContent = formatTime(storedTime);
    elements.elapsedSummary.textContent = formatTime(storedTime);
    elements.duration.textContent = state.durations[index] ? formatTime(state.durations[index]) : "--:--";
    elements.durationSummary.textContent = state.durations[index] ? formatTime(state.durations[index]) : "--:--";
    elements.timeline.value = getChapterProgress(index) * 100;
    elements.cardProgress.style.width = `${getChapterProgress(index) * 100}%`;

    if (initial) return;

    state.unavailable[index] = false;
    const fileName = chapter.file.split("/").pop();
    const url = new URL(data.site.audioBaseUrl + fileName, window.location.href).href;
    elements.audio.pause();
    elements.audio.src = url;
    elements.audio.playbackRate = Number(state.speed || 1);
    elements.audio.load();
    pendingAutoplay = autoplay;

    if (autoplay) {
      elements.audio.play().catch(() => {
        pendingAutoplay = true;
      });
    }
  }

  function updateChapterLabels() {
    const chapter = data.chapters[selectedIndex];
    elements.playerChapter.textContent = `Capítulo ${chapter.number}`;
    elements.playerTitle.textContent = chapter.title;
    elements.nowTitle.textContent = chapter.title;
    elements.nowPart.textContent = data.chapters[selectedIndex].part || data.site.part;
    const stored = Number(state.times[selectedIndex] || 0);
    elements.resumeButton.textContent = stored > 5 ? `▶ Continuar capítulo ${chapter.number}` : `▶ Escuchar capítulo ${chapter.number}`;
  }

  function togglePlay() {
    if (!elements.audio.src) selectChapter(selectedIndex, false);
    if (elements.audio.paused) {
      elements.audio.play().catch(() => showToast("No se pudo iniciar el audio. Comprueba que el MP3 exista y conserve el nombre indicado."));
    } else {
      elements.audio.pause();
    }
  }

  function updatePlayState() {
    const playing = !elements.audio.paused;
    elements.playButton.innerHTML = playing ? ICONS.pause : ICONS.play;
    elements.playButton.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    renderChapters();
  }

  function onLoadedMetadata() {
    const duration = elements.audio.duration;
    if (!Number.isFinite(duration)) return;
    state.durations[selectedIndex] = duration;
    const storedTime = Math.min(Number(state.times[selectedIndex] || 0), Math.max(0, duration - 1));
    if (storedTime > 0) elements.audio.currentTime = storedTime;
    elements.duration.textContent = formatTime(duration);
    elements.durationSummary.textContent = formatTime(duration);
    state.unavailable[selectedIndex] = false;
    saveState();
    updateOverallProgress();
    renderChapters();
  }

  function onTimeUpdate() {
    if (!Number.isFinite(elements.audio.duration)) return;
    const current = elements.audio.currentTime;
    const duration = elements.audio.duration;
    const progress = duration ? current / duration : 0;
    elements.currentTime.textContent = formatTime(current);
    elements.elapsedSummary.textContent = formatTime(current);
    elements.timeline.value = progress * 100;
    elements.cardProgress.style.width = `${progress * 100}%`;
    state.times[selectedIndex] = current;
    state.durations[selectedIndex] = duration;
    if (progress >= 0.9) state.completed[selectedIndex] = true;

    const wholeSecond = Math.floor(current);
    if (wholeSecond !== lastSavedSecond && wholeSecond % 2 === 0) {
      lastSavedSecond = wholeSecond;
      saveState();
      updateOverallProgress();
    }
    if (wholeSecond % 5 === 0) {
      updateChapterProgressInPlace();
      const signature = `${getUnlockedChapter()}|${state.spoilerProtection}`;
      if (signature !== lastUnlockSignature) {
        lastUnlockSignature = signature;
        renderGallery();
      }
    }
  }

  function updateChapterProgressInPlace() {
    elements.chapterList.querySelectorAll("[data-index]").forEach(button => {
      const index = Number(button.dataset.index);
      const progress = getChapterProgress(index);
      const percent = button.querySelector(".chapter-state strong");
      const bar = button.querySelector(".mini-progress span");
      if (percent) percent.textContent = `${Math.round(progress * 100)}%`;
      if (bar) bar.style.width = `${progress * 100}%`;
    });
  }

  function onEnded() {
    state.completed[selectedIndex] = true;
    state.times[selectedIndex] = state.durations[selectedIndex] || elements.audio.duration || 0;
    saveState();
    updateOverallProgress();
    renderGallery();
    if (selectedIndex < data.chapters.length - 1) selectChapter(selectedIndex + 1, true);
  }

  function onAudioError() {
    state.unavailable[selectedIndex] = true;
    pendingAutoplay = false;
    saveState();
    updatePlayState();
    renderChapters();
    const chapter = data.chapters[selectedIndex];
    showToast(`Falta “${chapter.file}”. Colócalo dentro de audio/parte-1/ y vuelve a publicar la web.`);
  }

  function seekBy(seconds) {
    if (!Number.isFinite(elements.audio.duration)) return;
    elements.audio.currentTime = clamp(elements.audio.currentTime + seconds, 0, elements.audio.duration);
  }

  function saveCurrentPosition() {
    if (!elements.audio.src || !Number.isFinite(elements.audio.currentTime)) return;
    state.times[selectedIndex] = elements.audio.currentTime;
    if (Number.isFinite(elements.audio.duration)) state.durations[selectedIndex] = elements.audio.duration;
    saveState();
  }

  function getChapterProgress(index) {
    if (state.completed[index]) return 1;
    const duration = Number(state.durations[index] || 0);
    const time = Number(state.times[index] || 0);
    return duration > 0 ? clamp(time / duration, 0, 1) : 0;
  }

  function getUnlockedChapter() {
    let unlocked = 1;
    data.chapters.forEach((_, index) => {
      if (getChapterProgress(index) >= 0.85) unlocked = Math.max(unlocked, index + 2);
    });
    return Math.min(unlocked, data.chapters.length);
  }

  function updateOverallProgress() {
    const total = data.chapters.reduce((sum, _, index) => sum + getChapterProgress(index), 0) / data.chapters.length;
    const percent = Math.round(total * 100);
    elements.overallProgress.style.width = `${percent}%`;
    elements.overallPercent.textContent = `${percent}%`;
  }

  async function saveCurrentAudioOffline() {
    if (!("caches" in window) || !elements.audio.src) {
      showToast("El guardado sin conexión no está disponible en este navegador.");
      return;
    }
    elements.offlineButton.disabled = true;
    elements.offlineButton.textContent = "Guardando…";
    try {
      const response = await fetch(elements.audio.src, { mode: "cors" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const cache = await caches.open(AUDIO_CACHE);
      await cache.put(elements.audio.src, response.clone());
      elements.offlineButton.textContent = "Capítulo guardado ✓";
      elements.offlineNote.textContent = "Este capítulo podrá reproducirse sin conexión desde este dispositivo.";
      showToast("Capítulo guardado sin conexión.");
    } catch (error) {
      elements.offlineButton.textContent = "Guardar capítulo sin conexión";
      showToast("No se pudo guardar. El servidor de audio debe permitir acceso CORS o estar en el mismo dominio.");
    } finally {
      elements.offlineButton.disabled = false;
    }
  }

  function openLightbox(item) {
    elements.lightboxImage.src = item.image;
    elements.lightboxImage.alt = item.title;
    elements.lightboxTitle.textContent = item.title;
    elements.lightboxCategory.textContent = item.category;
    elements.lightboxCaption.textContent = item.caption || "";
    elements.lightbox.showModal();
  }

  function applyMapView(view) {
    const atlas = view === "atlas";
    if (!elements.worldMapImage || !elements.worldMapSmall) return;
    elements.worldMapImage.src = atlas
      ? "assets/world/atlas-politico-final-2048.webp"
      : "assets/world/mundo-realista-final-2048.webp";
    elements.worldMapSmall.srcset = atlas
      ? "assets/world/atlas-politico-final-1024.webp"
      : "assets/world/mundo-realista-final-1024.webp";
    elements.worldMapImage.alt = atlas
      ? "Atlas político plano de El ciclo inmóvil con las ciudades, Casas de Custodia y puntos estratégicos."
      : "Mapa realista canónico de El ciclo inmóvil con Gran Noche, Nidum, Assum, Día Extremo, ciudades y puntos estratégicos.";
    document.querySelectorAll(".atlas-toggle").forEach(button => {
      const active = button.dataset.mapView === (atlas ? "atlas" : "realista");
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applyHouse(house, persist = false) {
    if (!HOUSES.includes(house)) house = "fulgur";
    state.house = house;
    document.body.dataset.house = house;
    const seal = `assets/seals/seal-${house}.webp`;
    const brandSeal = $("brandSeal");
    const heroSeal = $("heroSeal");
    if (brandSeal) brandSeal.src = seal;
    if (heroSeal) heroSeal.src = seal;
    document.querySelectorAll(".house-switcher button").forEach(btn => btn.classList.toggle("active", btn.dataset.house === house));
    if (state.theme !== "light") document.querySelector('meta[name="theme-color"]')?.setAttribute("content", HOUSE_COLORS[house]);
    if (persist) {
      window.ECI_FX?.play(house);
      saveState();
    }
  }

  function applyTheme(theme, persist = false) {
    state.theme = theme === "light" ? "light" : "dark";
    document.body.classList.toggle("light", state.theme === "light");
    if (elements.themeButton) elements.themeButton.textContent = state.theme === "light" ? "●" : "◐";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", state.theme === "light" ? "#eeeae2" : (HOUSE_COLORS[state.house] || "#090c12"));
    if (persist) saveState();
  }

  function openMenu() { elements.mobileMenu.classList.add("open"); elements.mobileMenu.setAttribute("aria-hidden", "false"); }
  function closeMenu() { elements.mobileMenu.classList.remove("open"); elements.mobileMenu.setAttribute("aria-hidden", "true"); }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const chapter = data.chapters[selectedIndex];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: chapter.title,
      artist: data.site.author,
      album: `${data.site.book} · ${data.site.part}`,
      artwork: [{ src: new URL(data.site.cover, window.location.href).href, sizes: "512x512", type: "image/webp" }]
    });
    const actions = {
      play: () => elements.audio.play(), pause: () => elements.audio.pause(),
      seekbackward: details => seekBy(-(details.seekOffset || 10)),
      seekforward: details => seekBy(details.seekOffset || 10),
      previoustrack: () => selectChapter(selectedIndex - 1, true),
      nexttrack: () => selectChapter(selectedIndex + 1, true)
    };
    Object.entries(actions).forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 3800);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function safeParse(value) {
    try { return value ? JSON.parse(value) : null; } catch (_) { return null; }
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
})();

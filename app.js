(() => {
  const CFG = window.DATE_MAP_CONFIG || {
    whatsapp: "381692774424",
    ntfyTopic: "ksada-date-loznica-069",
    mapCenter: [44.5331, 19.2256],
    mapZoom: 14,
  };

  const i18n = {
    sr: {
      langBtn: "EN",
      question: "Hoćeš li izaći sa mnom?",
      askSub: "Odaberi DA i zakažimo avanturu.",
      yes: "DA",
      no: "Ne",
      hint: "Nemoj ovo",
      hintBroken: "Slomljeno srce",
      yay: "JEEE!",
      yayMsg: "Tako mi je drago što si rekla da.",
      continue: "PRITISNI ZA NASTAVAK →",
      maybe: "Moždaaaaaa",
      pickWhen: "KADA?",
      pickWhenSub: "Izaberi dan i tačno vreme.",
      dateLabel: "Datum",
      timeLabel: "Vreme",
      next: "DALJE →",
      whatDo: "ŠTA ŽELIŠ DA RADIMO?",
      pickPlace: "GDE IDEMO?",
      pickPlaceSub: "Pretraži ili klikni na mapu.",
      search: "Traži",
      searchPh: "npr. park, kafić u Loznici...",
      noPlace: "Još nije izabrano mesto",
      placeChosen: "Izabrano:",
      lockIn: "POTVRDI",
      itsADate: "DOGOVORENO!",
      activityLabel: "Aktivnost",
      placeLabel: "Mesto",
      sentNote: "Poslato njemu ✓ — WhatsApp samo ako želiš",
      sendWa: "Pošalji i na WhatsApp",
      notified: "Stiglo njemu ✓",
      notifyFail: "Sačuvano. Ako inbox ne radi, otvori odgovore 👁",
      needWhen: "Izaberi datum i vreme 💕",
      needActivity: "Izaberi aktivnost 💕",
      needPlace: "Izaberi mesto na mapi 💕",
      searchFail: "Nisam našao to mesto. Probaj drugačije.",
      activities: [
        { id: "dinner", label: "VEČERA" },
        { id: "movie", label: "FILMSKO VEČE" },
        { id: "coffee", label: "KAFA I ŠETNJA" },
        { id: "picnic", label: "PIKNIK" },
        { id: "golf", label: "MINI GOLF" },
        { id: "surprise", label: "IZNENADI ME" },
      ],
    },
    en: {
      langBtn: "SR",
      question: "Will you go out with me?",
      askSub: "Hit YES and let's plan the adventure.",
      yes: "YES",
      no: "No",
      hint: "Don't do this",
      hintBroken: "Heart broken",
      yay: "YAY!",
      yayMsg: "I'm so glad u said yes.",
      continue: "PRESS TO CONTINUE →",
      maybe: "Maybeeeeee",
      pickWhen: "WHEN?",
      pickWhenSub: "Pick the day and exact time.",
      dateLabel: "Date",
      timeLabel: "Time",
      next: "NEXT →",
      whatDo: "WHAT WOULD YOU LIKE TO DO?",
      pickPlace: "WHERE TO?",
      pickPlaceSub: "Search or tap the map.",
      search: "Search",
      searchPh: "e.g. park, cafe in Loznica...",
      noPlace: "No place selected yet",
      placeChosen: "Selected:",
      lockIn: "LOCK IT IN",
      itsADate: "IT'S A DATE!",
      activityLabel: "Activity",
      placeLabel: "Place",
      sentNote: "Sent to him ✓ — WhatsApp only if you want",
      sendWa: "Also send on WhatsApp",
      notified: "Delivered to him ✓",
      notifyFail: "Saved. If inbox fails, open answers 👁",
      needWhen: "Pick date and time 💕",
      needActivity: "Pick an activity 💕",
      needPlace: "Pick a place on the map 💕",
      searchFail: "Couldn't find that place. Try again.",
      activities: [
        { id: "dinner", label: "DINNER DATE" },
        { id: "movie", label: "MOVIE NIGHT" },
        { id: "coffee", label: "COFFEE & WALK" },
        { id: "picnic", label: "PICNIC" },
        { id: "golf", label: "MINI GOLF" },
        { id: "surprise", label: "SURPRISE ME" },
      ],
    },
  };

  const state = {
    lang: "sr",
    date: "",
    time: "19:00",
    activityId: null,
    place: null,
    noEscapes: 0,
    map: null,
    marker: null,
    doneMap: null,
    mapReady: false,
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const t = () => i18n[state.lang];

  const langToggle = $("#langToggle");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");
  const noWrap = $("#noWrap");
  const noHint = $("#noHint");
  const continueBtn = $("#continueBtn");
  const dateInput = $("#dateInput");
  const timeInput = $("#timeInput");
  const whenNextBtn = $("#whenNextBtn");
  const activityGrid = $("#activityGrid");
  const activityNextBtn = $("#activityNextBtn");
  const placeSearch = $("#placeSearch");
  const searchBtn = $("#searchBtn");
  const placeLabel = $("#placeLabel");
  const lockBtn = $("#lockBtn");
  const waBtn = $("#waBtn");
  const toast = $("#toast");
  const heartBurst = $("#heartBurst");

  function applyI18n() {
    const dict = t();
    document.documentElement.lang = state.lang;
    langToggle.textContent = dict.langBtn;
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    $$("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] != null) el.placeholder = dict[key];
    });
    if (state.noEscapes >= 3) noHint.textContent = dict.hintBroken;
    placeLabel.textContent = state.place
      ? `${dict.placeChosen} ${state.place.name}`
      : dict.noPlace;
    renderActivities();
  }

  function showScreen(id) {
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === `screen-${id}`));
    if (id === "place") requestAnimationFrame(() => ensureMap());
    if (id !== "ask") {
      noWrap.style.cssText = "";
      noWrap.style.position = "absolute";
    }
  }

  function renderActivities() {
    activityGrid.innerHTML = "";
    t().activities.forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "activity-btn" + (state.activityId === a.id ? " selected" : "");
      btn.textContent = a.label;
      btn.addEventListener("click", () => {
        state.activityId = a.id;
        activityNextBtn.disabled = false;
        renderActivities();
      });
      activityGrid.appendChild(btn);
    });
  }

  function activityLabel() {
    return t().activities.find((a) => a.id === state.activityId)?.label || "—";
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso + "T12:00:00").toLocaleDateString(
      state.lang === "sr" ? "sr-RS" : "en-US",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );
  }

  function toastMsg(msg) {
    toast.hidden = false;
    toast.textContent = msg;
    clearTimeout(toastMsg._t);
    toastMsg._t = setTimeout(() => {
      toast.hidden = true;
    }, 2400);
  }

  function burst(x, y, n = 16) {
    const colors = ["#ff4d8d", "#ff8fb8", "#fff", "#ff3d8a", "#ffc2d6"];
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.35;
      const dist = 50 + Math.random() * 120;
      el.textContent = Math.random() > 0.35 ? "♥" : "✦";
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      el.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
      el.style.setProperty("--c", colors[i % colors.length]);
      el.style.setProperty("--s", `${12 + Math.random() * 16}px`);
      heartBurst.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  function spawnDecor() {
    const sparkles = $("#sparkles");
    const floaties = $("#floaties");
    for (let i = 0; i < 20; i++) {
      const s = document.createElement("span");
      s.textContent = Math.random() > 0.5 ? "✦" : "+";
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 65}%`;
      s.style.animationDelay = `${Math.random() * 2}s`;
      sparkles.appendChild(s);
    }
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.textContent = "♥";
      s.style.left = `${Math.random() * 100}%`;
      s.style.bottom = "0";
      s.style.animationDelay = `${Math.random() * 8}s`;
      s.style.fontSize = `${10 + Math.random() * 14}px`;
      floaties.appendChild(s);
    }
  }

  function moveNo(clientX, clientY) {
    const pad = 12;
    const w = noWrap.offsetWidth;
    const h = noWrap.offsetHeight;
    const vw = innerWidth;
    const vh = innerHeight;
    let x = clientX < vw / 2 ? vw * (0.55 + Math.random() * 0.28) : vw * (0.05 + Math.random() * 0.25);
    let y = clientY < vh / 2 ? vh * (0.55 + Math.random() * 0.28) : vh * (0.18 + Math.random() * 0.25);
    x = Math.max(pad, Math.min(vw - w - pad, x));
    y = Math.max(pad + 48, Math.min(vh - h - pad, y));
    noWrap.style.position = "fixed";
    noWrap.style.left = `${x}px`;
    noWrap.style.top = `${y}px`;
    noWrap.style.right = "auto";
    noWrap.style.bottom = "auto";
    state.noEscapes += 1;
    noHint.classList.add("visible");
    noHint.textContent = state.noEscapes >= 3 ? t().hintBroken : t().hint;
    yesBtn.style.transform = `scale(${Math.min(1.3, 1 + state.noEscapes * 0.035)})`;
  }

  function ensureMap() {
    if (state.mapReady) {
      state.map.invalidateSize();
      return;
    }
    state.map = L.map("map", { scrollWheelZoom: true }).setView(CFG.mapCenter, CFG.mapZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(state.map);
    state.map.on("click", async (e) => {
      await setPlace(e.latlng.lat, e.latlng.lng);
    });
    state.mapReady = true;
    setTimeout(() => state.map.invalidateSize(), 80);
  }

  function setMarker(lat, lng) {
    if (state.marker) state.marker.setLatLng([lat, lng]);
    else state.marker = L.marker([lat, lng]).addTo(state.map);
    state.map.setView([lat, lng], Math.max(state.map.getZoom(), 15), { animate: true });
  }

  async function reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${state.lang === "sr" ? "sr" : "en"}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function setPlace(lat, lng, name) {
    setMarker(lat, lng);
    const resolved = name || (await reverseGeocode(lat, lng));
    state.place = { name: resolved, lat, lng };
    placeLabel.textContent = `${t().placeChosen} ${resolved}`;
    lockBtn.disabled = false;
  }

  async function searchPlace() {
    const q = placeSearch.value.trim();
    if (!q) return;
    searchBtn.disabled = true;
    try {
      const query = /loznica/i.test(q) ? q : `${q}, Loznica, Serbia`;
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}&accept-language=${state.lang === "sr" ? "sr" : "en"}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!data?.length) {
        toastMsg(t().searchFail);
        return;
      }
      const hit = data[0];
      await setPlace(parseFloat(hit.lat), parseFloat(hit.lon), hit.display_name);
    } catch {
      toastMsg(t().searchFail);
    } finally {
      searchBtn.disabled = false;
    }
  }

  function mapsLink(place) {
    if (!place) return "";
    return `https://www.google.com/maps?q=${place.lat},${place.lng}`;
  }

  function encodePayload(payload) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  function resultsUrl(payload) {
    return new URL(`rezultati.html#r=${encodePayload(payload)}`, location.href).href;
  }

  function buildWaUrl(payload) {
    const phone = String(CFG.whatsapp || "381692774424").replace(/\D/g, "");
    const text = [
      "Dogovoreno! 💕",
      `Datum: ${formatDate(payload.date)}`,
      `Vreme: ${payload.time}`,
      `Aktivnost: ${payload.activity}`,
      `Mesto: ${payload.place?.name || "—"}`,
      payload.place ? `Mapa: ${mapsLink(payload.place)}` : "",
      `Detalji: ${resultsUrl(payload)}`,
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  function saveLocal(payload) {
    const key = "ksada-date-map-results";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(payload);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 30)));
  }

  async function notifyInbox(payload) {
    const topic = CFG.ntfyTopic;
    if (!topic) return false;
    const detailLink = resultsUrl(payload);
    const body = [
      `Datum: ${formatDate(payload.date)}`,
      `Vreme: ${payload.time}`,
      `Aktivnost: ${payload.activity}`,
      `Mesto: ${payload.place?.name || "—"}`,
      payload.place ? `Maps: ${mapsLink(payload.place)}` : "",
      `Link: ${detailLink}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: "Dogovoreno! 💘",
        Priority: "high",
        Tags: "heart,date",
        Click: detailLink,
      },
      body,
    });
    return res.ok;
  }

  function fillSummary(payload) {
    $("#summaryDate").textContent = formatDate(payload.date);
    $("#summaryTime").textContent = payload.time;
    $("#summaryActivity").textContent = payload.activity;
    $("#summaryPlace").textContent = payload.place?.name || "—";

    waBtn.hidden = false;
    waBtn.href = buildWaUrl(payload);

    const el = $("#doneMap");
    el.innerHTML = "";
    if (payload.place) {
      setTimeout(() => {
        if (state.doneMap) {
          state.doneMap.remove();
          state.doneMap = null;
        }
        state.doneMap = L.map(el, {
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
        }).setView([payload.place.lat, payload.place.lng], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(state.doneMap);
        L.marker([payload.place.lat, payload.place.lng]).addTo(state.doneMap);
        setTimeout(() => state.doneMap.invalidateSize(), 60);
      }, 50);
    }
  }

  async function finalize(e) {
    if (!state.place) {
      alert(t().needPlace);
      return;
    }
    const payload = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      date: state.date,
      time: state.time,
      activity: activityLabel(),
      place: state.place,
    };
    saveLocal(payload);
    fillSummary(payload);
    burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 22);
    showScreen("done");

    try {
      const ok = await notifyInbox(payload);
      toastMsg(ok ? t().notified : t().notifyFail);
    } catch {
      toastMsg(t().notifyFail);
    }
  }

  langToggle.addEventListener("click", () => {
    state.lang = state.lang === "sr" ? "en" : "sr";
    applyI18n();
  });

  yesBtn.addEventListener("click", (e) => {
    burst(e.clientX, e.clientY);
    showScreen("yay");
  });

  noBtn.addEventListener("mouseenter", (e) => moveNo(e.clientX, e.clientY));
  noBtn.addEventListener("mousemove", (e) => {
    if (state.noEscapes) moveNo(e.clientX, e.clientY);
  });
  noBtn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      moveNo(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    moveNo(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
  });

  continueBtn.addEventListener("click", (e) => {
    burst(e.clientX, e.clientY, 10);
    showScreen("datetime");
  });

  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  dateInput.min = new Date().toISOString().slice(0, 10);
  dateInput.value = soon.toISOString().slice(0, 10);
  state.date = dateInput.value;
  state.time = timeInput.value;

  dateInput.addEventListener("change", () => (state.date = dateInput.value));
  timeInput.addEventListener("change", () => (state.time = timeInput.value));

  whenNextBtn.addEventListener("click", () => {
    if (!dateInput.value || !timeInput.value) {
      alert(t().needWhen);
      return;
    }
    state.date = dateInput.value;
    state.time = timeInput.value;
    showScreen("activity");
  });

  activityNextBtn.addEventListener("click", () => {
    if (!state.activityId) {
      alert(t().needActivity);
      return;
    }
    showScreen("place");
  });

  searchBtn.addEventListener("click", searchPlace);
  placeSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchPlace();
    }
  });

  lockBtn.addEventListener("click", finalize);

  spawnDecor();
  applyI18n();
})();

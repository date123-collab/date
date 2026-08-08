(() => {
  const CFG = window.DATE_MAP_CONFIG || { ntfyTopic: "ksada-date-loznica-069" };
  const listEl = document.getElementById("resultsList");
  const inboxLink = document.getElementById("inboxLink");

  const topic = CFG.ntfyTopic;
  const inboxUrl = `https://ntfy.sh/${topic}`;
  inboxLink.href = inboxUrl;
  inboxLink.textContent = inboxUrl;

  function decodePayload(encoded) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    } catch {
      try {
        return JSON.parse(atob(encoded));
      } catch {
        return null;
      }
    }
  }

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem("ksada-date-map-results") || "[]");
    } catch {
      return [];
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso + "T12:00:00").toLocaleDateString("sr-RS", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatWhen(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("sr-RS");
  }

  function render(items) {
    listEl.innerHTML = "";
    if (!items.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent =
        "Još nema otvorenog odgovora na ovom linku. Otvori inbox iznad — tamo stižu automatski. Ako ti ona pošalje direktan link, pojaviće se ovde.";
      listEl.appendChild(p);
      return;
    }

    items.forEach((item, idx) => {
      const card = document.createElement("article");
      card.className = "result-card";
      card.innerHTML = `
        <header>
          <span>#${items.length - idx}</span>
          <span>${formatWhen(item.createdAt)}</span>
        </header>
        <p><span>Datum</span><strong>${formatDate(item.date)}</strong></p>
        <p><span>Vreme</span><strong>${item.time || "—"}</strong></p>
        <p><span>Aktivnost</span><strong>${item.activity || "—"}</strong></p>
        <p><span>Mesto</span><strong>${item.place?.name || "—"}</strong></p>
        <div class="mini-map" id="map-${idx}"></div>
        ${
          item.place
            ? `<p style="margin-top:10px"><a href="https://www.google.com/maps?q=${item.place.lat},${item.place.lng}" target="_blank" rel="noopener">Google Maps ↗</a></p>`
            : ""
        }
      `;
      listEl.appendChild(card);

      if (item.place) {
        requestAnimationFrame(() => {
          const map = L.map(`map-${idx}`, {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
          }).setView([item.place.lat, item.place.lng], 15);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
          L.marker([item.place.lat, item.place.lng]).addTo(map);
          setTimeout(() => map.invalidateSize(), 50);
        });
      }
    });
  }

  function merge() {
    const byId = new Map();
    const fromHash = location.hash.startsWith("#r=")
      ? decodePayload(location.hash.slice(3))
      : null;
    if (fromHash?.id) {
      byId.set(fromHash.id, fromHash);
      const local = loadLocal();
      if (!local.some((x) => x.id === fromHash.id)) {
        local.unshift(fromHash);
        localStorage.setItem("ksada-date-map-results", JSON.stringify(local.slice(0, 30)));
      }
    }
    loadLocal().forEach((item) => {
      if (item?.id) byId.set(item.id, item);
    });
    return [...byId.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  render(merge());
  window.addEventListener("hashchange", () => render(merge()));
})();

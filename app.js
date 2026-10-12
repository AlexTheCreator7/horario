(() => {
  "use strict";

  const OFFSET_LIMA = -7; // hours behind Bonn (CEST)

  const courses = [
    {
      code: "MG14", type: "V", label: "Geo. Programming",
      day: 0, start: "09:15", end: "11:45",
      room: "Ü9 Computerraum", building: "MA 176",
      color: "var(--c-mg14)"
    },
    {
      code: "MG14", type: "Ü", label: "Geo. Programming",
      day: 0, start: "14:15", end: "15:45",
      room: "Computerraum", building: "Kirschallee 1-3",
      color: "var(--c-mg14)"
    },
    {
      code: "SDK-AS 02", type: "", label: "Deutsch A1.1",
      day: 0, start: "18:00", end: "19:30",
      room: "Online (Zoom)", building: "",
      color: "var(--c-deutsch)"
    },
    {
      code: "BW37", type: "Ü", label: "Digitale Karte",
      day: 1, start: "08:30", end: "10:00",
      room: "—", building: "",
      color: "var(--c-bw37)"
    },
    {
      code: "MG15", type: "V", label: "Env. Modeling 1",
      day: 1, start: "12:15", end: "13:45",
      room: "1.017.d", building: "Kirschallee 1-3",
      color: "var(--c-mg15)", overlap: true
    },
    {
      code: "MGP 20", type: "V", label: "Planetologie",
      day: 1, start: "13:30", end: "15:45",
      room: "U1.009 (Ü7)", building: "MA 176",
      color: "var(--c-mgp20)", overlap: true
    },
    {
      code: "MG15", type: "Ü", label: "Env. Modeling 1",
      day: 1, start: "14:00", end: "15:30",
      room: "1.017.d", building: "Kirschallee 1-3",
      color: "var(--c-mg15)", overlap: true
    },
    {
      code: "SDK-AS 02", type: "", label: "Deutsch A1.1",
      day: 2, start: "18:00", end: "19:30",
      room: "Online (Zoom)", building: "",
      color: "var(--c-deutsch)"
    },
    {
      code: "BW37", type: "V", label: "Digitale Karte",
      day: 3, start: "09:00", end: "10:00",
      room: "4.010 (SR)", building: "Kirschallee 1-3",
      color: "var(--c-bw37)"
    },
    {
      code: "MG42", type: "V", label: "Dynamik d. festen Erde",
      day: 3, start: "10:15", end: "11:45",
      room: "—", building: "",
      color: "var(--c-mg42)"
    },
  ];

  const START_HOUR = 8;
  const END_HOUR = 20;
  const SLOT_H = 18; // px per 15-min slot
  const HEADER_H = 38;

  let currentTz = "de";

  function timeToMin(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function minToTime(m) {
    let h = Math.floor(m / 60);
    let mm = m % 60;
    if (h < 0) { h += 24; }
    if (h >= 24) { h -= 24; }
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  function applyTz(timeStr) {
    if (currentTz === "de") return timeStr;
    let m = timeToMin(timeStr) + OFFSET_LIMA * 60;
    if (m < 0) m += 1440;
    return minToTime(m);
  }

  function buildGrid() {
    const grid = document.querySelector(".grid");
    // Clear everything except headers
    const headers = grid.querySelectorAll(".grid-header");
    grid.innerHTML = "";
    headers.forEach(h => grid.appendChild(h));

    const totalSlots = (END_HOUR - START_HOUR) * 4;
    const dayContainers = [];

    // Build time labels + day columns
    for (let s = 0; s < totalSlots; s++) {
      const totalMin = START_HOUR * 60 + s * 15;
      const isHour = totalMin % 60 === 0;

      const label = document.createElement("div");
      label.className = "time-label" + (isHour ? " hour-mark" : "");
      if (isHour) {
        label.textContent = applyTz(minToTime(totalMin));
      }
      grid.appendChild(label);

      for (let d = 0; d < 4; d++) {
        const cell = document.createElement("div");
        cell.className = "cell" + (isHour ? " hour-mark" : "");
        cell.style.gridColumn = d + 2;
        grid.appendChild(cell);
      }
    }

    // Overlay containers for each day
    for (let d = 0; d < 4; d++) {
      const overlay = document.createElement("div");
      overlay.className = "day-overlay";
      overlay.style.position = "absolute";
      overlay.style.top = HEADER_H + "px";
      overlay.style.left = `calc(60px + ${d} * ((100% - 60px) / 4))`;
      overlay.style.width = `calc((100% - 60px) / 4)`;
      overlay.style.height = totalSlots * SLOT_H + "px";
      overlay.style.pointerEvents = "none";
      grid.appendChild(overlay);
      dayContainers.push(overlay);
    }

    grid.style.position = "relative";

    // Tuesday overlap handling: stack overlapping blocks
    const tuesdayCourses = courses.filter(c => c.day === 1);

    courses.forEach(c => {
      const startMin = timeToMin(c.start);
      const endMin = timeToMin(c.end);
      const top = ((startMin - START_HOUR * 60) / 15) * SLOT_H;
      const height = ((endMin - startMin) / 15) * SLOT_H;

      const block = document.createElement("div");
      block.className = "block" + (c.overlap ? " overlap" : "");
      block.style.top = top + "px";
      block.style.height = Math.max(height - 2, SLOT_H) + "px";
      block.style.background = c.color;
      block.style.pointerEvents = "auto";

      // For Tuesday overlapping blocks, offset them
      if (c.day === 1 && c.overlap) {
        const overlapping = tuesdayCourses.filter(o => {
          const oStart = timeToMin(o.start);
          const oEnd = timeToMin(o.end);
          return o !== c && o.overlap && oStart < endMin && oEnd > startMin;
        });
        if (overlapping.length > 0) {
          // Find position index among overlapping group
          const group = [c, ...overlapping].sort((a, b) => timeToMin(a.start) - timeToMin(b.start) || a.code.localeCompare(b.code));
          const idx = group.indexOf(c);
          const total = group.length;
          if (total > 1) {
            const w = 100 / Math.min(total, 2);
            block.style.left = (idx % 2) * w + 1 + "%";
            block.style.width = w - 2 + "%";
            block.style.right = "auto";
          }
        }
      }

      const displayStart = applyTz(c.start);
      const displayEnd = applyTz(c.end);
      const typeLabel = c.type ? ` ${c.type}` : "";

      block.innerHTML = `
        <div class="code">${c.code}${typeLabel}</div>
        <div class="time-range">${displayStart} – ${displayEnd}</div>
        ${height > SLOT_H * 2 ? `<div class="room">${c.room}${c.building ? " · " + c.building : ""}</div>` : ""}
      `;

      block.title = `${c.code}${typeLabel} — ${c.label}\n${displayStart}–${displayEnd}\n${c.room}${c.building ? " (" + c.building + ")" : ""}`;

      dayContainers[c.day].appendChild(block);
    });
  }

  // TZ toggle
  document.querySelectorAll(".tz-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tz-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTz = btn.dataset.tz;
      buildGrid();
    });
  });

  buildGrid();
})();

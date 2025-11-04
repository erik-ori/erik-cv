const API_BASE = "https://erik-cv-backend.onrender.com";
document.getElementById("year").textContent = new Date().getFullYear();

const chatlog = document.getElementById("chatlog");
const form = document.getElementById("chatform");
const input = document.getElementById("question");

function addMsg(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatlog.appendChild(div);
  chatlog.scrollTop = chatlog.scrollHeight;
  return div;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  addMsg(q, "me");
  input.value = "";
  const pending = addMsg("⏳ Thinking…", "bot");
  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    const data = await r.json();
    pending.textContent = data.answer || "No answer.";
  } catch {
    pending.textContent = "Network error.";
  }
});

/* ===== Scroll animations: isteresi + batching rAF + fast-scroll guard ===== */
(() => {
  const SHOW = 0.30;   // entra quando visibile >= 30%
  const HIDE = 0.10;   // esce solo quando visibile <= 10% (evita ping-pong)
  const SEEN = new WeakMap();

  // Rilevazione scroll "veloce" (momentum): durante fast scroll non togliamo classi
  let isFastScroll = false;
  let lastY = window.scrollY, lastT = performance.now();
  let speedTimer = 0;

  const onScroll = () => {
    const now = performance.now();
    const dy = Math.abs(window.scrollY - lastY);
    const dt = Math.max(1, now - lastT);
    const v = dy / dt; // px/ms

    lastY = window.scrollY;
    lastT = now;

    isFastScroll = v > 0.45; // soglia empirica
    clearTimeout(speedTimer);
    speedTimer = setTimeout(() => { isFastScroll = false; }, 120);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Batching via requestAnimationFrame
  const toShow = new Set();
  const toHide = new Set();
  let scheduled = false;

  const scheduleFlush = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      // Priorità: show vince su hide per lo stesso elemento
      toShow.forEach(el => toHide.delete(el));

      // Applica "show"
      toShow.forEach(el => {
        if (el.classList.contains("fade")) el.classList.add("visible");
        if (el.classList.contains("card")) el.classList.add("active");
        // will-change solo per la durata della transizione
        el.style.willChange = "opacity, transform";
        setTimeout(() => { el.style.willChange = "auto"; }, 450);
      });

      // Durante fast scroll non togliamo le classi (evita rimbalzo)
      if (!isFastScroll) {
        toHide.forEach(el => {
          if (el.classList.contains("fade")) el.classList.remove("visible");
          if (el.classList.contains("card")) el.classList.remove("active");
        });
      }

      toShow.clear();
      toHide.clear();
      scheduled = false;
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const r = entry.intersectionRatio;
        const wasVisible = SEEN.get(el) === true;

        if (!wasVisible && r >= SHOW) {
          SEEN.set(el, true);
          toShow.add(el);
          scheduleFlush();
        } else if (wasVisible && r <= HIDE) {
          SEEN.set(el, false);
          toHide.add(el);
          scheduleFlush();
        }
      });
    },
    {
      threshold: [HIDE, SHOW, 0.5, 1],
      rootMargin: "0px 0px -10% 0px", // uscita leggermente anticipata = più stabile
    }
  );

  // Osserva gli elementi come prima
  document.querySelectorAll(".fade, .card").forEach((el) => io.observe(el));
})();

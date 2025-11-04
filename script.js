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

/* ===== Scroll animations: fluide + anti-sfarfallio ===== */
(() => {
  const SHOW = 0.28; // entra quando >= 28%
  const HIDE = 0.10; // esce quando <= 10%
  const DWELL_MS = 120; // tempo minimo stabile prima di cambiare
  const STATE = new WeakMap(); // { visible:boolean, pendingTo:boolean|null, since:number }

  let rafQueued = false;
  const queue = new Set();

  function flush() {
    rafQueued = false;
    const now = performance.now();

    queue.forEach((el) => {
      const st = STATE.get(el);
      if (!st || st.pendingTo === null) return;

      if (now - st.since >= DWELL_MS) {
        // Applica il cambio
        st.visible = st.pendingTo;
        st.pendingTo = null;

        // Cambi di classe che non alterano il layout (solo opacity/transform nel CSS)
        if (st.visible) {
          if (el.classList.contains("fade")) el.classList.add("visible");
          if (el.classList.contains("card")) el.classList.add("active");
          el.style.willChange = "opacity, transform";
          setTimeout(() => (el.style.willChange = "auto"), 450);
        } else {
          if (el.classList.contains("fade")) el.classList.remove("visible");
          if (el.classList.contains("card")) el.classList.remove("active");
        }
      }
    });

    queue.clear();
  }

  function scheduleFlush() {
    if (!rafQueued) {
      rafQueued = true;
      requestAnimationFrame(flush);
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      const now = performance.now();

      entries.forEach((entry) => {
        const el = entry.target;
        const r = entry.intersectionRatio;

        if (!STATE.has(el)) {
          STATE.set(el, { visible: false, pendingTo: null, since: now });
        }
        const st = STATE.get(el);

        // Hysteresis: se già visibile richiede >HIDE per restare, altrimenti >=SHOW per entrare
        const wantVisible = st.visible ? r > HIDE : r >= SHOW;

        if (wantVisible !== st.visible) {
          // Se è una nuova direzione, imposta il dwell da ORA.
          if (st.pendingTo !== wantVisible) {
            st.pendingTo = wantVisible;
            st.since = now;
          }
          // Non resettare st.since se arrivano altri eventi nella stessa direzione
          queue.add(el);
          scheduleFlush();
        } else {
          // Stato desiderato coincide con quello attuale: annulla eventuale pending
          st.pendingTo = null;
        }
      });
    },
    {
      threshold: [0, HIDE, SHOW, 0.5, 1],
      rootMargin: "0px",
    }
  );

  // Osserva target
  const targets = document.querySelectorAll(".fade, .card");
  targets.forEach((el) => {
    // Safe defaults per evitare jank
    el.style.backfaceVisibility = "hidden";
    el.style.transformStyle = "preserve-3d";
    io.observe(el);
  });

  // Check iniziale: tutto ciò che è già dentro SHOW parte visibile senza attese
  // (evita "pagina vuota" al primo render)
  requestAnimationFrame(() => {
    const now = performance.now();
    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;

      const vertVisible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const horizVisible = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
      const area = rect.width * rect.height || 1;
      const visRatio = (vertVisible * horizVisible) / area;

      if (!STATE.has(el)) STATE.set(el, { visible: false, pendingTo: null, since: now });
      const st = STATE.get(el);

      if (visRatio >= SHOW) {
        st.visible = true;
        st.pendingTo = null;
        if (el.classList.contains("fade")) el.classList.add("visible");
        if (el.classList.contains("card")) el.classList.add("active");
      }
    });
  });

  // Accessibilità: riduci motion se richiesto
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) {
    io.disconnect();
    targets.forEach((el) => {
      if (el.classList.contains("fade")) el.classList.add("visible");
      if (el.classList.contains("card")) el.classList.add("active");
    });
  }
})();



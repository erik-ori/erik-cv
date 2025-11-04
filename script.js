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

/* ===== Scroll animations: fluide + anti-sfarfallio + anti-ancoraggio ===== */
(() => {
  const SHOW = 0.28; // entra quando >= 28%
  const HIDE = 0.10; // esce quando <= 10%
  const DWELL_MS = 140; // tempo minimo stabile prima di applicare il cambio
  const SEEN = new WeakMap(); // stato corrente {visible:boolean, pending:boolean, since:number}

  // Coda di aggiornamenti da applicare in un singolo frame
  let dirty = false;
  const toUpdate = new Set();

  function scheduleFlush() {
    if (dirty) return;
    dirty = true;
    requestAnimationFrame(() => {
      const now = performance.now();
      toUpdate.forEach((el) => {
        const st = SEEN.get(el);
        if (!st || st.pending === null) return;

        // Applica il cambio solo se è rimasto stabile abbastanza
        if (now - st.pending.since >= DWELL_MS) {
          st.visible = st.pending.to;
          st.pending = null;

          // Evita che il browser sposti lo scroll mentre cambia le classi
          el.style.overflowAnchor = "none";

          if (st.visible) {
            if (el.classList.contains("fade")) el.classList.add("visible");
            if (el.classList.contains("card")) el.classList.add("active");
            // will-change solo durante la transizione CSS
            el.style.willChange = "opacity, transform";
            setTimeout(() => (el.style.willChange = "auto"), 450);
          } else {
            if (el.classList.contains("fade")) el.classList.remove("visible");
            if (el.classList.contains("card")) el.classList.remove("active");
          }

          // Riabilita l’ancoraggio dopo il frame successivo
          requestAnimationFrame(() => {
            el.style.overflowAnchor = "";
          });
        }
      });
      toUpdate.clear();
      dirty = false;
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      const now = performance.now();
      entries.forEach((entry) => {
        const el = entry.target;
        const r = entry.intersectionRatio;

        // Inizializza stato
        if (!SEEN.has(el)) {
          SEEN.set(el, { visible: false, pending: null, since: now });
        }
        const st = SEEN.get(el);

        // Decisione con isteresi
        const wantVisible = st.visible
          ? r > HIDE
          : r >= SHOW;

        // Se lo stato desiderato è diverso dall’attuale, avvia/aggiorna la finestra di dwell
        if (wantVisible !== st.visible) {
          if (st.pending && st.pending.to === wantVisible) {
            // già in pending verso lo stesso stato: aggiorna il timestamp per tenerlo “stabile”
            st.pending.since = now;
          } else {
            // nuova transizione richiesta
            st.pending = { to: wantVisible, since: now };
          }
          toUpdate.add(el);
          scheduleFlush();
        } else {
          // Se l’osservazione rientra nel medesimo stato, annulla pending
          st.pending = null;
        }
      });
    },
    {
      // Soglie sufficientemente distanziate per ridurre rimbalzi
      threshold: [0, HIDE, SHOW, 0.5, 0.75, 1],
      // Niente rootMargin negativo: riduce “spinte” precoci
      rootMargin: "0px",
    }
  );

  // Osserva una sola volta
  document.querySelectorAll(".fade, .card").forEach((el) => {
    // Hardening: assicura che l’animazione non cambi il layout (solo opacity/transform via CSS)
    el.style.backfaceVisibility = "hidden";
    el.style.transformStyle = "preserve-3d";
    io.observe(el);
  });

  // Safety: pausa animazioni se l’utente preferisce ridurre i motion
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) {
    io.disconnect();
    document.querySelectorAll(".fade, .card").forEach((el) => {
      el.classList.add("visible", "active");
    });
  }
})();

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

/* ===== Scroll animations: isteresi + debounce + batching rAF + fast-scroll guard ===== */
(() => {
  // Soglie: entra/esce
  const SHOW = 0.30;       // entra quando visibile >= 30%
  const HIDE = 0.10;       // esce quando visibile <= 10%
  // Debounce: quanto aspettare prima di applicare show/hide (ms)
  const SHOW_DELAY = 40;   // micro-ritardo per compattare gli ingressi
  const HIDE_DELAY = 140;  // più alto: elimina ping-pong allo scroll lento

  const SEEN = new WeakMap();             // stato visibile (true/false)
  const showTO = new WeakMap();           // timer per show per elemento
  const hideTO = new WeakMap();           // timer per hide per elemento

  // Fast scroll guard: durante scroll veloce non togliamo classi (evita rimbalzo)
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
      // Show ha priorità su Hide per lo stesso elemento
      toShow.forEach(el => toHide.delete(el));

      toShow.forEach(el => {
        if (el.classList.contains("fade")) el.classList.add("visible");
        if (el.classList.contains("card")) el.classList.add("active");
        el.style.willChange = "opacity, transform";
        setTimeout(() => { el.style.willChange = "auto"; }, 450);
      });

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

  // Helpers per gestione debounce per-elemento
  const clearShowTO = (el) => {
    const t = showTO.get(el);
    if (t) { clearTimeout(t); showTO.delete(el); }
  };
  const clearHideTO = (el) => {
    const t = hideTO.get(el);
    if (t) { clearTimeout(t); hideTO.delete(el); }
  };

  const scheduleShow = (el) => {
    if (SEEN.get(el) === true) return; // già visibile
    clearHideTO(el); // se stava per nascondersi, annulla
    if (showTO.get(el)) return; // già schedulato
    const t = setTimeout(() => {
      showTO.delete(el);
      SEEN.set(el, true);
      toShow.add(el);
      scheduleFlush();
    }, SHOW_DELAY);
    showTO.set(el, t);
  };

  const scheduleHide = (el) => {
    if (SEEN.get(el) !== true) return; // già nascosto
    clearShowTO(el); // se stava per mostrarsi, annulla
    if (hideTO.get(el)) return; // già schedulato
    const t = setTimeout(() => {
      hideTO.delete(el);
      // Prima di spegnere, verifica che NON sia tornato sufficientemente visibile
      // (se è risalito sopra SHOW, allora non si spegne)
      const stateVisible = SEEN.get(el) === true;
      if (!stateVisible) return; // è già stato spento nel frattempo
      // Se siamo ancora in fast scroll, aspetta il calm down
      if (isFastScroll) {
        // riprova più tardi (debounce continua finché non calma)
        scheduleHide(el);
        return;
      }
      SEEN.set(el, false);
      toHide.add(el);
      scheduleFlush();
    }, HIDE_DELAY);
    hideTO.set(el, t);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const r = entry.intersectionRatio;
        const wasVisible = SEEN.get(el) === true;

        // Ingresso: sopra SHOW => programma show (debounced)
        if (!wasVisible && r >= SHOW) {
          scheduleShow(el);
        }
        // Uscita: sotto HIDE => programma hide (debounced)
        else if (wasVisible && r <= HIDE) {
          scheduleHide(el);
        }
        // Zona morta tra HIDE e SHOW: non fare nulla, i debounce decidono
        else {
          // Se torna tra le soglie, annulla un eventuale hide programmato
          if (r > HIDE) clearHideTO(el);
          // E se scende sotto SHOW, annulla eventuale show programmato
          if (r < SHOW) clearShowTO(el);
        }
      });
    },
    {
      threshold: [0, HIDE, SHOW, 0.5, 1],
      rootMargin: "0px 0px -10% 0px",
    }
  );

  document.querySelectorAll(".fade, .card").forEach((el) => io.observe(el));
})();

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

/* ===== Scroll animations: visibilità temporanea (con isteresi anti-sfarfallio) ===== */
(() => {
  const SHOW = 0.28;  // entra quando è visibile almeno al 28%
  const HIDE = 0.10;  // esce solo quando scende sotto il 10% (evita toggle continuo)
  const SEEN = new WeakMap();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const r = entry.intersectionRatio;
        const wasVisible = SEEN.get(el) === true;

        // decide usando soglie diverse per show/hide
        if (!wasVisible && r >= SHOW) {
          SEEN.set(el, true);

          if (el.classList.contains("fade")) el.classList.add("visible");
          if (el.classList.contains("card")) el.classList.add("active");

          // micro-ottimizzazione: will-change solo per la durata della transizione
          el.style.willChange = "opacity, transform";
          setTimeout(() => (el.style.willChange = "auto"), 450);
        } else if (wasVisible && r <= HIDE) {
          SEEN.set(el, false);

          if (el.classList.contains("fade")) el.classList.remove("visible");
          if (el.classList.contains("card")) el.classList.remove("active");
        }
      });
    },
    {
      threshold: [0, HIDE, SHOW, 0.5, 1],
      rootMargin: "0px 0px -8% 0px", // uguale al tuo, mantiene il feeling
    }
  );

  // osserva .fade e .card (come prima)
  document.querySelectorAll(".fade, .card").forEach((el) => io.observe(el));
})();

// === Chat (invariato) ===
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

// === Reveal on scroll (appare e scompare, nessuna forzatura) ===
(() => {
  // Se l’utente preferisce meno animazioni, mostra tutto subito
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".fade").forEach(el => el.classList.add("visible"));
    document.querySelectorAll(".card").forEach(el => el.classList.add("active"));
    return;
  }

  const targets = document.querySelectorAll(".fade, .card");
  if (!targets.length) return;

  const SHOW = 0.2; // entra quando almeno il 20% è visibile
  const HIDE = 0.1; // esce quando scende sotto il 10%

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const ratio = entry.intersectionRatio;

      // Mostra
      if (ratio >= SHOW) {
        if (el.classList.contains("fade")) el.classList.add("visible");
        if (el.classList.contains("card")) el.classList.add("active");
      }
      // Nascondi
      else if (ratio <= HIDE) {
        if (el.classList.contains("fade")) el.classList.remove("visible");
        if (el.classList.contains("card")) el.classList.remove("active");
      }
    });
  }, {
    threshold: [0, HIDE, SHOW, 0.5, 1],
    rootMargin: "0px"
  });

  targets.forEach(el => io.observe(el));
})();

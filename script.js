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

/* ===== Scroll animations: visibilità temporanea ===== */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      const el = e.target;
      const isIn = e.isIntersecting;

      // visibilità base (fade)
      if (el.classList.contains("fade")) {
        if (isIn) el.classList.add("visible");
        else el.classList.remove("visible");
      }

      // card: attive solo quando visibili
      if (el.classList.contains("card")) {
        if (isIn) el.classList.add("active");
        else el.classList.remove("active");
      }
    });
  },
  {
    threshold: 0.2,
    rootMargin: "0px 0px -8% 0px",
  }
);

// osserva elementi interessati (niente frecce)
document.querySelectorAll(".fade, .card").forEach((el) => io.observe(el));

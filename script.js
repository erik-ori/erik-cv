// URL del backend su Render (HTTPS)
const API_BASE = "https://erik-cv-backend.onrender.com";

const chatlog = document.getElementById("chatlog");
const form = document.getElementById("chatform");
const input = document.getElementById("question");
document.getElementById("year").textContent = new Date().getFullYear();

function addMsg(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatlog.appendChild(div);
  chatlog.scrollTop = chatlog.scrollHeight;
  return div; // ritorna il nodo, così possiamo aggiornarlo dopo
}

function detectLang(q) {
  const s = q.toLowerCase();
  const en = ["which","what","where","when","who","how","degree","experience","work","university","has","have","does","did"];
  const it = ["che","quale","quali","quando","dove","chi","come","laurea","esperienze","lavoro","università","universita","ha","hanno"];
  const enHits = en.reduce((a,w)=>a+(s.includes(w)?1:0),0);
  const itHits = it.reduce((a,w)=>a+(s.includes(w)?1:0),0);
  if (enHits > itHits) return "en";
  if (itHits > enHits) return "it";
  // fallback: lingua browser
  return (navigator.language || "it").startsWith("it") ? "it" : "en";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;

  addMsg(q, "me");
  input.value = "";

  const lang = detectLang(q);
  const thinking = lang === "it" ? "⏳ Sto pensando…" : "⏳ Thinking…";
  const pendingNode = addMsg(thinking, "bot");

  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });

    // errori HTTP gestiti con messaggi leggibili
    if (!r.ok) {
      let details = "";
      try { details = await r.text(); } catch {}
      const msg =
        lang === "it"
          ? `Errore (${r.status}): ${details || r.statusText}`
          : `Error (${r.status}): ${details || r.statusText}`;
      pendingNode.textContent = msg;
      return;
    }

    const data = await r.json();
    pendingNode.textContent = data.answer ?? (lang === "it" ? "Nessuna risposta." : "No answer.");
  } catch (err) {
    const msg =
      lang === "it"
        ? "Errore di rete. Riprova tra poco."
        : "Network error. Please try again.";
    pendingNode.textContent = `${msg} ${err?.message ? `(${err.message})` : ""}`;
  }
});

// invio con Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});


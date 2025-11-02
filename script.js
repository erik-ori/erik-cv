const API_BASE = "http://127.0.0.1:8000"; // backend FastAPI

const chatlog = document.getElementById('chatlog');
const form = document.getElementById('chatform');
const input = document.getElementById('question');
document.getElementById('year').textContent = new Date().getFullYear();

function addMsg(text, who){
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  chatlog.appendChild(div);
  chatlog.scrollTop = chatlog.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if(!q) return;
  addMsg(q, 'me');
  input.value = '';
  addMsg('⏳ Sto pensando…', 'bot');

  try{
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    });
    if(!r.ok){
      const t = await r.text();
      throw new Error(t);
    }
    const data = await r.json();
    chatlog.lastChild.textContent = data.answer;
  } catch(err){
    chatlog.lastChild.textContent = 'Errore: ' + err.message;
  }
});

// invio con Enter
input.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    form.requestSubmit();
  }
});


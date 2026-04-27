// ── Chat open/close ──
const chatWidget  = document.getElementById('chat-widget');
const chatOverlay = document.getElementById('chat-overlay');
const chatInput   = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn     = document.getElementById('sendMessage');

function openChat() {
  chatWidget.classList.remove('hidden');
  chatOverlay.classList.remove('hidden');
  chatInput.focus();
}
function closeChat() {
  chatWidget.classList.add('hidden');
  chatOverlay.classList.add('hidden');
}

document.getElementById('openChat').addEventListener('click', openChat);
document.getElementById('openChatHero').addEventListener('click', openChat);
document.getElementById('openChatContact').addEventListener('click', openChat);
document.getElementById('closeChat').addEventListener('click', closeChat);
chatOverlay.addEventListener('click', closeChat);

// ── Message helpers ──
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}-message`;
  const p = document.createElement('p');
  p.textContent = text;
  div.appendChild(p);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}
function showTyping() {
  const div = document.createElement('div');
  div.className = 'message bot-message typing-indicator';
  div.id = 'typingIndicator';
  div.innerHTML = '<p>Thinking…</p>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// ── Send message ──
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';
  sendBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    hideTyping();
    appendMessage('bot', data.reply);
  } catch (err) {
    hideTyping();
    appendMessage('bot', `Sorry, I couldn't connect right now. Please try again later. (${err.message})`);
  } finally {
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── Nav scroll effect ──
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.style.boxShadow = window.scrollY > 20 ? '0 2px 20px rgba(0,0,0,.5)' : 'none';
});

// ── Intersection observer for fade-in ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.timeline-card, .edu-card, .cert-card, .contact-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

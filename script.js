// ── Chat open/close ──
const chatWidget   = document.getElementById('chat-widget');
const chatOverlay  = document.getElementById('chat-overlay');
const chatMessages = document.getElementById('chatMessages');

function openChat() {
  chatWidget.classList.remove('hidden');
  chatOverlay.classList.remove('hidden');
  initChat();
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

// ── Init: check server then show correct UI ──
async function initChat() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('server_down');
    const { hasKey } = await res.json();
    if (hasKey) {
      showChatInput();
    } else {
      showKeySetup('Enter your Anthropic API key to start:');
    }
  } catch {
    showKeySetup('Server not detected. Start it with "npm start", then re-open this chat.');
  }
}

// ── Render: normal chat input ──
function showChatInput() {
  const area = document.querySelector('.chat-input-area');
  area.innerHTML = `
    <input type="text" id="chatInput" placeholder="Ask about experience, skills, projects…" autocomplete="off" />
    <button id="sendMessage" class="send-btn" title="Send">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    </button>
  `;
  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('sendMessage');
  btn.addEventListener('click', () => sendMessage(input, btn));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input, btn); }
  });
  input.focus();
}

// ── Render: key entry form ──
function showKeySetup(label) {
  const area = document.querySelector('.chat-input-area');
  area.innerHTML = `
    <div class="key-setup">
      <p class="key-setup-label">${label || 'Paste your Anthropic API key:'}</p>
      <div class="key-setup-row">
        <input type="password" id="keyInput" placeholder="sk-ant-api03-…" autocomplete="off" />
        <button id="saveKey" class="send-btn">Save</button>
      </div>
      <p class="key-setup-hint">Get one free at <strong>console.anthropic.com</strong> → API Keys</p>
    </div>
  `;
  document.getElementById('saveKey').addEventListener('click', saveKey);
  document.getElementById('keyInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveKey();
  });
  document.getElementById('keyInput').focus();
}

// ── Save key to server ──
async function saveKey() {
  const keyVal = (document.getElementById('keyInput')?.value || '').trim();
  if (!keyVal.startsWith('sk-ant-')) {
    appendMessage('bot', 'That key doesn\'t look right — it should start with sk-ant-');
    return;
  }
  try {
    const res = await fetch('/api/setkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: keyVal })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || 'Could not save key');
    if (d.vercel) {
      appendMessage('bot', d.message);
      return;
    }
    appendMessage('bot', 'Key saved! Ask me anything about my professional experience.');
    showChatInput();
  } catch (err) {
    appendMessage('bot', `Could not save key: ${err.message}`);
  }
}

// ── Message helpers ──
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}-message`;
  const p = document.createElement('p');
  p.textContent = text;
  div.appendChild(p);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function showTyping() {
  const div = document.createElement('div');
  div.id = 'typingIndicator';
  div.className = 'message bot-message typing-indicator';
  div.innerHTML = '<p>Thinking…</p>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function hideTyping() {
  document.getElementById('typingIndicator')?.remove();
}

// ── Send message ──
async function sendMessage(input, btn) {
  const text = input.value.trim();
  if (!text) return;

  appendMessage('user', text);
  input.value = '';
  btn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json().catch(() => ({}));
    hideTyping();

    if (res.status === 401 || (data.error && data.error.toLowerCase().includes('key'))) {
      // Key is expired or wrong — drop into key setup automatically
      appendMessage('bot', 'Your API key is invalid or expired. Please enter a new one:');
      showKeySetup();
      return;
    }
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    appendMessage('bot', data.reply);
  } catch (err) {
    hideTyping();
    if (err.message === 'Failed to fetch') {
      appendMessage('bot', 'Cannot reach server. Run "npm start" in the portfolio folder, then open http://localhost:3000');
    } else {
      appendMessage('bot', `Error: ${err.message}`);
    }
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

// ── Redacted fields: click to permanently reveal ──
document.querySelectorAll('.redacted').forEach(el => {
  el.title = 'Click to reveal';
  el.addEventListener('click', () => el.classList.add('revealed'));
});

// ── Nav scroll shadow ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.boxShadow =
    window.scrollY > 20 ? '0 2px 20px rgba(29,78,216,.12)' : 'none';
});

// ── Fade-in on scroll ──
const observer = new IntersectionObserver(entries => {
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

/* Minimal Apple Chat — client-only demo
   - Polished UI / responsive
   - Username modal + persistent name (localStorage)
   - Simulated peers (no server)
   - Timestamps, new-message indicator, enter-to-send, sound
*/

(() => {
  // DOM elements
  const chatBox = document.getElementById('chatBox');
  const composer = document.getElementById('composer');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const emojiBtn = document.getElementById('emojiBtn');
  const usernameModal = document.getElementById('usernameModal');
  const usernameInput = document.getElementById('usernameInput');
  const startBtn = document.getElementById('startBtn');
  const changeNameBtn = document.getElementById('changeNameBtn');
  const status = document.getElementById('status');
  const newIndicator = document.getElementById('newIndicator');
  const themeToggle = document.getElementById('themeToggle');

  // State
  let username = localStorage.getItem('minimal_chat_name') || '';
  let theme = localStorage.getItem('minimal_chat_theme') || 'light';
  const simulatedUsers = ['Olivia','Noah','Lucas','Emma','Mia','Ethan'];
  let simInterval = null;
  let unread = 0;

  // Apply theme at boot
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.innerText = theme === 'dark' ? '☀️' : '🌙';

  // Tiny notification sound (WebAudio)
  const beep = (() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      return () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.06);
      };
    } catch (e) {
      return () => {};
    }
  })();

  // Helpers
  const now = () => new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  function initials(name = '') {
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }

  function createMessageEl({who, text, type = 'received', time = now()}) {
    if (type === 'system') {
      const el = document.createElement('div');
      el.className = 'system-note';
      el.innerText = text;
      return el;
    }

    const wrap = document.createElement('div');
    wrap.className = 'message ' + (type === 'sent' ? 'sent' : 'received');

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerText = initials(who);

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = text;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<strong style="margin-right:8px">${who}</strong><span>${time}</span>`;

    const col = document.createElement('div');
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    col.appendChild(bubble);
    col.appendChild(meta);

    wrap.appendChild(avatar);
    wrap.appendChild(col);
    return wrap;
  }

  function appendMessage(opts) {
    const el = createMessageEl(opts);
    chatBox.appendChild(el);

    const atBottom = (chatBox.scrollTop + chatBox.clientHeight) >= (chatBox.scrollHeight - 40);

    // If user is at bottom, smooth scroll; otherwise show new indicator
    if (atBottom) {
      chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    } else {
      unread++;
      newIndicator.classList.remove('hidden');
      newIndicator.innerText = `${unread} new message${unread>1 ? 's' : ''} • click to jump`;
    }
  }

  // Jump to bottom when indicator clicked
  newIndicator.addEventListener('click', () => {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    unread = 0;
    newIndicator.classList.add('hidden');
  });

  // Composer behaviour
  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = messageInput.value.trim();
    if (!txt) return;
    appendMessage({who: username, text: txt, type: 'sent', time: now()});
    messageInput.value = '';
    messageInput.focus();

    // Simulated quick reply
    setTimeout(() => simulateReply(txt), 700 + Math.random()*900);
  });

  // Enter to send (already via form); support shift+Enter for newline if needed
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // Emoji quick insert (very small picker)
  const emojis = ['😊','👍','🎉','😄','💡','🔥','❤️'];
  emojiBtn.addEventListener('click', () => {
    messageInput.value += (messageInput.value ? ' ' : '') + pick(emojis);
    messageInput.focus();
  });

  // Username modal logic
  function showModal() {
    usernameModal.style.display = 'grid';
    usernameModal.setAttribute('aria-hidden', 'false');
    usernameInput.value = username || '';
    setTimeout(() => usernameInput.focus(), 60);
  }
  function hideModal() {
    usernameModal.style.display = 'none';
    usernameModal.setAttribute('aria-hidden', 'true');
  }

  startBtn.addEventListener('click', () => {
    const val = (usernameInput.value || '').trim() || genName();
    setName(val);
  });
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBtn.click();
  });

  changeNameBtn.addEventListener('click', () => {
    showModal();
  });

  function setName(name) {
    username = sanitize(name);
    localStorage.setItem('minimal_chat_name', username);
    hideModal();
    appendMessage({type:'system', text: `You joined as "${username}"`});
    startSimulation();
  }

  function sanitize(s) { return s.replace(/[<>]/g, '').slice(0, 20); }
  function genName() {
    const seeds = ['Avery','Rowan','Parker','Quinn','Emery','Harper','Sage','Blair'];
    return pick(seeds) + Math.floor(Math.random()*90 + 10);
  }

  // Simulated responses
  function simulateReply(userText) {
    const lower = userText.toLowerCase();
    let reply;
    if (lower.includes('hi') || lower.includes('hello')) reply = 'Hey there! 👋';
    else if (lower.includes('how') && lower.includes('you')) reply = "Doing well — thanks!";
    else if (lower.includes('github') || lower.includes('demo')) reply = "Works great on GitHub Pages!";
    else reply = pick([
      "Nice — love that.",
      "Totally agree.",
      "That's clever!",
      "Tell me more.",
      "Haha good one 🙂",
      "Love this demo!"
    ]);
    const who = pick(simulatedUsers);
    appendMessage({who, text: reply, type: 'received', time: now()});
    beep();
  }

  // Periodic simulated activity (join/leave/messages)
  function startSimulation() {
    if (simInterval) return;
    simInterval = setInterval(() => {
      const r = Math.random();
      if (r < 0.12) {
        const who = pick(simulatedUsers);
        appendMessage({type:'system', text: `${who} joined the chat`});
      } else if (r < 0.22) {
        const who = pick(simulatedUsers);
        appendMessage({type:'system', text: `${who} left the chat`});
      } else if (r < 0.72) {
        const who = pick(simulatedUsers);
        appendMessage({who, text: pick([
          "Nice one!",
          "I want to try that.",
          "Sounds good.",
          "Who else is on?",
          "Love the UI!"
        ]), type: 'received', time: now()});
        beep();
      } // else quiet
    }, 4200 + Math.random()*3000);
  }

  function stopSimulation() {
    clearInterval(simInterval);
    simInterval = null;
  }

  // Small utility
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    theme = (theme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('minimal_chat_theme', theme);
    themeToggle.innerText = theme === 'dark' ? '☀️' : '🌙';
  });

  // Keyboard accessibility: pressing / focuses input
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== messageInput) {
      e.preventDefault();
      messageInput.focus();
    }
  });

  // Initialize & boot
  (function boot() {
    if (!username) {
      showModal();
    } else {
      appendMessage({type:'system', text: `Welcome back — you are "${username}"`});
      startSimulation();
    }
    status.innerText = 'Client demo • simulated users';
  })();

  // Expose some helpers for debugging (optional)
  window.minimalChat = {
    appendMessage,
    setName,
    startSimulation,
    stopSimulation
  };
})();

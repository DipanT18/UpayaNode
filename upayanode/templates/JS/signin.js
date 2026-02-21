// ===========================
//  UpayaNode – signin.js
// ===========================

// ---- DOM refs ----
const passphraseInput = document.getElementById('passphraseInput');
const eyeBtn          = document.getElementById('eyeBtn');
const inputHint       = document.getElementById('inputHint');
const wordPills       = document.getElementById('wordPills');
const signInBtn       = document.getElementById('signInBtn');
const showForgotBtn   = document.getElementById('showForgotBtn');
const backToSignin    = document.getElementById('backToSignin');

const signinPanel  = document.getElementById('signinPanel');
const forgotPanel  = document.getElementById('forgotPanel');
const successPanel = document.getElementById('successPanel');
const nodeIdEl     = document.getElementById('nodeId');


// ---- Passphrase pattern: 5 lowercase words joined by hyphens ----
// Each word: 3–10 letters
const WORD_REGEX = /^[a-z]{3,10}$/;

function parseWords(raw) {
  // Split on hyphens, spaces, or commas — user might type slightly differently
  return raw.trim().toLowerCase().split(/[-\s,]+/).filter(Boolean);
}

function validatePassphrase(raw) {
  const words = parseWords(raw);
  if (words.length === 0) return { valid: false, words: [] };
  const allValid = words.every(w => WORD_REGEX.test(w));
  const complete = words.length === 5 && allValid;
  return { valid: complete, partial: allValid && words.length < 5, words };
}


// ---- Render word pills ----
function renderPills(words, complete) {
  wordPills.innerHTML = '';
  if (words.length === 0) return;
  words.forEach((w, i) => {
    const pill = document.createElement('span');
    pill.className = 'pill' + (complete || i < words.length - 1 ? '' : ' partial');
    pill.textContent = w;
    pill.style.animationDelay = `${i * 40}ms`;
    wordPills.appendChild(pill);
  });
}


// ---- Live input feedback ----
passphraseInput.addEventListener('input', () => {
  const raw = passphraseInput.value;
  const { valid, partial, words } = validatePassphrase(raw);

  renderPills(words, valid);

  if (!raw.trim()) {
    inputHint.textContent = '';
    inputHint.className = 'input-hint';
    passphraseInput.className = '';
    signInBtn.disabled = true;
    return;
  }

  if (valid) {
    inputHint.textContent = '✓ Passphrase looks complete';
    inputHint.className = 'input-hint ok';
    passphraseInput.className = 'ready';
    signInBtn.disabled = false;
  } else if (partial) {
    inputHint.textContent = `${words.length} of 5 words entered`;
    inputHint.className = 'input-hint';
    passphraseInput.className = '';
    signInBtn.disabled = true;
  } else {
    inputHint.textContent = 'Use the format: word-word-word-word-word';
    inputHint.className = 'input-hint err';
    passphraseInput.className = '';
    signInBtn.disabled = true;
  }
});


// ---- Enter key submits ----
passphraseInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !signInBtn.disabled) signInBtn.click();
});


// ---- Eye toggle ----
eyeBtn.addEventListener('click', () => {
  if (passphraseInput.type === 'password') {
    passphraseInput.type = 'text';
    eyeBtn.textContent = '🙈';
  } else {
    passphraseInput.type = 'password';
    eyeBtn.textContent = '👁';
  }
});


// ---- Sign In ----
signInBtn.addEventListener('click', () => {
  const raw = passphraseInput.value.trim();
  const { valid } = validatePassphrase(raw);
  if (!valid) return;

  // Simulate verification (replace with real hash-check API call)
  signInBtn.textContent = 'Verifying…';
  signInBtn.disabled = true;

  setTimeout(() => {
    // --- DEMO: always succeeds for prototype. Real logic: hash and compare. ---
    const success = true;

    if (success) {
      // Show success panel
      signinPanel.style.display = 'none';
      successPanel.style.display = 'flex';
      successPanel.style.animation = 'fadeUp 0.5s ease both';
      nodeIdEl.textContent = generateNodeId();
    } else {
      // Shake and show error
      signInBtn.textContent = 'Enter UpayaNode →';
      signInBtn.disabled = false;
      passphraseInput.classList.add('shake');
      inputHint.textContent = '✗ Passphrase not recognised';
      inputHint.className = 'input-hint err';
      setTimeout(() => passphraseInput.classList.remove('shake'), 500);
    }
  }, 1200);
});


// ---- Forgot flow ----
showForgotBtn.addEventListener('click', () => {
  signinPanel.style.display = 'none';
  forgotPanel.style.display = 'flex';
  forgotPanel.style.animation = 'fadeUp 0.45s ease both';
});

backToSignin.addEventListener('click', () => {
  forgotPanel.style.display = 'none';
  signinPanel.style.display = 'flex';
  signinPanel.style.animation = 'fadeUp 0.4s ease both';
});


// ---- Node ID generator ----
function generateNodeId() {
  return 'Node #' + Math.floor(1000 + Math.random() * 9000);
}


// ---- Ripple effect ----
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    if (this.disabled) return;
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute; border-radius:50%;
      width:${size}px; height:${size}px;
      top:${e.clientY - rect.top - size/2}px;
      left:${e.clientX - rect.left - size/2}px;
      background:rgba(255,255,255,0.2);
      transform:scale(0);
      animation:ripple 0.55s ease-out forwards;
      pointer-events:none; z-index:9;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Inject ripple keyframe
const s = document.createElement('style');
s.textContent = `@keyframes ripple { to { transform: scale(1); opacity: 0; } }`;
document.head.appendChild(s);
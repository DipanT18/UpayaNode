// ===========================
//  UpayaNode – signup.js
// ===========================

// ---- Word bank for passphrase generation ----
const WORDS = [
  "river","candle","stone","forest","amber","hollow","cedar","silver",
  "ember","dawn","falcon","gentle","harbor","indigo","jasper","lantern",
  "maple","nettle","ocean","pebble","quartz","raven","shadow","thistle",
  "umber","violet","willow","xenon","yellow","zenith","anchor","birch",
  "coral","drift","echo","fjord","gravel","heron","island","jungle",
  "kelp","lunar","mossy","north","orbit","pastel","quiet","russet",
  "slate","thorn","ultra","vapor","woven","xerus","yarrow","zinnia",
  "adobe","blaze","clover","dusty","elder","ferry","gloom","hazel",
  "ivory","joker","karma","lemon","mango","noble","onyx","pearl",
  "quest","ridge","storm","tiger","union","viper","walnut","xenial",
  "young","zephyr","axle","bloom","crisp","dense","eagle","fable",
  "globe","honey","inner","jagged","knoll","lofty","marsh","nimble",
  "oaken","plume","quill","rocky","sable","twist","upper","vista",
  "wheat","xeric","yucca","zilch","attic","brisk","crest","dune"
];

function generatePassphrase(wordCount = 5) {
  const chosen = [];
  const pool = [...WORDS];
  for (let i = 0; i < wordCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen.join('-');
}

function generateNodeId() {
  return 'Node #' + Math.floor(1000 + Math.random() * 9000);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// ---- State ----
let currentPassphrase = '';

// ---- DOM refs ----
const passphraseText = document.getElementById('passphraseText');
const copyBtn        = document.getElementById('copyBtn');
const copyLabel      = document.getElementById('copyLabel');
const generateBtn    = document.getElementById('generateBtn');
const warningBox     = document.getElementById('warningBox');
const toStep2Btn     = document.getElementById('toStep2');
const confirmInput   = document.getElementById('confirmInput');
const matchHint      = document.getElementById('matchHint');
const toStep3Btn     = document.getElementById('toStep3');
const backTo1Btn     = document.getElementById('backTo1');
const eyeBtn         = document.getElementById('eyeBtn');
const nodeIdEl       = document.getElementById('nodeId');

const panel1   = document.getElementById('panel1');
const panel2   = document.getElementById('panel2');
const panel3   = document.getElementById('panel3');
const step1dot = document.getElementById('step1dot');
const step2dot = document.getElementById('step2dot');
const step3dot = document.getElementById('step3dot');
const stepLines = document.querySelectorAll('.step-line');


// ---- Step navigation ----
function goToStep(n) {
  [panel1, panel2, panel3].forEach(p => p.classList.remove('active'));
  [step1dot, step2dot, step3dot].forEach(s => {
    s.classList.remove('active');
    if (!s.classList.contains('done')) s.style.background = '';
  });

  if (n === 1) {
    panel1.classList.add('active');
    step1dot.classList.add('active');
    stepLines.forEach(l => l.classList.remove('done'));
  } else if (n === 2) {
    panel2.classList.add('active');
    step1dot.classList.add('done');
    step2dot.classList.add('active');
    stepLines[0].classList.add('done');
    stepLines[1].classList.remove('done');
    confirmInput.value = '';
    matchHint.textContent = '';
    matchHint.className = 'input-hint';
    confirmInput.className = '';
    toStep3Btn.disabled = true;
  } else if (n === 3) {
    panel3.classList.add('active');
    step1dot.classList.add('done');
    step2dot.classList.add('done');
    step3dot.classList.add('active');
    step3dot.classList.add('done');
    stepLines.forEach(l => l.classList.add('done'));
    nodeIdEl.textContent = generateNodeId();
  }
}


// ---- Generate passphrase ----
generateBtn.addEventListener('click', () => {
  currentPassphrase = generatePassphrase(5);

  // Animate reveal
  passphraseText.style.opacity = '0';
  setTimeout(() => {
    passphraseText.textContent = currentPassphrase;
    passphraseText.style.transition = 'opacity 0.4s ease';
    passphraseText.style.opacity = '1';
  }, 150);

  copyBtn.disabled = false;
  warningBox.style.display = 'flex';
  toStep2Btn.style.display = 'flex';

  // Reset copy state
  copyLabel.textContent = 'Copy';
  copyBtn.classList.remove('copied');
});


// ---- Copy passphrase ----
copyBtn.addEventListener('click', () => {
  if (!currentPassphrase) return;
  navigator.clipboard.writeText(currentPassphrase).then(() => {
    copyLabel.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyLabel.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2500);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = currentPassphrase;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyLabel.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyLabel.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2500);
  });
});


// ---- Go to step 2 ----
toStep2Btn.addEventListener('click', () => goToStep(2));


// ---- Confirm input validation ----
confirmInput.addEventListener('input', () => {
  const val = confirmInput.value.trim();
  if (!val) {
    matchHint.textContent = '';
    matchHint.className = 'input-hint';
    confirmInput.className = '';
    toStep3Btn.disabled = true;
    return;
  }
  if (val === currentPassphrase) {
    matchHint.textContent = '✓ Passphrase matches';
    matchHint.className = 'input-hint ok';
    confirmInput.className = 'match';
    toStep3Btn.disabled = false;
  } else if (currentPassphrase.startsWith(val)) {
    matchHint.textContent = '...keep typing';
    matchHint.className = 'input-hint';
    confirmInput.className = '';
    toStep3Btn.disabled = true;
  } else {
    matchHint.textContent = '✗ Doesn\'t match';
    matchHint.className = 'input-hint err';
    confirmInput.className = 'no-match';
    toStep3Btn.disabled = true;
  }
});


// ---- Eye toggle ----
eyeBtn.addEventListener('click', () => {
  if (confirmInput.type === 'text') {
    confirmInput.type = 'password';
    eyeBtn.textContent = '👁';
  } else {
    confirmInput.type = 'text';
    eyeBtn.textContent = '🙈';
  }
});


// ---- Go to step 3 (create identity on server) ----
toStep3Btn.addEventListener('click', async () => {
  const raw = confirmInput.value.trim();
  if (raw !== currentPassphrase) return;

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || getCookie('csrftoken');
  toStep3Btn.disabled = true;
  toStep3Btn.textContent = 'Creating…';

  try {
    const res = await fetch(window.location.pathname, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify({ passphrase: currentPassphrase }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.node_id) {
      goToStep(3);
      nodeIdEl.textContent = data.node_id;
    } else {
      matchHint.textContent = data.error || 'Could not create identity. Try again.';
      matchHint.className = 'input-hint err';
      toStep3Btn.disabled = false;
      toStep3Btn.innerHTML = 'Confirm & Create Identity <span>→</span>';
    }
  } catch (e) {
    matchHint.textContent = 'Network error. Check connection and try again.';
    matchHint.className = 'input-hint err';
    toStep3Btn.disabled = false;
    toStep3Btn.innerHTML = 'Confirm & Create Identity <span>→</span>';
  }
});


// ---- Back to step 1 ----
backTo1Btn.addEventListener('click', () => {
  currentPassphrase = '';
  passphraseText.textContent = '— — — — —';
  copyBtn.disabled = true;
  warningBox.style.display = 'none';
  toStep2Btn.style.display = 'none';
  goToStep(1);
});


// ---- Ripple on buttons ----
document.querySelectorAll('.btn-primary, .btn-generate').forEach(btn => {
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
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Inject ripple keyframe
const s = document.createElement('style');
s.textContent = `@keyframes ripple { to { transform: scale(1); opacity: 0; } }`;
document.head.appendChild(s);
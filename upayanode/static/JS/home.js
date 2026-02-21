// ===========================
//  UpayaNode – home.js
// ===========================

// ── Session Node ID from server when logged in ──
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
}
const MY_NODE_ID = (typeof window.__NODE_ID__ !== 'undefined' && window.__NODE_ID__) ? window.__NODE_ID__ : ('Node #' + (localStorage.getItem('un_node') || (() => { const id = Math.floor(1000 + Math.random() * 9000); try { localStorage.setItem('un_node', id); } catch(e){} return id; })()));

// ── State: posts from server only (no dummy data) ──
let posts = (typeof window.__INITIAL_POSTS__ !== 'undefined' && Array.isArray(window.__INITIAL_POSTS__)) ? [...window.__INITIAL_POSTS__] : [];
let activeFilter  = 'all';
let activePostId  = null;
let mediaFile     = null;
let mobileMediaFile = null;

// ── DOM refs ──
const headerNodeText  = document.getElementById('headerNodeText');
const sidebarNodeId   = document.getElementById('sidebarNodeId');
const cardGrid        = document.getElementById('cardGrid');
const emptyState      = document.getElementById('emptyState');
const totalPostsEl    = document.getElementById('totalPosts');
const totalSolvesEl   = document.getElementById('totalSolves');
const totalNodesEl    = document.getElementById('totalNodes');
const searchInput     = document.getElementById('searchInput');
const filterBtns      = document.querySelectorAll('.filter-btn');

// Composer
const postForm        = document.getElementById('postForm');
const postText        = document.getElementById('postText');
const charCount       = document.getElementById('charCount');
const mediaZone       = document.getElementById('mediaZone');
const mediaInput      = document.getElementById('mediaInput');
const uploadPrompt    = document.getElementById('uploadPrompt');
const mediaPreview    = document.getElementById('mediaPreview');
const previewImg      = document.getElementById('previewImg');
const previewVid      = document.getElementById('previewVid');
const removeMedia     = document.getElementById('removeMedia');
const postBtn         = document.getElementById('postBtn');

// Solve modal
const solveOverlay    = document.getElementById('solveOverlay');
const solveModal      = document.getElementById('solveModal');
const modalClose      = document.getElementById('modalClose');
const modalNodeId     = document.getElementById('modalNodeId');
const modalProblem    = document.getElementById('modalProblem');
const modalSolves     = document.getElementById('modalSolves');
const solveInput      = document.getElementById('solveInput');
const solveCharCount  = document.getElementById('solveCharCount');
const solveSubmit     = document.getElementById('solveSubmit');
const mcNodeId        = document.getElementById('mcNodeId');

// Mobile composer
const fabCompose             = document.getElementById('fabCompose');
const mobileComposerOverlay  = document.getElementById('mobileComposerOverlay');
const mobileComposerClose    = document.getElementById('mobileComposerClose');
const mobilePostForm         = document.getElementById('mobilePostForm');
const mobilePostText         = document.getElementById('mobilePostText');
const mobileCharCount        = document.getElementById('mobileCharCount');
const mobileMediaZone        = document.getElementById('mobileMediaZone');
const mobileMediaInput       = document.getElementById('mobileMediaInput');
const mobileUploadPrompt     = document.getElementById('mobileUploadPrompt');
const mobileMediaPreview     = document.getElementById('mobileMediaPreview');
const mobilePreviewImg       = document.getElementById('mobilePreviewImg');
const mobilePreviewVid       = document.getElementById('mobilePreviewVid');
const mobileRemoveMedia      = document.getElementById('mobileRemoveMedia');
const mobilePostBtn          = document.getElementById('mobilePostBtn');


// ════════════════════════════
//  INIT
// ════════════════════════════
function init() {
  headerNodeText.textContent = MY_NODE_ID;
  sidebarNodeId.textContent  = MY_NODE_ID;
  mcNodeId.textContent       = 'You · ' + MY_NODE_ID;
  renderFeed();
  updateStats();
}


// ════════════════════════════
//  RENDER FEED
// ════════════════════════════
function renderFeed(query = '') {
  let filtered = posts;

  // Filter by solved status
  if (activeFilter === 'unsolved') filtered = filtered.filter(p => p.solves.length === 0);
  if (activeFilter === 'solved')   filtered = filtered.filter(p => p.solves.length > 0);

  // Search
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => p.text.toLowerCase().includes(q));
  }

  cardGrid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  filtered.forEach((post, i) => {
    const card = buildCard(post);
    card.style.animationDelay = `${i * 60}ms`;
    cardGrid.appendChild(card);
  });
}


// ════════════════════════════
//  BUILD CARD
// ════════════════════════════
function buildCard(post) {
  const card = document.createElement('div');
  card.className = 'problem-card';
  card.dataset.id = post.id;

  const initials = post.nodeId.replace('Node #', '#');
  const isSolved = post.solves.length > 0;
  const solveWord = post.solves.length === 1 ? 'solution' : 'solutions';

  // Media HTML
  let mediaHTML = '';
  if (post.media) {
    if (post.media.type === 'image') {
      mediaHTML = `<div class="card-media"><img src="${post.media.src}" alt="post media"/></div>`;
    } else {
      mediaHTML = `<div class="card-media"><video src="${post.media.src}" controls></video></div>`;
    }
  }

  // Read more (will be activated by JS if text is long)
  card.innerHTML = `
    <div class="card-topbar">
      <div class="card-node-info">
        <div class="card-node-avatar">${initials}</div>
        <div>
          <span class="card-node-name">${post.nodeId}</span>
          <span class="card-node-sub">Anonymous · Community</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${isSolved ? `<span class="card-solved-badge">✓ Responses</span>` : ''}
        <span class="card-time">${post.time}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-text-wrap">
        <p class="card-text" id="ct-${post.id}">${escapeHtml(post.text)}</p>
      </div>
      <button class="card-read-more" id="rm-${post.id}">Read more ↓</button>
    </div>
    ${mediaHTML}
    <div class="card-footer">
      <span class="solve-count">
        <span class="solve-count-num">${post.solves.length}</span>
        ${solveWord}
      </span>
      <button class="btn-open-solve" data-id="${post.id}">
        <span class="solve-icon">💡</span> Solve It
      </button>
    </div>
  `;

  // Activate read more after paint — rAF ensures layout is complete
  requestAnimationFrame(() => {
    const ct = card.querySelector(`#ct-${post.id}`);
    const rm = card.querySelector(`#rm-${post.id}`);
    if (!ct || !rm) return;
    // clamped: scrollHeight exceeds the visible clientHeight
    if (ct.scrollHeight > ct.clientHeight + 1) {
      rm.style.display = 'inline-block';
      rm.addEventListener('click', () => {
        const expanded = ct.classList.toggle('expanded');
        rm.textContent = expanded ? 'Show less ↑' : 'Read more ↓';
      });
    }
  });

  // Solve button
  card.querySelector('.btn-open-solve').addEventListener('click', () => openSolveModal(post.id));

  return card;
}


// ════════════════════════════
//  SOLVE MODAL
// ════════════════════════════
function openSolveModal(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  activePostId = postId;

  modalNodeId.textContent = 'Posted by ' + post.nodeId;

  // Problem display
  let mediaHTML = '';
  if (post.media) {
    if (post.media.type === 'image') {
      mediaHTML = `<div class="mp-media"><img src="${post.media.src}" alt=""/></div>`;
    } else {
      mediaHTML = `<div class="mp-media"><video src="${post.media.src}" controls></video></div>`;
    }
  }
  modalProblem.innerHTML = `<p class="mp-text">${escapeHtml(post.text)}</p>${mediaHTML}`;

  renderSolves(post);

  solveInput.value = '';
  solveCharCount.textContent = '0 / 400';
  solveSubmit.disabled = true;

  solveOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderSolves(post) {
  modalSolves.innerHTML = '';

  if (post.solves.length === 0) {
    modalSolves.innerHTML = `
      <div class="no-solves">
        <span class="no-solves-icon">🤔</span>
        No solutions yet. Be the first to help.
      </div>`;
    return;
  }

  post.solves.forEach((s, i) => {
    const initials = s.nodeId.replace('Node #', '#');
    const isMine = s.nodeId === MY_NODE_ID;
    const entry = document.createElement('div');
    entry.className = 'solve-entry' + (isMine ? ' mine' : '');
    entry.style.animationDelay = `${i * 50}ms`;
    entry.innerHTML = `
      <div class="solve-avatar">${initials}</div>
      <div class="solve-bubble">
        <div class="solve-bubble-header">
          <span class="solve-bubble-node">${s.nodeId}${isMine ? ' · You' : ''}</span>
          <span class="solve-bubble-time">${s.time}</span>
        </div>
        <p class="solve-bubble-text">${escapeHtml(s.text)}</p>
      </div>
    `;
    modalSolves.appendChild(entry);
  });

  // Scroll to bottom of solves
  setTimeout(() => { modalSolves.scrollTop = modalSolves.scrollHeight; }, 80);
}

function closeSolveModal() {
  solveOverlay.classList.remove('open');
  document.body.style.overflow = '';
  activePostId = null;
}

modalClose.addEventListener('click', closeSolveModal);
solveOverlay.addEventListener('click', (e) => { if (e.target === solveOverlay) closeSolveModal(); });

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSolveModal();
    closeMobileComposer();
  }
});

// Solve input
solveInput.addEventListener('input', () => {
  const len = solveInput.value.length;
  solveCharCount.textContent = `${len} / 400`;
  solveSubmit.disabled = len < 5;
});

// Submit solve (API when on feed, else local)
solveSubmit.addEventListener('click', async () => {
  const text = solveInput.value.trim();
  if (!text || !activePostId) return;

  const post = posts.find(p => p.id === activePostId);
  if (!post) return;

  const csrf = getCsrfToken();
  if (csrf) {
    try {
      const res = await fetch(`/api/post/${activePostId}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.solve) {
        post.solves.push(data.solve);
        solveInput.value = '';
        solveCharCount.textContent = '0 / 400';
        solveSubmit.disabled = true;
        renderSolves(post);
        updateCardSolveCount(post);
        updateStats();
        return;
      }
    } catch (err) {}
  }

  post.solves.push({
    nodeId: MY_NODE_ID,
    text,
    time: 'Just now',
    mine: true
  });
  solveInput.value = '';
  solveCharCount.textContent = '0 / 400';
  solveSubmit.disabled = true;
  renderSolves(post);
  updateCardSolveCount(post);
  updateStats();
});


// ════════════════════════════
//  COMPOSER — Desktop
// ════════════════════════════
postText.addEventListener('input', () => {
  const len = postText.value.length;
  charCount.textContent = `${len} / 500`;
  charCount.classList.toggle('warn', len > 420);
  postBtn.disabled = len < 10;
});

// Media upload zone click
mediaZone.addEventListener('click', () => {
  if (mediaFile) return; // already has media
  mediaInput.click();
});

mediaInput.addEventListener('change', () => {
  const file = mediaInput.files[0];
  if (!file) return;
  handleMediaFile(file, 'desktop');
});

// Drag and drop
mediaZone.addEventListener('dragover', (e) => { e.preventDefault(); mediaZone.style.borderColor = 'var(--red-primary)'; });
mediaZone.addEventListener('dragleave', () => { mediaZone.style.borderColor = ''; });
mediaZone.addEventListener('drop', (e) => {
  e.preventDefault();
  mediaZone.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) handleMediaFile(file, 'desktop');
});

removeMedia.addEventListener('click', (e) => {
  e.stopPropagation();
  clearMedia('desktop');
});

function handleMediaFile(file, mode) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    if (mode === 'desktop') {
      mediaFile = { src: ev.target.result, type: isImage ? 'image' : 'video' };
      uploadPrompt.style.display = 'none';
      mediaPreview.style.display = 'flex';
      if (isImage) {
        previewImg.src = ev.target.result;
        previewImg.style.display = 'block';
        previewVid.style.display = 'none';
      } else {
        previewVid.src = ev.target.result;
        previewVid.style.display = 'block';
        previewImg.style.display = 'none';
      }
    } else {
      mobileMediaFile = { src: ev.target.result, type: isImage ? 'image' : 'video' };
      mobileUploadPrompt.style.display = 'none';
      mobileMediaPreview.style.display = 'flex';
      if (isImage) {
        mobilePreviewImg.src = ev.target.result;
        mobilePreviewImg.style.display = 'block';
        mobilePreviewVid.style.display = 'none';
      } else {
        mobilePreviewVid.src = ev.target.result;
        mobilePreviewVid.style.display = 'block';
        mobilePreviewImg.style.display = 'none';
      }
    }
  };
  reader.readAsDataURL(file);
}

function clearMedia(mode) {
  if (mode === 'desktop') {
    mediaFile = null;
    mediaInput.value = '';
    uploadPrompt.style.display = 'flex';
    mediaPreview.style.display = 'none';
    previewImg.src = ''; previewVid.src = '';
    previewImg.style.display = 'none'; previewVid.style.display = 'none';
  } else {
    mobileMediaFile = null;
    mobileMediaInput.value = '';
    mobileUploadPrompt.style.display = 'flex';
    mobileMediaPreview.style.display = 'none';
    mobilePreviewImg.src = ''; mobilePreviewVid.src = '';
    mobilePreviewImg.style.display = 'none'; mobilePreviewVid.style.display = 'none';
  }
}

// Submit post (API when on feed, else local)
async function submitPost(text, media) {
  const csrf = getCsrfToken();
  if (csrf) {
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.post) {
        posts.unshift(data.post);
        renderFeed(searchInput.value);
        updateStats();
        return;
      }
    } catch (err) {}
  }
  const newPost = {
    id: 'p' + Date.now(),
    nodeId: MY_NODE_ID,
    text: text.trim(),
    media: media || null,
    time: 'Just now',
    solves: []
  };
  posts.unshift(newPost);
  renderFeed(searchInput.value);
  updateStats();
}

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = postText.value.trim();
  if (text.length < 10) return;

  postBtn.disabled = true;
  await submitPost(text, mediaFile);

  postText.value = '';
  charCount.textContent = '0 / 500';
  charCount.classList.remove('warn');
  postBtn.disabled = true;
  clearMedia('desktop');
});


// ════════════════════════════
//  MOBILE COMPOSER
// ════════════════════════════
fabCompose.addEventListener('click', () => {
  mobileComposerOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
});

function closeMobileComposer() {
  mobileComposerOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

mobileComposerClose.addEventListener('click', closeMobileComposer);
mobileComposerOverlay.addEventListener('click', (e) => {
  if (e.target === mobileComposerOverlay) closeMobileComposer();
});

mobilePostText.addEventListener('input', () => {
  const len = mobilePostText.value.length;
  mobileCharCount.textContent = `${len} / 500`;
  mobileCharCount.classList.toggle('warn', len > 420);
  mobilePostBtn.disabled = len < 10;
});

mobileMediaZone.addEventListener('click', () => {
  if (mobileMediaFile) return;
  mobileMediaInput.click();
});
mobileMediaInput.addEventListener('change', () => {
  const file = mobileMediaInput.files[0];
  if (file) handleMediaFile(file, 'mobile');
});
mobileRemoveMedia.addEventListener('click', (e) => {
  e.stopPropagation();
  clearMedia('mobile');
});

mobilePostForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = mobilePostText.value.trim();
  if (text.length < 10) return;

  mobilePostBtn.disabled = true;
  await submitPost(text, mobileMediaFile);

  mobilePostText.value = '';
  mobileCharCount.textContent = '0 / 500';
  mobilePostBtn.disabled = true;
  clearMedia('mobile');
  closeMobileComposer();
});


// ════════════════════════════
//  FILTERS
// ════════════════════════════
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderFeed(searchInput.value);
  });
});


// ════════════════════════════
//  SEARCH
// ════════════════════════════
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderFeed(searchInput.value), 220);
});


// ════════════════════════════
//  STATS
// ════════════════════════════
function updateStats() {
  const totalSolves = posts.reduce((sum, p) => sum + p.solves.length, 0);
  const uniqueNodes = new Set([
    ...posts.map(p => p.nodeId),
    ...posts.flatMap(p => p.solves.map(s => s.nodeId))
  ]).size;

  animateCount(totalPostsEl,  parseInt(totalPostsEl.textContent)  || 0, posts.length);
  animateCount(totalSolvesEl, parseInt(totalSolvesEl.textContent) || 0, totalSolves);
  animateCount(totalNodesEl,  parseInt(totalNodesEl.textContent)  || 0, uniqueNodes);
}

function animateCount(el, from, to) {
  if (from === to) return;
  const step = to > from ? 1 : -1;
  const diff = Math.abs(to - from);
  const delay = Math.max(10, 300 / diff);
  let cur = from;
  const timer = setInterval(() => {
    cur += step;
    el.textContent = cur;
    if (cur === to) clearInterval(timer);
  }, delay);
}

function updateCardSolveCount(post) {
  const card = cardGrid.querySelector(`[data-id="${post.id}"]`);
  if (!card) return;
  const scNum  = card.querySelector('.solve-count-num');
  const scWord = card.querySelector('.solve-count');
  if (scNum) scNum.textContent = post.solves.length;
  if (scWord) {
    const word = post.solves.length === 1 ? 'solution' : 'solutions';
    scWord.innerHTML = `<span class="solve-count-num">${post.solves.length}</span> ${word}`;
  }
  // Add solved badge if first solve
  if (post.solves.length === 1) {
    const topbar = card.querySelector('.card-topbar > div:last-child');
    if (topbar && !topbar.querySelector('.card-solved-badge')) {
      const badge = document.createElement('span');
      badge.className = 'card-solved-badge';
      badge.textContent = '✓ Responses';
      topbar.prepend(badge);
    }
  }
}


// ════════════════════════════
//  UTILITY
// ════════════════════════════
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ════════════════════════════
//  START
// ════════════════════════════
init();
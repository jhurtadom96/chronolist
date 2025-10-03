/* public/app.js */
const API = '/api';
const listEl = document.getElementById('list');
const mePosEl = document.getElementById('me-pos');
const countEl = document.getElementById('count');
const nameEl = document.getElementById('name');
const leaveBtn = document.getElementById('leave-btn');
const nextBtn = document.getElementById('next-btn');
const resetBtn = document.getElementById('reset-btn');
const adminTokenEl = document.getElementById('adminToken');

// Load persisted fields
nameEl.value = localStorage.getItem('chronolist:name') || '';
adminTokenEl.value = localStorage.getItem('chronolist:admin') || '';

function saveLocal() {
  localStorage.setItem('chronolist:name', nameEl.value.trim());
  localStorage.setItem('chronolist:admin', adminTokenEl.value);
}

adminTokenEl.addEventListener('input', saveLocal);
nameEl.addEventListener('input', saveLocal);

async function fetchJSON(url, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

function renderList(items) {
  listEl.innerHTML = '';
  items.forEach(it => {
    const li = document.createElement('li');
    const dt = new Date(it.createdAt);
    li.innerHTML = `<strong>#${it.position}</strong> ${escapeHtml(it.name)} <span class="muted">— ${dt.toLocaleString()}</span>`;
    listEl.appendChild(li);
  });
}

function updateMePosition(items) {
  const myName = nameEl.value.trim();
  const mine = items.find(i => i.name === myName);
  mePosEl.textContent = mine ? `Estás en la posición #${mine.position}` : 'No estás en la lista.';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

async function refresh() {
  try {
    const data = await fetchJSON(`${API}/list`);
    renderList(data.items);
    updateMePosition(data.items);
    countEl.textContent = `${data.total}/${data.max}`;
  } catch (e) {
    console.error(e);
  }
}

document.getElementById('join-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  saveLocal();
  const name = nameEl.value.trim();
  if (!name) return alert('Pon un nombre');
  try {
    await fetchJSON(`${API}/join`, { method: 'POST', body: JSON.stringify({ name }) });
    await refresh();
  } catch (e) {
    alert(e.message);
  }
});

leaveBtn.addEventListener('click', async () => {
  const name = nameEl.value.trim();
  if (!name) return alert('Pon tu nombre para salir');
  try {
    await fetchJSON(`${API}/leave`, { method: 'POST', body: JSON.stringify({ name }) });
    await refresh();
  } catch (e) {
    alert(e.message);
  }
});

nextBtn.addEventListener('click', async () => {
  saveLocal();
  try {
    await fetchJSON(`${API}/next`, {
      method: 'POST',
      headers: { 'x-admin-token': adminTokenEl.value }
    });
    await refresh();
  } catch (e) {
    alert(e.message);
  }
});

resetBtn.addEventListener('click', async () => {
  saveLocal();
  if (!confirm('¿Seguro que quieres vaciar la lista?')) return;
  try {
    await fetchJSON(`${API}/reset`, {
      method: 'POST',
      headers: { 'x-admin-token': adminTokenEl.value }
    });
    await refresh();
  } catch (e) {
    alert(e.message);
  }
});

// Poll every 5s for simplicity (could use SSE/WebSocket for live updates)
setInterval(refresh, 5000);
refresh();

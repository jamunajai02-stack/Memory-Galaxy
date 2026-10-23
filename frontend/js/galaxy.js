(async function galaxyApp() {
  if (!Auth.requireAuth()) return;

  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  const hoverTip = document.getElementById('hover-tip');
  const toast = document.getElementById('toast');
  const CATEGORIES = ['All', 'Travel', 'Family', 'Friends', 'College', 'Love', 'Achievement', 'Birthday', 'Festival', 'Adventure', 'Other'];
  const EMOTIONS = ['All', 'Happy', 'Sad', 'Excited', 'Love', 'Peaceful', 'Nostalgic', 'Grateful', 'Scared', 'Proud'];
  const CREATE_CATEGORIES = CATEGORIES.slice(1);
  const CREATE_EMOTIONS = EMOTIONS.slice(1);

  let memories = [];
  let filtered = [];
  let dust = [];
  let bulge = [];
  let clouds = [];
  let shots = [];
  let selected = null;
  let hovered = null;
  let categoryFilter = 'All';
  let emotionFilter = 'All';
  let paused = false;
  let time = 0;
  let rot = 0;
  const camera = { x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tzoom: 1 };
  const mouse = { x: 0, y: 0, down: false, pointers: new Map() };
  let pinchStart = 0;

  function notify(message) {
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function seedGalaxy() {
    dust = [];
    bulge = [];
    clouds = [];
    const arms = 4;
    for (let i = 0; i < 2600; i += 1) {
      const arm = i % arms;
      const dist = Math.pow(Math.random(), 0.62) * 980;
      const twist = dist * 0.013;
      const angle = arm * ((Math.PI * 2) / arms) + twist + (Math.random() - 0.5) * 0.42;
      dust.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.48,
        z: (Math.random() - 0.5) * (30 + dist * 0.06),
        r: Math.random() * 1.35 + 0.15,
        tw: Math.random() * 6,
        tone: Math.random()
      });
    }
    for (let i = 0; i < 420; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.pow(Math.random(), 0.55) * 110;
      bulge.push({
        x: Math.cos(a) * d,
        y: Math.sin(a) * d * 0.55,
        z: (Math.random() - 0.5) * 28,
        r: Math.random() * 1.8 + 0.3,
        tw: Math.random() * 6
      });
    }
    clouds = [
      { x: -180, y: -40, r: 260, c: 'rgba(109,40,217,0.16)' },
      { x: 210, y: 30, r: 280, c: 'rgba(219,39,119,0.12)' },
      { x: 20, y: 90, r: 220, c: 'rgba(34,211,238,0.08)' }
    ];
  }

  function rotatePoint(x, y) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    return { x: x * c - y * s, y: x * s + y * c };
  }

  function project(x, y, z = 0) {
    const p = rotatePoint(x, y);
    const depth = 1 + z / 900;
    const px = (mouse.x / Math.max(canvas.width, 1) - 0.5) * 28;
    const py = (mouse.y / Math.max(canvas.height, 1) - 0.5) * 18;
    return {
      x: canvas.width / 2 + (p.x + camera.x) * camera.zoom * depth + px * depth,
      y: canvas.height / 2 + (p.y + camera.y) * camera.zoom * depth + py * depth
    };
  }

  function posOf(memory) {
    return memory.starPosition || { x: 0, y: 0, z: 0 };
  }

  function applyFilters() {
    const q = document.getElementById('search').value.trim().toLowerCase();
    filtered = memories.filter((memory) => {
      const hay = `${memory.starName} ${memory.title} ${memory.category} ${memory.location} ${memory.emotion} ${memory.plainTextContent || ''} ${memory.date || ''}`.toLowerCase();
      return (!q || hay.includes(q))
        && (categoryFilter === 'All' || memory.category === categoryFilter)
        && (emotionFilter === 'All' || memory.emotion === emotionFilter);
    });
  }

  function hitTest(px, py) {
    let found = null;
    let best = 26;
    filtered.forEach((memory) => {
      const star = posOf(memory);
      const p = project(star.x, star.y, star.z);
      const radius = Math.max(14, (memory.starSize || 9) * 2.8 * camera.zoom);
      const dist = Math.hypot(p.x - px, p.y - py);
      if (dist < radius && dist < best) {
        best = dist;
        found = memory;
      }
    });
    return found;
  }

  function zoomTo(memory, amount = 2.2) {
    const star = posOf(memory);
    const p = rotatePoint(star.x, star.y);
    camera.tx = -p.x;
    camera.ty = -p.y;
    camera.tzoom = amount;
  }

  function drawCore() {
    const p = project(0, 0, 0);
    const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 180 * camera.zoom);
    g.addColorStop(0, 'rgba(255, 244, 210, 0.95)');
    g.addColorStop(0.18, 'rgba(251, 191, 36, 0.28)');
    g.addColorStop(0.45, 'rgba(168, 85, 247, 0.12)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 180 * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMemoryStar(memory, index, highlight) {
    const star = posOf(memory);
    const drift = paused ? 0 : 1;
    const p = project(
      star.x + Math.sin(time * 0.35 + index) * 4 * drift,
      star.y + Math.cos(time * 0.32 + index) * 3 * drift,
      star.z
    );
    const radius = (memory.starSize || 9) * camera.zoom;
    const color = memory.starColor || '#f5d76e';
    const pulse = 0.85 + Math.sin(time * 2 + index) * 0.12;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * (highlight ? 9 : 6.5));
    glow.addColorStop(0, color);
    glow.addColorStop(0.22, color);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * (highlight ? 9 : 6.5), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, camera.zoom * 0.8);
    ctx.beginPath();
    ctx.moveTo(p.x - radius * 3.2, p.y);
    ctx.lineTo(p.x + radius * 3.2, p.y);
    ctx.moveTo(p.x, p.y - radius * 3.2);
    ctx.lineTo(p.x, p.y + radius * 3.2);
    ctx.stroke();

    ctx.fillStyle = '#fffef8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2.2, radius * pulse * 0.42), 0, Math.PI * 2);
    ctx.fill();

    if (camera.zoom > 0.85 || highlight) {
      ctx.fillStyle = highlight ? '#fff' : 'rgba(244,241,255,0.92)';
      ctx.font = `${Math.max(11, 12 * camera.zoom)}px "Exo 2", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(memory.starName || 'Star', p.x, p.y + radius * 4.4);
    }
    return p;
  }

  function loop() {
    time += 0.016;
    if (!paused) rot += 0.00055;
    camera.x += (camera.tx - camera.x) * 0.08;
    camera.y += (camera.ty - camera.y) * 0.08;
    camera.zoom += (camera.tzoom - camera.zoom) * 0.08;

    ctx.fillStyle = '#020010';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    clouds.forEach((cloud) => {
      const p = project(cloud.x, cloud.y, 0);
      const g = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, cloud.r * camera.zoom);
      g.addColorStop(0, cloud.c);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, cloud.r * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    drawCore();

    dust.forEach((star) => {
      const p = project(star.x, star.y, star.z);
      const alpha = 0.18 + Math.abs(Math.sin(time * 1.6 + star.tw)) * 0.55;
      const shade = star.tone > 0.8 ? '180,210,255' : star.tone > 0.55 ? '255,246,216' : '255,210,230';
      ctx.fillStyle = `rgba(${shade},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r * camera.zoom * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    bulge.forEach((star) => {
      const p = project(star.x, star.y, star.z);
      ctx.fillStyle = `rgba(255,236,180,${0.4 + Math.abs(Math.sin(time + star.tw)) * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r * camera.zoom * 0.55, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!paused && Math.random() < 0.015) {
      shots.push({
        x: -700 + Math.random() * 200,
        y: -320 + Math.random() * 200,
        vx: 11 + Math.random() * 6,
        vy: 4 + Math.random() * 3,
        life: 1
      });
    }
    shots.forEach((shot, i) => {
      shot.x += shot.vx;
      shot.y += shot.vy;
      shot.life -= 0.018;
      const a = project(shot.x, shot.y, 20);
      const b = project(shot.x - 80, shot.y - 32, 20);
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(shot.life, 0)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (shot.life <= 0) shots.splice(i, 1);
    });

    filtered.forEach((memory, index) => {
      drawMemoryStar(memory, index, selected && selected.id === memory.id);
    });

    requestAnimationFrame(loop);
  }

  async function openDiary(memory) {
    selected = memory;
    paused = true;
    zoomTo(memory, 2.4);
    document.getElementById('diary').hidden = false;
    document.getElementById('diary-star').textContent = `✦ ${memory.starName}`;
    document.getElementById('diary-title').textContent = memory.title;
    document.getElementById('diary-date').textContent = memory.date ? new Date(memory.date).toLocaleDateString() : '';
    document.getElementById('diary-location').textContent = memory.location || '—';
    document.getElementById('diary-category').textContent = memory.category || '—';
    document.getElementById('diary-emotion').textContent = memory.emotion || '—';
    document.getElementById('diary-content').innerHTML = memory.content || '<p></p>';
    document.getElementById('edit-link').href = `memory.html?id=${memory.id}`;
    const photos = document.getElementById('diary-photos');
    photos.innerHTML = '';
    for (const image of memory.images || []) {
      const card = document.createElement('div');
      card.className = 'photo-card';
      const img = document.createElement('img');
      img.alt = image.originalName || 'Memory photo';
      img.src = await MemoryAPI.mediaUrl(image.filename);
      card.appendChild(img);
      photos.appendChild(card);
    }
  }

  function closeDiary() {
    document.getElementById('diary').hidden = true;
    selected = null;
    paused = false;
    camera.tx = 0;
    camera.ty = 0;
    camera.tzoom = 1;
  }

  function currentIndex() {
    return filtered.findIndex((memory) => memory.id === selected?.id);
  }

  function renderStats() {
    const photos = memories.reduce((sum, memory) => sum + (memory.images?.length || 0), 0);
    const cats = new Set(memories.map((memory) => memory.category));
    const happy = memories.filter((memory) => memory.emotion === 'Happy' || memory.emotion === 'Love').length;
    document.getElementById('stats').innerHTML = `
      <span>✨ ${memories.length} Stars</span>
      <span>📸 ${photos} Photos</span>
      <span>🌟 ${cats.size} Categories</span>
      <span>❤️ ${happy} Happy Moments</span>
    `;
    const user = Auth.getUser() || {};
    document.getElementById('welcome-text').textContent =
      `Welcome back, ${user.name || 'explorer'}. Your universe contains ${memories.length} ${memories.length === 1 ? 'star' : 'stars'}.`;
    document.getElementById('empty-state').hidden = memories.length > 0;
  }

  function fillSelect(select, values) {
    select.innerHTML = '';
    values.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }

  function renderFilters() {
    const wrap = document.getElementById('filters');
    wrap.innerHTML = '';
    CATEGORIES.forEach((name) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      button.className = name === categoryFilter ? 'active' : '';
      button.addEventListener('click', () => {
        categoryFilter = name;
        applyFilters();
        renderFilters();
      });
      wrap.appendChild(button);
    });
    CREATE_EMOTIONS.forEach((name) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      button.className = name === emotionFilter ? 'active' : '';
      button.addEventListener('click', () => {
        emotionFilter = emotionFilter === name ? 'All' : name;
        applyFilters();
        renderFilters();
      });
      wrap.appendChild(button);
    });
  }

  function renderTimeline() {
    const tree = document.getElementById('timeline-tree');
    const groups = {};
    memories.forEach((memory) => {
      const date = new Date(memory.date || memory.createdAt);
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'long' });
      groups[year] = groups[year] || {};
      groups[year][month] = groups[year][month] || [];
      groups[year][month].push(memory);
    });
    tree.innerHTML = '';
    Object.keys(groups).sort((a, b) => b - a).forEach((year) => {
      const yearEl = document.createElement('div');
      yearEl.className = 'year';
      yearEl.textContent = year;
      tree.appendChild(yearEl);
      Object.keys(groups[year]).forEach((month) => {
        const monthEl = document.createElement('div');
        monthEl.className = 'month';
        monthEl.textContent = month;
        tree.appendChild(monthEl);
        groups[year][month].forEach((memory) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'timeline-item';
          item.textContent = `${memory.starName} · ${memory.title}`;
          item.addEventListener('click', () => openDiary(memory));
          tree.appendChild(item);
        });
      });
    });
  }

  function renderSearch() {
    const box = document.getElementById('search-results');
    const q = document.getElementById('search').value.trim().toLowerCase();
    applyFilters();
    if (!q) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = '';
    filtered.forEach((memory) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${memory.starName} · ${memory.title}`;
      button.addEventListener('click', () => {
        box.hidden = true;
        openDiary(memory);
      });
      box.appendChild(button);
    });
  }

  function openCreate() {
    document.getElementById('create-star').hidden = false;
    document.getElementById('q-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('q-starName').focus();
  }

  function closeCreate() {
    document.getElementById('create-star').hidden = true;
    document.getElementById('q-error').hidden = true;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  canvas.addEventListener('pointerdown', (event) => {
    mouse.down = true;
    mouse.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (mouse.pointers.size === 2) {
      const pts = [...mouse.pointers.values()];
      pinchStart = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  });
  canvas.addEventListener('pointermove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (mouse.pointers.has(event.pointerId)) {
      mouse.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (mouse.pointers.size === 2) {
      const pts = [...mouse.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStart) {
        camera.tzoom = Math.min(4.2, Math.max(0.45, camera.tzoom * (dist / pinchStart)));
        pinchStart = dist;
      }
    } else if (mouse.down) {
      camera.tx += event.movementX / camera.zoom;
      camera.ty += event.movementY / camera.zoom;
    }
    hovered = hitTest(mouse.x, mouse.y);
    if (!hovered) {
      hoverTip.hidden = true;
      canvas.style.cursor = mouse.down ? 'grabbing' : 'grab';
      return;
    }
    canvas.style.cursor = 'pointer';
    hoverTip.hidden = false;
    hoverTip.style.left = `${mouse.x}px`;
    hoverTip.style.top = `${mouse.y}px`;
    hoverTip.innerHTML = `<strong>${hovered.starName}</strong><br>${hovered.title}<br>${hovered.date ? new Date(hovered.date).toLocaleDateString() : ''}`;
  });
  window.addEventListener('pointerup', (event) => {
    mouse.down = false;
    mouse.pointers.delete(event.pointerId);
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    camera.tzoom = Math.min(4.2, Math.max(0.45, camera.tzoom * (event.deltaY > 0 ? 0.9 : 1.1)));
  }, { passive: false });
  canvas.addEventListener('click', () => {
    const hit = hitTest(mouse.x, mouse.y);
    if (hit) openDiary(hit);
  });
  canvas.addEventListener('dblclick', () => {
    const hit = hitTest(mouse.x, mouse.y);
    if (hit) {
      zoomTo(hit, 3.1);
      openDiary(hit);
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());
  document.getElementById('close-diary').addEventListener('click', closeDiary);
  document.getElementById('new-star-btn').addEventListener('click', openCreate);
  document.getElementById('fab-create').addEventListener('click', openCreate);
  document.getElementById('empty-create').addEventListener('click', openCreate);
  document.getElementById('close-create').addEventListener('click', closeCreate);
  document.getElementById('prev-memory').addEventListener('click', () => {
    const index = currentIndex();
    if (index > 0) openDiary(filtered[index - 1]);
  });
  document.getElementById('next-memory').addEventListener('click', () => {
    const index = currentIndex();
    if (index >= 0 && index < filtered.length - 1) openDiary(filtered[index + 1]);
  });
  document.getElementById('delete-memory').addEventListener('click', async () => {
    if (!selected) return;
    if (!confirm('Are you sure you want to let this star disappear forever?')) return;
    await MemoryAPI.deleteMemory(selected.id);
    memories = memories.filter((memory) => memory.id !== selected.id);
    applyFilters();
    renderStats();
    closeDiary();
    notify('The star faded from your galaxy.');
  });
  document.getElementById('timeline-btn').addEventListener('click', () => {
    const panel = document.getElementById('timeline');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderTimeline();
  });
  document.getElementById('close-timeline').addEventListener('click', () => {
    document.getElementById('timeline').hidden = true;
  });
  document.getElementById('search').addEventListener('input', renderSearch);

  fillSelect(document.getElementById('q-category'), CREATE_CATEGORIES);
  fillSelect(document.getElementById('q-emotion'), CREATE_EMOTIONS);
  document.getElementById('q-photos').addEventListener('change', (event) => {
    const count = event.target.files.length;
    document.getElementById('q-files').textContent = count ? `${count} photo${count === 1 ? '' : 's'} ready` : '';
  });

  document.getElementById('quick-star-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('q-error');
    error.hidden = true;
    const starName = document.getElementById('q-starName').value.trim();
    const title = document.getElementById('q-title').value.trim();
    if (!starName || !title) {
      error.hidden = false;
      error.textContent = 'Name the star and the memory first.';
      return;
    }
    const form = new FormData();
    form.append('starName', starName);
    form.append('title', title);
    form.append('date', document.getElementById('q-date').value);
    form.append('location', document.getElementById('q-location').value.trim());
    form.append('category', document.getElementById('q-category').value);
    form.append('emotion', document.getElementById('q-emotion').value);
    const text = document.getElementById('q-content').value.trim();
    form.append('content', text ? `<p>${escapeHtml(text)}</p>` : '<p></p>');
    [...document.getElementById('q-photos').files].forEach((file) => form.append('photos', file));
    try {
      const created = await MemoryAPI.createMemory(form);
      memories.unshift(created.memory);
      applyFilters();
      renderStats();
      closeCreate();
      document.getElementById('quick-star-form').reset();
      document.getElementById('q-files').textContent = '';
      notify(`✦ ${created.memory.starName} was born in your galaxy.`);
      openDiary(created.memory);
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });

  window.addEventListener('resize', resize);
  resize();
  seedGalaxy();
  loop();

  try {
    const profile = await MemoryAPI.profile();
    Auth.setSession({ user: profile.user });
    const data = await MemoryAPI.listMemories();
    memories = data.memories || [];
    applyFilters();
    renderStats();
    renderFilters();
    const params = new URLSearchParams(location.search);
    const focusId = params.get('created') || params.get('focus');
    if (focusId) {
      const memory = memories.find((item) => String(item.id) === String(focusId));
      if (memory) openDiary(memory);
    }
  } catch (err) {
    notify(err.message || 'Could not load your galaxy.');
  }
})();

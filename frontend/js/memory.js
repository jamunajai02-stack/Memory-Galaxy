const CATEGORIES = ['Travel', 'Family', 'Friends', 'College', 'Love', 'Achievement', 'Birthday', 'Festival', 'Adventure', 'Other'];
const EMOTIONS = ['Happy', 'Sad', 'Excited', 'Love', 'Peaceful', 'Nostalgic', 'Grateful', 'Scared', 'Proud'];

(async function memoryPage() {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const category = document.getElementById('category');
  const emotion = document.getElementById('emotion');
  const editor = createEditor(document.getElementById('editor-toolbar'), document.getElementById('editor'));
  const photoInput = document.getElementById('photos');
  const preview = document.getElementById('photo-preview');
  const pendingFiles = [];
  const removeImages = [];

  CATEGORIES.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    category.appendChild(option);
  });
  EMOTIONS.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    emotion.appendChild(option);
  });

  document.getElementById('date').value = new Date().toISOString().slice(0, 10);

  function renderPreview(existing = []) {
    preview.innerHTML = '';
    existing.forEach((image) => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      const img = document.createElement('img');
      img.alt = image.originalName || 'Memory photo';
      MemoryAPI.mediaUrl(image.filename).then((url) => { img.src = url; });
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hud-btn danger';
      button.textContent = 'Remove';
      button.addEventListener('click', () => {
        removeImages.push(image.id);
        card.remove();
      });
      card.appendChild(img);
      card.appendChild(button);
      preview.appendChild(card);
    });

    pendingFiles.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hud-btn danger';
      button.textContent = 'Remove';
      button.addEventListener('click', () => {
        pendingFiles.splice(index, 1);
        renderPreview(existing);
      });
      card.appendChild(img);
      card.appendChild(button);
      preview.appendChild(card);
    });
  }

  let existingImages = [];
  if (id) {
    document.getElementById('page-title').textContent = 'Edit Memory';
    const data = await MemoryAPI.getMemory(id);
    const memory = data.memory;
    document.getElementById('starName').value = memory.starName;
    document.getElementById('title').value = memory.title;
    document.getElementById('date').value = memory.date ? new Date(memory.date).toISOString().slice(0, 10) : '';
    document.getElementById('location').value = memory.location || '';
    category.value = memory.category;
    emotion.value = memory.emotion;
    editor.setHtml(memory.content);
    existingImages = memory.images || [];
    renderPreview(existingImages);
  }

  photoInput.addEventListener('change', () => {
    [...photoInput.files].forEach((file) => pendingFiles.push(file));
    photoInput.value = '';
    renderPreview(existingImages.filter((image) => !removeImages.includes(image.id)));
  });

  document.getElementById('memory-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('form-error');
    error.hidden = true;
    const form = new FormData();
    form.append('starName', document.getElementById('starName').value.trim());
    form.append('title', document.getElementById('title').value.trim());
    form.append('date', document.getElementById('date').value);
    form.append('location', document.getElementById('location').value.trim());
    form.append('category', category.value);
    form.append('emotion', emotion.value);
    form.append('content', editor.getHtml());
    pendingFiles.forEach((file) => form.append('photos', file));
    if (removeImages.length) form.append('removeImages', removeImages.join(','));

    try {
      if (id) {
        await MemoryAPI.updateMemory(id, form);
        location.href = `galaxy.html?focus=${id}`;
      } else {
        const created = await MemoryAPI.createMemory(form);
        const first = localStorage.getItem('mg_has_memories') !== '1';
        localStorage.setItem('mg_has_memories', '1');
        location.href = `galaxy.html?created=${created.memory.id}${first ? '&first=1' : ''}`;
      }
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
})();

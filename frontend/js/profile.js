(async function profilePage() {
  if (!Auth.requireAuth()) return;
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

  const data = await MemoryAPI.profile();
  const user = data.user;
  Auth.setSession({ user });
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-phone').textContent = user.phone || 'No phone saved';
  document.getElementById('profile-created').textContent = `Account created ${new Date(user.createdAt).toLocaleDateString()}`;
  document.getElementById('name').value = user.name;
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('profile-stats').innerHTML = `
    <span>✨ ${data.stats.memories} Memories</span>
    <span>📸 ${data.stats.photos} Photos</span>
    <span>🌟 ${data.stats.categories} Categories</span>
    <span>❤️ ${data.stats.happyMoments} Happy Moments</span>
  `;

  if (user.profileImage) {
    document.getElementById('avatar').src = await MemoryAPI.mediaUrl(user.profileImage);
  }

  document.getElementById('avatar-input').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const result = await MemoryAPI.uploadAvatar(file);
    Auth.setSession({ user: result.user });
    document.getElementById('avatar').src = await MemoryAPI.mediaUrl(result.user.profileImage);
  });

  document.getElementById('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('profile-error');
    error.hidden = true;
    try {
      const result = await MemoryAPI.updateProfile({
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim()
      });
      Auth.setSession({ user: result.user });
      document.getElementById('profile-name').textContent = result.user.name;
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });

  document.getElementById('password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('password-error');
    error.hidden = true;
    try {
      await MemoryAPI.changePassword({
        currentPassword: document.getElementById('currentPassword').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
      });
      error.hidden = false;
      error.style.color = '#86efac';
      error.textContent = 'Password updated.';
    } catch (err) {
      error.hidden = false;
      error.style.color = '#ff8fab';
      error.textContent = err.message;
    }
  });
})();

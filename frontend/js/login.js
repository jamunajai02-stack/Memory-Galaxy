(function loginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  if (Auth.getToken()) {
    location.href = 'galaxy.html';
    return;
  }

  const params = new URLSearchParams(location.search);
  const flash = document.getElementById('flash');
  if (params.get('registered')) {
    flash.hidden = false;
    flash.textContent = 'Your galaxy is ready ✨';
  }

  const luna = document.getElementById('alien-luna');
  const nix = document.getElementById('alien-nix');
  window.addEventListener('mousemove', (event) => {
    const dx = (event.clientX / window.innerWidth - 0.5) * 18;
    const dy = (event.clientY / window.innerHeight - 0.5) * 12;
    if (luna) luna.style.transform = `translate(${dx}px, ${dy}px)`;
    if (nix) nix.style.transform = `translate(${-dx}px, ${dy * 0.6}px)`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('form-error');
    error.hidden = true;
    const data = new FormData(form);
    try {
      const result = await MemoryAPI.login({
        identifier: String(data.get('identifier') || '').trim(),
        password: String(data.get('password') || '')
      });
      Auth.setSession(result);
      location.href = 'galaxy.html';
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
})();

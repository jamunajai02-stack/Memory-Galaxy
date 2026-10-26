(function registerPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('form-error');
    error.hidden = true;
    const data = new FormData(form);
    const password = String(data.get('password') || '');
    const confirmPassword = String(data.get('confirmPassword') || '');
    if (password !== confirmPassword) {
      error.hidden = false;
      error.textContent = "The password doesn't match.";
      return;
    }
    try {
      await MemoryAPI.register({
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        password,
        confirmPassword,
        recoveryQuestion: String(data.get('recoveryQuestion') || ''),
        recoveryAnswer: String(data.get('recoveryAnswer') || '')
      });
      location.href = 'login.html?registered=1';
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
})();

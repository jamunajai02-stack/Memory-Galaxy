(function resetPasswordPage() {
  const form = document.getElementById('reset-form');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  document.getElementById('reset-token').value = params.get('token') || '';

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
      await MemoryAPI.resetPassword({
        token: String(data.get('token') || ''),
        password,
        confirmPassword
      });
      location.href = 'login.html';
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
})();

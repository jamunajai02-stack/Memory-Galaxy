(function forgotPasswordPage() {
  const emailForm = document.getElementById('email-form');
  if (!emailForm) return;

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.hidden = panel.dataset.panel !== tab.dataset.tab;
      });
    });
  });

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('email-error');
    const success = document.getElementById('email-success');
    error.hidden = true;
    success.hidden = true;
    try {
      const data = await MemoryAPI.forgotPassword({
        email: String(new FormData(emailForm).get('email') || '').trim()
      });
      success.hidden = false;
      success.textContent = data.message;
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });

  const lookup = document.getElementById('question-lookup');
  const resetForm = document.getElementById('question-reset');
  let recoveryEmail = '';

  lookup.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('question-error');
    error.hidden = true;
    recoveryEmail = String(new FormData(lookup).get('email') || '').trim();
    try {
      const data = await MemoryAPI.recoveryQuestion({ email: recoveryEmail });
      if (!data.question) {
        error.hidden = false;
        error.textContent = data.message;
        resetForm.hidden = true;
        return;
      }
      document.getElementById('question-text').textContent = `"${data.question}"`;
      resetForm.hidden = false;
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });

  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.getElementById('question-error');
    const success = document.getElementById('question-success');
    error.hidden = true;
    success.hidden = true;
    const data = new FormData(resetForm);
    try {
      const result = await MemoryAPI.resetWithRecovery({
        email: recoveryEmail,
        answer: String(data.get('answer') || ''),
        password: String(data.get('password') || ''),
        confirmPassword: String(data.get('confirmPassword') || '')
      });
      success.hidden = false;
      success.textContent = result.message;
      setTimeout(() => { location.href = 'login.html'; }, 1200);
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message;
    }
  });
})();

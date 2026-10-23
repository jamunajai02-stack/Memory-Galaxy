(function spaceBackground() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stars = [];
  const dust = [];
  const shots = [];
  let w = 0;
  let h = 0;
  let t = 0;
  let mouse = { x: 0, y: 0 };

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function seed() {
    stars.length = 0;
    dust.length = 0;
    for (let i = 0; i < 220; i += 1) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 2.5 + 0.3,
        r: Math.random() * 1.6 + 0.2,
        tw: Math.random() * 6
      });
    }
    for (let i = 0; i < 50; i += 1) {
      dust.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2
      });
    }
  }

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / w - 0.5) * 24;
    mouse.y = (event.clientY / h - 0.5) * 18;
  });

  function draw() {
    t += 0.016;
    ctx.fillStyle = '#030014';
    ctx.fillRect(0, 0, w, h);

    const nebula = ctx.createRadialGradient(w * 0.5 + mouse.x, h * 0.45 + mouse.y, 20, w * 0.5, h * 0.5, w * 0.55);
    nebula.addColorStop(0, 'rgba(109,40,217,0.28)');
    nebula.addColorStop(0.5, 'rgba(219,39,119,0.12)');
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);

    stars.forEach((star) => {
      const alpha = 0.3 + Math.abs(Math.sin(t * 2 + star.tw)) * 0.7;
      ctx.fillStyle = `rgba(255,246,216,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x + mouse.x * star.z, star.y + mouse.y * star.z, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    dust.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.fillStyle = 'rgba(125,211,252,0.22)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });

    if (Math.random() < 0.012) {
      shots.push({ x: Math.random() * w * 0.8, y: Math.random() * h * 0.35, vx: 8, vy: 4, life: 1 });
    }
    shots.forEach((s, i) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.02;
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(s.life, 0)})`;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 54, s.y - 24);
      ctx.stroke();
      if (s.life <= 0) shots.splice(i, 1);
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); seed(); });
  resize();
  seed();
  draw();
})();

const RECOVERY_QUESTIONS = [
  'What was your childhood nickname?',
  'What is your favorite cartoon?',
  'What food could you eat forever?',
  'What was your first favorite movie?',
  'What is your dream travel destination?',
  'What was your favorite school subject?'
];

const CATEGORIES = [
  'Travel',
  'Family',
  'Friends',
  'College',
  'Love',
  'Achievement',
  'Birthday',
  'Festival',
  'Adventure',
  'Other'
];

const EMOTIONS = {
  Happy: { color: '#f5d76e', glow: '#ffe9a3' },
  Sad: { color: '#60a5fa', glow: '#bfdbfe' },
  Excited: { color: '#fb923c', glow: '#fed7aa' },
  Love: { color: '#fb7185', glow: '#fecdd3' },
  Peaceful: { color: '#22d3ee', glow: '#a5f3fc' },
  Nostalgic: { color: '#c084fc', glow: '#e9d5ff' },
  Grateful: { color: '#4ade80', glow: '#bbf7d0' },
  Scared: { color: '#94a3b8', glow: '#e2e8f0' },
  Proud: { color: '#fbbf24', glow: '#fde68a' }
};

function emotionStyle(emotion) {
  return EMOTIONS[emotion] || EMOTIONS.Happy;
}

function spiralStarPosition(index = 0) {
  const arms = 4;
  const arm = index % arms;
  const ring = Math.floor(index / arms);
  const dist = 80 + ring * 28 + (index % 5) * 4;
  const twist = dist * 0.015;
  const angle = arm * ((Math.PI * 2) / arms) + twist + (Math.random() - 0.5) * 0.2;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.48,
    z: (Math.random() - 0.5) * 70
  };
}

function randomStarPosition() {
  return spiralStarPosition(Math.floor(Math.random() * 40));
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function normalizeAnswer(answer) {
  return String(answer || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

module.exports = {
  RECOVERY_QUESTIONS,
  CATEGORIES,
  EMOTIONS,
  emotionStyle,
  randomStarPosition,
  spiralStarPosition,
  stripTags,
  isStrongPassword,
  normalizeAnswer
};

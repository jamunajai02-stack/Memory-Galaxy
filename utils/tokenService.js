const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'memory-galaxy-dev-secret-change-in-production';
}

function generateAccessToken(userId) {
  return jwt.sign(
    { id: String(userId) },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const minutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30);
  const expires = new Date(Date.now() + minutes * 60 * 1000);
  return { token, hashed, expires };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function resetExpiryMs() {
  return Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30) * 60 * 1000;
}

module.exports = {
  getJwtSecret,
  generateAccessToken,
  generateResetToken,
  hashToken,
  resetExpiryMs
};

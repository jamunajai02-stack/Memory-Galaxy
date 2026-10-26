const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/tokenService');

async function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || null);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-password -recoveryAnswer -resetPasswordToken');
    if (!user) {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
    req.user = user;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

function ownsMemory(memory, userId) {
  return memory && String(memory.user) === String(userId);
}

module.exports = { authenticateToken, ownsMemory };

const User = require('../models/User');
const { sendResetEmail } = require('../utils/emailService');
const { generateAccessToken, generateResetToken, hashToken } = require('../utils/tokenService');
const { RECOVERY_QUESTIONS, isStrongPassword } = require('../utils/constants');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  const phone = String(value || '').replace(/[^\d+]/g, '');
  return phone || '';
}

function publicAuth(user) {
  return {
    token: generateAccessToken(user._id),
    user: user.toSafeJSON()
  };
}

const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');
  const recoveryQuestion = String(req.body.recoveryQuestion || '');
  const recoveryAnswer = String(req.body.recoveryAnswer || '').trim();

  if (name.length < 2) throw new AppError('Please enter your full name.');
  if (!emailRegex.test(email)) throw new AppError('Enter a valid email address.');
  if (phone && !phoneRegex.test(phone)) throw new AppError('Enter a valid phone number.');
  if (!isStrongPassword(password)) {
    throw new AppError('Password must be at least 8 characters and include a letter and a number.');
  }
  if (password !== confirmPassword) throw new AppError("The password doesn't match.");
  if (!RECOVERY_QUESTIONS.includes(recoveryQuestion)) {
    throw new AppError('Choose a recovery question.');
  }
  if (recoveryAnswer.length < 2) throw new AppError('Please answer your recovery question.');

  const emailTaken = await User.findOne({ email });
  if (emailTaken) throw new AppError('That email is already connected to a galaxy.', 409);

  if (phone) {
    const phoneTaken = await User.findOne({ phone });
    if (phoneTaken) throw new AppError('That phone number is already connected to a galaxy.', 409);
  }

  const user = await User.create({
    name,
    email,
    phone: phone || undefined,
    password,
    recoveryQuestion,
    recoveryAnswer
  });

  res.status(201).json({
    message: 'Your galaxy is ready ✨',
    user: user.toSafeJSON()
  });
});

const login = asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!identifier || !password) throw new AppError('Email or phone and password are required.');

  const email = identifier.includes('@') ? normalizeEmail(identifier) : '';
  const phone = email ? '' : normalizePhone(identifier);
  const user = await User.findOne(email ? { email } : { phone }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('The password doesn\'t match.', 401);
  }

  res.json(publicAuth(user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const generic = 'If that email is connected to a galaxy, a reset link is on its way.';

  if (!emailRegex.test(email)) {
    return res.json({ message: generic });
  }

  const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
  if (user) {
    const { token, hashed, expires } = generateResetToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = expires;
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${token}`;
    await sendResetEmail(user.email, resetUrl);
  }

  res.json({ message: generic });
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token || '').trim();
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || password);

  if (!token) throw new AppError('The reset link has expired. Please request a new one.');
  if (!isStrongPassword(password)) {
    throw new AppError('Password must be at least 8 characters and include a letter and a number.');
  }
  if (password !== confirmPassword) throw new AppError("The password doesn't match.");

  const hashed = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() }
  }).select('+resetPasswordToken +resetPasswordExpires +password');

  if (!user) throw new AppError('The reset link has expired. Please request a new one.');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password updated. You can now log in.' });
});

const recoveryQuestion = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!emailRegex.test(email)) {
    throw new AppError('Enter a valid email address.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({
      message: 'If that email belongs to a galaxy, your recovery question will appear.',
      question: null
    });
  }

  res.json({
    message: 'Answer the question you chose when you created your galaxy.',
    question: user.recoveryQuestion
  });
});

const resetWithRecovery = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const answer = String(req.body.answer || '');
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!emailRegex.test(email)) throw new AppError('Enter a valid email address.');
  if (!isStrongPassword(password)) {
    throw new AppError('Password must be at least 8 characters and include a letter and a number.');
  }
  if (password !== confirmPassword) throw new AppError("The password doesn't match.");

  const user = await User.findOne({ email }).select('+recoveryAnswer +recoveryFailCount +recoveryLockUntil +password');
  if (!user) throw new AppError('We could not verify that recovery answer.');

  if (user.recoveryLockUntil && user.recoveryLockUntil > new Date()) {
    throw new AppError('Too many attempts. Please wait a moment and try again.', 429);
  }

  const ok = await user.matchRecoveryAnswer(answer);
  if (!ok) {
    user.recoveryFailCount = (user.recoveryFailCount || 0) + 1;
    if (user.recoveryFailCount >= 5) {
      user.recoveryLockUntil = new Date(Date.now() + 15 * 60 * 1000);
      user.recoveryFailCount = 0;
    }
    await user.save({ validateBeforeSave: false });
    throw new AppError('We could not verify that recovery answer.', 401);
  }

  user.password = password;
  user.recoveryFailCount = 0;
  user.recoveryLockUntil = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password updated. You can now log in.' });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  recoveryQuestion,
  resetWithRecovery
};

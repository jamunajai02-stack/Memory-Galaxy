const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  recoveryQuestion,
  resetWithRecovery
} = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a moment and try again.' }
});

const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a moment and try again.' }
});

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

router.post(
  '/register',
  authLimiter,
  body('name').trim().isLength({ min: 2 }).withMessage('Please enter your full name.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
  login
);

router.post(
  '/forgot-password',
  recoveryLimiter,
  body('email').isEmail().withMessage('Enter a valid email address.'),
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  recoveryLimiter,
  body('token').notEmpty().withMessage('The reset link has expired. Please request a new one.'),
  validate,
  resetPassword
);

router.post(
  '/recovery-question',
  recoveryLimiter,
  body('email').isEmail().withMessage('Enter a valid email address.'),
  validate,
  recoveryQuestion
);

router.post(
  '/reset-with-recovery',
  recoveryLimiter,
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('answer').notEmpty().withMessage('Please answer your recovery question.'),
  validate,
  resetWithRecovery
);

module.exports = router;

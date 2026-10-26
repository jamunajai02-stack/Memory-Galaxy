const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Memory = require('../models/Memory');
const { isStrongPassword } = require('../utils/constants');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function deleteFile(filename) {
  if (!filename) return;
  fs.promises.unlink(path.join(uploadsDir, filename)).catch(() => {});
}

const getProfile = asyncHandler(async (req, res) => {
  const memories = await Memory.find({ user: req.user.id });
  const totalPhotos = memories.reduce((sum, memory) => sum + (memory.images?.length || 0), 0);
  const categories = new Set(memories.map((memory) => memory.category).filter(Boolean));
  const happy = memories.filter((memory) => memory.emotion === 'Happy' || memory.emotion === 'Love').length;

  res.json({
    user: req.user.toSafeJSON(),
    stats: {
      memories: memories.length,
      photos: totalPhotos,
      categories: categories.size,
      happyMoments: happy
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (req.body.name) user.name = String(req.body.name).trim();
  if (req.body.phone !== undefined) {
    const phone = String(req.body.phone || '').replace(/[^\d+]/g, '');
    if (phone) {
      const taken = await User.findOne({ phone, _id: { $ne: user._id } });
      if (taken) throw new AppError('That phone number is already connected to a galaxy.', 409);
      user.phone = phone;
    } else {
      user.phone = undefined;
    }
  }
  await user.save();
  res.json({ user: user.toSafeJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError("The password doesn't match.", 401);
  }
  if (!isStrongPassword(password)) {
    throw new AppError('Password must be at least 8 characters and include a letter and a number.');
  }
  if (password !== confirmPassword) throw new AppError("The password doesn't match.");

  user.password = password;
  await user.save();
  res.json({ message: 'Password updated.' });
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please choose a profile picture.');
  const user = await User.findById(req.user.id);
  if (user.profileImage) deleteFile(user.profileImage);
  user.profileImage = req.file.filename;
  await user.save();
  res.json({ user: user.toSafeJSON() });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar
};

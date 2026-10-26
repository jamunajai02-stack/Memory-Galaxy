const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/avatar', upload.single('avatar'), updateAvatar);

module.exports = router;

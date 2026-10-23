const express = require('express');
const {
  listMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory,
  deleteImage
} = require('../controllers/memoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listMemories);
router.post('/', upload.array('photos', 8), createMemory);
router.get('/:id', getMemory);
router.put('/:id', upload.array('photos', 8), updateMemory);
router.delete('/:id', deleteMemory);
router.delete('/:id/images/:imageId', deleteImage);

module.exports = router;

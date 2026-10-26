const fs = require('fs');
const path = require('path');
const Memory = require('../models/Memory');
const User = require('../models/User');
const sanitizeHtml = require('../utils/sanitizeHtml');
const {
  CATEGORIES,
  EMOTIONS,
  emotionStyle,
  spiralStarPosition,
  stripTags,
} = require('../utils/constants');
const { AppError, asyncHandler } = require('../middleware/errorMiddleware');
const { ownsMemory } = require('../middleware/authMiddleware');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function toClient(memory) {
  return {
    id: memory._id,
    title: memory.title,
    starName: memory.starName,
    content: memory.content,
    plainTextContent: memory.plainTextContent,
    images: (memory.images || []).map((image) => ({
      id: image._id,
      filename: image.filename,
      originalName: image.originalName
    })),
    date: memory.date,
    location: memory.location,
    category: memory.category,
    emotion: memory.emotion,
    starColor: memory.starColor,
    starSize: memory.starSize,
    starPosition: memory.starPosition,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt
  };
}

function applyMemoryFields(memory, body) {
  if (body.title !== undefined) memory.title = String(body.title).trim() || 'Untitled Memory';
  if (body.starName !== undefined) memory.starName = String(body.starName).trim() || 'Unnamed Star';
  if (body.content !== undefined) {
    memory.content = sanitizeHtml(body.content);
    memory.plainTextContent = stripTags(memory.content);
  }
  if (body.date !== undefined) memory.date = body.date ? new Date(body.date) : memory.date;
  if (body.location !== undefined) memory.location = String(body.location).trim();
  if (body.category !== undefined) {
    memory.category = CATEGORIES.includes(body.category) ? body.category : 'Other';
  }
  if (body.emotion !== undefined || body.starColor !== undefined || body.starSize !== undefined) {
    const emotion = body.emotion || memory.emotion || 'Happy';
    memory.emotion = emotionStyle(emotion) ? emotion : memory.emotion;
    const palette = emotionStyle(memory.emotion);
    memory.starColor = body.starColor || palette.color;
    if (body.starSize) memory.starSize = Math.min(18, Math.max(4, Number(body.starSize)));
  }
}

function attachFiles(memory, files = []) {
  files.forEach((file) => {
    memory.images.push({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype
    });
  });
}

function deleteFile(filename) {
  if (!filename) return;
  fs.promises.unlink(path.join(uploadsDir, filename)).catch(() => {});
}

const listMemories = asyncHandler(async (req, res) => {
  const memories = await Memory.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
  res.json({ memories: memories.map(toClient) });
});

const getMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory || !ownsMemory(memory, req.user.id)) {
    throw new AppError("We couldn't find that memory.", 404);
  }
  res.json({ memory: toClient(memory) });
});

const createMemory = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const emotion = EMOTIONS[body.emotion] ? body.emotion : 'Happy';
  const palette = emotionStyle(emotion);
  const files = req.files || [];
  if (files.length > 8) {
    files.forEach((file) => deleteFile(file.filename));
    throw new AppError('A memory can hold up to 8 photos.');
  }

  const count = await Memory.countDocuments({ user: req.user.id });
  const memory = await Memory.create({
    user: req.user.id,
    title: String(body.title || 'Untitled Memory').trim() || 'Untitled Memory',
    starName: String(body.starName || 'New Star').trim() || 'New Star',
    content: sanitizeHtml(body.content || ''),
    plainTextContent: stripTags(body.content || ''),
    date: body.date ? new Date(body.date) : new Date(),
    location: String(body.location || '').trim(),
    category: CATEGORIES.includes(body.category) ? body.category : 'Other',
    emotion,
    starColor: body.starColor || palette.color,
    starSize: body.starSize ? Math.min(18, Math.max(4, Number(body.starSize))) : 7 + Math.random() * 6,
    starPosition: body.starPosition || spiralStarPosition(count),
    images: files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype
    }))
  });

  res.status(201).json({ memory: toClient(memory) });
});

const updateMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory || !ownsMemory(memory, req.user.id)) {
    throw new AppError('This star no longer exists.', 404);
  }

  const files = req.files || [];
  if (memory.images.length + files.length > 8) {
    files.forEach((file) => deleteFile(file.filename));
    throw new AppError('A memory can hold up to 8 photos.');
  }

  applyMemoryFields(memory, req.body || {});
  attachFiles(memory, files);

  if (req.body.removeImages) {
    const remove = Array.isArray(req.body.removeImages)
      ? req.body.removeImages
      : String(req.body.removeImages).split(',').filter(Boolean);
    memory.images = memory.images.filter((image) => {
      if (remove.includes(String(image._id)) || remove.includes(image.filename)) {
        deleteFile(image.filename);
        return false;
      }
      return true;
    });
  }

  await memory.save();
  res.json({ memory: toClient(memory) });
});

const deleteMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory || !ownsMemory(memory, req.user.id)) {
    throw new AppError('This star no longer exists.', 404);
  }
  memory.images.forEach((image) => deleteFile(image.filename));
  await memory.deleteOne();
  res.json({ message: 'The star faded from your galaxy.' });
});

const deleteImage = asyncHandler(async (req, res) => {
  const memory = await Memory.findById(req.params.id);
  if (!memory || !ownsMemory(memory, req.user.id)) {
    throw new AppError("We couldn't find that memory.", 404);
  }
  const image = memory.images.id(req.params.imageId);
  if (!image) throw new AppError('Photo not found.', 404);
  deleteFile(image.filename);
  image.deleteOne();
  await memory.save();
  res.json({ memory: toClient(memory) });
});

const serveMedia = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) throw new AppError("We couldn't find that memory.", 404);

  const profileHit = await User.findOne({ _id: req.user.id, profileImage: filename });
  const memoryHit = await Memory.findOne({ user: req.user.id, 'images.filename': filename });
  if (!profileHit && !memoryHit) {
    throw new AppError('Unauthorized.', 401);
  }

  res.sendFile(filePath);
});

module.exports = {
  listMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory,
  deleteImage,
  serveMedia
};

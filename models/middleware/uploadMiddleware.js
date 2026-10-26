const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').slice(0, 8);
    const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : '';
    const userId = req.user && req.user.id ? String(req.user.id) : 'anon';
    cb(null, `${userId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }
});

module.exports = upload;

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFound(req, res, next) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  next();
}

function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'That photo is too large. Max size is 5MB.' });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'account';
    if (field === 'email') {
      return res.status(409).json({ message: 'That email is already connected to a galaxy.' });
    }
    if (field === 'phone') {
      return res.status(409).json({ message: 'That phone number is already connected to a galaxy.' });
    }
    return res.status(409).json({ message: 'That account already exists.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong in the galaxy.'
  });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };

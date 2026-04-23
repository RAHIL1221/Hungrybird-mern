const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured');
} else {
  console.log('⚠️  Cloudinary not configured, using local storage');
}

// Configure storage
const storage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: { 
        folder: 'food-admin', 
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    });

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
  }
};

// Create multer upload instance
const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Middleware to format file path for local storage
const formatFilePath = (req, res, next) => {
  if (req.file && !isCloudinaryConfigured) {
    // For local storage, prepend /uploads/ to the filename
    // Use forward slashes for URLs
    req.file.path = `/uploads/${req.file.filename}`;
    console.log('📁 Local file saved:', req.file.path);
  } else if (req.file && isCloudinaryConfigured) {
    console.log('☁️  Cloudinary file saved:', req.file.path);
  }
  next();
};

module.exports = { 
  cloudinary: isCloudinaryConfigured ? cloudinary : null, 
  upload, 
  formatFilePath,
  isCloudinaryConfigured 
};

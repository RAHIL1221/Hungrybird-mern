const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const sendTokenResponse = (admin, statusCode, res) => {
  const token = admin.getSignedJwtToken();
  const refreshToken = admin.getRefreshToken();

  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  admin.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      avatar: admin.avatar,
    },
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }
    sendTokenResponse(admin, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await Admin.findByIdAndUpdate(req.admin.id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.id).select('+refreshToken');
    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    sendTokenResponse(admin, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const existing = await Admin.findOne({ role: 'super_admin' });
    if (existing) {
      return res.status(403).json({ success: false, message: 'A Super Admin already exists. Contact your administrator.' });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const admin = await Admin.create({
      name, email, password,
      role: 'super_admin',
      permissions: ['dashboard','orders','food','restaurants','users','payments','delivery','reviews','coupons','notifications','settings','admins','inventory'],
      isActive: true,
    });
    sendTokenResponse(admin, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.admin });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.admin.id, { name, avatar }, { new: true, runValidators: true });
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id).select('+password');
    if (!(await admin.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};



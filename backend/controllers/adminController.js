const Admin = require('../models/Admin');

exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().sort('-createdAt');
    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.create(req.body);
    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body;
    
    // If password is provided, handle it separately
    if (password && password.trim()) {
      const admin = await Admin.findById(req.params.id);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
      
      // Update password (will be hashed by pre-save hook)
      admin.password = password;
      
      // Update other fields
      Object.keys(updateData).forEach(key => {
        admin[key] = updateData[key];
      });
      
      await admin.save();
      return res.json({ success: true, data: admin, message: 'Admin updated successfully' });
    }
    
    // If no password, just update other fields
    const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    if (req.params.id === req.admin.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleAdminStatus = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    admin.isActive = !admin.isActive;
    await admin.save();
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

exports.updateAdminPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    admin.password = password;
    await admin.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

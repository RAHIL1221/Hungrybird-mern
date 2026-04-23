const Settings = require('../models/Settings');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.find();
    const result = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const updates = Object.entries(req.body);
    await Promise.all(
      updates.map(([key, value]) =>
        Settings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
      )
    );
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
};

exports.getSettingsByGroup = async (req, res, next) => {
  try {
    const settings = await Settings.find({ group: req.params.group });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.getPublicSettings = async (req, res, next) => {
  try {
    const taxRateSetting = await Settings.findOne({ key: 'tax_rate' });
    const taxRate = taxRateSetting?.value || 8;
    // Convert percentage to decimal (e.g., 8 -> 0.08)
    res.json({ success: true, data: { taxRate: parseFloat(taxRate) / 100 } });
  } catch (err) {
    next(err);
  }
};

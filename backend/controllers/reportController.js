const Report = require('../models/reportModel');

const submitReport = async (req, res) => {
  const { message, reporter } = req.body;

  try {
    const newReport = new Report({ message, reporter, createdAt: new Date() });
    await newReport.save();
    res.status(201).json({ message: "Hata bildirimi kaydedildi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { submitReport };

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  message: { type: String, required: true },
  reporter: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "images/default-avatar.png" },
  stats: {
    offline: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 }
    },
    online: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// 🔧 BU SATIR ÖNEMLİ!
module.exports = mongoose.model("User", userSchema);

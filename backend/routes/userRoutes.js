const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { getUserProfile } = require('../controllers/authController');

router.get('/users/profile/:username', getUserProfile);
// Token doğrulama middleware'i eklersin sonra
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    res.json({
      username: user.username,
      profilePic: user.profilePic,
      stats: user.stats
    });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

module.exports = router;

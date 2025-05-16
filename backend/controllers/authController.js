const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Kayıt
const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Giriş
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Şifre yanlış.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Kullanıcı profilini dönen fonksiyon
const getUserProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    res.status(200).json({
      username: user.username,
      email: user.email || "yok",
      profilePic: user.profilePic || "images/default-avatar.png",
      createdAt: user.createdAt || null,
      stats: user.stats || {
        offline: { wins: 0, losses: 0 },
        online: { wins: 0, losses: 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = { register, login, getUserProfile };

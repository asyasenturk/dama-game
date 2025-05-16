const Player = require('../models/playerModel');

// Yeni oyuncu ekle
const createPlayer = async (req, res) => {
  const { username } = req.body;

  try {
    const player = new Player({ username });
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Tüm oyuncuları getir
const getPlayers = async (req, res) => {
  try {
    const players = await Player.find().sort({ wins: -1 }); // kazanma sayısına göre sıralı
    res.status(200).json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPlayer, getPlayers };

const Game = require('../models/gameModel');

// Yeni oyun başlat
const startGame = async (req, res) => {
  const { player1, player2 } = req.body;

  try {
    const newGame = new Game({ player1, player2 });
    await newGame.save();
    res.status(201).json(newGame);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Oyun sonu: kazananı güncelle
const endGame = async (req, res) => {
  const { id } = req.params;
  const { winner } = req.body;

  try {
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      { winner, endedAt: new Date() },
      { new: true }
    );
    res.status(200).json(updatedGame);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { startGame, endGame };

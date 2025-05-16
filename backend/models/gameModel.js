const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  from: String,
  to: String,
  timestamp: { type: Date, default: Date.now }
});

const gameSchema = new mongoose.Schema({
  player1: { type: String, required: true },
  player2: { type: String, required: true },
  winner: { type: String, default: null },
  moves: [moveSchema],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

module.exports = mongoose.model('Game', gameSchema);

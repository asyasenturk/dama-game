const express = require('express');
const router = express.Router();
const { startGame, endGame } = require('../controllers/gameController');

router.post('/', startGame);          // /api/games
router.patch('/:id', endGame);        // /api/games/:id

module.exports = router;

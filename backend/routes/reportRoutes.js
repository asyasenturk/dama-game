const express = require('express');
const router = express.Router();
const { submitReport } = require('../controllers/reportController');

router.post('/submit', submitReport);

module.exports = router;

const express = require('express');
const { getFields, updateFields } = require('../controllers/fieldsController');

const router = express.Router();

router.get('/', getFields);
router.put('/', updateFields);

module.exports = router;

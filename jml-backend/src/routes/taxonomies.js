const express = require('express');
const taxonomyController = require('../controllers/taxonomyController');

const router = express.Router();

router.get('/', taxonomyController.getTaxonomies);
router.put('/', taxonomyController.updateTaxonomies);

module.exports = router;

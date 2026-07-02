const express = require('express');
const router = express.Router();
const controller = require('../controllers/waitlistController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { waitlistSchema, waitlistUpdateSchema } = require('../utils/waitlistValidators');

router.use(auth);

router.get('/', authorize(['MEDICO']), controller.listWaitlist);
router.post('/', authorize(['MEDICO']), validate(waitlistSchema), controller.addToWaitlist);
router.put('/:id', authorize(['MEDICO']), validate(waitlistUpdateSchema, { partial: true }), controller.updateWaitlistItem);
router.delete('/:id', authorize(['MEDICO']), controller.removeFromWaitlist);

module.exports = router;

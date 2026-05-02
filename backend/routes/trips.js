const express = require('express');
const router = express.Router();
const { createTrip, getTrips, getTrip, updateTrip, deleteTrip, saveItinerary, savePackingList, addMember, addExpense } = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTrips).post(createTrip);
router.route('/:id').get(getTrip).put(updateTrip).delete(deleteTrip);
router.put('/:id/itinerary', saveItinerary);
router.put('/:id/packing-list', savePackingList);
router.post('/:id/members', addMember);
router.post('/:id/expenses', addExpense);

module.exports = router;

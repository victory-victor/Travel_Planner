const express = require('express');
const router = express.Router();
const { generateAIItinerary, getAISuggestions, aiChat, getPackingList, getBudgetOptimization, getAIEstimates } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/itinerary', generateAIItinerary);
router.post('/suggestions', getAISuggestions);
router.post('/chat', aiChat);
router.post('/packing-list', getPackingList);
router.post('/budget', getBudgetOptimization);
router.post('/estimates', getAIEstimates);

module.exports = router;

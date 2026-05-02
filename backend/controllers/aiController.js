const { generateItinerary, getDestinationSuggestions, chatWithAI, generatePackingList, optimizeBudget, getTravelEstimates } = require('../services/geminiService');

// @desc    Generate AI itinerary
// @route   POST /api/ai/itinerary
const generateAIItinerary = async (req, res) => {
  try {
    const data = await generateItinerary(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI generation failed: ' + error.message });
  }
};

// @desc    Get destination suggestions
// @route   POST /api/ai/suggestions
const getAISuggestions = async (req, res) => {
  try {
    const data = await getDestinationSuggestions(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI suggestions failed: ' + error.message });
  }
};

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { messages, tripContext } = req.body;
    const reply = await chatWithAI(messages, tripContext);
    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI chat failed: ' + error.message });
  }
};

// @desc    Generate packing list
// @route   POST /api/ai/packing-list
const getPackingList = async (req, res) => {
  try {
    const data = await generatePackingList(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Packing list generation failed: ' + error.message });
  }
};

// @desc    Optimize budget
// @route   POST /api/ai/budget
const getBudgetOptimization = async (req, res) => {
  try {
    const data = await optimizeBudget(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Budget optimization failed: ' + error.message });
  }
};

// @desc    Get travel estimates
// @route   POST /api/ai/estimates
const getAIEstimates = async (req, res) => {
  try {
    const data = await getTravelEstimates(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Travel estimates failed: ' + error.message });
  }
};

module.exports = { generateAIItinerary, getAISuggestions, aiChat, getPackingList, getBudgetOptimization, getAIEstimates };

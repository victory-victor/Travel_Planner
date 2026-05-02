/*
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

const getGeminiClient = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getModel = (modelName = 'models/gemini-2.5-flash') => {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
};

module.exports = { getGeminiClient, getModel };
*/

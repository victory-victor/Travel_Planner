require('dotenv').config();
// const { getModel } = require('../config/gemini');

// Helper for OpenRouter API calls
const callOpenRouter = async (prompt, systemPrompt = "You are a professional travel assistant. Always return valid JSON when requested.") => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables. Please check your .env file.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:5000", // Optional, for OpenRouter rankings
      "X-Title": "WanderMind", // Optional, for OpenRouter rankings
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001", // Default to a cost-effective model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (error) {
      errorData = {};
    }
    throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

// Helper to extract JSON from AI response
const extractJSON = (text) => {
  try {
    const cleaned = String(text || '').replace(/```json|```/gi, '').trim();
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return null;
  }
};

const toDestinationName = (destination) => {
  if (!destination) return 'the destination';
  if (typeof destination === 'string') return destination;
  return [destination.name, destination.country].filter(Boolean).join(', ') || 'the destination';
};

const getTripDayCount = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 3;

  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const normalizeCategory = (category) => {
  const value = String(category || '').toLowerCase();
  const allowed = ['food', 'transport', 'accommodation', 'sightseeing', 'entertainment', 'other'];
  return allowed.includes(value) ? value : 'other';
};

const normalizeItinerary = (rawData, tripData) => {
  const source = Array.isArray(rawData)
    ? rawData
    : rawData?.itinerary || rawData?.days || rawData?.plan || [];

  if (!Array.isArray(source)) return [];

  const start = new Date(tripData.startDate);

  return source.map((day, index) => {
    const activities = Array.isArray(day.activities) ? day.activities : [];

    return {
      day: Number(day.day) || index + 1,
      date: day.date || (!Number.isNaN(start.getTime()) ? addDays(start, index).toISOString() : undefined),
      title: day.title || day.theme || `Day ${index + 1}`,
      activities: activities.map((activity) => ({
        time: activity.time || '',
        activity: activity.activity || activity.name || activity.title || '',
        location: activity.location || '',
        description: activity.description || activity.notes || '',
        estimatedCost: Number(activity.estimatedCost ?? activity.cost ?? 0) || 0,
        category: normalizeCategory(activity.category)
      })).filter((activity) => activity.activity)
    };
  }).filter((day) => day.activities.length > 0);
};

const normalizePackingList = (rawData) => {
  const categories = Array.isArray(rawData)
    ? rawData
    : rawData?.categories || rawData?.packingList || [];

  if (!Array.isArray(categories)) return { categories: [] };

  return {
    categories: categories.map((category) => ({
      name: category.name || category.category || 'Essentials',
      icon: category.icon || '',
      items: Array.isArray(category.items)
        ? category.items.map((item) => (typeof item === 'string' ? item : item.name || item.item)).filter(Boolean)
        : []
    })).filter((category) => category.items.length > 0)
  };
};

const normalizeTravelEstimates = (rawData) => {
  const source = Array.isArray(rawData)
    ? rawData
    : rawData?.methods || rawData?.travelMethods || [];

  const fallback = [
    { type: 'Flight', icon: 'plane', time: 'Check live routes', cost: 'Check fares' },
    { type: 'Car', icon: 'car', time: 'Route dependent', cost: 'Fuel/tolls vary' },
    { type: 'Bike', icon: 'bike', time: 'Route dependent', cost: 'Fuel varies' },
    { type: 'Bus', icon: 'bus', time: 'Check operators', cost: 'Check fares' },
    { type: 'Train', icon: 'train', time: 'Check schedules', cost: 'Check fares' },
    { type: 'Walk', icon: 'walk', time: 'For local routes', cost: 'Free' }
  ];

  if (!Array.isArray(source) || source.length === 0) return { methods: fallback };

  const byType = new Map(source.map((method) => [
    String(method.type || '').toLowerCase(),
    method
  ]));

  return {
    methods: fallback.map((base) => {
      const match = byType.get(base.type.toLowerCase()) || {};
      return {
        type: base.type,
        icon: match.icon || base.icon,
        time: match.time || match.duration || base.time,
        cost: match.cost || match.estimatedCost || base.cost
      };
    })
  };
};

// Generate full itinerary
const generateItinerary = async (tripData) => {
  /*
  console.log('Starting Gemini Itinerary Generation...');
  const model = getModel();
  const { destination, startDate, endDate, budget, preferences, memberCount } = tripData;
  const days = getTripDayCount(startDate, endDate);
  const destinationName = toDestinationName(destination);

  const prompt = `
Create a ${days}-day travel itinerary for ${destinationName}.
Trip dates: ${startDate || 'unknown'} to ${endDate || 'unknown'}.
Budget: ${budget?.total || 'not specified'} ${budget?.currency || ''}.
Travelers: ${memberCount || 'not specified'}.
Preferences: ${JSON.stringify(preferences || {})}.

Return ONLY valid JSON with this exact shape:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Short day theme",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "location": "Place name",
          "description": "One sentence travel note",
          "estimatedCost": 1200,
          "category": "food|transport|accommodation|sightseeing|entertainment|other"
        }
      ]
    }
  ]
}`;

  try {
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);

    if (!result.response) {
      throw new Error('Empty response from AI');
    }

    const text = result.response.text();
    console.log('Gemini API response received. Length:', text.length);

    const data = extractJSON(text);
    if (!data) {
      console.error('JSON parse failed. Raw response from AI was:', text);
      throw new Error('AI response could not be parsed as JSON');
    }

    const itinerary = normalizeItinerary(data, tripData);
    if (!itinerary.length) {
      console.error('Itinerary normalization failed. Parsed response was:', data);
      throw new Error('AI response did not include valid itinerary days');
    }

    return itinerary;
  } catch (error) {
    console.error('Gemini itinerary error:', error);
    if (error.response) {
      console.error('Full error details:', JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
  */

  // OpenRouter Implementation
  console.log('Starting OpenRouter Itinerary Generation...');
  const { destination, startDate, endDate, budget, preferences, memberCount } = tripData;
  const days = getTripDayCount(startDate, endDate);
  const destinationName = toDestinationName(destination);

  const prompt = `Create a ${days}-day travel itinerary for ${destinationName}. Trip dates: ${startDate || 'unknown'} to ${endDate || 'unknown'}. Budget: ${budget?.total || 'not specified'} ${budget?.currency || ''}. Travelers: ${memberCount || 'not specified'}. Preferences: ${JSON.stringify(preferences || {})}. Return JSON with "itinerary" array containing days with day, date, title, and activities (time, activity, location, description, estimatedCost, category).`;

  try {
    const text = await callOpenRouter(prompt, "You are a professional travel planner. Return only valid JSON. Do not include markdown.");
    const data = extractJSON(text);
    if (!data) throw new Error('Failed to parse OpenRouter response');
    const itinerary = normalizeItinerary(data, tripData);
    if (!itinerary.length) throw new Error('OpenRouter response did not include valid itinerary days');
    return itinerary;
  } catch (error) {
    console.error('OpenRouter itinerary error:', error);
    throw error;
  }
};

// Get destination suggestions
const getDestinationSuggestions = async ({ interests, budget, duration, travelStyle, departingFrom }) => {
  /*
  console.log('Fetching AI Suggestions...');
  const model = getModel();
  const prompt = `Suggest 6 destinations for ${interests?.join(', ')}. Return JSON.`;
  try {
    const result = await model.generateContent(prompt);
    const data = extractJSON(result.response.text());
    return data || { suggestions: [] };
  } catch (err) {
    console.error('Suggestions API Error:', err);
    throw err;
  }
  */

  // OpenRouter Implementation
  console.log('Fetching OpenRouter Suggestions...');
  const prompt = `Suggest 6 unique travel destinations for interests: ${interests?.join(', ')}. Budget level: ${budget}. Style: ${travelStyle}. Return JSON: { "suggestions": [{ "name": "", "country": "", "emoji": "", "description": "" }] }`;
  try {
    const text = await callOpenRouter(prompt);
    return extractJSON(text) || { suggestions: [] };
  } catch (err) {
    console.error('OpenRouter Suggestions Error:', err);
    throw err;
  }
};

// AI Chat
const chatWithAI = async (messages, tripContext) => {
  /*
  console.log('AI Chat message received...');
  try {
    const model = getModel();
    const lastMessage = messages[messages.length - 1]?.content || '';
    const context = tripContext ? `Trip context: ${JSON.stringify(tripContext)}\n` : '';
    const result = await model.generateContent(`${context}Answer as a concise travel assistant.\nUser: ${lastMessage}`);
    return result.response.text();
  } catch (err) {
    console.error('Chat API Error:', err);
    throw err;
  }
  */

  // OpenRouter Implementation
  console.log('OpenRouter Chat message received...');
  try {
    const context = tripContext ? `Trip context: ${JSON.stringify(tripContext)}\n` : '';
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: `${context}You are WanderMind's concise AI travel assistant. Keep answers specific to the user's destination, dates, budget, preferences, and itinerary when that information is available. If the user asks something unrelated, gently connect it back to the trip.` },
          ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
        ]
      })
    });
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (error) {
        errorData = {};
      }
      throw new Error(`OpenRouter Chat Error: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I could not generate a response right now.';
  } catch (err) {
    console.error('OpenRouter Chat Error:', err);
    throw err;
  }
};

// Generate packing list
const generatePackingList = async (data) => {
  /*
  console.log('Generating Packing List...');
  try {
    const model = getModel();
    const result = await model.generateContent(`
Create a smart packing list for ${data.destination}.
Duration: ${data.duration || 'unknown'} days.
Activities: ${(data.activities || []).join(', ') || 'general travel'}.
Season/weather: ${data.season || 'variable'}.

Return ONLY valid JSON:
{
  "categories": [
    { "name": "Essentials", "icon": "bag", "items": ["Passport", "Phone charger"] }
  ]
}`);
    return normalizePackingList(extractJSON(result.response.text()) || {});
  } catch (err) {
    console.error('Packing List API Error:', err);
    throw err;
  }
  */

  // OpenRouter Implementation
  console.log('Generating OpenRouter Packing List...');
  const prompt = `Create a smart packing list for ${data.destination}. Duration: ${data.duration} days. Activities: ${(data.activities || []).join(', ') || 'general travel'}. Return only valid JSON with this exact shape: { "categories": [{ "name": "Essentials", "icon": "bag", "items": ["Passport", "Phone charger"] }] }. Include 5 to 7 useful categories and 5 to 8 items per category.`;
  try {
    const text = await callOpenRouter(prompt, "You create practical destination-specific packing lists. Return only valid JSON. Do not include markdown.");
    const packingList = normalizePackingList(extractJSON(text) || {});
    if (!packingList.categories.length) throw new Error('OpenRouter response did not include packing categories');
    return packingList;
  } catch (err) {
    console.error('OpenRouter Packing List Error:', err);
    throw err;
  }
};

// Budget optimization
const optimizeBudget = async (data) => {
  /*
  console.log('Optimizing Budget...');
  try {
    const model = getModel();
    const result = await model.generateContent(`Budget for ${data.destination}. Return JSON.`);
    return extractJSON(result.response.text()) || { breakdown: {} };
  } catch (err) {
    console.error('Budget API Error:', err);
    throw err;
  }
  */

  // OpenRouter Implementation
  console.log('Optimizing OpenRouter Budget...');
  const prompt = `Suggest a budget breakdown for a trip to ${data.destination} with a total budget of ${data.budget}. Return JSON: { "breakdown": { "accommodation": 0, "food": 0, "transport": 0, "activities": 0, "other": 0 } }`;
  try {
    const text = await callOpenRouter(prompt);
    return extractJSON(text) || { breakdown: {} };
  } catch (err) {
    console.error('OpenRouter Budget Error:', err);
    throw err;
  }
};

// Travel Estimates
const getTravelEstimates = async (data) => {
  /*
  console.log('Getting Travel Estimates...');
  try {
    const model = getModel();
    const result = await model.generateContent(`Time/Cost from ${data.fromCity} to ${data.destination}. Return JSON.`);
    return extractJSON(result.response.text()) || { methods: [] };
  } catch (err) {
    console.error('Estimates API Error:', err);
    throw err;
  }
  */

  // OpenRouter Implementation
  console.log('Getting OpenRouter Travel Estimates...');
  const prompt = `Estimate travel time and typical cost from ${data.fromCity} to ${data.destination}. Return only valid JSON: { "methods": [{ "type": "Flight", "icon": "plane", "time": "2h 10m", "cost": "Rs 4500" }, { "type": "Car", "icon": "car", "time": "", "cost": "" }, { "type": "Bike", "icon": "bike", "time": "", "cost": "" }, { "type": "Bus", "icon": "bus", "time": "", "cost": "" }, { "type": "Train", "icon": "train", "time": "", "cost": "" }, { "type": "Walk", "icon": "walk", "time": "", "cost": "Free" }] }. Always include all six types: Flight, Car, Bike, Bus, Train, Walk.`;
  try {
    const text = await callOpenRouter(prompt, "You estimate travel options. Return only valid JSON. Do not include markdown.");
    return normalizeTravelEstimates(extractJSON(text) || {});
  } catch (err) {
    console.error('OpenRouter Estimates Error:', err);
    throw err;
  }
};

module.exports = {
  generateItinerary,
  getDestinationSuggestions,
  chatWithAI,
  generatePackingList,
  optimizeBudget,
  getTravelEstimates
};

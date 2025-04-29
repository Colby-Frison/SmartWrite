// Express server for AiSimplify - Provides API endpoint for text summarization using Google's Generative AI
require('dotenv').config();              // Load environment variables from .env file

const express = require('express');      // Web server framework
const cors    = require('cors');         // Enable Cross-Origin Resource Sharing
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Google's Generative AI client

// ---------- Gemini API Configuration ----------
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Initialize with API key from .env
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Select the Gemini model variant

// ---------- Express Server Setup ----------
const app = express();
app.use(cors());       // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

/**
 * POST /api/summarize - Summarizes text using Gemini AI
 * 
 * Request body:
 *   - text: The content to summarize (required)
 *   - maxTokens: Maximum length of the summary (optional, default: 512)
 * 
 * Response:
 *   - 200: { summary: "Summarized content" }
 *   - 400: { error: "Missing text" }
 *   - 500: { error: "Gemini error" }
 */
app.post('/api/summarize', async (req, res) => {
  try {
    const { text, maxTokens = 512 } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    // Construct prompt for the Gemini model
    const prompt = `Summarize the following text in clear, concise way,add bullet points, headings and subheadings:\n\n${text}`;
    const resp   = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens }
    });

    res.json({ summary: resp.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gemini error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server listening on port ${PORT}`));

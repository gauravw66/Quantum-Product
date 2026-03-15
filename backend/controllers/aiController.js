const aiService = require('../services/aiService');

const generateCircuit = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const code = await aiService.generateQuantumCode(prompt);
        res.json({ code });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating quantum code' });
    }
};

module.exports = { generateCircuit };

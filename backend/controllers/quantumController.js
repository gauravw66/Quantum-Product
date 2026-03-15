const ibmService = require('../services/ibmQuantumService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const connectQuantum = async (req, res) => {
    try {
        const { token, provider, backendName, instance } = req.body;
        const userId = req.user.userId;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const isValid = await ibmService.validateApiKey(token);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid IBM Quantum Token' });
        }

        // Remove existing accounts for this user to avoid confusion
        await prisma.quantumAccount.deleteMany({ where: { userId } });

        // In a real app, encrypt the token here
        const account = await prisma.quantumAccount.create({
            data: {
                userId,
                provider: provider || 'IBM',
                token: token,
                backendName: backendName,
                instance: instance
            }
        });

        res.status(201).json({ message: 'Quantum account connected', accountId: account.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Error connecting quantum account', 
            error: error.message 
        });
    }
};

const getBackends = async (req, res) => {
    try {
        const userId = req.user.userId;
        const account = await prisma.quantumAccount.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!account) {
            return res.status(404).json({ message: 'No quantum account found' });
        }

        const backends = await ibmService.getAvailableBackends(account.token);
        res.json(backends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching backends' });
    }
};

module.exports = { connectQuantum, getBackends };

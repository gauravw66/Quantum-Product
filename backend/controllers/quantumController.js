const ibmService = require('../services/ibmQuantumService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const connectQuantum = async (req, res) => {
    try {
        const { token, apiToken, provider, backendName, instance, name } = req.body;
        const finalToken = (token || apiToken)?.trim();
        const userId = req.user.userId;

        if (!finalToken) {
            return res.status(400).json({ message: 'Token is required' });
        }
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Name is required for the API key' });
        }

        console.log(`Attempting to connect account for user ${userId} with key ending in ...${finalToken.slice(-4)}`);
        
        try {
            await ibmService.validateApiKey(finalToken);
        } catch (error) {
            console.error('Validation Error Details:', error.message);
            return res.status(400).json({ 
                error: 'Invalid IBM Quantum Token', 
                message: error.message 
            });
        }

        // In a real app, encrypt the token here
        const account = await prisma.quantumAccount.create({
            data: {
                userId,
                provider: provider || 'IBM',
                token: finalToken,
                name: name.trim(),
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
        res.status(500).json({
            message: 'Error fetching backends',
            error: error.message
        });
    }
};

// Get all quantum accounts for the user
const getQuantumAccounts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const accounts = await prisma.quantumAccount.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, token: true, provider: true, backendName: true, instance: true, createdAt: true, name: true }
        });
        // Mask the token for security
        const masked = accounts.map(acc => ({
            ...acc,
            apiToken: '****' + acc.token.slice(-8),
            token: undefined
        }));
        res.json(masked);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching quantum accounts' });
    }
};

// Delete a quantum account by id
const deleteQuantumAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const account = await prisma.quantumAccount.findUnique({ where: { id } });
        if (!account || account.userId !== userId) {
            return res.status(404).json({ message: 'Account not found' });
        }
        await prisma.quantumAccount.delete({ where: { id } });
        res.json({ message: 'Account deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting quantum account' });
    }
};

module.exports = { connectQuantum, getBackends, getQuantumAccounts, deleteQuantumAccount };

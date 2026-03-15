const ibmService = require('../services/ibmQuantumService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const runJob = async (req, res) => {
    try {
        let { jobName, code, backend, moduleId } = req.body;
        const userId = req.user.userId;

        if (moduleId) {
            const module = await prisma.module.findUnique({
                where: { id: moduleId }
            });
            if (!module) {
                return res.status(404).json({ message: 'Module not found' });
            }
            code = module.qiskitCodeTemplate;
            if (!jobName) jobName = module.name;
        }

        if (!code || !backend) {
            return res.status(400).json({ message: 'Code (or moduleId) and backend are required' });
        }

        const account = await prisma.quantumAccount.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!account) {
            return res.status(404).json({ message: 'Quantum account not connected' });
        }

        // Submit to IBM
        const ibmJob = await ibmService.runJob(account.token, code, backend, account.instance);

        // Store in DB
        const job = await prisma.job.create({
            data: {
                userId,
                jobName: jobName || 'Untitled Job',
                code,
                backend,
                status: ibmJob.status,
                ibmJobId: ibmJob.ibmJobId
            }
        });

        res.status(201).json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Error running job',
            error: error.response?.data || error.message 
        });
    }
};

const getJobs = async (req, res) => {
    try {
        const userId = req.user.userId;
        const jobs = await prisma.job.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const job = await prisma.job.findUnique({
            where: { id }
        });

        if (!job || job.userId !== userId) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // If job is not completed, we might want to poll IBM here
        if (job.status !== 'COMPLETED') {
            const account = await prisma.quantumAccount.findFirst({ where: { userId } });
            const status = await ibmService.getJobStatus(account.token, job.ibmJobId);
            
            if (status === 'COMPLETED') {
                const result = await ibmService.getJobResult(account.token, job.ibmJobId);
                await prisma.job.update({
                    where: { id },
                    data: { status: 'COMPLETED', result }
                });
                job.status = 'COMPLETED';
                job.result = result;
            }
        }

        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching job details' });
    }
};

module.exports = { runJob, getJobs, getJobById };

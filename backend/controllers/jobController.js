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

        // Proactive sync for non-terminal jobs
        const account = await prisma.quantumAccount.findFirst({ where: { userId } });
        if (account) {
            for (let job of jobs) {
                const currentStatus = (job.status || '').toUpperCase();
                if (currentStatus !== 'COMPLETED' && currentStatus !== 'FAILED' && currentStatus !== 'CANCELLED') {
                    try {
                        const newStatus = await ibmService.getJobStatus(account.token, job.ibmJobId);
                        const normalizedNewStatus = newStatus.toUpperCase();
                        
                        if (normalizedNewStatus !== currentStatus) {
                            let updateData = { status: newStatus }; // Store original case in DB for UI
                            
                            if (normalizedNewStatus === 'COMPLETED') {
                                const result = await ibmService.getJobResult(account.token, job.ibmJobId);
                                updateData.result = result;
                            }
                            
                            await prisma.job.update({
                                where: { id: job.id },
                                data: updateData
                            });
                            
                            // Update local object for response
                            job.status = newStatus;
                            if (updateData.result) job.result = updateData.result;
                        }
                    } catch (e) {
                        console.error(`Sync failed for job ${job.ibmJobId}:`, e.message);
                    }
                }
            }
        }

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

        // If job is not completed, or results are missing, poll IBM
        const currentStatus = (job.status || '').toUpperCase();
        const hasResults = job.result && job.result.probabilities && Object.keys(job.result.probabilities).length > 0;
        const needsSync = (currentStatus === 'COMPLETED' && !hasResults) || 
                         (currentStatus !== 'COMPLETED' && currentStatus !== 'FAILED' && currentStatus !== 'CANCELLED');

        if (needsSync) {
            const account = await prisma.quantumAccount.findFirst({ where: { userId } });
            if (account) {
                const status = await ibmService.getJobStatus(account.token, job.ibmJobId);
                const normalizedStatus = (status || '').toUpperCase();
                
                // Always fetch result if we need sync and it's completed on IBM
                if (normalizedStatus === 'COMPLETED') {
                    const result = await ibmService.getJobResult(account.token, job.ibmJobId);
                    
                    const updatedJob = await prisma.job.update({
                        where: { id },
                        data: { status: status, result: result }
                    });
                    
                    return res.json(updatedJob);
                } else if (normalizedStatus !== currentStatus) {
                    const updatedJob = await prisma.job.update({
                        where: { id },
                        data: { status: status }
                    });
                     return res.json(updatedJob);
                }
            }
        }

        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching job details' });
    }
};

const getRawInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const job = await prisma.job.findUnique({ where: { id } });
        if (!job || job.userId !== userId) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const account = await prisma.quantumAccount.findFirst({ where: { userId } });
        if (!account) return res.status(404).json({ message: 'Quantum account not found' });

        const rawData = await ibmService.getRawJobInfo(account.token, job.ibmJobId);
        res.json(rawData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching raw job info' });
    }
};

const getRawResults = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const job = await prisma.job.findUnique({ where: { id } });
        if (!job || job.userId !== userId) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const account = await prisma.quantumAccount.findFirst({ where: { userId } });
        if (!account) return res.status(404).json({ message: 'Quantum account not found' });

        const rawData = await ibmService.getRawJobResults(account.token, job.ibmJobId);
        res.json(rawData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching raw results' });
    }
};

module.exports = { runJob, getJobs, getJobById, getRawInfo, getRawResults };

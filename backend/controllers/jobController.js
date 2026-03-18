const ibmService = require('../services/ibmQuantumService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parsePositiveSeconds = (value) => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        const match = normalized.match(/[\d.]+/);
        if (!match) return null;

        const numeric = Number.parseFloat(match[0]);
        if (!Number.isFinite(numeric) || numeric <= 0) return null;

        if (normalized.includes('ms')) {
            return numeric / 1000;
        }

        return numeric;
    }

    return null;
};

const attachDurationMetadata = (result, durationSeconds) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return result;
    }

    const safeResult = (result && typeof result === 'object' && !Array.isArray(result)) ? result : {};
    const existingMetadata = (safeResult.metadata && typeof safeResult.metadata === 'object' && !Array.isArray(safeResult.metadata))
        ? safeResult.metadata
        : {};

    return {
        ...safeResult,
        metadata: {
            ...existingMetadata,
            estimatedRunningTimeSeconds: Number(durationSeconds.toFixed(3))
        }
    };
};

const getJobDurationSeconds = (job) => {
    const metadata = job?.result?.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return null;
    }

    const candidates = [
        metadata.estimatedRunningTimeSeconds,
        metadata.estimated_running_time_seconds,
        metadata.executionTimeSeconds,
        metadata.execution_time_seconds,
        metadata.timeTakenSeconds,
        metadata.time_taken_seconds,
        metadata.executionTime,
        metadata.time_taken,
        metadata.running_time
    ];

    for (const candidate of candidates) {
        const seconds = parsePositiveSeconds(candidate);
        if (seconds !== null) {
            return seconds;
        }
    }

    return null;
};

const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return 'N/A';
    }

    if (seconds < 1) {
        return `${Math.round(seconds * 1000)}ms`;
    }

    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }

    return `${seconds.toFixed(1)}s`;
};

const runJob = async (req, res) => {
    try {
        let { jobName, code, qasmCode, backend, moduleId } = req.body;
        if (!code && qasmCode) {
            code = qasmCode;
        }
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

        const normalizedCode = (code || '').trim();
        const isOpenQasm = /^OPENQASM\s+[0-9]+\.[0-9]+;/i.test(normalizedCode);
        if (!isOpenQasm) {
            return res.status(400).json({
                message: 'Invalid circuit format for IBM runtime',
                error: 'Module/custom code must be a valid OpenQASM string starting with OPENQASM <version>;'
            });
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

                                let estimatedRunningTimeSeconds = null;
                                try {
                                    const rawInfo = await ibmService.getRawJobInfo(account.token, job.ibmJobId);
                                    estimatedRunningTimeSeconds = parsePositiveSeconds(rawInfo?.estimated_running_time_seconds);
                                } catch (e) {
                                    console.error(`Runtime estimate unavailable for job ${job.ibmJobId}:`, e.message);
                                }

                                updateData.result = attachDurationMetadata(result, estimatedRunningTimeSeconds);
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

        const account = await prisma.quantumAccount.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        let ibmPortalUrl = null;
        if (account && job.ibmJobId) {
            try {
                ibmPortalUrl = await ibmService.getJobPortalUrl(account.token, job.ibmJobId);
            } catch (e) {
                console.error('Portal URL generation failed:', e.message);
            }
        }

        // If job is not completed, or results are missing, poll IBM
        const currentStatus = (job.status || '').toUpperCase();
        const hasResults = job.result && job.result.probabilities && Object.keys(job.result.probabilities).length > 0;
        const needsSync = (currentStatus === 'COMPLETED' && !hasResults) || 
                         (currentStatus !== 'COMPLETED' && currentStatus !== 'FAILED' && currentStatus !== 'CANCELLED');

        if (needsSync) {
            if (account) {
                const status = await ibmService.getJobStatus(account.token, job.ibmJobId);
                const normalizedStatus = (status || '').toUpperCase();
                
                // Always fetch result if we need sync and it's completed on IBM
                if (normalizedStatus === 'COMPLETED') {
                    const result = await ibmService.getJobResult(account.token, job.ibmJobId);

                    let estimatedRunningTimeSeconds = null;
                    try {
                        const rawInfo = await ibmService.getRawJobInfo(account.token, job.ibmJobId);
                        estimatedRunningTimeSeconds = parsePositiveSeconds(rawInfo?.estimated_running_time_seconds);
                    } catch (e) {
                        console.error(`Runtime estimate unavailable for job ${job.ibmJobId}:`, e.message);
                    }
                    
                    const updatedJob = await prisma.job.update({
                        where: { id },
                        data: { status: status, result: attachDurationMetadata(result, estimatedRunningTimeSeconds) }
                    });

                    return res.json({ ...updatedJob, ibmPortalUrl });
                } else if (normalizedStatus !== currentStatus) {
                    const updatedJob = await prisma.job.update({
                        where: { id },
                        data: { status: status }
                    });
                     return res.json({ ...updatedJob, ibmPortalUrl });
                }
            }
        }

        res.json({ ...job, ibmPortalUrl });
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

// Get job statistics for dashboard
const getJobStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Fetch all jobs for the user
        const jobs = await prisma.job.findMany({
            where: { userId },
            select: { id: true, status: true, ibmJobId: true, result: true }
        });

        const total = jobs.length;
        const completed = jobs.filter(j => (j.status || '').toUpperCase() === 'COMPLETED').length;
        const failed = jobs.filter(j => (j.status || '').toUpperCase() === 'FAILED').length;

        const completedJobs = jobs.filter(j => (j.status || '').toUpperCase() === 'COMPLETED');
        const durations = completedJobs
            .map(getJobDurationSeconds)
            .filter((seconds) => seconds !== null);

        // Backfill one recent completed job using IBM metadata if no stored duration exists yet.
        if (durations.length === 0) {
            const candidate = completedJobs.find((job) => Boolean(job.ibmJobId));
            if (candidate) {
                const account = await prisma.quantumAccount.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' }
                });

                if (account) {
                    try {
                        const rawInfo = await ibmService.getRawJobInfo(account.token, candidate.ibmJobId);
                        const estimateSeconds = parsePositiveSeconds(rawInfo?.estimated_running_time_seconds);

                        if (estimateSeconds !== null) {
                            durations.push(estimateSeconds);

                            const enrichedResult = attachDurationMetadata(candidate.result, estimateSeconds);
                            await prisma.job.update({
                                where: { id: candidate.id },
                                data: { result: enrichedResult }
                            });
                        }
                    } catch (e) {
                        console.error(`Stats duration backfill failed for job ${candidate.ibmJobId}:`, e.message);
                    }
                }
            }
        }

        const avgDurationSeconds = durations.length > 0
            ? durations.reduce((sum, value) => sum + value, 0) / durations.length
            : null;

        const avgTime = avgDurationSeconds === null ? 'N/A' : formatDuration(avgDurationSeconds);

        res.json({ total, completed, failed, avgTime });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching job stats' });
    }
};

module.exports = { runJob, getJobs, getJobById, getRawInfo, getRawResults, getJobStats };

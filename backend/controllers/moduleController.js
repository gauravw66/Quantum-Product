const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getModules = async (req, res) => {
    try {
        const modules = await prisma.module.findMany();
        res.json(modules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching modules' });
    }
};

const seedModules = async (req, res) => {
    try {
        const modules = [
            {
                name: 'Bell State',
                description: '2-qubit entanglement circuit. (H-gate on q0, then CNOT q0->q1)',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[0], q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nc[0] = measure q[0];\nc[1] = measure q[1];'
            },
            {
                name: 'GHZ State',
                description: '3-qubit GHZ circuit transpiled to ISA-safe native gates for IBM hardware.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nbit[3] c;\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\ncz q[1], q[0];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\ncz q[1], q[2];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\nc[0] = measure q[0];\nc[1] = measure q[1];\nc[2] = measure q[2];'
            },
            {
                name: 'Quantum Fourier Transform (QFT)',
                description: 'Approximate 3-qubit QFT circuit transpiled to native IBM gate set.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nbit[3] c;\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\ncz q[1], q[2];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[0], q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nc[0] = measure q[0];\nc[1] = measure q[1];\nc[2] = measure q[2];'
            },
            {
                name: 'Deutsch-Jozsa Algorithm',
                description: 'Solves the Deutsch-Jozsa problem for a balanced oracle.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nbit[2] c;\nx q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[0], q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[2], q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\nc[0] = measure q[0];\nc[1] = measure q[2];'
            },
            {
                name: 'Superdense Coding',
                description: 'Demonstrates superdense coding protocol.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[0], q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nx q[0];\nrz(pi) q[0];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[0], q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nc[0] = measure q[0];\nc[1] = measure q[1];'
            },
            {
                name: 'E91 Protocol',
                description: 'Implements the E91 quantum key distribution protocol.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\ncz q[0], q[1];\nrz(pi/2) q[1];\nsx q[1];\nrz(pi/2) q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nc[0] = measure q[0];\nc[1] = measure q[1];'
            },
            {
                name: 'Bit Flip Code',
                description: '3-qubit bit-flip encode/error/decode demonstration in native IBM gates.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nbit[3] c;\nx q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\ncz q[1], q[0];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\ncz q[1], q[2];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\nx q[0];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\ncz q[1], q[0];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\ncz q[1], q[2];\nrz(pi/2) q[2];\nsx q[2];\nrz(pi/2) q[2];\nc[0] = measure q[0];\nc[1] = measure q[1];\nc[2] = measure q[2];'
            },
            {
                name: 'Phase Estimation',
                description: 'Single-bit phase estimation example transpiled to native IBM gates.',
                qiskitCodeTemplate: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[1] c;\nx q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\ncz q[0], q[1];\nrz(pi/2) q[0];\nsx q[0];\nrz(pi/2) q[0];\nc[0] = measure q[0];'
            }
        ];

        let created = 0;
        let updated = 0;
        let deleted = 0;
        for (const m of modules) {
            const aliases = [m.name];
            if (m.name === 'Deutsch-Jozsa Algorithm') {
                // Migrate legacy non-ASCII record name to canonical ASCII name.
                aliases.push('Deutsch–Jozsa Algorithm');
            }

            const existing = await prisma.module.findMany({
                where: { name: { in: aliases } },
                orderBy: { id: 'asc' },
                select: { id: true }
            });

            if (existing.length > 0) {
                const keeper = existing[0];
                await prisma.module.update({
                    where: { id: keeper.id },
                    data: {
                        name: m.name,
                        description: m.description,
                        qiskitCodeTemplate: m.qiskitCodeTemplate
                    }
                });

                // Remove duplicate stale rows for the same module.
                const duplicateIds = existing.slice(1).map((r) => r.id);
                if (duplicateIds.length > 0) {
                    const result = await prisma.module.deleteMany({
                        where: { id: { in: duplicateIds } }
                    });
                    deleted += result.count;
                }

                updated += 1;
            } else {
                await prisma.module.create({ data: m });
                created += 1;
            }
        }

        res.json({
            message: 'Modules seeded successfully',
            created,
            updated,
            deleted,
            totalRequested: modules.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error seeding modules', error: error.message });
    }
};

module.exports = { getModules, seedModules };

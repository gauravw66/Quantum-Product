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
                qiskitCodeTemplate: 'from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()'
            },
            {
                name: 'GHZ State',
                description: '3-qubit entanglement circuit (Greenberger-Horne-Zeilinger state).',
                qiskitCodeTemplate: 'from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(3)\nqc.h(0)\nqc.cx(0, 1)\nqc.cx(0, 2)\nqc.measure_all()'
            }
        ];

        for (const m of modules) {
            await prisma.module.upsert({
                where: { name: m.name }, 
                update: m,
                create: m
            });
        }
        res.json({ message: 'Bell State and GHZ State modules seeded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error seeding modules' });
    }
};

module.exports = { getModules, seedModules };

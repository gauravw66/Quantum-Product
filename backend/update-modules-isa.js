const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ISA-compatible QASM 3.0 circuits for IBM Heron r2 QPUs
// Native gates: rz, sx, x, cz, measure

const BELL_STATE_ISA = `OPENQASM 3.0;
include "stdgates.inc";
bit[2] meas;
rz(pi/2) $0;
sx $0;
rz(pi/2) $0;
rz(pi/2) $1;
sx $1;
rz(pi/2) $1;
cz $0, $1;
rz(pi/2) $1;
sx $1;
rz(pi/2) $1;
meas[0] = measure $0;
meas[1] = measure $1;`;

const GHZ_STATE_ISA = `OPENQASM 3.0;
include "stdgates.inc";
bit[3] meas;
rz(pi/2) $0;
sx $0;
rz(pi/2) $0;
rz(pi/2) $1;
sx $1;
rz(pi/2) $1;
cz $0, $1;
rz(pi/2) $1;
sx $1;
rz(pi/2) $1;
rz(pi/2) $2;
sx $2;
rz(pi/2) $2;
cz $1, $2;
rz(pi/2) $2;
sx $2;
rz(pi/2) $2;
meas[0] = measure $0;
meas[1] = measure $1;
meas[2] = measure $2;`;

async function updateModules() {
    // Update Bell State module
    const bellResult = await prisma.module.updateMany({
        where: { name: { contains: 'Bell' } },
        data: { qiskitCodeTemplate: BELL_STATE_ISA }
    });
    console.log('Bell State modules updated:', bellResult.count);

    // Update GHZ State module
    const ghzResult = await prisma.module.updateMany({
        where: { name: { contains: 'GHZ' } },
        data: { qiskitCodeTemplate: GHZ_STATE_ISA }
    });
    console.log('GHZ State modules updated:', ghzResult.count);

    // Verify
    const modules = await prisma.module.findMany();
    modules.forEach(m => {
        console.log(`\nModule: ${m.name} (${m.id})`);
        console.log(`Code Preview: ${m.qiskitCodeTemplate.substring(0, 80)}...`);
    });

    await prisma.$disconnect();
}

updateModules();

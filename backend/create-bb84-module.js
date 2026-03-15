const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// BB84 QKD with Eavesdropper Detection
// ISA-compatible for IBM Heron r2 QPUs (ibm_fez)
// Native gates: rz, sx, x, cz, measure
// ============================================================
//
// Protocol:
//   $0: Alice's photon 1 (prepared in X basis as |+⟩)
//   $1: Eve's intercept ancilla for photon 1
//   $2: Alice's photon 2 (prepared in Z basis as |1⟩)
//   $3: Eve's intercept ancilla for photon 2
//
// Without eavesdropping:
//   - Bob measures photon 1 in X basis → deterministic result (0)
//   - Bob measures photon 2 in Z basis → deterministic result (1)
//
// With eavesdropping (CZ entanglement simulates intercept-resend):
//   - Eve's CZ on photon 1 disturbs the superposition → Bob sees ~50/50 noise
//   - Eve's CZ on photon 2 adds phase → Bob still sees |1⟩ in Z basis
//   - Error rate on X-basis photons reveals eavesdropping!
//   - Eve's ancillas ($1, $3) leak partial information
//
// Expected outcome: meas[0] should be noisy (eavesdropping detected),
//   meas[2] should remain 1 (Z-basis unaffected by phase)
// ============================================================

const BB84_EVE_DETECTION_ISA = `OPENQASM 3.0;
include "stdgates.inc";
bit[4] meas;
rz(pi/2) $0;
sx $0;
rz(pi/2) $0;
x $2;
cz $0, $1;
cz $2, $3;
rz(pi/2) $0;
sx $0;
rz(pi/2) $0;
meas[0] = measure $0;
meas[1] = measure $1;
meas[2] = measure $2;
meas[3] = measure $3;`;

async function createAndTest() {
    // === 1. Test the circuit on IBM hardware ===
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const resInst = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const qi = resInst.data.resources.find(r => r.crn && r.crn.includes('quantum'));
    const crn = qi.crn;

    console.log('=== Testing BB84 Eavesdropper Detection Circuit ===');
    const payload = {
        program_id: 'sampler',
        backend: 'ibm_fez',
        params: {
            pubs: [[BB84_EVE_DETECTION_ISA, null, 1024]],
            version: "2"
        }
    };

    try {
        const res = await axios.post('https://us-east.quantum-computing.cloud.ibm.com/jobs', payload, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn,
                'Content-Type': 'application/json',
                'IBM-API-Version': '2025-01-01'
            }
        });
        console.log('SUCCESS! Job ID:', res.data.id);
        console.log('Backend:', res.data.backend);
    } catch (e) {
        console.log('FAILED:', e.response ? JSON.stringify(e.response.data).substring(0, 500) : e.message);
        await prisma.$disconnect();
        return;
    }

    // === 2. Create the module in the database ===
    console.log('\n=== Creating BB84 Module in Database ===');
    
    // Check if it already exists
    const existing = await prisma.module.findFirst({
        where: { name: { contains: 'BB84' } }
    });

    if (existing) {
        await prisma.module.update({
            where: { id: existing.id },
            data: { qiskitCodeTemplate: BB84_EVE_DETECTION_ISA }
        });
        console.log('Updated existing BB84 module:', existing.id);
    } else {
        const newModule = await prisma.module.create({
            data: {
                name: 'BB84 QKD - Eavesdropper Detection',
                description: 'BB84 Quantum Key Distribution protocol with eavesdropper (Eve) detection. Simulates an intercept-resend attack using CZ entanglement. Alice sends photons in X and Z bases. Eve eavesdrops via entanglement. Bob measures and detects interference from mismatch in expected vs observed results. Error rate on X-basis qubits reveals eavesdropping.',
                qiskitCodeTemplate: BB84_EVE_DETECTION_ISA
            }
        });
        console.log('Created new BB84 module:', newModule.id);
    }

    // Verify all modules
    const modules = await prisma.module.findMany();
    console.log('\n=== All Modules ===');
    modules.forEach(m => {
        console.log(`  ${m.name} (${m.id})`);
    });

    await prisma.$disconnect();
}

createAndTest();

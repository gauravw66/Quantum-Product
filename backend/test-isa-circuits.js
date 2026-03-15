const axios = require('axios');

// ============================================================
// ISA-compatible circuits for IBM Heron r2 QPUs (e.g. ibm_fez)
// Native gates: rz, sx, x, cz, measure
// ============================================================

// Bell State: H(q0) -> CNOT(q0, q1) -> measure
// H = rz(pi/2) sx rz(pi/2)
// CNOT(c,t) = H(t) CZ(c,t) H(t)
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

// GHZ State: H(q0) -> CNOT(q0,q1) -> CNOT(q1,q2) -> measure
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

async function testBothCircuits() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    
    // Get IAM Token
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    // Get CRN
    const resInst = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const qi = resInst.data.resources.find(r => r.crn && r.crn.includes('quantum'));
    const crn = qi.crn;
    console.log('CRN:', crn);

    const circuits = [
        { name: 'Bell State', qasm: BELL_STATE_ISA },
        { name: 'GHZ State', qasm: GHZ_STATE_ISA }
    ];

    for (const circuit of circuits) {
        console.log(`\n=== Submitting: ${circuit.name} ===`);
        
        const payload = {
            program_id: 'sampler',
            backend: 'ibm_fez',
            params: {
                pubs: [
                    [circuit.qasm, null, 1024]
                ],
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
            console.log(`SUCCESS! Job ID: ${res.data.id}`);
            console.log(`Backend: ${res.data.backend}`);
        } catch (e) {
            console.log(`FAILED:`, e.response ? JSON.stringify(e.response.data).substring(0, 500) : e.message);
        }
    }
}

testBothCircuits();

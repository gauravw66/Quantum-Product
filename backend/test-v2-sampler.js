const axios = require('axios');

async function testV2Sampler() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
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

    const qasmCode = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\nh q[0];\ncx q[0],q[1];\nmeasure q -> c;';

    // Try different payload formats
    const payloads = [
        {
            name: 'V2 with version field',
            data: {
                program_id: 'sampler',
                version: 2,
                backend: 'ibm_fez',
                params: {
                    pubs: [[qasmCode, null, 1024]]
                }
            }
        },
        {
            name: 'circuit-runner program',
            data: {
                program_id: 'circuit-runner',
                backend: 'ibm_fez',
                params: {
                    circuits: [qasmCode],
                    shots: 1024
                }
            }
        }
    ];

    for (const p of payloads) {
        console.log(`\nTrying: ${p.name}`);
        try {
            const res = await axios.post('https://us-east.quantum-computing.cloud.ibm.com/jobs', p.data, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'Content-Type': 'application/json',
                    'IBM-API-Version': '2025-01-01'
                }
            });
            console.log('SUCCESS! Job ID:', res.data.id, 'Status:', res.data.status);
            break;
        } catch (e) {
            console.log('FAILED:', e.response ? JSON.stringify(e.response.data).substring(0, 300) : e.message);
        }
    }
}

testV2Sampler();

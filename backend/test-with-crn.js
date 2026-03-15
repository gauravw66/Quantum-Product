const axios = require('axios');

async function testWithCrn() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    // First, get the actual CRN
    const resInstances = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    console.log('All resource instances:');
    resInstances.data.resources.forEach(r => {
        console.log(`  Name: ${r.name}`);
        console.log(`  resource_id: ${r.resource_id}`);
        console.log(`  CRN: ${r.crn}`);
        console.log(`  Region: ${r.region_id}`);
        console.log('---');
    });

    // Find the quantum instance
    const quantumInstance = resInstances.data.resources.find(r => 
        r.crn && r.crn.includes('quantum-computing')
    );

    if (!quantumInstance) {
        console.log('No quantum instance found! Trying all instances...');
        // Try each CRN
        for (const r of resInstances.data.resources) {
            console.log(`\nTrying CRN: ${r.crn}`);
            try {
                const res = await axios.get('https://us-east.quantum-computing.cloud.ibm.com/jobs', {
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Service-CRN': r.crn
                    }
                });
                console.log('SUCCESS with this CRN!', res.status);
                break;
            } catch (e) {
                console.log('Failed:', e.response ? e.response.status : e.message);
            }
        }
        return;
    }

    const crn = quantumInstance.crn;
    console.log(`\nUsing Quantum CRN: ${crn}`);

    const qasmCode = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\nh q[0];\ncx q[0],q[1];\nmeasure q -> c;';

    const payload = {
        program_id: 'sampler',
        backend: 'ibm_fez',
        params: {
            pubs: [[qasmCode, null, 1024]]
        }
    };

    // Try with Service-CRN header
    const url = 'https://us-east.quantum-computing.cloud.ibm.com/jobs';
    console.log(`\nSubmitting to: ${url}`);
    try {
        const res = await axios.post(url, payload, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn,
                'Content-Type': 'application/json',
                'IBM-API-Version': '2025-01-01'
            }
        });
        console.log('SUCCESS!');
        console.log('Job ID:', res.data.id);
        console.log('Status:', res.data.status);
    } catch (e) {
        console.log('FAILED:', e.response ? e.response.status : e.message);
        if (e.response && e.response.data) {
            console.log('Error:', JSON.stringify(e.response.data).substring(0, 500));
        }
    }
}

testWithCrn();

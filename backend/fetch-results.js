const axios = require('axios');

async function fetchResults() {
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

    const jobIds = {
        'Bell State':  'd6raro3opkic73fivbrg',
        'GHZ State':   'd6raro4u243c73a17c20',
        'BB84 QKD':    'd6ratk4u243c73a17e20'
    };

    for (const [name, jobId] of Object.entries(jobIds)) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`  ${name} (Job: ${jobId})`);
        console.log(`${'='.repeat(50)}`);

        try {
            // Get job status
            const statusRes = await axios.get(`https://us-east.quantum-computing.cloud.ibm.com/jobs/${jobId}`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            console.log(`Status: ${statusRes.data.status}`);
            
            if (statusRes.data.status !== 'Completed') {
                console.log('Job not yet completed, skipping results...');
                continue;
            }

            // Get results
            const resultRes = await axios.get(`https://us-east.quantum-computing.cloud.ibm.com/jobs/${jobId}/results`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Service-CRN': crn,
                    'IBM-API-Version': '2025-01-01'
                }
            });
            
            console.log('\nRaw Result Data:');
            console.log(JSON.stringify(resultRes.data, null, 2).substring(0, 2000));

        } catch (e) {
            console.log('Error:', e.response ? JSON.stringify(e.response.data).substring(0, 300) : e.message);
        }
    }
}

fetchResults();

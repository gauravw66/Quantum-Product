const axios = require('axios');

async function parseResults() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;
    const resInst = await axios.get('https://resource-controller.cloud.ibm.com/v2/resource_instances', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const crn = resInst.data.resources.find(r => r.crn && r.crn.includes('quantum')).crn;

    const jobs = [
        { name: 'Bell State', id: 'd6raro3opkic73fivbrg', bits: 2 },
        { name: 'GHZ State', id: 'd6raro4u243c73a17c20', bits: 3 },
        { name: 'BB84 QKD - Eavesdropper Detection', id: 'd6ratk4u243c73a17e20', bits: 4 }
    ];

    for (const job of jobs) {
        const resultRes = await axios.get(`https://us-east.quantum-computing.cloud.ibm.com/jobs/${job.id}/results`, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Service-CRN': crn,
                'IBM-API-Version': '2025-01-01'
            }
        });

        const samples = resultRes.data.results[0].data.meas.samples;
        const totalShots = samples.length;

        // Convert hex samples to binary bit strings and count
        const counts = {};
        for (const hex of samples) {
            const num = parseInt(hex, 16);
            const bits = num.toString(2).padStart(job.bits, '0');
            counts[bits] = (counts[bits] || 0) + 1;
        }

        // Sort by count descending
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        console.log(`\n${'═'.repeat(55)}`);
        console.log(`  ${job.name}`);
        console.log(`  Job ID: ${job.id} | Shots: ${totalShots}`);
        console.log(`${'═'.repeat(55)}`);
        console.log(`  ${'State'.padEnd(10)} ${'Count'.padEnd(8)} Probability  Bar`);
        console.log(`  ${'─'.repeat(50)}`);

        for (const [state, count] of sorted) {
            const prob = (count / totalShots * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(count / totalShots * 30));
            console.log(`  |${state}⟩    ${String(count).padEnd(8)} ${prob.padStart(5)}%      ${bar}`);
        }
    }
}

parseResults();

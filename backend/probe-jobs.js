const axios = require('axios');

async function probeJobs() {
    const urls = [
        'https://quantum-computing.ibm.com/api/Jobs',
        'https://api.quantum-computing.ibm.com/api/Jobs',
        'https://quantum.ibm.com/api/Jobs',
        'https://api.quantum.ibm.com/api/v1/jobs'
    ];

    const tokens = [
        'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S', // IAM
        // User's newest token is in DB, let's just use the IAM one for a quick reachability test 
        // OR try to get it from DB
    ];

    for (const url of urls) {
        try {
            console.log(`Probing: ${url}`);
            const res = await axios.options(url);
            console.log(`  [OPTIONS] ${res.status}`);
        } catch (e) {
            console.log(`  [OPTIONS] FAILED: ${e.message}`);
        }
    }
}

probeJobs();

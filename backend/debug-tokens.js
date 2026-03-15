const axios = require('axios');

async function checkTokens() {
    const tokens = [
        '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi', // From .env
        'MS_aCiRcB6tBmOhWEeJgY65tGtunjp7F83D71uuAb44S'  // From user request
    ];

    for (const token of tokens) {
        console.log(`\nChecking token: ${token.substring(0, 10)}...`);
        try {
            // Try Legacy Auth first
            let accessToken;
            try {
                const res = await axios.post('https://auth.quantum-computing.ibm.com/api/users/loginWithToken', { apiToken: token });
                accessToken = res.data.id;
                console.log('  Legacy Auth: SUCCESS');
            } catch (e) {
                console.log('  Legacy Auth: FAILED');
            }

            // Try IAM Auth if Legacy failed or just to check
            try {
                const params = new URLSearchParams();
                params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
                params.set('apikey', token);
                const res = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
                console.log('  IAM Auth: SUCCESS');
                if (!accessToken) accessToken = `Bearer ${res.data.access_token}`;
            } catch (e) {
                console.log('  IAM Auth: FAILED');
            }

            if (accessToken) {
                // Try to get user info to see which dashboard it belongs to
                try {
                    const userRes = await axios.get('https://quantum-computing.ibm.com/api/users/me', {
                        headers: { 'x-access-token': accessToken.replace('Bearer ', '') }
                    });
                    console.log('  Platform User Info:', userRes.data.email, userRes.data.username);
                } catch (e) {
                    console.log('  Platform User Info: FAILED (likely an IBM Cloud key)');
                }
            }
        } catch (err) {
            console.log('  Unexpected Error:', err.message);
        }
    }
}

checkTokens();

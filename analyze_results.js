const fs = require('fs');

const data = JSON.parse(fs.readFileSync('g:/IBM Product/job-d6rg8aropkic73fj56c0-result.json', 'utf8'));
const samples = data.results[0].data.meas.samples;

const counts = {};
samples.forEach(s => {
    counts[s] = (counts[s] || 0) + 1;
});

const total = samples.length;
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

const summary = sorted.map(([hex, count]) => {
    const val = parseInt(hex, 16);
    const bitstring = val.toString(2).padStart(4, '0');
    return {
        hex,
        bitstring,
        count,
        probability: ((count / total) * 100).toFixed(2) + '%'
    };
});

console.log(JSON.stringify(summary, null, 2));

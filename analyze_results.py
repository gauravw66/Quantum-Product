import json
from collections import Counter

with open('g:/IBM Product/job-d6rg8aropkic73fj56c0-result.json', 'r') as f:
    data = json.load(f)

samples = data['results'][0]['data']['meas']['samples']
counts = Counter(samples)
total = len(samples)

results = []
for hex_val, count in counts.most_common():
    val = int(hex_val, 16)
    bitstring = bin(val)[2:].zfill(4)
    prob = count / total
    results.append({
        "hex": hex_val,
        "bitstring": bitstring,
        "count": count,
        "probability": f"{prob:.2%}"
    })

print(json.dumps(results, indent=2))

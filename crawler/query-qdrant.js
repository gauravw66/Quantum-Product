import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';
import readline from 'readline';

// Config
const COLLECTION_NAME = 'quantum_docs';
const QDRANT_URL = 'https://08afc770-be71-4fc1-81d7-eff07fa8ce67.sa-east-1-0.aws.cloud.qdrant.io';
const QDRANT_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.O6f7-hziAnfyOTJwMmX8TXFg0Wd0WGH1F8OxpjquRmk';
const TOP_K = 5;

async function main() {
  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY || undefined,
  });
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function ask(query) {
    return new Promise(resolve => rl.question(query, resolve));
  }

  while (true) {
    const userQuery = await ask('\nEnter your .qasm or quantum question (or type exit): ');
    if (userQuery.trim().toLowerCase() === 'exit') break;
    const output = await embedder(userQuery, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    const searchResult = await client.search(COLLECTION_NAME, {
      vector,
      limit: TOP_K,
      with_payload: true
    });
    console.log(`\nTop ${TOP_K} relevant knowledge base chunks:`);
    searchResult.forEach((res, i) => {
      console.log(`\n[${i+1}] Score: ${res.score.toFixed(4)}`);
      console.log(res.payload.text);
      if (res.payload.source_file) {
        console.log(`Source: ${res.payload.source_file}`);
      }
    });
  }
  rl.close();
}

main().catch(console.error);

import fs from 'fs';
import path from 'path';
import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';

// Config
const DATA_DIR = path.resolve('..', 'data');
const COLLECTION_NAME = 'quantum_docs';
const QDRANT_URL = 'https://08afc770-be71-4fc1-81d7-eff07fa8ce67.sa-east-1-0.aws.cloud.qdrant.io'; // or cloud URL
const QDRANT_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.O6f7-hziAnfyOTJwMmX8TXFg0Wd0WGH1F8OxpjquRmk'; // set if using Qdrant Cloud
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const BATCH = 64;

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  return chunks;
}

function getMarkdownFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
}

function printProgress(current, total, prefix = '') {
  const barLength = 30;
  const percent = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * barLength);
  const bar = '='.repeat(filled) + '-'.repeat(barLength - filled);
  process.stdout.write(`\r${prefix}[${bar}] ${percent}% (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
}

async function main() {
  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY || undefined,
  });
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Create collection if not exists
  const collections = await client.getCollections();
  if (!collections.collections.some(c => c.name === COLLECTION_NAME)) {
    await client.recreateCollection(COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: 'Cosine',
      },
    });
  }

  const files = getMarkdownFiles(DATA_DIR);
  let points = [];
  let totalChunks = 0;
  let chunkMeta = [];
  // Count total chunks for progress bar
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const text = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(text);
    totalChunks += chunks.length;
    chunkMeta.push({ file, filePath, count: chunks.length });
  }
  let processed = 0;
  for (const meta of chunkMeta) {
    const text = fs.readFileSync(meta.filePath, 'utf-8');
    const chunks = chunkText(text);
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const output = await embedder(chunk, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);
      points.push({
        id: processed, // Qdrant requires integer or UUID
        vector,
        payload: {
          text: chunk,
          source_file: meta.file,
          source_path: meta.filePath,
        }
      });
      processed++;
      printProgress(processed, totalChunks, 'Embedding: ');
      process.stdout.write(` Chunk ${processed}/${totalChunks} done\n`);
    }
  }
  // Upload in batches
  for (let i = 0; i < points.length; i += BATCH) {
    await client.upsert(COLLECTION_NAME, {
      points: points.slice(i, i + BATCH)
    });
    printProgress(Math.min(i + BATCH, points.length), points.length, 'Uploading: ');
    process.stdout.write(` Uploaded batch ${Math.floor(i/BATCH)+1}\n`);
  }
  console.log(`Uploaded ${points.length} chunks to Qdrant collection '${COLLECTION_NAME}'.`);
}

main().catch(console.error);

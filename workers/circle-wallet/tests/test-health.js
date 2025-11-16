const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL } = require('./config');

async function testHealth() {
  console.log('Testing worker health at', WORKER_URL);
  const res = await fetch(`${WORKER_URL}/api/health`);
  if (!res.ok) throw new Error(`health check failed: ${res.status}`);
  const json = await res.json();
  console.log('Health check result:', json);
}

if (require.main === module) {
  testHealth().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = testHealth;

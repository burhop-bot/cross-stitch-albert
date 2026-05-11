const http = require('http');

const baseUrl = 'http://localhost:3000';

async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function test() {
  const tests = [
    { path: '/', name: 'Home page' },
    { path: '/grid', name: 'Grid Editor' },
    { path: '/image-to-chart', name: 'Image to Chart' },
    { path: '/export', name: 'Export/Legend' },
    { path: '/advanced', name: 'Advanced' },
  ];

  console.log('Running smoke tests...\n');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const { status, body } = await fetchPage(test.path);
      if (status === 200 && body.includes('<!DOCTYPE') || body.includes('<html') || body.includes('<div')) {
        console.log(`  ✅ ${test.name} (${test.path}) - Status: ${status}`);
        passed++;
      } else {
        console.log(`  ⚠️  ${test.name} (${test.path}) - Status: ${status} (unexpected response)`);
        console.log(`     Response preview: ${body.substring(0, 200)}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${test.name} (${test.path}) - Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

test();

const baseUrl = 'http://localhost:3000';

async function testApi(name, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text.substring(0, 100);
    }
    return { name, status: res.status, duration, success: res.ok, data };
  } catch (err) {
    const duration = Date.now() - start;
    return { name, status: 'ERROR', duration, success: false, error: err.message };
  }
}

async function run() {
  console.log('=====================================================');
  console.log('       RENT-EASE API & CONNECTION BENCHMARK         ');
  console.log('=====================================================\n');

  // 1. Single GET /api/vehicles
  console.log('1. Testing single GET /api/vehicles...');
  const v1 = await testApi('GET /api/vehicles (initial)', `${baseUrl}/api/vehicles`);
  console.log(`   Status: ${v1.status} | Duration: ${v1.duration}ms | Body: ${JSON.stringify(v1.data).substring(0, 120)}\n`);

  // 2. Sequential GET /api/vehicles (to verify connection reuse)
  console.log('2. Testing sequential GET /api/vehicles (3 requests)...');
  for (let i = 1; i <= 3; i++) {
    const r = await testApi(`GET /api/vehicles #${i}`, `${baseUrl}/api/vehicles`);
    console.log(`   #${i} -> Status: ${r.status} | Duration: ${r.duration}ms | Success: ${r.success}`);
  }
  console.log('');

  // 3. Concurrent GET /api/vehicles (5 requests)
  console.log('3. Testing concurrent GET /api/vehicles (5 parallel requests)...');
  const t0 = Date.now();
  const concurrentResults = await Promise.all([
    testApi('Concurrent 1', `${baseUrl}/api/vehicles`),
    testApi('Concurrent 2', `${baseUrl}/api/vehicles`),
    testApi('Concurrent 3', `${baseUrl}/api/vehicles`),
    testApi('Concurrent 4', `${baseUrl}/api/vehicles`),
    testApi('Concurrent 5', `${baseUrl}/api/vehicles`),
  ]);
  const totalConcurrent = Date.now() - t0;
  console.log(`   All 5 completed in total ${totalConcurrent}ms:`);
  concurrentResults.forEach((r, idx) => {
    console.log(`     Req ${idx + 1}: ${r.status} in ${r.duration}ms`);
  });
  console.log('');

  // 4. Test Admin APIs (Admin Login -> Customers & Bookings)
  console.log('4. Testing Admin Auth & Dashboard APIs...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vehiclerental.com', password: 'adminpassword123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log(`   Admin Login -> Status: ${loginRes.status}`);

  const adminHeaders = cookie ? { Cookie: cookie } : {};

  // Admin Customers
  const custRes = await testApi('GET /api/admin/customers', `${baseUrl}/api/admin/customers`, { headers: adminHeaders });
  console.log(`   GET /api/admin/customers -> Status: ${custRes.status} | Duration: ${custRes.duration}ms | Body: ${JSON.stringify(custRes.data).substring(0, 100)}`);

  // Admin Bookings
  const bookRes = await testApi('GET /api/bookings', `${baseUrl}/api/bookings`, { headers: adminHeaders });
  console.log(`   GET /api/bookings -> Status: ${bookRes.status} | Duration: ${bookRes.duration}ms | Body: ${JSON.stringify(bookRes.data).substring(0, 100)}`);

  // 5. Concurrent Admin Dashboard Batch (simulating app/admin/page.js)
  console.log('\n5. Testing Admin Dashboard Concurrent Batch (Vehicles + Customers + Bookings)...');
  const tAdmin0 = Date.now();
  const [bVeh, bCust, bBook] = await Promise.all([
    testApi('Batch: Vehicles', `${baseUrl}/api/vehicles`, { headers: adminHeaders }),
    testApi('Batch: Customers', `${baseUrl}/api/admin/customers`, { headers: adminHeaders }),
    testApi('Batch: Bookings', `${baseUrl}/api/bookings`, { headers: adminHeaders }),
  ]);
  const totalAdminBatch = Date.now() - tAdmin0;
  console.log(`   Admin dashboard batch completed in ${totalAdminBatch}ms:`);
  console.log(`     Vehicles:  ${bVeh.status} in ${bVeh.duration}ms`);
  console.log(`     Customers: ${bCust.status} in ${bCust.duration}ms`);
  console.log(`     Bookings:  ${bBook.status} in ${bBook.duration}ms`);

  console.log('\n=====================================================');
  console.log('                     BENCHMARK DONE                  ');
  console.log('=====================================================');
}

run();

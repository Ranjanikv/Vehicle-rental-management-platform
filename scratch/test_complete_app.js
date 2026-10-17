const baseUrl = 'http://localhost:3000';

async function testCompleteApp() {
  console.log('=====================================================');
  console.log('      RENT-EASE FULL END-TO-END APPLICATION TEST     ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Vehicle Fleet Listing & Date Availability
  console.log('--- 1. Vehicle Fleet & Date Availability ---');
  const vRes = await fetch(`${baseUrl}/api/vehicles`);
  const vData = await vRes.json();
  assert(vRes.status === 200 && vData.success, 'GET /api/vehicles returned 200 OK with success:true');
  assert(Array.isArray(vData.vehicles) && vData.vehicles.length >= 5, `Real vehicle fleet loaded: ${vData.vehicles.length} vehicles found`);

  const creta = vData.vehicles.find(v => v.name.toLowerCase().includes('creta') || v.plate_no.includes('KA-01'));
  const testVehicle = creta || vData.vehicles[0];
  console.log(`     Selected vehicle for availability test: ${testVehicle.name} (${testVehicle.plate_no})`);

  // Test date availability filter
  const filterRes = await fetch(`${baseUrl}/api/vehicles?startDate=2026-11-01&endDate=2026-11-05`);
  const filterData = await filterRes.json();
  assert(filterRes.status === 200 && filterData.hasDateRange, 'Date availability filter query returns 200 with hasDateRange:true');

  // 2. Customer Authentication & Signup
  console.log('\n--- 2. Customer Authentication ---');
  const customerEmail = `e2e_cust_${Date.now()}@example.com`;
  const customerPassword = 'CustomerSecure123!';

  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Test Customer',
      email: customerEmail,
      password: customerPassword,
      confirmPassword: customerPassword
    })
  });
  const signupData = await signupRes.json();
  assert(signupRes.status === 200 && signupData.success, 'Customer signup succeeds');

  // Customer Login
  const custLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: customerPassword })
  });
  const custCookie = custLoginRes.headers.get('set-cookie')?.match(/token=[^;]+/)?.[0] || '';
  assert(custLoginRes.status === 200 && Boolean(custCookie), 'Customer login returns 200 OK and JWT auth cookie');

  // 3. Customer Profile & KYC
  console.log('\n--- 3. Customer Profile & KYC Status ---');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: custCookie }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user?.email === customerEmail, 'GET /api/auth/me returns authenticated customer profile');
  assert(meData.user.kyc_status === 'UNVERIFIED', 'Initial KYC status is UNVERIFIED');

  // 4. Admin Login & Authorization
  console.log('\n--- 4. Admin Authentication & Role Enforcement ---');
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vehiclerental.com', password: 'adminpassword123' })
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie')?.match(/token=[^;]+/)?.[0] || '';
  assert(adminLoginRes.status === 200 && Boolean(adminCookie), 'Admin login returns 200 OK and admin JWT cookie');

  // Admin access to admin customers
  const adminCustRes = await fetch(`${baseUrl}/api/admin/customers`, {
    headers: { Cookie: adminCookie }
  });
  const adminCustData = await adminCustRes.json();
  assert(adminCustRes.status === 200 && adminCustData.success, 'Admin can view all customer KYC records');

  // Non-admin rejected from admin routes
  const custAccessDenied = await fetch(`${baseUrl}/api/admin/customers`, {
    headers: { Cookie: custCookie }
  });
  assert(custAccessDenied.status === 403, 'Regular customer is forbidden (403) from accessing admin routes');

  // 5. Booking Creation & Overlap Prevention (Double-Booking Prevention)
  console.log('\n--- 5. Booking Creation & Double-Booking Prevention ---');
  // First, verify the customer's KYC as admin so they can book
  const custId = meData.user.id;
  const kycApproveRes = await fetch(`${baseUrl}/api/admin/customers/${custId}/kyc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'VERIFIED' })
  });
  const kycApproveData = await kycApproveRes.json();
  assert(kycApproveRes.status === 200 && kycApproveData.success, 'Admin approved customer KYC');

  // Customer creates a booking for a dynamic future date window
  const futureOffset = Math.floor(Math.random() * 500) + 40;
  const bStart = new Date(Date.now() + futureOffset * 86400000).toISOString().split('T')[0];
  const bEnd = new Date(Date.now() + (futureOffset + 4) * 86400000).toISOString().split('T')[0];

  const bookRes1 = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      vehicle_id: testVehicle.id,
      start_date: bStart,
      end_date: bEnd
    })
  });
  const bookData1 = await bookRes1.json();
  assert(bookRes1.status === 200 && bookData1.success, `Booking created successfully: ID ${bookData1.booking?.id || bookData1.bookingId}`);
  const createdBookingId = bookData1.booking?.id || bookData1.bookingId;

  // Double-booking attempt: Try to book the SAME vehicle for overlapping dates
  const bookRes2 = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      vehicle_id: testVehicle.id,
      start_date: bStart,
      end_date: bEnd
    })
  });
  const bookData2 = await bookRes2.json();
  assert(bookRes2.status === 400 || bookRes2.status === 409 || !bookData2.success, `Double-booking prevention verified: Overlapping request rejected with status ${bookRes2.status}`);

  // 6. Agreement Signing & PDF Generation
  console.log('\n--- 6. Rental Agreement Signing & PDF Generation ---');
  const signRes = await fetch(`${baseUrl}/api/bookings/${createdBookingId}/agreement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({ agreement_signed: true })
  });
  const signData = await signRes.json();
  assert(signRes.status === 200 && signData.success, 'Rental agreement signed successfully');

  // PDF Generation & Download
  const pdfRes = await fetch(`${baseUrl}/api/bookings/${createdBookingId}/agreement/pdf`, {
    headers: { Cookie: custCookie }
  });
  const pdfContentType = pdfRes.headers.get('content-type');
  const pdfBytes = await pdfRes.arrayBuffer();
  assert(pdfRes.status === 200 && pdfContentType?.includes('application/pdf'), `PDF generated with Content-Type: ${pdfContentType}`);
  assert(pdfBytes.byteLength > 1000, `PDF payload is valid binary (${pdfBytes.byteLength} bytes)`);

  // 7. Admin Dashboard Analytics / Metrics
  console.log('\n--- 7. Admin Dashboard Analytics & Metrics ---');
  const [dashVeh, dashCust, dashBook] = await Promise.all([
    fetch(`${baseUrl}/api/vehicles`, { headers: { Cookie: adminCookie } }).then(r => r.json()),
    fetch(`${baseUrl}/api/admin/customers`, { headers: { Cookie: adminCookie } }).then(r => r.json()),
    fetch(`${baseUrl}/api/bookings`, { headers: { Cookie: adminCookie } }).then(r => r.json())
  ]);
  assert(dashVeh.success && dashCust.success && dashBook.success, 'Admin overview queries all 3 data sources successfully');
  console.log(`     Metrics: Fleet Count = ${dashVeh.vehicles.length}, Customers = ${dashCust.customers.length}, Bookings = ${dashBook.bookings.length}`);

  console.log('\n=====================================================');
  console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

testCompleteApp().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

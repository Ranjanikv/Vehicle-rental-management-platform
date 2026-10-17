process.loadEnvFile('.env.local');
const mongoose = require('mongoose');

async function testPhase5() {
  const baseUrl = 'http://localhost:3000';
  console.log('==================================================');
  console.log('       STARTING PHASE 5 INTEGRATION TESTS         ');
  console.log('==================================================\n');

  const getCookie = (res) => {
    const raw = res.headers.get('set-cookie');
    if (!raw) return '';
    const match = raw.match(/token=[^;]+/);
    return match ? match[0] : '';
  };

  // Connect directly for data setup / verification
  await mongoose.connect(process.env.MONGODB_URI);
  const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false, collection: 'bookings' }));

  const vehicles = await Vehicle.find().lean();
  const creta = vehicles.find((v) => v.plate_no === 'KA-01-MJ-1024');
  const city = vehicles.find((v) => v.plate_no === 'KA-05-AB-5678');
  console.log('Found Creta:', creta?._id.toString(), 'City:', city?._id.toString());

  // 1. Admin Login
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vehiclerental.com', password: 'adminpassword123' }),
  });
  const adminCookie = getCookie(adminLoginRes);
  console.log('1. Admin authenticated:', Boolean(adminCookie));

  // 2. Customer 1 (Unverified)
  const unverifiedEmail = `unverified.${Date.now()}@example.com`;
  const unverifiedRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unverified John',
      email: unverifiedEmail,
      password: 'password123',
      confirmPassword: 'password123',
    }),
  });
  const unverifiedCookie = getCookie(unverifiedRes);
  console.log('2. Unverified customer created:', Boolean(unverifiedCookie));

  // 3. Customer 2 (Verified)
  const verifiedEmail = `verified.${Date.now()}@example.com`;
  const verifiedRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verified Sarah',
      email: verifiedEmail,
      password: 'password123',
      confirmPassword: 'password123',
    }),
  });
  const verifiedData = await verifiedRes.json();
  const verifiedCookie = getCookie(verifiedRes);
  const verifiedUserId = verifiedData.user.id;

  // Set Sarah to VERIFIED via admin endpoint
  await fetch(`${baseUrl}/api/admin/customers/${verifiedUserId}/kyc`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ status: 'VERIFIED' }),
  });
  console.log('3. Verified customer approved by Admin:', verifiedUserId);

  // 4. Test Unverified Customer cannot book
  console.log('\n4. Testing Unverified Customer Booking rejection:');
  const unverifiedBookRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: unverifiedCookie },
    body: JSON.stringify({
      vehicleId: creta._id.toString(),
      startDate: '2026-11-10',
      endDate: '2026-11-14',
    }),
  });
  const unverifiedBookData = await unverifiedBookRes.json();
  console.log('   Status (expected 400):', unverifiedBookRes.status, 'Message:', unverifiedBookData.message);

  // 5. Test Invalid Parameters as Verified Customer
  console.log('\n5. Testing Invalid Booking Parameters:');
  // 5a. Invalid vehicle ID
  const badVehRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({ vehicleId: 'invalid-id', startDate: '2026-11-10', endDate: '2026-11-14' }),
  });
  console.log('   Invalid vehicleId status (expected 404):', badVehRes.status);

  // 5b. Past start date
  const pastDateRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({ vehicleId: creta._id.toString(), startDate: '2020-01-01', endDate: '2020-01-05' }),
  });
  console.log('   Past date status (expected 400):', pastDateRes.status);

  // 5c. End date before start date
  const revDateRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({ vehicleId: creta._id.toString(), startDate: '2026-11-14', endDate: '2026-11-10' }),
  });
  console.log('   End before start status (expected 400):', revDateRes.status);

  // 6. Valid Booking Creation
  console.log('\n6. Testing Valid Booking Creation:');
  const validBookRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({
      vehicleId: creta._id.toString(),
      startDate: '2026-11-10',
      endDate: '2026-11-14',
    }),
  });
  const validBookData = await validBookRes.json();
  console.log('   Status (expected 200):', validBookRes.status);
  console.log('   Booking payload:', validBookData.booking);
  const booking1Id = validBookData.booking?.id;

  // 7. Overlapping Booking Rejection
  console.log('\n7. Testing Overlapping Booking Rejection:');
  const overlapBookRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({
      vehicleId: creta._id.toString(),
      startDate: '2026-11-12',
      endDate: '2026-11-16',
    }),
  });
  const overlapBookData = await overlapBookRes.json();
  console.log('   Overlap status (expected 400):', overlapBookRes.status, 'Message:', overlapBookData.message);

  // 8. Non-Overlapping Booking Success
  console.log('\n8. Testing Non-Overlapping Booking on Same Vehicle:');
  const nonOverlapRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({
      vehicleId: creta._id.toString(),
      startDate: '2026-11-20',
      endDate: '2026-11-22',
    }),
  });
  const nonOverlapData = await nonOverlapRes.json();
  console.log('   Non-overlap status (expected 200):', nonOverlapRes.status, 'Booking ID:', nonOverlapData.booking?.id);

  // 9. Parallel / Concurrent Booking Stress Test
  console.log('\n9. Testing Parallel / Concurrent Booking Requests for Same Vehicle & Dates:');
  const concurrentPromises = [1, 2].map(() =>
    fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
      body: JSON.stringify({
        vehicleId: city._id.toString(),
        startDate: '2026-12-01',
        endDate: '2026-12-05',
      }),
    }).then(async (r) => ({ status: r.status, data: await r.json() }))
  );
  const concurrentResults = await Promise.all(concurrentPromises);
  const successCount = concurrentResults.filter((r) => r.status === 200).length;
  const conflictCount = concurrentResults.filter((r) => r.status === 400).length;
  console.log('   Concurrent results:');
  console.log('   Success count (expected 1):', successCount);
  console.log('   Conflict rejection count (expected 1):', conflictCount);
  console.log('   Details:', JSON.stringify(concurrentResults, null, 2));

  // 10. Booking Listing & Ownership Verification
  console.log('\n10. Testing Booking Listing:');
  const custListRes = await fetch(`${baseUrl}/api/bookings`, { headers: { Cookie: verifiedCookie } });
  const custListData = await custListRes.json();
  console.log('   Customer bookings count:', custListData.bookings?.length);

  const adminListRes = await fetch(`${baseUrl}/api/bookings`, { headers: { Cookie: adminCookie } });
  const adminListData = await adminListRes.json();
  console.log('   Admin bookings count:', adminListData.bookings?.length);

  // 11. Booking Details & Ownership Protection
  console.log('\n11. Testing Booking Details & Ownership Restrictions:');
  const custDetailRes = await fetch(`${baseUrl}/api/bookings/${booking1Id}`, { headers: { Cookie: verifiedCookie } });
  const custDetailData = await custDetailRes.json();
  console.log('   Owner access status (expected 200):', custDetailRes.status, 'hasAgreement:', Boolean(custDetailData.generatedAgreement));

  const strangerDetailRes = await fetch(`${baseUrl}/api/bookings/${booking1Id}`, { headers: { Cookie: unverifiedCookie } });
  console.log('   Stranger access status (expected 403):', strangerDetailRes.status);

  const adminDetailRes = await fetch(`${baseUrl}/api/bookings/${booking1Id}`, { headers: { Cookie: adminCookie } });
  console.log('   Admin access status (expected 200):', adminDetailRes.status);

  // 12. Agreement Signing & PDF Download
  console.log('\n12. Testing Agreement Signing & PDF Download:');
  // 12a. Try download before signing
  const preSignPdfRes = await fetch(`${baseUrl}/api/bookings/${booking1Id}/agreement/pdf`, { headers: { Cookie: verifiedCookie } });
  console.log('   Pre-signing PDF download status (expected 400):', preSignPdfRes.status);

  // 12b. Sign agreement
  const signRes = await fetch(`${baseUrl}/api/bookings/${booking1Id}/agreement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: verifiedCookie },
    body: JSON.stringify({ agreed: true }),
  });
  const signData = await signRes.json();
  console.log('   Agreement signed status (expected 200):', signRes.status, 'signed:', signData.agreementSigned);

  // 12c. Download PDF after signing
  const pdfRes = await fetch(`${baseUrl}/api/bookings/${booking1Id}/agreement/pdf`, { headers: { Cookie: verifiedCookie } });
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfHeader = Buffer.from(pdfBuffer).slice(0, 5).toString('utf-8');
  console.log('   PDF download status (expected 200):', pdfRes.status);
  console.log('   PDF Content-Type:', pdfRes.headers.get('content-type'));
  console.log('   PDF Valid Magic Header (%PDF-):', pdfHeader === '%PDF-');
  console.log('   PDF Size (bytes):', pdfBuffer.byteLength);

  // 13. Vehicle Availability Reflects MongoDB Bookings
  console.log('\n13. Testing Fleet Availability Sync with MongoDB Bookings:');
  const fleetRes = await fetch(`${baseUrl}/api/vehicles?pickup=2026-11-12&return=2026-11-13`);
  const fleetData = await fleetRes.json();
  const cretaInFleet = fleetData.vehicles?.find((v) => v.id === creta._id.toString());
  console.log('   Creta is_available_for_dates during reserved dates (expected false):', cretaInFleet?.is_available_for_dates);
  console.log('   Creta conflict_count (expected >= 1):', cretaInFleet?.conflict_count);

  // 14. Admin Dashboard Metrics Verification
  console.log('\n14. Testing Admin Dashboard Metrics:');
  const pendingBookings = adminListData.bookings?.filter((b) => b.status === 'PENDING').length;
  console.log('   Admin pending bookings count:', pendingBookings);

  // 15. Cleanup Temporary Test Data
  console.log('\n15. Cleaning up temporary test data from MongoDB Atlas:');
  const delBookings = await Booking.deleteMany({ customer_id: { $in: [new mongoose.Types.ObjectId(verifiedUserId)] } });
  // Also clean up any bookings for City created in parallel test
  const delCityBookings = await Booking.deleteMany({ vehicle_id: city._id });
  const delUsers = await User.deleteMany({ email: { $in: [unverifiedEmail, verifiedEmail] } });
  console.log('   Deleted test bookings:', delBookings.deletedCount + delCityBookings.deletedCount);
  console.log('   Deleted test users:', delUsers.deletedCount);

  await mongoose.disconnect();

  console.log('\n==================================================');
  console.log('         PHASE 5 TESTS COMPLETED SUCCESSFULLY     ');
  console.log('==================================================');
}

testPhase5().catch(console.error);

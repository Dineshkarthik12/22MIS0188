/**
 * Comprehensive API Test Suite
 * Tests all external evaluation APIs and localhost backend APIs
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');

const BASE_URL = process.env.EVALUATION_BASE_URL || 'http://4.224.186.213/evaluation-service';
const LOCAL_URL = `http://localhost:${process.env.PORT || 3000}`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

let accessToken = null;
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

const log = (icon, msg) => console.log(`${icon} ${msg}`);
const sep = () => console.log('─'.repeat(60));

const record = (name, status, detail = '') => {
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else skipped++;
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  results.push({ name, status, detail });
  log(icon, `[${status}] ${name}${detail ? ' — ' + detail : ''}`);
};

const request = async (method, url, data = null, headers = {}) => {
  try {
    const resp = await axios({ method, url, data, headers, timeout: 20000 });
    return { ok: true, status: resp.status, data: resp.data };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status || 0,
      data: err.response?.data || null,
      message: err.message,
    };
  }
};

// ===================== AUTHENTICATION =====================
async function testAuth() {
  sep();
  console.log('🔐 AUTHENTICATION API');
  sep();

  // Valid auth
  const r = await request('post', `${BASE_URL}/auth`, {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });

  if (r.ok) {
    const token = r.data?.access_token || r.data?.accessToken || r.data?.token;
    const tokenType = r.data?.token_type || r.data?.tokenType || 'Bearer';
    if (token) {
      accessToken = token;
      record('POST /auth — token generation', 'PASS', `token_type=${tokenType}`);
    } else {
      record('POST /auth — token generation', 'FAIL', 'No access_token in response');
    }
    if (tokenType?.toLowerCase() === 'bearer') {
      record('POST /auth — token_type is Bearer', 'PASS');
    } else {
      record('POST /auth — token_type is Bearer', 'FAIL', `Got: ${tokenType}`);
    }
  } else {
    record('POST /auth — token generation', 'FAIL', r.message);
  }

  // Invalid credentials
  const bad = await request('post', `${BASE_URL}/auth`, {
    email: 'invalid@test.com',
    name: 'Nobody',
    rollNo: 'INVALID',
    accessCode: 'WRONG',
    clientID: 'bad-id',
    clientSecret: 'bad-secret',
  });
  if (!bad.ok || bad.status >= 400) {
    record('POST /auth — invalid credentials rejected', 'PASS', `status=${bad.status}`);
  } else {
    record('POST /auth — invalid credentials rejected', 'FAIL', 'Expected rejection');
  }
}

// ===================== PROTECTED EXTERNAL APIs =====================
async function testExternalApis() {
  sep();
  console.log('🌐 PROTECTED EXTERNAL APIs');
  sep();

  if (!accessToken) {
    record('External APIs', 'SKIP', 'No access token');
    return;
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // 1. Depots
  const depots = await request('get', `${BASE_URL}/depots`, null, authHeaders);
  if (depots.ok) {
    const arr = depots.data?.depots || depots.data;
    record('GET /depots — fetch success', 'PASS', `status=${depots.status}`);
    if (Array.isArray(arr) && arr.length > 0) {
      const sample = arr[0];
      const hasMechHours = sample.MechanicHours !== undefined || sample.mechanicHours !== undefined;
      record('GET /depots — mechanicHours available', hasMechHours ? 'PASS' : 'FAIL',
        hasMechHours ? `${arr.length} depots` : 'Missing MechanicHours field');
    } else {
      record('GET /depots — data is array', 'FAIL', 'Empty or not array');
    }
    record('GET /depots — auth header works', 'PASS');
  } else {
    record('GET /depots — fetch', 'FAIL', depots.message);
  }

  // 2. Vehicles
  const vehicles = await request('get', `${BASE_URL}/vehicles`, null, authHeaders);
  if (vehicles.ok) {
    const arr = vehicles.data?.vehicles || vehicles.data;
    record('GET /vehicles — fetch success', 'PASS', `status=${vehicles.status}`);
    if (Array.isArray(arr) && arr.length > 0) {
      const sample = arr[0];
      const hasDuration = sample.Duration !== undefined;
      const hasImpact = sample.Impact !== undefined;
      record('GET /vehicles — Duration field exists', hasDuration ? 'PASS' : 'FAIL');
      record('GET /vehicles — Impact field exists', hasImpact ? 'PASS' : 'FAIL');
    } else {
      record('GET /vehicles — data is array', 'FAIL', 'Empty or not array');
    }
  } else {
    record('GET /vehicles — fetch', 'FAIL', vehicles.message);
  }

  // 3. Notifications
  const notifs = await request('get', `${BASE_URL}/notifications`, null, authHeaders);
  if (notifs.ok) {
    const arr = notifs.data?.notifications || notifs.data;
    record('GET /notifications — fetch success', 'PASS', `status=${notifs.status}`);
    if (Array.isArray(arr) && arr.length > 0) {
      const types = new Set(arr.map(n => n.Type || n.type));
      const hasPlacement = types.has('Placement');
      const hasResult = types.has('Result');
      const hasEvent = types.has('Event');
      record('GET /notifications — Placement type', hasPlacement ? 'PASS' : 'FAIL');
      record('GET /notifications — Result type', hasResult ? 'PASS' : 'FAIL');
      record('GET /notifications — Event type', hasEvent ? 'PASS' : 'FAIL');
    }
  } else {
    record('GET /notifications — fetch', 'FAIL', notifs.message);
  }
}

// ===================== LOGGING API =====================
async function testLoggingApi() {
  sep();
  console.log('📝 LOGGING API');
  sep();

  if (!accessToken) {
    record('Logging API', 'SKIP', 'No access token');
    return;
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // Valid payload
  const valid = await request('post', `${BASE_URL}/logs`, {
    stack: 'backend',
    level: 'info',
    package: 'route',
    message: 'Health endpoint accessed successfully',
  }, authHeaders);

  if (valid.ok) {
    record('POST /logs — valid payload accepted', 'PASS', `status=${valid.status}`);
    record('POST /logs — Bearer token works', 'PASS');
  } else {
    record('POST /logs — valid payload', 'FAIL', `status=${valid.status} ${valid.message}`);
  }

  // Invalid payload (missing message)
  const invalid = await request('post', `${BASE_URL}/logs`, {
    stack: 'backend',
    level: 'info',
    package: 'route',
  }, authHeaders);

  if (!invalid.ok || invalid.status >= 400) {
    record('POST /logs — invalid payload rejected', 'PASS', `status=${invalid.status}`);
  } else {
    record('POST /logs — invalid payload rejected', 'FAIL', 'Expected rejection');
  }
}

// ===================== LOCALHOST APIs =====================
async function testLocalhostApis() {
  sep();
  console.log('🏠 LOCALHOST BACKEND APIs');
  sep();

  // 1. Health
  const health = await request('get', `${LOCAL_URL}/api/health`);
  if (health.ok && health.data?.success === true) {
    record('GET /api/health — server health', 'PASS');
    const hasStatus = health.data?.data?.status === 'healthy';
    record('GET /api/health — proper response structure', hasStatus ? 'PASS' : 'FAIL',
      JSON.stringify(health.data?.data));
  } else {
    record('GET /api/health', 'FAIL', health.message || 'Server not running');
    log('⚠️', 'Server may not be running on port 3000. Skipping localhost tests.');
    return;
  }

  // 2. Schedule (all depots)
  console.log('\n⏳ Testing /api/schedule (knapsack optimization — may take a moment)...');
  const schedule = await request('get', `${LOCAL_URL}/api/schedule`);
  if (schedule.ok && schedule.data?.success) {
    const data = schedule.data.data;
    record('GET /api/schedule — success response', 'PASS');

    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      const hasDepotId = sample.depotId !== undefined;
      const hasSelectedTasks = Array.isArray(sample.selectedTasks);
      const hasTotalDuration = sample.totalDuration !== undefined;
      const hasTotalImpact = sample.totalImpact !== undefined;
      const hasMechanicHours = sample.mechanicHours !== undefined;

      record('GET /api/schedule — depotId present', hasDepotId ? 'PASS' : 'FAIL');
      record('GET /api/schedule — selectedTasks present', hasSelectedTasks ? 'PASS' : 'FAIL');
      record('GET /api/schedule — totalDuration present', hasTotalDuration ? 'PASS' : 'FAIL');
      record('GET /api/schedule — totalImpact present', hasTotalImpact ? 'PASS' : 'FAIL');

      // Verify constraint: totalDuration <= mechanicHours
      let allValid = true;
      for (const s of data) {
        if (s.totalDuration > s.mechanicHours) {
          allValid = false;
          record('GET /api/schedule — duration constraint', 'FAIL',
            `Depot ${s.depotId}: ${s.totalDuration} > ${s.mechanicHours}`);
          break;
        }
      }
      if (allValid) {
        record('GET /api/schedule — totalDuration <= mechanicHours', 'PASS',
          `${data.length} depots verified`);
      }

      record('GET /api/schedule — optimization executed', 'PASS',
        `${data.length} depot schedules generated`);

      // Test single depot
      const testDepotId = sample.depotId;
      console.log(`\n⏳ Testing /api/schedule/${testDepotId}...`);
      const single = await request('get', `${LOCAL_URL}/api/schedule/${testDepotId}`);
      if (single.ok && single.data?.success) {
        record(`GET /api/schedule/${testDepotId} — single depot`, 'PASS');
        const sd = single.data.data;
        if (sd.depotId === testDepotId) {
          record(`GET /api/schedule/${testDepotId} — correct depot returned`, 'PASS');
        }
      } else {
        record(`GET /api/schedule/${testDepotId}`, 'FAIL', single.message);
      }
    } else {
      record('GET /api/schedule — data array', 'FAIL', 'Empty or not array');
    }
  } else {
    record('GET /api/schedule', 'FAIL', schedule.data?.message || schedule.message);
  }

  // 3. Invalid depot ID
  const invalidDepot = await request('get', `${LOCAL_URL}/api/schedule/abc`);
  if (!invalidDepot.ok || invalidDepot.data?.success === false) {
    record('GET /api/schedule/abc — invalid depot rejected', 'PASS',
      `status=${invalidDepot.status}`);
  } else {
    record('GET /api/schedule/abc — invalid depot rejected', 'FAIL');
  }

  const notFoundDepot = await request('get', `${LOCAL_URL}/api/schedule/999999`);
  if (!notFoundDepot.ok || notFoundDepot.data?.success === false) {
    record('GET /api/schedule/999999 — depot not found', 'PASS',
      `status=${notFoundDepot.status}`);
  } else {
    record('GET /api/schedule/999999 — depot not found', 'FAIL');
  }

  // 4. Priority Inbox
  console.log('\n⏳ Testing /api/notifications/priority-inbox...');
  const inbox = await request('get', `${LOCAL_URL}/api/notifications/priority-inbox`);
  if (inbox.ok && inbox.data?.success) {
    const data = inbox.data.data;
    record('GET /api/notifications/priority-inbox — success', 'PASS');

    if (Array.isArray(data)) {
      record('GET /priority-inbox — returns array', 'PASS', `${data.length} items`);

      if (data.length <= 10) {
        record('GET /priority-inbox — top 10 limit', 'PASS');
      } else {
        record('GET /priority-inbox — top 10 limit', 'FAIL', `Got ${data.length}`);
      }

      // Verify sort order: Placement > Result > Event, newest first
      const priorityMap = { Placement: 3, Result: 2, Event: 1 };
      let sortValid = true;
      for (let i = 1; i < data.length; i++) {
        const prevPri = priorityMap[data[i - 1].Type] || 0;
        const currPri = priorityMap[data[i].Type] || 0;
        if (prevPri < currPri) {
          sortValid = false;
          break;
        }
        if (prevPri === currPri) {
          const prevTs = new Date(data[i - 1].Timestamp).getTime();
          const currTs = new Date(data[i].Timestamp).getTime();
          if (prevTs < currTs) {
            sortValid = false;
            break;
          }
        }
      }
      record('GET /priority-inbox — sort order correct', sortValid ? 'PASS' : 'FAIL',
        sortValid ? 'Placement > Result > Event, newest first' : 'Sort order violation');
    }
  } else {
    record('GET /api/notifications/priority-inbox', 'FAIL',
      inbox.data?.message || inbox.message);
  }

  // 5. Not Found route
  const notFound = await request('get', `${LOCAL_URL}/api/nonexistent`);
  if (notFound.status === 404) {
    record('GET /api/nonexistent — 404 handling', 'PASS');
  } else {
    record('GET /api/nonexistent — 404 handling', 'FAIL', `status=${notFound.status}`);
  }
}

// ===================== EDGE CASES =====================
async function testEdgeCases() {
  sep();
  console.log('🧪 EDGE CASE TESTING');
  sep();

  // Invalid Bearer token on external API
  const badToken = await request('get', `${BASE_URL}/depots`, null, {
    Authorization: 'Bearer invalid_token_12345',
  });
  if (!badToken.ok || badToken.status === 401) {
    record('Invalid Bearer token — rejected', 'PASS', `status=${badToken.status}`);
  } else {
    record('Invalid Bearer token — rejected', 'FAIL', `status=${badToken.status}`);
  }

  // No auth header
  const noAuth = await request('get', `${BASE_URL}/depots`);
  if (!noAuth.ok || noAuth.status >= 400) {
    record('No auth header — rejected', 'PASS', `status=${noAuth.status}`);
  } else {
    record('No auth header — rejected', 'FAIL');
  }

  // Malformed log payload
  if (accessToken) {
    const malformed = await request('post', `${BASE_URL}/logs`, {
      stack: 123,
      level: null,
    }, { Authorization: `Bearer ${accessToken}` });
    if (!malformed.ok || malformed.status >= 400) {
      record('Malformed log payload — rejected', 'PASS', `status=${malformed.status}`);
    } else {
      record('Malformed log payload — rejected', 'FAIL');
    }
  }
}

// ===================== MAIN =====================
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  COMPREHENSIVE API TEST SUITE');
  console.log('  ' + new Date().toISOString());
  console.log('═'.repeat(60) + '\n');

  console.log(`Base URL:  ${BASE_URL}`);
  console.log(`Local URL: ${LOCAL_URL}`);
  console.log(`Client ID: ${CLIENT_ID ? CLIENT_ID.substring(0, 8) + '...' : 'MISSING'}\n`);

  await testAuth();
  await testExternalApis();
  await testLoggingApi();
  await testLocalhostApis();
  await testEdgeCases();

  // Summary
  sep();
  console.log('\n📊 FINAL SUMMARY');
  sep();
  console.log(`  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📋 Total:   ${passed + failed + skipped}`);
  sep();

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED:\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   ❌ ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(2);
});

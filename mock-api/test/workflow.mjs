// Each run owns its data folder so it can't change the checkpoint register.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as wait } from 'node:timers/promises';
const directory = mkdtempSync(join(tmpdir(), 'tqms-check-'));
const port = String(43000 + Math.floor(Math.random() * 10000));
const url = 'http://127.0.0.1:' + port;
let child;
let checks = 0,
  cookie = '';
async function start() {
  child = spawn(process.execPath, ['dist/server.js'], {
    env: {
      ...process.env,
      PORT: port,
      TQMS_DATA_DIR: directory
    },
    stdio: 'pipe'
  });
  for (let i = 0;i < 60;i++) {
    try {
      if ((await fetch(url + '/api/health')).ok) {
        const r = await fetch(url + '/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'thankot',
            password: 'Thankot@2083'
          })
        });
        assert.equal(r.status, 200);
        cookie = r.headers.get('set-cookie').split(';')[0];
        return;
      }
    } catch { }
    await wait(50);
  }
  throw Error('Test server did not start');
}
async function stop() {
  if (child && child.exitCode === null) {
    const done = once(child, 'exit');
    child.kill();
    await done;
  }
}
async function call(path, method = 'GET', body, status = 200) {
  const r = await fetch(url + '/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  assert.equal(r.status, status, method + ' ' + path);
  checks++;
  return r.status === 204 ? null : (await r.json()).data;
}
try {
  await start();
  const health = await call('/health');
  assert.equal(health.status, 'ok');
  const name = 'Manisha Acharya';
  await call('/owners', 'POST', {
    name
  }, 422);
  const owner = await call('/owners', 'POST', {
    name,
    state: 'Bagmati',
    district: 'Lalitpur',
    phone: '9800000301',
    individual: 'Individual',
    verification: 'Unverified'
  }, 201);
  const owners = await call('/owners?q=Manisha');
  assert.equal(owners[0].id, owner.id);
  await call('/owners/' + owner.id, 'PUT', {
    ...owner,
    name: 'Manisha Shrestha'
  });
  const vehicleInput = {
    plate: 'BA 22 KHA 6610',
    owner: owner.id,
    association: 'Bagmati Yatayat Sangh',
    kind: 'Mini truck',
    color: 'Black',
    plateType: 'Zonal'
  };
  await call('/vehicles', 'POST', {
    ...vehicleInput,
    owner: 'absent'
  }, 422);
  const vehicle = await call('/vehicles', 'POST', vehicleInput, 201);
  await call('/vehicles', 'POST', vehicleInput, 422);
  const pending = await call('/pending', 'POST', {
    plate: vehicle.plate,
    from: 'Patan',
    to: 'Muglin',
    material: 'Rice'
  }, 201);
  const entry = {
    vehicle: vehicle.id,
    from: 'Patan',
    to: 'Muglin',
    material: 'Rice',
    checkpoint: 'Thankot',
    staff: 's1',
    fee: 50,
    weight: 8300,
    pendingId: pending.id,
    payment: 'Pending'
  };
  await call('/journeys', 'POST', {
    ...entry,
    weight: -3
  }, 422);
  const trip = await call('/journeys', 'POST', entry, 201);
  await call('/journeys', 'POST', entry, 409);
  const first = trip.visits[0];
  await call('/journeys/' + trip.id + '/pay/' + first.id, 'POST', {});
  await call('/journeys/' + trip.id + '/receipt/' + first.id, 'PATCH', {
    weight: 8350,
    fee: 60
  });
  const visit = {
    checkpoint: 'Naubise',
    staff: 's1',
    weight: 8300,
    fee: 50
  };
  await call('/journeys/' + trip.id + '/check-in', 'POST', visit);
  await call('/journeys/' + trip.id + '/check-in', 'POST', visit, 409);
  await call('/journeys/' + trip.id + '/end', 'POST', {});
  await call('/journeys/' + trip.id + '/check-in', 'POST', {
    ...visit,
    checkpoint: 'Muglin'
  }, 409);
  await call('/staff', 'POST', {
    name: 'Prakash Rai'
  }, 422);
  const other = await call('/others', 'POST', {
    plate: 'BR 06 GA 3102',
    numberType: 'Others',
    plateType: 'Indian'
  }, 201);
  await call('/others/' + other.id);
  const n = await call('/narrations', 'POST', {
    name: 'रकम बुझियो।'
  }, 201);
  await call('/narrations/' + n.id, 'PUT', {
    name: 'शुल्क बुझियो।'
  });
  const staff = await call('/staff', 'POST', {
    name: 'Prakash Rai',
    state: 'Koshi',
    district: 'Sunsari',
    phone: '9800000302',
    email: 'prakash@example.com',
    active: 'Active'
  }, 201);
  await call('/staff/' + staff.id, 'PUT', {
    ...staff,
    active: 'Inactive'
  });
  await call('/staff/' + staff.id, 'DELETE', undefined, 204);
  const requestToDelete = await call('/pending', 'POST', {
    plate: 'BA 9 KHA 3117',
    from: 'Patan',
    to: 'Butwal',
    material: 'Maize'
  }, 201);
  await call('/pending/' + requestToDelete.id, 'DELETE', undefined, 204);
  const bank = await call('/sections', 'POST', {
    parent: owner.id,
    section: 'Bank Details',
    bank: 'Nabil Bank',
    account: '12345',
    holder: name
  });
  await call('/sections', 'POST', {
    id: bank.id,
    parent: owner.id,
    section: 'Bank Details',
    bank: 'Nabil Bank',
    account: '12345',
    holder: 'Manisha Shrestha'
  });
  await call('/sections', 'POST', {
    parent: vehicle.id,
    section: 'Tare Weight',
    weight: '3200'
  });
  await call('/sections', 'POST', {
    parent: vehicle.id,
    section: 'Tare Weight',
    weight: '-1'
  }, 422);
  await call('/sections/' + bank.id, 'DELETE', undefined, 204);
  await stop();
  await start();
  const db = await call('/state'),
    stored = db.journeys.find(j => j.id === trip.id);
  assert.equal(stored.status, 'Completed');
  assert.equal(stored.visits.length, 2);
  assert.equal(stored.visits[0].weight, 8350);
  assert.equal(stored.visits[0].payment, 'Paid');
  assert.equal(stored.visits.reduce((s, v) => s + v.fee, 0), 110);
  assert(!db.pending.some(p => p.id === pending.id));
  assert(db.owners.some(o => o.name === 'Manisha Shrestha'));
  assert.equal((await fetch(url + '/api/state')).status, 401);
  await call('/password', 'POST', {
    current: 'wrong',
    password: 'NayaPass123',
    confirm: 'NayaPass123'
  }, 422);
  await call('/password', 'POST', {
    current: 'Thankot@2083',
    password: 'NayaPass123',
    confirm: 'NayaPass123'
  });
  assert.equal((await fetch(url + '/api/state', {
    headers: {
      Cookie: cookie
    }
  })).status, 401);
  const cross = await fetch(url + '/api/owners', {
    method: 'POST',
    headers: {
      Origin: 'https://another.example',
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  assert.equal(cross.status, 403);
  const bad = await fetch(url + '/api/owners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{'
  });
  assert.equal(bad.status, 400);
  for (const path of ['/admin/dashboard', '/admin/vehicle/owner', '/admin/reports/details', '/thankot-qr.png']) assert.equal((await fetch(url + path)).status, 200);
  console.log('Passed ' + checks + ' API calls, persistence after restart, cross-origin rejection, invalid JSON, and direct-page serving.');
} finally {
  await stop();
  rmSync(directory, {
    recursive: true,
    force: true
  });
}

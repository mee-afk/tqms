import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Database, Journey } from '../model.js';
const directory = resolve(process.env.TQMS_DATA_DIR || 'data');
const file = join(directory, 'checkpoint.json');
export const today = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Kathmandu'
}).format(new Date());
function initial(): Database {
  const names = [
    'Ramesh Maharjan',
    'Sunita Shrestha',
    'Bishnu Tamang',
    'Nisha Gurung',
    'Hari Khadka',
    'Anita Lama'
  ];
  const towns = ['Lalitpur', 'Kavrepalanchok', 'Dhading', 'Kaski', 'Chitwan', 'Makwanpur'];
  const owners = names.map((name, i) => ({
    id: 'o' + i,
    name,
    state: i === 3 ? 'Gandaki' : 'Bagmati',
    district: towns[i],
    phone: '98000001' + String(i).padStart(2, '0'),
    verification: i % 3 ? 'Verified' : 'Unverified',
    individual: 'Individual'
  }));
  const vehicles = owners.map((o, i) => ({
    id: 'v' + i,
    plate: 'BA ' + (5 + i) + ' KHA ' + (2416 + i * 47),
    owner: o.id,
    kind: ['Medium truck', 'Mini truck', 'Trailer'][i % 3],
    association: 'Bagmati Yatayat Sangh',
    color: 'Black',
    plateType: 'Zonal'
  }));
  const journeys: Journey[] = vehicles.slice(0, 5).map((v, i) => ({
    id: 'j' + i,
    number: 1041 + i,
    vehicle: v.id,
    from: ['Kathmandu', 'Pokhara', 'Hetauda'][i % 3],
    to: ['Bharatpur', 'Butwal', 'Birgunj'][i % 3],
    material: ['Rice', 'Steel rods', 'Cement', 'Lentils', 'Maize'][i],
    company: '',
    phone: '',
    note: '',
    status: i < 3 ? 'In Job' : 'Completed',
    visits: [{
      id: 'c' + i,
      receiptNo: 461 + i,
      stage: 1,
      at: today() + 'T' + (10 + i) + ':15:00+05:45',
      weight: 8400 + i * 1250,
      fee: 50,
      payment: i === 2 ? 'Pending' : 'Paid',
      checkpoint: 'Thankot',
      staff: 'Sujata Karki',
      bill: 'TK-' + (1041 + i) + '-1'
    }]
  }));
  return {
    owners,
    vehicles,
    journeys,
    others: [{
      id: 'other-1',
      plate: 'BR 06 GA 7231',
      numberType: 'Others',
      plateType: 'Indian'
    }],
    pending: [{
      id: 'p1',
      entryDate: today(),
      plate: 'BA 10 KHA 2651',
      from: 'Banepa',
      to: 'Butwal',
      material: 'Timber'
    }],
    staff: [{
      id: 's1',
      name: 'Sujata Karki',
      state: 'Bagmati',
      district: 'Kathmandu',
      phone: '9800000201',
      email: 'sujata@example.com',
      active: 'Active'
    }],
    narrations: [{
      id: 'n1',
      name: 'सवारी साधनको तौल जाँच गरियो।'
    }]
  };
}
function persist(data: Database) {
  mkdirSync(directory, {
    recursive: true
  });
  writeFileSync(file + '.tmp', JSON.stringify(data, null, 2));
  renameSync(file + '.tmp', file);
}
export function read(): Database {
  if (!existsSync(file)) persist(initial());
  return JSON.parse(readFileSync(file, 'utf8'));
}
// Finish each local transaction before letting another request modify the file.
export function change<T>(operation: (db: Database) => T): T {
  const data = read();
  const result = operation(data);
  persist(data);
  return result;
}

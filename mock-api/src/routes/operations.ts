import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { groups, fields, profileFields } from '../model.js';
import type { Entry, Database, Journey } from '../model.js';
import { change, read } from '../database/store.js';
export class Problem extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}
export const api = Router();
const str = z.string().trim().max(200);
const positive = z.coerce.number().finite().positive().max(200000);
const visit = z.object({
  checkpoint: z.enum(['Thankot', 'Naubise', 'Muglin']),
  staff: str.min(1),
  weight: positive,
  fee: z.coerce.number().finite().min(0).max(10000),
  payment: z.enum(['Paid', 'Pending']).default('Paid')
});
const journey = visit.extend({
  vehicle: str.min(1),
  from: str.min(1),
  to: str.min(1),
  material: str.min(1),
  company: str.default(''),
  phone: str.default(''),
  note: str.default(''),
  stage: z.coerce.number().int().min(1).max(3).default(1),
  entryDateBs: z.string().regex(/^$|^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[0-2])$/).optional(),
  entryDate: z.iso.date().optional(),
  pendingId: str.optional()
});
function staffName(db: Database, id: string) {
  const member = db.staff.find(s => s.id === id && s.active === 'Active');
  if (!member) throw new Problem(422, 'Choose an active staff member.', {
    staff: 'Select active staff.'
  });
  return member.name;
}
function brief(row: Entry) {
  const copy = {
    ...row
  };
  for (const key of ['logo', 'document', 'front', 'back']) if (copy[key]) copy[key] = 'Attached';
  return copy;
}
api.get('/state', (_req, res) => {
  const db = read();
  const issuer = {
    association: process.env.TQMS_ASSOCIATION || 'बागमती यातायात संघ',
    pan: process.env.TQMS_PAN || '',
    phone: process.env.TQMS_PHONE || ''
  };
  res.json({
    data: {
      ...db,
      issuer,
      sections: (db.sections || []).map(s => ({
        ...s,
        file: s.file ? 'Attached' : ''
      })),
      owners: db.owners.map(brief)
    }
  });
});
api.get('/owners/:id/files/:key', (req, res) => {
  const key = String(req.params.key);
  if (!['document', 'logo', 'front', 'back'].includes(key)) throw new Problem(404, 'File unavailable.');
  const value = read().owners.find(o => o.id === req.params.id)?.[key];
  if (!value) throw new Problem(404, 'File unavailable.');
  const [header, body] = value.split(',');
  const type = header.slice(5, -7);
  const extension = type === 'application/pdf' ? 'pdf' : type === 'image/png' ? 'png' : 'jpg';
  res.set('Content-Disposition', 'attachment; filename="' + key + '.' + extension + '"').type(type).send(Buffer.from(body, 'base64'));
});
api.post('/journeys/:id/pay/:visit', (req, res) => {
  res.json({
    data: change(db => {
      const trip = db.journeys.find(j => j.id === req.params.id);
      const receipt = trip?.visits.find(v => v.id === req.params.visit);
      if (!receipt) throw new Problem(404, 'Receipt not found.');
      receipt.payment = 'Paid';
      return receipt;
    })
  });
});
api.post('/journeys', (req, res) => {
  const input = journey.parse(req.body);
  const created = change(db => {
    const vehicle = db.vehicles.find(v => v.id === input.vehicle);
    if (!vehicle) throw new Problem(422, 'Select a registered vehicle.', {
      vehicle: 'Unknown vehicle.'
    });
    if (db.journeys.some(j => j.vehicle === vehicle.id && j.status === 'In Job')) throw new Problem(409, 'This vehicle already has an active journey.');
    if (input.pendingId && !db.pending.some(p => p.id === input.pendingId)) throw new Problem(409, 'This request has already been processed.');
    const number = Math.max(1040, ...db.journeys.map(j => j.number)) + 1;
    const record: Journey = {
      id: randomUUID(),
      number,
      entryDate: input.entryDate,
      entryDateBs: input.entryDateBs,
      vehicle: vehicle.id,
      from: input.from,
      to: input.to,
      material: input.material,
      company: input.company,
      phone: input.phone,
      note: input.note,
      status: 'In Job',
      visits: [{
        id: randomUUID(),
        at: new Date().toISOString(),
        checkpoint: input.checkpoint,
        staff: staffName(db, input.staff),
        weight: input.weight,
        fee: input.fee,
        payment: input.payment,
        stage: input.stage,
        receiptNo: Math.max(0, ...db.journeys.flatMap(j => j.visits.map(c => c.receiptNo || 0))) + 1,
        bill: 'TK-' + number + '-1'
      }]
    };
    // Consume the pending request in the same write as the new journey.
    db.journeys.unshift(record);
    if (input.pendingId) db.pending = db.pending.filter(p => p.id !== input.pendingId);
    return record;
  });
  res.status(201).json({
    data: created
  });
});
api.patch('/journeys/:id/receipt/:visit', (req, res) => {
  const values = z.object({
    weight: positive,
    fee: z.coerce.number().finite().min(0).max(10000)
  }).parse(req.body);
  res.json({
    data: change(db => {
      const trip = db.journeys.find(j => j.id === req.params.id);
      if (!trip) throw new Problem(404, 'Journey unavailable.');
      const receipt = trip.visits.find(v => v.id === req.params.visit);
      if (!receipt) throw new Problem(404, 'Receipt unavailable.');
      if (trip.status === 'Completed') throw new Problem(409, 'This journey has ended.');
      Object.assign(receipt, values);
      return trip;
    })
  });
});
api.post('/journeys/:id/:action', (req, res) => {
  const result = change(db => {
    const row = db.journeys.find(j => j.id === req.params.id);
    if (!row) throw new Problem(404, 'Journey not found.');
    if (row.status === 'Completed') throw new Problem(409, 'This journey has ended.');
    if (req.params.action === 'end') row.status = 'Completed'; else if (req.params.action === 'check-in') {
      const v = visit.parse(req.body);
      if ((row.visits.at(-1)?.stage || row.visits.length) >= 3) throw new Problem(409, 'All three checkpoint entries have been recorded.');
      if (row.visits.some(c => c.checkpoint === v.checkpoint)) throw new Problem(409, 'This checkpoint has already recorded a weight.');
      row.visits.push({
        ...v,
        id: randomUUID(),
        staff: staffName(db, v.staff),
        at: new Date().toISOString(),
        stage: (row.visits.at(-1)?.stage || row.visits.length) + 1,
        receiptNo: Math.max(0, ...db.journeys.flatMap(j => j.visits.map(c => c.receiptNo || 0))) + 1,
        bill: 'TK-' + row.number + '-' + (row.visits.length + 1)
      });
    } else throw new Problem(404, 'Unknown journey action.');
    return row;
  });
  res.json({
    data: result
  });
});
api.post('/pending', (req, res) => {
  const data = z.object({
    entryDate: z.iso.date().default(() => new Date().toISOString().slice(0, 10)),
    plate: str.min(1),
    from: str.min(1),
    to: str.min(1),
    material: str.min(1)
  }).parse(req.body);
  res.status(201).json({
    data: change(db => {
      if (db.pending.some(p => p.plate.toLowerCase() === data.plate.toLowerCase())) throw new Problem(409, 'A request already exists for this plate.');
      const row = {
        ...data,
        id: randomUUID()
      };
      db.pending.unshift(row);
      return row;
    })
  });
});
api.delete('/pending/:id', (req, res) => {
  change(db => {
    if (!db.pending.some(p => p.id === req.params.id)) throw new Problem(404, 'Request not found.');
    db.pending = db.pending.filter(p => p.id !== req.params.id);
  });
  res.sendStatus(204);
});
for (const group of groups) {
  const base = '/' + group;
  api.get(base, (req, res) => {
    const q = String(req.query.q ?? '').toLowerCase();
    const rows = read()[group].filter(r => Object.values(r).some(v => v.toLowerCase().includes(q)) && (!req.query.status || [r.active, r.verification, r.plateType].includes(String(req.query.status))));
    const total = rows.length;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100)),
      page = Math.max(1, Number(req.query.page) || 1);
    rows.sort((a, b) => (a.name || a.plate).localeCompare(b.name || b.plate));
    res.json({
      data: rows.slice((page - 1) * limit, page * limit).map(brief),
      total,
      page
    });
  });
  function save(db: Database, body: unknown, id?: string) {
    const values = z.record(z.string(), z.string()).parse(body);
    const item: Entry = {
      id: id || randomUUID()
    },
      errors: Record<string, string> = {};
    if (id && !db[group].some(r => r.id === id)) throw new Problem(404, 'Record not found.');
    for (const f of fields[group]) {
      let value = (values[f.key] || '').trim();
      if (f.type === 'file') {
        if (value === 'Attached' || !value) {
          value = db[group].find(r => r.id === id)?.[f.key] || '';
        }
        if (value) {
          const match = /^data:(image\/(?:jpeg|png)|application\/pdf);base64,([a-zA-Z0-9+/=]+)$/.exec(value);
          const data = match ? Buffer.from(match[2], 'base64') : null;
          if (!match || !data || data.length > 524288 || f.key === 'logo' && match[1] === 'application/pdf' || !(match[1] === 'image/png'
            ? data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
            : match[1] === 'image/jpeg'
              ? data.subarray(0, 3).toString('hex') === 'ffd8ff'
              : data.subarray(0, 5).toString() === '%PDF-')) errors[f.key] = 'Choose a supported file under 512 KB.';
        }
      } else if (value.length > 200) errors[f.key] = 'Use 200 characters or fewer.';
      item[f.key] = value;
      if (f.required && !value) errors[f.key] = 'Required.'; else if (f.choices && value && !f.choices.includes(value)) errors[f.key] = 'Select an available option.'; else if (f.reference && !db[f.reference].some(r => r.id === value)) errors[f.key] = 'Select an existing owner.'; else if (f.type === 'email' && value && !z.email().safeParse(value).success) errors[f.key] = 'Enter a valid email.';
    }
    if (item.plate && db[group].some(r => r.id !== id && r.plate.toLowerCase() === item.plate.toLowerCase())) errors.plate = 'This plate is already registered.';
    if (Object.keys(errors).length) throw new Problem(422, 'Check the highlighted fields.', errors);
    if (group === 'owners') item.address = [item.state, item.district, item.local, item.street].filter(Boolean).join(', ');
    if (id) db[group] = db[group].map(r => r.id === id ? item : r); else db[group].unshift(item);
    return brief(item);
  }
  api.post(base, (req, res) => res.status(201).json({
    data: change(db => save(db, req.body))
  }));
  api.put(base + '/:id', (req, res) => res.json({
    data: change(db => save(db, req.body, String(req.params.id)))
  }));
  api.get(base + '/:id', (req, res) => {
    const row = read()[group].find(r => r.id === req.params.id);
    if (!row) throw new Problem(404, 'Record not found.');
    res.json({
      data: brief(row)
    });
  });
}
api.delete('/staff/:id', (req, res) => {
  change(db => {
    if (!db.staff.some(s => s.id === req.params.id)) throw new Problem(404, 'Staff member not found.');
    db.staff = db.staff.filter(s => s.id !== req.params.id);
  });
  res.sendStatus(204);
});
api.get('/sections/:id/file', (req, res) => {
  const record = read().sections?.find(r => r.id === req.params.id);
  if (!record?.file) throw new Problem(404, 'Document unavailable.');
  const [header, body] = record.file.split(',');
  res.attachment('document.' + (header.includes('pdf') ? 'pdf' : header.includes('png') ? 'png' : 'jpg')).send(Buffer.from(body, 'base64'));
});
api.post('/sections', (req, res) => {
  const values = z.record(z.string(), z.string()).parse(req.body);
  res.json({
    data: change(db => {
      const {
        section,
        parent,
        id
      } = values;
      if (!Object.hasOwn(profileFields, section)) throw new Problem(422, 'Unknown section.');
      const group = section === 'Bank Details' ? 'owners' : 'vehicles';
      if (!db[group].some(r => r.id === parent)) throw new Problem(404, 'Profile unavailable.');
      const records = db.sections ??= [];
      const existing = records.find(r => r.id === id && r.parent === parent && r.section === section);
      if (id && !existing) throw new Problem(404, 'Entry unavailable.');
      const item: Entry = {
        id: existing?.id || randomUUID(),
        parent,
        section
      };
      for (const f of profileFields[section]) {
        let v = (values[f.key] || '').trim();
        if (f.type === 'file') {
          if (!v || v === 'Attached') v = existing?.file || '';
          if (v && !/^data:(image\/(png|jpeg)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(v)) throw new Problem(422, 'Unsupported document.');
          if (v.length > 701000) throw new Problem(413, 'File exceeds 512 KB.');
          if (v) {
            const [header, payload] = v.split(',');
            const bytes = Buffer.from(payload, 'base64');
            const valid = header.includes('png')
              ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
              : header.includes('jpeg')
                ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff'
                : bytes.subarray(0, 5).toString() === '%PDF-';
            if (!valid || bytes.length > 524288) throw new Problem(422, 'Invalid document contents.');
          }
        } else if (v.length > 200) throw new Problem(422, 'Field is too long.');
        if (f.required && !v) throw new Problem(422, 'Enter ' + f.label + '.');
        if (f.type === 'number' && !(Number(v) > 0)) throw new Problem(422, 'Enter a positive weight.');
        if (f.type === 'date' && v && !z.iso.date().safeParse(v).success) throw new Problem(422, 'Enter a valid date.');
        if (f.reference && !db.owners.some(o => o.id === v)) throw new Problem(422, 'Select an owner.');
        item[f.key] = v;
      }
      if (existing) Object.assign(existing, item); else records.push(item);
      return {
        id: item.id
      };
    })
  });
});
api.delete('/sections/:id', (req, res) => {
  change(db => {
    if (!db.sections?.some(r => r.id === req.params.id)) throw new Problem(404, 'Entry unavailable.');
    db.sections = db.sections.filter(r => r.id !== req.params.id);
  });
  res.sendStatus(204);
});

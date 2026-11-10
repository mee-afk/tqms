import { SearchSelect } from '../components/SearchSelect';
import { useState } from 'react';
import { Head, Table } from '../components/Controls';
import { dateText, dayKey, money } from '../format';
import type { Work } from './Directory';
function exportExcel(columns: string[], rows: (string | number)[][]) {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = [columns, ...rows].map(row => '<Row>' + row.map(v => '<Cell><Data ss:Type="' + (typeof v === 'number' ? 'Number' : 'String') + '">' + escape(String(v)) + '</Data></Cell>').join('') + '</Row>').join('');
  const xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Checkpoint report"><Table>' + lines + '</Table></Worksheet></Workbook>';
  const url = URL.createObjectURL(new Blob([xml], {
    type: 'application/xml'
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'checkpoint-report.xml';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Reports({
  db,
  summary
}: {
  db: Work['db'];
  summary: boolean;
}) {
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [q, setQ] = useState(''),
    [material, setMaterial] = useState(''),
    [bill, setBill] = useState('');
  const visits = db.journeys.flatMap(j => j.visits.map(v => ({
    ...v,
    plate: db.vehicles.find(r => r.id === j.vehicle)?.plate || '',
    material: j.material,
    association: db.vehicles.find(r => r.id === j.vehicle)?.association || '—',
    kind: db.vehicles.find(r => r.id === j.vehicle)?.kind || '—',
    note: j.note,
    route: j.from + ' → ' + j.to
  })));
  const filtered = visits.filter(v => (!from || dayKey(v.at) >= from) && (!to || dayKey(v.at) <= to) && (summary ? v.staff + ' ' + v.checkpoint : v.plate).toLowerCase().includes(q.toLowerCase()) && (!material || v.material === material) && (!bill || v.bill === bill));
  const totals = new Map<string, {
    association: string;
    date: string;
    staff: string;
    checkpoint: string;
    vehicles: Set<string>;
    fee: number;
  }>();
  for (const v of filtered) {
    const key = [v.association, dayKey(v.at), v.staff, v.checkpoint].join('|');
    const r = totals.get(key) || {
      association: v.association,
      date: dayKey(v.at),
      staff: v.staff,
      checkpoint: v.checkpoint,
      vehicles: new Set<string>(),
      fee: 0
    };
    r.vehicles.add(v.plate);
    r.fee += v.fee;
    totals.set(key, r);
  }
  const columns = summary
    ? [
      'S.N',
      'Sthaniya Sangh',
      'Checkpoint',
      'Checkpoint user',
      'Entry date',
      'Total vehicle',
      'Total amount'
    ]
    : [
      'S.N',
      'Date & time',
      'Receipt no.',
      'Vehicle no.',
      'Vehicle type',
      'Checkpoint name',
      'From – To (route)',
      'Gross weight (kg)',
      'Material',
      'Remarks'
    ];
  const rows = summary
    ? [...totals.values()].map((r, i) => [i + 1, r.association, r.checkpoint, r.staff, r.date, r.vehicles.size, r.fee])
    : filtered.map((v, i) => [
      i + 1,
      dateText(v.at) + ' ' + new Date(v.at).toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kathmandu',
        hour: '2-digit',
        minute: '2-digit'
      }),
      v.bill,
      v.plate,
      v.kind,
      v.checkpoint,
      v.route,
      v.weight,
      v.material,
      v.note
    ]);
  return <>
    <Head
      section="Reports"
      title={summary ? 'Checkpoint entry report' : 'Detailed entry report'}
      action={<div className="actions">
        <button onClick={() => print()}>Print</button>
        <button className="primary" onClick={() => exportExcel(columns, rows)}>Export Excel</button>
      </div>}
    />
    <div className="toolbar">
      <label>
        Start date
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={e => setFrom(e.target.value)}
        />
      </label>
      <label>
        End date
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={e => setTo(e.target.value)}
        />
      </label>
      {summary
        ? <label>
          Checkpoint/User name
          <input type="search" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        : <>
          <SearchSelect
            label="Vehicle no."
            value={q}
            options={visits.map(v => v.plate)}
            change={setQ}
          />
          <SearchSelect
            label="Goods details"
            value={material}
            options={visits.map(v => v.material)}
            change={setMaterial}
          />
          <SearchSelect
            label="Bill no."
            value={bill}
            options={visits.map(v => v.bill)}
            change={setBill}
          />
        </>}
      <button
        onClick={() => {
          setFrom('');
          setTo('');
          setQ('');
          setBill('');
          setMaterial('');
        }}
      >Clear</button>
    </div>
    <p className="report-total">
      {filtered.length}
      {" checkpoint entries "}
      <span>
        {money(filtered.reduce((n, v) => n + v.fee, 0))}
        {" total fees"}
      </span>
    </p>
    <Table key={[from, to, q, bill, material].join('|')} columns={columns} rows={rows} />
  </>;
}

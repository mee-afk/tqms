import { CardList } from '../components/CardList';
import { SearchSelect } from '../components/SearchSelect';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Field, Journey } from '../model';
import { checkpoints } from '../model';
import type { Work } from './Directory';
import { Head, Table, Badge, RecordForm, Confirm } from '../components/Controls';
import { Receipt } from '../components/Receipt';
import { Icon } from '../components/Icon';
import { dateText, money, dayKey } from '../format';
import { request } from '../api';
const queue = '/admin/queue';
export function Queue({
  db,
  refresh
}: Work) {
  const [tab, setTab] = useState('All'),
    [q, setQ] = useState(''),
    [remove, setRemove] = useState('');
  const [kind, setKind] = useState(''),
    [card, setCard] = useState(''),
    [plate, setPlate] = useState('');
  const allCards = (db.sections || []).filter(r => r.section === 'Type Card');
  const trips = db.journeys.filter(j => (!kind || db.vehicles.find(v => v.id === j.vehicle)?.kind === kind) && (!plate || db.vehicles.find(v => v.id === j.vehicle)?.plate === plate) && (!card || allCards.some(r => r.parent === j.vehicle && r.card === card)) && (tab === 'All' || j.status === tab || tab === 'Payment Pending' && j.visits.some(v => v.payment === 'Pending')) && (db.vehicles.find(v => v.id === j.vehicle)?.plate + ' ' + j.from + ' ' + j.to + ' ' + j.number).toLowerCase().includes(q.toLowerCase()));
  const pending = db.pending.filter(p => (p.plate + ' ' + p.from + ' ' + p.to).toLowerCase().includes(q.toLowerCase()));
  return <>
    <Head
      section="Queue"
      title="Vehicle queue"
      action={<Link className="primary" to={queue + '/new'}>+ Add new queue</Link>}
    />
    <div className="toolbar">
      <label>
        Search plate, route or queue
        <input type="search" value={q} onChange={e => setQ(e.target.value)} />
      </label>
    </div>
    <div className="tabs">{['All', 'In Job', 'In Queue', 'Unregistered', 'Payment Pending', 'Completed'].map(t => <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>{t}</button>)}</div>
    {['All', 'In Queue', 'Unregistered'].includes(tab) && <>
      <div className="section-head">
        <h2>Pending queue</h2>
        <Link to="/request">
          <Icon name="plus" />
          {" Pending request"}
        </Link>
      </div>
      <Table
        columns={['Vehicle', 'Route', 'Entry date', 'Material', 'Actions']}
        rows={pending.map(p => [
          p.plate,
          p.from + ' → ' + p.to,
          p.entryDate || '—',
          p.material,
          <div className="row-actions">
            <Link
              to={queue + '/approve/' + p.id}
              title="Review pending entry"
              aria-label="Review pending entry"
            >
              <Icon name="eye" />
            </Link>
            <button aria-label="Delete pending entry" onClick={() => setRemove(p.id)}>
              <Icon name="del" />
            </button>
          </div>
        ])}
      />
    </>}
    {['All', 'In Job', 'Completed', 'Payment Pending'].includes(tab) && <>
      <h2>Journey register</h2>
      <div className="toolbar">
        <SearchSelect
          label="Vehicle name"
          options={db.vehicles.map(v => v.plate)}
          value={plate}
          change={setPlate}
        />
        <SearchSelect
          label="Card type"
          options={allCards.map(r => r.card)}
          value={card}
          change={setCard}
        />
        <SearchSelect
          label="Vehicle type"
          options={db.vehicles.map(v => v.kind)}
          value={kind}
          change={setKind}
        />
      </div>
      <CardList
        key={tab + q + card + kind + plate}
        cards={trips.map(j => {
          const vehicle = db.vehicles.find(v => v.id === j.vehicle);
          return <>
            <div className="section-head">
              <small>
                Queue #
                {j.number}
              </small>
              <Badge>{j.status}</Badge>
            </div>
            <h3>{vehicle?.plate}</h3>
            <p>
              {vehicle?.kind}
              {" · "}
              {j.from}
              {" → "}
              {j.to}
            </p>
            <small>
              {"Last checkpoint · "}
              {j.visits.at(-1)?.checkpoint}
            </small>
            <div className="row-actions">
              <Link to={queue + '/' + j.id}>
                <Icon name="eye" />
                {" View"}
              </Link>
              <Link to={queue + '/' + j.id + '/receipt'}>
                <Icon name="receipt" />
                {" Receipt"}
              </Link>
            </div>
          </>;
        })}
      />
    </>}
    {remove && <Confirm
      title="Remove pending request?"
      close={() => setRemove('')}
      accept={async () => {
        await request('/pending/' + remove, 'DELETE');
        await refresh('Request removed.');
      }}
    >This removes the waiting entry from the queue.</Confirm>}
  </>;
}
export function JourneyForm({
  db,
  refresh,
  id,
  pendingId
}: Work & {
  id?: string;
  pendingId?: string;
}) {
  const nav = useNavigate(),
    trip = db.journeys.find(j => j.id === id),
    pending = db.pending.find(p => p.id === pendingId);
  const [match, setMatch] = useState('');
  const [showMatch, setShowMatch] = useState(false),
    [selected, setSelected] = useState('');
  const choices = {
    ...db,
    staff: db.staff.filter(s => s.active === 'Active'),
    vehicles: db.vehicles.filter(v => !db.journeys.some(j => j.vehicle === v.id && j.status === 'In Job')).map(v => ({
      ...v,
      name: v.plate
    }))
  };
  if (id && !trip || pendingId && !pending) return <p>
    {"Queue record unavailable. "}
    <Link to={queue}>Open queue</Link>
  </p>;
  const required = (key: string, label: string): Field => ({
    key,
    label,
    required: true
  });
  const common: Field[] = [
    {
      ...required('checkpoint', 'Checkpoint'),
      choices: checkpoints.filter(c => !trip?.visits.some(v => v.checkpoint === c))
    },
    {
      ...required('staff', 'Checkpoint staff'),
      reference: 'staff'
    },
    {
      ...required('weight', 'Gross weight (kg)'),
      type: 'number'
    },
    {
      ...required('fee', 'Weighing fee (Rs.)'),
      type: 'number'
    },
    {
      key: 'payment',
      label: 'Payment',
      required: true,
      choices: ['Paid', 'Pending']
    }
  ];
  const form: Field[] = trip
    ? common
    : [
      {
        ...required('vehicle', pending ? 'Matched vehicle' : 'Vehicle'),
        reference: 'vehicles'
      },
      required('from', 'From'),
      required('to', 'To'),
      ...(pending
        ? [{
          key: 'stage',
          label: 'Checkpoint entry',
          choices: ['First checkpoint', 'Second checkpoint', 'Third checkpoint'],
          required: true
        }]
        : []),
      {
        ...required('entryDate', 'Entry date (AD)'),
        type: 'date'
      },
      {
        key: 'entryDateBs',
        label: 'Receipt date (BS · YYYY-MM-DD)'
      },
      required('material', pending ? 'Material' : 'Load details'),
      {
        key: 'company',
        label: 'Transport company'
      },
      {
        key: 'phone',
        label: 'Driver’s phone'
      },
      {
        key: 'note',
        label: pending ? 'Remarks' : 'Narration'
      },
      ...common
    ];
  return <>
    <Head
      section="Queue"
      title={trip ? 'Checkpoint entry' : pending ? 'Approve pending vehicle' : 'Create new queue'}
    />
    {pending && <div className="notice">
      <p>
        {"Requested plate "}
        <strong>{pending.plate}</strong>
        . Confirm the matching registered vehicle before saving.
      </p>
      <button onClick={() => setShowMatch(true)}>Matched vehicle</button>
      {showMatch && <dialog open aria-label="Matched vehicle">
        <h2>Matched vehicle</h2>
        <label>
          Search matching vehicle
          <input type="search" value={match} onChange={e => setMatch(e.target.value)} />
        </label>
        <div className="match-list">{choices.vehicles.filter(v => v.name.toLowerCase().includes(match.toLowerCase())).map(v => <button
          key={v.id}
          onClick={() => {
            setSelected(v.id);
            setShowMatch(false);
            setMatch('');
          }}
        >{v.name}</button>)}</div>
        <button
          onClick={() => {
            setShowMatch(false);
            setMatch('');
          }}
        >Close</button>
      </dialog>}
    </div>}
    <RecordForm
      key={selected}
      db={choices}
      fields={form}
      initial={{
        stage: 'First checkpoint',
        entryDate: pending?.entryDate || dayKey(new Date().toISOString()),
        note: db.narrations.find(n => n.active !== 'Inactive')?.name || '',
        payment: 'Paid',
        fee: '50',
        from: pending?.from || '',
        to: pending?.to || '',
        material: pending?.material || '',
        staff: choices.staff[0]?.id || '',
        checkpoint: common[0].choices?.[0] || '',
        vehicle: selected || (pending ? choices.vehicles.find(v => v.name === pending.plate)?.id || '' : '')
      }}
      back={() => nav(queue)}
      extra={v => {
        const vehicle = db.vehicles.find(r => r.id === (v.vehicle || trip?.vehicle));
        const tare = db.sections?.findLast(r => r.section === 'Tare Weight' && r.parent === vehicle?.id)?.weight;
        return <aside className="preview-column">
          <Receipt
            issuer={db.issuer}
            preview
            plate={vehicle?.plate || pending?.plate}
            material={v.material || trip?.material}
            note={v.note || trip?.note}
            weight={v.weight}
            fee={v.fee}
            date={v.entryDateBs ? v.entryDateBs + ' BS' : v.entryDate + ' AD'}
            checkpoint={v.checkpoint}
          />
          <h3>Vehicle status</h3>
          <dl>{Object.entries({
            'Vehicle type': vehicle?.kind,
            'Sthaniya Sangh': vehicle?.association,
            'Owner name': db.owners.find(o => o.id === vehicle?.owner)?.name,
            'Tare weight (kg)': tare,
            'Net weight (kg)': tare && v.weight ? Number(v.weight) - Number(tare) : undefined
          }).map(([k, x]) => <div key={k}>
            <dt>{k}</dt>
            <dd>{x ?? '—'}</dd>
          </div>)}</dl>
        </aside>;
      }}
      save={async v => {
        const row = await request<Journey>(trip ? '/journeys/' + id + '/check-in' : '/journeys', 'POST', {
          ...v,
          stage: v.stage ? ['First checkpoint', 'Second checkpoint', 'Third checkpoint'].indexOf(v.stage) + 1 : 1,
          pendingId
        });
        await refresh('Checkpoint receipt saved.');
        nav(queue + '/' + row.id);
      }}
    />
  </>;
}
export function JourneyDetail({
  db,
  refresh,
  id,
  receiptOnly = false
}: Work & {
  id: string;
  receiptOnly?: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [pay, setPay] = useState(false);
  const [end, setEnd] = useState(false),
    [receipt, setReceipt] = useState(new URLSearchParams(location.search).get('bill') || '');
  const j = db.journeys.find(j => j.id === id);
  if (!j) return <p>
    {"Journey unavailable. "}
    <Link to={queue}>Return to queue</Link>
  </p>;
  const vehicle = db.vehicles.find(v => v.id === j.vehicle),
    owner = db.owners.find(o => o.id === vehicle?.owner);
  const slots = [1, 2, 3].map(n => j.visits.find((c, i) => (c.stage || i + 1) === n));
  const v = j.visits.find(v => v.id === receipt) || j.visits[j.visits.length - 1];
  return <>
    <Head
      section="Queue / Journey"
      title={(receiptOnly ? 'Receipt · ' : 'Queue #') + j.number}
      action={<Badge>{j.status}</Badge>}
    />
    {!receiptOnly && <>
      <div className="panel details">
        <div>
          <small>Vehicle</small>
          <strong>{vehicle?.plate}</strong>
        </div>
        <div>
          <small>Vehicle owner</small>
          <strong>{owner?.name}</strong>
        </div>
        <div>
          <small>Route</small>
          <strong>
            {j.from}
            {" → "}
            {j.to}
          </strong>
        </div>
        <div>
          <small>Load details</small>
          <strong>{j.material}</strong>
        </div>
      </div>
      {j.status === 'In Job' && <div className="actions">
        {(j.visits.at(-1)?.stage || j.visits.length) < 3 && <Link className="primary" to={queue + '/' + id + '/check-in'}>Check in</Link>}
        <button onClick={() => setEnd(true)}>End journey</button>
      </div>}
      <h2>Checkpoint history</h2>
      <Table
        columns={[
          'S.N',
          'Entry date',
          'From',
          'To',
          'CP1 wt. (kg)',
          'CP2 wt. (kg)',
          'CP3 wt. (kg)',
          'CP1',
          'CP1 bill no.',
          'CP2',
          'CP2 bill no.',
          'CP3',
          'CP3 bill no.'
        ]}
        rows={[[
          1,
          j.entryDate || dateText(j.visits[0].at),
          j.from,
          j.to,
          ...[0, 1, 2].map(i => slots[i]?.weight.toFixed(2) || '—'),
          ...[0, 1, 2].flatMap(i => {
            const c = slots[i];
            return c
              ? [c.checkpoint, <Link to={queue + '/' + id + '/receipt?bill=' + c.id}>{c.bill}</Link>]
              : ['—', '—'];
          })
        ]]}
      />
      <Link className="primary" to={queue + '/' + id + '/receipt'}>
        <Icon name="receipt" />
        Open receipt
      </Link>
    </>}
    {receiptOnly && <article className="receipt panel">
      <label>
        Bill number
        <select value={v.id} onChange={e => setReceipt(e.target.value)}>{j.visits.map(c => <option key={c.id} value={c.id}>{c.bill}</option>)}</select>
      </label>
      <Receipt
        issuer={db.issuer}
        plate={vehicle?.plate}
        material={j.material}
        note={j.note}
        weight={v.weight}
        fee={v.fee}
        bill={v.receiptNo ? String(v.receiptNo) : v.bill}
        date={j.visits[0].id === v.id && j.entryDateBs ? j.entryDateBs + ' BS' : dateText(v.at) + ' AD'}
        time={new Date(v.at).toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Kathmandu',
          hour: '2-digit',
          minute: '2-digit'
        })}
        checkpoint={v.checkpoint}
      />
      <p>
        {"Payment · "}
        {v.payment || 'Paid'}
      </p>
      {j.status === 'In Job' && <button onClick={() => setEdit(!edit)}>{edit ? 'Close correction' : 'Edit entry'}</button>}
      {" "}
      {edit && <RecordForm
        key={v.id}
        db={db}
        fields={[
          {
            key: 'weight',
            label: 'Gross weight (kg)',
            type: 'number',
            required: true
          },
          {
            key: 'fee',
            label: 'Weighing fee (Rs.)',
            type: 'number',
            required: true
          }
        ]}
        initial={{
          weight: String(v.weight),
          fee: String(v.fee)
        }}
        back={() => setEdit(false)}
        save={async values => {
          await request('/journeys/' + id + '/receipt/' + v.id, 'PATCH', values);
          await refresh('Entry corrected.');
          setEdit(false);
        }}
      />}
      {v.payment === 'Pending' && <button onClick={() => setPay(true)}>Record payment</button>}
      {" "}
      <button onClick={() => window.print()}>Print receipt</button>
    </article>}
    {pay && <Confirm
      title="Record payment?"
      close={() => setPay(false)}
      accept={async () => {
        await request('/journeys/' + id + '/pay/' + v.id, 'POST', {});
        await refresh('Payment recorded.');
      }}
    >
      {"Confirm receipt of "}
      {money(v.fee)}
      {" for "}
      {v.bill}
      .
    </Confirm>}
    {end && <Confirm
      title="End this journey?"
      close={() => setEnd(false)}
      accept={async () => {
        await request('/journeys/' + id + '/end', 'POST', {});
        await refresh('Journey completed.');
      }}
    >The vehicle will become available for a new queue. Its checkpoint history and receipts will stay in reports.</Confirm>}
  </>;
}

import { Profile } from './Profile';
import { Icon } from '../components/Icon';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fields, titles } from '../model';
import type { Group, Database, Entry } from '../model';
import { request } from '../api';
import { Head, Table, Badge, RecordForm, Confirm } from '../components/Controls';
export type Work = {
  db: Database;
  refresh: (message: string) => Promise<void>;
};
import { paths } from '../paths';
const singular: Record<Group, string> = {
  owners: 'owner',
  vehicles: 'vehicle',
  others: 'other vehicle',
  staff: 'staff member',
  narrations: 'narration'
};
const cols: Record<Group, string[]> = {
  owners: ['name', 'address', 'phone', 'linked', 'assigned'],
  vehicles: ['plate', 'lot', 'vehicleNumber', 'kind'],
  others: ['plate', 'numberType', 'plateType'],
  staff: ['name', 'district', 'phone', 'active'],
  narrations: ['name', 'active']
};
export function Directory({
  group,
  id,
  mode,
  db,
  refresh
}: Work & {
  group: Group;
  id?: string;
  mode?: string;
}) {
  const nav = useNavigate(),
    base = paths[group],
    title = titles[group];
  const [q, search] = useState(''),
    [filter, setFilter] = useState(''),
    [sort, setSort] = useState('asc'),
    [remove, setRemove] = useState<Entry>();
  const [error, setError] = useState('');
  const item = db[group].find(r => r.id === id);
  const display = (r: Entry, k: string) => k === 'owner'
    ? db.owners.find(o => o.id === r.owner)?.name || '—'
    : k === 'assigned'
      ? r.assigned || (db.vehicles.some(v => v.owner === r.id) ? 'Assigned' : 'Unassigned')
      : k === 'address'
        ? r.address || [r.state, r.district, r.local, r.street].filter(Boolean).join(', ')
        : r[k] || '—';
  if (id && !item) return <p>
    {"Record unavailable. "}
    <Link to={base}>Return to list</Link>
  </p>;
  if (mode === 'new' || mode === 'edit') return <>
    <Head section={title} title={(item ? 'Edit ' : 'Add ') + singular[group]} />
    <RecordForm
      db={db}
      fields={fields[group]}
      initial={item
        ? {
          ...item,
          assigned: item.assigned || 'Unassigned',
          active: item.active || 'Active'
        }
        : {
          assigned: 'Unassigned',
          verification: 'Unverified',
          individual: 'Individual',
          active: 'Active'
        }}
      back={() => nav(base)}
      save={async values => {
        await request('/' + group + (item ? '/' + item.id : ''), item ? 'PUT' : 'POST', values);
        await refresh('Record saved.');
        nav(base);
      }}
    />
  </>;
  if (item && (group === 'vehicles' || group === 'owners')) return <Profile item={item} group={group} db={db} refresh={refresh} />;
  if (item) return <>
    <Head
      section={title}
      title={item.name || item.plate}
      action={<Link className="primary" to={base + '/' + id + '/edit'}>Edit record</Link>}
    />
    <div className="panel details">{fields[group].map(f => <div key={f.key}>
      <small>{f.label}</small>
      <strong>{f.type === 'file' && item[f.key]
        ? <a href={'/api/owners/' + item.id + '/files/' + f.key} download>Download</a>
        : display(item, f.key)}</strong>
    </div>)}</div>
    <Link to={base}>
      {"Back to "}
      {title.toLowerCase()}
    </Link>
  </>;
  const filterKey = group === 'owners'
    ? 'verification'
    : group === 'staff' ? 'active' : group === 'others' ? 'plateType' : 'kind';
  const rows = db[group].filter(r => (!filter || r[filterKey] === filter) && Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase())).sort((a, b) => (sort === 'asc' ? 1 : -1) * (a.name || a.plate).localeCompare(b.name || b.plate));
  return <>
    <Head
      section={group === 'staff' || group === 'narrations' ? 'Checkpoints' : 'Vehicle'}
      title={title}
      action={<Link className="primary" to={base + '/new'}>
        {"+ Add "}
        {singular[group]}
      </Link>}
    />
    <div className="toolbar">
      <label>
        Search
        <input value={q} onChange={e => search(e.target.value)} type="search" />
      </label>
      {group !== 'narrations' && <label>
        Filter
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All records</option>
          {[...new Set(db[group].map(r => r[filterKey]).filter(Boolean))].map(v => <option key={v}>{v}</option>)}
        </select>
      </label>}
      <label>
        Sort
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="asc">A–Z</option>
          <option value="desc">Z–A</option>
        </select>
      </label>
      <button
        onClick={() => {
          search('');
          setFilter('');
          setSort('asc');
        }}
      >Clear</button>
      {group === 'owners' && <button onClick={() => print()}>Print</button>}
    </div>
    <Table
      key={q + filter + sort}
      columns={[...cols[group].map(k => fields[group].find(f => f.key === k)?.label || 'Address'), 'Actions']}
      rows={rows.map(r => [
        ...cols[group].map((k, i) => i === 0
          ? <Link to={base + '/' + r.id}>{display(r, k)}</Link>
          : k === 'active'
            ? <button
              className="switch"
              role="switch"
              aria-label={'Active status for ' + r.name}
              aria-checked={r.active !== 'Inactive'}
              onClick={async () => {
                try {
                  await request('/' + group + '/' + r.id, 'PUT', {
                    ...r,
                    active: r.active === 'Inactive' ? 'Active' : 'Inactive'
                  });
                  await refresh('Status updated.');
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <i />
            </button>
            : ['verification'].includes(k) ? <Badge>{display(r, k)}</Badge> : display(r, k)),
        <div className="row-actions">
          <Link title="View" aria-label={'View ' + (r.name || r.plate)} to={base + '/' + r.id}>
            <Icon name="eye" />
          </Link>
          <Link
            title="Edit"
            aria-label={'Edit ' + (r.name || r.plate)}
            to={base + '/' + r.id + '/edit'}
          >
            <Icon name="edit" />
          </Link>
          {group === 'staff' && <button aria-label={'Delete ' + r.name} onClick={() => setRemove(r)}>
            <Icon name="del" />
          </button>}
        </div>
      ])}
    />
    {error && <p role="alert">{error}</p>}
    {remove && <Confirm
      title="Delete staff member?"
      close={() => setRemove(undefined)}
      accept={async () => {
        await request('/staff/' + remove.id, 'DELETE');
        await refresh('Staff member removed.');
      }}
    >
      {remove.name}
      {" will be removed from the staff list. Previous receipts retain the recorded staff name."}
    </Confirm>}
  </>;
}

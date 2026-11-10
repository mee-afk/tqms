import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Entry, Group } from '../model';
import { fields, profileFields } from '../model';
import { paths } from '../paths';
import type { Work } from './Directory';
import { request } from '../api';
import { Head, Table, Confirm, RecordForm } from '../components/Controls';
import { Icon } from '../components/Icon';
export function Profile({
  db,
  refresh,
  group,
  item
}: Work & {
  group: Group;
  item: Entry;
}) {
  const owner = group === 'owners',
    first = owner ? 'Profile' : 'General';
  const tabs = owner
    ? [first, 'Bank Details', 'Vehicle Details']
    : [first, ...Object.keys(profileFields).filter(n => n !== 'Bank Details')];
  const [tab, setTab] = useState(first),
    [edit, setEdit] = useState<Entry | null>(null),
    [del, setDel] = useState('');
  const records = (db.sections || []).filter(r => r.parent === item.id && r.section === tab);
  const mainOwner = db.owners.find(o => o.id === item.owner);
  const linked = db.vehicles.filter(v => v.owner === item.id || db.sections?.some(s => s.section === 'Vehicle Owner' && s.parent === v.id && s.owner === item.id));
  const schema = profileFields[tab] || [];
  const sections = db.sections || [];
  const insurance = sections.findLast(s => s.parent === item.id && s.section === 'Insurance');
  function value(k: string, v: string) {
    return k === 'owner' ? db.owners.find(o => o.id === v)?.name || '—' : v || '—';
  }
  return <>
    <Head
      section={owner ? 'Vehicle owner list' : 'Vehicle list'}
      title={owner ? 'Vehicle owner profile' : 'Vehicle profile'}
      action={<Link className="primary" to={paths[group] + '/' + item.id + '/edit'}>
        <Icon name="edit" />
        Edit profile
      </Link>}
    />
    <div className="profile-head">
      <h2>{item.name || item.plate}</h2>
      <p>{owner
        ? [item.district, item.state, item.phone, item.email].filter(Boolean).join(' · ')
        : [item.association, mainOwner?.phone, mainOwner?.email].filter(Boolean).join(' · ')}</p>
    </div>
    <div className="tabs">{tabs.map(t => <button
      key={t}
      aria-pressed={tab === t}
      onClick={() => {
        setTab(t);
        setEdit(null);
      }}
    >{t}</button>)}</div>

    {tab === first
      ? <article className="panel details">
        {fields[group].map(f => <div key={f.key}>
          <small>{f.label}</small>
          <strong>{f.type === 'file' && item[f.key]
            ? <a href={'/api/owners/' + item.id + '/files/' + f.key}>Download</a>
            : value(f.key, item[f.key])}</strong>
        </div>)}
        {owner
          ? <div>
            <small>No. of vehicles</small>
            <strong>{linked.length}</strong>
          </div>
          : Object.entries({
            'Insurance company': insurance?.company,
            'Policy type': insurance?.policyType,
            'Policy number': insurance?.policy,
            'Policy expiry date': insurance?.expiry
          }).map(([k, v]) => <div key={k}>
            <small>{k}</small>
            <strong>{v || '—'}</strong>
          </div>)}
      </article>
      : tab === 'Vehicle Details'
        ? <Table
          columns={['Name', 'Type', 'Plate number']}
          rows={linked.map(v => [v.company || item.name, v.kind, <Link to={paths.vehicles + '/' + v.id}>{v.plate}</Link>])}
        />
        : <>
          <div className="section-head">
            <h2>{tab}</h2>
            <button onClick={() => setEdit({
              id: ''
            })}>
              <Icon name="plus" />
              Add entry
            </button>
          </div>
          {tab === 'Vehicle Owner' && mainOwner && <p>
            {"Main owner: "}
            <Link to={paths.owners + '/' + mainOwner.id}>{mainOwner.name}</Link>
            {" · "}
            {mainOwner.address || mainOwner.district}
            {" · "}
            {mainOwner.phone}
          </p>}

          {edit
            ? <RecordForm
              key={tab + edit.id}
              fields={schema}
              initial={edit}
              db={db}
              back={() => setEdit(null)}
              save={async v => {
                await request('/sections', 'POST', {
                  ...v,
                  id: edit.id,
                  parent: item.id,
                  section: tab
                });
                await refresh('Profile updated.');
                setEdit(null);
              }}
              extra={v => tab === 'Vehicle Owner'
                ? <div className="notice">
                  {db.owners.find(o => o.id === v.owner)?.name}
                  {" · "}
                  {db.owners.find(o => o.id === v.owner)?.address}
                </div>
                : null}
            />
            : <Table
              columns={[...schema.map(f => f.label), 'Actions']}
              rows={records.map(r => [
                ...schema.map(f => f.type === 'file' && r.file
                  ? <a href={'/api/sections/' + r.id + '/file'}>Download</a>
                  : value(f.key, r[f.key])),
                <div className="row-actions">
                  <button aria-label="Edit entry" onClick={() => setEdit(r)}>
                    <Icon name="edit" />
                  </button>
                  <button aria-label="Delete entry" onClick={() => setDel(r.id)}>
                    <Icon name="del" />
                  </button>
                </div>
              ])}
            />}
        </>}

    {del && <Confirm
      title="Delete this entry?"
      close={() => setDel('')}
      accept={async () => {
        await request('/sections/' + del, 'DELETE');
        await refresh('Entry removed.');
      }}
    >
      {"This removes the selected "}
      {tab.toLowerCase()}
      {" record."}
    </Confirm>}
  </>;
}

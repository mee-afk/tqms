import { Breadcrumbs } from './Breadcrumbs';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import type { Database, Field } from '../model';
import { RequestError } from '../api';
export function Badge({
  children
}: {
  children: string;
}) {
  return <span
    className={'badge ' + (['In Job', 'Verified', 'Active'].includes(children)
      ? 'green'
      : ['Completed', 'Inactive'].includes(children) ? 'gray' : 'gold')}
  >{children}</span>;
}
export function Head({
  section,
  title,
  action
}: {
  section: string;
  title: string;
  action?: ReactNode;
}) {
  return <header className="page-head">
    <div>
      <div className="crumb">{section === 'Lodbod TQMS' ? section : <Breadcrumbs title={title} />}</div>
      <h1>{title}</h1>
    </div>
    {action}
  </header>;
}
export function Table({
  columns,
  rows,
  empty = 'No records found.'
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  const [page, setPage] = useState(0);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const start = () => setPrinting(true),
      end = () => setPrinting(false);
    window.addEventListener('beforeprint', start);
    window.addEventListener('afterprint', end);
    return () => {
      window.removeEventListener('beforeprint', start);
      window.removeEventListener('afterprint', end);
    };
  }, []);
  const pages = Math.max(1, Math.ceil(rows.length / 10)),
    current = Math.min(page, pages - 1);
  return <div className="table-box">
    <div className="scroll">
      <table>
        <thead>
          <tr>{columns.map(c => <th key={c} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>{(printing ? rows : rows.slice(current * 10, current * 10 + 10)).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    {!rows.length && <p className="empty">{empty}</p>}
    <footer className="pager">
      <span>
        {rows.length}
        {" records"}
      </span>
      {pages > 1 && <div>
        <button disabled={!current} onClick={() => setPage(current - 1)}>Previous</button>
        {" "}
        {current + 1}
        {" / "}
        {pages}
        {" "}
        <button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Next</button>
      </div>}
    </footer>
  </div>;
}
export function Confirm({
  title,
  children,
  close,
  accept
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  accept: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return <dialog
    ref={dialog}
    onCancel={e => {
      e.preventDefault();
      if (!busy) close();
    }}
  >
    <h2>{title}</h2>
    <p>{children}</p>
    {error && <p role="alert">{error}</p>}
    <div className="actions">
      <button disabled={busy} onClick={close}>Cancel</button>
      <button
        className="primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await accept();
            close();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >{busy ? 'Saving…' : 'Confirm'}</button>
    </div>
  </dialog>;
}
export function RecordForm({
  fields,
  initial = {},
  db,
  save,
  back,
  extra
}: {
  fields: Field[];
  initial?: Record<string, string>;
  db: Database;
  save: (values: Record<string, string>) => Promise<void>;
  back: () => void;
  extra?: (values: Record<string, string>) => ReactNode;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(f => [f.key, initial[f.key] ?? ''])));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setErrors({});
    try {
      await save(values);
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof RequestError) setErrors(err.fields);
    } finally {
      setBusy(false);
    }
  }
  return <form className="panel form-panel" onSubmit={submit}>
    <div className="form-grid">{fields.map(f => {
      if (f.key === 'contact' || f.key === 'contactPhone' || f.key === 'contactEmail') {
        if (values.individual === 'Individual') return null;
      }
      if (['citizenship', 'front', 'back'].includes(f.key) && values.individual === 'Company') return null;
      const choices = f.reference ? db[f.reference].map(r => [r.id, r.name || r.plate]) : f.choices?.map(c => [c, c]);
      const props = {
        id: f.key,
        required: f.required,
        value: values[f.key] || '',
        onChange: (e: {
          target: {
            value: string;
          };
        }) => setValues({
          ...values,
          [f.key]: e.target.value
        }),
        'aria-invalid': !!errors[f.key],
        'aria-describedby': errors[f.key] ? f.key + '-error' : undefined
      };
      if (f.key === 'active') {
        const active = values.active !== 'Inactive';
        return <div className="activity-field" key={f.key}>

          <label htmlFor="activity-switch">Activity status</label>

          <div>

            <button
              id="activity-switch"
              type="button"
              role="switch"
              className="switch"
              aria-label="Activity status"
              aria-checked={active}
              onClick={() => setValues(old => ({
                ...old,
                active: active ? 'Inactive' : 'Active'
              }))}
            >

              <i aria-hidden="true" />

            </button>

            <span>{active ? 'Active' : 'Inactive'}</span>

          </div>

        </div>;
      }
      if (f.key === 'individual') return <label className="inline" key={f.key}>
        <input
          type="checkbox"
          role="switch"
          checked={values.individual === 'Individual'}
          onChange={e => setValues({
            ...values,
            individual: e.target.checked ? 'Individual' : 'Company'
          })}
        />
        Is individual
      </label>;
      if (f.key === 'zone' && values.plateType !== 'Zonal' || f.key === 'province' && values.plateType !== 'Provincial') return null;
      if (f.type === 'file') return <label key={f.key}>
        {f.label}
        <input
          type="file"
          accept={f.key === 'logo' ? 'image/png,image/jpeg' : 'image/png,image/jpeg,application/pdf'}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 524288) {
              setError('Choose a file up to 512 KB.');
              e.target.value = '';
              return;
            }
            try {
              const reader = new FileReader();
              reader.onload = () => setValues(old => ({
                ...old,
                [f.key]: String(reader.result)
              }));
              reader.onerror = () => setError('Could not read the selected file.');
              reader.readAsDataURL(file);
            } catch {
              setError('Could not open the selected file.');
            }
          }}
        />
        <small>{errors[f.key] || 'Up to 512 KB'}</small>
      </label>;
      return <label key={f.key} htmlFor={f.key}>
        {f.label}
        {f.required && ' *'}
        {choices
          ? <select {...props}>
            <option value="">
              {"Select "}
              {f.label.toLowerCase()}
            </option>
            {choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          : <input
            {...props}
            type={f.type || 'text'}
            maxLength={200}
            min={f.type === 'number' ? f.key === 'fee' ? 0 : 0.01 : undefined}
            step={f.type === 'number' ? '0.01' : undefined}
          />}
        {" "}
        {errors[f.key] && <small className="error" id={f.key + '-error'}>{errors[f.key]}</small>}
      </label>;
    })}</div>
    {extra?.(values)}
    {error && <p role="alert">{error}</p>}
    <div className="actions">
      <button type="button" onClick={back}>Cancel</button>
      <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </div>
  </form>;
}

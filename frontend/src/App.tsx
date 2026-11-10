import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { loadState, request } from './api';
import { Badge, Head, RecordForm, Table } from './components/Controls';
import { Shell } from './components/Shell';
import { dayKey, money } from './format';
import type { Database, Group } from './model';
import { groups } from './model';
import { Account } from './pages/Account';
import type { Work } from './pages/Directory';
import { Directory } from './pages/Directory';
import { JourneyDetail, JourneyForm, Queue } from './pages/Journeys';
import { Reports } from './pages/Reports';
import { paths } from './paths';
const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      retry: 1
    }
  }
});
function Dashboard({
  db
}: {
  db: Database;
}) {
  const now = dayKey(new Date().toISOString()),
    visits = db.journeys.flatMap(j => j.visits).filter(v => dayKey(v.at) === now);
  return <>
    <Head
      section="Dashboard"
      title="Checkpoint overview"
      action={<Link className="primary" to="/admin/queue/new">+ Add new queue</Link>}
    />
    <section className="station">
      <div>
        <small>बागमती प्रदेश</small>
        <h2>Thankot checkpoint</h2>
        <p>Kathmandu · Bagmati Province</p>
      </div>
      <div className="station-code">
        {"TK "}
        <span>/ 01</span>
      </div>
    </section>
    <div className="stats">{[
      ['Active journeys', db.journeys.filter(j => j.status === 'In Job').length, '/admin/queue'],
      ['Pending requests', db.pending.length, '/admin/queue'],
      ['Registered vehicles', db.vehicles.length, paths.vehicles],
      ['Fees today', money(visits.reduce((n, v) => n + v.fee, 0)), '/admin/reports/details']
    ].map(([name, v, path]) => <Link key={name} to={String(path)}>
      <small>{name}</small>
      <strong>{v}</strong>
    </Link>)}</div>
    <div className="section-head">
      <h2>Recent journeys</h2>
      <Link to="/admin/queue">View queue →</Link>
    </div>
    <Table
      columns={['Queue', 'Vehicle', 'Route', 'Last checkpoint', 'Status']}
      rows={[...db.journeys].sort((a, b) => Date.parse(b.visits.at(-1)!.at) - Date.parse(a.visits.at(-1)!.at)).slice(0, 6).map(j => [
        <Link to={'/admin/queue/' + j.id}>
          #
          {j.number}
        </Link>,
        db.vehicles.find(v => v.id === j.vehicle)?.plate,
        j.from + ' → ' + j.to,
        j.visits.at(-1)?.checkpoint,
        <Badge>{j.status}</Badge>
      ])}
    />
  </>;
}
function DirectoryRoute({
  group,
  mode,
  ...work
}: Work & {
  group: Group;
  mode?: string;
}) {
  const {
    id
  } = useParams();
  return <Directory key={group + (id || '') + mode} group={group} id={id} mode={mode} {...work} />;
}
function JourneyRoute({
  mode,
  ...work
}: Work & {
  mode: string;
}) {
  const {
    id
  } = useParams();
  return mode === 'detail' || mode === 'receipt'
    ? <JourneyDetail receiptOnly={mode === 'receipt'} key={id} id={id!} {...work} />
    : <JourneyForm
      key={mode + id}
      id={mode === 'check-in' ? id : undefined}
      pendingId={mode === 'approve' ? id : undefined}
      {...work}
    />;
}
function Intake({
  db,
  refresh
}: Work) {
  const nav = useNavigate();
  return <>
    <Head section="Queue" title="Request checkpoint entry" />
    <RecordForm
      fields={[
        {
          key: 'plate',
          label: 'Vehicle number',
          required: true
        },
        {
          key: 'from',
          label: 'From',
          required: true
        },
        {
          key: 'to',
          label: 'To',
          required: true
        },
        {
          key: 'entryDate',
          label: 'Entry date',
          type: 'date',
          required: true
        },
        {
          key: 'material',
          label: 'Material',
          required: true
        }
      ]}
      db={db}
      back={() => nav('/admin/queue')}
      save={async v => {
        await request('/pending', 'POST', v);
        await refresh('Request added to the pending queue.');
        nav('/admin/queue');
      }}
    />
  </>;
}
function Workspace() {
  const route = useLocation();
  const [notice, setNotice] = useState('');
  const state = useQuery({
    queryKey: ['checkpoint'],
    queryFn: loadState
  });
  const refresh = async (message: string) => {
    await client.invalidateQueries({
      queryKey: ['checkpoint']
    });
    setNotice(message);
  };
  const db = state.data;
  const work = db ? {
    db,
    refresh
  } : null;
  return <Shell>
    {notice && <div className="toast" role="status">
      {notice}
      <button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button>
    </div>}
    {state.isPending
      ? <div role="status" className="panel">Loading checkpoint records…</div>
      : state.isError
        ? <div className="panel" role="alert">
          {state.error.message}
          {" "}
          <button onClick={() => void state.refetch()}>Retry</button>
        </div>
        : work && <Routes location={route}>
          <Route path="/admin/profile" element={<Account mode="profile" />} />
          <Route path="/admin/changepassword" element={<Account mode="password" />} />
          <Route path="/" element={<Navigate replace to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<Dashboard db={work.db} />} />
          {groups.flatMap(group => ['', '/new', '/:id', '/:id/edit'].map((tail, i) => <Route
            key={group + tail}
            path={paths[group] + tail}
            element={<DirectoryRoute group={group} mode={['list', 'new', 'detail', 'edit'][i]} {...work} />}
          />))}
          <Route path="/admin/queue" element={<Queue {...work} />} />
          {[
            ['new', 'new'],
            ['approve/:id', 'approve'],
            [':id/check-in', 'check-in'],
            [':id/receipt', 'receipt'],
            [':id', 'detail']
          ].map(([path, mode]) => <Route
            key={path}
            path={'/admin/queue/' + path}
            element={<JourneyRoute mode={mode} {...work} />}
          />)}
          <Route
            path="/admin/reports/:kind"
            element={<Reports key={route.pathname} db={work.db} summary={route.pathname.endsWith('summary')} />}
          />
          <Route
            path="/admin/qr"
            element={<>
              <Head section="Checkpoints" title="Checkpoint QR" />
              <div className="panel qr">
                <h2>Thankot checkpoint</h2>
                <img
                  src="/thankot-qr.png"
                  width="248"
                  height="248"
                  alt="QR code containing the Thankot checkpoint identifier"
                />
                <p>Checkpoint identifier · TK-01</p>
                <a className="primary" href="/thankot-qr.png" download="Thankot-TK-01.png">Download QR</a>
              </div>
            </>}
          />
          <Route path="/request" element={<Intake {...work} />} />
          <Route
            path="*"
            element={<>
              <h1>Page not found</h1>
              <Link to="/admin/dashboard">Open dashboard</Link>
            </>}
          />
        </Routes>}
  </Shell>;
}
function Session() {
  const navigate = useNavigate();
  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => request<{
      signedIn: boolean;
    }>('/session')
  });
  if (session.isPending) return <p>Opening workspace…</p>;
  if (session.isError) return <button onClick={() => session.refetch()}>Connection failed · Retry</button>;
  return session.data.signedIn
    ? <Workspace />
    : <Account
      mode="login"
      onDone={() => {
        client.setQueryData(['session'], {
          signedIn: true
        });

        navigate('/admin/dashboard', { replace: true });
      }}
    />;
}
export default function App() {
  return <QueryClientProvider client={client}>
    <BrowserRouter>
      <Session />
    </BrowserRouter>
  </QueryClientProvider>;
}

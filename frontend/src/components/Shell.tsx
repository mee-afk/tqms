import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { paths } from '../paths';
import { request } from '../api';
const menu = [
  {
    name: 'Dashboard',
    icon: 'home',
    url: '/admin/dashboard'
  },
  {
    name: 'Checkpoints',
    icon: 'user',
    children: [['Check users', paths.staff], ['Narration', paths.narrations]]
  },
  {
    name: 'Queue',
    icon: 'queue',
    url: '/admin/queue'
  },
  {
    name: 'Add new queue',
    icon: 'plus',
    url: '/admin/queue/new'
  },
  {
    name: 'Vehicle',
    icon: 'vehicle',
    children: [
      ['Vehicle owner', paths.owners],
      ['Vehicles', paths.vehicles],
      ["Other’s vehicles", paths.others]
    ]
  },
  {
    name: 'Report',
    icon: 'report',
    children: [
      ['Checkpoint entry', '/admin/reports/summary'],
      ['Detailed entry report', '/admin/reports/details']
    ]
  },
  {
    name: 'Generate QR',
    icon: 'qr',
    url: '/admin/qr'
  }
];
export function Shell({
  children
}: {
  children: React.ReactNode;
}) {
  const path = useLocation().pathname;
  const [rail, setRail] = useState(() => localStorage.getItem('nav-rail') === '1'),
    [mobile, setMobile] = useState(false),
    [group, setGroup] = useState(menu.find(m => m.children?.some(([, u]) => path.startsWith(u)))?.name || ''),
    [account, setAccount] = useState(false),
    [err, setErr] = useState('');
  function collapse() {
    if (window.matchMedia('(max-width:768px)').matches) setMobile(!mobile); else {
      setRail(!rail);
      localStorage.setItem('nav-rail', rail ? '0' : '1');
    }
  }
  return <div className={'workspace ' + (rail ? 'rail ' : '') + (mobile ? 'drawer-open' : '')}>
    <aside className="side">
      <Link to="/admin/dashboard" className="brand" aria-label="Lodbod home">
        <img src="/lodbod-logo.png" alt="Lodbod" width="157" height="40" />
      </Link>
      <nav aria-label="Main navigation">{menu.map(m => <div key={m.name}>{m.url
        ? <NavLink
          end
          to={m.url}
          aria-label={m.name}
          title={m.name}
          onClick={() => {
            setGroup('');
            setMobile(false);
          }}
        >
          <Icon name={m.icon} />
          <span>{m.name}</span>
        </NavLink>
        : <>
          <button
            title={m.name}
            aria-label={m.name}
            aria-expanded={group === m.name}
            onClick={() => {
              if (rail) {
                setRail(false);
                localStorage.setItem('nav-rail', '0');
              }
              setGroup(group === m.name && !rail ? '' : m.name);
            }}
          >
            <Icon name={m.icon} />
            <span>{m.name}</span>
            <Icon name="down" />
          </button>
          {group === m.name && <div className="subnav">{m.children?.map(([n, u]) => <NavLink key={u} end to={u} onClick={() => setMobile(false)}>{n}</NavLink>)}</div>}
        </>}</div>)}</nav>
    </aside>
    <main id="content">
      <div className="top">
        <button onClick={collapse} aria-label="Toggle sidebar">
          <Icon name="menu" />
        </button>
        <div className="account">
          <button onClick={() => setAccount(!account)} aria-expanded={account}>
            <Icon name="user" />
            {" Thankot checkpoint "}
            <Icon name="down" />
          </button>
          {account && <div className="popover">
            <Link to="/admin/profile" onClick={() => setAccount(false)}>My profile</Link>
            <Link to="/admin/changepassword" onClick={() => setAccount(false)}>Change password</Link>
            <button
              onClick={async () => {
                try {
                  await request('/logout', 'POST', {});
                  location.assign('/');
                } catch (e) {
                  setErr((e as Error).message);
                }
              }}
            >Logout</button>
            {err}
          </div>}
        </div>
      </div>
      <div className="content">{children}</div>
    </main>
  </div>;
}

import { Link, useLocation } from 'react-router-dom';
import { paths } from '../paths';
import { groups, titles } from '../model';
export function Breadcrumbs({
  title
}: {
  title: string;
}) {
  const path = useLocation().pathname;
  const group = [...groups].sort((a, b) => paths[b].length - paths[a].length).find(g => path === paths[g] || path.startsWith(paths[g] + '/'));
  const links = [['Home', '/admin/dashboard']];
  if (group && path !== paths[group]) links.push([titles[group], paths[group]]);
  if (group && path.endsWith('/edit')) links.push(['Profile', path.slice(0, -5)]);
  if (path.startsWith('/admin/queue/')) links.push(['Queue list', '/admin/queue']);
  if (path.endsWith('/receipt') || path.endsWith('/check-in')) links.push(['Queue detail', path.substring(0, path.lastIndexOf('/'))]);
  return <nav className="crumb" aria-label="Breadcrumb">
    {links.map(([label, url]) => <span key={url}>
      <Link to={url}>{label}</Link>
      {" / "}
    </span>)}
    <span aria-current="page">{title}</span>
  </nav>;
}

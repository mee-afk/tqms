import { useState, useRef, useEffect } from 'react';
export function SearchSelect({
  label,
  options,
  value,
  change
}: {
  label: string;
  options: string[];
  value: string;
  change: (s: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [term, search] = useState('');
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  function select(s: string) {
    change(s);
    setOpen(false);
    search('');
    root.current?.querySelector('button')?.focus();
  }
  const list = [...new Set(options)].filter(o => o.toLowerCase().includes(term.toLowerCase()));
  return <div
    className="search-pick"
    ref={root}
    onKeyDown={e => {
      if (e.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector('button')?.focus();
      }
    }}
  >
    <span>{label}</span>
    <button aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>
      {value || 'All'}
      {" ▾"}
    </button>
    {open && <div className="pick-panel">
      <input
        autoFocus
        aria-label={'Search ' + label}
        type="search"
        value={term}
        onChange={e => search(e.target.value)}
      />
      <div>
        <button onClick={() => select('')}>All</button>
        {list.map(o => <button key={o} onClick={() => select(o)}>{o}</button>)}
        {!list.length && <p>No matches</p>}
      </div>
    </div>}
  </div>;
}

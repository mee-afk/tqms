import { useState } from 'react';
export function CardList({
  cards
}: {
  cards: React.ReactNode[];
}) {
  const [page, setPage] = useState(0),
    pages = Math.max(1, Math.ceil(cards.length / 12)),
    current = Math.min(page, pages - 1);
  return <div className="table-box">
    <div className="card-scroll">
      {cards.slice(current * 12, current * 12 + 12).map((card, i) => <article className="queue-card" key={i}>{card}</article>)}
      {cards.length === 0 && <p>No entries found.</p>}
    </div>
    <footer className="pager">
      <span>
        {cards.length}
        {" entries"}
      </span>
      <div>
        <button disabled={!current} onClick={() => setPage(current - 1)}>Previous</button>
        {" "}
        {current + 1}
        {" / "}
        {pages}
        {" "}
        <button disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
      </div>
    </footer>
  </div>;
}

export function Receipt({
  plate,
  material,
  note,
  weight,
  fee,
  bill,
  checkpoint,
  date,
  time,
  issuer,
  preview = false
}: {
  plate?: string;
  material?: string;
  note?: string;
  weight?: string | number;
  fee?: string | number;
  bill?: string;
  checkpoint?: string;
  date?: string;
  time?: string;
  issuer?: {
    association: string;
    pan: string;
    phone: string;
  };
  preview?: boolean;
}) {
  const rows = [
    ['रसिद नं', bill || '—'],
    ['मिति', date || '—'],
    ['समय', time || '—'],
    ['तौलस्थान', checkpoint || 'थानकोट'],
    ['सवारी नं', plate || '—'],
    ['सामान', material || '—'],
    ['विवरण', note || '—'],
    ['तौल', (weight || 0) + ' kg']
  ];
  return <section className="bill">
    <small>{preview ? 'प्रविष्टि पूर्वावलोकन' : 'सवारी साधन तौल रसिद'}</small>
    <h2>नेपाल ट्रक यातायात व्यवसायी महासंघ</h2>
    <p>{issuer?.association || 'बागमती यातायात संघ'}</p>
    <div className="bill-meta">
      {"पान नं: "}
      {issuer?.pan || '—'}
      {" "}
      <span>
        {"फोन नं: "}
        {issuer?.phone || '—'}
      </span>
    </div>
    <dl>{rows.map(([k, v]) => <div key={k}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>)}</dl>
    <table>
      <thead>
        <tr>
          <th>विवरण</th>
          <th>रकम (रु.)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>काटा शुल्क</td>
          <td>{Number(fee || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <th>जम्मा शुल्क</th>
          <th>{Number(fee || 0).toFixed(2)}</th>
        </tr>
      </tbody>
    </table>
  </section>;
}

/** 「・」で始まる箇条書き（リリースノートなど） */
export function Notes({ items }: { items: string[] }) {
  return (
    <ul className="notes">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

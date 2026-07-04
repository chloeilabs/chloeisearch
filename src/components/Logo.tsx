const LETTERS: [string, string][] = [
  ['S', '#4285f4'],
  ['e', '#ea4335'],
  ['a', '#fbbc05'],
  ['r', '#4285f4'],
  ['c', '#34a853'],
  ['h', '#ea4335'],
];

export default function Logo({ size }: { size: 'lg' | 'sm' }) {
  return (
    <span
      className={
        size === 'lg'
          ? 'select-none text-[76px] font-medium tracking-tight'
          : 'select-none text-[26px] font-medium tracking-tight'
      }
    >
      {LETTERS.map(([letter, color], i) => (
        <span key={i} style={{ color }}>
          {letter}
        </span>
      ))}
    </span>
  );
}

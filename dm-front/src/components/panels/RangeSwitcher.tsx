export type LocalRange = '10m' | '1h' | '6h' | '24h';

const OPTIONS: LocalRange[] = ['10m', '1h', '6h', '24h'];

interface RangeSwitcherProps {
  value: LocalRange;
  onChange: (r: LocalRange) => void;
}

export default function RangeSwitcher({ value, onChange }: RangeSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {OPTIONS.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
            value === opt
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

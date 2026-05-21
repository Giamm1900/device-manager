import { useState } from 'react';

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[8px]">▼</span>
    </div>
  );
}

export default function Header() {
  const [isLive, setIsLive] = useState(false);

  return (
    <header className="bg-slate-900 text-slate-100 flex items-center gap-3 px-4 border-b border-slate-800 shrink-0">

      <span className="text-[15px] font-bold tracking-wide whitespace-nowrap">
        Device<span className="text-blue-500">Manager</span>
      </span>

      <div className="w-px h-7 bg-slate-700 mx-1 shrink-0" />

      <div className="flex-1" />

      {/* Time range + LIVE */}
      <div className="flex items-center gap-2 shrink-0">
        <SelectWrap>
          <select
            title="Intervallo temporale"
            defaultValue="24h"
            className="bg-slate-800 text-slate-100 border border-slate-600 rounded px-2 pr-6 py-1 text-xs appearance-none cursor-pointer"
          >
            <option value="10m">Ultimi 10 min</option>
            <option value="1h">Ultima 1h</option>
            <option value="6h">Ultime 6h</option>
            <option value="24h">Ultime 24h</option>
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="custom">Range custom…</option>
          </select>
        </SelectWrap>

        <button
          type="button"
          onClick={() => setIsLive(v => !v)}
          title="Abilita aggiornamento automatico ogni 30s"
          className={`flex items-center gap-1.5 border rounded px-2.5 py-1 text-xs transition-colors bg-slate-800 ${
            isLive ? 'border-green-600 text-green-400' : 'border-slate-600 text-slate-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-green-500 animate-live' : 'bg-slate-500'}`} />
          LIVE
        </button>
      </div>
    </header>
  );
}

import { useState } from 'react';

type Page = 'dashboard' | 'allarmi' | 'profilo' | 'impostazioni';

const NAV: { id: Page; label: string }[] = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'allarmi',      label: 'Allarmi' },
  { id: 'profilo',      label: 'Profilo' },
  { id: 'impostazioni', label: 'Impostazioni' },
];

function NavIcon({ page }: { page: Page }) {
  if (page === 'dashboard') return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M2 4a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm0 9a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3zm9-9a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V4zm0 9a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z" />
    </svg>
  );
  if (page === 'allarmi') return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
    </svg>
  );
  if (page === 'profilo') return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

const STORAGE_KEY = 'dm-sidebar-collapsed';

export default function Sidebar() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );

  function toggleCollapse() {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? 'w-12' : 'w-52'
      }`}
    >
      {/* Logo / branding */}
      <div className="px-3 h-12 flex items-center border-b border-slate-100 shrink-0 overflow-hidden">
        {collapsed ? (
          <span className="text-[13px] font-bold text-blue-600 leading-none mx-auto">DM</span>
        ) : (
          <span className="text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
            Device<span className="text-blue-600">Manager</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2">
        {NAV.map(({ id, label }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActivePage(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[12px] font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <NavIcon page={id} />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-100 py-2 px-2 shrink-0">
        <button
          type="button"
          onClick={toggleCollapse}
          title={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {!collapsed && <span>Comprimi</span>}
        </button>
      </div>
    </aside>
  );
}

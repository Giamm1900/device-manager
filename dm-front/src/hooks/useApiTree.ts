import { useState, useEffect } from 'react';
import type { Client } from '../data/mockTree';

interface ApiCustomer { id: number; name: string; }
interface ApiPlant    { id: number; name: string; city: string; }
interface ApiMachine  { id: number; name: string; }

export function useApiTree(): { tree: Client[]; loading: boolean } {
  const [tree, setTree]       = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/v1/customers')
      .then(r => r.json() as Promise<ApiCustomer[]>)
      .then(async customers => {
        const clientList: Client[] = await Promise.all(
          customers.map(async c => {
            const plants = await fetch(`/api/v1/customers/${c.id}/plants`)
              .then(r => r.json() as Promise<ApiPlant[]>);

            const plantsWithMachines = await Promise.all(
              plants.map(async p => {
                const machines = await fetch(`/api/v1/plants/${p.id}/machines`)
                  .then(r => r.json() as Promise<ApiMachine[]>);
                return {
                  id: String(p.id),
                  name: p.name,
                  machines: machines.map(m => ({
                    id:     String(m.id),
                    dbId:   m.id,
                    name:   m.name,
                    status: 'unknown' as const,
                  })),
                };
              }),
            );

            return { id: String(c.id), name: c.name, plants: plantsWithMachines };
          }),
        );

        if (!cancelled) { setTree(clientList); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { tree, loading };
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../lib/api';
import { getToken, setToken } from '../../lib/auth-store';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  status: string;
  created_at: string;
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    apiRequest<Lead[]>('/admin/leads')
      .then(setLeads)
      .catch((err: Error) => {
          if (handleUnauthorizedError(err, router)) {
          return;
        }
        setError('Unable to load leads');
      });
  }, [router]);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <button className="text-sm underline" onClick={() => { setToken(null); router.push('/login'); }}>
          Logout
        </button>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t">
                <td className="p-3">{lead.name}</td>
                <td className="p-3">{lead.email ?? lead.phone ?? '-'}</td>
                <td className="p-3">{lead.score}</td>
                <td className="p-3">{lead.status}</td>
                <td className="p-3">
                  <Link className="underline" href={`/leads/${lead.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../../lib/api';
import { getToken } from '../../../lib/auth-store';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  status: string;
  created_at: string;
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [status, setStatus] = useState('new');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    apiRequest<Lead>(`/admin/leads/${params.id}`)
      .then((data) => {
        setLead(data);
        setStatus(data.status);
      })
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) {
          return;
        }
        setError('Unable to load lead detail');
      });
  }, [params.id, router]);

  async function updateStatus() {
    try {
      const updated = await apiRequest<Lead>(`/admin/leads/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setLead(updated);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) {
        return;
      }
      setError('Unable to update status');
    }
  }

  if (!lead) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <button className="underline" onClick={() => router.push('/leads')}>Back to leads</button>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-3">
        <h1 className="text-2xl font-semibold">{lead.name}</h1>
        <p>Email: {lead.email ?? '-'}</p>
        <p>Phone: {lead.phone ?? '-'}</p>
        <p>Score: {lead.score}</p>
        <p>Created: {new Date(lead.created_at).toLocaleString()}</p>
        <div className="flex items-center gap-2 pt-2">
          <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="qualified">qualified</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
          <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={updateStatus}>Update Status</button>
        </div>
      </div>
    </main>
  );
}

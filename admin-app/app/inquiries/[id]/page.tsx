'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../../lib/api';
import { getToken } from '../../../lib/auth-store';

type Inquiry = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  score: number | null;
  status: string;
  advisor_user_id?: string | null;
  duplicate_of_inquiry_id?: string | null;
  persona?: string | null;
  budget_band?: string | null;
  timeline?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type Assignment = {
  id: string;
  assigned_user_id: string | null;
  assigned_by_user_id: string | null;
  reason: string | null;
  created_at: string;
};

const STATUSES = ['new', 'contacted', 'qualified', 'closed', 'lost'] as const;

export default function InquiryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [status, setStatus] = useState<string>('new');
  const [assignee, setAssignee] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const canAssign = useMemo(() => assignee.trim().length === 0 || assignee.trim().length >= 8, [assignee]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    apiRequest<Inquiry>(`/admin/inquiries/${params.id}`)
      .then((data) => {
        setInquiry(data);
        setStatus(data.status);
      })
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load inquiry');
      });

    apiRequest<Assignment[]>(`/admin/inquiries/${params.id}/assignments`)
      .then(setAssignments)
      .catch(() => {
        // non-blocking
      });
  }, [params.id, router]);

  async function updateStatus() {
    try {
      const updated = await apiRequest<Inquiry>(`/admin/inquiries/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setInquiry(updated);
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to update status');
    }
  }

  async function assign() {
    if (!canAssign) return;

    try {
      const updated = await apiRequest<Inquiry>(`/admin/inquiries/${params.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigned_user_id: assignee.trim() || null, reason: 'manual' }),
      });
      setInquiry(updated);
      const rows = await apiRequest<Assignment[]>(`/admin/inquiries/${params.id}/assignments`);
      setAssignments(rows);
      setAssignee('');
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to assign inquiry');
    }
  }

  if (!inquiry) return <main className="p-6">Loading...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <button className="underline" onClick={() => router.push('/inquiries')}>
        Back to inquiries
      </button>

      {error ? <p className="text-red-600">{error}</p> : null}

      <div className="bg-white rounded-lg p-6 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{inquiry.name}</h1>
            <p className="text-sm text-slate-600">{inquiry.id}</p>
          </div>
          <div className="text-right text-sm">
            <div>Score: <span className="font-semibold">{inquiry.score ?? 0}</span></div>
            <div>Status: <span className="font-semibold">{inquiry.status}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p>Email: {inquiry.email ?? '-'}</p>
          <p>Phone: {inquiry.phone ?? '-'}</p>
          <p>Persona: {inquiry.persona ?? '-'}</p>
          <p>Budget: {inquiry.budget_band ?? '-'}</p>
          <p>Timeline: {inquiry.timeline ?? '-'}</p>
          <p>Assigned: {inquiry.advisor_user_id ?? '-'}</p>
          <p>Duplicate of: {inquiry.duplicate_of_inquiry_id ?? '-'}</p>
        </div>

        <div className="pt-2">
          <h3 className="font-semibold">Message</h3>
          <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <select
            className="border rounded px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={updateStatus}>
            Update Status
          </button>
        </div>

        <div className="pt-2 border-t">
          <h3 className="font-semibold">Manual assignment</h3>
          <p className="text-sm text-slate-600">Paste advisor user_id (UUID) or leave blank to unassign.</p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <input
              className="border rounded px-3 py-2 w-full sm:w-[420px]"
              placeholder="advisor user_id (uuid)"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
            <button
              className="bg-slate-900 text-white rounded px-3 py-2"
              onClick={assign}
              disabled={!canAssign}
            >
              Assign
            </button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <h3 className="font-semibold">Assignment history</h3>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-600">No assignments yet.</p>
          ) : (
            <div className="text-sm space-y-1">
              {assignments.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <div>
                    <span className="font-mono">{a.assigned_user_id ?? 'unassigned'}</span>
                    {a.reason ? <span className="text-slate-600"> • {a.reason}</span> : null}
                  </div>
                  <div className="text-slate-600">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../../lib/api';
import { getToken } from '../../../lib/auth-store';
import { AdminLayout } from '../../../components/layout/AdminLayout';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  status: string;
  source_page?: string | null;
  purpose?: string | null;
  owner_user_id?: string | null;
  follow_up_due_at?: string | null;
  created_at: string;
};

type TimelineEvent = {
  id: string;
  action: string;
  note_id?: string | null;
  note?: string | null;
  created_at: string;
};

const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [status, setStatus] = useState('new');
  const [owner, setOwner] = useState('');
  const [note, setNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    setLoading(true);
    Promise.all([
      apiRequest<Lead>(`/admin/leads/${id}`),
      apiRequest<{ data: TimelineEvent[] }>(`/admin/leads/${id}/timeline?limit=50`),
    ])
      .then(([detail, timelineRes]) => {
        setLead(detail);
        setStatus(detail.status);
        setTimeline(timelineRes.data);
      })
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load lead / โหลดข้อมูลลีดไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function refreshTimeline() {
    const timelineRes = await apiRequest<{ data: TimelineEvent[] }>(`/admin/leads/${id}/timeline?limit=50`);
    setTimeline(timelineRes.data);
  }

  async function updateStatus() {
    try {
      const updated = await apiRequest<Lead>(`/admin/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setLead(updated);
      await refreshTimeline();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to update status / อัปเดตสถานะไม่สำเร็จ');
    }
  }

  async function assignOwner() {
    try {
      const updated = await apiRequest<Lead>(`/admin/leads/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ owner_user_id: owner.trim() || null, reason: 'manual' }),
      });
      setLead(updated);
      setOwner('');
      await refreshTimeline();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to assign owner / มอบหมาย owner ไม่สำเร็จ');
    }
  }

  async function saveNote() {
    const payload = { note: note.trim() };
    if (!payload.note) return;
    try {
      if (editingNoteId) {
        await apiRequest(`/admin/leads/${id}/notes/${editingNoteId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(`/admin/leads/${id}/notes`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setEditingNoteId(null);
      setNote('');
      await refreshTimeline();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to save note / บันทึกโน้ตไม่สำเร็จ');
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <main id="main-content" className="p-6">Loading lead…</main>
      </AdminLayout>
    );
  }

  if (!lead) {
    return (
      <AdminLayout>
        <main id="main-content" className="p-6">Lead not found</main>
      </AdminLayout>
    );
  }

  const whatsappHref = lead.phone ? `https://wa.me/${lead.phone.replace(/[^\d]/g, '')}` : null;
  const phoneHref = lead.phone ? `tel:${lead.phone}` : null;
  const emailHref = lead.email ? `mailto:${lead.email}` : null;

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-4xl mx-auto p-6 space-y-4">
        <button className="underline" onClick={() => router.push('/leads')}>Back to leads</button>
        {error ? <p className="text-red-600" role="alert">{error}</p> : null}

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{lead.name}</h1>
              <p className="text-sm text-slate-600">{lead.id}</p>
            </div>
            <div className="text-right text-sm">
              <div>Score: <span className="font-semibold">{lead.score}</span></div>
              <div>Status: <span className="font-semibold">{lead.status}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p>Email: {lead.email ?? '-'}</p>
            <p>Phone: {lead.phone ?? '-'}</p>
            <p>Purpose: {lead.purpose ?? 'TODO: backfill legacy purpose'}</p>
            <p>Source: {lead.source_page ?? 'TODO: backfill legacy source'}</p>
            <p>Owner: {lead.owner_user_id ?? '-'}</p>
            <p>Follow-up due: {lead.follow_up_due_at ? new Date(lead.follow_up_due_at).toLocaleString() : '-'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {whatsappHref ? <a className="underline" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a> : null}
            {phoneHref ? <a className="underline" href={phoneHref}>Call</a> : null}
            {emailHref ? <a className="underline" href={emailHref}>Email</a> : null}
          </div>

          <div className="pt-2 border-t flex flex-wrap items-center gap-2">
            <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={updateStatus}>Update Status</button>
          </div>

          <div className="pt-2 border-t">
            <h2 className="font-semibold">Assignment</h2>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input className="border rounded px-3 py-2 w-full sm:w-[420px]" placeholder="owner user_id (uuid)" value={owner} onChange={(e) => setOwner(e.target.value)} />
              <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={assignOwner}>Assign</button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h2 className="font-semibold">Note</h2>
            <textarea className="border rounded px-3 py-2 w-full min-h-[100px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note" />
            <div className="flex items-center gap-2 pt-2">
              <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={saveNote}>{editingNoteId ? 'Update Note' : 'Add Note'}</button>
              {editingNoteId ? <button className="border rounded px-3 py-2" onClick={() => { setEditingNoteId(null); setNote(''); }}>Cancel</button> : null}
            </div>
          </div>

          <div className="pt-2 border-t">
            <h2 className="font-semibold">Timeline</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-600">No events yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {timeline.map((event) => (
                  <div key={event.id} className="border rounded p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{event.action}</div>
                      <div className="text-slate-600">{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                    {event.note ? <p className="pt-1 whitespace-pre-wrap">{event.note}</p> : null}
                    {event.note_id ? (
                      <button className="underline text-xs pt-1" onClick={() => { setEditingNoteId(event.note_id ?? null); setNote(event.note ?? ''); }}>
                        Edit note
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

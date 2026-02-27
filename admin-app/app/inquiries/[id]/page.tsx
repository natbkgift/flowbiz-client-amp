'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../../lib/api';
import { getToken } from '../../../lib/auth-store';
import { AdminLayout } from '../../../components/layout/AdminLayout';

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
  source_page?: string | null;
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

type TimelineEvent = {
  id: string;
  action: string;
  note_id?: string | null;
  note?: string | null;
  created_at: string;
  actor_user_id?: string | null;
};

const STATUSES = ['new', 'contacted', 'qualified', 'closed', 'lost'] as const;

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [status, setStatus] = useState<string>('new');
  const [assignee, setAssignee] = useState<string>('');
  const [note, setNote] = useState<string>('');
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
      apiRequest<Inquiry>(`/admin/inquiries/${id}`),
      apiRequest<{ data: Assignment[] }>(`/admin/inquiries/${id}/assignments?limit=20`),
      apiRequest<{ data: TimelineEvent[] }>(`/admin/inquiries/${id}/timeline?limit=50`),
    ])
      .then(([detail, assignmentRes, timelineRes]) => {
        setInquiry(detail);
        setStatus(detail.status);
        setAssignments(assignmentRes.data);
        setTimeline(timelineRes.data);
      })
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load inquiry / โหลดข้อมูลไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function refreshTimeline() {
    const timelineRes = await apiRequest<{ data: TimelineEvent[] }>(`/admin/inquiries/${id}/timeline?limit=50`);
    setTimeline(timelineRes.data);
  }

  async function updateStatus() {
    try {
      const updated = await apiRequest<Inquiry>(`/admin/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setInquiry(updated);
      await refreshTimeline();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to update status / อัปเดตสถานะไม่สำเร็จ');
    }
  }

  async function assign() {
    try {
      const updated = await apiRequest<Inquiry>(`/admin/inquiries/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigned_user_id: assignee.trim() || null, reason: 'manual' }),
      });
      setInquiry(updated);
      setAssignee('');
      const rows = await apiRequest<{ data: Assignment[] }>(`/admin/inquiries/${id}/assignments?limit=20`);
      setAssignments(rows.data);
      await refreshTimeline();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to assign inquiry / มอบหมายไม่สำเร็จ');
    }
  }

  async function saveNote() {
    const payload = { note: note.trim() };
    if (!payload.note) return;

    try {
      if (editingNoteId) {
        await apiRequest(`/admin/inquiries/${id}/notes/${editingNoteId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(`/admin/inquiries/${id}/notes`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setNote('');
      setEditingNoteId(null);
      await refreshTimeline();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to save note / บันทึกโน้ตไม่สำเร็จ');
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <main id="main-content" className="p-6">Loading inquiry…</main>
      </AdminLayout>
    );
  }

  if (!inquiry) {
    return (
      <AdminLayout>
        <main id="main-content" className="p-6">Inquiry not found</main>
      </AdminLayout>
    );
  }

  const whatsappHref = inquiry.phone ? `https://wa.me/${inquiry.phone.replace(/[^\d]/g, '')}` : null;
  const phoneHref = inquiry.phone ? `tel:${inquiry.phone}` : null;
  const emailHref = inquiry.email ? `mailto:${inquiry.email}` : null;

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-4xl mx-auto p-6 space-y-4">
        <button className="underline" onClick={() => router.push('/inquiries')}>
          Back to inquiries
        </button>

        {error ? <p className="text-red-600" role="alert">{error}</p> : null}

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
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
            <p>Source: {inquiry.source_page ?? '-'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {whatsappHref ? <a className="underline" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a> : null}
            {phoneHref ? <a className="underline" href={phoneHref}>Call</a> : null}
            {emailHref ? <a className="underline" href={emailHref}>Email</a> : null}
          </div>

          <div>
            <h2 className="font-semibold">Message</h2>
            <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <select
              aria-label="Inquiry status"
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
            <h2 className="font-semibold">Assignment</h2>
            <p className="text-sm text-slate-600">Paste advisor user_id (UUID) or leave blank to unassign.</p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                className="border rounded px-3 py-2 w-full sm:w-[420px]"
                placeholder="advisor user_id (uuid)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
              <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={assign}>Assign</button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h2 className="font-semibold">Note</h2>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[100px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note"
            />
            <div className="flex items-center gap-2 pt-2">
              <button className="bg-slate-900 text-white rounded px-3 py-2" onClick={saveNote}>
                {editingNoteId ? 'Update Note' : 'Add Note'}
              </button>
              {editingNoteId ? (
                <button
                  className="border rounded px-3 py-2"
                  onClick={() => {
                    setEditingNoteId(null);
                    setNote('');
                  }}
                >
                  Cancel
                </button>
              ) : null}
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">{event.action}</div>
                      <div className="text-slate-600">{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                    {event.note ? <p className="pt-1 whitespace-pre-wrap">{event.note}</p> : null}
                    {event.note_id ? (
                      <button
                        className="underline text-xs pt-1"
                        onClick={() => {
                          setEditingNoteId(event.note_id ?? null);
                          setNote(event.note ?? '');
                        }}
                      >
                        Edit note
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <h2 className="font-semibold">Assignment history</h2>
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
    </AdminLayout>
  );
}

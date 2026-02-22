'use client';

import DOMPurify from 'dompurify';
import { use, useEffect, useMemo, useState } from 'react';

import { API_BASE } from '../../_shared/api';
import type { CompanyInfoItem } from '../../_shared/types';

export default function PublicCompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<CompanyInfoItem | null>(null);

  const safeContentHtml = useMemo(() => {
    return info ? DOMPurify.sanitize(info.content) : '';
  }, [info]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setInfo(null);

    fetch(`${API_BASE}/v1/company/${slug}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          return null;
        }
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return (await res.json()) as CompanyInfoItem;
      })
      .then((data) => {
        setInfo(data);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('Unable to load company info');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return <main className="max-w-4xl mx-auto p-6">Loading...</main>;
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!info) {
    return <main className="max-w-4xl mx-auto p-6">Not found</main>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{info.title}</h1>
        <p className="text-slate-600">/{info.slug}</p>
      </header>

      <section className="bg-white rounded-lg shadow-sm p-6">
        <div dangerouslySetInnerHTML={{ __html: safeContentHtml }} />
      </section>

      <section className="bg-slate-900 text-white rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Want to talk to us?</h2>
          <p className="text-slate-200 text-sm">Contact our team for property advice and opportunities.</p>
        </div>
        <div className="bg-white text-slate-900 rounded px-5 py-2 font-medium">Get in touch</div>
      </section>
    </main>
  );
}

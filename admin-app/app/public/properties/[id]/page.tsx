'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { API_BASE } from '../../_shared/api';
import type { PropertyDetail } from '../../_shared/types';

export default function PublicPropertyDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const contactRef = useRef<HTMLElement | null>(null);

  const images = useMemo(() => property?.images ?? [], [property]);
  const activeImage = images[activeImageIndex] ?? null;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setProperty(null);

    fetch(`${API_BASE}/v1/properties/${params.id}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          return null;
        }
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return (await res.json()) as PropertyDetail;
      })
      .then((data) => {
        if (data) {
          setProperty(data);
          setActiveImageIndex(0);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('Unable to load property');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [params.id]);

  function scrollToContact() {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

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

  if (!property) {
    return <main className="max-w-4xl mx-auto p-6">Property not found</main>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{property.title}</h1>
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 shrink-0">
            {property.type}
          </span>
        </div>
        <p className="text-2xl font-bold">{Number(property.price).toLocaleString()} THB</p>
        <p className="text-slate-600">
          {property.address}, {property.city}
        </p>
      </header>

      <section className="space-y-3">
        {activeImage ? (
          <img src={activeImage} alt={property.title} className="w-full h-80 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-80 bg-slate-200 rounded-lg" />
        )}

        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((url, idx) => (
              <button
                key={url}
                className={`border rounded ${idx === activeImageIndex ? 'border-slate-900' : 'border-transparent'}`}
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={url} alt="" className="h-16 w-24 object-cover rounded" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500">Bedrooms</p>
          <p className="text-lg font-semibold">{property.bedrooms ?? '-'}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500">Bathrooms</p>
          <p className="text-lg font-semibold">{property.bathrooms ?? '-'}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500">Size</p>
          <p className="text-lg font-semibold">{property.size != null ? `${property.size} sqm` : '-'}</p>
        </div>
      </section>

      {property.description ? (
        <section className="bg-white rounded-lg shadow-sm p-6 space-y-2">
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="text-slate-700 whitespace-pre-line">{property.description}</p>
        </section>
      ) : null}

      <section className="bg-slate-900 text-white rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Interested in this property?</h2>
          <p className="text-slate-200 text-sm">Scroll to the contact section to get in touch.</p>
        </div>
        <button className="bg-white text-slate-900 rounded px-5 py-2 font-medium" onClick={scrollToContact}>
          Contact
        </button>
      </section>

      <section ref={contactRef} id="contact" className="bg-white rounded-lg shadow-sm p-6 space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-slate-700">Please contact our team for availability and details.</p>
      </section>
    </main>
  );
}

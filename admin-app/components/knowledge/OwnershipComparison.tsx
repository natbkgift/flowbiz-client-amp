import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export function OwnershipComparison({ locale }: { locale: string }) {
  const dict = getDictionary(normalizeLocale(locale));
  const k = dict.knowledge.ownershipComparison;

  return (
    <section className="section section--alt">
      <Container>
        <div className="section-header">
          <h2 className="section-title">{k.title}</h2>
          <p className="section-subtitle">{k.subtitle}</p>
        </div>
        <div className="grid grid-3">
          {k.options.map((opt) => (
            <div key={opt.type} className="card">
              <h3 className="card-title">{opt.type}</h3>
              <p className="card-subtitle">{opt.description}</p>
              <div className="card-details">
                <strong>Pros</strong>
                <ul className="bullet-list bullet-list--compact">
                  {opt.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <strong>Cons</strong>
                <ul className="bullet-list bullet-list--compact">
                  {opt.cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p className="text-caption">{k.disclaimer}</p>
      </Container>
    </section>
  );
}

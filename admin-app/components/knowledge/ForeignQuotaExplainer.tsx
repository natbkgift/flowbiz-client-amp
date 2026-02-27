import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export function ForeignQuotaExplainer({ locale }: { locale: string }) {
  const dict = getDictionary(normalizeLocale(locale));
  const k = dict.knowledge.foreignQuota;

  return (
    <section className="section section--alt">
      <Container>
        <div className="section-header">
          <h2 className="section-title">{k.title}</h2>
          <p className="section-subtitle">{k.subtitle}</p>
        </div>
        <ul className="bullet-list">
          {k.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="text-caption">{k.disclaimer}</p>
      </Container>
    </section>
  );
}

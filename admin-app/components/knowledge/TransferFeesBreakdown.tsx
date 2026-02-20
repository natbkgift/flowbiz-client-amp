import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export function TransferFeesBreakdown({ locale }: { locale: string }) {
  const dict = getDictionary(normalizeLocale(locale));
  const k = dict.knowledge.transferFees;

  return (
    <section className="section">
      <Container>
        <div className="section-header">
          <h2 className="section-title">{k.title}</h2>
          <p className="section-subtitle">{k.subtitle}</p>
        </div>
        <div className="info-table-wrap">
          <table className="info-table" aria-label={k.title}>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Rate</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {k.rows.map((row) => (
                <tr key={row.item}>
                  <td>{row.item}</td>
                  <td>{row.rate}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-caption">{k.disclaimer}</p>
      </Container>
    </section>
  );
}

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export function TransferFeesBreakdown({ locale }: { locale: string }) {
  const resolvedLocale = normalizeLocale(locale);
  const dict = getDictionary(resolvedLocale);
  const k = dict.knowledge.transferFees;
  const columnLabels = resolvedLocale === 'th'
    ? { item: 'รายการ', rate: 'อัตรา', note: 'หมายเหตุ' }
    : { item: 'Item', rate: 'Rate', note: 'Note' };

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
                <th scope="col">{columnLabels.item}</th>
                <th scope="col">{columnLabels.rate}</th>
                <th scope="col">{columnLabels.note}</th>
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

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TransferFeesBreakdown } from '@/components/knowledge/TransferFeesBreakdown';

describe('TransferFeesBreakdown i18n headers', () => {
  it('renders Thai table headers on the Thai surface', () => {
    render(<TransferFeesBreakdown locale="th" />);

    expect(screen.getByRole('columnheader', { name: 'รายการ' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'อัตรา' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'หมายเหตุ' })).toBeInTheDocument();
  });

  it('keeps English headers on the English surface', () => {
    render(<TransferFeesBreakdown locale="en" />);

    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Rate' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Note' })).toBeInTheDocument();
  });
});

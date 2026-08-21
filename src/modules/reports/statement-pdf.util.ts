import PDFDocument from 'pdfkit';

const BRAND = '#4f46e5';
const MUTED = '#6b7280';
const INCOME_COLOR = '#059669';
const BORDER = '#e5e7eb';

// pdfkit's built-in Helvetica only supports WinAnsi encoding, which has no glyph
// for the narrow no-break space (U+202F) or non-break space (U+00A0) that
// Intl's fr-FR grouping uses — they render as garbage (e.g. a stray "/"). Swap
// them for a plain space, which WinAnsi does support.
const sanitizeForPdf = (text: string) => text.replace(/[  ]/g, ' ');

const formatAmount = (amount: number, currency: string) => {
  try {
    return sanitizeForPdf(new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount));
  } catch {
    return `${sanitizeForPdf(amount.toLocaleString('fr-FR'))} ${currency}`;
  }
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);

interface StatementTransaction {
  date: Date;
  description?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  currency: string;
  categoryId?: { name: string } | null;
  accountId?: { name: string } | null;
}

interface StatementPdfParams {
  user: { firstName?: string; lastName?: string; email: string };
  startDate?: Date;
  endDate?: Date;
  transactions: StatementTransaction[];
  defaultCurrency: string;
}

const COL = { date: 40, desc: 110, category: 290, account: 400, amount: 470 };
// A4 height is ~842pt; with a 40pt bottom margin the printable area ends around
// y=802. Rows must stop well before that, and the footer must sit inside it too,
// or pdfkit silently starts a spurious extra page just to fit the footer text.
const PAGE_BOTTOM = 740;
const FOOTER_Y = 785;

export function generateStatementPdf({ user, startDate, endDate, transactions, defaultCurrency }: StatementPdfParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fillColor(BRAND).fontSize(20).font('Helvetica-Bold').text('Tacynt Money', 40, 40);
    doc.fillColor(MUTED).fontSize(10).font('Helvetica').text('Relevé de transactions', 40, 64);

    const periodLabel =
      startDate && endDate
        ? `${formatDate(startDate)} — ${formatDate(endDate)}`
        : 'Toutes les transactions';
    doc.fontSize(9).text(`Période : ${periodLabel}`, 40, 82);
    doc.text(`Généré le ${formatDate(new Date())}`, 40, 96);

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    doc.fontSize(9).text(fullName, 400, 40, { width: 155, align: 'right' });
    doc.text(user.email, 400, 54, { width: 155, align: 'right' });

    doc.moveTo(40, 118).lineTo(555, 118).strokeColor(BORDER).stroke();

    // Summary
    const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
    const net = totalIncome - totalExpense;

    const summaryY = 136;
    const summaryCol = (x: number, label: string, value: string, color: string) => {
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(label.toUpperCase(), x, summaryY);
      doc.fillColor(color).fontSize(14).font('Helvetica-Bold').text(value, x, summaryY + 12);
    };
    summaryCol(40, 'Revenus', formatAmount(totalIncome, defaultCurrency), INCOME_COLOR);
    summaryCol(230, 'Dépenses', formatAmount(totalExpense, defaultCurrency), '#dc2626');
    summaryCol(420, 'Solde net', formatAmount(net, defaultCurrency), net >= 0 ? INCOME_COLOR : '#dc2626');

    let y = summaryY + 50;
    doc.moveTo(40, y).lineTo(555, y).strokeColor(BORDER).stroke();
    y += 14;

    const drawTableHeader = () => {
      doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold');
      doc.text('DATE', COL.date, y);
      doc.text('DESCRIPTION', COL.desc, y);
      doc.text('CATÉGORIE', COL.category, y);
      doc.text('COMPTE', COL.account, y);
      doc.text('MONTANT', COL.amount, y, { width: 85, align: 'right' });
      y += 14;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(BORDER).stroke();
      y += 8;
    };

    drawTableHeader();

    doc.font('Helvetica').fontSize(9);
    const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

    if (sorted.length === 0) {
      doc.fillColor(MUTED).text('Aucune transaction sur cette période.', 40, y);
    }

    for (const tx of sorted) {
      if (y > PAGE_BOTTOM) {
        doc.addPage();
        y = 40;
        drawTableHeader();
        doc.font('Helvetica').fontSize(9);
      }

      const isIncome = tx.type === 'INCOME';
      const sign = isIncome ? '+' : tx.type === 'EXPENSE' ? '-' : '';
      const amountText = `${sign}${formatAmount(tx.amount, tx.currency)}`;

      doc.fillColor('#111827');
      doc.text(formatDate(tx.date), COL.date, y, { width: 65 });
      doc.text(tx.description || '—', COL.desc, y, { width: 175 });
      doc.fillColor(MUTED).text(tx.categoryId?.name || '—', COL.category, y, { width: 105 });
      doc.text(tx.accountId?.name || '—', COL.account, y, { width: 65 });
      doc.fillColor(isIncome ? INCOME_COLOR : '#111827').text(amountText, COL.amount, y, { width: 85, align: 'right' });

      y += 18;
    }

    // Footer with page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .text(`Tacynt Money — Page ${i + 1} sur ${range.count}`, 40, FOOTER_Y, { width: 515, align: 'center', lineBreak: false });
    }

    doc.end();
  });
}

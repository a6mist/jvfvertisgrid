export type InvoiceStatus = 'pending' | 'paid' | 'expired';

export interface Invoice {
  id: string;
  amount: number; // USDT amount
  tokenAmount: number; // Token amount
  status: InvoiceStatus;
  createdDate: string;
  expiryDate: string;
  recipientWallet?: string;
  notes?: string;
  transactionHash?: string;
  payer?: string;
  paidAt?: string;
  usdtSpent?: number;
}

const STORAGE_KEY = 'wearelegend_invoices';
const LEGACY_SAMPLE_PREFIX = 'INV-SAMPLE-';
const LEGACY_SAMPLE_IDS = new Set(['SAMPLE-INVOICE']);

function stripLegacySampleInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter(
    (invoice) =>
      !invoice.id.startsWith(LEGACY_SAMPLE_PREFIX) &&
      !LEGACY_SAMPLE_IDS.has(invoice.id),
  );
}

export function getInvoices(): Invoice[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as Invoice[];
    const sanitized = stripLegacySampleInvoices(parsed);

    if (sanitized.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch {
    return [];
  }
}

export function getInvoiceById(id: string): Invoice | null {
  const invoices = getInvoices();
  return invoices.find(inv => inv.id === id) || null;
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getInvoices();
  const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
  
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `INV-${timestamp}${random}`.toUpperCase();
}

export function checkExpiredInvoices(): void {
  const invoices = getInvoices();
  const now = new Date();
  
  invoices.forEach(invoice => {
    if (invoice.status === 'pending' && new Date(invoice.expiryDate) < now) {
      invoice.status = 'expired';
      saveInvoice(invoice);
    }
  });
}
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
}

const STORAGE_KEY = 'wearelegend_invoices';

export function getInvoices(): Invoice[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
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

export function initializeSampleInvoices(): void {
  const existing = getInvoices();
  if (existing.length > 0) return; // Don't add samples if invoices already exist

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const samples: Invoice[] = [
    {
      id: 'INV-SAMPLE-001',
      amount: 1000,
      tokenAmount: 100000,
      status: 'pending',
      createdDate: now.toISOString(),
      expiryDate: tomorrow.toISOString(),
      notes: 'Sample pending invoice',
    },
    {
      id: 'INV-SAMPLE-002',
      amount: 5000,
      tokenAmount: 500000,
      status: 'paid',
      createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: nextWeek.toISOString(),
      notes: 'IDO participation payment',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    {
      id: 'INV-SAMPLE-003',
      amount: 2500,
      tokenAmount: 250000,
      status: 'expired',
      createdDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: yesterday.toISOString(),
      notes: 'Private sale allocation',
    },
    {
      id: 'SAMPLE-INVOICE',
      amount: 500,
      tokenAmount: 50000,
      status: 'pending',
      createdDate: now.toISOString(),
      expiryDate: nextWeek.toISOString(),
      notes: 'Demo invoice for testing',
    },
  ];

  samples.forEach(saveInvoice);
}
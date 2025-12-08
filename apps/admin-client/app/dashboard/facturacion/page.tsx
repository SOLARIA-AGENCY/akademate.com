'use client';

import { useState } from 'react';

interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  number: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  dueDate: string;
  paidDate: string | null;
  plan: string;
  period: string;
}

interface PaymentMethod {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'card' | 'sepa' | 'bank_transfer';
  last4: string;
  expiryDate: string;
  isDefault: boolean;
  status: 'active' | 'expired' | 'failed';
}

type PricingTier = {
  name: string;
  price: string;
  perks: string[];
  extras: string[];
  activeSubs: number;
  mrr: number;
};

type UsageMeter = {
  metric: string;
  value: number;
  unit: string;
  limit: string;
};

const mockInvoices: Invoice[] = [
  {
    id: '1',
    tenantId: '1',
    tenantName: 'CEP Formación',
    number: 'INV-2025-0012',
    amount: 299,
    status: 'paid',
    dueDate: '2025-12-01',
    paidDate: '2025-11-28',
    plan: 'Professional',
    period: 'Diciembre 2025',
  },
  {
    id: '2',
    tenantId: '3',
    tenantName: 'Instituto Barcelona',
    number: 'INV-2025-0013',
    amount: 599,
    status: 'paid',
    dueDate: '2025-12-01',
    paidDate: '2025-12-01',
    plan: 'Enterprise',
    period: 'Diciembre 2025',
  },
  {
    id: '3',
    tenantId: '4',
    tenantName: 'Centro Formativo Valencia',
    number: 'INV-2025-0014',
    amount: 299,
    status: 'overdue',
    dueDate: '2025-11-15',
    paidDate: null,
    plan: 'Professional',
    period: 'Noviembre 2025',
  },
  {
    id: '4',
    tenantId: '1',
    tenantName: 'CEP Formación',
    number: 'INV-2025-0011',
    amount: 299,
    status: 'paid',
    dueDate: '2025-11-01',
    paidDate: '2025-10-30',
    plan: 'Professional',
    period: 'Noviembre 2025',
  },
  {
    id: '5',
    tenantId: '3',
    tenantName: 'Instituto Barcelona',
    number: 'INV-2025-0010',
    amount: 599,
    status: 'paid',
    dueDate: '2025-11-01',
    paidDate: '2025-11-01',
    plan: 'Enterprise',
    period: 'Noviembre 2025',
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    tenantId: '1',
    tenantName: 'CEP Formación',
    type: 'card',
    last4: '4242',
    expiryDate: '12/26',
    isDefault: true,
    status: 'active',
  },
  {
    id: '2',
    tenantId: '3',
    tenantName: 'Instituto Barcelona',
    type: 'sepa',
    last4: '8901',
    expiryDate: 'N/A',
    isDefault: true,
    status: 'active',
  },
  {
    id: '3',
    tenantId: '4',
    tenantName: 'Centro Formativo Valencia',
    type: 'card',
    last4: '1234',
    expiryDate: '03/25',
    isDefault: true,
    status: 'expired',
  },
];

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter (Gestión + Marketing)',
    price: '€199/mes',
    perks: [
      'Gestión Académica',
      'Marketing',
      'Campus Virtual',
      '5 usuarios',
      '1 sede',
      '10 GB almacenamiento',
      '20 cursos',
      'Analíticas avanzadas',
      'Acceso API',
      'SSO / SAML',
      'Módulos de expansión',
    ],
    extras: [
      'Cursos extra: €5/curso',
      'Usuarios extra: €9/usuario',
      'Sedes extra: €29/sede',
    ],
    activeSubs: 8,
    mrr: 1592,
  },
  {
    name: 'Pro Campus (incluye Campus Virtual)',
    price: '€299/mes',
    perks: [
      'Gestión Académica',
      'Marketing',
      'Campus Virtual',
      '10 usuarios',
      '3 sedes',
      '50 GB almacenamiento',
      '100 cursos',
      'Analíticas avanzadas',
      'Acceso API',
      'SSO / SAML',
      'Módulos de expansión',
    ],
    extras: [
      'Cursos extra: €3/curso',
      'Usuarios extra: €7/usuario',
      'Sedes extra: €39/sede',
    ],
    activeSubs: 12,
    mrr: 3588,
  },
  {
    name: 'Enterprise Full (Gestión + Marketing + Campus)',
    price: '€599/mes',
    perks: [
      'Gestión Académica',
      'Marketing',
      'Campus Virtual',
      '∞ usuarios',
      '∞ sedes',
      '200 GB almacenamiento',
      '∞ cursos',
      'Analíticas avanzadas',
      'Acceso API',
      'SSO / SAML',
      'Módulos de expansión',
    ],
    extras: [
      'Cursos extra: €0/curso',
      'Usuarios extra: €0/usuario',
      'Sedes extra: €0/sede',
    ],
    activeSubs: 5,
    mrr: 2995,
  },
];

const usageMeters: UsageMeter[] = [
  { metric: 'Alumnos activos', value: 13450, unit: 'alumnos', limit: 'depende plan' },
  { metric: 'Cursos activos', value: 480, unit: 'cursos', limit: 'depende plan' },
  { metric: 'Storage', value: 2.3, unit: 'TB', limit: 'depende plan' },
  { metric: 'API calls', value: 152340, unit: 'requests/día', limit: 'por plan' },
];

const stripeStatusMock = {
  account: 'acct_mock_stripe',
  products: 3,
  prices: 9,
  webhooks: 'pendiente',
  usage: 'en diseño',
};

export default function FacturacionPage() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [paymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'methods'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const failedPayments = paymentMethods.filter(p => p.status === 'expired' || p.status === 'failed').length;

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === 'all') return true;
    return invoice.status === statusFilter;
  });

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    const labels = {
      paid: 'Pagado',
      pending: 'Pendiente',
      overdue: 'Vencido',
      failed: 'Fallido',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'sepa':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      case 'bank_transfer':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Mock Data Indicator */}
      <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-amber-500 text-sm font-medium">Mock Data - Desarrollo</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-green-400 mt-1">€{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pendiente Cobro</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">€{pendingAmount.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Facturas Vencidas</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{overdueCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Métodos Expirados</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{failedPayments}</p>
            </div>
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing tiers (mock) */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Pricing tiers</h2>
            <p className="text-slate-400 text-sm">Estructura propuesta para Stripe Billing + uso.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-200">Stripe pendiente</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pricingTiers.map(tier => (
            <div key={tier.name} className="p-4 rounded-lg bg-slate-900/60 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">{tier.name}</p>
                <p className="text-indigo-300 text-sm">{tier.price}</p>
              </div>
              <ul className="text-slate-300 text-sm space-y-1">
                {tier.perks.map(perk => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <div className="text-xs text-slate-500 space-y-1">
                {tier.extras.map(extra => (
                  <p key={extra}>{extra}</p>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Suscripciones activas</span>
                <span className="text-white font-semibold">{tier.activeSubs}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Ingresos mensuales</span>
                <span className="text-white font-semibold">€{tier.mrr.toLocaleString()}</span>
              </div>
              <button className="w-full mt-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">
                Editar plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Usage metering (mock) */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Usage metering</h2>
            <p className="text-slate-400 text-sm">Registra métricas para billing basado en uso.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-300">Implementar tracking</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {usageMeters.map(meter => (
            <div key={meter.metric} className="p-4 rounded-lg bg-slate-900/60 border border-slate-700">
              <p className="text-slate-400 text-sm">{meter.metric}</p>
              <p className="text-2xl font-semibold text-white mt-1">{meter.value.toLocaleString()} {meter.unit}</p>
              <p className="text-xs text-slate-500">Límite: {meter.limit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6">
        <div className="border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'invoices'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facturas
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'methods'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Métodos de Pago
            </button>
          </div>
        </div>

        {activeTab === 'invoices' && (
          <>
            <div className="p-4 border-b border-slate-700">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="paid">Pagados</option>
                  <option value="pending">Pendientes</option>
                  <option value="overdue">Vencidos</option>
                  <option value="failed">Fallidos</option>
                </select>
                <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Factura</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tenant</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Importe</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Vencimiento</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{invoice.number}</p>
                          <p className="text-slate-400 text-sm">{invoice.period}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{invoice.tenantName}</td>
                      <td className="px-6 py-4 text-slate-300">{invoice.plan}</td>
                      <td className="px-6 py-4 text-white font-medium">€{invoice.amount}</td>
                      <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-slate-300">{formatDate(invoice.dueDate)}</p>
                          {invoice.paidDate && (
                            <p className="text-green-400 text-sm">Pagado: {formatDate(invoice.paidDate)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Ver detalle">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Descargar PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                            <button className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded transition-colors" title="Enviar recordatorio">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'methods' && (
          <div className="p-6">
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 rounded-lg border ${
                    method.status === 'active'
                      ? 'bg-slate-750 border-slate-600'
                      : 'bg-red-900/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        method.status === 'active' ? 'bg-slate-700' : 'bg-red-500/20'
                      }`}>
                        <span className={method.status === 'active' ? 'text-white' : 'text-red-400'}>
                          {getPaymentMethodIcon(method.type)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{method.tenantName}</p>
                        <p className="text-slate-400 text-sm">
                          {method.type === 'card' ? 'Tarjeta' : method.type === 'sepa' ? 'SEPA Direct Debit' : 'Transferencia'}
                          {' '}•••• {method.last4}
                          {method.type === 'card' && ` • Exp: ${method.expiryDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                          Predeterminado
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        method.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : method.status === 'expired'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {method.status === 'active' ? 'Activo' : method.status === 'expired' ? 'Expirado' : 'Fallido'}
                      </span>
                      {method.status !== 'active' && (
                        <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors">
                          Contactar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Evolución de Ingresos</h3>
        <div className="h-64 flex items-center justify-center bg-slate-750 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-slate-400">Gráfico de ingresos</p>
            <p className="text-slate-500 text-sm">Próximamente con Recharts</p>
          </div>
        </div>
      </div>
    </>
  );
}

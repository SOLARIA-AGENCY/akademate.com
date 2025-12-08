'use client';

import { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  slug: 'starter' | 'professional' | 'enterprise';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  modules: {
    gestionAcademica: boolean;
    marketing: boolean;
    campusVirtual: boolean;
    isAddonCampus?: boolean;
  };
  addons?: {
    extraCoursePrice?: number; // €/curso extra/mes
    extraUserPrice?: number;   // €/usuario extra/mes
    extraSitePrice?: number;   // €/sede extra/mes
  };
  features: {
    users: number | 'unlimited';
    sites: number | 'unlimited';
    storage: string;
    courses: number | 'unlimited';
    leads: number | 'unlimited';
    support: string;
    analytics: boolean;
    api: boolean;
    customBranding: boolean;
    sso: boolean;
  };
    isPopular: boolean;
    activeSubscriptions: number;
    revenue: number;
}

interface Subscription {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  status: 'active' | 'trial' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  amount: number;
}

const mockPlans: Plan[] = [
  {
    id: '1',
    name: 'Starter (Gestión + Marketing)',
    slug: 'starter',
    price: 199,
    billingCycle: 'monthly',
    modules: {
      gestionAcademica: true,
      marketing: true,
      campusVirtual: false,
    },
    addons: {
      extraCoursePrice: 5,
      extraUserPrice: 9,
      extraSitePrice: 29,
    },
    features: {
      users: 5,
      sites: 1, // sedes
      storage: '10 GB',
      courses: 20,
      leads: 2000,
      support: 'Email',
      analytics: true,
      api: true,
      customBranding: false,
      sso: false,
    },
    isPopular: false,
    activeSubscriptions: 8,
    revenue: 1592,
  },
  {
    id: '2',
    name: 'Pro Campus (incluye Campus Virtual)',
    slug: 'professional',
    price: 299, // Campus Virtual mínimo 299
    billingCycle: 'monthly',
    modules: {
      gestionAcademica: true,
      marketing: true,
      campusVirtual: true,
    },
    addons: {
      extraCoursePrice: 3,
      extraUserPrice: 7,
      extraSitePrice: 39,
    },
    features: {
      users: 10,
      sites: 3, // sedes
      storage: '50 GB',
      courses: 100,
      leads: 7500,
      support: 'Priority',
      analytics: true,
      api: true,
      customBranding: true,
      sso: false,
    },
    isPopular: true,
    activeSubscriptions: 12,
    revenue: 3588,
  },
  {
    id: '3',
    name: 'Enterprise Full (Gestión + Marketing + Campus)',
    slug: 'enterprise',
    price: 599,
    billingCycle: 'monthly',
    modules: {
      gestionAcademica: true,
      marketing: true,
      campusVirtual: true,
    },
    addons: {
      extraCoursePrice: 0,
      extraUserPrice: 0,
      extraSitePrice: 0,
    },
    features: {
      users: 'unlimited',
      sites: 'unlimited', // sedes ilimitadas
      storage: '200 GB',
      courses: 'unlimited',
      leads: 'unlimited',
      support: 'Dedicado 24/7',
      analytics: true,
      api: true,
      customBranding: true,
      sso: true,
    },
    isPopular: false,
    activeSubscriptions: 2,
    revenue: 1198,
  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    tenantId: '1',
    tenantName: 'CEP Formación',
    planId: '2',
    planName: 'Pro Campus',
    status: 'active',
    currentPeriodStart: '2025-12-01',
    currentPeriodEnd: '2026-01-01',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    amount: 299,
  },
  {
    id: '2',
    tenantId: '2',
    tenantName: 'Academia Madrid',
    planId: '1',
    planName: 'Starter',
    status: 'trial',
    currentPeriodStart: '2025-11-20',
    currentPeriodEnd: '2025-12-20',
    cancelAtPeriodEnd: false,
    trialEndsAt: '2025-12-20',
    amount: 0,
  },
  {
    id: '3',
    tenantId: '3',
    tenantName: 'Instituto Barcelona',
    planId: '3',
    planName: 'Enterprise Full',
    status: 'active',
    currentPeriodStart: '2025-12-01',
    currentPeriodEnd: '2026-01-01',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    amount: 599,
  },
  {
    id: '4',
    tenantId: '4',
    tenantName: 'Centro Formativo Valencia',
    planId: '2',
    planName: 'Professional',
    status: 'past_due',
    currentPeriodStart: '2025-11-01',
    currentPeriodEnd: '2025-12-01',
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    amount: 299,
  },
  {
    id: '5',
    tenantId: '5',
    tenantName: 'Formación Sevilla',
    planId: '1',
    planName: 'Starter',
    status: 'cancelled',
    currentPeriodStart: '2025-10-01',
    currentPeriodEnd: '2025-11-01',
    cancelAtPeriodEnd: true,
    trialEndsAt: null,
    amount: 99,
  },
];

export default function SuscripcionesPage() {
  const [plans] = useState<Plan[]>(mockPlans);
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const totalMRR = plans.reduce((sum, p) => sum + p.revenue, 0);
  const totalSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial').length;
  const trialCount = subscriptions.filter(s => s.status === 'trial').length;
  const churnRisk = subscriptions.filter(s => s.status === 'past_due' || s.cancelAtPeriodEnd).length;

  const renderModules = (plan: Plan) => {
    const chip = (label: string, active: boolean) => (
      <span
        key={label}
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {label}
      </span>
    );
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {chip('Gestión Académica', plan.modules.gestionAcademica)}
        {chip('Marketing', plan.modules.marketing)}
        {chip('Campus Virtual', plan.modules.campusVirtual)}
        {plan.modules.isAddonCampus && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            Add-on
          </span>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: Subscription['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-500',
      past_due: 'bg-red-100 text-red-800',
    };
    const labels = {
      active: 'Activa',
      trial: 'Trial',
      cancelled: 'Cancelada',
      past_due: 'Pago Pendiente',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFeatureValue = (value: number | string | 'unlimited') => {
    if (value === 'unlimited') return '∞';
    return value.toString();
  };

  const renderAddons = (plan: Plan) => {
    if (!plan.addons) return null;
    const { extraCoursePrice, extraUserPrice, extraSitePrice } = plan.addons;
    const rows = [
      extraCoursePrice !== undefined && `Cursos extra: €${extraCoursePrice}/curso`,
      extraUserPrice !== undefined && `Usuarios extra: €${extraUserPrice}/usuario`,
      extraSitePrice !== undefined && `Sedes extra: €${extraSitePrice}/sede`,
    ].filter(Boolean) as string[];
    if (!rows.length) return null;
    return (
      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-xs text-slate-200">
        <p className="font-semibold text-slate-100 mb-1">Módulos de expansión</p>
        <ul className="space-y-1">
          {rows.map((r, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    );
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
              <p className="text-slate-400 text-sm">MRR Total</p>
              <p className="text-2xl font-bold text-green-400 mt-1">€{totalMRR.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Suscripciones Activas</p>
              <p className="text-2xl font-bold text-white mt-1">{totalSubscriptions}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">En Trial</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{trialCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Riesgo de Baja</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{churnRisk}</p>
            </div>
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'plans'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Planes
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'subscriptions'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suscripciones
            </button>
          </div>
        </div>

        {activeTab === 'plans' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border ${
                    plan.isPopular
                      ? 'bg-gradient-to-b from-indigo-900/50 to-slate-800 border-indigo-500'
                      : 'bg-slate-750 border-slate-600'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-bold text-white">€{plan.price}</span>
                      <span className="text-slate-400 ml-1">/mes</span>
                    </div>

                    {renderModules(plan)}

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-300">{formatFeatureValue(plan.features.users)} usuarios</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-300">{formatFeatureValue(plan.features.sites)} sedes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-300">{plan.features.storage} almacenamiento</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-300">{formatFeatureValue(plan.features.courses)} cursos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className={`w-4 h-4 ${plan.features.analytics ? 'text-green-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          {plan.features.analytics ? (
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                        <span className={plan.features.analytics ? 'text-slate-300' : 'text-slate-500'}>Analíticas avanzadas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className={`w-4 h-4 ${plan.features.api ? 'text-green-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          {plan.features.api ? (
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                        <span className={plan.features.api ? 'text-slate-300' : 'text-slate-500'}>Acceso API</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className={`w-4 h-4 ${plan.features.sso ? 'text-green-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          {plan.features.sso ? (
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                        <span className={plan.features.sso ? 'text-slate-300' : 'text-slate-500'}>SSO / SAML</span>
                      </div>
                      {renderAddons(plan)}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-600">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Suscripciones activas</span>
                        <span className="text-white font-medium">{plan.activeSubscriptions}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-slate-400">Ingresos mensuales</span>
                        <span className="text-green-400 font-medium">€{plan.revenue.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowEditPlanModal(true);
                      }}
                      className="w-full mt-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Editar Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tenant</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Importe</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Período</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{sub.tenantName}</td>
                    <td className="px-6 py-4 text-slate-300">{sub.planName}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(sub.status)}
                        {sub.cancelAtPeriodEnd && (
                          <span className="text-xs text-red-400">Cancela al finalizar período</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${sub.amount > 0 ? 'text-white' : 'text-slate-400'}`}>
                        {sub.amount > 0 ? `€${sub.amount}/mes` : 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-slate-300">{formatDate(sub.currentPeriodStart)}</p>
                        <p className="text-slate-500">→ {formatDate(sub.currentPeriodEnd)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                          Ver
                        </button>
                        <button className="px-3 py-1 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded transition-colors">
                          Cambiar Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Plan Modal */}
      {showEditPlanModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg mx-4">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Editar Plan: {selectedPlan.name}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Precio Mensual (€)</label>
                <input
                  type="number"
                  defaultValue={selectedPlan.price}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Límite de Usuarios</label>
                <input
                  type="text"
                  defaultValue={selectedPlan.features.users}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Límite de Sedes</label>
                <input
                  type="text"
                  defaultValue={selectedPlan.features.sites}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Almacenamiento</label>
                <input
                  type="text"
                  defaultValue={selectedPlan.features.storage}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditPlanModal(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

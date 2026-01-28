'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { MockDataBanner } from '@/components/mock-data-banner';

interface PlatformSettings {
  general: {
    platformName: string;
    supportEmail: string;
    defaultTimezone: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  trial: {
    duration: number;
    allowExtension: boolean;
    maxExtensions: number;
    requireCard: boolean;
  };
  limits: {
    maxTenantsPerAccount: number;
    maxUsersStarter: number;
    maxUsersProfessional: number;
    maxStorageStarter: string;
    maxStorageProfessional: string;
  };
  integrations: {
    stripeEnabled: boolean;
    stripePublicKey: string;
    mailchimpEnabled: boolean;
    mailchimpApiKey: string;
    twilioEnabled: boolean;
    twilioSid: string;
  };
  security: {
    enforceSSO: boolean;
    mfaRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };
}

const defaultSettings: PlatformSettings = {
  general: {
    platformName: 'Akademate',
    supportEmail: 'soporte@akademate.com',
    defaultTimezone: 'Europe/Madrid',
    defaultLanguage: 'es',
    maintenanceMode: false,
  },
  branding: {
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
  },
  trial: {
    duration: 14,
    allowExtension: true,
    maxExtensions: 2,
    requireCard: false,
  },
  limits: {
    maxTenantsPerAccount: 3,
    maxUsersStarter: 5,
    maxUsersProfessional: 15,
    maxStorageStarter: '5 GB',
    maxStorageProfessional: '25 GB',
  },
  integrations: {
    stripeEnabled: true,
    stripePublicKey: 'pk_live_****',
    mailchimpEnabled: true,
    mailchimpApiKey: '****-us21',
    twilioEnabled: false,
    twilioSid: '',
  },
  security: {
    enforceSSO: false,
    mfaRequired: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: [],
  },
};

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'trial' | 'limits' | 'integrations' | 'security' | 'enterprise'>('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Marca' },
    { id: 'trial', label: 'Trial' },
    { id: 'limits', label: 'Límites' },
    { id: 'integrations', label: 'Integraciones' },
    { id: 'security', label: 'Seguridad' },
    { id: 'enterprise', label: 'Enterprise' },
  ];

  return (
    <>
      <PageHeader
        title="Configuracion"
        description="Ajustes generales de la plataforma Akademate"
      >
        <MockDataBanner />
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-card rounded-xl border border-muted/30 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="glass-panel">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Configuración General</h2>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="platformName" className="block text-sm font-medium text-muted-foreground mb-2">Nombre de la Plataforma</label>
                    <input
                      id="platformName"
                      type="text"
                      value={settings.general.platformName}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, platformName: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="supportEmail" className="block text-sm font-medium text-muted-foreground mb-2">Email de Soporte</label>
                    <input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, supportEmail: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="defaultTimezone" className="block text-sm font-medium text-muted-foreground mb-2">Zona Horaria</label>
                      <select
                        id="defaultTimezone"
                        value={settings.general.defaultTimezone}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, defaultTimezone: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Europe/Madrid">Europe/Madrid</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="America/Mexico_City">America/Mexico_City</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="defaultLanguage" className="block text-sm font-medium text-muted-foreground mb-2">Idioma por Defecto</label>
                      <select
                        id="defaultLanguage"
                        value={settings.general.defaultLanguage}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, defaultLanguage: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="ca">Català</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Modo Mantenimiento</p>
                      <p className="text-muted-foreground text-sm">Activa para bloquear acceso a todos los tenants</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" aria-label="Modo Mantenimiento">
                      <input
                        type="checkbox"
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, maintenanceMode: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 dark:text-red-400"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Branding Settings */}
            {activeTab === 'branding' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Personalización de Marca</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="logo" className="block text-sm font-medium text-foreground mb-2">Logo</label>
                      <div id="logo" className="w-full h-32 bg-muted/50 border-2 border-dashed  rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-8 h-8 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-muted-foreground text-sm">Arrastra o haz clic</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="favicon" className="block text-sm font-medium text-foreground mb-2">Favicon</label>
                      <div id="favicon" className="w-full h-32 bg-muted/50 border-2 border-dashed  rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-8 h-8 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-muted-foreground text-sm">32x32 px</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="primaryColorText" className="block text-sm font-medium text-foreground mb-2">Color Primario</label>
                      <div className="flex gap-3">
                        <input
                          id="primaryColor"
                          type="color"
                          value={settings.branding.primaryColor}
                          onChange={(e) => setSettings({
                            ...settings,
                            branding: { ...settings.branding, primaryColor: e.target.value }
                          })}
                          aria-label="Color primario selector"
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          id="primaryColorText"
                          type="text"
                          value={settings.branding.primaryColor}
                          onChange={(e) => setSettings({
                            ...settings,
                            branding: { ...settings.branding, primaryColor: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="secondaryColorText" className="block text-sm font-medium text-foreground mb-2">Color Secundario</label>
                      <div className="flex gap-3">
                        <input
                          id="secondaryColor"
                          type="color"
                          value={settings.branding.secondaryColor}
                          onChange={(e) => setSettings({
                            ...settings,
                            branding: { ...settings.branding, secondaryColor: e.target.value }
                          })}
                          aria-label="Color secundario selector"
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          id="secondaryColorText"
                          type="text"
                          value={settings.branding.secondaryColor}
                          onChange={(e) => setSettings({
                            ...settings,
                            branding: { ...settings.branding, secondaryColor: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-muted/30 space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-semibold">White-label & dominios custom</p>
                      <p className="text-muted-foreground text-sm">Activa branding por tenant y dominios SSL.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" aria-label="White-label y dominios custom">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="customDomain" className="block text-sm font-medium text-foreground mb-2">Dominio custom (ej. campus.midominio.com)</label>
                      <input
                        id="customDomain"
                        type="text"
                        placeholder="custom.domain.com"
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="sslStatus" className="block text-sm font-medium text-foreground mb-2">Estado SSL / verificación</label>
                      <input
                        id="sslStatus"
                        type="text"
                        placeholder="Pendiente (mock)"
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pendiente: emisión SSL automática, verificación TXT, assets per-tenant vía CSS vars y R2/MinIO namespaced.
                  </div>
                </div>
              </div>
            )}

            {/* Trial Settings */}
            {activeTab === 'trial' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Configuración de Trial</h2>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="trialDuration" className="block text-sm font-medium text-foreground mb-2">Duración del Trial (días)</label>
                    <input
                      id="trialDuration"
                      type="number"
                      value={settings.trial.duration}
                      onChange={(e) => setSettings({
                        ...settings,
                        trial: { ...settings.trial, duration: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Permitir Extensiones</p>
                      <p className="text-muted-foreground text-sm">Los tenants pueden solicitar extensión del trial</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" aria-label="Permitir extensiones">
                      <input
                        type="checkbox"
                        checked={settings.trial.allowExtension}
                        onChange={(e) => setSettings({
                          ...settings,
                          trial: { ...settings.trial, allowExtension: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {settings.trial.allowExtension && (
                    <div>
                      <label htmlFor="maxExtensions" className="block text-sm font-medium text-foreground mb-2">Máximo de Extensiones</label>
                      <input
                        id="maxExtensions"
                        type="number"
                        value={settings.trial.maxExtensions}
                        onChange={(e) => setSettings({
                          ...settings,
                          trial: { ...settings.trial, maxExtensions: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Requerir Tarjeta</p>
                      <p className="text-muted-foreground text-sm">Solicitar método de pago para iniciar trial</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" aria-label="Requerir tarjeta">
                      <input
                        type="checkbox"
                        checked={settings.trial.requireCard}
                        onChange={(e) => setSettings({
                          ...settings,
                          trial: { ...settings.trial, requireCard: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Limits Settings */}
            {activeTab === 'limits' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Límites de Recursos</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Usuarios - Starter</label>
                      <input
                        type="number"
                        value={settings.limits.maxUsersStarter}
                        onChange={(e) => setSettings({
                          ...settings,
                          limits: { ...settings.limits, maxUsersStarter: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Usuarios - Professional</label>
                      <input
                        type="number"
                        value={settings.limits.maxUsersProfessional}
                        onChange={(e) => setSettings({
                          ...settings,
                          limits: { ...settings.limits, maxUsersProfessional: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Almacenamiento - Starter</label>
                      <input
                        type="text"
                        value={settings.limits.maxStorageStarter}
                        onChange={(e) => setSettings({
                          ...settings,
                          limits: { ...settings.limits, maxStorageStarter: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Almacenamiento - Professional</label>
                      <input
                        type="text"
                        value={settings.limits.maxStorageProfessional}
                        onChange={(e) => setSettings({
                          ...settings,
                          limits: { ...settings.limits, maxStorageProfessional: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Máx. Tenants por Cuenta</label>
                    <input
                      type="number"
                      value={settings.limits.maxTenantsPerAccount}
                      onChange={(e) => setSettings({
                        ...settings,
                        limits: { ...settings.limits, maxTenantsPerAccount: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Integraciones</h2>
                <div className="space-y-6">
                  {/* Stripe */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-purple-400 font-bold">S</span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">Stripe</p>
                          <p className="text-muted-foreground text-sm">Procesamiento de pagos</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.integrations.stripeEnabled}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: { ...settings.integrations, stripeEnabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    {settings.integrations.stripeEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Clave Pública</label>
                        <input
                          type="text"
                          value={settings.integrations.stripePublicKey}
                          className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="pk_live_..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Mailchimp */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-yellow-400 font-bold">M</span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">Mailchimp</p>
                          <p className="text-muted-foreground text-sm">Email marketing</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.integrations.mailchimpEnabled}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: { ...settings.integrations, mailchimpEnabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    {settings.integrations.mailchimpEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                        <input
                          type="text"
                          value={settings.integrations.mailchimpApiKey}
                          className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="****-us21"
                        />
                      </div>
                    )}
                  </div>

                  {/* Twilio */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-red-400 font-bold">T</span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">Twilio (WhatsApp)</p>
                          <p className="text-muted-foreground text-sm">Mensajería WhatsApp</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.integrations.twilioEnabled}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: { ...settings.integrations, twilioEnabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Seguridad</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Requerir MFA</p>
                      <p className="text-muted-foreground text-sm">Todos los usuarios deben configurar 2FA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.mfaRequired}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, mfaRequired: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Timeout Sesión (min)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Máx. Intentos Login</label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 bg-muted/50 border  rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Forzar SSO</p>
                      <p className="text-muted-foreground text-sm">Solo permitir login mediante SSO corporativo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.enforceSSO}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, enforceSSO: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Enterprise Readiness */}
            {activeTab === 'enterprise' && (
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Enterprise Readiness (mock)</h2>
                <p className="text-muted-foreground text-sm">Checklist para SSO/SCIM, compliance y flags por tenant.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-foreground font-semibold mb-1">SSO / OIDC / SAML</p>
                    <p className="text-muted-foreground text-sm mb-2">Configura IdPs (Okta, Entra ID, Google). Mock pendiente de backend.</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300">Gap 100%</span>
                      <span className="px-2 py-1 rounded glass-panel text-foreground">workos / frontegg opcional</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-foreground font-semibold mb-1">SCIM / Directory Sync</p>
                    <p className="text-muted-foreground text-sm mb-2">Provisioning y des-provisioning automático de usuarios.</p>
                    <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 text-xs">Gap 100%</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-foreground font-semibold mb-1">Audit Logs</p>
                    <p className="text-muted-foreground text-sm mb-2">Export/search/retención. Define schema multi-tenant.</p>
                    <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 text-xs">Gap 70%</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-foreground font-semibold mb-1">Feature Flags</p>
                    <p className="text-muted-foreground text-sm mb-2">Rollouts por tenant/plan. Conectar a flagsmith/launchdarkly o custom.</p>
                    <span className="px-2 py-1 rounded bg-red-500/15 text-red-300 text-xs">Gap 100%</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-foreground font-semibold mb-1">Webhooks & Integraciones</p>
                    <p className="text-muted-foreground text-sm mb-2">Endpoints, reintentos, firmas. Eventos: lead, enrollment, payment, subscription.</p>
                    <span className="px-2 py-1 rounded bg-red-500/15 text-red-300 text-xs">Gap 100%</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-foreground font-semibold mb-1">Compliance / Seguridad</p>
                    <p className="text-muted-foreground text-sm mb-2">MFA obligatoria, export/delete GDPR, status page, retención.</p>
                    <span className="px-2 py-1 rounded bg-red-500/15 text-red-300 text-xs">Gap 100%</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
                  <p className="text-foreground font-semibold mb-2">Próximas acciones (mock)</p>
                  <ul className="list-disc list-inside text-foreground text-sm space-y-1">
                    <li>Integrar Stripe Billing + pricing tiers.</li>
                    <li>Implementar SSO (OIDC/SAML) y SCIM con issuer central.</li>
                    <li>Activar auditoría exportable y rate limiting por plan.</li>
                    <li>Publicar marketplace de webhooks e integraciones.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="p-6 border-t border-muted/30 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-600 text-foreground rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

# 🚀 Informe: Dashboard SaaS Multi-Tenant Enterprise
## Análisis para Escalar a Modelo de Negocio $1M+ ARR

**Fecha:** 2025-12-08  
**Proyecto:** CEPComunicacion v2 / ACADEMIX  
**Objetivo:** Identificar gaps y features necesarias para competir con SaaS enterprise

---

## 📊 Resumen Ejecutivo

| Categoría | Estado Actual | Estándar Enterprise | Gap |
|-----------|---------------|---------------------|-----|
| **Multi-Tenancy** | 🟡 Básico (Row-Level) | Completo | 60% |
| **Billing & Subscriptions** | 🔴 No implementado | Stripe + Usage-Based | 100% |
| **Enterprise Auth (SSO/SCIM)** | 🔴 No implementado | SAML/OIDC + Directory Sync | 100% |
| **Audit Logs** | 🟡 Parcial | Completo + Exportable | 70% |
| **API Management** | 🟡 Básico | Keys + Rate Limiting + Docs | 60% |
| **Onboarding** | 🔴 No implementado | Self-Service + Wizards | 100% |
| **Analytics** | 🟡 Parcial | Real-time + Custom Dashboards | 50% |
| **White-Labeling** | 🔴 No implementado | Custom Domains + Branding | 100% |
| **Feature Flags** | 🔴 No implementado | Tenant-Aware Toggles | 100% |
| **Webhooks** | 🔴 No implementado | Event-Driven + Retry | 100% |

**Puntuación Global:** 32/100 → **Se requiere desarrollo significativo**

---

## 🏗️ Arquitectura Actual vs Enterprise

### Lo que TIENES (ACADEMIX/CEP)

#### SuperAdmin Dashboard (`apps/admin/`)
```
/dashboard
├── /tenants          ✅ Gestión de inquilinos
├── /suscripciones    ✅ Vista de suscripciones (sin Stripe)
├── /facturacion      ✅ Vista facturación (mockup)
├── /impersonar       ✅ Impersonación de usuarios
├── /estado           ✅ Estado del sistema
├── /api              ✅ Gestión API básica
├── /configuracion    ✅ Configuración general
├── /soporte          ✅ Tickets de soporte
└── /media            ✅ Gestión de medios
```

#### Tenant Dashboard (`apps/cms/`)
```
/dashboard
├── /cursos            ✅ CRUD cursos
├── /ciclos            ✅ CRUD ciclos formativos
├── /sedes             ✅ CRUD sedes
├── /alumnos           ✅ Gestión alumnos
├── /matriculas        ✅ Matrículas
├── /leads             ✅ CRM leads
├── /campanas          ✅ Campañas marketing
├── /analiticas        ✅ Analytics básicas
├── /planner           ✅ Planificador
├── /lista-espera      ✅ Waitlist
├── /profesores        ✅ Gestión profesores
├── /personal          ✅ Personal administrativo
├── /campus/           ✅ Campus Virtual (nuevo)
│   ├── /cursos        ✅ Cursos online
│   ├── /materiales    ✅ Material didáctico
│   ├── /sesiones      ✅ Sesiones live
│   ├── /grabaciones   ✅ Recordings
│   ├── /tareas        ✅ Assignments
│   ├── /anuncios      ✅ Announcements
│   └── /certificados  ✅ Certificaciones
├── /contenido/        ✅ CMS
│   ├── /blog          ✅ Blog
│   ├── /faqs          ✅ FAQ
│   ├── /medios        ✅ Media library
│   ├── /paginas       ✅ Static pages
│   └── /testimonios   ✅ Testimonials
├── /configuracion/    ✅ Settings
│   ├── /general       ✅ General
│   ├── /apis          ✅ API config
│   └── /areas         ✅ Áreas formativas
└── /administracion/   ✅ Admin
    ├── /usuarios      ✅ Usuarios
    ├── /roles         ✅ RBAC
    ├── /actividad     ✅ Activity log
    ├── /impersonar    ✅ Impersonation
    └── /suscripcion   ✅ Subscription view
```

**Total páginas actuales:** 60+

---

## 🔴 Features CRÍTICAS que FALTAN

### 1. 💳 Billing & Subscription Management

**Impacto en Revenue:** CRÍTICO - Sin esto no hay modelo de negocio SaaS

```
NECESITAS:
├── /billing
│   ├── /plans              # Planes de precios
│   ├── /subscriptions      # Gestión suscripciones
│   ├── /invoices           # Facturas
│   ├── /payment-methods    # Métodos de pago
│   ├── /usage              # Uso medido
│   └── /credits            # Créditos/Cupones
├── /pricing                # Pricing público
└── /checkout               # Checkout flow
```

**Implementación recomendada:**
- **Stripe Billing** - https://docs.stripe.com/billing/subscriptions/usage-based
- **Planes:** Free, Starter ($29), Pro ($99), Enterprise (custom)
- **Métricas a medir:** Alumnos activos, cursos, sedes, storage

**Entidades de datos necesarias:**
```typescript
// Subscriptions
interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
}

// Usage Meters
interface UsageMeter {
  id: string;
  tenantId: string;
  metric: 'active_students' | 'courses' | 'storage_gb' | 'api_calls';
  value: number;
  recordedAt: Date;
}

// Invoices
interface Invoice {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  dueDate: Date;
  stripeInvoiceId: string;
}
```

---

### 2. 🔐 Enterprise Authentication (SSO/SCIM)

**Impacto:** CRÍTICO para ventas Enterprise (contratos $10K+/año)

```
NECESITAS:
├── /settings/sso
│   ├── /saml           # SAML 2.0 config
│   ├── /oidc           # OpenID Connect
│   └── /providers      # IdP management
├── /settings/directory
│   ├── /scim           # SCIM provisioning
│   ├── /sync           # Directory sync status
│   └── /mappings       # Attribute mappings
└── /admin-portal       # Self-service IT admin
```

**Providers a soportar:**
- Okta
- Microsoft Entra ID (Azure AD)
- Google Workspace
- OneLogin
- Auth0

**Opciones de implementación:**
- https://workos.com/ (SSO/SCIM)
- https://frontegg.com/
- Custom con Passport.js + estrategias SAML/OIDC

---

### 3. 📊 Audit Logs Enterprise

**Impacto:** Requerido para SOC2/ISO27001 y clientes enterprise

```
NECESITAS:
├── /audit
│   ├── /logs           # Logs en tiempo real
│   ├── /search         # Búsqueda avanzada
│   ├── /export         # Export CSV/JSON
│   └── /retention      # Políticas retención
└── /compliance
    ├── /reports        # Reportes automáticos
    └── /alerts         # Alertas de seguridad
```

**Schema de Audit Log:**
```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string;           // 'user.created', 'course.updated', etc.
  resource: string;         // Tipo de recurso
  resourceId: string;
  oldValue: object | null;
  newValue: object | null;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

**Referencia:** https://www.enterpriseready.io/features/audit-log/

---

### 4. 🔑 API Keys & Rate Limiting

**Impacto:** Monetización de API + Seguridad

```
NECESITAS:
├── /settings/api
│   ├── /keys           # API key management
│   ├── /permissions    # Scopes por key
│   ├── /usage          # Usage stats
│   └── /rate-limits    # Límites por plan
├── /docs/api           # API documentation
└── /playground         # API explorer
```

**Features:**
- Generación de API keys (public/secret)
- Scopes granulares (read:courses, write:students, etc.)
- Rate limiting por plan (1K/día free, 100K/día pro)
- Métricas de uso por endpoint
- Logs de requests

---

### 5. 🚀 Onboarding & Setup Wizard

**Impacto:** Reducción de churn en primeros 7 días (CRÍTICO)

```
NECESITAS:
├── /onboarding
│   ├── /welcome        # Welcome screen
│   ├── /setup          # Setup wizard
│   │   ├── step-1      # Datos empresa
│   │   ├── step-2      # Configuración inicial
│   │   ├── step-3      # Importar datos
│   │   ├── step-4      # Invitar equipo
│   │   └── step-5      # Tour interactivo
│   └── /checklist      # Progress checklist
└── /getting-started    # Guías iniciales
```

**KPIs a medir:** TTFV, onboarding completion, retención día 1/7/30

---

### 6. 🌐 White-Labeling & Custom Domains

**Impacto:** Diferenciador para clientes Enterprise

```
NECESITAS:
├── /settings/branding
│   ├── /logo           # Logo upload
│   ├── /colors         # Brand colors
│   ├── /emails         # Email templates
│   └── /favicon        # Favicon
├── /settings/domain
│   ├── /custom         # Custom domain setup
│   ├── /ssl            # SSL certificates
│   └── /dns            # DNS verification
└── /public             # Public-facing config
```

**Implementación:** routing por hostname, wildcard SSL, DNS TXT, CSS vars por tenant

---

### 7. 🎛️ Feature Flags (Tenant-Aware)

**Impacto:** Control de rollouts + Monetización por features

```
NECESITAS:
├── /settings/features
│   ├── /flags          # Feature toggles
│   ├── /experiments    # A/B tests
│   └── /rollouts       # Gradual rollouts
└── /admin/feature-gates
    ├── /global         # Flags globales
    └── /tenant         # Flags por tenant
```

**Schema:**
```typescript
interface FeatureFlag {
  id: string;
  key: string;              // 'campus_virtual', 'ai_content', etc.
  type: 'boolean' | 'percentage' | 'variant';
  defaultValue: any;
  overrides: {
    tenantId: string;
    value: any;
  }[];
  planRequirement: string | null;  // 'pro', 'enterprise'
}
```

**Opciones:** LaunchDarkly, Split.io, Flagsmith o custom

---

### 8. 🔔 Webhooks & Event System

**Impacto:** Integraciones + Automatizaciones

```
NECESITAS:
├── /settings/webhooks
│   ├── /endpoints      # Webhook URLs
│   ├── /events         # Event subscriptions
│   ├── /logs           # Delivery logs
│   └── /test           # Test sender
└── /integrations
    ├── /available      # Marketplace
    └── /connected      # Active integrations
```

**Eventos a exponer:** student.created, student.enrolled, student.completed, course.published, lead.captured, payment.succeeded, subscription.changed

---

### 9. 📈 Advanced Analytics Dashboard

**Impacto:** Valor percibido + Retention

```
NECESITAS:
├── /analytics
│   ├── /overview       # KPIs principales
│   ├── /students       # Analytics de alumnos
│   ├── /courses        # Analytics de cursos
│   ├── /revenue        # MRR, churn, ARPU
│   ├── /engagement     # Engagement metrics
│   ├── /funnel         # Conversion funnel
│   └── /custom         # Custom dashboards
└── /reports
    ├── /scheduled      # Reportes programados
    └── /export         # Export data
```

**Métricas SaaS:** MRR, ARR, churn, ARPU, LTV, CAC, NRR

---

### 10. 🛡️ Security & Compliance Center

**Impacto:** Requerido para Enterprise sales

```
NECESITAS:
├── /security
│   ├── /overview       # Security dashboard
│   ├── /sessions       # Active sessions
│   ├── /devices        # Trusted devices
│   ├── /2fa            # MFA settings
│   └── /password       # Password policies
├── /compliance
│   ├── /gdpr           # GDPR tools
│   ├── /data-export    # Data portability
│   ├── /data-deletion  # Right to erasure
│   └── /dpa            # DPA agreements
└── /trust
    └── /status         # Trust/Status page
```

---

## 📋 Roadmap de Implementación

### Fase 1: Foundation (4 semanas) - 🎯 $100K ARR
| Feature | Prioridad | Esfuerzo | Impacto |
|---------|-----------|----------|---------|
| Stripe Billing básico | P0 | 2 semanas | Alto |
| Pricing page | P0 | 3 días | Alto |
| Onboarding wizard | P0 | 1 semana | Alto |
| Audit logs mejorados | P1 | 4 días | Medio |

### Fase 2: Growth (6 semanas) - 🎯 $500K ARR
| Feature | Prioridad | Esfuerzo | Impacto |
|---------|-----------|----------|---------|
| Usage-based billing | P0 | 2 semanas | Alto |
| API keys + Rate limiting | P0 | 1 semana | Alto |
| Webhooks system | P1 | 1 semana | Medio |
| Feature flags | P1 | 1 semana | Medio |
| Advanced analytics | P1 | 2 semanas | Alto |

### Fase 3: Enterprise (8 semanas) - 🎯 $1M+ ARR
| Feature | Prioridad | Esfuerzo | Impacto |
|---------|-----------|----------|---------|
| SSO (SAML/OIDC) | P0 | 3 semanas | Crítico |
| SCIM Directory Sync | P0 | 2 semanas | Crítico |
| Custom domains | P1 | 1 semana | Alto |
| White-labeling | P1 | 2 semanas | Alto |
| SOC2 compliance tools | P1 | Ongoing | Crítico |

---

## 💰 Modelo de Pricing Recomendado

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICING TIERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FREE          STARTER        PRO            ENTERPRISE         │
│  €0/mes        €29/mes        €99/mes        Custom             │
│                                                                  │
│  ✓ 1 sede      ✓ 3 sedes      ✓ Ilimitadas   ✓ Todo en Pro     │
│  ✓ 50 alumnos  ✓ 500 alumnos  ✓ 5,000        ✓ Ilimitados      │
│  ✓ 5 cursos    ✓ 50 cursos    ✓ Ilimitados   ✓ SSO/SCIM        │
│  ✓ Email       ✓ Email        ✓ Priority     ✓ Dedicated       │
│  ✗ API         ✓ 1K calls/día ✓ 100K/día     ✓ Custom limits   │
│  ✗ Campus      ✓ Basic        ✓ Full         ✓ White-label     │
│  ✗ Analytics   ✓ Basic        ✓ Advanced     ✓ Custom reports  │
│  ✗ Branding    ✗ Branding     ✓ Custom       ✓ Full white-label│
│                                                                  │
│  Self-serve    Self-serve     Self-serve     Sales-assisted    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Benchmarks SaaS para $1M ARR

| Métrica | Benchmark $1M ARR |
|---------|-------------------|
| **Gross Margin** | >70% |
| **Net Dollar Retention** | 105-115% |
| **Logo Retention** | 85-90% |
| **CAC Payback** | <18 meses |
| **LTV/CAC Ratio** | >3x |
| **ARR per Employee** | $150K-200K |
| **Growth Rate** | 100-200% YoY |

---

## 🔗 Referencias y Recursos

### Boilerplates Open Source
- https://github.com/ixartz/SaaS-Boilerplate
- https://github.com/nextacular/nextacular
- https://github.com/juicycleff/ultimate-backend

### Documentación Enterprise
- https://github.com/microsoftdocs/architecture-center/blob/main/docs/guide/saas-multitenant-solution-architecture/index.md
- https://www.enterpriseready.io/
- https://frontegg.com/product/enterprise-readiness

### Billing & Payments
- https://docs.stripe.com/billing/subscriptions/usage-based
- https://stripe.com/gb/resources/more/saas-subscription-models-101-a-guide-for-getting-started

### Identity & Access
- https://workos.com/
- https://frontegg.com/product/enterprise-readiness

### Best Practices
- https://isitdev.com/multi-tenant-saas-architecture-cloud-2025/
- https://medium.com/@thealgorithm/saas-architecture-best-practices-in-2025-2833f9cdfc75
- https://chrisdermody.com/best-practices-for-audit-logging-in-a-saas-business-app/

---

## ✅ Acciones Inmediatas

1. **Esta semana:**
   - [ ] Definir pricing tiers final
   - [ ] Crear cuenta Stripe y configurar productos
   - [ ] Diseñar onboarding flow (Figma)

2. **Próximas 2 semanas:**
   - [ ] Implementar Stripe Billing básico
   - [ ] Crear página de pricing
   - [ ] Implementar checkout flow

3. **Próximo mes:**
   - [ ] Usage metering
   - [ ] API key management
   - [ ] Webhooks básicos
   - [ ] Onboarding wizard

---

**Generado por:** Claude (Opus 4.5)  
**Para:** SOLARIA AGENCY / CEP FORMACIÓN  
**Versión:** 1.0

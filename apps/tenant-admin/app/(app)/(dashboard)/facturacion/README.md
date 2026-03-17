# Módulo de Facturación y Suscripciones

Sistema completo de gestión de facturación integrado con Stripe para el panel de administración de tenants.

## Estructura de Componentes

```
facturacion/
├── page.tsx                              # Página principal con tabs
├── components/
│   ├── SubscriptionCard.tsx              # Card de resumen de suscripción
│   ├── PlanCard.tsx                      # Card individual de plan
│   ├── InvoiceRow.tsx                    # Fila de tabla de factura
│   ├── PaymentMethodCard.tsx             # Card de método de pago
│   ├── CancelSubscriptionDialog.tsx      # Dialog de cancelación
│   ├── CheckoutDialog.tsx                # Dialog de confirmación de checkout
│   ├── PlanComparison.tsx                # Comparación de planes
│   ├── InvoicesTable.tsx                 # Tabla de facturas
│   ├── PaymentMethodsList.tsx            # Lista de métodos de pago
│   └── TransactionHistory.tsx            # Historial de transacciones
└── README.md                             # Esta documentación
```

## Hooks Personalizados

### `useBillingData({ tenantId })`

Hook para obtener todos los datos de facturación del tenant actual.

```typescript
const {
  subscription,          // Suscripción actual
  subscriptionLoading,   // Estado de carga
  subscriptionError,     // Error si existe
  invoices,              // Lista de facturas
  invoicesLoading,
  invoicesError,
  paymentMethods,        // Métodos de pago
  paymentMethodsLoading,
  paymentMethodsError,
  mutate,                // Función para revalidar todos los datos
} = useBillingData({ tenantId })
```

### `useSubscription({ tenantId, subscriptionId, stripeCustomerId })`

Hook para ejecutar acciones sobre la suscripción.

```typescript
const {
  changePlan,           // Cambiar plan (redirige a Stripe Checkout)
  cancelSubscription,   // Cancelar suscripción
  resumeSubscription,   // Reanudar suscripción cancelada
  openBillingPortal,    // Abrir Stripe Billing Portal
} = useSubscription({ tenantId, subscriptionId, stripeCustomerId })
```

## Flujos de Usuario

### 1. Ver Suscripción Actual

1. Usuario accede a `/facturacion`
2. Tab "Suscripción" muestra:
   - Plan actual (Starter/Pro/Enterprise)
   - Estado (Active, Trial, Past Due, Canceled)
   - Próxima fecha de renovación
   - Botones de acción

### 2. Cambiar Plan

1. Usuario hace clic en "Cambiar Plan"
2. Se muestra `PlanComparison` con 3 planes
3. Usuario selecciona plan e intervalo (mensual/anual)
4. Se abre `CheckoutDialog` con resumen
5. Usuario confirma → Redirige a Stripe Checkout
6. Stripe procesa el pago
7. Redirige a `/facturacion?success=true`
8. Se muestra toast de confirmación

### 3. Cancelar Suscripción

1. Usuario hace clic en "Cancelar Suscripción"
2. Se abre `CancelSubscriptionDialog`
3. Usuario puede:
   - Ingresar razón (opcional)
   - Elegir cancelar inmediatamente o al final del periodo
4. Usuario confirma
5. Se actualiza la suscripción
6. Se muestra estado "Cancelación Programada"

### 4. Ver Facturas

1. Usuario va al tab "Facturas"
2. Se muestra tabla con todas las facturas
3. Usuario puede:
   - Descargar PDF
   - Ver en Stripe
   - Filtrar por estado (futuro)

### 5. Gestionar Métodos de Pago

1. Usuario va al tab "Métodos de Pago"
2. Se muestran todos los métodos guardados
3. Usuario puede:
   - Agregar nuevo método (abre Billing Portal)
   - Establecer método predeterminado
   - Eliminar método

### 6. Ver Historial de Transacciones

1. Usuario va al tab "Historial"
2. Se muestra timeline de todas las transacciones
3. Información incluye:
   - Fecha y hora
   - Monto
   - Estado (Exitoso/Fallido/Pendiente/etc)
   - Método de pago
   - Descripción

## Integraciones API

### Endpoints Utilizados

- `GET /api/billing/subscriptions` - Obtener suscripción actual
- `POST /api/billing/subscriptions` - Crear nueva suscripción
- `PATCH /api/billing/subscriptions` - Actualizar suscripción (cancelar/reanudar)
- `POST /api/billing/checkout` - Crear sesión de Stripe Checkout
- `POST /api/billing/portal` - Obtener URL del Billing Portal
- `GET /api/billing/invoices` - Listar facturas
- `GET /api/billing/payment-methods` - Listar métodos de pago

### Request/Response Types

Todos los tipos están definidos en `packages/types/src/billing.ts`:

- `Subscription` - Datos de suscripción
- `Invoice` - Datos de factura
- `PaymentMethod` - Datos de método de pago
- `PaymentTransaction` - Datos de transacción
- `CreateCheckoutSessionRequest/Response` - Checkout
- `BillingPortalRequest/Response` - Portal

## Configuración de Planes

Los planes están configurados en `PlanComparison.tsx`:

```typescript
const PLAN_PRICING = {
  starter: { monthly: 19900, yearly: 199000 },    // €199/mo, €1990/yr
  pro: { monthly: 29900, yearly: 299000 },        // €299/mo, €2990/yr
  enterprise: { monthly: 59900, yearly: 599000 }, // €599/mo, €5990/yr
}

const PLAN_FEATURES = {
  starter: ['100 usuarios', '10 GB', '50k API calls', ...],
  pro: ['500 usuarios', '100 GB', '500k API calls', ...],
  enterprise: ['Ilimitado', 'Ilimitado', 'Ilimitado', ...],
}
```

Para modificar planes:
1. Actualizar `PLAN_PRICING` con nuevos precios (en centavos)
2. Actualizar `PLAN_FEATURES` con nuevas características
3. Actualizar también en backend (`packages/types/src/billing.ts`)

## Estados y Loading

### Loading States

Todos los componentes manejan estado de carga:

```typescript
{loading && (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
)}
```

### Empty States

Componentes muestran estado vacío cuando no hay datos:

```typescript
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon className="h-12 w-12 text-muted-foreground" />
    <h3>Sin {resource}</h3>
    <p>No hay {resource} disponibles</p>
  </div>
)}
```

### Error Handling

Los errores se manejan con toasts:

```typescript
try {
  await action()
  toast({ title: 'Éxito', description: 'Acción completada' })
} catch (error) {
  toast({
    title: 'Error',
    description: 'No se pudo completar la acción',
    variant: 'destructive',
  })
}
```

## Responsive Design

Todos los componentes son responsive:

- **Desktop**: Tabs horizontales, grid de 3 columnas para planes
- **Tablet**: Tabs horizontales, grid de 2 columnas
- **Mobile**: Tabs en grid 2x2, stack vertical

```typescript
// Ejemplo de responsive grid
<div className="grid gap-6 md:grid-cols-3">
  {/* Contenido */}
</div>
```

## Mock Data

Para desarrollo local sin Stripe configurado, se utiliza mock data:

```typescript
// En page.tsx
const mockTransactions: PaymentTransaction[] = [...]
```

El indicador `<MockDataIndicator />` se muestra en la parte superior cuando se usan datos mock.

## Testing

Los tests están en `__tests__/facturacion/`:

```bash
# Ejecutar tests
npm test facturacion

# Tests con coverage
npm test -- --coverage facturacion
```

### Tests Implementados

- `SubscriptionCard.test.tsx` - Tests del componente de suscripción
- `PlanCard.test.tsx` - Tests del componente de plan
- `useBillingData.test.ts` - Tests del hook de datos

## Próximas Mejoras

- [ ] Filtros en tabla de facturas (por fecha, estado)
- [ ] Paginación en facturas si >20 items
- [ ] Búsqueda en transacciones
- [ ] Exportar facturas en CSV
- [ ] Métricas de uso (storage, API calls, etc)
- [ ] Comparación de planes más detallada
- [ ] Historial de cambios de plan
- [ ] Notificaciones de vencimiento

## Notas de Seguridad

- Nunca exponer `stripeSecretKey` en el frontend
- Todas las operaciones de pago se hacen server-side
- Los webhooks de Stripe validan la firma
- Los datos sensibles se manejan solo en backend

## Troubleshooting

### Error: "Failed to fetch data"

- Verificar que las APIs backend estén corriendo
- Revisar console del navegador para detalles
- Verificar que Stripe esté configurado correctamente

### Redirect Loop en Checkout

- Verificar `successUrl` y `cancelUrl` en la configuración
- Asegurarse de que no haya parámetros duplicados

### Métodos de pago no aparecen

- Verificar que el customer de Stripe tenga métodos guardados
- Revisar permisos de API de Stripe
- Verificar que el webhook esté configurado

## Contribuir

Al agregar nuevas funcionalidades:

1. Actualizar tipos en `packages/types/src/billing.ts`
2. Implementar endpoint backend
3. Crear componente frontend
4. Agregar tests
5. Actualizar esta documentación

---

**Última actualización:** 2024-12-28
**Versión:** 1.0.0

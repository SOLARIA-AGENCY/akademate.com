'use client';

import { useState } from 'react';

interface Ticket {
  id: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'general';
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
  messages: number;
}

const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    tenantId: '1',
    tenantName: 'CEP Formación',
    subject: 'Error al cargar el listado de alumnos',
    description: 'Cuando intento cargar la página de alumnos, aparece un error 500...',
    status: 'open',
    priority: 'high',
    category: 'technical',
    createdAt: '2025-12-07T09:30:00',
    updatedAt: '2025-12-07T09:30:00',
    assignedTo: null,
    messages: 1,
  },
  {
    id: 'TKT-002',
    tenantId: '3',
    tenantName: 'Instituto Barcelona',
    subject: 'Solicitud de aumento de límite de usuarios',
    description: 'Necesitamos ampliar el límite de usuarios de 28 a 50...',
    status: 'in_progress',
    priority: 'medium',
    category: 'billing',
    createdAt: '2025-12-06T14:20:00',
    updatedAt: '2025-12-07T08:15:00',
    assignedTo: 'Carlos Ruiz',
    messages: 4,
  },
  {
    id: 'TKT-003',
    tenantId: '2',
    tenantName: 'Academia Madrid',
    subject: 'Cómo configurar la integración con Mailchimp',
    description: 'No encuentro la opción para conectar Mailchimp...',
    status: 'waiting',
    priority: 'low',
    category: 'general',
    createdAt: '2025-12-05T11:45:00',
    updatedAt: '2025-12-06T16:30:00',
    assignedTo: 'Ana García',
    messages: 3,
  },
  {
    id: 'TKT-004',
    tenantId: '4',
    tenantName: 'Centro Formativo Valencia',
    subject: 'Problema con el pago de la suscripción',
    description: 'El pago ha sido rechazado pero la tarjeta es válida...',
    status: 'open',
    priority: 'urgent',
    category: 'billing',
    createdAt: '2025-12-07T07:00:00',
    updatedAt: '2025-12-07T07:00:00',
    assignedTo: null,
    messages: 1,
  },
  {
    id: 'TKT-005',
    tenantId: '1',
    tenantName: 'CEP Formación',
    subject: 'Sugerencia: Exportar a Excel con formato personalizado',
    description: 'Sería muy útil poder exportar los datos con un formato...',
    status: 'resolved',
    priority: 'low',
    category: 'feature_request',
    createdAt: '2025-12-01T10:00:00',
    updatedAt: '2025-12-04T15:00:00',
    assignedTo: 'Pedro López',
    messages: 6,
  },
  {
    id: 'TKT-006',
    tenantId: '3',
    tenantName: 'Instituto Barcelona',
    subject: 'Consulta sobre RGPD y retención de datos',
    description: 'Necesitamos saber cuánto tiempo se retienen los datos...',
    status: 'closed',
    priority: 'medium',
    category: 'general',
    createdAt: '2025-11-28T09:00:00',
    updatedAt: '2025-12-02T11:30:00',
    assignedTo: 'Ana García',
    messages: 8,
  },
];

const teamMembers = [
  { id: '1', name: 'Carlos Ruiz', role: 'Tech Lead', activeTickets: 3 },
  { id: '2', name: 'Ana García', role: 'Customer Success', activeTickets: 5 },
  { id: '3', name: 'Pedro López', role: 'Product Manager', activeTickets: 2 },
];

export default function SoportePage() {
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;
  const avgResponseTime = '2.4h'; // Mock data

  const getStatusBadge = (status: Ticket['status']) => {
    const styles = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-500',
    };
    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      waiting: 'Esperando',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const styles = {
      low: 'text-slate-400',
      medium: 'text-blue-400',
      high: 'text-orange-400',
      urgent: 'text-red-400',
    };
    const icons = {
      low: '●',
      medium: '●●',
      high: '●●●',
      urgent: '🔥',
    };
    return (
      <span className={`text-sm font-medium ${styles[priority]}`}>
        {icons[priority]}
      </span>
    );
  };

  const getCategoryLabel = (category: Ticket['category']) => {
    const labels = {
      technical: 'Técnico',
      billing: 'Facturación',
      feature_request: 'Sugerencia',
      general: 'General',
    };
    return labels[category];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
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
              <p className="text-slate-400 text-sm">Tickets Abiertos</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{openTickets}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">En Progreso</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{inProgressTickets}</p>
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
              <p className="text-slate-400 text-sm">Urgentes</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{urgentTickets}</p>
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
              <p className="text-slate-400 text-sm">Tiempo Respuesta</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{avgResponseTime}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <h2 className="text-lg font-semibold text-white">Tickets de Soporte</h2>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="open">Abiertos</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="waiting">Esperando</option>
                    <option value="resolved">Resueltos</option>
                    <option value="closed">Cerrados</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-700">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-4 hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-slate-400 text-sm">{ticket.id}</span>
                        {getStatusBadge(ticket.status)}
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                          {getCategoryLabel(ticket.category)}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">{ticket.subject}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span>{ticket.tenantName}</span>
                        <span>•</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                        <span>•</span>
                        <span>{ticket.messages} mensajes</span>
                        {ticket.assignedTo && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400">{ticket.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team & Quick Stats */}
        <div className="space-y-6">
          {/* Team */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Equipo de Soporte</h3>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm">{member.name}</p>
                      <p className="text-slate-400 text-xs">{member.role}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                    {member.activeTickets} activos
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Estadísticas Semanales</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Tickets resueltos</span>
                <span className="text-green-400 font-medium">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Satisfacción cliente</span>
                <span className="text-green-400 font-medium">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Primera respuesta</span>
                <span className="text-blue-400 font-medium">1.2h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Tiempo resolución</span>
                <span className="text-blue-400 font-medium">8.5h</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-slate-300 text-sm">Ticket TKT-005 resuelto</p>
                  <p className="text-slate-500 text-xs">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-slate-300 text-sm">Carlos asignado a TKT-002</p>
                  <p className="text-slate-500 text-xs">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-slate-300 text-sm">Nuevo ticket TKT-001</p>
                  <p className="text-slate-500 text-xs">Hace 6 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-slate-400">{selectedTicket.id}</span>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                <p className="text-slate-400 text-sm mt-1">{selectedTicket.tenantName} • {formatDate(selectedTicket.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-750 p-4 rounded-lg mb-6">
                <p className="text-slate-300">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Estado</label>
                  <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                    <option value="open">Abierto</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="waiting">Esperando</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Asignar a</label>
                  <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                    <option value="">Sin asignar</option>
                    <option value="1">Carlos Ruiz</option>
                    <option value="2">Ana García</option>
                    <option value="3">Pedro López</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Responder</label>
                <textarea
                  rows={4}
                  placeholder="Escribe una respuesta..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-between">
              <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Cerrar Ticket
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Enviar Respuesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

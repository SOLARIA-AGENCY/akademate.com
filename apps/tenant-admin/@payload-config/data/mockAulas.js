// Mock data for classroom availability (temporary until full implementation)
// Sample classroom data
export const aulasMockData = [
    {
        id: 'aula-1',
        nombre: 'Aula Principal',
        codigo: 'A-101',
        sede: 'CEP Norte',
        capacidad: 30,
    },
    {
        id: 'aula-2',
        nombre: 'Laboratorio',
        codigo: 'LAB-1',
        sede: 'CEP Sur',
        capacidad: 25,
    },
];
// Sample schedule data
export const horariosDetalladosMock = [
    {
        aula_id: 'aula-1',
        dia: 'lunes',
        hora_inicio: '08:00',
        hora_fin: '10:00',
        curso_nombre: 'Gestión Administrativa',
        profesor: 'María García',
        color: '#3b82f6',
    },
    {
        aula_id: 'aula-1',
        dia: 'miercoles',
        hora_inicio: '14:00',
        hora_fin: '18:00',
        curso_nombre: 'Marketing Digital',
        profesor: 'Ana Rodríguez',
        color: '#f59e0b',
    },
];
//# sourceMappingURL=mockAulas.js.map
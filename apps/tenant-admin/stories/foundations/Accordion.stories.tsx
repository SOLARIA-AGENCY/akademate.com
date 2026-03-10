import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@payload-config/components/ui/accordion'

const meta = {
  title: 'Foundations/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="requisitos">
        <AccordionTrigger>¿Cuáles son los requisitos de ingreso?</AccordionTrigger>
        <AccordionContent>
          Para inscribirse necesitas contar con bachillerato completo y conocimientos básicos de
          informática. No se requiere experiencia previa en programación.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="duracion">
        <AccordionTrigger>¿Cuánto dura el curso?</AccordionTrigger>
        <AccordionContent>
          El programa tiene una duración de 6 meses, con clases de lunes a viernes en horario
          vespertino (18:00–21:00 h).
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="certificado">
        <AccordionTrigger>¿Obtengo un certificado al finalizar?</AccordionTrigger>
        <AccordionContent>
          Sí, al completar el 80% de asistencia y aprobar los proyectos finales recibirás un
          certificado oficial avalado por la institución.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-96">
      <AccordionItem value="modulo1">
        <AccordionTrigger>Módulo 1 — Fundamentos Web</AccordionTrigger>
        <AccordionContent>
          HTML5 semántico, CSS3, Flexbox, Grid. Introducción a la maquetación responsive.
          Duración: 3 semanas.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="modulo2">
        <AccordionTrigger>Módulo 2 — JavaScript Moderno</AccordionTrigger>
        <AccordionContent>
          ES6+, funciones asíncronas, fetch API, manipulación del DOM. Primer proyecto práctico.
          Duración: 4 semanas.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="modulo3">
        <AccordionTrigger>Módulo 3 — React y Ecosistema</AccordionTrigger>
        <AccordionContent>
          Componentes, hooks, estado global con Context API. Integración con APIs REST.
          Duración: 5 semanas.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const PreExpanded: Story = {
  render: () => (
    <Accordion type="single" defaultValue="politica" collapsible className="w-96">
      <AccordionItem value="politica">
        <AccordionTrigger>Política de cancelación</AccordionTrigger>
        <AccordionContent>
          El alumno puede solicitar la baja hasta 7 días antes del inicio del curso con reembolso
          completo. Pasado ese plazo se aplica un cargo del 30%.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="pagos">
        <AccordionTrigger>Formas de pago aceptadas</AccordionTrigger>
        <AccordionContent>
          Aceptamos tarjeta de crédito/débito, transferencia bancaria y pago en cuotas sin interés
          (hasta 6 mensualidades).
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

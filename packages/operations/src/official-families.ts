export type OfficialFamily = {
  code: string
  name: string
}

export const OFFICIAL_PROFESSIONAL_FAMILIES: OfficialFamily[] = [
  { code: 'AFD', name: 'Actividades Físicas y Deportivas' },
  { code: 'ADG', name: 'Administración y Gestión' },
  { code: 'AGA', name: 'Agraria' },
  { code: 'ARG', name: 'Artes Gráficas' },
  { code: 'ART', name: 'Artes y Artesanías' },
  { code: 'COM', name: 'Comercio y Marketing' },
  { code: 'EOC', name: 'Edificación y Obra Civil' },
  { code: 'ELE', name: 'Electricidad y Electrónica' },
  { code: 'ENA', name: 'Energía y Agua' },
  { code: 'FME', name: 'Fabricación Mecánica' },
  { code: 'HOT', name: 'Hostelería y Turismo' },
  { code: 'IMP', name: 'Imagen Personal' },
  { code: 'IMS', name: 'Imagen y Sonido' },
  { code: 'INA', name: 'Industrias Alimentarias' },
  { code: 'IEX', name: 'Industrias Extractivas' },
  { code: 'IFC', name: 'Informática y Comunicaciones' },
  { code: 'IMA', name: 'Instalación y Mantenimiento' },
  { code: 'MAM', name: 'Madera, Mueble y Corcho' },
  { code: 'MAP', name: 'Marítimo Pesquera' },
  { code: 'QUI', name: 'Química' },
  { code: 'SAN', name: 'Sanidad' },
  { code: 'SEA', name: 'Seguridad y Medio Ambiente' },
  { code: 'SSC', name: 'Servicios Socioculturales y a la Comunidad' },
  { code: 'TCP', name: 'Textil, Confección y Piel' },
  { code: 'TMV', name: 'Transporte y Mantenimiento de Vehículos' },
  { code: 'VIC', name: 'Vidrio y Cerámica' },
]

export function officialFamilyByCode(code: string): OfficialFamily | null {
  return OFFICIAL_PROFESSIONAL_FAMILIES.find((family) => family.code === code) ?? null
}

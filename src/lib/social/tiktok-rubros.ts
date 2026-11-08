// Los rubros de la comparación de TikTok for Business, aparte de `tiktok-numeros.ts` para que el
// selector del navegador (`rubro-tiktok.tsx`) los use sin arrastrar el servidor.

/** Los rubros de `/business/benchmark/`, con su nombre en español. */
export const RUBROS: Record<string, string> = {
  ART_AND_CRAFTS: 'Arte y manualidades',
  AUTOMOTIVE_AND_TRANSPORTATION: 'Autos y transporte',
  BABY: 'Bebés',
  BEAUTY: 'Belleza',
  CLOTHING_AND_ACCESSORIES: 'Ropa y accesorios',
  EDUCATION_AND_TRAINING: 'Educación',
  ELECTRONICS: 'Electrónica',
  FINANCE_AND_INVESTING: 'Finanzas',
  FOOD_AND_BEVERAGE: 'Comida y bebida',
  GAMING: 'Videojuegos',
  HEALTH_AND_WELLNESS: 'Salud y bienestar',
  HOME_FURNITURE_AND_APPLIANCES: 'Hogar',
  MACHINERY_AND_EQUIPMENT: 'Maquinaria',
  MEDIA_AND_ENTERTAINMENT: 'Medios y entretención',
  PERSONAL_BLOG: 'Creador de contenido',
  PETS: 'Mascotas',
  PROFESSIONAL_SERVICES: 'Servicios profesionales',
  PUBLIC_ADMINISTRATION: 'Sector público',
  REAL_ESTATE: 'Propiedades',
  RESTAURANTS_AND_BARS: 'Restaurantes y bares',
  SHOPPING_AND_RETAIL: 'Tiendas',
  SOFTWARE_AND_APPS: 'Software y apps',
  SPORTS_FITNESS_AND_OUTDOORS: 'Deporte y aire libre',
  TRAVEL_AND_TOURISM: 'Viajes y turismo',
  OTHERS: 'Otro',
}

/** El de un creador, mientras el dueño no elija otro. */
export const RUBRO_POR_DEFECTO = 'PERSONAL_BLOG'

export function esRubro(valor: unknown): valor is string {
  return typeof valor === 'string' && Object.hasOwn(RUBROS, valor)
}

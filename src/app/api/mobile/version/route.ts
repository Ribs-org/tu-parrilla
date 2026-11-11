import { NextResponse } from 'next/server'
import { VERSION_DE_LA_APP } from '@/lib/version-de-la-app'

/**
 * La versión recomendada y la mínima de la app del teléfono, por plataforma
 * (`src/lib/version-de-la-app.ts`). Sin token, a diferencia del resto de `/api/mobile/`: la app
 * la lee también en la pantalla de entrada, y una versión demasiado vieja tiene que poder
 * enterarse aunque su sesión ya no valga. No dice nada de nadie.
 */
export function GET() {
  return NextResponse.json(VERSION_DE_LA_APP)
}

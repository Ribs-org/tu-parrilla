import { useEffect, useState } from 'react'

/**
 * La hora de ahora, en milisegundos, que se corre sola cada medio minuto: la de la línea de
 * «ahora» de La Parrilla, que separa lo que ya tuvo su hora de lo que viene.
 */
export function useAhora(): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(intervalo)
  }, [])
  return ahora
}

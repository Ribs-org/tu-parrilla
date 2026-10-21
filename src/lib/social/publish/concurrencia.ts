// Las dos piezas con las que el lote (`batch.ts`) baja varias filas a la vez sin pasarse:
// cuántas filas corren juntas (`enParalelo`) y cuánta media cabe en memoria al mismo tiempo
// (`Cupo`). Van aparte porque no saben nada de posts, y así se prueban solas.

/**
 * `fn` sobre cada elemento, con `n` a la vez como mucho, y los resultados en el orden de
 * entrada aunque terminen en otro. Si `fn` lanza, lanza esto, como `Promise.all`.
 */
export async function enParalelo<T, R>(
  elementos: readonly T[],
  n: number,
  fn: (elemento: T, indice: number) => Promise<R>,
): Promise<R[]> {
  const resultados = new Array<R>(elementos.length)
  let siguiente = 0
  const trabajar = async () => {
    while (siguiente < elementos.length) {
      const indice = siguiente++
      resultados[indice] = await fn(elementos[indice]!, indice)
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, elementos.length) }, trabajar))
  return resultados
}

/**
 * Un cupo con peso: deja pasar mientras lo tomado quepa en `total`, y a los demás los hace
 * esperar en orden de llegada (uno liviano no se adelanta a uno pesado que llegó antes, o
 * el pesado podría no pasar nunca). Algo que pesa más que el total entero pasa solo, cuando
 * no queda nada adentro: si no, no pasaría jamás.
 */
export class Cupo {
  private tomado = 0
  private readonly espera: Array<{ peso: number; pasar: () => void }> = []

  constructor(private readonly total: number) {}

  /** Espera a que quepa `peso` y devuelve con qué soltarlo. Soltar dos veces no suelta de más. */
  tomar(peso: number): Promise<() => void> {
    return new Promise((pasar) => {
      this.espera.push({ peso, pasar: () => pasar(this.soltador(peso)) })
      this.avanzar()
    })
  }

  private avanzar(): void {
    while (this.espera.length > 0) {
      const primero = this.espera[0]!
      if (this.tomado > 0 && this.tomado + primero.peso > this.total) return
      this.espera.shift()
      this.tomado += primero.peso
      primero.pasar()
    }
  }

  private soltador(peso: number): () => void {
    let suelto = false
    return () => {
      if (suelto) return
      suelto = true
      this.tomado -= peso
      this.avanzar()
    }
  }
}

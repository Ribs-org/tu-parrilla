import { describe, expect, it } from 'vitest'
import { Cupo, enParalelo } from './concurrencia'

const pausa = (ms: number) => new Promise((seguir) => setTimeout(seguir, ms))

describe('enParalelo', () => {
  it('no corre más de n a la vez, y los corre todos', async () => {
    let corriendo = 0
    let maximo = 0
    const hechos: number[] = []
    await enParalelo([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      corriendo++
      maximo = Math.max(maximo, corriendo)
      await pausa(5)
      corriendo--
      hechos.push(n)
    })
    expect(maximo).toBe(3)
    expect([...hechos].sort()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('devuelve los resultados en el orden de entrada aunque terminen en otro', async () => {
    const resultados = await enParalelo([30, 1, 10], 3, async (ms, i) => {
      await pausa(ms)
      return `${i}:${ms}`
    })
    expect(resultados).toEqual(['0:30', '1:1', '2:10'])
  })

  it('con una lista vacía no hace nada', async () => {
    expect(await enParalelo([], 4, async () => 1)).toEqual([])
  })
})

describe('Cupo', () => {
  it('deja pasar mientras quepa, y al que no cabe lo hace esperar a que alguien suelte', async () => {
    const cupo = new Cupo(10)
    const soltarA = await cupo.tomar(6)
    let paso = false
    const b = cupo.tomar(6).then((soltar) => {
      paso = true
      return soltar
    })
    await pausa(1)
    expect(paso).toBe(false)
    soltarA()
    const soltarB = await b
    expect(paso).toBe(true)
    soltarB()
  })

  it('en orden de llegada: uno liviano no se adelanta al pesado que espera', async () => {
    const cupo = new Cupo(10)
    const soltarA = await cupo.tomar(8)
    const orden: string[] = []
    const pesado = cupo.tomar(8).then((soltar) => (orden.push('pesado'), soltar))
    const liviano = cupo.tomar(1).then((soltar) => (orden.push('liviano'), soltar))
    await pausa(1)
    expect(orden).toEqual([])
    soltarA()
    ;(await pesado)()
    ;(await liviano)()
    expect(orden).toEqual(['pesado', 'liviano'])
  })

  it('lo que pesa más que el total pasa solo, cuando no queda nada adentro', async () => {
    const cupo = new Cupo(10)
    const soltarA = await cupo.tomar(3)
    let paso = false
    const enorme = cupo.tomar(50).then((soltar) => ((paso = true), soltar))
    await pausa(1)
    expect(paso).toBe(false)
    soltarA()
    const soltarEnorme = await enorme
    expect(paso).toBe(true)
    // Y mientras está adentro, nadie más entra.
    let otro = false
    const siguiente = cupo.tomar(1).then((soltar) => ((otro = true), soltar))
    await pausa(1)
    expect(otro).toBe(false)
    soltarEnorme()
    ;(await siguiente)()
  })

  it('soltar dos veces no devuelve de más', async () => {
    const cupo = new Cupo(10)
    const soltarA = await cupo.tomar(10)
    soltarA()
    soltarA()
    const soltarB = await cupo.tomar(10)
    let paso = false
    const c = cupo.tomar(1).then((soltar) => ((paso = true), soltar))
    await pausa(1)
    expect(paso).toBe(false)
    soltarB()
    ;(await c)()
  })
})

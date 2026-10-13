import { describe, expect, it } from 'vitest'
import {
  MAX_NOMBRE,
  NOMBRE_LARGO,
  NOMBRE_VACIO,
  PREFIJO,
  esLlaveDelDespliegue,
  finalDe,
  generarLlave,
  hashLlave,
  llaveDelHeader,
  validarNombre,
} from './llaves-api'

describe('generarLlave', () => {
  it('lleva el prefijo y 32 bytes en base64url, sin caracteres que rompan un header', () => {
    const llave = generarLlave()
    expect(llave.startsWith(PREFIJO)).toBe(true)
    expect(llave.slice(PREFIJO.length)).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('no repite', () => {
    const llaves = new Set(Array.from({ length: 50 }, generarLlave))
    expect(llaves.size).toBe(50)
  })
})

describe('hashLlave', () => {
  it('es estable y no contiene la llave', () => {
    const llave = generarLlave()
    expect(hashLlave(llave)).toBe(hashLlave(llave))
    expect(hashLlave(llave)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashLlave(llave)).not.toContain(llave.slice(PREFIJO.length, PREFIJO.length + 8))
  })

  it('dos llaves distintas dan hashes distintos', () => {
    expect(hashLlave(`${PREFIJO}a`)).not.toBe(hashLlave(`${PREFIJO}b`))
  })
})

describe('finalDe', () => {
  it('son los últimos cuatro caracteres', () => {
    expect(finalDe('tp_abcdefgh')).toBe('efgh')
  })
})

describe('llaveDelHeader', () => {
  it('saca la llave de un Bearer', () => {
    expect(llaveDelHeader('Bearer tp_abc')).toBe('tp_abc')
  })

  it('sin header, sin Bearer o con Bearer vacío no hay llave', () => {
    expect(llaveDelHeader(null)).toBeNull()
    expect(llaveDelHeader('tp_abc')).toBeNull()
    expect(llaveDelHeader('Basic tp_abc')).toBeNull()
    expect(llaveDelHeader('Bearer ')).toBeNull()
    expect(llaveDelHeader('Bearer    ')).toBeNull()
  })
})

describe('esLlaveDelDespliegue', () => {
  it('coincide solo con la configurada, exacta', () => {
    expect(esLlaveDelDespliegue('secreto', 'secreto')).toBe(true)
    expect(esLlaveDelDespliegue('secret', 'secreto')).toBe(false)
    expect(esLlaveDelDespliegue('secretx', 'secreto')).toBe(false)
  })

  it('sin llave configurada no coincide nada, ni siquiera la vacía', () => {
    expect(esLlaveDelDespliegue('', undefined)).toBe(false)
    expect(esLlaveDelDespliegue('cualquiera', undefined)).toBe(false)
    expect(esLlaveDelDespliegue('', '')).toBe(false)
  })
})

describe('validarNombre', () => {
  it('limpia los espacios', () => {
    expect(validarNombre('  Editor de videos ')).toEqual({ nombre: 'Editor de videos' })
  })

  it('vacío o solo espacios pide un nombre', () => {
    expect(validarNombre('')).toEqual({ error: NOMBRE_VACIO })
    expect(validarNombre('   ')).toEqual({ error: NOMBRE_VACIO })
  })

  it('el tope cuenta después de limpiar', () => {
    expect(validarNombre('a'.repeat(MAX_NOMBRE))).toEqual({ nombre: 'a'.repeat(MAX_NOMBRE) })
    expect(validarNombre(` ${'a'.repeat(MAX_NOMBRE)} `)).toEqual({ nombre: 'a'.repeat(MAX_NOMBRE) })
    expect(validarNombre('a'.repeat(MAX_NOMBRE + 1))).toEqual({ error: NOMBRE_LARGO })
  })
})

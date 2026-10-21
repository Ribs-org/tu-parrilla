import { createCipheriv, hkdfSync, randomBytes } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { decryptToken, encryptToken } from './crypto'

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-do-not-use-in-production'
})

describe('token encryption', () => {
  it('devuelve el valor original', () => {
    const token = 'IGQVJYc0hBbUxxx-long-lived-token'
    expect(decryptToken(encryptToken(token))).toBe(token)
  })

  it('produce un texto cifrado distinto cada vez', () => {
    expect(encryptToken('mismo')).not.toBe(encryptToken('mismo'))
  })

  it('rechaza un texto cifrado manipulado en vez de devolver basura', () => {
    const payload = encryptToken('token')
    const parts = payload.split('.')
    parts[3] = Buffer.from('otra-cosa').toString('base64url')
    expect(() => decryptToken(parts.join('.'))).toThrow()
  })

  it('rechaza una etiqueta recortada, aunque sea el comienzo de la verdadera', () => {
    const parts = encryptToken('token').split('.')
    parts[2] = Buffer.from(parts[2]!, 'base64url').subarray(0, 4).toString('base64url')
    expect(() => decryptToken(parts.join('.'))).toThrow()
  })

  it('lo cifrado antes de fijar el largo de la etiqueta se sigue leyendo', () => {
    // Un token como los que ya están en la base: `createCipheriv` sin opciones da 16 bytes.
    const llave = Buffer.from(hkdfSync('sha256', process.env.AUTH_SECRET!, 'portafolio-social-v1', 'token', 32))
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', llave, iv)
    const cuerpo = Buffer.concat([cipher.update('de-antes', 'utf8'), cipher.final()])
    const viejo = ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), cuerpo.toString('base64url')].join('.')
    expect(decryptToken(viejo)).toBe('de-antes')
  })

  it('rechaza un formato desconocido', () => {
    expect(() => decryptToken('no-es-un-payload')).toThrow()
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAkademateMcpConfig } from './config.ts'

test('fails closed when the Akademate endpoint is missing', () => {
  assert.throws(
    () => resolveAkademateMcpConfig({ AKADEMATE_API_KEY: 'ak_test_explicit' }),
    /AKADEMATE_API_URL is required/,
  )
})

test('fails closed when the API key is missing', () => {
  assert.throws(
    () => resolveAkademateMcpConfig({ AKADEMATE_API_URL: 'https://tenant.akademate.com' }),
    /AKADEMATE_API_KEY is required/,
  )
})

test('normalizes an explicit HTTPS endpoint and trims the key', () => {
  assert.deepEqual(
    resolveAkademateMcpConfig({
      AKADEMATE_API_URL: ' https://tenant.akademate.com/ ',
      AKADEMATE_API_KEY: ' ak_test_explicit ',
    }),
    {
      apiUrl: 'https://tenant.akademate.com',
      apiKey: 'ak_test_explicit',
    },
  )
})

test('allows insecure HTTP only for loopback development endpoints', () => {
  assert.equal(
    resolveAkademateMcpConfig({
      AKADEMATE_API_URL: 'http://127.0.0.1:3109/',
      AKADEMATE_API_KEY: 'ak_test_loopback',
    }).apiUrl,
    'http://127.0.0.1:3109',
  )

  assert.equal(
    resolveAkademateMcpConfig({
      AKADEMATE_API_URL: 'http://[::1]:3109/',
      AKADEMATE_API_KEY: 'ak_test_ipv6_loopback',
    }).apiUrl,
    'http://[::1]:3109',
  )

  assert.throws(
    () =>
      resolveAkademateMcpConfig({
        AKADEMATE_API_URL: 'http://tenant.akademate.test',
        AKADEMATE_API_KEY: 'ak_test_insecure',
      }),
    /must use HTTPS unless it targets loopback/,
  )
})

test('rejects credential-bearing and unsupported endpoint URLs', () => {
  for (const apiUrl of [
    'https://user:password@tenant.akademate.com',
    'file:///tmp/akademate-api',
  ]) {
    assert.throws(
      () =>
        resolveAkademateMcpConfig({
          AKADEMATE_API_URL: apiUrl,
          AKADEMATE_API_KEY: 'ak_test_invalid_url',
        }),
      /must not contain credentials|must use HTTP or HTTPS/,
    )
  }
})

#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDockerContext, validateNextIsolation } from './lib/akademate-next-isolation.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const composeText = readFileSync(path.join(root, 'infrastructure/akademate-next/compose.yaml'), 'utf8')
const envText = readFileSync(path.join(root, 'infrastructure/akademate-next/.env.example'), 'utf8')
const result = validateNextIsolation({ composeText, envText })
validateDockerContext(readFileSync(path.join(root, '.dockerignore'), 'utf8'))

process.stdout.write(`Akademate Next isolation verified: ${result.project}\n`)

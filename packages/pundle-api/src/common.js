// @flow

import type { Severity, ComponentType } from './types'

export const VALID_TYPES: Set<ComponentType> = new Set([
  'resolver',
  'reporter',
  'loader',
  'transformer',
  'plugin',
  'generator',
])
export const VALID_SEVERITIES: Set<Severity> = new Set(['info', 'warning', 'error'])

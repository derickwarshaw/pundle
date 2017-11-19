// @flow

import type { Severity, ComponentType } from './types'

export const VALID_TYPES: Set<ComponentType> = new Set([
  'resolver',
  'reporter',
  'loader',
  'transformer',
  'plugin',
  'generator',
  'post-generator',
  'file-post-generator',
  'job-transformer',
])
export const VALID_SEVERITIES: Set<Severity> = new Set(['info', 'warning', 'error'])

export function normalizeFileName(fileName: string): string {
  if (fileName.charAt(0) !== '.') {
    return `./${fileName}`
  }
  return fileName
}

// @flow

import fs from 'fs'
import path from 'path'
import invariant from 'assert'
import { Components, ComponentOptions } from 'pundle-api'

import get from './get'
import loadConfig from './load-config'
import type { AcceptedConfig, ParsedConfig } from '../types'

function fileAccessible(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.R_OK)
    return true
  } catch (_) {
    return false
  }
}
function validateConfig(config: Object): void {
  invariant(config && typeof config === 'object', 'Pundle expects config to be non-null object')
  invariant(
    config.rootDirectory && typeof config.rootDirectory === 'string',
    'Pundle expects config.rootDirectory to be non-null string',
  )
  invariant(
    ['undefined', 'boolean'].includes(typeof config.configFile),
    `Pundle expects config.configFile to be either undefined or boolean, given: ${typeof config.configFile}`,
  )
  invariant(
    ['undefined', 'string'].includes(typeof config.configFileName),
    `Pundle expects config.configFileName to be either undefined or string, given: ${typeof config.configFileName}`,
  )
  if (config.output) {
    invariant(
      config.output.rootDirectory && typeof config.output.rootDirectory === 'string',
      'Pundle expects config.output.rootDirectory to be a string',
    )
    invariant(path.isAbsolute(config.output.rootDirectory), 'Pundle expects config.output.rootDirectory to be absolute')
    invariant(
      config.output.template && typeof config.output.template === 'string',
      'Pundle expects config.output.template to be a string',
    )
    invariant(
      config.output.sourceMapTemplate && typeof config.output.sourceMapTemplate === 'string',
      'Pundle expects config.output.sourceMapTemplate to be a string',
    )
  }
}

export default function getConfig(config: AcceptedConfig): ParsedConfig {
  validateConfig(config)
  if (!fileAccessible(config.rootDirectory)) {
    throw new Error(`Pundle root directory '${config.rootDirectory}' does not exist`)
  }

  const entry = []
  const rootDirectory = fs.realpathSync(config.rootDirectory)
  const target = get(config, 'target', 'browser')
  const configFile = get(config, 'configFile', true)
  const configFileName = get(config, 'configFileName', 'pundle.config.js')

  const options = new ComponentOptions()
  const components = new Components()
  const parsed = {
    config: {
      entry,
      target,
      rootDirectory,
      output: config.output,
    },
    options,
    components,
  }

  const givenEntry = get(config, 'entry', [])
  if (givenEntry) {
    if (Array.isArray(givenEntry)) {
      parsed.config.entry.push(...givenEntry)
    } else {
      parsed.config.entry.push(givenEntry)
    }
  }

  if (configFile) {
    const configFilePath = path.join(rootDirectory, configFileName)
    if (!fileAccessible(configFilePath)) {
      throw new Error(`Pundle cannot find configuration file '${configFileName}' in ${rootDirectory}`)
    }
    loadConfig(configFilePath, parsed)
  }

  if (!parsed.config.entry.length) {
    throw new Error(`Pundle expects config.entry to have at least 1 item`)
  }

  return parsed
}

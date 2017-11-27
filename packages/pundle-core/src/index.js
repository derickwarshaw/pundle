// @flow

import parseConfig from 'pundle-core-parse-config'
import { Context, type ChunkGenerated } from 'pundle-api'

import Compilation from './compilation'
import type { WatcherConfig, WatcherOutput } from './types'

class Pundle {
  context: Context

  constructor(context: Context) {
    this.context = context
  }
  async build(): Promise<Array<ChunkGenerated>> {
    return new Compilation(this.context).build()
  }
  async watch(config: WatcherConfig): Promise<WatcherOutput> {
    return new Compilation(this.context).watch(config)
  }
  async write(generated: Array<ChunkGenerated>): Promise<{ [string]: { outputPath: string, sourceMapPath: string } }> {
    return new Compilation(this.context).write(generated)
  }
}

export default async function getPundle(config: Object): Promise<Pundle> {
  const parsed = await parseConfig(config)
  const context = new Context(parsed.components, parsed.options, parsed.config)
  return new Pundle(context)
}

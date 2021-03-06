// @flow

import { getLockKeyForChunk } from './common'

import type File from './File'
import type { Chunk } from './types'

export default class Job {
  locks: Set<string>
  chunks: Array<Chunk>
  files: Map<string, File>
  oldFiles: Map<string, File>

  constructor() {
    this.locks = new Set()
    this.chunks = []
    this.files = new Map()

    // TODO: Restore this?
    this.oldFiles = new Map()
  }
  clone(): Job {
    const newJob = new Job()
    newJob.chunks = this.chunks.slice()
    newJob.oldFiles = new Map(this.oldFiles)
    this.files.forEach(file => {
      newJob.files.set(file.fileName, file.clone())
    })

    return newJob
  }
  deleteChunk(chunk: Chunk): void {
    const index = this.chunks.indexOf(chunk)
    if (index !== -1) {
      this.chunks.splice(index, 1)
    }
  }
  upsertChunk(chunk: Chunk): void {
    const lockKey = getLockKeyForChunk(chunk)
    const oldIndex = this.chunks.findIndex(entry => getLockKeyForChunk(entry) === lockKey)
    if (oldIndex !== -1) {
      this.chunks.splice(oldIndex, 1, chunk)
    } else {
      this.chunks.push(chunk)
    }
  }
  getSimilarChunk(chunk: Chunk): ?Chunk {
    const lockKey = getLockKeyForChunk(chunk)
    return this.chunks.find(entry => getLockKeyForChunk(entry) === lockKey)
  }
}

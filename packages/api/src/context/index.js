/* @flow */

import invariant from 'assert'
import pEachSeries from 'p-each-series'
import { Disposable } from 'sb-event-kit'
import { version as API_VERSION } from '../helpers'
import { MessageIssue, FileMessageIssue } from '../issues'

import FileChunk from '../file-chunk'
import * as Helpers from './helpers'
import type {
  File,
  FileImport,
  PundleConfig,
  ComponentAny,
  ResolverResult,
  GeneratorResult,
  ComponentConfigured,
} from '../../types'

type ContextState = {
  uid: Map<string, number>,
  files: Map<string, File>,
  chunks: Array<FileChunk>,
}

class Context {
  state: ContextState;
  config: PundleConfig;
  components: Set<ComponentConfigured>;

  constructor(config: PundleConfig) {
    this.state = {
      uid: new Map(),
      files: new Map(),
      chunks: [],
    }
    this.config = config
    this.components = new Set()
  }
  async load(): Promise<void> {
    // NOTE: If it's non-empty it means it's unserialized
    if (this.state.chunks.size) return
    await pEachSeries(this.config.entry, async (request) => {
      const chunk = await this.getChunk(null, [this.getImportRequest(request)], [])
      this.state.chunks.push(chunk)
    })
  }
  clone(): Context {
    const cloned = new Context(this.config)
    cloned.components = this.components
    return cloned
  }
  async report(report: Object): Promise<void> {
    let tried = false
    for (const entry of this.getComponents('reporter')) {
      await this.invokeComponent(entry, 'callback', [], [report])
      tried = true
    }
    if (!tried) {
      console.error(report)
    }
  }
  async resolveAdvanced(request: string, from: ?string = null, cached: boolean = true, exclude: Array<string> = []): Promise<ResolverResult> {
    const knownExtensions = Helpers.getAllKnownExtensions(this.components)
    const filteredComponents = this.getComponents('resolver', exclude)
    if (!filteredComponents.length) {
      throw new MessageIssue('No module resolver configured in Pundle. Try adding pundle-resolver-default to your configuration', 'error')
    }
    for (const entry of filteredComponents) {
      const result = await this.invokeComponent(entry, 'callback', [{ knownExtensions }], [request, from, cached, exclude])
      if (result && result.filePath) {
        return result
      }
    }
    throw new FileMessageIssue(from || this.config.rootDirectory, `Cannot find module '${request}'`, 'error')
  }
  async resolve(request: string, from: ?string = null, cached: boolean = true, exclude: Array<string> = []): Promise<string> {
    const resolved = await this.resolveAdvanced(request, from, cached, exclude)
    return resolved.filePath
  }
  async generate(given: Array<FileChunk>, generateConfig: Object = {}): Promise<Array<GeneratorResult>> {
    const chunks: Array<FileChunk> = given.slice()
    const results = []

    for (let i = 0, length = chunks.length; i < length; i++) {
      const chunk: FileChunk = chunks[i]
      const chunkMappings = { chunks: {} }

      const childChunks: Map<number, FileChunk> = new Map()
      chunk.files.forEach(function(file) {
        file.getChunks().forEach(function(entry) {
          childChunks.set(entry.id, entry)
        })
      })
      childChunks.forEach(function(entry) {
        chunkMappings.chunks[entry.getId()] = entry.getIdOrLabel()
      })

      let result
      for (const entry of this.getComponents('generator')) {
        result = await this.invokeComponent(entry, 'callback', [this.config.output, {
          label: chunk.getIdOrLabel(),
          mappings: chunkMappings,
        }, generateConfig], [
          chunk,
        ])
        if (result) {
          break
        }
      }
      if (!result) {
        throw new MessageIssue('No generator returned generated contents. Try adding pundle-generator-default to your configuration', 'error')
      }
      // Post-Transformer
      for (const entry of this.getComponents('post-transformer')) {
        const postTransformerResults = await this.invokeComponent(entry, 'callback', [], [result.contents])
        Helpers.mergeResult(result, postTransformerResults)
      }
      results.push(result)
    }

    return results
  }
  serialize(): string {
    const serializedUID = {}
    this.state.uid.forEach(function(value, key) {
      serializedUID[key] = value
    })

    return JSON.stringify({
      UID: serializedUID,
      chunks: this.state.chunks.map(c => c.serialize()),
    })
  }
  unserialize(contents: string, force: boolean = false) {
    if ((this.state.uid.size || this.state.chunks.length) && !force) {
      throw new Error('Cannot unserialize into non-empty state without force parameter')
    }

    const parsed = JSON.parse(contents)
    // Unserializing UID
    this.state.uid.clear()
    for (const key in parsed.UID) {
      if (!{}.hasOwnProperty.call(parsed.UID, key)) continue
      this.state.uid.set(key, parsed.UID[key])
    }
    // Unserializing chunks
    this.state.chunks = parsed.chunks.map(c => FileChunk.unserialize(c))
  }
  async getChunk(label: ?string = null, entries: Array<FileImport> = [], imports: Array<FileImport> = []): Promise<FileChunk> {
    const resolveImport = async (entry: FileImport) => {
      entry.resolved = await this.resolve(entry.request, entry.from)
    }

    const chunk = new FileChunk(this.getUID('chunk'), label)
    if (entries.length || imports.length) {
      await Promise.all(entries.map(resolveImport).concat(imports.map(resolveImport)))
      chunk.entries = entries
      chunk.imports = imports
      const existingChunk = this.state.chunks.find(entry => Helpers.serializeChunk(entry) === Helpers.serializeChunk(chunk))
      if (existingChunk) {
        return existingChunk
      }
    }
    return chunk
  }
  getUID(label: string): number {
    const uid = (this.state.uid.get(label) || 0) + 1
    this.state.uid.set(label, uid)
    return uid
  }
  getImportRequest(request: string, from: ?string = null): FileImport {
    return {
      id: this.getUID('import'),
      request,
      resolved: null,
      from,
      type: 'cjs',
      namespaces: [],
    }
  }
  getComponents(type: ?string = null, exclude: Array<string> = []): Array<ComponentConfigured> {
    let entries = Array.from(this.components)
    if (type) {
      entries = entries.filter(i => i.component.$type === type)
    }
    if (exclude.length) {
      entries = entries.filter((entry) => {
        // $FlowIgnore: I have no idea why name is an unknown property here
        const name: ?string = entry.component.name
        return !name || !exclude.includes(name)
      })
    }
    return entries
  }
  addComponent(component: ComponentAny, config: Object): void {
    if (!component) {
      throw new Error('Invalid component provided')
    }
    if (component.$apiVersion !== API_VERSION) {
      throw new Error('API version of component mismatches')
    }
    this.components.add({ component, config })
    this.invokeComponent({ component, config }, 'activate', [], [])
    return new Disposable(() => {
      this.deleteComponent(component, config)
    })
  }
  deleteComponent(component: ComponentAny, config: Object): boolean {
    for (const entry of this.components) {
      if (entry.config === config && entry.component === component) {
        this.components.delete(entry)
        this.invokeComponent(entry, 'dispose', [], [])
        return true
      }
    }
    return false
  }
  async invokeComponent(entry: ComponentConfigured, method: string, configs: Array<Object>, parameters: Array<any>): Promise<any> {
    invariant(typeof entry === 'object' && entry, 'Component must be a valid object')
    invariant(typeof entry.component[method] === 'function', `Component method '${method}' does not exist on given component`)

    const mergedConfigs = Object.assign({}, entry.component.defaultConfig, entry.config, ...configs)

    return entry.component[method](this, mergedConfigs, ...parameters)
  }
}

export default Context

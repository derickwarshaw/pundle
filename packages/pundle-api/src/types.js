// @flow

import type Context from './Context'
import type File from './File'
import type Job from './Job'

export type ComponentRules = {
  include?: string | Array<string>,
  exclude?: string | Array<string>,
  extensions?: string | Array<string>,
}

export type BaseConfig = {
  entry: Array<string>,
  target: 'browser',
  rootDirectory: string,
  output?: {
    template: string,
    sourceMapTemplate: string | 'inline' | false,
    rootDirectory: string,
  },
}
export type ResolvePayload = {|
  request: string,
  requestRoot: string,
  ignoredResolvers: Array<string>,

  resolved: ?string,
  resolvedRoot: ?string,
|}

export type Import = string
export type ChunkSimple = {|
  type: 'simple',
  format: '.js',
  label: string,
  entry: ?string,
  imports: Array<Import>,
  // ^ RESOLVED file paths to include in the main output bundle
|}
export type ChunkFile = {|
  type: 'file',
  format: string,
  label: string,
  entry: string,
  imports: [],
|}
export type Chunk = ChunkSimple | ChunkFile

export type Severity = 'info' | 'warning' | 'error'
export type ComponentType =
  | 'resolver'
  | 'reporter'
  | 'loader'
  | 'transformer'
  | 'plugin'
  | 'generator'
  | 'post-generator'
  | 'file-generator'
  | 'job-transformer'
export type ComponentCallback<TARGUMENTS, TRETURNVALUE> = (
  context: Context,
  options: Object,
  ...TARGUMENTS
) => Promise<?TRETURNVALUE> | ?TRETURNVALUE
export type Component<TTYPE: ComponentType, TCALLBACK> = {|
  name: string,
  version: string,
  type: TTYPE,
  callback: TCALLBACK,
  defaultOptions: Object,

  // Automatically added
  apiVersion: number,
|}

export type ComponentResolverCallback = ComponentCallback<[ResolvePayload], void>
export type ComponentResolver = Component<'resolver', ComponentResolverCallback>

export type ComponentReporterCallback = ComponentCallback<[any], void>
export type ComponentReporter = Component<'reporter', ComponentReporterCallback>

export type ComponentLoaderCallback = ComponentCallback<
  [File],
  {|
    contents: string,
    sourceMap: ?Object,
  |},
>
export type ComponentLoader = Component<'loader', ComponentLoaderCallback>

export type ComponentTransformerCallback = ComponentCallback<
  [File],
  {|
    contents: string,
    sourceMap: ?Object,
  |},
>
export type ComponentTransformer = Component<'transformer', ComponentTransformerCallback>

// NOTE: Useful for things like ESLint
export type ComponentPluginCallback = ComponentCallback<[File], void>
export type ComponentPlugin = Component<'plugin', ComponentPluginCallback>

export type ComponentJobTransformerCallback = ComponentCallback<
  [Job],
  {|
    job: Job,
  |},
>
export type ComponentJobTransformer = Component<'job-transformer', ComponentJobTransformerCallback>

export type ComponentGeneratorCallback = ComponentCallback<
  [Chunk, Job],
  {|
    contents: string,
    sourceMap: ?Object,
  |},
>
export type ComponentGenerator = Component<'generator', ComponentGeneratorCallback>

export type ComponentPostGeneratorCallback = ComponentCallback<
  [
    {|
      contents: string,
      sourceMap: ?Object,
    |},
    Job,
  ],
  {|
    contents: string,
    sourceMap: ?Object,
  |},
>
export type ComponentPostGenerator = Component<'post-generator', ComponentPostGeneratorCallback>
export type ComponentFileGeneratorCallback = ComponentCallback<
  [
    {|
      filePath: string,
      contents: Buffer,
    |},
    Job,
  ],
  {|
    contents: Buffer,
  |},
>
export type ComponentFileGenerator = Component<'file-generator', ComponentFileGeneratorCallback>

export type ComponentAny =
  | ComponentResolver
  | ComponentReporter
  | ComponentLoader
  | ComponentTransformer
  | ComponentPlugin
  | ComponentGenerator
  | ComponentPostGenerator
  | ComponentFileGenerator
  | ComponentJobTransformer

export type ComponentOptionsEntry = {|
  options: Object,
  component: ComponentAny,
|}

export type ChunkGenerated = {|
  chunk: Chunk,
  generated: {|
    contents: Buffer,
    sourceMap: ?Object,
  |},
|}

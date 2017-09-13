/* @flow */

import * as t from 'babel-types'
import type { File, Context, FileChunk } from 'pundle-api/types'
import { SourceMapGenerator, SourceMapConsumer } from 'source-map'

export function getName(obj: Object): string {
  if (typeof obj.name === 'string') {
    return obj.name
  }
  const chunks = []
  if (typeof obj.object === 'object') {
    chunks.push(getName(obj.object))
  }
  if (typeof obj.property === 'object') {
    chunks.push(getName(obj.property))
  }
  return chunks.join('.')
}

const STRING_REGEX = /^"[^"]*"$/

// TODO: use babel-template
export function getParsedReplacement(rawValue: any): Object {
  let parsedValue
  if (STRING_REGEX.test(rawValue)) {
    // Extract value between ""
    // Unescape backward slahes
    parsedValue = t.stringLiteral(JSON.parse(rawValue))
  } else if (typeof rawValue === 'number') {
    parsedValue = t.numericLiteral(rawValue)
  } else {
    parsedValue = t.identifier(rawValue)
  }
  return parsedValue
}

export async function processImport(context: Context, file: File, chunks: Array<FileChunk>, path: Object) {
  const argument = path.node.arguments[0]
  if (!argument || argument.type !== 'StringLiteral') {
    return
  }
  const importRequest = context.getImportRequest(argument.value, file.filePath)
  const chunk = await context.getChunk(null, [], [importRequest])

  path.replaceWith(t.callExpression(
    t.identifier('require.import'),
    [t.stringLiteral(chunk.getId().toString()), t.stringLiteral(importRequest.id.toString())],
  ))
  chunks.push(chunk)
}

export function incrementSourceMapLines(sourceMap: Object, filePath: string, contents: string, linesToIncrement: number): Object {
  const newMap = new SourceMapGenerator()
  const entryMap = new SourceMapConsumer(sourceMap)
  for (let i = 0, length = entryMap._generatedMappings.length; i < length; i++) {
    const mapping = entryMap._generatedMappings[i]
    if (mapping.source === null) continue
    newMap.addMapping({
      source: filePath,
      original: { line: mapping.originalLine, column: mapping.originalColumn },
      generated: { line: mapping.generatedLine + linesToIncrement, column: mapping.generatedColumn },
    })
  }
  newMap.setSourceContent(filePath, contents)
  return newMap.toJSON()
}

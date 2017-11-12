// @flow

import { createGenerator, MessageIssue } from 'pundle-api'
import { SourceMapGenerator } from 'source-map'

import { version } from '../package.json'
import * as Helpers from './helpers'

const ALLOWED_TYPES = ['string', 'boolean', 'number']

export default function() {
  return createGenerator({
    name: 'pundle-generator-browser',
    version,
    async callback(context, options, chunk, files) {
      // TODO: Wrappers
      const contents = [';(function(){']
      const sourceMap = new SourceMapGenerator({
        skipValidation: true,
      })
      const definedVariables = {
        PUNDLE_USE_GLOBALS: !!options.useGlobals,
        ...options.definedVariables,
      }

      for (const [key, value] of Object.entries(definedVariables)) {
        if (!ALLOWED_TYPES.includes(typeof value)) {
          throw new MessageIssue(
            `definedVariables.${key} has an invalid type of ${typeof value}, allowed types are: ${ALLOWED_TYPES.join(', ')}`,
          )
        }
        contents.push(`var ${key} = ${JSON.stringify(value)}`)
      }
      contents.push(await Helpers.getWrapperContents(context, options.wrapper))

      let offset = Helpers.getLinesCount(contents)
      const chunkMap = Helpers.getChunkMap(chunk, files)

      chunkMap.files.forEach(file => {
        const fileContents = `__sbPundle.moduleRegister(${JSON.stringify(
          file.fileName,
        )}, function(__filename, __dirname, require, module, exports) {\n${file.contents}\n});`
        contents.push(fileContents)
        if (file.sourceMap) {
          Helpers.mergeSourceMap(file.sourceMap, sourceMap, file, offset)
        }
        offset += Helpers.getLinesCount(fileContents)
      })

      contents.push('})();\n')

      return {
        contents: contents.join('\n'),
        sourceMap: sourceMap.toJSON(),
      }
    },
    defaultOptions: {
      wrapper: 'normal', // or 'hmr',
      definedVariables: {},
      useGlobals: true,
    },
    // TODO: Inline sourceMaps?
  })
}

// @flow

import path from 'path'
import resolve from 'resolve'
import browserResolve from 'browser-resolve'
import browserAliases from 'pundle-resolver-aliases-browser'
import { createResolver } from 'pundle-api'

import { version } from '../package.json'

function promisedResolve(browserEnv: boolean, request: string, options: Object): Promise<?string> {
  return new Promise(function(resolvePromise, rejectPromise) {
    const resolver = browserEnv ? browserResolve : resolve
    resolver(request, options, function(error, resolved) {
      if (error && error.code !== 'MODULE_NOT_FOUND') {
        rejectPromise(error)
      } else {
        resolvePromise(resolved || null)
      }
    })
  })
}

export default function() {
  return createResolver({
    name: 'pundle-resolver-node',
    version,
    async callback(context, options, payload) {
      const browserEnv = context.config.target === 'browser'
      const resolved = await promisedResolve(browserEnv, payload.request, {
        basedir: payload.requestRoot,
        moduleDirectory: options.moduleDirectories,
        packageFilter(packageManifest, manifestPath) {
          payload.resolvedRoot = path.dirname(manifestPath)
          return packageManifest
        },
        extensions: options.extensions,
        ...(browserEnv ? { modules: browserAliases } : {}),
      })
      if (resolved) {
        if (!payload.resolvedRoot) {
          payload.resolvedRoot = payload.requestRoot
        }
        payload.resolved = resolved
      }
    },
    defaultOptions: {
      extensions: ['', '.js', '.json'],
      moduleDirectories: ['node_modules'],
    },
  })
}

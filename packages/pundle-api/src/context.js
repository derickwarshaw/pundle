// @flow

import invariant from 'assert'
import pEachSeries from 'p-each-series'
import { Components } from './components'
import { ComponentOptions } from './component-options'

export default class Context {
  components: Components
  options: ComponentOptions

  constructor(components: Components, options: ComponentOptions) {
    invariant(
      components instanceof Components,
      'new Context() expects first parameter to be a Components instance',
    )
    invariant(
      options instanceof ComponentOptions,
      'new Context() expects second parameter to be a ComponentOptions instance',
    )
    this.components = components
    this.options = options
  }
  async report(report: Object) {
    let tried = false
    await pEachSeries(this.components.getByHookName('report'), async entry => {
      await entry.callback(this, this.options.get(entry), report)
      tried = true
    })
    if (!tried) {
      console.error(report)
    }
  }
}
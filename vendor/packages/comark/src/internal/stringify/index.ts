import { createState, one } from './state'
import type { Context } from 'comark'
import type { ComarkTree } from '../../ast/types'

const defaultOptions: Partial<Context> = {
  format: 'markdown/comark',
  removeLastStyle: true,
}

export function stringify(node: ComarkTree, options: Partial<Context> = {}) {
  options = {
    blockSeparator: options.format === 'text/html' ? '\n' : '\n\n',
    ...defaultOptions,
    ...options,
  }

  const _state = createState(options)

  const children = node.nodes

  const lastIndex = children.length - 1

  return children.map((child, index) => {
    if (index === lastIndex && options.removeLastStyle && child[0] === 'style') {
      return ''
    }
    return one(child, _state)
  }).join('').trim() + '\n'
}

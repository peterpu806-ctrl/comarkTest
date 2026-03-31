/**
 * Comark 插件配置
 */
import emoji from '../vendor/packages/comark/src/plugins/emoji.ts'
import highlight from '../vendor/packages/comark/src/plugins/highlight.ts'
import security from '../vendor/packages/comark/src/plugins/security.ts'
import summary from '../vendor/packages/comark/src/plugins/summary.ts'
import toc from '../vendor/packages/comark/src/plugins/toc.ts'
import type { Component } from 'vue'

// Comark 插件列表
export const comarkPlugins = [
  security({}),
  emoji(),
  summary(),
  toc(),
  highlight()
]

// Comark 组件映射
export const comarkComponents: Record<string, Component> = {}

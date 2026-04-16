/**
 * Comark 插件配置
 */
import emoji from 'comark/plugins/emoji'
import highlight from 'comark/plugins/highlight'
import security from 'comark/plugins/security'
import summary from 'comark/plugins/summary'
import toc from 'comark/plugins/toc'
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

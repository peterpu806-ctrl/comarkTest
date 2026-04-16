interface ImportMeta {
  dev: boolean
}

declare module '*.css' {
  const content: string
  export default content
}

declare module 'katex/dist/katex.min.css' {
  const content: string
  export default content
}

declare module 'virtual:comark-vue/components' {
  import type { Plugin } from 'vue'

  const plugin: Plugin
  export default plugin
}

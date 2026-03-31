<script setup lang="ts">
/**
 * 流式渲染测试组件
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { Comark } from '@comark/vue'
import { comarkPlugins, comarkComponents } from '../plugins.ts'

// 流式内容状态
const content = ref('')
const isStreaming = ref(false)

// 测试用例列表
const testCases = [
  {
    name: '有序列表',
    content: `这是一个有序列表流式渲染测试：
1. 第一条内容
2. 第二条内容
3. 第三条内容`
  },
  {
    name: '混合内容',
    content: `# 欢迎使用 Comark

这是一个**流式渲染**测试，支持 *Markdown* 语法！

## 特性
- 支持有序列表
- 支持无序列表
- 支持代码块

\`\`\`javascript
const hello = 'world';
console.log(hello);
\`\`\``

  },
  {
    name: '组件测试',
    content: `::alert{type="info"}
这是一条提示信息
::

::alert{type="warning"}
这是一条警告信息
::

> 这是一个引用块`
  }
]

let streamingInterval: ReturnType<typeof setInterval> | null = null
let currentTestIndex = 0

// 模拟流式输入
function simulateStreaming(fullContent: string, delayMs: number = 50) {
  isStreaming.value = true
  content.value = ''
  let index = 0

  streamingInterval = setInterval(() => {
    if (index < fullContent.length) {
      content.value += fullContent[index]
      index++
    } else {
      stopStreaming()
    }
  }, delayMs)
}

function stopStreaming() {
  if (streamingInterval) {
    clearInterval(streamingInterval)
    streamingInterval = null
  }
  isStreaming.value = false
}

function startTest(index: number) {
  stopStreaming()
  currentTestIndex = index
  const test = testCases[index]
  simulateStreaming(test.content)
}

function nextTest() {
  const nextIndex = (currentTestIndex + 1) % testCases.length
  startTest(nextIndex)
}

onMounted(() => {
  // 自动开始第一个测试
  setTimeout(() => startTest(0), 500)
})

onUnmounted(() => {
  stopStreaming()
})
</script>

<template>
  <div class="container">
    <h1>Comark 流式渲染测试</h1>

    <!-- 控制按钮 -->
    <div class="controls">
      <button
        v-for="(test, index) in testCases"
        :key="index"
        :class="['btn', { active: currentTestIndex === index }]"
        @click="startTest(index)"
      >
        {{ test.name }}
      </button>
      <button class="btn next" @click="nextTest">下一个</button>
    </div>

    <!-- 状态显示 -->
    <div class="status">
      <span>状态: {{ isStreaming ? '流式输入中...' : '完成' }}</span>
      <span>字符数: {{ content.length }}</span>
    </div>

    <!-- Comark 渲染区域 -->
    <div class="render-area">
      <Suspense>
        <Comark
          :markdown="content"
          :streaming="true"
          :caret="true"
          :plugins="comarkPlugins"
        />
        <template #fallback>
          <div>加载中...</div>
        </template>
      </Suspense>
    </div>

    <!-- 原始内容预览 -->
    <div class="preview">
      <h3>原始内容:</h3>
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>

<style scoped>
@import "./StreamingTest.module.scss";
</style>

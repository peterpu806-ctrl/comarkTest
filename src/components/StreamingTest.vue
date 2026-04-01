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
    content: `|   序号 | 任务名称       | 任务内容                               | 执行智能体     | 任务状态   |
|-----:|:-----------|:-----------------------------------|:----------|:-------|
|    0 | 生成ddddd画像 | 为用户xx组织ssas，执行以下步骤：              | 组织fff体 | 未开始    |
|      |            | 1. 首先查询'xx'相关的所列表，获取名称和 ID  |           |        |
|      |            | 2. 识别最主要的xx（通常是xx有限公司）       |           |        |
|      |            | 3. 生成该xxx的详细xxxxx，包括：                  |           |        |
|      |            |    - 基本信dsffsfffff等 |           |        |
|      |            |    - 组织架fffffff构关系           |           |        |
|      |            |    - 业务fffffff业分类           |           |        |
|      |            |    - 关键fff信息                |           |        |
|      |            |    - 关联ffff作伙伴                |           |        |
|      |            |    - 发展fffff和事件                |           |        |
|      |            |    - 经营fffff场表现（如有）            |           |        |
|      |            | 4. 以清ffffxxxxx报告          |           |        | 
`
  },
  {
    name: '混合内容',
    content: `|   序号 | 任务名称       | 任务内容                               | 执行智能体     | 任务状态   |
|-----:|:-----------|:-----------------------------------|:----------|:-------|
|    0 | 生成ddddd画像 | 为用户xx组织ssas，执行以下步骤：              | 组织fff体 | 未开始    |
|      |            | 1. 首先查询'xx'相关的所列表，获取名称和 ID  |           |        |
|      |            | 2. 识别最主要的xx（通常是xx有限公司）       |           |        |
|      |            | 3. 生成该xxx的详细xxxxx，包括：                  |           |        |
|      |            |    - 基本信dsffsfffff等 |           |        |
|      |            |    - 组织架fffffff构关系           |           |        |
|      |            |    - 业务fffffff业分类           |           |        |
|      |            |    - 关键fff信息                |           |        |
|      |            |    - 关联ffff作伙伴                |           |        |
|      |            |    - 发展fffff和事件                |           |        |
|      |            |    - 经营fffff场表现（如有）            |           |        |
|      |            | 4. 以清ffffxxxxx报告          |           |        |`
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
        <div class="markdown-body">
          <Comark
            :markdown="content"
            :streaming="true"
            :caret="true"
            :plugins="comarkPlugins"
          />
        </div>
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

/* GitHub Markdown 样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  color: #24292f;
  background-color: #ffffff;
}

.markdown-body :deep(table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
  overflow: auto;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

.markdown-body :deep(table th) {
  font-weight: 600;
  background-color: #f6f8fa;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #636c76;
  border-left: 0.25em solid #d0d7de;
  margin: 0 0 16px 0;
}

.markdown-body :deep(ol),
.markdown-body :deep(ul) {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.markdown-body :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(p) {
  margin-bottom: 16px;
}

/* alert 组件样式 */
.markdown-body :deep([class*="alert"]) {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 6px;
}

.markdown-body :deep(.alert-info) {
  background-color: #ddf4ff;
  border: 1px solid #54aeff;
}

.markdown-body :deep(.alert-warning) {
  background-color: #fff8c5;
  border: 1px solid #bf8700;
}
</style>

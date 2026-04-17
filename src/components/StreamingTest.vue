<script setup lang="ts">
/**
 * 流式渲染测试组件
 *
 * 测试 Comark 在流式输入时的渲染行为
 * 观察组件是否会频繁重建导致闪烁
 */
import { ref, shallowRef, onMounted, onUnmounted, provide } from "vue";
import { Comark } from "@comark/vue";
import { comarkPlugins } from "../plugins.ts";
import XCard from "./XCard.vue";

// 流式内容状态 - 使用 shallowRef 避免深度响应式追踪
const content = shallowRef("");
const isStreaming = ref(false);

// 收集所有 XCard 的监测日志 - 按 title 分组
interface RebuildData {
  title: string;
  count: number;
  messages: string[];
}
const rebuildStats = ref<Map<string, RebuildData>>(new Map());

// 处理XCard的重建事件
function handleRebuild(data: RebuildData) {
  const existing = rebuildStats.value.get(data.title);
  if (existing) {
    existing.count = Math.max(existing.count, data.count);
    existing.messages.push(data.messages[0]);
  } else {
    rebuildStats.value.set(data.title, { ...data });
  }
}

// provide给Comark内部的XCard使用
provide("onRebuild", handleRebuild);

// 自定义组件
const customComponents = { XCard };

// 测试用例列表
const testCases = [
  {
    name: "多个XCard",
    content: `::XCard
---
name: card1
title: card1
id: id-001
---
这是第一个卡片的内容。
::

::XCard
---
name: card2
title: card2
id: id-002
---
这是第二个卡片的内容。
::

::XCard
---
name: card3
title: card3
id: id-003
---
这是第三个卡片的内容。
::
`,
  },
  {
    name: "链接渲染",
    content: `智能体出错：1 validation error for PromptTemplate
    Value error, Invalid format specifier in f-string template. Nested replacement fields are not allowed.
    For further information visit
    https://errors.pydantic.dev/2.13/v/value_error
    更多示例
    https://_errors.pydantic.dev/2.13/v/value_error
    这是一个普通的段落文本。
    https://errors.pyd_anti_c_.dev/2.13/v/value_1231_
    另一个链接
    https://errors._pydantic.dev/2.13/v/value_111
`,
  },
  {
    name: "链接 + 文本",
    content: `https://_errors.pydantic.dev/2.13/v/value_error
    这是一个普通的段落文本。
    https://errors.pyd_anti_c_.dev/2.13/v/value_1231_
    另一个链接
    https://errors._pydantic.dev/2.13/v/value_111

这是另一个段落，在卡片之后。
`,
  },
];

let streamingInterval: ReturnType<typeof setInterval> | null = null;
let currentTestIndex = 0;

// 模拟流式输入
function simulateStreaming(fullContent: string, delayMs: number = 30) {
  isStreaming.value = true;
  content.value = "";
  let index = 0;

  streamingInterval = setInterval(() => {
    if (index < fullContent.length) {
      content.value += fullContent[index];
      index++;
    } else {
      stopStreaming();
    }
  }, delayMs);
}

function stopStreaming() {
  if (streamingInterval) {
    clearInterval(streamingInterval);
    streamingInterval = null;
  }
  isStreaming.value = false;
}

function startTest(index: number) {
  stopStreaming();
  rebuildStats.value.clear();
  currentTestIndex = index;
  const test = testCases[index];
  simulateStreaming(test.content);
}

function nextTest() {
  const nextIndex = (currentTestIndex + 1) % testCases.length;
  startTest(nextIndex);
}

onMounted(() => {
  setTimeout(() => startTest(0), 500);
});

onUnmounted(() => {
  stopStreaming();
});
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
      <span>状态: {{ isStreaming ? "流式输入中..." : "完成" }}</span>
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
            :components="customComponents"
          />
        </div>
        <template #fallback>
          <div>加载中...</div>
        </template>
      </Suspense>
    </div>

    <!-- 重建监测 -->
    <div v-if="currentTestIndex === 0" class="rebuild-monitor">
      <h3>Rebuild Monitor:</h3>
      <div v-if="rebuildStats.size > 0" class="rebuild-stats">
        <div class="rebuild-messages">
          <div
            v-for="[title, data] in rebuildStats"
            :key="'msg-' + title"
            class="rebuild-message-item"
          >
            <span v-for="(msg, i) in data.messages" :key="i">{{ msg }}<br /></span>
          </div>
        </div>
      </div>
      <div v-else class="no-rebuild">无重建</div>
    </div>

    <!-- 原始内容预览 -->
    <div class="preview">
      <h3>原始内容:</h3>
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #4ec9b0;
  background: transparent;
  color: #4ec9b0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(78, 201, 176, 0.1);
}

.btn.active {
  background: #4ec9b0;
  color: #1e1e1e;
}

.btn.next {
  border-color: #569cd6;
  color: #569cd6;
}

.btn.next:hover {
  background: rgba(86, 156, 214, 0.1);
}

.status {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 14px;
}

.render-area {
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
  min-height: 300px;
}

.rebuild-monitor {
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  background: #1e1e1e;
}

.rebuild-monitor h3 {
  color: #569cd6;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.rebuild-info {
  font-size: 12px;
  color: #9cdcfe;
  margin-bottom: 8px;
}

.rebuild-stats {
  margin-top: 8px;
}

.rebuild-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #f14c4c;
  padding: 6px 10px;
  background: rgba(241, 76, 76, 0.1);
  border-radius: 4px;
  margin-bottom: 4px;
}

.stat-title {
  color: #9cdcfe;
  font-weight: bold;
}

.rebuild-messages {
  margin-top: 12px;
}

.rebuild-message-item {
  font-size: 11px;
  color: #f14c4c;
  padding: 4px 8px;
  background: rgba(241, 76, 76, 0.1);
  border-radius: 4px;
  margin-bottom: 4px;
}

.stat-count {
  color: #f14c4c;
}

.stat-id {
  color: #808080;
  font-size: 10px;
}

.no-rebuild {
  font-size: 12px;
  color: #4ec9b0;
  margin-top: 8px;
}

.markdown-body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica,
    Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  :deep(p) {
    color: #2d2d2d;
  }
}

.preview {
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 16px;
  background: #1e1e1e;
}

.preview h3 {
  color: #569cd6;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.preview pre {
  margin: 0;
  padding: 12px;
  background: #2d2d2d;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  color: #9cdcfe;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

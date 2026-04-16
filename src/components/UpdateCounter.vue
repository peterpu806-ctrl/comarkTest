<script setup lang="ts">
/**
 * 更新计数器组件 - 用于测试流式输入时的组件更新频率
 */
import { ref, onBeforeUpdate, onUpdated, onMounted, onUnmounted, computed } from 'vue'

interface UpdateRecord {
  timestamp: number
  delta: number
  contentLength: number
}

const props = defineProps<{
  /** 监听的 content 长度变化 */
  contentLength: number
  /** 内容样本 */
  contentSample?: string
}>()

// 更新统计
const updateCount = ref(0)
const lastUpdateTime = ref(Date.now())
const updateRecords = ref<UpdateRecord[]>([])
const maxRecords = 50

// FPS 计算
const fps = ref(0)
let fpsInterval: ReturnType<typeof setInterval> | null = null
let recentUpdates = 0

// 防抖状态
const debouncedUpdates = ref(0)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const DEBOUNCE_MS = 100

// 计算更新间隔统计
const avgInterval = computed(() => {
  if (updateRecords.value.length < 2) return 0
  const total = updateRecords.value.reduce((sum, r) => sum + r.delta, 0)
  return Math.round(total / (updateRecords.value.length - 1) * 100) / 100
})

const maxInterval = computed(() => {
  if (updateRecords.value.length < 2) return 0
  return Math.max(...updateRecords.value.slice(1).map(r => r.delta))
})

const minInterval = computed(() => {
  if (updateRecords.value.length < 2) return 0
  return Math.min(...updateRecords.value.slice(1).map(r => r.delta))
})

// 记录更新
function recordUpdate() {
  const now = Date.now()
  const delta = now - lastUpdateTime.value
  lastUpdateTime.value = now
  updateCount.value++
  recentUpdates++

  // 记录到历史
  updateRecords.value.push({
    timestamp: now,
    delta,
    contentLength: props.contentLength
  })

  // 保持最大记录数
  if (updateRecords.value.length > maxRecords) {
    updateRecords.value.shift()
  }

  // 防抖计数
  debouncedUpdates.value++
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  debounceTimer.value = setTimeout(() => {
    debouncedUpdates.value = 0
  }, DEBOUNCE_MS)
}

// FPS 计算
function startFpsCounter() {
  fpsInterval = setInterval(() => {
    fps.value = recentUpdates
    recentUpdates = 0
  }, 1000)
}

function stopFpsCounter() {
  if (fpsInterval) {
    clearInterval(fpsInterval)
    fpsInterval = null
  }
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
}

// 生命周期
onMounted(() => {
  startFpsCounter()
})

onBeforeUpdate(() => {
  // 更新前的钩子
})

onUpdated(() => {
  recordUpdate()
})

onUnmounted(() => {
  stopFpsCounter()
})

// 格式化时间戳
function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`
}

// 清理历史
function clearHistory() {
  updateRecords.value = []
  updateCount.value = 0
  lastUpdateTime.value = Date.now()
}
</script>

<template>
  <div class="update-counter">
    <div class="counter-header">
      <h4>组件更新监控</h4>
      <button class="clear-btn" @click="clearHistory">清除</button>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-label">总更新次数</span>
        <span class="stat-value">{{ updateCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">当前 FPS</span>
        <span class="stat-value" :class="{ warning: fps > 30, danger: fps > 60 }">{{ fps }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">防抖更新({{ DEBOUNCE_MS }}ms)</span>
        <span class="stat-value">{{ debouncedUpdates }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">内容长度</span>
        <span class="stat-value">{{ contentLength }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均间隔</span>
        <span class="stat-value">{{ avgInterval }}ms</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大间隔</span>
        <span class="stat-value">{{ maxInterval }}ms</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最小间隔</span>
        <span class="stat-value">{{ minInterval }}ms</span>
      </div>
    </div>

    <div class="history-section">
      <h5>更新历史 (最近 {{ updateRecords.length }} 条)</h5>
      <div class="history-list">
        <div
          v-for="(record, index) in updateRecords"
          :key="index"
          class="history-item"
          :class="{ frequent: record.delta < 16, normal: record.delta >= 16 && record.delta < 50, slow: record.delta >= 50 }"
        >
          <span class="time">{{ formatTime(record.timestamp) }}</span>
          <span class="delta">+{{ Math.round(record.delta) }}ms</span>
          <span class="length">{{ record.contentLength }}chars</span>
        </div>
      </div>
    </div>

    <div v-if="contentSample" class="sample-section">
      <h5>内容样本 (最后 100 字符)</h5>
      <pre class="sample-content">{{ contentSample.slice(-100) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.update-counter {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.counter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.counter-header h4 {
  margin: 0;
  color: #569cd6;
}

.clear-btn {
  background: #4a4a4a;
  border: none;
  color: #d4d4d4;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.clear-btn:hover {
  background: #5a5a5a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  background: #2d2d2d;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: #808080;
  font-size: 10px;
  text-transform: uppercase;
}

.stat-value {
  color: #4ec9b0;
  font-size: 16px;
  font-weight: bold;
}

.stat-value.warning {
  color: #dcdcaa;
}

.stat-value.danger {
  color: #f14c4c;
}

.history-section {
  margin-top: 12px;
}

.history-section h5 {
  margin: 0 0 8px 0;
  color: #569cd6;
}

.history-list {
  max-height: 150px;
  overflow-y: auto;
  background: #2d2d2d;
  border-radius: 4px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  border-bottom: 1px solid #3d3d3d;
  font-size: 11px;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item.frequent {
  background: rgba(241, 76, 76, 0.1);
}

.history-item.normal {
  background: rgba(78, 201, 176, 0.05);
}

.history-item.slow {
  background: transparent;
}

.time {
  color: #6a9955;
  min-width: 90px;
}

.delta {
  color: #ce9178;
  min-width: 60px;
}

.length {
  color: #569cd6;
}

.sample-section {
  margin-top: 12px;
}

.sample-section h5 {
  margin: 0 0 8px 0;
  color: #569cd6;
}

.sample-content {
  background: #2d2d2d;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-size: 10px;
  color: #9cdcfe;
}
</style>

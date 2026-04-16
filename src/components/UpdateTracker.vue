<script setup lang="ts">
/**
 * 更新追踪器组件 - 用于测试 Comark 流式输入时的组件频繁重建问题
 *
 * 追踪:
 * 1. 组件实例 ID - 如果流式更新时实例 ID 发生变化，说明组件被重建了
 * 2. 挂载/卸载次数 - 统计组件被创建和销毁的次数
 * 3. 更新次数 - 统计组件的 onUpdated 调用次数
 *
 * 用法:
 * <Comark :components="{ p: UpdateTracker }" :markdown="content" />
 *
 * 如果组件在流式更新时频繁重建，你会看到:
 * - mountCount 不断增长
 * - 每次内容变化都触发新的 mount/unmount
 * - instanceId 不断变化
 */
import { ref, onMounted, onUnmounted, onBeforeUpdate, onUpdated, onBeforeUnmount } from 'vue'

// 静态计数器 - 用于追踪全局的挂载/卸载事件（不受组件实例影响）
const globalMountCount = ref(0)
const globalUnmountCount = ref(0)
const globalInstanceCount = ref(0)

// 实例特定的追踪器
const instanceId = ref('')
const mountCount = ref(0)
const unmountCount = ref(0)
const updateCount = ref(0)
const firstMountTime = ref(0)
const lastUnmountTime = ref(0)
const lastUpdateTime = ref(0)

// 用于检测组件是否在快速重建
const recentMounts = ref<number[]>([]) // 记录最近几次的挂载时间戳
const RAPID_REBUILD_THRESHOLD_MS = 100 // 100ms 内重建认为是频繁重建

// 判断是否为频繁重建
const isRapidRebuilding = ref(false)

// 更新统计
const stats = ref({
  mountsLastSecond: 0,
  unmountsLastSecond: 0,
  updatesLastSecond: 0,
})

let statsInterval: ReturnType<typeof setInterval> | null = null
let mountTimestamps: number[] = []

// 生成唯一实例 ID
function generateInstanceId(): string {
  return `i_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// 记录挂载事件
function recordMount() {
  globalMountCount.value++
  mountCount.value++
  const now = Date.now()

  mountTimestamps.push(now)
  // 只保留最近 1 秒内的记录
  const oneSecondAgo = now - 1000
  mountTimestamps = mountTimestamps.filter(t => t > oneSecondAgo)
  recentMounts.value = [...mountTimestamps]

  // 检测是否在快速重建
  if (mountTimestamps.length >= 3) {
    const intervals = []
    for (let i = 1; i < mountTimestamps.length; i++) {
      intervals.push(mountTimestamps[i] - mountTimestamps[i - 1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    isRapidRebuilding.value = avgInterval < RAPID_REBUILD_THRESHOLD_MS
  }

  stats.value.mountsLastSecond = mountTimestamps.length
}

// 记录卸载事件
function recordUnmount() {
  globalUnmountCount.value++
  unmountCount.value++
  lastUnmountTime.value = Date.now()
}

// 记录更新事件
function recordUpdate() {
  updateCount.value++
  lastUpdateTime.value = Date.now()
  stats.value.updatesLastSecond++
}

// 初始化
onMounted(() => {
  instanceId.value = generateInstanceId()
  globalInstanceCount.value++
  firstMountTime.value = Date.now()
  recordMount()

  // 启动每秒统计重置
  statsInterval = setInterval(() => {
    stats.value.mountsLastSecond = mountTimestamps.filter(t => Date.now() - t < 1000).length
    stats.value.updatesLastSecond = 0
  }, 1000)
})

onBeforeUnmount(() => {
  recordUnmount()
})

onBeforeUpdate(() => {
  // 更新前的钩子
})

onUpdated(() => {
  recordUpdate()
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})

// 暴露给父组件查看
defineExpose({
  instanceId,
  mountCount,
  unmountCount,
  updateCount,
  isRapidRebuilding,
  stats,
})
</script>

<template>
  <div
    class="update-tracker"
    :class="{
      'rapid-rebuild': isRapidRebuilding,
      'normal': !isRapidRebuilding
    }"
  >
    <div class="tracker-header">
      <span class="instance-id">{{ instanceId || 'pending...' }}</span>
      <span class="mount-badge">mount {{ mountCount }}</span>
      <span v-if="unmountCount > 0" class="unmount-badge">unmount {{ unmountCount }}</span>
      <span class="update-badge">update {{ updateCount }}</span>
      <span v-if="isRapidRebuilding" class="warning-badge">⚠ 频繁重建!</span>
    </div>

    <div class="tracker-body">
      <slot />
    </div>

    <div class="tracker-footer">
      <span v-if="stats.mountsLastSecond > 0" class="stat">
        {{ stats.mountsLastSecond }}/s mounts
      </span>
      <span class="stat">
        avg {{ mountCount > 0 ? Math.round((Date.now() - firstMountTime) / mountCount) : 0 }}ms/instance
      </span>
    </div>
  </div>
</template>

<style scoped>
.update-tracker {
  border: 2px solid #4ec9b0;
  padding: 4px 8px;
  margin: 4px 0;
  border-radius: 4px;
  background: rgba(78, 201, 176, 0.1);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 11px;
  position: relative;
}

.update-tracker.rapid-rebuild {
  border-color: #f14c4c;
  background: rgba(241, 76, 76, 0.1);
  animation: pulse-border 0.5s ease-in-out infinite alternate;
}

@keyframes pulse-border {
  from {
    border-color: #f14c4c;
    box-shadow: 0 0 4px rgba(241, 76, 76, 0.5);
  }
  to {
    border-color: #ff6b6b;
    box-shadow: 0 0 8px rgba(241, 76, 76, 0.8);
  }
}

.tracker-header {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
}

.instance-id {
  background: #569cd6;
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.mount-badge {
  background: #4ec9b0;
  color: #1e1e1e;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.unmount-badge {
  background: #dcdcaa;
  color: #1e1e1e;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.update-badge {
  background: #ce9178;
  color: #1e1e1e;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
}

.warning-badge {
  background: #f14c4c;
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
  animation: blink 0.3s ease-in-out infinite alternate;
}

@keyframes blink {
  from { opacity: 1; }
  to { opacity: 0.6; }
}

.tracker-body {
  color: #d4d4d4;
}

.tracker-footer {
  display: flex;
  gap: 12px;
  color: #808080;
  font-size: 10px;
  margin-top: 4px;
  border-top: 1px dashed #3d3d3d;
  padding-top: 4px;
}

.stat {
  color: #9cdcfe;
}
</style>

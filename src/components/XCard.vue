<script setup lang="ts">
/**
 * XCard 组件 - Comark 自定义组件示例
 *
 * 用法:
 * ::XCard{name='组件名' title='标题' id='唯一标识'}
 * 这是卡片内容
 * ::
 */
import { computed, ref, onMounted, onUnmounted, onBeforeUpdate, onUpdated } from 'vue'

interface Props {
  name?: string
  title?: string
  id?: string
  type?: string
  [key: string]: any
}

const props = defineProps<Props>()

// 追踪组件更新
const updateCount = ref(0)
const instanceId = ref(Math.random().toString(36).slice(2, 8))
const isMounted = ref(false)
const mountTime = ref(0)
const updateInterval = computed(() => {
  if (updateCount.value === 0 || mountTime.value === 0) return 0
  return Math.round((Date.now() - mountTime.value) / updateCount.value)
})

// 追踪是否频繁重建
const isRapidRebuild = ref(false)
const recentMounts = ref<number[]>([])

onMounted(() => {
  isMounted.value = true
  mountTime.value = Date.now()
  updateCount.value++
  recentMounts.value.push(Date.now())

  // 检测是否频繁重建
  setInterval(() => {
    const now = Date.now()
    recentMounts.value = recentMounts.value.filter(t => now - t < 1000)
    if (recentMounts.value.length >= 3) {
      isRapidRebuild.value = true
    }
  }, 100)
})

onBeforeUpdate(() => {
  // 更新前
})

onUpdated(() => {
  updateCount.value++
  recentMounts.value.push(Date.now())
})

onUnmounted(() => {
  isMounted.value = false
})

const cardTypeClass = computed(() => {
  return props.type ? `xcard-${props.type}` : 'xcard-default'
})
</script>

<template>
  <div
    class="xcard"
    :class="[cardTypeClass, { 'is-streaming': !isMounted }]"
    :data-name="name"
    :data-id="id"
  >
    <div class="xcard-header">
      <div class="xcard-badges">
        <span class="xcard-instance">#{{ instanceId }}</span>
        <span v-if="isRapidRebuild" class="xcard-warning">⚠ 频繁重建</span>
        <span class="xcard-updates">{{ updateCount }} updates</span>
        <span v-if="updateInterval > 0" class="xcard-interval">~{{ updateInterval }}ms/更新</span>
      </div>
      <h3 v-if="title" class="xcard-title">{{ title }}</h3>
      <div v-if="name || id" class="xcard-meta">
        <span v-if="name" class="xcard-name">{{ name }}</span>
        <span v-if="id" class="xcard-id">{{ id }}</span>
      </div>
    </div>
    <div class="xcard-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.xcard {
  border: 2px solid #4ec9b0;
  border-radius: 8px;
  margin: 16px 0;
  background: rgba(78, 201, 176, 0.05);
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.xcard.xcard-default {
  border-color: #4ec9b0;
}

.xcard.xcard-info {
  border-color: #54aeff;
  background: rgba(84, 174, 255, 0.05);
}

.xcard.xcard-warning {
  border-color: #bf8700;
  background: rgba(191, 135, 0, 0.05);
}

.xcard.xcard-error {
  border-color: #da3633;
  background: rgba(218, 54, 51, 0.05);
}

.xcard-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(78, 201, 176, 0.2);
  background: rgba(78, 201, 176, 0.1);
}

.xcard-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 10px;
}

.xcard-instance {
  background: #569cd6;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
}

.xcard-warning {
  background: #f14c4c;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  animation: blink 0.5s ease-in-out infinite alternate;
}

@keyframes blink {
  from { opacity: 1; }
  to { opacity: 0.5; }
}

.xcard-updates {
  background: #ce9178;
  color: #1e1e1e;
  padding: 2px 6px;
  border-radius: 3px;
}

.xcard-interval {
  background: #4ec9b0;
  color: #1e1e1e;
  padding: 2px 6px;
  border-radius: 3px;
}

.xcard-title {
  margin: 0;
  font-size: 16px;
  color: #d4d4d4;
}

.xcard-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  color: #808080;
}

.xcard-name {
  color: #9cdcfe;
}

.xcard-id {
  color: #b5cea8;
  font-size: 10px;
}

.xcard-body {
  padding: 16px;
  color: #d4d4d4;
}
</style>

<script setup lang="ts">
  /**
   * 壁纸切换卡片
   * 提供 bing壁纸 / 系统壁纸 切换，local 模式下可随机切换站内壁纸
   */
  import { AutoAwesomeRound, AutorenewRound } from '@vicons/material'
  import type { BackgroundMode } from '../../types/theme'
  import { useHomeStore } from '../../stores'

  const home = useHomeStore()

  // 切换壁纸模式并立即拉取
  const setBackgroundMode = (mode: BackgroundMode) => {
    home.setBackgroundMode(mode)
    home.fetchBackground(mode)
  }
  // 随机切换一张站内壁纸
  const randomBackground = () => home.fetchBackground('local')
</script>
<template>
  <n-card content-class="flex flex-row justify-between items-center gap-4">
    <div class="flex flex-row items-center gap-2">
      <n-icon size="40"><auto-awesome-round /></n-icon>
      <p class="text-xl font-bold">壁纸</p>
    </div>
    <div class="flex gap-2">
      <n-button v-interaction v-magnetic :class="home.backgroundMode === 'bing' ? '!outline' : ''" @click="setBackgroundMode('bing')" secondary round>bing壁纸</n-button>
      <n-button v-interaction v-magnetic :class="home.backgroundMode === 'local' ? '!outline' : ''" @click="setBackgroundMode('local')" secondary round>系统壁纸</n-button>
    </div>
    <n-button v-interaction v-magnetic v-if="home.backgroundMode === 'local'" @click="randomBackground()" quaternary circle size="large">
      <template #icon>
        <n-icon size="25"><autorenew-round /></n-icon>
      </template>
    </n-button>
  </n-card>
</template>

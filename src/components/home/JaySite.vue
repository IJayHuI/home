<script setup lang="ts">
/**
 * 站点导航卡片
 * 桌面端：网格布局展示所有站点；移动端：轮播展示
 * 站点数据来自 configs/home.json，分 router（站内路由）和 link（外链）两种
 */
import * as icons from '@vicons/material'
import type { Component } from 'vue'
import { computed } from 'vue'
import { useGeneralStore, useAuthStore } from '../../stores'
import homeConfig from '../../configs/home.json'

const general = useGeneralStore()
const auth = useAuthStore()

// 根据图标名字符串渲染对应图标组件，找不到时用 WarningRound 兜底
const renderIcon = (icon: string): Component => {
  return icons[icon as keyof typeof icons] || icons['WarningRound']
}

// 过滤站点：requiresAdmin 的站点仅管理员可见
const visibleSites = computed(() =>
  homeConfig.sites.filter((s) => !s.requiresAdmin || auth.isAdmin())
)
</script>
<template>
  <n-card v-if="!general.isMobile" size="medium" title="站点" content-class="w-full grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
    <template v-for="site in visibleSites" :key="site.router">
      <router-link v-if="site.type === 'router' && site.router" :to="site.router">
        <n-card v-magnetic size="medium" content-class="flex justify-center items-center gap-2 flex-row">
          <n-icon :size="30"><component :is="renderIcon(site.icon)" /></n-icon>
          <p class="text-xl font-bold">{{ site.name }}</p>
        </n-card>
      </router-link>
    </template>
    <template v-for="link in visibleSites" :key="link.link">
      <a v-if="link.type === 'link' && link.link" :href="link.link" target="_blank">
        <n-card v-magnetic class="w-full h-full" size="medium" content-class="flex justify-center items-center gap-2 flex-row">
          <n-icon :size="30"><component :is="renderIcon(link.icon)" /></n-icon>
          <p class="text-xl font-bold">{{ link.name }}</p>
        </n-card>
      </a>
    </template>
  </n-card>
  <n-card v-else size="small" title="站点">
    <n-carousel show-arrow :slides-per-view="3" :space-between="8" class="pb-12">
      <template v-for="site in visibleSites" :key="site.router">
        <router-link v-if="site.type === 'router' && site.router" :to="site.router">
          <n-card v-interaction size="small" content-class="flex justify-center items-center gap-2 flex-col">
            <n-icon :size="27"><component :is="renderIcon(site.icon)" /></n-icon>
            <p class="text-base">{{ site.name }}</p>
          </n-card>
      </router-link>
    </template>
    <template v-for="link in visibleSites" :key="link.link">
      <a v-if="link.type === 'link' && link.link" :href="link.link" target="_blank">
          <n-card v-interaction class="w-full h-full" size="small" content-class="flex justify-center items-center gap-2 flex-col">
            <n-icon :size="27"><component :is="renderIcon(link.icon)" /></n-icon>
            <p class="text-base">{{ link.name }}</p>
          </n-card>
        </a>
      </template>
    </n-carousel>
  </n-card>
</template>

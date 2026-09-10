<script setup lang="ts">
  /**
   * 首页主试图
   * 组合所有首页子组件，负责：
   * - 拉取壁纸/日志/一言/热力图数据
   * - 背景模糊→清晰的滚动动画（gsap ScrollTrigger）
   * - 桌面端/移动端两套布局
   */
  import { onMounted, onUnmounted, watch } from 'vue'
  import { gsap } from 'gsap'
  import ScrollTrigger from 'gsap/ScrollTrigger'
  import { TuneRound } from '@vicons/material'
  import { useGeneralStore, useHomeStore } from '../../stores'
  import homeTheme from '../../theme/home.json'

  import JayBackground from '../../components/home/JayBackground.vue'
  import JayAvatar from '../../components/home/JayAvatar.vue'
  import JayLog from '../../components/home/JayLog.vue'
  import JayYiYan from '../../components/home/JayYiYan.vue'
  import JayDatetime from '../../components/home/JayDatetime.vue'
  import JaySite from '../../components/home/JaySite.vue'
  import JayFooter from '../../components/common/JayFooter.vue'
  import JayHeatmap from '../../components/home/JayHeatmap.vue'
  import JayContactMe from '../../components/home/JayContactMe.vue'
  import JayTechList from '../../components/home/JayTechList.vue'
  import JayThemeChange from '../../components/home/JayThemeChange.vue'
  import JayBackgroundChange from '../../components/home/JayBackgroundChange.vue'
  import JayScrollTip from '../../components/home/JayScrollTip.vue'
  import JayIntroduction from '../../components/home/JayIntroduction.vue'
  import JayDrawer from '../../components/home/JayDrawer.vue'

  const general = useGeneralStore()
  const home = useHomeStore()

  const appVersion = __APP_VERSION__

  let tl: gsap.core.Timeline | null = null

  gsap.registerPlugin(ScrollTrigger)

  // 创建背景滚动动画：随滚动从模糊+放大 过渡到 清晰+正常大小
  const createBackgroundAnimation = () => {
    tl?.kill()
    tl = null
    tl = gsap
      .timeline({
        scrollTrigger: {
          trigger: '#show-background',
          start: 'top 100%',
          end: 'top 0',
          scrub: 0.8
        }
      })
      .fromTo(
        '#background',
        {
          filter: `blur(20px) brightness(${general.isDark ? 30 : 50}%)`,
          scale: 1.3
        },
        {
          filter: `blur(0px) brightness(100%)`,
          scale: general.isMobile ? 1 : 1.15,
          ease: 'none'
        }
      )
  }

  const openSettingsDrawer = () => {
    home.setSettingsDrawerOpen(true)
  }

  // 挂载时创建动画 + 拉取壁纸
  onMounted(() => {
    createBackgroundAnimation()
    home.fetchBackground(home.backgroundMode)
  })
  // 卸载时销毁时间线
  onUnmounted(() => {
    tl?.kill()
    tl = null
  })
  // 主题/设备变化时重建动画（参数依赖 isDark/isMobile）
  watch(() => general.isDark, createBackgroundAnimation)
  watch(() => general.isMobile, createBackgroundAnimation)
</script>
<template>
  <div>
    <jay-background />
    <n-config-provider v-if="!general.isMobile" :theme-overrides="general.isDark ? homeTheme.dark.desktop : homeTheme.light.desktop">
      <div class="max-w-7xl mx-auto w-full flex gap-4 px-4">
        <aside class="w-3xs sticky top-4 self-start flex flex-col gap-4">
          <jay-avatar />

          <n-card size="small" title="简介">
            <jay-introduction />
          </n-card>

          <n-card size="small" title="技术栈" content-class="flex flex-row flex-wrap gap-2">
            <jay-tech-list />
          </n-card>

          <n-card size="small" content-class="flex flex-col">
            <jay-footer :app-version="appVersion" />
          </n-card>
        </aside>

        <main class="flex-1 min-w-0 flex flex-col gap-4">
          <section class="min-h-screen flex flex-col justify-between relative">
            <div></div>

            <div class="flex items-center justify-between text-white">
              <div class="flex-1 flex flex-col gap-2">
                <div class="w-2/3">
                  <jay-yi-yan />
                </div>

                <jay-contact-me />
              </div>

              <div>
                <jay-datetime date-text-align="text-right" time-text-align="text-right" />
              </div>
            </div>

            <div>
              <jay-site />

              <jay-scroll-tip />
            </div>
          </section>

          <section class="flex flex-col gap-4">
            <jay-heatmap v-slide-in />

            <n-card title="日志" v-slide-in>
              <jay-log />
            </n-card>

            <n-card v-magnetic @click="openSettingsDrawer" size="small" content-class="flex items-center justify-center gap-5" v-slide-in>
              <n-icon size="40"><tune-round /></n-icon>
              <p class="text-xl font-bold">设置</p>
            </n-card>
          </section>
        </main>
      </div>
      <jay-drawer />
    </n-config-provider>
    <n-config-provider v-else :theme-overrides="general.isDark ? homeTheme.dark.mobile : homeTheme.light.mobile">
      <main class="flex flex-col gap-2 p-2">
        <section class="w-full h-[calc(100dvh-53px)] flex flex-col justify-between">
          <div class="w-2/3 mx-auto">
            <jay-avatar />
          </div>

          <div class="flex flex-col gap-1 text-white">
            <div class="flex flex-row justify-between items-center">
              <jay-datetime date-text-size="text-lg" time-text-size="text-4xl" />
            </div>

            <div>
              <jay-yi-yan hitokoto-size="text-base" from-size="text-sm" />
            </div>

            <jay-contact-me />
          </div>

          <div>
            <jay-site />

            <jay-scroll-tip :size="28" />
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <jay-heatmap v-slide-in />

          <n-card title="日志" v-slide-in>
            <jay-log />
          </n-card>
          <n-card title="简介" v-slide-in>
            <jay-introduction />
          </n-card>

          <n-card v-slide-in title="技术栈" content-class="flex flex-row flex-wrap gap-2">
            <jay-tech-list />
          </n-card>

          <jay-theme-change v-slide-in />

          <jay-background-change v-slide-in />
        </section>

        <n-card size="small" class="!sticky bottom-0" content-class="flex flex-row justify-center gap-1 text-xs">
          <jay-footer :app-version="appVersion" />
        </n-card>
      </main>
    </n-config-provider>
    <div id="show-background" class="h-dvh invisible"></div>
  </div>
</template>

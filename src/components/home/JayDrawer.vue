<script setup lang="ts">
  import { useHomeStore, useGeneralStore } from '../../stores'

  import JayThemeChange from './JayThemeChange.vue'
  import JayBackgroundChange from './JayBackgroundChange.vue'
  import JayLogin from './JayLogin.vue'

  const home = useHomeStore()
  const general = useGeneralStore()

  withDefaults(defineProps<{ size?: string }>(), {
    size: '40%'
  })

  // 关闭详情抽屉
  const closeDrawer = () => {
    home.setSettingsDrawerOpen(false)
  }
</script>

<template>
  <n-drawer v-if="!general.isMobile" :show="home.isSettingsDrawerOpen" :width="size" placement="right" @update:show="closeDrawer">
    <n-drawer-content title="设置" body-content-class="flex flex-col gap-4">
      <jay-theme-change />

      <jay-background-change />

      <jay-login />
      <template #footer>
        <n-button v-magnetic secondary @click="closeDrawer()">关闭</n-button>
      </template>
    </n-drawer-content>
  </n-drawer>
  <n-drawer v-else :show="home.isSettingsDrawerOpen" :height="size" placement="bottom" @update:show="closeDrawer">
    <n-drawer-content title="设置" body-content-class="flex flex-col gap-4">
      <jay-theme-change />

      <jay-background-change />

      <jay-login />
      <template #footer>
        <n-button v-magnetic secondary @click="closeDrawer()">关闭</n-button>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

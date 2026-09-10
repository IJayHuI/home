<script setup lang="ts">
  /**
   * 登录 / 管理员面板
   * 未登录显示登录表单，登录后显示管理员面板
   */
  import { LockRound, LogOutRound, AdminPanelSettingsRound, ArticleRound } from '@vicons/material'
  import type { LoginPayload } from '../../types/auth'
  import { ref } from 'vue'
  import { useMessage } from 'naive-ui'
  import { useAuthStore } from '../../stores'

  const auth = useAuthStore()
  const message = useMessage()
  const form = ref<LoginPayload>({
    email: '',
    password: ''
  })
  const confirm = async () => {
    try {
      auth.setShowSpin(true)
      await auth.login(form.value)
      message.success('登录成功')
      form.value = { email: '', password: '' }
    } catch (error) {
      console.error('登录失败', error)
      message.error('登录失败')
    } finally {
      auth.setShowSpin(false)
    }
  }
  const handleLogout = async () => {
    try {
      auth.setShowSpin(true)
      await auth.logout()
      message.success('已登出')
    } catch (error) {
      console.error('登出失败', error)
      message.error('登出失败')
    } finally {
      auth.setShowSpin(false)
    }
  }
</script>
<template>
  <n-card>
    <n-spin :show="auth.showSpin" size="large" description="登录中...">
      <!-- 未登录：登录表单 -->
      <div v-if="!auth.showAdminPanel" class="flex flex-col gap-4">
        <div class="flex flex-row items-center justify-center gap-2">
          <n-icon size="40"><lock-round /></n-icon>
          <p class="text-xl font-bold">登录</p>
        </div>
        <n-form label-placement="left">
          <n-form-item label="邮箱" required>
            <n-input v-magnetic v-model:value="form.email" placeholder="请输入邮箱" />
          </n-form-item>
          <n-form-item label="密码" required>
            <n-input v-magnetic v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码" @keyup.enter="confirm" />
          </n-form-item>
          <n-form-item>
            <n-button v-magnetic class="!w-full" secondary type="success" @click="confirm">登录</n-button>
          </n-form-item>
        </n-form>
      </div>
      <!-- 已登录：管理员面板 -->
      <div v-else class="flex flex-col gap-4">
        <div class="flex flex-row items-center justify-center gap-2">
          <n-icon size="40"><admin-panel-settings-round /></n-icon>
          <p class="text-xl font-bold">管理员</p>
        </div>
        <p class="text-center text-sm opacity-60">{{ auth.user?.email }}</p>
        <router-link to="/blog" class="block">
          <n-button v-magnetic class="!w-full" secondary>
            <template #icon><n-icon><article-round /></n-icon></template>
            博客管理
          </n-button>
        </router-link>
        <n-button v-magnetic class="!w-full" secondary type="error" @click="handleLogout">
          <template #icon><n-icon><log-out-round /></n-icon></template>
          登出
        </n-button>
      </div>
    </n-spin>
  </n-card>
</template>

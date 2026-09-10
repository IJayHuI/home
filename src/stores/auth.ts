import { defineStore } from 'pinia'
import { ref } from 'vue'
import { signIn, signOut, getSession, onAuthStateChange } from '../api/auth'
import type { LoginPayload } from '../types/auth'
import type { User } from '@supabase/supabase-js'

/**
 * 认证状态 store
 *
 * 职责：持有当前登录用户；提供 login/logout actions
 * 基于 Supabase Auth，session 由 Supabase 管理（localStorage），
 *   不需要 Pinia persist
 *
 * 登录即管理员（个人网站，后续可扩展角色）
 */
export const useAuthStore = defineStore('auth', () => {
  // state
  const user = ref<User | null>(null)
  const showSpin = ref<boolean>(false)
  const showAdminPanel = ref<boolean>(false)

  // getters
  const isAdmin = () => user.value !== null

  // setters
  function setShowSpin(v: boolean) {
    showSpin.value = v
  }
  function setShowAdminPanel(v: boolean) {
    showAdminPanel.value = v
  }

  // actions
  async function login(payload: LoginPayload) {
    const u = await signIn(payload)
    user.value = u
    showAdminPanel.value = true
  }

  async function logout() {
    await signOut()
    user.value = null
    showAdminPanel.value = false
  }

  // 初始化：刷新页面时恢复登录态 + 监听认证状态变化
  async function initAuth() {
    const session = await getSession()
    if (session?.user) {
      user.value = session.user
      showAdminPanel.value = true
    }
    onAuthStateChange((u) => {
      user.value = u
      showAdminPanel.value = u !== null
    })
  }

  return {
    user,
    showSpin,
    showAdminPanel,
    isAdmin,
    setShowSpin,
    setShowAdminPanel,
    login,
    logout,
    initAuth
  }
})

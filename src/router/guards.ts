import type { Router } from 'vue-router'
import { useGeneralStore } from '../stores'
import { useAuthStore } from '../stores/auth'
import generalConfig from '../configs/general.json'

const LOADING_ANIMATION_DURATION = generalConfig.loadingDuration * 1000

/**
 * 路由守卫：
 * 1. 权限检查：meta.requiresAdmin 的路由需登录，未登录跳回首页
 * 2. 显示全局 Loading（事件+1）
 * 3. 延迟（等待进入动画结束）
 * 4. 导航至目标页面
 * 5. 导航完成后延迟停止 Loading（事件-1）
 *    — 延迟一个宏任务，让 onMounted 的 fetch 先 startLoading，
 *      避免 count 归 0 触发退出动画后被 fetch 打断
 *
 * 个人网站登录即管理员，后续可扩展角色
 */
export async function setupRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    if (to.meta.requiresAdmin) {
      const auth = useAuthStore()
      if (!auth.isAdmin()) {
        return { name: 'Home' }
      }
    }
    const general = useGeneralStore()
    general.startLoading()
    await new Promise((resolve) => setTimeout(resolve, LOADING_ANIMATION_DURATION))
    return true
  })

  router.afterEach(() => {
    // 导航完成：延迟一个宏任务再 stopLoading
    // 确保 onMounted 的 fetch（withLoading → startLoading）先执行，
    // count 从 2→1 而非 1→0→1，避免退出动画闪烁
    setTimeout(() => {
      const general = useGeneralStore()
      general.stopLoading()
    }, 0)
  })
}

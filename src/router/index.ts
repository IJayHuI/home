import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/home/HomeView.vue')
  },
  {
    path: '/navigate',
    name: 'Navigate',
    component: () => import('../views/navigate/NavigateView.vue')
  },
  {
    path: '/project',
    name: 'Project',
    component: () => import('../views/project/ProjectView.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/about/AboutView.vue')
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('../views/blog/BlogView.vue'),
    meta: { requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 装配路由守卫（拦截 meta.requiresAdmin 的路由）
setupRouterGuards(router)

export default router

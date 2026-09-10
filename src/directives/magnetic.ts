/**
 * 磁力光标指令 v-magnetic
 *
 * 功能：
 * 1. 替换系统光标为自定义四角框选光标（白色 + 黑色外描边）
 * 2. hover 目标元素时光标扩展框选，带阻尼跟随
 * 3. active（mousedown）时光标 padding 收缩
 * 4. 合并了原 v-interaction 的 hover 缩放效果（作用于光标而非元素本身）
 *
 * 用法：在需要磁力吸附的元素上加 v-magnetic
 * 启用条件：由 JayGui.vue 根据页面 config 的 customCursor: true 调用 activateCursor/deactivateCursor
 */
import type { Directive } from 'vue'
import { gsap } from 'gsap'
import { isMobile } from '../utils'

// ===== 可配置常量 =====
const CORNER_SIZE = 12 // 每个角框尺寸 px
const CORNER_BORDER = 2 // 边框宽度 px
const CORNER_RADIUS = 4 // 角框圆角 px
const POINTER_SIZE = 32 // 默认光标容器尺寸 px
const DOT_SIZE = 6 // 中心圆点直径 px
const HOVER_SCALE_MIN = 1.15 // 小元素最大缩放比例
const HOVER_SCALE_MAX = 1.02 // 大元素最小缩放比例
const HOVER_PADDING = 8 // hover 时光标与目标元素的间距 px（每侧）
const ACTIVE_PADDING = 2 // active 时光标与目标元素的间距 px（每侧）
const DAMPING = 0.1 // hover 时外框跟随鼠标的阻尼系数
const FOLLOW_DURATION = 0.15 // 外框缓动跟随时长 s
const TRANSITION_DURATION = 0.3 // 尺寸过渡时长 s

interface MagneticEl extends HTMLElement {
  _enter?: () => void
  _leave?: () => void
  _resizeObs?: ResizeObserver
}

// ===== 单例光标状态 =====
let pointerEl: HTMLElement | null = null // 光标容器（四个角的父元素）
let dotEl: HTMLElement | null = null // 中心圆点
let xTo: gsap.QuickToFunc | null = null // 外框 X 缓动
let yTo: gsap.QuickToFunc | null = null // 外框 Y 缓动
let xToDot: gsap.QuickToFunc | null = null // 圆点 X 即时跟随
let yToDot: gsap.QuickToFunc | null = null // 圆点 Y 即时跟随
let currentTarget: HTMLElement | null = null
let isActive = false // mousedown 状态
let lastMouseX = 0 // 最近一次鼠标 X 坐标
let lastMouseY = 0 // 最近一次鼠标 Y 坐标
let cursorStyleEl: HTMLStyleElement | null = null // 全局 cursor:none 样式

/** 根据元素尺寸动态计算缩放比例：越小放大越多，越大放大越少 */
function getDynamicScale(el: HTMLElement): number {
  const size = el.getBoundingClientRect().width
  const minSize = 30
  const maxSize = 500
  if (size <= minSize) return HOVER_SCALE_MIN
  if (size >= maxSize) return HOVER_SCALE_MAX
  const progress = (size - minSize) / (maxSize - minSize)
  return HOVER_SCALE_MIN + (HOVER_SCALE_MAX - HOVER_SCALE_MIN) * progress
}

/** 创建光标元素（单例，仅桌面端） */
function ensurePointer() {
  if (pointerEl) return
  if (isMobile()) return

  // 容器：无自身边框，仅作为四个角框的定位容器
  pointerEl = document.createElement('div')
  pointerEl.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: ${POINTER_SIZE}px;
    height: ${POINTER_SIZE}px;
    pointer-events: none;
    z-index: 9999;
  `

  // 四个角框 — 白色边框 + 黑色描边（drop-shadow 只描实际渲染的边，不影响 none 边）
  const cornerBase = `position:absolute;width:${CORNER_SIZE}px;height:${CORNER_SIZE}px;border:${CORNER_BORDER}px solid white;filter:drop-shadow(0 0 3px black);`
  const cornerStyles: Record<string, string> = {
    tl: `top:0;left:0;border-right:none;border-bottom:none;border-top-left-radius:${CORNER_RADIUS}px;`,
    tr: `top:0;right:0;border-left:none;border-bottom:none;border-top-right-radius:${CORNER_RADIUS}px;`,
    bl: `bottom:0;left:0;border-right:none;border-top:none;border-bottom-left-radius:${CORNER_RADIUS}px;`,
    br: `bottom:0;right:0;border-left:none;border-top:none;border-bottom-right-radius:${CORNER_RADIUS}px;`
  }
  for (const pos of Object.keys(cornerStyles)) {
    const c = document.createElement('div')
    c.style.cssText = cornerBase + cornerStyles[pos]
    pointerEl.appendChild(c)
  }

  // 中心圆点（独立跟随，无延迟）— 白色 + 黑色外描边
  dotEl = document.createElement('div')
  dotEl.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: ${DOT_SIZE}px;
    height: ${DOT_SIZE}px;
    background: white;
    filter:drop-shadow(0 0 3px black);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
  `

  document.body.appendChild(pointerEl)
  document.body.appendChild(dotEl)

  // 自动居中（gsap 的 xPercent/yPercent 让 transform 锚点在元素中心）
  gsap.set(pointerEl, { xPercent: -50, yPercent: -50, opacity: 0 })
  gsap.set(dotEl, { xPercent: -50, yPercent: -50, opacity: 0 })

  // 外框平滑跟随（略带延迟）
  xTo = gsap.quickTo(pointerEl, 'x', { duration: FOLLOW_DURATION, ease: 'power3.out' })
  yTo = gsap.quickTo(pointerEl, 'y', { duration: FOLLOW_DURATION, ease: 'power3.out' })
  // 圆点即时跟随（无延迟）
  xToDot = gsap.quickTo(dotEl, 'x', { duration: 0.01, ease: 'none' })
  yToDot = gsap.quickTo(dotEl, 'y', { duration: 0.01, ease: 'none' })

  // 注册全局事件：鼠标移动 + 按下/抬起
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)
}

/** 同步光标尺寸和圆角到当前目标元素 */
function syncTarget() {
  if (!currentTarget || !pointerEl) return
  const rect = currentTarget.getBoundingClientRect()
  const computed = window.getComputedStyle(currentTarget)
  const radius = computed.borderRadius
  const padding = isActive ? ACTIVE_PADDING : HOVER_PADDING
  // 尺寸 = 目标元素 + 两侧 padding
  gsap.to(pointerEl, {
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    duration: TRANSITION_DURATION,
    ease: 'power3.out',
    overwrite: 'auto'
  })
  // 将目标元素的圆角应用到四个角框的外侧角
  const r = radius && radius !== '0px' ? radius : '0px'
  const corners = pointerEl.children
  if (corners[0]) (corners[0] as HTMLElement).style.borderTopLeftRadius = `${r}`
  if (corners[1]) (corners[1] as HTMLElement).style.borderTopRightRadius = `${r}`
  if (corners[2]) (corners[2] as HTMLElement).style.borderBottomLeftRadius = `${r}`
  if (corners[3]) (corners[3] as HTMLElement).style.borderBottomRightRadius = `${r}`
}

/** 鼠标移动：圆点即时跟随，外框缓动跟随 */
function handleMouseMove(e: MouseEvent) {
  lastMouseX = e.clientX
  lastMouseY = e.clientY

  // 圆点始终即时跟随鼠标
  xToDot?.(e.clientX)
  yToDot?.(e.clientY)

  if (currentTarget) {
    // hover 中：外框位置 = 目标元素中心 + 鼠标偏移量 × 阻尼
    const rect = currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * DAMPING
    const dy = (e.clientY - cy) * DAMPING
    xTo?.(cx + dx)
    yTo?.(cy + dy)
  } else {
    // 非 hover：外框缓动跟随鼠标
    xTo?.(e.clientX)
    yTo?.(e.clientY)
  }
}

/** 按下：光标收缩（无论是否 hover 元素） */
function handleMouseDown() {
  isActive = true
  if (currentTarget) {
    gsap.to(currentTarget, { scale: 1, duration: 0.1, ease: 'power2.out' })
    syncTarget()
  } else if (pointerEl) {
    // 非 hover：缩小默认光标尺寸
    gsap.to(pointerEl, {
      width: POINTER_SIZE * 0.8,
      height: POINTER_SIZE * 0.8,
      duration: TRANSITION_DURATION,
      ease: 'power3.out',
      overwrite: 'auto'
    })
  }
}

/** 抬起：光标恢复 */
function handleMouseUp() {
  isActive = false
  if (currentTarget) {
    gsap.to(currentTarget, { scale: getDynamicScale(currentTarget), duration: 0.2, ease: 'power2.out' })
    syncTarget()
  } else if (pointerEl) {
    gsap.to(pointerEl, {
      width: POINTER_SIZE,
      height: POINTER_SIZE,
      duration: TRANSITION_DURATION,
      ease: 'power3.out',
      overwrite: 'auto'
    })
  }
}

/** 注入全局样式：隐藏系统光标（包括 a/button 的手型） */
function hideSystemCursor() {
  if (cursorStyleEl) return
  cursorStyleEl = document.createElement('style')
  cursorStyleEl.textContent = `
    *, *::before, *::after {
      cursor: none !important;
    }
  `
  document.head.appendChild(cursorStyleEl)
}

/** 移除全局样式，恢复系统光标 */
function showSystemCursor() {
  cursorStyleEl?.remove()
  cursorStyleEl = null
}

/** 激活光标（幂等，由 JayGui 根据页面配置调用） */
export function activateCursor() {
  if (isMobile()) return
  if (pointerEl) return // 已激活
  ensurePointer()
  hideSystemCursor()
  if (pointerEl) gsap.set(pointerEl, { opacity: 1 })
  if (dotEl) gsap.set(dotEl, { opacity: 1 })
}

/** 停用光标（幂等，由 JayGui 根据页面配置调用） — 彻底销毁，停止计算 */
export function deactivateCursor() {
  if (!pointerEl) return // 未激活
  showSystemCursor()
  // 移除全局事件
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mouseup', handleMouseUp)
  // 移除 DOM
  pointerEl?.remove()
  dotEl?.remove()
  pointerEl = null
  dotEl = null
  xTo = null
  yTo = null
  xToDot = null
  yToDot = null
  currentTarget = null
  isActive = false
}

/** 恢复光标到默认状态（非 hover） */
function resetPointer() {
  if (!pointerEl) return
  gsap.to(pointerEl, {
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    duration: TRANSITION_DURATION,
    ease: 'power3.out',
    overwrite: 'auto'
  })
  // 重置四个角框的外侧圆角为默认值
  const corners = pointerEl.children
  if (corners[0]) (corners[0] as HTMLElement).style.borderTopLeftRadius = `${CORNER_RADIUS}px`
  if (corners[1]) (corners[1] as HTMLElement).style.borderTopRightRadius = `${CORNER_RADIUS}px`
  if (corners[2]) (corners[2] as HTMLElement).style.borderBottomLeftRadius = `${CORNER_RADIUS}px`
  if (corners[3]) (corners[3] as HTMLElement).style.borderBottomRightRadius = `${CORNER_RADIUS}px`
  xTo?.(lastMouseX)
  yTo?.(lastMouseY)
}

// ===== 指令 =====
const magnetic: Directive = {
  mounted(el: MagneticEl) {
    // 鼠标进入目标：光标扩展框选元素，目标元素轻微放大，监听尺寸变化
    el._enter = () => {
      currentTarget = el
      isActive = false
      syncTarget()
      gsap.to(el, { scale: getDynamicScale(el), duration: 0.2, ease: 'power2.out' })
      el._resizeObs = new ResizeObserver(() => syncTarget())
      el._resizeObs.observe(el)
    }

    // 鼠标离开目标：光标缩回默认，目标元素恢复
    el._leave = () => {
      currentTarget = null
      isActive = false
      gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' })
      el._resizeObs?.disconnect()
      el._resizeObs = undefined
      resetPointer()
    }

    el.addEventListener('mouseenter', el._enter)
    el.addEventListener('mouseleave', el._leave)
  },

  unmounted(el: MagneticEl) {
    el._resizeObs?.disconnect()
    if (currentTarget === el) {
      currentTarget = null
      resetPointer()
    }
    el.removeEventListener('mouseenter', el._enter!)
    el.removeEventListener('mouseleave', el._leave!)
  }
}

export default magnetic

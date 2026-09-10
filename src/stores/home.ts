import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BackgroundMode } from '../types/theme'
import type { BingBackground, LogData, YiYanData, HeatmapData } from '../types/home'
import { getBingBackground, getLogs, getYiYan, getHeatmapDatas } from '../api'
import { getLocalBackgroundImage, withLoading, preloadImage } from '../utils'

/**
 * 首页 store
 *
 * 职责：持有壁纸、头像、日志、时间、一言、热力图等首页所需数据；
 * 提供 fetchXxx actions 从 api 层拉取数据。
 *
 * 持久化：仅 backgroundMode（壁纸偏好 bing/local）。
 */
export const useHomeStore = defineStore(
  'home',
  () => {
    // --- state：壁纸 ---
    // 壁纸模式：bing / local
    const backgroundMode = ref<BackgroundMode>('bing')
    // 当前展示的壁纸地址
    const backgroundSrc = ref('')
    // Bing 壁纸原始数据（含标题/版权，用于展示）
    const bingBackground = ref<BingBackground>({ src: '', title: '', copyright: '' })
    // 壁纸切换时的提示文字
    const backgroundMessage = ref('')

    // --- state：头像 ---
    // 头像地址
    const avatarSrc = ref('')
    // 头像是否已翻转（点击翻转显示背面）
    const isAvatarFlipped = ref(false)
    // 头像点击次数
    const avatarClickCount = ref(0)
    // 头像背面文字
    const avatarBackText = ref('你好')
    // 头像背面背景色（渐变）
    const avatarBackColor = ref('135deg, #FDEB71 10%, #F8D800 100%')

    // --- state：日志 ---
    // 日志列表
    const logs = ref<LogData[]>([])

    // --- state：时间 ---
    // 当前时间（由 JayDatetime 组件 setInterval 每秒更新）
    const currentTime = ref(new Date())

    // --- state：一言 ---
    // 一言内容
    const hitokoto = ref('')
    // 一言出处
    const yiYanSource = ref('')

    // --- state：热力图 ---
    // 热力图数据（一年的每日贡献）
    const heatmapData = ref<HeatmapData[]>([])
    // 热力图总贡献数
    const heatmapTotal = ref(0)

    // --- state：设置抽屉 ---
    const isSettingsDrawerOpen = ref(false)

    // --- setters：壁纸 ---
    function setBackgroundMode(v: BackgroundMode) {
      backgroundMode.value = v
    }
    function setBackgroundSrc(v: string) {
      backgroundSrc.value = v
    }
    function setBingBackground(v: BingBackground) {
      bingBackground.value = v
    }
    function setBackgroundMessage(v: string) {
      backgroundMessage.value = v
    }

    // --- setters：头像 ---
    function setAvatarSrc(v: string) {
      avatarSrc.value = v
    }
    function setAvatarFlipped(v: boolean) {
      isAvatarFlipped.value = v
    }
    function avatarClickCountAdd() {
      avatarClickCount.value++
    }
    function setAvatarBackText(v: string) {
      avatarBackText.value = v
    }
    function setAvatarBackColor(v: string) {
      avatarBackColor.value = v
    }

    // --- setters：日志 ---
    function setLogs(v: LogData[]) {
      logs.value = v
    }

    // --- setters：时间 ---
    function setCurrentTime(v: Date) {
      currentTime.value = v
    }

    // --- setters：一言 ---
    function setHitokoto(v: string) {
      hitokoto.value = v
    }
    function setYiYanSource(v: string) {
      yiYanSource.value = v
    }

    // --- setters：热力图 ---
    function setHeatmapData(v: HeatmapData[]) {
      heatmapData.value = v
    }
    function setHeatmapTotal(v: number) {
      heatmapTotal.value = v
    }

    // --- setters：抽屉 ---
    function setSettingsDrawerOpen(v: boolean) {
      isSettingsDrawerOpen.value = v
    }

    // --- fetch actions ---

    // 壁纸：local 直接用站内图；bing 有缓存则用缓存，否则请求 Bing，失败降级到 local
    async function fetchBackground(mode: BackgroundMode) {
      // local 模式或 bing 已有缓存：无需网络请求，直接设置并返回
      if (mode === 'local') {
        setBackgroundSrc(getLocalBackgroundImage())
        setBackgroundMessage('现在使用站内壁纸作为背景')
        return
      }
      if (bingBackground.value.src) {
        setBackgroundSrc(bingBackground.value.src)
        setBackgroundMessage('现在使用 Bing 作为背景')
        return
      }
      // 首次加载 Bing 壁纸：走 withLoading
      await withLoading(async () => {
        try {
          const bing = await getBingBackground()
          setBingBackground(bing)
          setBackgroundSrc(bing.src)
          setBackgroundMessage('现在使用 Bing 作为背景')
          // 预加载图片本体，确保 loading 退出时图片已就绪
          await preloadImage(bing.src)
        } catch {
          // Bing 获取失败，降级到站内壁纸
          setBackgroundSrc(getLocalBackgroundImage())
          setBackgroundMessage('获取 Bing 图片失败，已切换为站内壁纸')
        }
      })
    }

    // 日志（已有数据则跳过）
    async function fetchLogs() {
      if (logs.value.length > 0) return
      await withLoading(async () => {
        setLogs(await getLogs())
      })
    }

    // 一言（已有数据则跳过）
    async function fetchYiYan() {
      if (hitokoto.value) return
      await withLoading(async () => {
        const data = await getYiYan()
        setHitokoto(data.hitokoto)
        setYiYanSource(data.from)
      })
    }

    // 热力图（已有数据则跳过）
    async function fetchHeatmap() {
      if (heatmapData.value.length > 0) return
      await withLoading(async () => {
        const data = await getHeatmapDatas()
        setHeatmapData(data.heatmapData)
        setHeatmapTotal(data.totalContributions)
      })
    }

    return {
      // 壁纸
      backgroundMode,
      backgroundSrc,
      bingBackground,
      backgroundMessage,

      // 头像
      avatarSrc,
      isAvatarFlipped,
      avatarClickCount,
      avatarBackText,
      avatarBackColor,

      // 日志
      logs,

      // 时间
      currentTime,

      // 一言
      hitokoto,
      yiYanSource,

      // 热力图
      heatmapData,
      heatmapTotal,

      // 设置抽屉
      isSettingsDrawerOpen,

      // setters
      setBackgroundMode,
      setBackgroundSrc,
      setBingBackground,
      setBackgroundMessage,
      setAvatarSrc,
      setAvatarFlipped,
      avatarClickCountAdd,
      setAvatarBackText,
      setAvatarBackColor,
      setLogs,
      setCurrentTime,
      setHitokoto,
      setYiYanSource,
      setHeatmapData,
      setHeatmapTotal,
      setSettingsDrawerOpen,
      
      // fetch actions
      fetchBackground,
      fetchLogs,
      fetchYiYan,
      fetchHeatmap
    }
  },
  {
    persist: {
      key: 'home-store',
      storage: localStorage,
      pick: ['backgroundMode']
    }
  }
)

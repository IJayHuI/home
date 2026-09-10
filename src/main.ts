import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import {
  create,
  NConfigProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NLayoutSider,
  NCard,
  NIcon,
  NMenu,
  NCollapse,
  NCollapseItem,
  NButton,
  NDrawer,
  NDrawerContent,
  NSpin,
  NSpace,
  NMessageProvider,
  NScrollbar,
  NCarousel,
  NTimeline,
  NTimelineItem,
  NHeatmap,
  NAvatar,
  NInput,
  NImageGroup,
  NForm,
  NFormItem
} from 'naive-ui'
import 'vfonts/Lato.css'
import router from './router'
import slideIn from './directives/slide-in'
import magnetic from './directives/magnetic'
import interaction from './directives/interaction'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import './style.css'

// Pinia 实例 + 持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Naive UI 按需注册组件
const naive = create({
  components: [
    NConfigProvider,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NLayoutSider,
    NCard,
    NIcon,
    NMenu,
    NCollapse,
    NCollapseItem,
    NButton,
    NDrawer,
    NDrawerContent,
    NSpin,
    NSpace,
    NMessageProvider,
    NScrollbar,
    NCarousel,
    NTimeline,
    NTimelineItem,
    NHeatmap,
    NAvatar,
    NInput,
    NImageGroup,
    NForm,
    NFormItem
  ]
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(naive)
app.directive('slide-in', slideIn)
app.directive('magnetic', magnetic)
app.directive('interaction', interaction)

// 初始化认证状态（恢复 session + 监听 onAuthStateChange）
useAuthStore().initAuth()

app.mount('#app')

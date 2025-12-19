import { createRouter, createWebHistory } from 'vue-router'
import RecordView from '@/views/RecordView.vue'
import WatchView from '@/views/WatchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/record'
    },
    {
      path: '/record',
      name: 'record',
      component: RecordView
    },
    {
      path: '/watch/:uuid',
      name: 'watch',
      component: WatchView,
      props: true
    }
  ],
})

export default router

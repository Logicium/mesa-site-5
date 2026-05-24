import { createRouter, createWebHistory } from 'vue-router'
import { siteConfig } from '../config/site.config'
import { PLATFORM_ENABLED } from '@apotome/archetype-shared/platform/config'
import { adminRoutes } from '@apotome/archetype-shared/admin/routes'

const isPortfolio = siteConfig.variant === 'portfolio'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/menu', name: 'menu', component: () => import('../views/MenuView.vue') },
    { path: '/visit', name: 'visit', component: () => import('../views/VisitView.vue') },
    ...(isPortfolio
      ? [{ path: '/gallery', name: 'gallery', component: () => import('../views/GalleryView.vue') }]
      : []),
    // Admin is only mounted when the platform switch is on.
    ...(PLATFORM_ENABLED ? adminRoutes : []),
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router

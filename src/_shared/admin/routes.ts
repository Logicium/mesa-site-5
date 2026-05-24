/**
 * Admin routes. These are only registered when `PLATFORM_ENABLED` is true.
 * All routes live under `/admin` and share `AdminLayout`.
 */
import type { RouteRecordRaw } from 'vue-router'

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: () => import('./AdminLayout.vue'),
    children: [
      { path: '', name: 'admin-sites', component: () => import('./views/SitesView.vue') },
      { path: 'login', name: 'admin-login', component: () => import('./views/LoginView.vue') },
      { path: 'verify', name: 'admin-verify', component: () => import('./views/VerifyView.vue') },
      { path: 'content', name: 'admin-content', component: () => import('./views/ContentView.vue') },
      { path: 'inbox', name: 'admin-inbox', component: () => import('./views/InboxView.vue') },
      { path: 'reviews', name: 'admin-reviews', component: () => import('./views/ReviewsView.vue') },
      { path: 'instagram', name: 'admin-instagram', component: () => import('./views/InstagramView.vue') },
      { path: 'analytics', name: 'admin-analytics', component: () => import('./views/AnalyticsView.vue') },
      { path: 'domain', name: 'admin-domain', component: () => import('./views/DomainView.vue') },
      { path: 'billing', name: 'admin-billing', component: () => import('./views/BillingView.vue') },
      { path: 'deployments', name: 'admin-deployments', component: () => import('./views/DeploymentsView.vue') },
      { path: 'account', name: 'admin-account', component: () => import('./views/AccountView.vue') },
    ],
  },
]

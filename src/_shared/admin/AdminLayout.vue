<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { onMounted, computed, watch, ref, onBeforeUnmount } from 'vue'
import { useAdminAuthStore } from '../platform/adminAuthStore'
import { useActiveSiteStore } from '../platform/activeSiteStore'
import ToastHost from './components/ToastHost.vue'
import './admin.css'

const auth = useAdminAuthStore()
const activeSites = useActiveSiteStore()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  await auth.refresh()
  if (auth.owner) await activeSites.refresh()
})

watch(() => auth.owner?.id, async (id) => { if (id) await activeSites.refresh() })

const navItems = [
  { to: '/admin', label: 'Sites', exact: true },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/inbox', label: 'Inbox' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/instagram', label: 'Instagram' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/domain', label: 'Domain' },
  { to: '/admin/billing', label: 'Billing' },
  { to: '/admin/deployments', label: 'Deployments' },
]

// Don't gate the verify page — it handles its own session flow and must always render.
const requiresLogin = computed(() => !auth.owner && !auth.loading && route.name !== 'admin-login' && route.name !== 'admin-verify')
// The Sites tab itself is a multi-site overview, so don't show the dropdown there.
const showSiteSwitcher = computed(() => !!auth.owner && route.path !== '/admin' && activeSites.sites.length > 0)

const activeSite = computed(() => activeSites.sites.find(s => s.id === activeSites.activeId) ?? null)
function siteLabel(s: { slug: string; displayName?: string | null }) {
  return (s.displayName && s.displayName.trim()) || s.slug
}

// User menu (account dropdown)
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
function toggleMenu() { menuOpen.value = !menuOpen.value; if (menuOpen.value) siteMenuOpen.value = false }
function closeMenu() { menuOpen.value = false }

// Site switcher dropdown
const siteMenuOpen = ref(false)
const siteMenuRef = ref<HTMLElement | null>(null)
function toggleSiteMenu() { siteMenuOpen.value = !siteMenuOpen.value; if (siteMenuOpen.value) menuOpen.value = false }
function closeSiteMenu() { siteMenuOpen.value = false }
function pickSite(id: string) { activeSites.setActive(id); closeSiteMenu() }

function onDocClick(e: MouseEvent) {
  const target = e.target as Node
  if (menuOpen.value && menuRef.value && !menuRef.value.contains(target)) closeMenu()
  if (siteMenuOpen.value && siteMenuRef.value && !siteMenuRef.value.contains(target)) closeSiteMenu()
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

async function doLogout() {
  closeMenu()
  await auth.logout()
  router.push('/admin/login')
}

function initials(email?: string) {
  if (!email) return '·'
  const local = email.split('@')[0] || ''
  const parts = local.split(/[._-]/).filter(Boolean)

  if (parts.length === 0) {
    return local[0]?.toUpperCase() ?? '·'
  }

  const firstInitial = parts[0]?.[0]?.toUpperCase() ?? ''
  const secondInitial = parts[1]?.[0]?.toUpperCase() ?? ''

  return (firstInitial + secondInitial) || '·'
}
</script>

<template>
  <div class="admin-shell">
    <header class="admin-bar">
      <div class="admin-bar__top">
        <div class="admin-bar__inner admin-bar__inner--top">
          <RouterLink to="/admin" class="brand">
            <span class="brand__mark">A</span>
            <span class="brand__name">Apotome</span>
            <span class="brand__divider">·</span>
            <span class="brand__suffix">Admin</span>
          </RouterLink>

          <div class="admin-bar__top-spacer" />

          <div v-if="showSiteSwitcher" class="site-switcher" ref="siteMenuRef">
            <button
              type="button"
              class="site-pill"
              :class="{ 'is-open': siteMenuOpen }"
              :aria-expanded="siteMenuOpen"
              aria-haspopup="listbox"
              :title="activeSite ? `Active site: ${siteLabel(activeSite)}` : 'Active site'"
              @click.stop="toggleSiteMenu"
            >
              <span class="site-pill__mark" aria-hidden="true">◇</span>
              <span class="site-pill__label">
                <span class="site-pill__name">{{ activeSite ? siteLabel(activeSite) : 'Select site' }}</span>
                <span v-if="activeSite" class="site-pill__sub">{{ activeSite.archetype }}</span>
              </span>
              <span class="site-pill__caret" aria-hidden="true">▾</span>
            </button>
            <div v-if="siteMenuOpen" class="site-menu" role="listbox" @click.stop>
              <button
                v-for="s in activeSites.sites"
                :key="s.id"
                type="button"
                role="option"
                :aria-selected="s.id === activeSites.activeId"
                class="site-menu__item"
                :class="{ 'site-menu__item--active': s.id === activeSites.activeId }"
                @click="pickSite(s.id)"
              >
                <span class="site-menu__name">{{ siteLabel(s) }}</span>
                <span class="site-menu__meta">{{ s.archetype }}<template v-if="s.displayName && s.displayName !== s.slug"> · {{ s.slug }}</template></span>
              </button>
            </div>
          </div>

          <div class="admin-user" ref="menuRef">
            <template v-if="auth.owner">
              <button
                type="button"
                class="user-pill"
                :class="{ 'is-open': menuOpen }"
                @click.stop="toggleMenu"
                :aria-expanded="menuOpen"
                aria-haspopup="menu"
              >
                <span class="user-pill__avatar">{{ initials(auth.owner.email) }}</span>
                <span class="user-pill__email">{{ auth.owner.email }}</span>
                <span class="user-pill__caret" aria-hidden="true">▾</span>
              </button>
              <div v-if="menuOpen" class="user-menu" role="menu" @click.stop>
                <div class="user-menu__head">
                  <span class="user-menu__email">{{ auth.owner.email }}</span>
                  <span class="user-menu__name" v-if="auth.owner.name">{{ auth.owner.name }}</span>
                </div>
                <RouterLink to="/admin/account" class="user-menu__item" role="menuitem" @click="closeMenu">Account</RouterLink>
                <RouterLink to="/admin/billing" class="user-menu__item" role="menuitem" @click="closeMenu">Billing</RouterLink>
                <RouterLink to="/admin/domain" class="user-menu__item" role="menuitem" @click="closeMenu">Domain</RouterLink>
                <div class="user-menu__divider" />
                <button type="button" class="user-menu__item user-menu__item--danger" role="menuitem" @click="doLogout">Sign out</button>
              </div>
            </template>
            <template v-else-if="route.name !== 'admin-login' && route.name !== 'admin-verify'">
              <RouterLink to="/admin/login" class="adm-btn adm-btn--primary adm-btn--sm">Sign in</RouterLink>
            </template>
          </div>
        </div>
      </div>

      <nav v-if="auth.owner" class="admin-nav admin-bar__bottom" aria-label="Admin sections">
        <div class="admin-bar__inner admin-bar__inner--bottom">
          <RouterLink
            v-for="n in navItems" :key="n.to" :to="n.to"
            :exact-active-class="n.exact ? 'active' : ''" active-class="active"
          >{{ n.label }}</RouterLink>
        </div>
      </nav>
    </header>

    <main class="admin-main">
      <div v-if="requiresLogin" class="admin-gate">
        <div class="adm-empty">
          <div class="adm-empty__icon">⌬</div>
          <h2 class="adm-empty__title">Sign in to your studio</h2>
          <p class="adm-empty__body">Your sites, content, inbox and analytics live behind a secure sign-in.</p>
          <RouterLink to="/admin/login" class="adm-btn adm-btn--primary">Sign in</RouterLink>
        </div>
      </div>
      <RouterView v-else />
    </main>
    <ToastHost />
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh; display: flex; flex-direction: column;
  background:
    radial-gradient(1200px 600px at 20% -10%, var(--adm-accent-glow), transparent 60%),
    var(--adm-bg);
  color: var(--adm-text);
  font-family: var(--adm-font-sans);
}

/* ── Top bar (two rows) ─────────────────────────────────
   Row 1 (top): brand, site picker, user pill — same compact height as the
   public site navbar so it visually replaces it. Always visible.
   Row 2 (bottom): full dashboard nav, scrolls horizontally on small screens.
   The whole admin shell overlays the public layout (router renders it as a
   full route, the public AppHeader doesn't render under /admin). */
.admin-bar {
  display: flex; flex-direction: column;
  border-bottom: 1px solid var(--adm-border);
  background: color-mix(in srgb, var(--adm-bg) 78%, transparent);
  backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 50;
}
/* Match content width + horizontal padding used by `.admin-main` (1280 / 1.5rem). */
.admin-bar__inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex; align-items: center; gap: 1rem;
}
.admin-bar__top {
  padding: 0.5rem 0;
  min-height: 52px;
}
.admin-bar__top-spacer { flex: 1; }
.admin-bar__bottom {
  padding: 0.25rem 0 0.4rem;
  border-top: 1px solid var(--adm-border-soft);
  overflow-x: auto;
  scrollbar-width: thin;
}
.admin-bar__inner--bottom {
  gap: 0.15rem; align-items: stretch;
}
.admin-bar__bottom::-webkit-scrollbar { height: 4px; }
.admin-bar__bottom::-webkit-scrollbar-thumb { background: var(--adm-border-strong); border-radius: 2px; }

.brand {
  display: inline-flex; align-items: center; gap: 0.5rem;
  color: var(--adm-text); text-decoration: none;
  font-family: var(--adm-font-serif); font-size: 1.05rem;
  letter-spacing: -0.005em;
}
.brand__mark {
  width: 26px; height: 26px; display: grid; place-items: center;
  background: linear-gradient(140deg, var(--adm-accent) 0%, var(--adm-accent-deep) 100%);
  color: var(--adm-on-accent);
  border-radius: 6px; font-weight: 700;
  font-family: var(--adm-font-sans); font-size: 0.78rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
.brand__name { font-weight: 500; }
.brand__divider { color: var(--adm-text-subtle); margin: 0 0.05rem; }
.brand__suffix { color: var(--adm-text-muted); font-size: 0.85rem; }

.admin-nav { display: flex; gap: 0.15rem; }
.admin-nav a {
  color: var(--adm-text-muted);
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background 140ms, color 140ms;
}
.admin-nav a:hover { color: var(--adm-text); background: var(--adm-surface); }
.admin-nav a.active {
  color: var(--adm-text);
  background: var(--adm-surface-2);
  box-shadow: inset 0 -2px 0 var(--adm-accent);
}

/* ── Site switcher (custom pill + popover, mirrors user pill) ───────────── */
.site-switcher { position: relative; }
.site-pill {
  display: inline-flex; align-items: center; gap: 0.55rem;
  padding: 0.3rem 0.6rem 0.3rem 0.4rem;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border-strong);
  border-radius: 999px;
  color: var(--adm-text); cursor: pointer;
  font: inherit; font-size: 0.82rem;
  max-width: 280px;
  transition: background 140ms, border-color 140ms;
}
.site-pill:hover, .site-pill.is-open {
  background: var(--adm-surface-2);
  border-color: var(--adm-accent-deep);
}
.site-pill__mark {
  width: 24px; height: 24px; border-radius: 6px;
  display: grid; place-items: center;
  background: var(--adm-surface-2);
  border: 1px solid var(--adm-border);
  color: var(--adm-accent); font-size: 0.85rem; line-height: 1;
  flex: 0 0 auto;
}
.site-pill__label {
  display: inline-flex; align-items: baseline; gap: 0.35rem;
  min-width: 0; flex: 1;
}
.site-pill__name {
  font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.site-pill__sub { color: var(--adm-text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; }
.site-pill__caret { color: var(--adm-text-subtle); font-size: 0.7rem; flex: 0 0 auto; }

.site-menu {
  position: absolute; top: calc(100% + 0.4rem); left: 0;
  min-width: 260px; max-width: 360px; padding: 0.35rem;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border-strong);
  border-radius: var(--adm-radius);
  box-shadow: var(--adm-shadow-lg);
  z-index: 100;
  max-height: 60vh; overflow-y: auto;
}
.site-menu__item {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem;
  width: 100%; text-align: left;
  padding: 0.5rem 0.65rem;
  background: transparent; border: 0; border-radius: 6px;
  color: var(--adm-text); font: inherit; font-size: 0.85rem;
  cursor: pointer;
}
.site-menu__item:hover { background: var(--adm-surface-2); }
.site-menu__item--active { background: color-mix(in srgb, var(--adm-accent) 10%, transparent); }
.site-menu__item--active:hover { background: color-mix(in srgb, var(--adm-accent) 14%, transparent); }
.site-menu__name { font-weight: 600; }
.site-menu__meta { color: var(--adm-text-muted); font-size: 0.74rem; letter-spacing: 0.04em; }

/* ── User pill + menu ──────────────────────────────────── */
.admin-user { position: relative; display: flex; align-items: center; gap: 0.5rem; }

.user-pill {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.3rem 0.55rem 0.3rem 0.3rem;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border-strong);
  border-radius: 999px;
  color: var(--adm-text); cursor: pointer;
  font: inherit; font-size: 0.82rem;
  transition: background 140ms, border-color 140ms;
}
.user-pill:hover, .user-pill.is-open {
  background: var(--adm-surface-2);
  border-color: var(--adm-accent-deep);
}
.user-pill__avatar {
  width: 24px; height: 24px; border-radius: 50%;
  display: grid; place-items: center;
  background: linear-gradient(140deg, var(--adm-accent) 0%, var(--adm-accent-deep) 100%);
  color: var(--adm-on-accent); font-weight: 700; font-size: 0.7rem;
}
.user-pill__email { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-pill__caret { color: var(--adm-text-subtle); font-size: 0.7rem; }

.user-menu {
  position: absolute; top: calc(100% + 0.4rem); right: 0;
  min-width: 220px; padding: 0.4rem;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border-strong);
  border-radius: var(--adm-radius);
  box-shadow: var(--adm-shadow-lg);
  z-index: 100;
}
.user-menu__head {
  padding: 0.5rem 0.6rem 0.6rem;
  border-bottom: 1px solid var(--adm-border-soft);
  margin-bottom: 0.3rem;
  display: flex; flex-direction: column; gap: 0.15rem;
}
.user-menu__email { color: var(--adm-text); font-size: 0.85rem; }
.user-menu__name { color: var(--adm-text-muted); font-size: 0.78rem; }

.user-menu__item {
  display: block; width: 100%; text-align: left;
  padding: 0.5rem 0.6rem;
  background: transparent; border: 0; border-radius: 6px;
  color: var(--adm-text); font: inherit; font-size: 0.85rem;
  cursor: pointer; text-decoration: none;
}
.user-menu__item:hover { background: var(--adm-surface-2); }
.user-menu__item--danger { color: var(--adm-danger); }
.user-menu__item--danger:hover { background: rgba(240,122,122,0.08); }
.user-menu__divider { height: 1px; background: var(--adm-border-soft); margin: 0.3rem 0; }

/* ── Main ──────────────────────────────────────────────── */
.admin-main {
  flex: 1;
  padding: 2rem 1.5rem 4rem;
  max-width: 1280px; width: 100%;
  margin: 0 auto;
}
.admin-gate { padding-top: 2rem; }

@media (max-width: 880px) {
  .admin-bar__inner { padding: 0 0.85rem; }
  .admin-bar__top { gap: 0.5rem; }
  .user-pill__email, .site-pill__sub { display: none; }
  .site-pill { max-width: 180px; }
}
</style>

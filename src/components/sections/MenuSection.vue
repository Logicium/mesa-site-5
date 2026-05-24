<script setup lang="ts">
interface MenuItem { name: string; description?: string; price: string; tags?: string[] }
interface MenuCategory { name: string; description?: string; items: MenuItem[] }

defineProps<{
  eyebrow?: string
  title?: string
  intro?: string
  categories: MenuCategory[]
  /** Optional menu PDF or external link. */
  fullMenuUrl?: string
}>()
</script>

<!--
  MenuSection renders 3 interchangeable layouts via data-site-style on <html>.
  Style 1 · Ledger     — classic two-column dotted-leader price list (default)
  Style 2 · Tasting    — boxed cards in a grid with bold price chips
  Style 3 · Chalkboard — single dramatic column, oversized numbered courses
-->
<template>
  <section class="ap-section ap-menu">
    <div class="ap-container">
      <div class="ap-section-head">
        <span v-if="eyebrow" class="ap-eyebrow">{{ eyebrow }}</span>
        <h2>{{ title || 'Menu' }}</h2>
        <p v-if="intro" style="color: var(--ap-ink-muted)">{{ intro }}</p>
      </div>

      <!-- ── Style 1 · Ledger (default) ── -->
      <div class="ap-menu__ledger">
        <div class="ap-menu__cats">
          <section v-for="cat in categories" :key="cat.name" class="ap-menu__cat">
            <header>
              <h3>{{ cat.name }}</h3>
              <p v-if="cat.description">{{ cat.description }}</p>
            </header>
            <ul>
              <li v-for="item in cat.items" :key="item.name" class="ap-menu__item">
                <div class="ap-menu__line">
                  <span class="ap-menu__name">{{ item.name }}</span>
                  <span class="ap-menu__leader" />
                  <span class="ap-menu__price">{{ item.price }}</span>
                </div>
                <p v-if="item.description" class="ap-menu__desc">{{ item.description }}</p>
                <p v-if="item.tags?.length" class="ap-menu__tags">
                  <span v-for="t in item.tags" :key="t">{{ t }}</span>
                </p>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <!-- ── Style 2 · Tasting cards ── -->
      <div class="ap-menu__tasting">
        <section v-for="cat in categories" :key="cat.name" class="ap-menu__tasting-cat">
          <header class="ap-menu__tasting-head">
            <h3>{{ cat.name }}</h3>
            <p v-if="cat.description">{{ cat.description }}</p>
          </header>
          <ul class="ap-menu__tasting-grid">
            <li v-for="item in cat.items" :key="item.name" class="ap-menu__tasting-card">
              <div class="ap-menu__tasting-top">
                <h4>{{ item.name }}</h4>
                <span class="ap-menu__tasting-chip">{{ item.price }}</span>
              </div>
              <p v-if="item.description">{{ item.description }}</p>
              <p v-if="item.tags?.length" class="ap-menu__tasting-tags">
                <span v-for="t in item.tags" :key="t">{{ t }}</span>
              </p>
            </li>
          </ul>
        </section>
      </div>

      <!-- ── Style 3 · Chalkboard marquee ── -->
      <div class="ap-menu__chalk">
        <section v-for="cat in categories" :key="cat.name" class="ap-menu__chalk-cat">
          <header class="ap-menu__chalk-head">
            <span class="ap-menu__chalk-marker">— {{ cat.name }} —</span>
            <p v-if="cat.description">{{ cat.description }}</p>
          </header>
          <ol class="ap-menu__chalk-list">
            <li v-for="(item, i) in cat.items" :key="item.name" class="ap-menu__chalk-row">
              <span class="ap-menu__chalk-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="ap-menu__chalk-body">
                <h4>{{ item.name }}</h4>
                <p v-if="item.description">{{ item.description }}</p>
                <p v-if="item.tags?.length" class="ap-menu__chalk-tags">
                  <span v-for="t in item.tags" :key="t">{{ t }}</span>
                </p>
              </div>
              <span class="ap-menu__chalk-price">{{ item.price }}</span>
            </li>
          </ol>
        </section>
      </div>

      <p v-if="fullMenuUrl" class="ap-menu__more">
        <a :href="fullMenuUrl" target="_blank" rel="noopener" class="ap-btn ap-btn--ghost">View full menu</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* Visibility gating — only one variant renders at a time */
.ap-menu__ledger,
.ap-menu__tasting,
.ap-menu__chalk { display: none; }
[data-site-style='1'] .ap-menu__ledger { display: block; }

/* ── Style 1 · Ledger ────────────────────────────────────── */
.ap-menu__cats {
  display: grid; gap: clamp(2rem, 4vw, 3.5rem);
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
.ap-menu__cat header { margin-bottom: 1.25rem; }
.ap-menu__cat h3 { margin: 0 0 0.25rem; }
.ap-menu__cat header p { color: var(--ap-ink-muted); font-style: italic; margin: 0; }
.ap-menu__cat ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 1.1rem; }
.ap-menu__line {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: baseline; gap: 0.5rem;
  font-family: var(--ap-font-heading);
}
.ap-menu__name { font-size: 1.05rem; }
.ap-menu__price { color: var(--ap-primary); font-weight: 600; font-variant-numeric: tabular-nums; }
.ap-menu__leader {
  border-bottom: 1px dotted var(--ap-line);
  align-self: end; height: 0.7em;
}
.ap-menu__desc { margin: 0.25rem 0 0; color: var(--ap-ink-muted); font-size: 0.95rem; }
.ap-menu__tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0.4rem 0 0; }
.ap-menu__tags span {
  font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
  background: var(--ap-surface-alt); border: 1px solid var(--ap-line);
  border-radius: 999px; padding: 0.15rem 0.5rem; color: var(--ap-ink-muted);
}
[data-theme='vibrant'] .ap-menu__price { background: var(--ap-accent); color: var(--ap-ink); padding: 0 0.4rem; }

/* ── Style 2 · Tasting cards ─────────────────────────────── */
[data-site-style='2'] .ap-menu__tasting {
  display: grid; gap: clamp(2.5rem, 5vw, 4rem);
}
.ap-menu__tasting-head { text-align: center; margin-bottom: 1.5rem; }
.ap-menu__tasting-head h3 {
  margin: 0; font-size: clamp(1.5rem, 3vw, 2rem);
  position: relative; display: inline-block;
  padding: 0 1.5rem;
}
.ap-menu__tasting-head h3::before,
.ap-menu__tasting-head h3::after {
  content: ''; position: absolute; top: 50%; width: 2.5rem;
  height: 1px; background: var(--ap-line);
}
.ap-menu__tasting-head h3::before { right: 100%; }
.ap-menu__tasting-head h3::after { left: 100%; }
.ap-menu__tasting-head p { color: var(--ap-ink-muted); font-style: italic; margin: 0.5rem 0 0; }
.ap-menu__tasting-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: clamp(1rem, 2vw, 1.5rem);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.ap-menu__tasting-card {
  background: var(--ap-surface);
  border: 1px solid var(--ap-line);
  border-radius: var(--ap-radius);
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  display: flex; flex-direction: column; gap: 0.6rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.ap-menu__tasting-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--ap-shadow-lg);
}
.ap-menu__tasting-top {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;
}
.ap-menu__tasting-top h4 {
  margin: 0; font-size: 1.05rem;
  font-family: var(--ap-font-heading);
}
.ap-menu__tasting-chip {
  flex-shrink: 0;
  background: var(--ap-primary); color: var(--ap-on-primary);
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-family: var(--ap-font-mono);
  font-size: 0.78rem; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ap-menu__tasting-card p { margin: 0; color: var(--ap-ink-muted); font-size: 0.92rem; line-height: 1.5; }
.ap-menu__tasting-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.ap-menu__tasting-tags span {
  font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ap-ink-muted);
  border: 1px solid var(--ap-line); padding: 0.1rem 0.45rem; border-radius: 4px;
}
[data-theme='vibrant'] .ap-menu__tasting-card {
  border: 2.5px solid var(--ap-ink);
  box-shadow: 4px 4px 0 var(--ap-ink);
}
[data-theme='vibrant'] .ap-menu__tasting-card:hover {
  box-shadow: 6px 6px 0 var(--ap-ink);
}
[data-theme='vibrant'] .ap-menu__tasting-chip {
  background: var(--ap-accent); color: var(--ap-ink);
  border: 2px solid var(--ap-ink); border-radius: 4px;
}

/* ── Style 3 · Chalkboard marquee ─────────────────────────── */
[data-site-style='3'] .ap-menu__chalk {
  display: block;
  max-width: 760px; margin: 0 auto;
}
.ap-menu__chalk-cat + .ap-menu__chalk-cat { margin-top: clamp(3rem, 6vw, 4.5rem); }
.ap-menu__chalk-head { text-align: center; margin-bottom: 2rem; }
.ap-menu__chalk-marker {
  display: inline-block;
  font-family: var(--ap-font-heading);
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ap-primary);
}
.ap-menu__chalk-head p { color: var(--ap-ink-muted); font-style: italic; margin: 0.4rem 0 0; }
.ap-menu__chalk-list {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 1.5rem;
}
.ap-menu__chalk-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: clamp(0.85rem, 2vw, 1.5rem);
  align-items: baseline;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--ap-line);
}
.ap-menu__chalk-row:last-child { border-bottom: none; }
.ap-menu__chalk-num {
  font-family: var(--ap-font-heading);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1;
  color: var(--ap-accent);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.ap-menu__chalk-body h4 {
  margin: 0; font-size: clamp(1.15rem, 2vw, 1.4rem);
  font-family: var(--ap-font-heading);
}
.ap-menu__chalk-body p { margin: 0.35rem 0 0; color: var(--ap-ink-muted); }
.ap-menu__chalk-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem; }
.ap-menu__chalk-tags span {
  font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ap-ink-muted);
}
.ap-menu__chalk-tags span + span::before { content: '·'; margin-right: 0.4rem; }
.ap-menu__chalk-price {
  font-family: var(--ap-font-heading);
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: var(--ap-primary); font-weight: 700;
  font-variant-numeric: tabular-nums;
}
[data-theme='vibrant'] .ap-menu__chalk-num {
  color: var(--ap-ink);
  background: var(--ap-accent);
  padding: 0.1rem 0.5rem;
  border: 2px solid var(--ap-ink);
}
[data-theme='vibrant'] .ap-menu__chalk-price {
  background: var(--ap-ink); color: var(--ap-accent);
  padding: 0.1rem 0.55rem;
}

.ap-menu__more { margin-top: clamp(2rem, 4vw, 3rem); }
</style>

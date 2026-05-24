<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { contentClient } from '../../platform/contentClient'

type Order = Awaited<ReturnType<typeof contentClient.listOrders>>[number]
type BillingInfo = Awaited<ReturnType<typeof contentClient.getBillingStatus>>

const orders = ref<Order[]>([])
const error = ref<string | null>(null)
const billing = ref<Record<string, BillingInfo | null>>({})
const billingLoading = ref<Record<string, boolean>>({})
const billingMsg = ref<Record<string, string>>({})
const expanded = ref<string | null>(null)
const resolving = ref<Record<string, boolean>>({})

async function load() {
  error.value = null
  try { orders.value = await contentClient.listOrders() }
  catch (e) { error.value = e instanceof Error ? e.message : String(e) }
}

async function checkBilling(siteId: string) {
  if (!siteId) return
  billingLoading.value[siteId] = true
  billingMsg.value[siteId] = ''
  try {
    billing.value[siteId] = await contentClient.getBillingStatus(siteId)
    expanded.value = siteId
  } catch (e) {
    billingMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    billingLoading.value[siteId] = false
  }
}

async function resolveBilling(siteId: string) {
  resolving.value[siteId] = true
  billingMsg.value[siteId] = ''
  try {
    const r = await contentClient.resolveBilling(siteId)
    billingMsg.value[siteId] = `Resolved → order ${r.orderStatus}. Provisioning queued.`
    await load()
    await checkBilling(siteId)
  } catch (e) {
    billingMsg.value[siteId] = e instanceof Error ? e.message : String(e)
  } finally {
    resolving.value[siteId] = false
  }
}

async function retry(id: string) {
  await contentClient.retryOrder(id)
  await load()
}

function toggleExpand(siteId: string | undefined) {
  if (!siteId) return
  if (expanded.value === siteId) { expanded.value = null; return }
  void checkBilling(siteId)
}

onMounted(load)
</script>

<template>
  <section class="adm-page">
    <header class="adm-page__head">
      <div>
        <span class="adm-eyebrow">Account</span>
        <h1 class="adm-title">Billing</h1>
        <p class="adm-subtitle">
          Order history with live Stripe reconciliation. If an order is stuck on
          <em>pending</em> but Stripe shows it paid, you can resolve it here.
          For build/deploy logs see <RouterLink to="/admin/deployments">Deployments</RouterLink>.
        </p>
      </div>
    </header>

    <p v-if="error" class="adm-msg-err">{{ error }}</p>

    <div v-if="!orders.length" class="adm-empty">
      <p class="adm-empty__body">No orders yet.</p>
    </div>
    <div v-else class="adm-card bl-card">
      <div class="bl-table-wrap">
        <table class="adm-table bl-table">
          <thead>
            <tr><th>Created</th><th>Archetype</th><th>Plan</th><th>Status</th><th>Notes</th><th /></tr>
          </thead>
          <tbody>
            <template v-for="o in orders" :key="o.id">
              <tr>
                <td class="adm-muted">{{ new Date(o.createdAt).toLocaleString() }}</td>
                <td>{{ o.archetype }}</td>
                <td>{{ o.plan }}</td>
                <td>
                  <span
                    class="adm-badge"
                    :class="{
                      'adm-badge--live': o.status === 'live',
                      'adm-badge--failed': o.status === 'failed',
                      'adm-badge--pending': o.status !== 'live' && o.status !== 'failed',
                    }"
                  >{{ o.status }}</span>
                </td>
                <td class="adm-muted">{{ o.failureReason || '' }}</td>
                <td class="bl-actions">
                  <button
                    v-if="o.siteId"
                    type="button"
                    class="adm-btn adm-btn--ghost adm-btn--sm"
                    :disabled="!!billingLoading[o.siteId]"
                    @click="toggleExpand(o.siteId)"
                  >{{ billingLoading[o.siteId!] ? 'Checking…' : (expanded === o.siteId ? 'Hide' : 'Stripe status') }}</button>
                  <button
                    v-if="o.status === 'failed'"
                    type="button"
                    class="adm-btn adm-btn--danger adm-btn--sm"
                    @click="retry(o.id)"
                  >Retry</button>
                </td>
              </tr>
              <tr v-if="o.siteId && expanded === o.siteId" class="bl-detail-row">
                <td colspan="6">
                  <p v-if="billingMsg[o.siteId!]" class="adm-msg">{{ billingMsg[o.siteId!] }}</p>

                  <template v-if="billing[o.siteId!]">
                    <dl class="bl-grid">
                      <div><dt>Order status</dt><dd>{{ billing[o.siteId!]!.orderStatus }}</dd></div>
                      <div><dt>Stripe configured</dt><dd>{{ billing[o.siteId!]!.stripeConfigured ? 'yes' : 'no' }}</dd></div>
                      <div v-if="billing[o.siteId!]!.stripeSessionId">
                        <dt>Checkout session</dt>
                        <dd class="adm-mono">{{ billing[o.siteId!]!.stripeSessionId }}</dd>
                      </div>
                      <div v-if="billing[o.siteId!]!.session">
                        <dt>Payment status</dt>
                        <dd>{{ billing[o.siteId!]!.session?.paymentStatus || '—' }}</dd>
                      </div>
                      <div v-if="billing[o.siteId!]!.paymentIntent">
                        <dt>PaymentIntent</dt>
                        <dd>{{ billing[o.siteId!]!.paymentIntent?.status || '—' }}</dd>
                      </div>
                      <div v-if="billing[o.siteId!]!.failureReason">
                        <dt>Failure reason</dt>
                        <dd>{{ billing[o.siteId!]!.failureReason }}</dd>
                      </div>
                    </dl>

                    <p v-if="billing[o.siteId!]!.notes?.length" class="adm-muted">
                      <span v-for="(n, i) in billing[o.siteId!]!.notes" :key="i">• {{ n }}<br /></span>
                    </p>

                    <div class="bl-detail-actions">
                      <button
                        v-if="billing[o.siteId!]!.canResolve"
                        type="button"
                        class="adm-btn adm-btn--primary adm-btn--sm"
                        :disabled="!!resolving[o.siteId!]"
                        @click="resolveBilling(o.siteId!)"
                      >{{ resolving[o.siteId!] ? 'Resolving…' : 'Mark paid & provision' }}</button>
                      <button
                        type="button"
                        class="adm-btn adm-btn--ghost adm-btn--sm"
                        :disabled="!!billingLoading[o.siteId!]"
                        @click="checkBilling(o.siteId!)"
                      >Re-check</button>
                    </div>

                    <details v-if="billing[o.siteId!]!.webhookEvents?.length" class="bl-events">
                      <summary>Recent webhook events ({{ billing[o.siteId!]!.webhookEvents!.length }})</summary>
                      <ul>
                        <li v-for="ev in billing[o.siteId!]!.webhookEvents!" :key="ev.id">
                          <span class="adm-mono">{{ ev.type }}</span>
                          <span class="adm-muted"> · {{ new Date(ev.created * 1000).toLocaleString() }}</span>
                        </li>
                      </ul>
                    </details>
                  </template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bl-card { padding: 0; overflow: hidden; }
.bl-table-wrap { overflow-x: auto; }
.bl-table { min-width: 720px; }
.bl-actions { display: flex; gap: 0.4rem; justify-content: flex-end; }
.bl-detail-row > td { background: var(--adm-surface-3); padding: 1rem 1.25rem; }
.bl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.6rem 1.25rem; margin: 0 0 0.75rem; }
.bl-grid dt { color: var(--adm-text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
.bl-grid dd { margin: 0.1rem 0 0; font-size: 0.85rem; word-break: break-all; }
.adm-mono { font-family: var(--adm-font-mono); font-size: 0.8rem; }
.bl-detail-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.bl-events { margin-top: 0.75rem; font-size: 0.82rem; }
.bl-events summary { cursor: pointer; color: var(--adm-text-muted); }
.bl-events ul { margin: 0.4rem 0 0; padding-left: 1rem; }
</style>

<template>
  <div class="receipt-sheet">
    <div class="rc-head">
      <div class="rc-store">{{ settings.storeName }}</div>
      <div class="rc-tag">{{ settings.tagline }}</div>
      <div>Receipt #{{ sale.receiptNo }}</div>
      <div>{{ formatDateTime(sale.createdAt) }}</div>
    </div>

    <div v-if="customer" class="rc-row"><span>Customer</span><span>{{ customer.name }}</span></div>
    <div class="rc-div" />

    <div v-for="it in sale.items" :key="it.productId + it.price + it.name" class="rc-item-line">
      <span>{{ it.name }}</span>
      <span>
        <span class="rc-qty">{{ it.qty }} × {{ formatMoney(it.price, settings.currency) }}</span>
        {{ formatMoney(it.price * it.qty, settings.currency) }}
      </span>
    </div>

    <div class="rc-div" />
    <div class="rc-row"><span>Subtotal</span><span>{{ formatMoney(sale.subtotal, settings.currency) }}</span></div>
    <div v-if="sale.discount > 0" class="rc-row"><span>Discount</span><span>-{{ formatMoney(sale.discount, settings.currency) }}</span></div>
    <div class="rc-row"><span>Tax ({{ taxRatePercent(sale.taxRate) }}%)</span><span>{{ formatMoney(sale.taxAmount, settings.currency) }}</span></div>
    <div class="rc-div" />
    <div class="rc-row rc-total-line"><span>TOTAL</span><span>{{ formatMoney(sale.total, settings.currency) }}</span></div>

    <template v-if="pays.length > 1">
      <div v-for="p in pays" :key="p.method + p.amount" class="rc-row">
        <span>Paid · {{ paymentLabel(p.method) }}</span>
        <span>{{ formatMoney(p.amount, settings.currency) }}</span>
      </div>
    </template>
    <div v-else class="rc-row"><span>Payment</span><span>{{ paymentLabel(sale.paymentMethod) }}</span></div>

    <template v-if="cashLegs.length > 0 && sale.cashReceived != null">
      <div class="rc-row"><span>Cash</span><span>{{ formatMoney(sale.cashReceived, settings.currency) }}</span></div>
      <div class="rc-row"><span>Change</span><span>{{ formatMoney(sale.changeDue ?? 0, settings.currency) }}</span></div>
    </template>

    <div v-if="sale.paymentMethod === 'voucher' && customer" class="rc-row" style="margin-top: 6px">
      <span>Balance now</span>
      <span>{{ formatMoney(customer.balance, settings.currency) }}</span>
    </div>

    <div class="rc-footer">{{ settings.receiptFooter }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Sale } from '../types'
import { useStore } from '../store/useStore'
import { formatMoney, formatDateTime, taxRatePercent, salePayments, paymentLabel } from '../utils/format'

const props = defineProps<{ sale: Sale }>()
const store = useStore()
const settings = computed(() => store.settings)
const customer = computed(() => props.sale.customerId ? store.customers.find((c) => c.id === props.sale.customerId) : undefined)
const pays = computed(() => salePayments(props.sale))
const cashLegs = computed(() => pays.value.filter((p) => p.method === 'cash'))
</script>

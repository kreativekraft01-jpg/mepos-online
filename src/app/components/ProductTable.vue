<template>
  <div class="bg-card rounded-none border border-border overflow-hidden shadow-sm">
    <!-- Empty state -->
    <div v-if="items.length === 0" class="bg-card rounded-none flex items-center justify-center h-full min-h-[400px]">
      <div class="flex flex-col items-center gap-4 text-muted-foreground">
        <ScanBarcode class="w-24 h-24 opacity-30" :stroke-width="1.5" />
        <p class="text-xl font-medium">Scan or search for an item</p>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div :class="['grid bg-muted border-b border-border font-medium text-xs text-muted-foreground uppercase tracking-wider', isPaymentMode ? paymentColumns : normalColumns]">
        <template v-if="isPaymentMode">
          <div class="p-2">Item Name</div>
          <div class="p-2">Type</div>
          <div class="p-2">Price</div>
          <div class="p-2">Qty</div>
        </template>
        <template v-else>
          <div class="p-2 flex items-center justify-center">
            <input type="checkbox" :checked="allSelected" @change="$emit('toggle-all')" class="w-4 h-4 cursor-pointer accent-primary rounded-none border-border bg-input" />
          </div>
          <div class="p-2">Product / Stock</div>
          <div class="p-2 text-center">Category</div>
          <div class="p-2 text-center">Box ID</div>
          <div class="p-2 text-left">Type</div>
          <div class="p-2 text-center">Price</div>
          <div class="p-2 text-center">Qty</div>
        </template>
      </div>

      <!-- Body -->
      <div class="divide-y divide-border">
        <template v-for="item in items" :key="item.id">
          <component :is="isPaymentMode ? 'div' : SwipeableItem" v-bind="isPaymentMode ? {} : { class: 'group' }" @delete="!isPaymentMode && $emit('remove-item', item.id)">
            <div :class="['grid items-center min-h-[50px] bg-card transition-colors', isPaymentMode ? paymentColumns : normalColumns, !isPaymentMode ? 'group-hover:bg-muted/50' : '']">
              <template v-if="isPaymentMode">
                <div class="p-2">
                  <span class="text-sm font-medium text-foreground">{{ item.boxName }}</span>
                </div>
                <div class="p-2">
                  <span :class="['px-2 py-0.5 rounded-none text-[10px] font-bold uppercase border', getTypeBadgeColor(item.type)]">{{ item.type }}</span>
                </div>
                <div :class="['p-2 font-bold text-sm', getTypeColor(item.type)]">£{{ item.price.toFixed(2) }}</div>
                <div class="p-2 text-sm font-medium text-muted-foreground">{{ item.qty }}</div>
              </template>

              <template v-else>
                <!-- Checkbox -->
                <div class="p-2 flex items-center justify-center">
                  <input type="checkbox" :checked="selectedItems.includes(item.id)" @change="$emit('toggle-item', item.id)" class="w-4 h-4 cursor-pointer accent-primary rounded-none border-border bg-input" />
                </div>

                <!-- Box Name + Serial -->
                <div class="p-2">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium text-foreground leading-tight line-clamp-1">
                      {{ item.boxName }} <span class="text-muted-foreground font-normal">({{ item.stockLevel }})</span>
                    </span>
                    <div v-if="item.requiresSerial && !item.serialNumber" class="flex items-center gap-2">
                      <button @click.stop="$emit('add-serial-number', item.id)" class="flex items-center gap-1 px-1.5 py-0.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-none border border-destructive/30 transition-colors">
                        <AlertCircle class="w-3 h-3" />
                        <span class="text-[9px] font-bold uppercase">Add SN</span>
                      </button>
                    </div>
                    <div v-else-if="item.serialNumber" class="text-[11px] text-muted-foreground">SN: {{ item.serialNumber }}</div>
                  </div>
                </div>

                <!-- Category -->
                <div class="p-2 text-center text-xs text-muted-foreground">{{ (item.category || '').split(' / ')[1] || item.category }}</div>

                <!-- Box ID -->
                <div class="p-2 text-center text-xs font-mono text-muted-foreground opacity-70">{{ item.boxId }}</div>

                <!-- Type -->
                <div class="p-2">
                  <button @click="cycleType(item)" :class="['group/type relative flex items-center gap-2 px-3 py-1.5 border rounded-sm text-xs font-black bg-transparent hover:bg-muted/50 cursor-pointer focus:outline-none uppercase transition-all text-left w-auto', getTypeColor(item.type), getTypeBorderColor(item.type)]">
                    <span>{{ item.type === 'exchange' ? 'Exch' : item.type }}</span>
                  </button>
                </div>

                <!-- Price -->
                <div :class="['p-2 text-center font-medium text-sm', getTypeColor(item.type)]">£{{ item.price.toFixed(2) }}</div>

                <!-- Qty -->
                <div class="p-2 flex justify-center">
                  <input
                    type="number"
                    :value="item.qty"
                    @change="onQty(item.id, $event)"
                    min="1"
                    class="w-12 px-1 py-1 border border-border rounded-none text-sm text-center font-medium bg-input text-foreground focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </template>
            </div>
          </component>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, ScanBarcode } from 'lucide-vue-next'
import SwipeableItem from './SwipeableItem.vue'
import type { TransactionItem } from '../types'

const props = withDefaults(defineProps<{
  items: TransactionItem[]
  selectedItems: string[]
  isPaymentMode?: boolean
}>(), { isPaymentMode: false })

const emit = defineEmits<{
  'toggle-item': [id: string]
  'toggle-all': []
  'change-type': [id: string, type: 'sell' | 'buy' | 'exchange']
  'change-price': [id: string, price: number]
  'change-qty': [id: string, qty: number]
  'remove-item': [id: string]
  'add-serial-number': [id: string]
}>()

const paymentColumns = 'grid-cols-[2fr_1fr_1fr_1fr]'
const normalColumns = 'grid-cols-[48px_2.5fr_1fr_1fr_1.2fr_1fr_100px]'
const allSelected = computed(() => props.items.length > 0 && props.selectedItems.length === props.items.length)

function getTypeColor(type: string) {
  switch (type) {
    case 'sell': return 'text-[#39BF82]'
    case 'buy': return 'text-[#A391FA]'
    case 'exchange': return 'text-[#72B0FE]'
    default: return 'text-foreground'
  }
}
function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'sell': return 'bg-[#39BF82]/10 text-[#39BF82] border-[#39BF82]/20'
    case 'buy': return 'bg-[#A391FA]/10 text-[#A391FA] border-[#A391FA]/20'
    case 'exchange': return 'bg-[#72B0FE]/10 text-[#72B0FE] border-[#72B0FE]/20'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}
function getTypeBorderColor(type: string) {
  switch (type) {
    case 'sell': return 'border-[#39BF82]/30 hover:bg-[#39BF82]/5 hover:border-[#39BF82]/50 shadow-[0_0_15px_rgba(167,243,208,0.05)]'
    case 'buy': return 'border-[#A391FA]/30 hover:bg-[#A391FA]/5 hover:border-[#A391FA]/50 shadow-[0_0_15px_rgba(221,214,254,0.05)]'
    case 'exchange': return 'border-[#72B0FE]/30 hover:bg-[#72B0FE]/5 hover:border-[#72B0FE]/50 shadow-[0_0_15px_rgba(191,219,254,0.05)]'
    default: return 'border-border focus:border-primary'
  }
}
function cycleType(item: TransactionItem) {
  const nextType = item.type === 'sell' ? 'buy' : item.type === 'buy' ? 'exchange' : 'sell'
  emit('change-type', item.id, nextType)
}
function onQty(id: string, e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value, 10)
  emit('change-qty', id, Number.isFinite(v) && v > 0 ? v : 1)
}
</script>

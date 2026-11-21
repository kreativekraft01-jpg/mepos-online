<template>
  <div class="flex-1 flex flex-col bg-background overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
    <div class="flex items-center gap-4 p-4 border-b border-border bg-card shrink-0">
      <button @click="$emit('back')" class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors" title="Back (Esc)">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <div>
        <h1 class="text-xl font-black text-foreground uppercase tracking-wider">Refund Checkout</h1>
        <div class="text-sm text-muted-foreground font-mono mt-1">Order #{{ refundDetails.orderId }}</div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
      <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left: Amount & receipt -->
        <div class="space-y-8">
          <div class="bg-card border border-border p-8 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-primary" />
            <h2 class="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Refund Due</h2>
            <div class="text-6xl font-black text-primary font-mono tracking-tight my-4">{{ currency }}{{ refundDetails.amount.toFixed(2) }}</div>
            <div class="inline-block bg-muted px-4 py-1.5 rounded-full text-xs font-bold text-foreground uppercase tracking-wider">
              {{ refundDetails.reason || 'Refund' }}
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
              <Printer class="w-4 h-4 text-primary" /> Receipt Options
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center gap-4 p-4 bg-card border border-border cursor-pointer hover:bg-muted transition-colors group">
                <div :class="['w-6 h-6 border-2 flex items-center justify-center transition-colors', receipt.print ? 'bg-primary border-primary' : 'border-muted-foreground group-hover:border-foreground']">
                  <Check v-if="receipt.print" class="w-4 h-4 text-primary-foreground" />
                </div>
                <input type="checkbox" class="hidden" v-model="receipt.print" />
                <span class="font-bold text-foreground uppercase tracking-wide text-xs">Print Receipt</span>
              </label>
              <label class="flex items-center gap-4 p-4 bg-card border border-border cursor-pointer hover:bg-muted transition-colors group">
                <div :class="['w-6 h-6 border-2 flex items-center justify-center transition-colors', receipt.email ? 'bg-primary border-primary' : 'border-muted-foreground group-hover:border-foreground']">
                  <Check v-if="receipt.email" class="w-4 h-4 text-primary-foreground" />
                </div>
                <input type="checkbox" class="hidden" v-model="receipt.email" />
                <span class="font-bold text-foreground uppercase tracking-wide text-xs">Email Receipt</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Right: Methods -->
        <div class="flex flex-col h-full">
          <h3 class="text-sm font-bold text-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
            <Wallet class="w-4 h-4 text-primary" /> Refund Method
          </h3>

          <div class="grid grid-cols-2 gap-3 flex-1 content-start">
            <button
              v-for="m in methods"
              :key="m.id"
              @click="paymentMethod = m.id"
              :class="['flex flex-col items-start justify-center p-4 border rounded-none transition-all text-left h-24 group w-full relative', paymentMethod === m.id ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50 hover:bg-muted']"
            >
              <div :class="['mb-3 transition-colors', paymentMethod === m.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground']">
                <component :is="m.icon" class="w-6 h-6" />
              </div>
              <span :class="['font-bold text-sm uppercase tracking-wide block', paymentMethod === m.id ? 'text-primary' : 'text-foreground']">{{ m.label }}</span>
              <span class="text-[10px] font-medium text-muted-foreground mt-1">{{ m.desc }}</span>
              <div v-if="paymentMethod === m.id" class="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(204,117,73,0.5)]"></div>
            </button>
          </div>

          <div class="mt-8 pt-6 border-t border-border">
            <button @click="process" class="w-full h-16 bg-primary hover:brightness-110 text-primary-foreground font-black uppercase tracking-wider text-base transition-colors shadow-[0_0_30px_rgba(204,117,73,0.3)] flex items-center justify-center gap-3">
              <Lock class="w-5 h-5" /> Process Refund
            </button>
            <div class="text-center mt-3 text-xs text-muted-foreground font-medium">Manager authorisation required</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ArrowLeft, Printer, Wallet, Lock, Check, Ticket, CreditCard, FileText, Globe, Bitcoin, Terminal, Utensils } from 'lucide-vue-next'
import { useStore } from '@/store/useStore'

const props = defineProps<{ refundDetails: { amount: number; method?: string; reason?: string; receiptOptions?: { print: boolean; email: boolean }; orderId: string; items?: any } }>()
const emit = defineEmits<{ back: []; process: [method: string, receiptOptions: { print: boolean; email: boolean }] }>()

const store = useStore()
const currency = computed(() => store.settings.currency || '£')
const paymentMethod = ref(props.refundDetails.method || 'cash')
const receipt = reactive({
  print: props.refundDetails.receiptOptions?.print ?? true,
  email: props.refundDetails.receiptOptions?.email ?? false,
})

const methods = [
  { id: 'cash', label: 'Cash', desc: 'From Till', icon: Wallet },
  { id: 'voucher', label: 'Voucher', desc: 'Store Credit', icon: Ticket },
  { id: 'card', label: 'Card', desc: 'Original Card', icon: CreditCard },
  { id: 'cheque', label: 'Cheque', desc: 'Issue Cheque', icon: FileText },
  { id: 'paypal', label: 'PayPal', desc: 'Online Refund', icon: Globe },
  { id: 'bitcoin', label: 'Bitcoin', desc: 'Crypto Wallet', icon: Bitcoin },
  { id: 'datacash', label: 'Datacash', desc: 'Gateway Refund', icon: Terminal },
  { id: 'justeat', label: 'Just Eat', desc: 'Partner Refund', icon: Utensils },
]

function process() { emit('process', paymentMethod.value, { print: receipt.print, email: receipt.email }) }

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'Escape') { e.preventDefault(); emit('back') }
  const keyMap: Record<string, string> = { c: 'cash', v: 'voucher', r: 'card' }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && keyMap[e.key.toLowerCase()]) {
    e.preventDefault(); paymentMethod.value = keyMap[e.key.toLowerCase()]
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

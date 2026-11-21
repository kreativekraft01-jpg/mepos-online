<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[140] p-4">
      <div class="bg-card rounded-none max-w-lg w-full p-8 border border-border shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-foreground">Add Serial Number</h2>
          <button @click="$emit('cancel')" class="p-2 hover:bg-muted rounded-none transition-colors text-muted-foreground hover:text-foreground" title="Close">
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="mb-6">
          <div class="text-base text-muted-foreground mb-1 uppercase tracking-wider font-bold">Product</div>
          <div class="text-lg text-foreground font-medium">{{ boxName }}</div>
        </div>

        <div class="mb-8">
          <label class="block text-base mb-2 text-foreground font-medium">Serial Number *</label>
          <input
            ref="inputRef"
            type="text"
            v-model="serialNumber"
            placeholder="Enter serial number"
            class="w-full px-4 py-3 text-lg bg-background border-2 border-border rounded-none focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
            @keydown.enter.prevent="save"
            @keydown.esc.prevent="$emit('cancel')"
          />
        </div>

        <div class="flex gap-3">
          <button @click="$emit('cancel')" class="flex-1 px-6 py-4 border-2 border-border hover:bg-muted rounded-none text-lg transition-colors text-muted-foreground hover:text-foreground font-bold">Cancel</button>
          <button @click="save" :disabled="!serialNumber.trim()" class="flex-1 px-6 py-4 bg-primary hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-none text-lg transition-colors font-bold shadow-lg shadow-primary/20">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{ boxName: string }>()
const emit = defineEmits<{ save: [serialNumber: string]; cancel: [] }>()
const serialNumber = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function save() {
  const v = serialNumber.value.trim()
  if (v) emit('save', v)
}
onMounted(() => nextTick(() => inputRef.value?.focus()))
</script>

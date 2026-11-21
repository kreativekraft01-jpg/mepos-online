<template>
  <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="onClose"></div>
      <div class="relative bg-card rounded-none shadow-2xl w-full max-w-xl overflow-hidden border-2 border-border">
        <!-- Header -->
        <div class="bg-muted px-8 py-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-primary/20 p-2 rounded-none">
              <User class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-foreground">New Customer Signup</h2>
              <p class="text-muted-foreground text-sm">Create a new customer profile</p>
            </div>
          </div>
          <button @click="onClose" class="p-2 hover:bg-background rounded-none transition-colors text-muted-foreground hover:text-foreground">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-muted-foreground uppercase tracking-wider">First Name *</label>
              <input
                ref="firstNameInput"
                type="text"
                v-model="formData.firstName"
                placeholder="Enter first name"
                class="w-full px-4 py-3 bg-background border-2 border-border rounded-none focus:border-primary focus:outline-none text-lg text-foreground transition-colors placeholder:text-muted-foreground"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-muted-foreground uppercase tracking-wider">Last Name *</label>
              <input
                type="text"
                v-model="formData.lastName"
                placeholder="Enter last name"
                class="w-full px-4 py-3 bg-background border-2 border-border rounded-none focus:border-primary focus:outline-none text-lg text-foreground transition-colors placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">Email or Mobile Number *</label>
            <input
              type="text"
              v-model="formData.contactInfo"
              placeholder="Enter email or mobile number"
              class="w-full px-4 py-3 bg-background border-2 border-border rounded-none focus:border-primary focus:outline-none text-lg text-foreground transition-colors placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="button"
            @click="formData.optIn = !formData.optIn"
            class="flex items-center gap-3 w-full p-4 rounded-none hover:bg-muted transition-all text-left group px-0 py-4"
          >
            <CheckSquare v-if="formData.optIn" class="w-6 h-6 text-primary" />
            <Square v-else class="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            <span class="text-foreground font-medium select-none">Opt-in customer for marketing communication (optional)</span>
          </button>

          <div class="flex gap-4 pt-4">
            <button type="button" @click="onClose" class="flex-1 px-6 py-4 border-2 border-border rounded-none text-muted-foreground font-bold hover:bg-muted hover:text-foreground transition-colors uppercase tracking-widest">Cancel</button>
            <button type="submit" class="flex-1 px-6 py-4 bg-primary hover:brightness-110 text-primary-foreground rounded-none font-bold transition-all shadow-lg active:scale-95 uppercase tracking-widest">Create Customer</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { X, User, CheckSquare, Square } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; signup: [customer: any] }>()

const firstNameInput = ref<HTMLInputElement | null>(null)
const formData = reactive({ firstName: '', lastName: '', contactInfo: '', optIn: false })

watch(() => props.isOpen, (v) => {
  if (v) {
    formData.firstName = ''
    formData.lastName = ''
    formData.contactInfo = ''
    formData.optIn = false
    nextTick(() => firstNameInput.value?.focus())
  }
})

function onClose() { emit('close') }

function handleSubmit() {
  if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.contactInfo.trim()) {
    toast.error('Please fill in all required fields (Name and Email/Mobile)')
    return
  }
  const payload = { ...formData }
  emit('signup', payload)
  toast.success(`Customer ${formData.firstName} ${formData.lastName} created successfully!`)
  // parent responsible for closing; reset for safety if kept open
  formData.firstName = ''
  formData.lastName = ''
  formData.contactInfo = ''
  formData.optIn = false
}
</script>

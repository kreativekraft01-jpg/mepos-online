<template>
  <Modal :open="open" :title="title" @close="onCancel">
    <p style="color: var(--text-soft); font-size: 13.5px">{{ message }}</p>
    <template #footer>
      <button class="btn btn-ghost" @click="onCancel">Cancel</button>
      <button :class="['btn', danger ? 'btn-danger' : 'btn-primary']" @click="onConfirm">{{ confirmLabel }}</button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'

withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}>(), { confirmLabel: 'Delete', danger: true })

const emit = defineEmits<{ cancel: []; confirm: [] }>()
const onCancel = () => emit('cancel')
const onConfirm = () => emit('confirm')
</script>

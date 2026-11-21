<template>
  <div class="stat-card">
    <div :class="['stat-icon', color]"><slot name="icon" /></div>
    <div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ value }}</div>
      <div v-if="hint" class="stat-hint">{{ hint }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number; hint?: string; color?: string }>()
</script>

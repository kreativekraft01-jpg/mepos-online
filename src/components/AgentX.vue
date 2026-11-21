<template>
  <svg
    class="neural-knot"
    :width="size"
    :height="size"
    :data-state="state"
    :data-size="size <= 22 && state === 'idle' ? 'small' : undefined"
    aria-hidden="true"
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient :id="`${uid}-rim1`" x1="20" y1="20" x2="220" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#00F5D4" /><stop offset="100%" stop-color="#A855F7" />
      </linearGradient>
      <linearGradient :id="`${uid}-rim2`" x1="220" y1="20" x2="20" y2="220" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#A855F7" /><stop offset="100%" stop-color="#00F5D4" />
      </linearGradient>
      <linearGradient :id="`${uid}-pa`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#A855F7" stop-opacity="0" />
        <stop offset="50%" stop-color="#00F5D4" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1" />
      </linearGradient>
      <linearGradient :id="`${uid}-pb`" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8" stop-opacity="0" />
        <stop offset="50%" stop-color="#A855F7" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="1" />
      </linearGradient>
      <filter :id="`${uid}-glow`" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <path :id="`${uid}-a1`" d="M 103 45 L 95 37 A 38 38 0 0 0 41 91 L 106 156" />
      <path :id="`${uid}-a2`" d="M 84 106 L 149 41 A 38 38 0 0 1 203 95 L 195 103" />
      <path :id="`${uid}-a3`" d="M 134 84 L 199 149 A 38 38 0 0 1 145 203 L 137 195" />
      <path :id="`${uid}-a4`" d="M 156 134 L 91 199 A 38 38 0 0 1 37 145 L 45 137" />
    </defs>
    <g stroke-width="27.5" stroke-linecap="butt">
      <use :href="`#${uid}-a1`" :stroke="`url(#${uid}-rim1)`" /><use :href="`#${uid}-a2`" :stroke="`url(#${uid}-rim2)`" />
      <use :href="`#${uid}-a3`" :stroke="`url(#${uid}-rim1)`" /><use :href="`#${uid}-a4`" :stroke="`url(#${uid}-rim2)`" />
    </g>
    <g stroke-width="25" stroke-linecap="butt" stroke="#080D18">
      <use :href="`#${uid}-a1`" /><use :href="`#${uid}-a2`" /><use :href="`#${uid}-a3`" /><use :href="`#${uid}-a4`" />
    </g>
    <g stroke="#020409" stroke-width="11" stroke-linecap="butt">
      <use :href="`#${uid}-a1`" /><use :href="`#${uid}-a2`" /><use :href="`#${uid}-a3`" /><use :href="`#${uid}-a4`" />
    </g>
    <g :filter="`url(#${uid}-glow)`">
      <use :href="`#${uid}-a1`" class="nk-packet" :stroke="`url(#${uid}-pa)`" />
      <use :href="`#${uid}-a2`" class="nk-packet nk-p2" :stroke="`url(#${uid}-pb)`" />
      <use :href="`#${uid}-a3`" class="nk-packet nk-p3" :stroke="`url(#${uid}-pa)`" />
      <use :href="`#${uid}-a4`" class="nk-packet nk-p4" :stroke="`url(#${uid}-pb)`" />
      <use :href="`#${uid}-a1`" class="nk-hot" /><use :href="`#${uid}-a2`" class="nk-hot nk-p2" />
      <use :href="`#${uid}-a3`" class="nk-hot nk-p3" /><use :href="`#${uid}-a4`" class="nk-hot nk-p4" />
    </g>
    <path class="nk-core" d="M 120 106 Q 120 120 134 120 Q 120 120 120 134 Q 120 120 106 120 Q 120 120 120 106 Z" fill="#00F5D4" />
    <circle cx="120" cy="120" r="2.2" fill="#FFFFFF" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import './NeuralKnot.css'

export type AgentState = 'idle' | 'thinking' | 'answering' | 'error'

const props = withDefaults(defineProps<{ size?: number; state?: AgentState }>(), { size: 40, state: 'idle' })
const size = computed(() => props.size)
const state = computed(() => props.state)
const uid = `ax-${Math.random().toString(36).slice(2, 9)}`
</script>

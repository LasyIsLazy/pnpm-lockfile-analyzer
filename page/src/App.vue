<script setup lang="ts">
import Chart from './components/chart.vue';
import data from '../_parsed.json';
import { computed, ref } from 'vue';

const { workspace } = data;
// console.log(data);
const selected = ref();

const selectedData = computed(() => {
  const ws = data.workspace.find(item => item.id === selected.value);
  if (!ws) {
    return null
  }
  return {
    ...data,
    workspace: [ws],
  };
});
</script>

<template>
  <div>
    <div class="workspaces">
      <button
        v-for="item in workspace"
        :key="item.id"
        @click="selected = item.id"
      >
        {{ item.name }}
      </button>
    </div>
    <Chart :data="selectedData" v-if="selectedData" :key="selectedData.workspace[0].id" />
  </div>
</template>

<style scoped>
.workspaces {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>

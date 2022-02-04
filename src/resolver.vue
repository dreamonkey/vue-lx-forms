<template>
  <component
    :is="
      descriptor.component ||
      getBindingByDescriptorType(descriptor.type).component
    "
    :descriptor="descriptor"
    v-bind="$attrs"
  />
</template>

<script>
import { defineComponent } from 'vue';
import { useDescriptorProps } from './field';
import { getBindingByDescriptorType } from './register';

export default defineComponent({
  name: 'LxResolver',
  inheritAttrs: false,
  props: useDescriptorProps(),
  setup() {
    return { getBindingByDescriptorType };
  },
});
</script>

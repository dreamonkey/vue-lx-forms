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
import { getBindingByDescriptorType } from './helpers/bindings';
import { getDescriptorProps } from './helpers/component';

export default defineComponent({
  name: 'LxResolver',
  inheritAttrs: false,
  props: getDescriptorProps(),
  setup() {
    return { getBindingByDescriptorType };
  },
});
</script>

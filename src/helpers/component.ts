import { PropType, toRaw } from 'vue';
import { Descriptor } from '../models';

export function getDescriptorProps<T extends Descriptor = Descriptor>() {
  return {
    descriptor: {
      type: Object as PropType<T>,
      // "as const" is needed or Vue typings will infer required as of type "boolean" adding the prop as optional
      required: true as const,
    },
  };
}

// Return value must be set as explicit or build-in transformers type will poison it
export function extractDescriptorModel<D extends Descriptor>(
  descriptor: D
): D['model'] {
  // TODO: Vue automatically unwraps descriptor.model apparently because part of a prop (or part of the descriptor list computed)
  // and this breaks reactivity, find a way to avoid this "toRaw" usage, or make it automatic someway
  // UNTIL THEN, NEVER USE "model" DIRECTLY, ALWAYS USE THIS HELPER TO EXTRACT IT
  return toRaw(descriptor).model;
}

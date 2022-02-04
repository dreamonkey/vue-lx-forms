import { pick } from 'lodash-es';
import { PropType, toRaw } from 'vue';
import { Descriptor } from './models';

export function useDescriptorProps<T extends Descriptor = Descriptor>() {
  return {
    descriptor: {
      type: Object as PropType<T>,
      // "as const" is needed or Vue typings will infer required as of type "boolean" adding the prop as optional
      required: true as const,
    },
  };
}

// TODO: currently not reactive to descriptor change, see if this could be needed
export function useDescriptor<T extends Descriptor, K extends keyof T>(
  descriptor: T,
  allowedInputBindings: K[] = []
) {
  // TODO: model is losing TS type narrowing for some reason
  // Model must be destructured before being provided to the template,
  // or it will be automatically unwrapped by Vue, breaking the reactivity
  // TODO: Vue automatically unwraps descriptor.model apparently because part of a prop (or part of the descriptor list computed)
  // find a way to avoid this "toRaw" usage, or make it automatic someway
  // UNTIL THEN, NEVER USE "model" DIRECTLY, ALWAYS USE THIS COMPOSABLE TO EXTRACT IT
  const { model } = toRaw(descriptor);

  const inputProps = pick(descriptor, allowedInputBindings);

  return { model, inputProps };
}

import { computed } from 'vue';
import {
  Descriptor,
  DescriptorWithoutId,
  ReactiveDescriptorList,
} from '../models';
import { getBindingByDescriptorType } from './bindings';

// We need an unique id for each field, to tell Vue to avoid re-using components
let _fieldCounter = 0;

/**
 * Conditionally displays a question or an array of questions.
 * Useful only when the condition depends on the model of two or more other questions.
 */
export function createConditional(
  conditionFn: () => boolean,
  positive: ReactiveDescriptorList,
  negative: ReactiveDescriptorList = []
) {
  return computed(() => (conditionFn() ? positive : negative));
}

export function createDescriptor(
  configWithoutId: DescriptorWithoutId
): ReactiveDescriptorList {
  const config: Descriptor = {
    ...configWithoutId,
    id: `descriptor-${_fieldCounter++}`,
  };

  const { transformer } = getBindingByDescriptorType(config.type);

  return transformer ? transformer(config) : config;
}

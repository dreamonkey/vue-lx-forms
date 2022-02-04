import { computed } from 'vue';
import { BaseDescriptor, ReactiveDescriptorList, Transformer } from '../models';

export interface BinaryDescriptor extends BaseDescriptor<boolean> {
  type: 'binary';
  positive?: ReactiveDescriptorList;
  negative?: ReactiveDescriptorList;
}

export const binaryTransformer: Transformer<BinaryDescriptor> = (config) => {
  const { positive, negative, model } = config;

  // If there are no related fields, just return the field itself
  if (!positive && !negative) {
    return config;
  }

  // If there are no related fields in the active branch, return an empty array
  const computedBranch = computed(
    () => (model.value === true ? positive : negative) ?? []
  );

  return [config, computedBranch];
};

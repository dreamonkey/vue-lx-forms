import { BinaryDescriptor } from './binary';
import { MultipleSelectDescriptor, SelectDescriptor } from './select';

// When adding a preset of file descriptors, the imported package should also provide
// the needed augmentation to the FieldDescriptorMap, to avoid errors with the "type" property
// of newly added descriptors
// TODO: check if it's possible to use conditional typing to enable/disable groups of descriptors

declare module '../models' {
  interface DescriptorMap {
    binary: BinaryDescriptor;
    select: SelectDescriptor;
    'multiple-select': MultipleSelectDescriptor;
  }
}

export * from './binary';
export * from './select';

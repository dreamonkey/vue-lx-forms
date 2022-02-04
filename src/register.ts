import { castArray } from 'lodash-es';
import { Binding, DescriptorType } from './models';

const _bindingsRegistry: { [index in DescriptorType]?: Binding } = {};

export function getBindingByDescriptorType(type: DescriptorType) {
  const binding = _bindingsRegistry[type];

  if (!binding) {
    throw new Error(
      `No bindings has been provided for descriptor type ${type}`
    );
  }

  return binding;
}

export function registerDescriptors(bindings: Binding[]) {
  for (const binding of bindings) {
    for (const type of castArray(binding.type)) {
      _bindingsRegistry[type] = { ...binding, type };
    }
  }
}

export function registerDescriptor(binding: Binding) {
  registerDescriptors(castArray(binding));
}

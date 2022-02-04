import { Component, Ref } from 'vue';

/**
 * Augment this interface adding types of field descriptors to get type-safety when using helpers
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DescriptorMap {}
type DescriptorTypesKeys = keyof DescriptorMap;
export type DescriptorType = DescriptorTypesKeys extends never
  ? string
  : DescriptorTypesKeys;

/**
 * Augment this interface to add properties into the BaseFieldDescriptor interface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CustomBaseDescriptorProperties {}

export interface BaseDescriptor<Model> extends CustomBaseDescriptorProperties {
  id: string;
  type: DescriptorType;
  component?: Component;
  label: string;
  model: Ref<Model | undefined>;
}

/**
 * Helper type to define FieldDescriptors which don't have extra fields
 */
export interface SimpleDescriptor<Type extends DescriptorType, Model>
  extends BaseDescriptor<Model> {
  type: Type;
}

// Remaps all field descriptors to get their version without id property,
// as `Omit<Descriptor, 'id'>` isn't distributive and breaks the discriminated union
type DescriptorWithoutIdMap = {
  [K in keyof DescriptorMap]: Omit<DescriptorMap[K], 'id'>;
};

export type DescriptorWithoutId =
  DescriptorWithoutIdMap[keyof DescriptorWithoutIdMap];
export type Descriptor = DescriptorMap[keyof DescriptorMap];

export type ReactiveDescriptorList =
  | Ref<ReactiveDescriptorList>
  | ReactiveDescriptorList[]
  | Descriptor[]
  | Descriptor;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Transformer<T extends BaseDescriptor<any>> = (
  config: T
) => ReactiveDescriptorList;

export interface Binding {
  type: DescriptorType | DescriptorType[];
  component: Component;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformer?: Transformer<any>;
}

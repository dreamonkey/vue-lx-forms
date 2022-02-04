import { castArray, cloneDeep, flatMap, fromPairs } from 'lodash-es';
import {
  computed,
  isRef,
  reactive,
  ToRefs,
  toRefs,
  UnwrapNestedRefs,
} from 'vue';
import { Descriptor, ReactiveDescriptorList } from './models';

function unwrapDeep(possibleRef: ReactiveDescriptorList): Descriptor[] {
  // Unwraps computed properties to their current value
  while (isRef(possibleRef)) {
    possibleRef = possibleRef.value;
  }

  // Recursively applies this function to arrays and flat the result
  // This avoids using recursive Vue components to display descriptorss which conditionally display other descriptorss (binary, select, etc)
  if (Array.isArray(possibleRef)) {
    return flatMap(possibleRef, unwrapDeep);
  }

  // Return leafs of the structure (question objects) normalized as an array
  return castArray(possibleRef);
}
export function useLxForms<Model extends Record<string, unknown>>(
  initialModel: Model,
  descriptorsFn: (
    modelRefs: ToRefs<UnwrapNestedRefs<Model>>
  ) => ReactiveDescriptorList
) {
  const state = reactive(cloneDeep(initialModel));

  // Obtain a ref for every property defined into the initial model object
  const stateRefs = toRefs(state);

  // Map descriptorss name, to retrieve them later on using the ref object as key
  const descriptorsNamesMap = new Map(
    Object.entries(stateRefs).map(([name, descriptorsModel]) => [
      descriptorsModel,
      name,
    ])
  );

  // All conditional branches descriptors return a computed property bound to its model instead of a plain array
  // We unwrap everything recursively to get the snapshot of the descriptors list in a given moment
  const configuration = computed(() => unwrapDeep(descriptorsFn(stateRefs)));

  // Extract the data of current configuration returning it as a plain object
  const result = computed(() =>
    fromPairs(
      configuration.value.map(({ model: descriptor }) => {
        return [descriptorsNamesMap.get(descriptor), descriptor.value];
      })
    )
  );

  return { configuration, result, state };
}

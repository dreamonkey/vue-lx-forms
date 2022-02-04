import { computed } from 'vue';
import { BaseDescriptor, ReactiveDescriptorList, Transformer } from '../models';

export type SelectOptionObject = {
  label?: string;
  value: string;
  related?: ReactiveDescriptorList;
};
export type SelectOption = string | SelectOptionObject;

export interface BaseSelectDescriptor {
  options: SelectOption[];
}

export interface SelectDescriptor
  extends BaseDescriptor<string>,
    BaseSelectDescriptor {
  type: 'select';
}

export interface MultipleSelectDescriptor
  extends BaseDescriptor<string[]>,
    BaseSelectDescriptor {
  type: 'multiple-select';
}

function hasRelatedBranch(
  option: SelectOption
): option is SelectOptionObject & { related: ReactiveDescriptorList } {
  return typeof option !== 'string' && option.related !== undefined;
}

export const selectTransformer: Transformer<
  SelectDescriptor | MultipleSelectDescriptor
> = (config) => {
  const { options, model, type } = config;

  const computedBranches = computed(() =>
    // Options are provided manually into the configuration
    options
      .filter(hasRelatedBranch)
      .filter((option) =>
        type === 'multiple-select'
          ? model.value?.includes(option.value)
          : model.value === option.value
      )
      .map(({ related }) => related)
  );

  return [config, computedBranches];
};

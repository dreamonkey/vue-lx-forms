# Vue LX Forms

It reads as "Vue Helix Forms", named after the DNA helix from which we borrow some concepts.

We start from a declarative configuration (the DNA helix, mapping genetic instructions to biological "features") of generic "descriptors" (the nucleobases), then collect user defined bindings with components (the complementary bases) meant to render them.  
`lx-resolver` component (acting as the RNA primer) accepts the configuration as input and, sewing descriptors and components together, render the form (which represent the "biological result" encoded into the DNA).  
The user can mutate the internal state via form fields (environment-induced DNA mutations), the configuration will then adapt to these changes and show/hide form components accordingly.

Technically speaking, this is a form builder following a bring-your-components approach, but is flexible and extensible enough to render any kind of state driven component tree.
It shines when used for complex fields configurations with many business rules interconnecting fields visibility with the underlying state, while it may be overkill for simpler scenarios.

The whole system is strongly typed.

## Installation

```sh
$ yarn add @dreamonkey/vue-lx-forms
```

```ts
import LxForms, { Binding } from '@dreamonkey/vue-lx-forms';

const bindings: Binding[] = [
  // ... bindings!
];

// Vue CLI/Vite project
import { createApp } from 'vue';

const app = createApp({});

app.use(LxForms, bindings);

// Quasar CLI project (using boot files)
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  app.use(LxForms, bindings);
});
```

## Usage

Here's a guide showing how you can use the whole system.

### Define a descriptor type

Even if you can use strings too, we encurage you to use enums when possible as it helps to better manage namespaces in case you need to use the system for multiple fields sets, especially if they share components or descriptors.

```ts
// models.ts
export enum OrdersDescriptorType {
  Text = 'Text',
}
```

### Define and register the descriptor interface (TS-only)

```ts
// descriptors.ts
import { SimpleDescriptor } from '@dreamonkey/vue-lx-forms';
import { OrdersDescriptorType } from './models';

export type TextDescriptor = SimpleDescriptor<
  OrdersDescriptorType.Text,
  string
>;

declare module '@dreamonkey/vue-lx-forms' {
  interface DescriptorMap {
    [OrdersDescriptorType.Text]: TextDescriptor;
  }
}
```

### Create the component

Each descriptor type must have exactly one component registered to render it, except when using `descriptor.component` override option.
Viceversa, a component may be used to render multiple descriptors types.
Note that a single descriptor can be shared by multiple descriptor types too.

```vue
<!-- text.vue -->
<script lang="ts">
import { useDescriptor, useDescriptorProps } from '@dreamonkey/vue-lx-forms';
import { defineComponent } from 'vue';
import { TextDescriptor } from './descriptors';

export default defineComponent({
  name: 'TextField',
  inheritAttrs: false,
  props: useDescriptorProps<TextDescriptor>(),
  setup(props) {
    // Never use `descriptor` properties directly, especially `model`, always call `useDescriptor` helper
    return { ...useDescriptor(props.descriptor) };
  },
});
</script>

<template>
  <label>
    {{ descriptor.label }}
    <input v-model="model" type="text" v-bind="$attrs" />
  </label>
</template>
```

### Bind a descriptor type to a component component

```ts
// bindings.ts
import { registerDescriptor, Binding } from '@dreamonkey/vue-lx-forms';
import { OrdersDescriptorType } from './models';
import TextField from './text.vue';

export const binding: Binding = {
  type: OrdersDescriptorType.Text,
  component: TextField,
};

// You can skip this if you provide all bindings
// as the second parameter of `app.use(LxForms, bindings)`
registerDescriptor(binding);
```

### Define the configuration

Provide the initial state and the descriptor list, you'll obtain the configuration, its related result object, as well as the inner reactive state in case you need to tamper with it from outside the system.

```ts
// configuration.ts
import {
  createDescriptorList,
  createDescriptor,
  useLxForms,
} from '@dreamonkey/vue-lx-forms';
import { FormFieldType } from './models';

// You must define all properties which will be used, even if set to undefined,
// to let the system know it needs to generate a matching ref for them
const orderInitialData = {
  id: 1,
  username: 'XXXX-000',
  food: undefined,
  details: undefined,
};

const { configuration, result, state } = useLxForms(
  orderInitialData,
  // Every property of "stateRefs" contains a ref initialized with the matching property of the initial state
  (stateRefs) => [
    createDescriptor({
      type: FormFieldType.Text,
      model: stateRefs.username,
      label: 'Insert your username',
    }),
    createDescriptor({
      type: FormFieldType.Text,
      model: stateRefs.food,
      label: 'What do you want to eat?',
    }),
    // Only show the "details" when the "food" is initialized
    createConditional(
      () => stateRefs.food.value !== undefined,
      createDescriptor({
        type: FormFieldType.Text,
        model: stateRefs.details,
        label: 'Any details for the cook?',
      })
    ),
  ]
);

// Note that the result computed ref will only contain matching properties for used descriptors,
// while state is a reactive object containing all properties regardless of the current configuration
// >> result.value => { username: 'XXXX-000', food: undefined }
// >> state => { id: 1, username: 'XXXX-000', food: undefined, details: undefined }

// You can use "state" to manually tamper with the underlying data from outside the system
state.food = 'Lasagna';
// "details" is now available, since "food" is defined
// >> result.value => { username: 'XXXX-000', food: 'Lasagna', details: undefined }
state.details = 'No cheese please';
// >> result.value => { username: 'XXXX-000', food: 'Lasagna', details: 'No cheese please' }
state.food = undefined;
// "details" is now not available, since "food" is undefined, even tho its previously set value is retained
// >> result.value => { username: 'XXXX-000', food: undefined }
state.food = 'Pasta alla carbonara';
// "details" is now available again, since "food" is defined, and it retained its previously set value
// >> result.value => { username: 'XXXX-000', food: 'Pasta alla carbonara', details: 'No cheese please' }

export const { ordersFields: configuration, order: result };
```

### Render fields and use the result

```vue
<!-- form.vue -->
<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { ordersFields, order } from './configuration';

export default defineComponent({
  name: 'OrderForm',
  setup(props) {
    function logOrder() {
      console.log(order.value);
    }

    return { ordersFields, logOrder };
  },
});
</script>

<template>
  <form @submit="logOrder">
    <lx-resolver
      v-for="descriptor in ordersFields"
      :key="descriptor.id"
      :descriptor="descriptor"
    />

    <input type="submit" value="Send order" />
  </form>
</template>
```

<!-- TODO: ----- done up to here

## Core concepts

### Descriptors and components creation

Make it work > make it fast > make it beautiful

When having trouble abstracting it into the descriptor from the start, write everything into the component, then split concerns into composables and use custom descriptor descriptors properties or global properties to abstract it

At the end of the process, components should contain only the logic needed to display and interact with descriptor, not the logic

### Descriptor

TODO: add link to base descriptor descriptor interface

```ts
{
  id: string; // Automatically generated
  type: DescriptorType;
  component?: Component;
  label: string;
  model: Ref<Model | undefined>;
}
```

Use a `component` options to override/manually specify which component should be used while rendering

Adding custom global properties (TS-only)

```ts
declare module "@dreamonkey/vue-lx-forms" {
  interface CustomBaseDescriptorProperties {
    required: boolean; // Every descriptor descriptor MUST have this property
    hint?: string; // Every descriptor descriptor MAY have this property
  }
}
```

#### DescriptorFactories

Define a "cold" descriptor as a factory function, useful when stateRefs isn't available yet
Has access to the whole reactive state object
May return a computed, which is automatically unwrapped

#### Descriptor

Should be used to specify the TS type of the model of a given descriptor type, as well as descriptor-specific additional properties
Represented in TS by `SimpleDescriptor` / `BaseDescriptor`
TODO: add usage example

### Configuration

Cold vs hot configuration
Configuration may be nested, use `useLxForms` to flat it out as the components resolver expect it to be as such

`result` is a snapshot of the configuration mode at a given time
`result` isn't guaranteed to contain all properties present in the initial object, only the used ones will be present
`result` is meant to be renamed

The difference between `reactiveModel` and `result` is that the latter only contains descriptors which are actually used into the configuration
If the initial model contains an `id` property for which there isn't a corresponding descriptor in the configuration, the state won't have that property when accessed
A conditionally rendered descriptor would lead to a conditionally present property into `result`

### Components

### Transformers

### LxResolver

## Component helpers

### `useDescriptorProps`

Must be a function, cannot be `useDescriptor.props` as we need to type it
TODO: we could use `defineDescriptorComponent` to almost never use this directly

### `useDescriptor`

### `defineDescriptorComponent`

TODO: this may help to reduce verbosity for new components and avoid problems with `descriptor.model` usage without calling `useDescriptor`
Automatically set `useDescriptorProps` and call `useDescriptor`

```ts
defineDescriptorComponent<TextDescriptor>({
  name: "TextField",
  setup(props) {},
});
```

### `registerDescriptors`

Register many descriptor bindings
Can register multiple descriptor types for the same binding
You can call this from where you want and as many time you want, even at runtime
The binding registry is a singleton
The last registered binding wins in case of conflict

### `registerDescriptor`

Shorthand to call `registerDescriptors` with a single descriptor binding

### `getBindingByDescriptorType`

Get the binding registered for a given descriptor type
This can be useful when doing advanced meta programming

## Configuration helpers

### `useLxForms`

Gets initial model and the descriptors list, returns configuration, readonly result object and reactive state (for manual tampering)

### `createDescriptor`

### `createConditional`

## Built-in transformers

### Binary

### Select

## Built-in behaviours

### Disabled

### Hidden

### Required

## Built-in descriptor & components

### Checkbox

### Radio

### Select

### Text/Textarea/Password

## Common use cases

### Static configuration

### API generated configuration

### Apply a behaviour to all descriptors

### Multiple descriptor types sharing the same descriptor

### Multiple descriptor types with different descriptor sharing the same component

### Multiple descriptor types sharing the same descriptor

## Caveats and pitfalls

> DISCLAIMER: never use a method generating a new descriptor object INSIDE a computed function body,
> it will result in a new descriptor being created every time the computed property re-evaluate
> and could cause an infinite recursion loop
> Use "conditional" helper instead

### Using `descriptor.model` directly

### Passing through additional attributes/listeners to the underlying input components

Components must have `inheritAttrs: false` set and apply `v-bind="$attrs"` to the input -->

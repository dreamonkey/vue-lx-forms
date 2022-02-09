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
import {
  extractDescriptorModel,
  getDescriptorProps,
} from '@dreamonkey/vue-lx-forms';
import { defineComponent } from 'vue';
import { TextDescriptor } from './descriptors';

export default defineComponent({
  name: 'TextField',
  inheritAttrs: false,
  props: getDescriptorProps<TextDescriptor>(),
  setup(props) {
    // Never use `descriptor.model` property directly, extract it using `extractDescriptorModel` helper
    const model = extractDescriptorModel(props.descriptor);
    return { model };
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
import { createDescriptor, useLxForms } from '@dreamonkey/vue-lx-forms';
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
import { defineComponent } from 'vue';
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

## Core concepts

### Descriptors

Descriptors are the building blocks of the whole system.
Ideally, each descriptor should hold all information bits and GUI-independent code which will later be needed by a component when rendering it as part of the whole form.

Ideally, a descriptor should not care about the GUI-related code and stick to higher level abstractions, as updating bindings to use different sets of components should result in different GUIs without needing changes to the descriptors.

At its bare minimul, each descriptor must have:

- an `id`, used by Vue to distinguish between `LxResolver` instances, which is automatically filled in when using `createDescriptor`;
- a `type`, used by `LxResolver` to decide which component to render, which can be a simple string, an enum or even a symbol;
- a `label`, since almost all fields of a form always have a title or label of some kind;
- a `model`, which must be a reactive ref, even if initialized to `undefined`.

You can also provide a custom `component` option to override/manually specify which component should be used to render the descriptor.

You should bind descriptor types to a component using `registerDescriptor`, `registerDescriptors` or the second argument of the plugin installation function.

```ts
const binding: Binding = {
  type: 'text',
  component: TextField,
};

const bindings: Binding[] = [
  {
    type: 'select',
    component: SelectField,
  },
  {
    type: 'checkbox',
    component: CheckboxField,
  },
];

// Register a single descriptor
registerDescriptor(binding);

// Register multiple descriptors
registerDescriptors(bindings);

// Register multiple descriptors when installing the plugin
app.use(LxForms, bindings);
```

It's fine to have multiple descriptors types bound to a single component, provided that it's able to manage all of them correctly.
Eg. text, textarea and password descriptor types can usually be managed by the same component.

```ts
const binding: Binding = {
  type: ['text', 'textarea', 'password'],
  component: TextLikeField,
};

registerDescriptor(binding);
```

If you find yourself in need to create descriptors dynamically, share the same descriptor options between multiple instances, or define them at a time where the underlying reactive state doesn't exist yet, you can use **descriptor factories** patter.
This pattern consist into wrapping the descriptor creation code into a wrapper function (the factory) which will then accept an object containing state refs later on, to create the actual instance of the descriptor.

```ts
import {
  createDescriptor,
  DescriptorFactoryFn,
} from '@dreamonkey/vue-lx-forms';

const initialState = {
  username: undefined,
  food: undefined,
};

const coldDescriptorList: DescriptorFactoryFn[] = [
  (stateRefs) => {
    return createDescriptor({
      type: 'text',
      label: 'Insert username',
      model: stateRefs.username,
    });
  },
  (stateRefs) => {
    return createDescriptor({
      type: 'text',
      label: 'Insert favourite food',
      model: stateRefs.food,
    });
  },
];

const { configuration, result, state } = useLxForms(initialState, (stateRefs) =>
  coldDescriptorList.map((descriptorFactory) => descriptorFactory(modelRefs))
);
```

#### TypeScript support

You define a new descriptor interface by extending `BaseDescriptor`, providing an unique `type` value and the type of the model used by the descriptor.
All additional properties are considered type-related options.

```ts
interface SelectDescriptor
  // Fields rendered by this descriptor know the model must be read ad written as a string or undefined (the latter is implicit, all models can be undefined)
  extends BaseDescriptor<string> {
  type: 'select';
  lazyOptionsFn: () => Promise<string[]>; // Type-related option, will be used by the component to retrieve the select options
}
```

If your descriptor don't have any type-related option, you can use `SimpleDescriptor` instead.

```ts
type TextDescriptor = SimpleDescriptor<'text', string>;
```

It's perfectly fine to have more than a descriptor type for a single descriptor, as long as all types share the same type-related options.

```ts
type TextLikeDescriptor = SimpleDescriptor<
  'text' | 'textarea' | 'password',
  string
>;
```

If all your descriptors share common options, you can add them augmenting `CustomBaseDescriptorProperties` interface.

```ts
import '@dreamonkey/vue-lx-forms';

declare module '@dreamonkey/vue-lx-forms' {
  interface CustomBaseDescriptorProperties {
    required: boolean; // Every descriptor MUST have this property
    placeholder?: string; // Every descriptor MAY have this property
  }
}
```

Once you defined all your descriptors interfaces, you'll need to augment `DescriptorMap` interface to map each descriptor type to its descriptor interface. Once you did this, TypeScript will use `type` value to provide autocompletion when creating descriptors using `createDescriptor` and when registering bindings.
We hope to be able to automate this step in the future.

```ts
import '@dreamonkey/vue-lx-forms';

declare module '@dreamonkey/vue-lx-forms' {
  interface DescriptorMap {
    select: SelectDescriptor;
    text: TextDescriptor;
  }
}
```

Descriptors interfaces are also useful to provide autocompletion into components, providing them as type parameter to `getDescriptorProps`, as you can see in next section example.

### Components

Since most of a field logic is stored into the descriptor, you can easily switch between different component sets just by changing bindings, but a descriptor is useless without a paired component able to render it.

All components you hook to the system must accept a `descriptor` prop and, if you use it in any way, extract `model` property from the descriptor. This last bit should happen outside Vue reactivity system, to avoid uncorrect unwrapping.

Use `getDescriptorProps` to accomplish the first task.
To get proper autocompletion, provide via the type parameter the interfaces of all descriptors that the component is able to manage.

For the latter task, use `extractDescriptorModel` instead.
It accepts a descriptor and returns its `model` property, correctly extracted outside of Vue reactivity system.
This happens since we're accessing a property on a prop (which is a reactive object), and that property is a ref itself.
**Never use `model` property directly from `descriptor` prop (eg. via `descriptor.model` inside templates), as it simply won't work as you expect, breaking the app.**

```vue
<!-- text.vue -->
<script lang="ts">
import {
  extractDescriptorModel,
  getDescriptorProps,
} from '@dreamonkey/vue-lx-forms';
import { defineComponent } from 'vue';
import { TextDescriptor, PasswordDescriptor } from './descriptors';

export default defineComponent({
  name: 'TextField',
  props: getDescriptorProps<TextDescriptor | PasswordDescriptor>(),
  setup(props) {
    const model = extractDescriptorModel(props.descriptor);

    // Thanks to the specified descriptors interfaces, `props.descriptor` have autocomplete for
    // all type-related options if you use `type` as discriminant for the union
    if (props.descriptor.type === 'text') {
      // ... text-specific actions
    } else {
      // ... password-specific actions
    }

    return { model };
  },
});
</script>

<template>
  <label>
    {{ descriptor.label }}
    <input v-model="model" type="text" />
  </label>
</template>
```

To allow props pass-through to nested elements, add `inheritAttrs: false` to the component and `v-bind` its `$attrs` on the input element.

```vue
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
  // ... other options
});
</script>

<template>
  <label>
    {{ descriptor.label }}
    <input v-model="model" type="text" v-bind="$attrs" />
  </label>
</template>
```

### Internal state

Each `Descriptor` uses a reactive variable to store the data provided by the user, which is actually an hook to property of a reactive shared state object.
The shared state is generated from the initial state you provide to `useLxForms`, thus which properties you define there is important: always initialize optional properties to `undefined` if you need the system to react to changes on them.

The reactive state is returned by `useLxForms` as `state` so you can tamper with it programmatically.
Note that ideally `state` should only be mutated indirectly via models provided to each descriptor, and we only provide it as an escape hatch for complex scenarios.
Take care if you find yourself tampering the `state` directly often, are you're probably using the system in the wrong way.

Since `state` is a very generic name, we suggest you to always rename it to make it clear of which entity that state is holding data, keeping `State` suffix to let devs know it's the low level reactive object.

```ts
const { state: orderState } = useLxForms(/* ... */);

orderState.food = 'Pizza';
```

### Configuration

`useLxForms` expects a function as its second parameter, which gets in input an object of refs bound to the internal state and should return an array where each item can _recursively_ be:

- a descriptor;
- an array of descriptors;
- a ref resolving to a descriptor or an array of descriptors.

The `configuration` returned from `useLxForms` is a computed which is based on that function, but where all reactive refs along the way are recursively unwrapped and all arrays flattened, to get a flat array of descriptors.
This avoids many problems connected with the usage of recursive components and allows to render all configuration fields with a single `v-for` and `LxResolver`.
Since we unwrap all refs and it's executed inside a computed body, the configuration will react to changes in any ref accessed into it.

This allows you to create highly reactive forms, showing or hiding fields or groups of fields depending on the value of either an outside ref or one of the provided state-related refs.

```ts
import { createDescriptor, useLxForms } from '@dreamonkey/vue-lx-forms';
import { computed } from 'vue';

const orderInitialData = {
  username: 'XXXX-000',
  food: undefined,
  drink: undefined,
  details: undefined,
};

const { configuration, state } = useLxForms(
  orderInitialData,
  // Every property of "stateRefs" contains a ref initialized with the matching property of the initial state
  (stateRefs) => [
    // Single descriptor
    createDescriptor({
      type: FormFieldType.Text,
      model: stateRefs.username,
      label: 'Insert your username',
    }),
    // Array of descriptors
    [
      createDescriptor({
        type: FormFieldType.Text,
        model: stateRefs.food,
        label: 'What do you want to eat?',
      }),

      // Reactive ref of some kind
      // Equal to "createConditional"
      computed(() =>
        stateRefs.food.value !== undefined
          ? createDescriptor({
              type: FormFieldType.Text,
              model: stateRefs.details,
              label: 'Any details for the cook?',
            })
          : []
      ),
    ],
    // Nested array of descriptors
    [
      [
        createDescriptor({
          type: FormFieldType.Text,
          model: stateRefs.drink,
          label: 'What do you want to drink?',
        }),
      ],
    ],
  ]
);

// >> configuration.value => [
//   { /* username descriptor */ },
//   { /* food descriptor */ },
//   { /* drink descriptor */ },
// ]

state.food = 'Lasagna';

// >> configuration.value => [
//   { /* username descriptor */ },
//   { /* food descriptor */ },
//   { /* details descriptor */ },
//   { /* drink descriptor */ },
// ]
```

### Result

Whenever you need to extract the current configuration data, you should use the `result` computed property provided by `useLxForms`.
You can think of `result` as a cleaned up version of `state`, where the data for all unused descriptors is left aside.

Here're the main differences between `result` and `state`:

- `result` is a computed ref, thus it's readonly and its value should be accessed via `result.value`, while `state` is a writable reactive object;
- `result` will only contain properties bound to displayed fields, while `state` contains all properties present in the initial object;

Since `result` is a very generic name, we suggest you to always rename it to make it clear of which entity you're representing an instance.

```ts
const { result: order } = useLxForms(/* ... */);

console.log(order.value); // { food: 'Pizza', ... }
```

### Transformers

### LxResolver

## Component helpers

<!-- ### `getDescriptorProps`

Must be a function as we need to type it

### `extractDescriptorModel`

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

### Descriptors and components creation

Make it work > make it fast > make it beautiful

When having trouble abstracting it into the descriptor from the start, write everything into the component, then split concerns into composables and use custom descriptor descriptors properties or global properties to abstract it

At the end of the process, components should contain only the logic needed to display and interact with descriptor, not the logic

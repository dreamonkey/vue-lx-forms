import { castArray } from 'lodash-es';
import { App } from 'vue';
import { Binding } from './models';
import { registerDescriptors } from './helpers/bindings';
import ResolverComponent from './resolver.vue';

export const install = (app: App, bindings: Binding | Binding[]) => {
  app.component(ResolverComponent.name, ResolverComponent);
  registerDescriptors(castArray(bindings));
};

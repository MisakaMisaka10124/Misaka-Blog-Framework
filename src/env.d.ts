// src/env.d.ts
declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module "*.css" {}
declare module "*.css?url" {
  const src: string;
  export default src;
}
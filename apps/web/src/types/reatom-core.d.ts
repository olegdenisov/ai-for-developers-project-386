/// <reference types="@reatom/core" />

declare module '@reatom/core' {
  export const atom: typeof import('@reatom/core/build/core/atom').atom;
  export const computed: typeof import('@reatom/core/build/core/atom').computed;
  export const action: typeof import('@reatom/core/build/core/action').action;
  export const wrap: typeof import('@reatom/core/build/methods/wrap').wrap;
  export const withAsync: typeof import('@reatom/core/build/async/withAsync').withAsync;
  export const withAsyncData: typeof import('@reatom/core/build/async/withAsyncData').withAsyncData;
  export const reatomRoute: typeof import('@reatom/core/build/routing/route').reatomRoute;
  export type RouteChild = import('@reatom/core/build/routing/route').RouteChild;
}

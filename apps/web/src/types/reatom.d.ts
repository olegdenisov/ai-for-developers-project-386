/// <reference types="@reatom/core" />
/// <reference types="vite/client" />

declare module '@reatom/core' {
  export const atom: typeof import('@reatom/core/build/core/atom').atom;
  export const computed: typeof import('@reatom/core/build/core/atom').computed;
  export const action: typeof import('@reatom/core/build/core/action').action;
  export const wrap: typeof import('@reatom/core/build/methods/wrap').wrap;
  export const withAsync: typeof import('@reatom/core/build/async/withAsync').withAsync;
  export const withAsyncData: typeof import('@reatom/core/build/async/withAsyncData').withAsyncData;
  export const reatomRoute: typeof import('@reatom/core/build/routing/route').reatomRoute;
  export type RouteChild = import('@reatom/core/build/routing/route').RouteChild;
  export const context: import('@reatom/core/build/core/atom').ContextAtom;
  export const peek: typeof import('@reatom/core/build/methods/peek').peek;
  export const reatomForm: typeof import('@reatom/core/build/form/reatomForm').reatomForm;
  export type { Form, FormInitState, SubmitAction } from '@reatom/core/build/form/reatomForm';

  interface RouteChild extends React.ReactNode {}

  /** Минимальный тип аргумента render-функции маршрута. */
  export interface RouteRenderSelf<TData = undefined> {
    (): unknown;
    loader: {
      status(): {
        isPending: boolean;
        isFirstPending: boolean;
        isData: boolean;
        isError: boolean;
        data: TData;
        error: Error | undefined;
      };
      error(): Error | undefined;
    };
    outlet(): RouteChild[];
  }
}

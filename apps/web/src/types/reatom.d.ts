import type { JSX } from 'react'

// Официальные module augmentations для @reatom/core
// Документация: https://v1000.reatom.dev/reference/routing/route
declare module '@reatom/core' {
  // Расширяем RouteChild до JSX.Element для совместимости с React.
  // Рекомендовано в документации @reatom/core для React-проектов.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteChild extends JSX.Element {}

  // layout: true — валидная опция рантайма для маршрутов-оболочек (layout routes)
  interface RouteOptions {
    layout?: boolean
  }
}

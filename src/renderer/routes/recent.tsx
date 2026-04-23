import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/recent')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/recent"!</div>
}

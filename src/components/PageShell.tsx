import * as React from "react"

export function PageShell({
  actions,
  children,
  description,
  title,
}: {
  actions?: React.ReactNode
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <div className="mx-auto min-h-svh w-full max-w-5xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            S4E Spotlight
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions}
      </header>
      {children}
    </div>
  )
}

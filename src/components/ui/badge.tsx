import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'bg-badge text-badge-foreground',
        primary: 'bg-primary text-primary-foreground',
        outline: 'border border-border bg-card text-foreground',
        muted: 'bg-muted text-muted-foreground',
        success: 'bg-emerald-600 text-white',
        danger: 'bg-red-600 text-white',
        warning: 'bg-amber-500 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
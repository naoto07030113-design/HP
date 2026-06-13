import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm transition-colors duration-150 placeholder:text-muted-foreground/70 hover:border-green-300 focus-visible:outline-none focus-visible:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }

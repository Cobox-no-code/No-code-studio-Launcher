'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  leftValue: string;
  rightValue: string;
}

function SwitchTwoWay({
  className,
  leftValue,
  rightValue,
  ...props
}: SwitchProps) {
  return (
    <div className="flex items-center gap-4">
      <Label
        htmlFor="switch"
        className={cn(
          ' data-[state=checked]:text-[#4477ff] data-[state=unchecked]:text-[#d5e7f8]  ',
          className
        )}
      >
        {leftValue}
      </Label>
      <SwitchPrimitive.Root
        id='switch'
        data-slot="switch"
        className={cn(
          'peer data-[state=checked]:bg-[#d5e7f8] data-[state=unchecked]:bg-[#d5e7f8] focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-[#d5e7f8] inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full  border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 border ',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            'bg-[#4477ff] dark:data-[state=unchecked]:bg-[#4477ff] dark:data-[state=checked]:bg-[#4477ff] pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2.2px)] data-[state=unchecked]:translate-x-0'
          )}
        />
      </SwitchPrimitive.Root>
      <Label htmlFor="switch" className="text-blue-600 font-semibold">
        {rightValue}
      </Label>
    </div>
  )
}

export { SwitchTwoWay }

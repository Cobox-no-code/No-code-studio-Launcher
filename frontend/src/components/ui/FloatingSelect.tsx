'use client'

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from './select' 

interface FloatingSelectProps {
  label: string
  value?: string
  onValueChange?: (value: string) => void
  options: { label: string; value: string }[]
  className?: string
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  className,
}) => {
  return (
    <label
      className={`relative flex items-center p-1 h-[40px] w-[228px] rounded-md border    focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 ${className}`}
    >
      <Select value={value } onValueChange={onValueChange} >
        <SelectTrigger className="peer border-none bg-transparent w-full px-2 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0">
          <SelectValue placeholder='' />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="pointer-events-none absolute start-2.5 top-0 -translate-y-1/2 bg-white p-0.5 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs text-gray-500 peer-focus:text-blue-600">
        {label}
      </span>
    </label>
  )
}

export default FloatingSelect

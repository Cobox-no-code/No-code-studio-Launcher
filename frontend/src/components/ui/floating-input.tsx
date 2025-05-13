// import { X } from 'lucide-react'
import * as React from 'react'

interface FloatingInputProps extends React.ComponentProps<'input'> {
  label: string
  className?: string
  customSize?: string
  inputClassName?: string // Add this prop to pass custom styles to the input
  removeText?: () => void
  value?: string | number | string[] | undefined
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  className,
  customSize,
  inputClassName, // Destructure the new inputClassName prop
  value,
  ...props
}) => {
  return (
    <label
      className={`relative flex items-center p-1 h-[40px] rounded-md border bg-white    focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 ${className} w-[${customSize}px]`}
    >
      <input
        type="text"
        className={`peer border-none bg-transparent w-full px-2 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 ${inputClassName}`}
        placeholder={label}
        value={value || ''}
        {...props}
      />
      <span className="pointer-events-none absolute start-2.5 top-0 -translate-y-1/2 bg-white/90 p-0.5 text-xs transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs text-gray-500 peer-focus:text-blue-600">
        {label}
      </span>
      
    </label>
  )
}

export default FloatingInput

import * as React from "react"
import PhoneInputComponent, { type DefaultInputComponentProps } from "react-phone-number-input"
import 'react-phone-number-input/style.css'
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string | undefined) => void
  defaultCountry?: string
}

const CustomInput = React.forwardRef<HTMLInputElement, DefaultInputComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        className={cn("rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 border-l-0 shadow-none", className)}
      />
    )
  }
)
CustomInput.displayName = "CustomInput"

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, defaultCountry = "IN", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <PhoneInputComponent
          international
          defaultCountry={defaultCountry as any}
          inputComponent={CustomInput}
          className="w-full flex items-center px-3"
          numberInputProps={{
            ref,
            className: "flex-1 border-none focus:ring-0 focus:outline-none bg-transparent placeholder:text-muted-foreground",
          }}
          {...props}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

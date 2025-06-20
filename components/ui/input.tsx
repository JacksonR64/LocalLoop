import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'default' | 'error' | 'success';
    "data-testid"?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant = 'default', ...props }, ref) => {
        const variantClasses = {
            default: "",
            error: "border-destructive focus:ring-destructive",
            success: "border-green-500 focus:ring-green-500"
        }

        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    variantClasses[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input } 
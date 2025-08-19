import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Button = forwardRef(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80 focus:ring-primary/50 shadow-md hover:shadow-lg",
    secondary: "border-2 border-secondary text-secondary hover:bg-secondary hover:text-white focus:ring-secondary/50",
    accent: "bg-gradient-to-r from-accent to-accent/90 text-white hover:from-accent/90 hover:to-accent/80 focus:ring-accent/50 shadow-md hover:shadow-lg",
    success: "bg-gradient-to-r from-success to-success/90 text-white hover:from-success/90 hover:to-success/80 focus:ring-success/50 shadow-md hover:shadow-lg",
    warning: "bg-gradient-to-r from-warning to-warning/90 text-white hover:from-warning/90 hover:to-warning/80 focus:ring-warning/50 shadow-md hover:shadow-lg",
    error: "bg-gradient-to-r from-error to-error/90 text-white hover:from-error/90 hover:to-error/80 focus:ring-error/50 shadow-md hover:shadow-lg",
    ghost: "text-secondary hover:bg-secondary/10 focus:ring-secondary/50",
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  }
  
  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = "Button"

export default Button
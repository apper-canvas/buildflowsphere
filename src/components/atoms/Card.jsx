import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Card = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-lg shadow-card border border-gray-100 p-6 transition-shadow duration-200 hover:shadow-hover",
        className
      )}
      {...props}
    />
  )
})

Card.displayName = "Card"

export default Card
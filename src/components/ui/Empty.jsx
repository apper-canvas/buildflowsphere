import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const Empty = ({ 
  title = "No data found", 
  description = "Get started by creating your first item",
  actionLabel = "Get Started",
  actionIcon = "Plus",
  onAction,
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-6">
        <ApperIcon name="Package" size={40} className="text-primary" />
      </div>
      
      <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-secondary mb-8 max-w-md">
        {description}
      </p>
      
      {onAction && (
        <Button onClick={onAction} variant="primary">
          <ApperIcon name={actionIcon} size={16} className="mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default Empty
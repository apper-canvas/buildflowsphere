import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"
import { useNavigate } from "react-router-dom"

const QuickAction = ({ title, description, icon, path, variant = "primary" }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg shadow-card border border-gray-100 p-4 hover:shadow-hover transition-shadow duration-200">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
          <ApperIcon name={icon} size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-secondary mb-3">{description}</p>
          <Button 
            size="sm" 
            variant={variant}
            onClick={() => navigate(path)}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuickAction
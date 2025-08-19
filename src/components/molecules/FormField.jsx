import Label from "@/components/atoms/Label"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const FormField = ({ 
  label, 
  type = "text", 
  options, 
  error, 
  className,
  children,
  ...props 
}) => {
const renderInput = () => {
    if (type === "select") {
      return (
        <Select {...props}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )
    }
    
    if (type === "camera") {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <ApperIcon name="Camera" size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">{props.placeholder || "Camera input"}</p>
          {children}
        </div>
      )
    }
    
    if (children) {
      return children
    }
    
    return <Input type={type} {...props} />
  }

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label>{label}</Label>}
      {renderInput()}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

export default FormField
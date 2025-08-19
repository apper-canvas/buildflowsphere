import Label from "@/components/atoms/Label"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
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
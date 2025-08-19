import { useState } from "react"
import Input from "@/components/atoms/Input"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const SearchBar = ({ placeholder = "Search...", onSearch, className }) => {
  const [query, setQuery] = useState("")

  const handleSearch = (e) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)
  }

  return (
    <div className={cn("relative", className)}>
      <ApperIcon 
        name="Search" 
        size={20} 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleSearch}
        className="pl-10"
      />
    </div>
  )
}

export default SearchBar
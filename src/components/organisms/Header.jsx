import { useState } from "react"
import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"
import SearchBar from "@/components/molecules/SearchBar"

const Header = ({ onMenuClick }) => {
  const [notifications] = useState([
    { id: 1, message: "Low stock: Cement bags below 100 units", type: "warning" },
    { id: 2, message: "New order #SO-2024-001 received", type: "info" },
    { id: 3, message: "Payment overdue: Customer ABC Corp", type: "error" },
  ])

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-64">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Mobile menu button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <ApperIcon name="Menu" size={24} />
          </Button>
          
          <div className="hidden sm:block">
            <SearchBar 
              placeholder="Search orders, customers, products..." 
              className="w-96"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Actions */}
          <Button variant="accent" size="sm" className="hidden md:flex">
            <ApperIcon name="Plus" size={16} className="mr-1" />
            Quick Quote
          </Button>
          
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm">
              <ApperIcon name="Bell" size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <ApperIcon name="User" size={16} className="text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Store Manager</p>
              <p className="text-xs text-secondary">Main Branch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-4 sm:hidden">
        <SearchBar placeholder="Search..." />
      </div>
    </header>
  )
}

export default Header
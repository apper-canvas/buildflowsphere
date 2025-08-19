import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"
import { cn } from "@/utils/cn"

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

const navigation = [
    { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { name: "Quotes", href: "/quotes", icon: "FileText" },
    { name: "Sales Orders", href: "/orders", icon: "ShoppingCart" },
{ name: "Inventory", href: "/inventory", icon: "Package" },
    { name: "Scanner", href: "/scanner", icon: "QrCode" },
    { name: "Batch Management", href: "/batch-management", icon: "Archive" },
    { name: "Dispatch", href: "/challans", icon: "Truck" },
    { name: "Invoices", href: "/invoices", icon: "Receipt" },
    { name: "Purchase Orders", href: "/purchase-orders", icon: "Clipboard" },
    { name: "Customers", href: "/customers", icon: "Users" },
    { name: "Vendors", href: "/vendors", icon: "Building2" },
    { name: "Reports", href: "/reports", icon: "BarChart3" },
  ]

  const NavItem = ({ item }) => (
    <NavLink
      to={item.href}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-md"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
        )
      }
    >
      <ApperIcon
        name={item.icon}
        size={20}
        className="mr-3 flex-shrink-0"
      />
      {item.name}
    </NavLink>
  )

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-40">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-lg">
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
              <ApperIcon name="Building2" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900">BuildFlow</h1>
              <p className="text-xs text-secondary">ERP System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <ApperIcon name="User" size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Store Manager</p>
              <p className="text-xs text-secondary">Main Branch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Mobile Sidebar
  const MobileSidebar = () => (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
                <ApperIcon name="Building2" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold text-gray-900">BuildFlow</h1>
                <p className="text-xs text-secondary">ERP System</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ApperIcon name="X" size={20} />
            </Button>
          </div>

          {/* Navigation */}
<nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <ApperIcon name="User" size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Store Manager</p>
                <p className="text-xs text-secondary">Main Branch</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}

export default Sidebar
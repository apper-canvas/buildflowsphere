import { useState, useEffect } from "react"
import StatCard from "@/components/molecules/StatCard"
import QuickAction from "@/components/molecules/QuickAction"
import DataTable from "@/components/molecules/DataTable"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import productService from "@/services/api/productService"
import salesOrderService from "@/services/api/salesOrderService"
import invoiceService from "@/services/api/invoiceService"
import challanService from "@/services/api/challanService"
import { useNavigate } from "react-router-dom"

const Dashboard = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    lowStockItems: [],
    pendingInvoices: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const [products, orders, invoices, challans] = await Promise.all([
        productService.getAll(),
        salesOrderService.getAll(),
        invoiceService.getAll(),
        challanService.getAll()
      ])

      const lowStock = products.filter(p => p.currentStock <= p.reorderLevel)
      const pendingOrders = orders.filter(o => ['confirmed', 'in_progress'].includes(o.status))
      const pendingInvoices = invoices.filter(i => i.paymentStatus === 'pending')
      const inTransitChallans = challans.filter(c => ['dispatched', 'in_transit'].includes(c.status))
      
      const totalSales = orders.reduce((sum, order) => sum + order.grandTotal, 0)
      const totalReceivables = invoices
        .filter(i => i.paymentStatus !== 'paid')
        .reduce((sum, inv) => sum + (inv.grandTotal - (inv.paidAmount || 0)), 0)

      setDashboardData({
        stats: {
          totalSales,
          pendingOrders: pendingOrders.length,
          lowStockItems: lowStock.length,
          totalReceivables,
          inTransit: inTransitChallans.length
        },
        recentOrders: orders.slice(0, 5),
        lowStockItems: lowStock,
        pendingInvoices: pendingInvoices.slice(0, 5)
      })
    } catch (err) {
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) return <Loading variant="skeleton" />
  if (error) return <Error message={error} onRetry={loadDashboardData} />

  const quickActions = [
    {
      title: "Create Quote",
      description: "Generate new quote for customer",
      icon: "FileText",
      path: "/quotes/create",
      variant: "primary"
    },
    {
      title: "Add Customer",
      description: "Register new customer",
      icon: "UserPlus",
      path: "/customers/create",
      variant: "secondary"
    },
    {
      title: "Check Inventory",
      description: "View current stock levels",
      icon: "Package",
      path: "/inventory",
      variant: "accent"
    },
    {
      title: "Generate Reports",
      description: "View sales and inventory reports",
      icon: "BarChart3",
      path: "/reports",
      variant: "success"
    }
  ]

  const orderColumns = [
    { key: "orderId", label: "Order ID", sortable: true },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "grandTotal", label: "Amount", type: "currency", sortable: true },
    { key: "status", label: "Status", type: "badge", sortable: true },
    { key: "orderDate", label: "Date", type: "date", sortable: true }
  ]

  const lowStockColumns = [
    { key: "name", label: "Product", sortable: true },
    { key: "currentStock", label: "Current Stock", sortable: true },
    { key: "baseUOM", label: "Unit", sortable: false },
    { key: "reorderLevel", label: "Reorder Level", sortable: true }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-secondary mt-1">Welcome to BuildFlow ERP System</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-secondary">Today</p>
          <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Sales"
          value={`₹${dashboardData.stats.totalSales?.toLocaleString() || '0'}`}
          icon="TrendingUp"
          change="+12% from last month"
          changeType="positive"
        />
        <StatCard
          title="Pending Orders"
          value={dashboardData.stats.pendingOrders || 0}
          icon="ShoppingCart"
          change={`${dashboardData.stats.pendingOrders || 0} active orders`}
          changeType="neutral"
        />
        <StatCard
          title="Low Stock Items"
          value={dashboardData.stats.lowStockItems || 0}
          icon="AlertTriangle"
          change="Requires attention"
          changeType={dashboardData.stats.lowStockItems > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Total Receivables"
          value={`₹${dashboardData.stats.totalReceivables?.toLocaleString() || '0'}`}
          icon="CreditCard"
          change="Outstanding amount"
          changeType="neutral"
        />
        <StatCard
          title="In Transit"
          value={dashboardData.stats.inTransit || 0}
          icon="Truck"
          change="Deliveries pending"
          changeType="neutral"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales Orders</h2>
          <button 
            className="text-primary hover:text-primary/80 font-medium text-sm"
            onClick={() => navigate('/orders')}
          >
            View All →
          </button>
        </div>
        {dashboardData.recentOrders.length > 0 ? (
          <DataTable
            columns={orderColumns}
            data={dashboardData.recentOrders}
            onRowClick={(order) => navigate(`/orders/${order.Id}`)}
          />
        ) : (
          <Empty
            title="No Orders Yet"
            description="Start by creating your first quote"
            actionLabel="Create Quote"
            onAction={() => navigate('/quotes/create')}
          />
        )}
      </div>

      {/* Low Stock Items */}
      {dashboardData.lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-error rounded-full mr-2"></span>
              Low Stock Alert
            </h2>
            <button 
              className="text-primary hover:text-primary/80 font-medium text-sm"
              onClick={() => navigate('/inventory')}
            >
              Manage Inventory →
            </button>
          </div>
          <DataTable
            columns={lowStockColumns}
            data={dashboardData.lowStockItems}
            onRowClick={() => navigate('/inventory')}
          />
        </div>
      )}
    </div>
  )
}

export default Dashboard
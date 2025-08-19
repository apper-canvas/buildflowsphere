import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Button from "@/components/atoms/Button"
import DataTable from "@/components/molecules/DataTable"
import SearchBar from "@/components/molecules/SearchBar"
import Badge from "@/components/atoms/Badge"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import salesOrderService from "@/services/api/salesOrderService"
import { toast } from "react-toastify"

const OrderList = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await salesOrderService.getAll()
      setOrders(data)
      setFilteredOrders(data)
    } catch (err) {
      setError(err.message || "Failed to load sales orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleSearch = (query) => {
    const filtered = orders.filter(order =>
      order.orderId.toLowerCase().includes(query.toLowerCase()) ||
      order.customerName.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredOrders(filtered)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    if (status === "all") {
      setFilteredOrders(orders)
    } else {
      const filtered = orders.filter(order => order.status === status)
      setFilteredOrders(filtered)
    }
  }

  const handleStatusUpdate = async (order, newStatus) => {
    try {
      await salesOrderService.updateStatus(order.Id, newStatus)
      toast.success(`Order status updated to ${newStatus}`)
      loadOrders()
    } catch (err) {
      toast.error(err.message || "Failed to update order status")
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadOrders} />

  const columns = [
    { key: "orderId", label: "Order ID", sortable: true },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "grandTotal", label: "Amount", type: "currency", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true,
      render: (value) => {
        const variants = {
          confirmed: "success",
          in_progress: "warning",
          dispatched: "info",
          delivered: "primary",
          cancelled: "error"
        }
        return <Badge variant={variants[value] || "default"}>{value.replace('_', ' ')}</Badge>
      }
    },
    { key: "orderDate", label: "Order Date", type: "date", sortable: true },
    { key: "deliveryDate", label: "Delivery Date", type: "date", sortable: true }
  ]

  const actions = [
    {
      label: "View",
      icon: "Eye",
      variant: "ghost",
      onClick: (order) => navigate(`/orders/${order.Id}`)
    },
    {
      label: "Dispatch",
      icon: "Truck",
      variant: "accent",
      onClick: (order) => navigate(`/challans/create?orderId=${order.Id}`)
    }
  ]

  const statusCounts = {
    all: orders.length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    in_progress: orders.filter(o => o.status === "in_progress").length,
    dispatched: orders.filter(o => o.status === "dispatched").length,
    delivered: orders.filter(o => o.status === "delivered").length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Sales Orders</h1>
          <p className="text-secondary mt-1">Manage customer orders and deliveries</p>
        </div>
        <Button onClick={() => navigate('/quotes/create')}>
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Create Quote
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({count})
              </button>
            ))}
          </div>
          
          <SearchBar
            placeholder="Search orders..."
            onSearch={handleSearch}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          actions={actions}
          onRowClick={(order) => navigate(`/orders/${order.Id}`)}
        />
      ) : (
        <Empty
          title="No Orders Found"
          description={orders.length === 0 ? "Create your first quote to get started with orders" : "No orders match your current filter"}
          actionLabel="Create Quote"
          actionIcon="FileText"
          onAction={() => navigate('/quotes/create')}
        />
      )}
    </div>
  )
}

export default OrderList
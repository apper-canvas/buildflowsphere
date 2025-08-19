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
import challanService from "@/services/api/challanService"
import { toast } from "react-toastify"

const ChallanList = () => {
  const navigate = useNavigate()
  const [challans, setChallans] = useState([])
  const [filteredChallans, setFilteredChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadChallans = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await challanService.getAll()
      setChallans(data)
      setFilteredChallans(data)
    } catch (err) {
      setError(err.message || "Failed to load delivery challans")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChallans()
  }, [])

  const handleSearch = (query) => {
    const filtered = challans.filter(challan =>
      challan.challanNumber.toLowerCase().includes(query.toLowerCase()) ||
      challan.customerName.toLowerCase().includes(query.toLowerCase()) ||
      challan.vehicleNumber.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredChallans(filtered)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    if (status === "all") {
      setFilteredChallans(challans)
    } else {
      const filtered = challans.filter(challan => challan.status === status)
      setFilteredChallans(filtered)
    }
  }

  const handleStatusUpdate = async (challan, newStatus) => {
    try {
      let deliveryData = {}
      if (newStatus === "delivered") {
        const receivedBy = prompt("Received by:", "Customer Representative")
        if (!receivedBy) return
        deliveryData.receivedBy = receivedBy
      }

      await challanService.updateStatus(challan.Id, newStatus, deliveryData)
      toast.success(`Challan status updated to ${newStatus}`)
      loadChallans()
    } catch (err) {
      toast.error(err.message || "Failed to update challan status")
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadChallans} />

  const columns = [
    { key: "challanNumber", label: "Challan #", sortable: true },
    { key: "orderNumber", label: "Order #", sortable: true },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "vehicleNumber", label: "Vehicle", sortable: true },
    { key: "driverName", label: "Driver", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true,
      render: (value) => {
        const variants = {
          dispatched: "info",
          in_transit: "warning",
          delivered: "success",
          cancelled: "error"
        }
        return <Badge variant={variants[value] || "default"}>{value.replace('_', ' ')}</Badge>
      }
    },
    { key: "dispatchTime", label: "Dispatch Time", type: "date", sortable: true }
  ]

  const actions = [
    {
      label: "Track",
      icon: "MapPin",
      variant: "ghost",
      onClick: (challan) => toast.info("Tracking feature coming soon!")
    },
    {
      label: "Mark Delivered",
      icon: "Check",
      variant: "success",
      onClick: (challan) => handleStatusUpdate(challan, "delivered")
    }
  ]

  const statusCounts = {
    all: challans.length,
    dispatched: challans.filter(c => c.status === "dispatched").length,
    in_transit: challans.filter(c => c.status === "in_transit").length,
    delivered: challans.filter(c => c.status === "delivered").length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Delivery Challans</h1>
          <p className="text-secondary mt-1">Track dispatches and deliveries</p>
        </div>
        <Button onClick={() => navigate('/challans/create')}>
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Create Challan
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
            placeholder="Search challans..."
            onSearch={handleSearch}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Challans Table */}
      {filteredChallans.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredChallans}
          actions={actions}
          onRowClick={(challan) => toast.info("Challan details view coming soon!")}
        />
      ) : (
        <Empty
          title="No Delivery Challans Found"
          description={challans.length === 0 ? "Create your first delivery challan to track dispatches" : "No challans match your current filter"}
          actionLabel="Create Challan"
          actionIcon="Truck"
          onAction={() => navigate('/challans/create')}
        />
      )}
    </div>
  )
}

export default ChallanList
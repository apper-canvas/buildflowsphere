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
import customerService from "@/services/api/customerService"
import { toast } from "react-toastify"

const CustomerList = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await customerService.getAll()
      setCustomers(data)
      setFilteredCustomers(data)
    } catch (err) {
      setError(err.message || "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleSearch = (query) => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone.includes(query)
    )
    setFilteredCustomers(filtered)
  }

  const handleEdit = (customer) => {
    toast.info("Customer editing feature coming soon!")
  }

  const handleDelete = async (customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await customerService.delete(customer.Id)
        toast.success("Customer deleted successfully")
        loadCustomers()
      } catch (err) {
        toast.error(err.message || "Failed to delete customer")
      }
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadCustomers} />

  const columns = [
    { key: "name", label: "Customer Name", sortable: true },
    { key: "contactPerson", label: "Contact Person", sortable: true },
    { key: "phone", label: "Phone", sortable: false },
    { key: "creditLimit", label: "Credit Limit", type: "currency", sortable: true },
    { key: "outstandingAmount", label: "Outstanding", type: "currency", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true,
      render: (value, customer) => {
        const utilizationPercent = customer.creditLimit > 0 
          ? (customer.outstandingAmount / customer.creditLimit) * 100 
          : 0
        
        let variant = "success"
        if (utilizationPercent > 80) variant = "error"
        else if (utilizationPercent > 60) variant = "warning"
        
        return <Badge variant={variant}>{value}</Badge>
      }
    },
    { key: "createdDate", label: "Created", type: "date", sortable: true }
  ]

  const actions = [
    {
      label: "View Orders",
      icon: "ShoppingCart",
      variant: "ghost",
      onClick: (customer) => navigate(`/orders?customerId=${customer.Id}`)
    },
    {
      label: "Create Quote",
      icon: "FileText",
      variant: "primary",
      onClick: (customer) => navigate(`/quotes/create?customerId=${customer.Id}`)
    },
    {
      label: "Edit",
      icon: "Edit",
      variant: "ghost",
      onClick: handleEdit
    },
    {
      label: "Delete",
      icon: "Trash2",
      variant: "error",
      onClick: handleDelete
    }
  ]

  const totalCredit = customers.reduce((sum, c) => sum + c.creditLimit, 0)
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0)
  const averageUtilization = customers.length > 0 
    ? customers.reduce((sum, c) => sum + (c.creditLimit > 0 ? (c.outstandingAmount / c.creditLimit) * 100 : 0), 0) / customers.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Customers</h1>
          <p className="text-secondary mt-1">Manage customer relationships and credit</p>
        </div>
        <Button onClick={() => navigate('/customers/create')}>
          <ApperIcon name="UserPlus" size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mr-4">
              <ApperIcon name="Users" size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-success/10 to-primary/10 rounded-lg mr-4">
              <ApperIcon name="CreditCard" size={24} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalCredit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-warning/10 to-error/10 rounded-lg mr-4">
              <ApperIcon name="AlertCircle" size={24} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Outstanding</p>
              <p className="text-2xl font-bold text-warning">₹{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg mr-4">
              <ApperIcon name="Percent" size={24} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-secondary">Avg. Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{averageUtilization.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
        <SearchBar
          placeholder="Search customers..."
          onSearch={handleSearch}
          className="w-full sm:w-64"
        />
      </div>

      {/* High Credit Utilization Alert */}
      {customers.some(c => c.creditLimit > 0 && (c.outstandingAmount / c.creditLimit) > 0.8) && (
        <div className="bg-gradient-to-r from-warning/10 to-error/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center">
            <ApperIcon name="AlertTriangle" size={20} className="text-warning mr-3" />
            <div>
              <h3 className="font-medium text-warning">High Credit Utilization Alert</h3>
              <p className="text-sm text-gray-600">
                Some customers are using more than 80% of their credit limit. Review and adjust limits as needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      {filteredCustomers.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          actions={actions}
          onRowClick={(customer) => navigate(`/customers/${customer.Id}`)}
        />
      ) : (
        <Empty
          title="No Customers Found"
          description={customers.length === 0 ? "Add your first customer to start building relationships" : "No customers match your search criteria"}
          actionLabel="Add Customer"
          actionIcon="UserPlus"
          onAction={() => navigate('/customers/create')}
        />
      )}
    </div>
  )
}

export default CustomerList
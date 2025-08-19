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
import invoiceService from "@/services/api/invoiceService"
import { toast } from "react-toastify"

const InvoiceList = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await invoiceService.getAll()
      setInvoices(data)
      setFilteredInvoices(data)
    } catch (err) {
      setError(err.message || "Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleSearch = (query) => {
    const filtered = invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(query.toLowerCase()) ||
      invoice.orderNumber.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredInvoices(filtered)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    if (status === "all") {
      setFilteredInvoices(invoices)
    } else if (status === "overdue") {
      const today = new Date().toISOString().split('T')[0]
      const filtered = invoices.filter(invoice => 
        invoice.paymentStatus !== "paid" && 
        invoice.dueDate < today
      )
      setFilteredInvoices(filtered)
    } else {
      const filtered = invoices.filter(invoice => invoice.paymentStatus === status)
      setFilteredInvoices(filtered)
    }
  }

  const handleRecordPayment = async (invoice) => {
    const amount = prompt(`Record payment for ${invoice.invoiceNumber}:`, (invoice.grandTotal - (invoice.paidAmount || 0)).toString())
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return

    try {
      const paymentData = {
        amount: parseFloat(amount),
        method: "bank_transfer" // Default method
      }
      
      await invoiceService.recordPayment(invoice.Id, paymentData)
      toast.success("Payment recorded successfully")
      loadInvoices()
    } catch (err) {
      toast.error(err.message || "Failed to record payment")
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadInvoices} />

  const columns = [
    { key: "invoiceNumber", label: "Invoice #", sortable: true },
    { key: "orderNumber", label: "Order #", sortable: true },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "grandTotal", label: "Amount", type: "currency", sortable: true },
    { 
      key: "paymentStatus", 
      label: "Status", 
      sortable: true,
      render: (value, invoice) => {
        let variant = "default"
        let displayValue = value
        
        if (value === "paid") {
          variant = "success"
        } else if (value === "partial") {
          variant = "warning"
        } else if (value === "pending") {
          // Check if overdue
          const today = new Date().toISOString().split('T')[0]
          if (invoice.dueDate < today) {
            variant = "error"
            displayValue = "overdue"
          } else {
            variant = "warning"
          }
        }
        
        return <Badge variant={variant}>{displayValue}</Badge>
      }
    },
    { key: "invoiceDate", label: "Invoice Date", type: "date", sortable: true },
    { key: "dueDate", label: "Due Date", type: "date", sortable: true }
  ]

  const actions = [
    {
      label: "Record Payment",
      icon: "CreditCard",
      variant: "success",
      onClick: handleRecordPayment
    },
    {
      label: "Print",
      icon: "Printer",
      variant: "ghost",
      onClick: (invoice) => toast.info("Print feature coming soon!")
    }
  ]

  const statusCounts = {
    all: invoices.length,
    pending: invoices.filter(i => i.paymentStatus === "pending").length,
    partial: invoices.filter(i => i.paymentStatus === "partial").length,
    paid: invoices.filter(i => i.paymentStatus === "paid").length,
    overdue: invoices.filter(i => {
      const today = new Date().toISOString().split('T')[0]
      return i.paymentStatus !== "paid" && i.dueDate < today
    }).length
  }

  const totalReceivables = invoices
    .filter(i => i.paymentStatus !== "paid")
    .reduce((sum, inv) => sum + (inv.grandTotal - (inv.paidAmount || 0)), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Invoices</h1>
          <p className="text-secondary mt-1">Manage billing and payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-secondary">Total Receivables</p>
            <p className="text-lg font-bold text-primary">₹{totalReceivables.toLocaleString()}</p>
          </div>
          <Button onClick={() => navigate('/invoices/create')}>
            <ApperIcon name="Plus" size={16} className="mr-2" />
            Create Invoice
          </Button>
        </div>
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
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </div>
          
          <SearchBar
            placeholder="Search invoices..."
            onSearch={handleSearch}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Overdue Alert */}
      {statusCounts.overdue > 0 && (
        <div className="bg-gradient-to-r from-error/10 to-warning/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center">
            <ApperIcon name="AlertCircle" size={20} className="text-error mr-3" />
            <div>
              <h3 className="font-medium text-error">Overdue Invoices Alert</h3>
              <p className="text-sm text-gray-600">
                {statusCounts.overdue} invoice{statusCounts.overdue > 1 ? 's are' : ' is'} overdue. Follow up with customers for payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          actions={actions}
          onRowClick={(invoice) => toast.info("Invoice details view coming soon!")}
        />
      ) : (
        <Empty
          title="No Invoices Found"
          description={invoices.length === 0 ? "Create your first invoice to track payments" : "No invoices match your current filter"}
          actionLabel="Create Invoice"
          actionIcon="Receipt"
          onAction={() => navigate('/invoices/create')}
        />
      )}
    </div>
  )
}

export default InvoiceList
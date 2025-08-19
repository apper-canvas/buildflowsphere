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
import quoteService from "@/services/api/quoteService"
import salesOrderService from "@/services/api/salesOrderService"
import { toast } from "react-toastify"

const QuoteList = () => {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [filteredQuotes, setFilteredQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadQuotes = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await quoteService.getAll()
      setQuotes(data)
      setFilteredQuotes(data)
    } catch (err) {
      setError(err.message || "Failed to load quotes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const handleSearch = (query) => {
    const filtered = quotes.filter(quote =>
      quote.quoteNumber.toLowerCase().includes(query.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredQuotes(filtered)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    if (status === "all") {
      setFilteredQuotes(quotes)
    } else {
      const filtered = quotes.filter(quote => quote.status === status)
      setFilteredQuotes(filtered)
    }
  }

  const handleConvertToOrder = async (quote) => {
    try {
      if (quote.status !== "approved") {
        toast.error("Only approved quotes can be converted to orders")
        return
      }

      await quoteService.convertToOrder(quote.Id)
      
      // Create sales order
      const orderData = {
        quoteId: quote.Id,
        customerId: quote.customerId,
        customerName: quote.customerName,
        items: quote.items,
        totalAmount: quote.totalAmount,
        taxAmount: quote.taxAmount,
        grandTotal: quote.grandTotal,
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: "30 days",
        deliveryAddress: "Customer Address",
        createdBy: "Sales Manager"
      }

      await salesOrderService.create(orderData)
      
      toast.success("Quote converted to sales order successfully")
      loadQuotes()
    } catch (err) {
      toast.error(err.message || "Failed to convert quote")
    }
  }

  const handleDeleteQuote = async (quote) => {
    if (window.confirm(`Are you sure you want to delete quote ${quote.quoteNumber}?`)) {
      try {
        await quoteService.delete(quote.Id)
        toast.success("Quote deleted successfully")
        loadQuotes()
      } catch (err) {
        toast.error(err.message || "Failed to delete quote")
      }
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadQuotes} />

  const columns = [
    { key: "quoteNumber", label: "Quote #", sortable: true },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "grandTotal", label: "Amount", type: "currency", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true,
      render: (value) => {
        const variants = {
          pending: "warning",
          approved: "success",
          converted: "primary",
          rejected: "error"
        }
        return <Badge variant={variants[value] || "default"}>{value.replace('_', ' ')}</Badge>
      }
    },
    { key: "validUntil", label: "Valid Until", type: "date", sortable: true },
    { key: "createdDate", label: "Created", type: "date", sortable: true }
  ]

  const actions = [
    {
      label: "Edit",
      icon: "Edit",
      variant: "ghost",
      onClick: (quote) => navigate(`/quotes/${quote.Id}/edit`)
    },
    {
      label: "Convert",
      icon: "ArrowRight",
      variant: "success",
      onClick: handleConvertToOrder
    },
    {
      label: "Delete",
      icon: "Trash2",
      variant: "error",
      onClick: handleDeleteQuote
    }
  ]

  const statusCounts = {
    all: quotes.length,
    pending: quotes.filter(q => q.status === "pending").length,
    approved: quotes.filter(q => q.status === "approved").length,
    converted: quotes.filter(q => q.status === "converted").length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Quotes</h1>
          <p className="text-secondary mt-1">Manage customer quotes and proposals</p>
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
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </div>
          
          <SearchBar
            placeholder="Search quotes..."
            onSearch={handleSearch}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Quotes Table */}
      {filteredQuotes.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredQuotes}
          actions={actions}
          onRowClick={(quote) => navigate(`/quotes/${quote.Id}/edit`)}
        />
      ) : (
        <Empty
          title="No Quotes Found"
          description={quotes.length === 0 ? "Create your first quote to get started" : "No quotes match your current filter"}
          actionLabel="Create Quote"
          actionIcon="FileText"
          onAction={() => navigate('/quotes/create')}
        />
      )}
    </div>
  )
}

export default QuoteList
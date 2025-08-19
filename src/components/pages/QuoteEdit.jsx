import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Badge from "@/components/atoms/Badge"
import FormField from "@/components/molecules/FormField"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"
import customerService from "@/services/api/customerService"
import productService from "@/services/api/productService"
import quoteService from "@/services/api/quoteService"
import { toast } from "react-toastify"

const QuoteEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [quote, setQuote] = useState(null)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [quoteData, customersData, productsData] = await Promise.all([
        quoteService.getById(id),
        customerService.getAll(),
        productService.getAll()
      ])
      setQuote(quoteData)
      setCustomers(customersData)
      setProducts(productsData)
    } catch (err) {
      setError(err.message || "Failed to load quote")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleStatusUpdate = async (newStatus) => {
    try {
      setSubmitting(true)
      await quoteService.update(quote.Id, { status: newStatus })
      setQuote(prev => ({ ...prev, status: newStatus }))
      toast.success(`Quote ${newStatus} successfully`)
    } catch (err) {
      toast.error(err.message || "Failed to update quote status")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    // Create a simple print view
    const printWindow = window.open('', '_blank')
    const content = `
      <html>
        <head>
          <title>Quote ${quote.quoteNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; color: #2C5282; }
            .details { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; }
            .totals { text-align: right; margin-top: 20px; }
            .total-row { font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">BuildFlow ERP</div>
            <p>Construction Material Vendor</p>
          </div>
          
          <div class="details">
            <h2>Quote: ${quote.quoteNumber}</h2>
            <p><strong>Customer:</strong> ${quote.customerName}</p>
            <p><strong>Date:</strong> ${new Date(quote.createdDate).toLocaleDateString()}</p>
            <p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString()}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>₹${item.unitPrice.toLocaleString()}</td>
                  <td>₹${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <p>Subtotal: ₹${quote.totalAmount.toLocaleString()}</p>
            <p>Tax (18%): ₹${quote.taxAmount.toLocaleString()}</p>
            <p class="total-row">Grand Total: ₹${quote.grandTotal.toLocaleString()}</p>
          </div>

          ${quote.notes ? `<div><strong>Notes:</strong> ${quote.notes}</div>` : ''}
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()">Print Quote</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadData} />
  if (!quote) return <Error message="Quote not found" />

  const statusVariants = {
    pending: "warning",
    approved: "success",
    converted: "primary",
    rejected: "error"
  }

  const canApprove = quote.status === "pending"
  const canReject = quote.status === "pending"
  const canConvert = quote.status === "approved"

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Quote {quote.quoteNumber}
            </h1>
            <Badge variant={statusVariants[quote.status] || "default"}>
              {quote.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-secondary mt-1">View and manage quote details</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={handlePrint}>
            <ApperIcon name="Printer" size={16} className="mr-2" />
            Print
          </Button>
          <Button variant="ghost" onClick={() => navigate('/quotes')}>
            <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
            Back to Quotes
          </Button>
        </div>
      </div>

      {/* Quote Actions */}
      {(canApprove || canReject) && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Quote Actions</h3>
              <p className="text-sm text-secondary">Update quote status</p>
            </div>
            <div className="flex items-center space-x-3">
              {canApprove && (
                <Button
                  variant="success"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={submitting}
                >
                  <ApperIcon name="Check" size={16} className="mr-2" />
                  Approve Quote
                </Button>
              )}
              {canReject && (
                <Button
                  variant="error"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={submitting}
                >
                  <ApperIcon name="X" size={16} className="mr-2" />
                  Reject Quote
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Quote Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Unit</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Unit Price</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quote.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{quote.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Quote Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{quote.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{new Date(quote.createdDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid Until:</span>
                <span className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created By:</span>
                <span className="font-medium">{quote.createdBy}</span>
              </div>
            </div>
          </Card>

          {/* Amount Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{quote.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18%):</span>
                <span className="font-medium">₹{quote.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Grand Total:</span>
                <span className="font-bold text-lg text-primary">₹{quote.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default QuoteEdit
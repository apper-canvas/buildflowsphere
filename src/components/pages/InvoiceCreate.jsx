import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import FormField from "@/components/molecules/FormField"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"
import salesOrderService from "@/services/api/salesOrderService"
import challanService from "@/services/api/challanService"
import invoiceService from "@/services/api/invoiceService"
import { toast } from "react-toastify"

const InvoiceCreate = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [orders, setOrders] = useState([])
  const [challans, setChallans] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedChallan, setSelectedChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    orderId: orderId || "",
    challanId: "",
    paymentTerms: "30 days",
    notes: ""
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [ordersData, challansData] = await Promise.all([
        salesOrderService.getAll(),
        challanService.getAll()
      ])
      
      // Filter delivered orders that might need invoicing
      const eligibleOrders = ordersData.filter(o => ['dispatched', 'delivered'].includes(o.status))
      setOrders(eligibleOrders)
      setChallans(challansData.filter(c => c.status === 'delivered'))
      
      if (orderId) {
        const order = eligibleOrders.find(o => o.Id === parseInt(orderId))
        if (order) {
          handleOrderSelection(order)
          setFormData(prev => ({ ...prev, orderId: orderId }))
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [orderId])

  const handleOrderSelection = (order) => {
    setSelectedOrder(order)
    // Find related challans
    const relatedChallans = challans.filter(c => c.orderId === order.Id)
    if (relatedChallans.length > 0) {
      setSelectedChallan(relatedChallans[0])
      setFormData(prev => ({ ...prev, challanId: relatedChallans[0].Id.toString() }))
    }
  }

  const handleOrderChange = (orderId) => {
    setFormData(prev => ({ ...prev, orderId, challanId: "" }))
    const order = orders.find(o => o.Id === parseInt(orderId))
    if (order) {
      handleOrderSelection(order)
    } else {
      setSelectedOrder(null)
      setSelectedChallan(null)
    }
  }

  const handleChallanChange = (challanId) => {
    setFormData(prev => ({ ...prev, challanId }))
    const challan = challans.find(c => c.Id === parseInt(challanId))
    setSelectedChallan(challan || null)
  }

  const calculateTax = (amount) => {
    const cgst = amount * 0.09 // 9% CGST
    const sgst = amount * 0.09 // 9% SGST
    return { cgst, sgst, total: cgst + sgst }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedOrder) {
      toast.error("Please select an order")
      return
    }

    try {
      setSubmitting(true)
      
      const subtotal = selectedOrder.totalAmount
      const tax = calculateTax(subtotal)
      
      // Calculate due date based on payment terms
      const dueDate = new Date()
      const days = parseInt(formData.paymentTerms.split(' ')[0]) || 30
      dueDate.setDate(dueDate.getDate() + days)

      const invoiceData = {
        orderId: selectedOrder.Id,
        orderNumber: selectedOrder.orderId,
        challanId: selectedChallan ? selectedChallan.Id : null,
        challanNumber: selectedChallan ? selectedChallan.challanNumber : null,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        items: selectedOrder.items,
        subtotal: subtotal,
        cgstRate: 9,
        sgstRate: 9,
        cgstAmount: tax.cgst,
        sgstAmount: tax.sgst,
        totalTaxAmount: tax.total,
        grandTotal: subtotal + tax.total,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: formData.paymentTerms,
        createdBy: "Accounts Manager",
        gstNumber: "27AABCU1234M1ZX", // Default GST number
        notes: formData.notes
      }

      await invoiceService.create(invoiceData)
      toast.success("Invoice created successfully")
      navigate('/invoices')
    } catch (err) {
      toast.error(err.message || "Failed to create invoice")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadData} />

  const relatedChallans = selectedOrder ? challans.filter(c => c.orderId === selectedOrder.Id) : []
  const tax = selectedOrder ? calculateTax(selectedOrder.totalAmount) : { cgst: 0, sgst: 0, total: 0 }
  const grandTotal = selectedOrder ? selectedOrder.totalAmount + tax.total : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Create Invoice</h1>
          <p className="text-secondary mt-1">Generate invoice for delivered orders</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/invoices')}>
          <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
          Back to Invoices
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Sales Order"
              type="select"
              value={formData.orderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              options={[
                { value: "", label: "Select Order" },
                ...orders.map(order => ({
                  value: order.Id.toString(),
                  label: `${order.orderId} - ${order.customerName} (₹${order.grandTotal.toLocaleString()})`
                }))
              ]}
              required
            />
            
            {relatedChallans.length > 0 && (
              <FormField
                label="Delivery Challan (Optional)"
                type="select"
                value={formData.challanId}
                onChange={(e) => handleChallanChange(e.target.value)}
                options={[
                  { value: "", label: "Select Challan" },
                  ...relatedChallans.map(challan => ({
                    value: challan.Id.toString(),
                    label: `${challan.challanNumber} - ${new Date(challan.dispatchTime).toLocaleDateString()}`
                  }))
                ]}
              />
            )}
          </div>
          
          {selectedOrder && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Order Date:</span>
                  <p className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium capitalize">{selectedOrder.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <p className="font-medium">₹{selectedOrder.grandTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Invoice Items */}
        {selectedOrder && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h2>
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
                  {selectedOrder.items.map((item, index) => (
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

            {/* Tax Calculation */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CGST (9%):</span>
                    <span className="font-medium">₹{tax.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST (9%):</span>
                    <span className="font-medium">₹{tax.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="font-bold text-lg text-primary">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Invoice Settings */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Payment Terms"
              type="select"
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              options={[
                { value: "15 days", label: "15 Days" },
                { value: "30 days", label: "30 Days" },
                { value: "45 days", label: "45 Days" },
                { value: "60 days", label: "60 Days" },
                { value: "immediate", label: "Immediate" }
              ]}
            />
          </div>
          
          <div className="mt-4">
            <FormField
              label="Notes"
              type="textarea"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Payment terms, special instructions, etc..."
              rows={3}
            >
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Payment terms, special instructions, etc..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
              />
            </FormField>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/invoices')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !selectedOrder}
          >
            {submitting ? (
              <>
                <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ApperIcon name="Receipt" size={16} className="mr-2" />
                Create Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default InvoiceCreate
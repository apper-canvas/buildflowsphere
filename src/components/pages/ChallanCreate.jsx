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
import { toast } from "react-toastify"

const ChallanCreate = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    orderId: orderId || "",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    expectedDelivery: "",
    notes: ""
  })

  const [dispatchItems, setDispatchItems] = useState([])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const ordersData = await salesOrderService.getPending()
      setOrders(ordersData)
      
      if (orderId) {
        const order = ordersData.find(o => o.Id === parseInt(orderId))
        if (order) {
          handleOrderSelection(order)
          setFormData(prev => ({ ...prev, orderId: orderId }))
        }
      }

      // Set default delivery time (next day)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 0, 0, 0) // 2 PM next day
      setFormData(prev => ({ ...prev, expectedDelivery: tomorrow.toISOString().slice(0, 16) }))
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
    const items = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      orderedQuantity: item.quantity,
      dispatchedQuantity: item.quantity, // Default to full quantity
      unit: item.unit
    }))
    setDispatchItems(items)
  }

  const handleOrderChange = (orderId) => {
    setFormData(prev => ({ ...prev, orderId }))
    const order = orders.find(o => o.Id === parseInt(orderId))
    if (order) {
      handleOrderSelection(order)
    } else {
      setSelectedOrder(null)
      setDispatchItems([])
    }
  }

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...dispatchItems]
    const maxQuantity = newItems[index].orderedQuantity
    newItems[index].dispatchedQuantity = Math.min(Math.max(0, parseInt(quantity) || 0), maxQuantity)
    setDispatchItems(newItems)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedOrder || !formData.vehicleNumber || !formData.driverName) {
      toast.error("Please fill all required fields")
      return
    }

    if (dispatchItems.every(item => item.dispatchedQuantity === 0)) {
      toast.error("Please specify quantities to dispatch")
      return
    }

    try {
      setSubmitting(true)
      
      const challanData = {
        orderId: selectedOrder.Id,
        orderNumber: selectedOrder.orderId,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        items: dispatchItems.filter(item => item.dispatchedQuantity > 0),
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        expectedDelivery: formData.expectedDelivery,
        createdBy: "Dispatch Manager",
        notes: formData.notes
      }

      await challanService.create(challanData)
      
      // Update order status
      await salesOrderService.updateStatus(selectedOrder.Id, "dispatched")
      
      toast.success("Delivery challan created successfully")
      navigate('/challans')
    } catch (err) {
      toast.error(err.message || "Failed to create delivery challan")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Create Delivery Challan</h1>
          <p className="text-secondary mt-1">Dispatch items for delivery</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/challans')}>
          <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
          Back to Challans
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
                  <span className="text-gray-600">Delivery Date:</span>
                  <p className="font-medium">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <p className="font-medium">₹{selectedOrder.grandTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Dispatch Items */}
        {dispatchItems.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items to Dispatch</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Ordered</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Unit</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Dispatch Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dispatchItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.orderedQuantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.unit}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQuantity}
                          value={item.dispatchedQuantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Vehicle & Driver Details */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle & Driver Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              label="Vehicle Number"
              type="text"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              placeholder="MH-12-AB-1234"
              required
            />
            <FormField
              label="Driver Name"
              type="text"
              value={formData.driverName}
              onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
              placeholder="Driver name"
              required
            />
            <FormField
              label="Driver Phone"
              type="tel"
              value={formData.driverPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, driverPhone: e.target.value }))}
              placeholder="+91-9876543210"
            />
            <FormField
              label="Expected Delivery"
              type="datetime-local"
              value={formData.expectedDelivery}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
              required
            />
          </div>
        </Card>

        {/* Additional Details */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
          <FormField
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Special delivery instructions or notes..."
            rows={3}
          >
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Special delivery instructions or notes..."
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
            />
          </FormField>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/challans')}
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
                <ApperIcon name="Truck" size={16} className="mr-2" />
                Create Challan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ChallanCreate
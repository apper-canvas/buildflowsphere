import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Badge from "@/components/atoms/Badge"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"
import salesOrderService from "@/services/api/salesOrderService"
import challanService from "@/services/api/challanService"
import invoiceService from "@/services/api/invoiceService"
import { toast } from "react-toastify"

const OrderDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [challans, setChallans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadOrderData = async () => {
    try {
      setLoading(true)
      setError("")
      const [orderData, challansData, invoicesData] = await Promise.all([
        salesOrderService.getById(id),
        challanService.getByOrder(id),
        invoiceService.getAll()
      ])
      setOrder(orderData)
      setChallans(challansData)
      setInvoices(invoicesData.filter(inv => inv.orderId === parseInt(id)))
    } catch (err) {
      setError(err.message || "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderData()
  }, [id])

  const handleCreateChallan = () => {
    navigate(`/challans/create?orderId=${order.Id}`)
  }

  const handleCreateInvoice = () => {
    navigate(`/invoices/create?orderId=${order.Id}`)
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadOrderData} />
  if (!order) return <Error message="Order not found" />

  const statusVariants = {
    confirmed: "success",
    in_progress: "warning",
    dispatched: "info",
    delivered: "primary",
    cancelled: "error"
  }

  const totalDispatched = challans.reduce((sum, challan) => 
    sum + challan.items.reduce((itemSum, item) => itemSum + item.dispatchedQuantity, 0), 0
  )
  
  const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const dispatchProgress = totalOrdered > 0 ? (totalDispatched / totalOrdered) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Order {order.orderId}
            </h1>
            <Badge variant={statusVariants[order.status] || "default"}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-secondary mt-1">Order details and tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="accent" 
          onClick={handleCreateChallan}
          className="p-4 h-auto flex flex-col items-center"
        >
          <ApperIcon name="Truck" size={24} className="mb-2" />
          <span className="font-medium">Create Delivery Challan</span>
          <span className="text-sm opacity-80">Dispatch items for delivery</span>
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleCreateInvoice}
          className="p-4 h-auto flex flex-col items-center"
        >
          <ApperIcon name="Receipt" size={24} className="mb-2" />
          <span className="font-medium">Generate Invoice</span>
          <span className="text-sm opacity-80">Create billing document</span>
        </Button>
        
        <Button 
          variant="success" 
          onClick={() => navigate(`/customers/${order.customerId}`)}
          className="p-4 h-auto flex flex-col items-center"
        >
          <ApperIcon name="User" size={24} className="mb-2" />
          <span className="font-medium">View Customer</span>
          <span className="text-sm opacity-80">Customer details & history</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="overflow-x-auto">
<table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Batch Info</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Unit</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Unit Price</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {item.batchNumber ? (
                          <div className="text-xs space-y-1">
                            <div className="font-medium text-gray-700">Batch: {item.batchNumber}</div>
                            <div className="text-gray-500">
                              Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No batch info</span>
                        )}
                      </td>
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

          {/* Delivery Challans */}
          {challans.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Challans</h2>
              <div className="space-y-4">
                {challans.map((challan) => (
                  <div key={challan.Id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{challan.challanNumber}</h3>
                        <Badge variant={challan.status === "delivered" ? "success" : challan.status === "in_transit" ? "warning" : "info"}>
                          {challan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(challan.dispatchTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Vehicle: {challan.vehicleNumber} | Driver: {challan.driverName}</p>
                      {challan.deliveredTime && (
                        <p>Delivered: {new Date(challan.deliveredTime).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.Id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{invoice.invoiceNumber}</h3>
                        <Badge variant={invoice.paymentStatus === "paid" ? "success" : invoice.paymentStatus === "overdue" ? "error" : "warning"}>
                          {invoice.paymentStatus}
                        </Badge>
                      </div>
                      <span className="font-medium text-gray-900">₹{invoice.grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      {invoice.paidDate && (
                        <p>Paid: {new Date(invoice.paidDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{order.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Date:</span>
                <span className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-medium">{order.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created By:</span>
                <span className="font-medium">{order.createdBy}</span>
              </div>
            </div>
          </Card>

          {/* Delivery Progress */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Dispatched</span>
                <span>{Math.round(dispatchProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dispatchProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {totalDispatched} of {totalOrdered} items dispatched
              </div>
            </div>
          </Card>

          {/* Amount Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18%):</span>
                <span className="font-medium">₹{order.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Grand Total:</span>
                <span className="font-bold text-lg text-primary">₹{order.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delivery Address</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{order.deliveryAddress}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
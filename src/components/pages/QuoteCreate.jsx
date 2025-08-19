import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import FormField from "@/components/molecules/FormField"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"
import customerService from "@/services/api/customerService"
import productService from "@/services/api/productService"
import quoteService from "@/services/api/quoteService"
import { toast } from "react-toastify"

const QuoteCreate = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    items: [],
    notes: "",
    validUntil: ""
  })

  const [currentItem, setCurrentItem] = useState({
    productId: "",
    productName: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    totalPrice: 0
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [customersData, productsData] = await Promise.all([
        customerService.getAll(),
        productService.getAll()
      ])
      setCustomers(customersData)
      setProducts(productsData)
      
      // Set default valid until date (30 days from now)
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30)
      setFormData(prev => ({ ...prev, validUntil: validUntil.toISOString().split('T')[0] }))
    } catch (err) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.Id === parseInt(customerId))
    setFormData(prev => ({
      ...prev,
      customerId: customerId,
      customerName: customer ? customer.name : ""
    }))
  }

  const handleProductChange = (productId) => {
    const product = products.find(p => p.Id === parseInt(productId))
    if (product) {
      const retailPrice = product.pricing.find(p => p.tier === "retail")?.pricePerUnit || 0
      setCurrentItem(prev => ({
        ...prev,
        productId: productId,
        productName: product.name,
        unit: product.baseUOM,
        unitPrice: retailPrice,
        totalPrice: prev.quantity * retailPrice
      }))
    }
  }

  const handleQuantityChange = (quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1)
    setCurrentItem(prev => ({
      ...prev,
      quantity: qty,
      totalPrice: qty * prev.unitPrice
    }))
  }

  const handlePriceChange = (price) => {
    const unitPrice = Math.max(0, parseFloat(price) || 0)
    setCurrentItem(prev => ({
      ...prev,
      unitPrice: unitPrice,
      totalPrice: prev.quantity * unitPrice
    }))
  }

  const addItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0 || currentItem.unitPrice <= 0) {
      toast.error("Please fill all item details")
      return
    }

    const existingItemIndex = formData.items.findIndex(item => item.productId === currentItem.productId)
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex] = { ...currentItem }
      setFormData(prev => ({ ...prev, items: updatedItems }))
    } else {
      setFormData(prev => ({ ...prev, items: [...prev.items, { ...currentItem }] }))
    }

    // Reset current item
    setCurrentItem({
      productId: "",
      productName: "",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      totalPrice: 0
    })
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const calculateTotals = () => {
    const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = totalAmount * 0.18 // 18% GST
    const grandTotal = totalAmount + taxAmount
    return { totalAmount, taxAmount, grandTotal }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.customerId || formData.items.length === 0) {
      toast.error("Please select customer and add at least one item")
      return
    }

    try {
      setSubmitting(true)
      const { totalAmount, taxAmount, grandTotal } = calculateTotals()
      
      const quoteData = {
        ...formData,
        customerId: parseInt(formData.customerId),
        totalAmount,
        taxAmount,
        grandTotal,
        createdBy: "Sales Manager"
      }

      await quoteService.create(quoteData)
      toast.success("Quote created successfully")
      navigate('/quotes')
    } catch (err) {
      toast.error(err.message || "Failed to create quote")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadData} />

  const { totalAmount, taxAmount, grandTotal } = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Create Quote</h1>
          <p className="text-secondary mt-1">Generate a new quote for customer</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/quotes')}>
          <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
          Back to Quotes
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Customer"
              type="select"
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              options={[
                { value: "", label: "Select Customer" },
                ...customers.map(customer => ({
                  value: customer.Id.toString(),
                  label: customer.name
                }))
              ]}
              required
            />
            <FormField
              label="Valid Until"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
              required
            />
          </div>
        </Card>

        {/* Item Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <FormField
              label="Product"
              type="select"
              value={currentItem.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              options={[
                { value: "", label: "Select Product" },
                ...products.map(product => ({
                  value: product.Id.toString(),
                  label: product.name
                }))
              ]}
            />
            <FormField
              label="Quantity"
              type="number"
              value={currentItem.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              min="1"
            />
            <FormField
              label="Unit"
              type="text"
              value={currentItem.unit}
              readOnly
            />
            <FormField
              label="Unit Price (₹)"
              type="number"
              value={currentItem.unitPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              min="0"
              step="0.01"
            />
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                  ₹{currentItem.totalPrice.toLocaleString()}
                </span>
                <Button
                  type="button"
                  onClick={addItem}
                  variant="primary"
                  size="sm"
                >
                  <ApperIcon name="Plus" size={16} />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Items List */}
        {formData.items.length > 0 && (
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
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">₹{item.totalPrice.toLocaleString()}</td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          type="button"
                          variant="error"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <ApperIcon name="Trash2" size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-end space-y-2">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%):</span>
                    <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="font-bold text-lg">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Additional Details */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
          <FormField
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any special terms or notes..."
            rows={3}
          >
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any special terms or notes..."
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
            onClick={() => navigate('/quotes')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || formData.items.length === 0}
          >
            {submitting ? (
              <>
                <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ApperIcon name="Save" size={16} className="mr-2" />
                Create Quote
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default QuoteCreate
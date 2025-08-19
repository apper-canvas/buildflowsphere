import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'
import Badge from '@/components/atoms/Badge'
import DataTable from '@/components/molecules/DataTable'
import SearchBar from '@/components/molecules/SearchBar'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import ApperIcon from '@/components/ApperIcon'
import purchaseOrderService from '@/services/api/purchaseOrderService'
import productService from '@/services/api/productService'
import { toast } from 'react-toastify'

function PurchaseOrderList() {
  const navigate = useNavigate()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState([])

  useEffect(() => {
    loadPurchaseOrders()
    loadLowStockProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [purchaseOrders, searchQuery, statusFilter])

  async function loadPurchaseOrders() {
    try {
      setLoading(true)
      const data = await purchaseOrderService.getAll()
      setPurchaseOrders(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load purchase orders:', err)
      setError('Failed to load purchase orders')
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  async function loadLowStockProducts() {
    try {
      const lowStock = await productService.checkReorderPoints()
      setLowStockProducts(lowStock)
    } catch (err) {
      console.error('Failed to load low stock products:', err)
    }
  }

  function applyFilters() {
    let filtered = [...purchaseOrders]

if (searchQuery.trim()) {
      filtered = filtered.filter(po =>
        (po.poNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.items || []).some(item => (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter)
    }

    setFilteredPurchaseOrders(filtered)
  }

  async function handleUpdateStatus(po, newStatus) {
    try {
      await purchaseOrderService.updateStatus(po.Id, newStatus)
      toast.success(`Purchase order ${po.poNumber} ${newStatus}`)
      await loadPurchaseOrders()
    } catch (error) {
      console.error('Error updating purchase order status:', error)
      toast.error('Failed to update purchase order status')
    }
  }

  async function handleDelete(po) {
    if (!window.confirm(`Are you sure you want to delete purchase order ${po.poNumber}?`)) {
      return
    }

    try {
      await purchaseOrderService.delete(po.Id)
      toast.success(`Purchase order ${po.poNumber} deleted`)
      await loadPurchaseOrders()
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      toast.error('Failed to delete purchase order')
    }
  }

  async function handleGenerateFromProduct(product) {
    try {
      const newPO = await purchaseOrderService.generateFromProduct(product.Id)
      toast.success(`Purchase order ${newPO.poNumber} generated for ${product.name}`)
      await loadPurchaseOrders()
      await loadLowStockProducts()
    } catch (error) {
      console.error('Error generating purchase order:', error)
      toast.error('Failed to generate purchase order')
    }
  }

  function getStatusColor(status) {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.draft
  }

  const columns = [
    {
      key: 'poNumber',
      label: 'PO Number',
      render: (po) => (
        <div className="font-medium text-gray-900">{po.poNumber}</div>
      )
    },
    {
key: 'supplier',
      label: 'Supplier',
      render: (po) => (
        <div>
          <div className="font-medium text-gray-900">{po?.supplierName || 'No supplier name'}</div>
          <div className="text-sm text-gray-500">{po?.supplierEmail || 'No email provided'}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (po) => (
        <div className="text-sm">
          {po.items.length} item{po.items.length !== 1 ? 's' : ''}
          <div className="text-gray-500">
            {po.items.slice(0, 2).map(item => item.productName).join(', ')}
            {po.items.length > 2 && '...'}
          </div>
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total Amount',
      render: (po) => (
        <div className="font-medium">₹{po.total.toLocaleString()}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (po) => (
        <Badge className={getStatusColor(po.status)}>
          {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
        </Badge>
      )
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      render: (po) => (
        <div className="text-sm text-gray-500">
          {new Date(po.orderDate).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (po) => (
        <div className="flex space-x-2">
          {po.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(po, 'sent')}
            >
              Send
            </Button>
          )}
          {po.status === 'sent' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(po, 'confirmed')}
            >
              Confirm
            </Button>
          )}
          {po.status === 'confirmed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(po, 'delivered')}
            >
              Mark Delivered
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(po)}
          >
            <ApperIcon name="Trash2" size={16} />
          </Button>
        </div>
      )
    }
  ]

  if (loading) return <Loading />
  if (error) return <Error message={error} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage purchase orders and supplier relationships</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Create Purchase Order
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <ApperIcon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Low Stock Alert ({lowStockProducts.length} items)
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div key={product.Id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {product.currentStock} | Reorder: {product.reorderLevel}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateFromProduct(product)}
                    >
                      Generate PO
                    </Button>
                  </div>
                ))}
              </div>
              {lowStockProducts.length > 6 && (
                <p className="text-yellow-700 mt-3">
                  And {lowStockProducts.length - 6} more items need reordering
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by PO number, supplier, or product..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        {filteredPurchaseOrders.length === 0 ? (
          <Empty
            title="No purchase orders found"
            description={searchQuery || statusFilter !== 'all' 
              ? "Try adjusting your filters to see more results"
              : "Create your first purchase order to get started"
            }
            action={
              <Button onClick={() => setShowCreateModal(true)}>
                <ApperIcon name="Plus" size={16} className="mr-2" />
                Create Purchase Order
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredPurchaseOrders}
          />
        )}
      </Card>
    </div>
  )
}

export default PurchaseOrderList
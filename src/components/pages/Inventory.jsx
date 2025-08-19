import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Badge from "@/components/atoms/Badge"
import DataTable from "@/components/molecules/DataTable"
import SearchBar from "@/components/molecules/SearchBar"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import productService from "@/services/api/productService"
import { toast } from "react-toastify"
import purchaseOrderService from '@/services/api/purchaseOrderService'

const Inventory = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
const [lowStockItems, setLowStockItems] = useState([])
  const loadProducts = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await productService.getAll()
setProducts(data)
      setFilteredProducts(data)
      
      // Check for low stock and auto-generate POs if needed
      const lowStock = data.filter(p => p.currentStock <= p.reorderLevel)
      setLowStockItems(lowStock)
      
      // Auto-generate purchase orders for critically low stock
      for (const product of lowStock) {
        if (product.currentStock <= product.reorderLevel * 0.5) {
          await handleAutoGeneratePO(product)
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleSearch = (query) => {
    let filtered = products

    // Apply search filter
    if (query) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "low_stock") {
        filtered = filtered.filter(product => product.currentStock <= product.reorderLevel)
      } else {
        filtered = filtered.filter(product => product.status === statusFilter)
      }
    }

    setFilteredProducts(filtered)
  }

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category)
    applyFilters(category, statusFilter)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    applyFilters(categoryFilter, status)
  }

  const applyFilters = (category, status) => {
    let filtered = products

    if (category !== "all") {
      filtered = filtered.filter(product => product.category === category)
    }

    if (status !== "all") {
      if (status === "low_stock") {
        filtered = filtered.filter(product => product.currentStock <= product.reorderLevel)
      } else {
        filtered = filtered.filter(product => product.status === status)
      }
    }

    setFilteredProducts(filtered)
  }
async function handleGeneratePO(product) {
    try {
      await purchaseOrderService.generateFromProduct(product.Id)
      toast.success(`Purchase order generated for ${product.name}`)
      await loadProducts() // Refresh data
    } catch (error) {
      console.error("Error generating purchase order:", error)
      toast.error("Failed to generate purchase order")
    }
  }

  async function handleAutoGeneratePO(product) {
    try {
      const existingPOs = await purchaseOrderService.getAll()
      const hasActivePO = existingPOs.some(po => 
        po.items.some(item => item.productId === product.Id) && 
        ['draft', 'sent', 'confirmed'].includes(po.status)
      )
      
      if (!hasActivePO) {
        await purchaseOrderService.generateFromProduct(product.Id)
        toast.info(`Auto-generated purchase order for ${product.name}`)
      }
    } catch (error) {
      console.error("Error auto-generating purchase order:", error)
    }
  }

  function getStockStatusColor(product) {
    if (product.currentStock <= product.reorderLevel * 0.5) return "bg-red-100 text-red-800"
    if (product.currentStock <= product.reorderLevel) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  function getStockStatusText(product) {
    if (product.currentStock <= product.reorderLevel * 0.5) return "Critical"
    if (product.currentStock <= product.reorderLevel) return "Low Stock"
    return "In Stock"
  }
  const handleStockUpdate = async (product, operation, quantity) => {
    try {
      await productService.updateStock(product.Id, quantity, operation)
      toast.success(`Stock ${operation === "add" ? "added" : "reduced"} successfully`)
      loadProducts()
    } catch (err) {
      toast.error(err.message || "Failed to update stock")
    }
  }

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadProducts} />

  const columns = [
    { key: "name", label: "Product", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "brand", label: "Brand", sortable: true },
    { 
      key: "currentStock", 
      label: "Current Stock", 
      sortable: true,
      render: (value, product) => (
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${value <= product.reorderLevel ? 'text-error' : 'text-gray-900'}`}>
            {value}
          </span>
          <span className="text-sm text-gray-500">{product.baseUOM}</span>
        </div>
      )
    },
    { 
      key: "reorderLevel", 
      label: "Reorder Level", 
      sortable: true,
      render: (value, product) => (
        <span className="text-sm text-gray-600">{value} {product.baseUOM}</span>
      )
    },
    { 
      key: "status", 
      label: "Status", 
      sortable: true,
      render: (value, product) => {
        const isLowStock = product.currentStock <= product.reorderLevel
        return (
          <Badge variant={isLowStock ? "error" : value === "active" ? "success" : "warning"}>
            {isLowStock ? "Low Stock" : value}
          </Badge>
        )
      }
    }
  ]

  const actions = [
    {
      label: "Add Stock",
      icon: "Plus",
      variant: "success",
      onClick: (product) => {
        const quantity = prompt(`Add stock for ${product.name}:`, "10")
        if (quantity && parseInt(quantity) > 0) {
          handleStockUpdate(product, "add", parseInt(quantity))
        }
      }
    },
    {
      label: "Reduce Stock",
      icon: "Minus",
      variant: "warning",
      onClick: (product) => {
        const quantity = prompt(`Reduce stock for ${product.name}:`, "1")
        if (quantity && parseInt(quantity) > 0) {
          handleStockUpdate(product, "subtract", parseInt(quantity))
        }
      }
    }
  ]

  const categories = [...new Set(products.map(p => p.category))]
  const lowStockCount = products.filter(p => p.currentStock <= p.reorderLevel).length
  const totalValue = products.reduce((sum, p) => {
    const price = p.pricing.find(pr => pr.tier === "wholesale")?.pricePerUnit || 0
    return sum + (p.currentStock * price)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Inventory Management</h1>
          <p className="text-secondary mt-1">Track stock levels and manage inventory</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="accent" onClick={() => navigate('/reports')}>
            <ApperIcon name="BarChart3" size={16} className="mr-2" />
            Inventory Reports
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mr-4">
              <ApperIcon name="Package" size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-error/10 to-warning/10 rounded-lg mr-4">
              <ApperIcon name="AlertTriangle" size={24} className="text-error" />
            </div>
            <div>
              <p className="text-sm text-secondary">Low Stock Items</p>
              <p className="text-2xl font-bold text-error">{lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-success/10 to-primary/10 rounded-lg mr-4">
              <ApperIcon name="TrendingUp" size={24} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-secondary">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-accent/10 to-warning/10 rounded-lg mr-4">
              <ApperIcon name="Layers" size={24} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-secondary">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <SearchBar
              placeholder="Search products..."
              onSearch={handleSearch}
              className="w-full sm:w-64"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === "all"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === category
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "low_stock"].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status === "all" ? "All" : status === "low_stock" ? "Low Stock" : "Active"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-error/10 to-warning/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center">
            <ApperIcon name="AlertTriangle" size={20} className="text-error mr-3" />
            <div>
              <h3 className="font-medium text-error">Low Stock Alert</h3>
              <p className="text-sm text-gray-600">
                {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low on stock. Consider restocking soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredProducts}
          actions={actions}
        />
      ) : (
        <Empty
          title="No Products Found"
          description={products.length === 0 ? "Add products to start managing inventory" : "No products match your current filters"}
          actionLabel="Add Product"
          actionIcon="Plus"
          onAction={() => toast.info("Product management coming soon!")}
        />
      )}
    </div>
  )
}

export default Inventory
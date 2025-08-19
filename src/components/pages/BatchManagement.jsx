import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Badge from "@/components/atoms/Badge"
import DataTable from "@/components/molecules/DataTable"
import SearchBar from "@/components/molecules/SearchBar"
import FormField from "@/components/molecules/FormField"
import BarcodeScanner from "@/components/molecules/BarcodeScanner"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import productService from "@/services/api/productService"
import { toast } from "react-toastify"
const BatchManagement = () => {
  const navigate = useNavigate()
const [batches, setBatches] = useState([])
  const [filteredBatches, setFilteredBatches] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [expiringBatches, setExpiringBatches] = useState([])
  const [showScanner, setShowScanner] = useState(false)
  const [newBatch, setNewBatch] = useState({
    batchNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: "",
    supplierName: "",
    qualityCheckStatus: "pending",
    storageLocation: ""
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const [batchesData, productsData, expiringData] = await Promise.all([
        productService.getAllBatches(),
        productService.getAll(),
        productService.getExpiringSoon(30)
      ])
      
      setBatches(batchesData)
      setFilteredBatches(batchesData)
      setProducts(productsData)
      setExpiringBatches(expiringData)
      
      if (expiringData.length > 0) {
        toast.warning(`${expiringData.length} batch(es) expiring within 30 days`)
      }
    } catch (err) {
      setError(err.message || "Failed to load batch data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = (query) => {
    if (!query) {
      setFilteredBatches(batches)
      return
    }
    
    const filtered = batches.filter(batch =>
      batch.batchNumber.toLowerCase().includes(query.toLowerCase()) ||
      batch.productName.toLowerCase().includes(query.toLowerCase()) ||
      batch.supplierName.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredBatches(filtered)
  }

  const handleCreateBatch = async () => {
    try {
      if (!selectedProduct) {
        toast.error("Please select a product")
        return
      }

      await productService.createBatch(selectedProduct, {
        ...newBatch,
        quantity: parseInt(newBatch.quantity)
      })

      toast.success("Batch created successfully")
      setShowCreateModal(false)
      setNewBatch({
        batchNumber: "",
        manufacturingDate: "",
        expiryDate: "",
        quantity: "",
        supplierName: "",
        qualityCheckStatus: "pending",
        storageLocation: ""
      })
      setSelectedProduct("")
      loadData()
    } catch (err) {
      toast.error(err.message || "Failed to create batch")
    }
  }
// Handle batch barcode scan
  const handleBatchScan = async (code) => {
    setShowScanner(false)
    
    try {
      // Search for batch by code
      const searchResults = await productService.searchBatches(code)
      
      if (searchResults && searchResults.length > 0) {
        const batch = searchResults[0]
        toast.success(`Batch found: ${batch.batchNumber} - ${batch.productName}`)
        
        // Filter to show only the scanned batch
        setFilteredBatches([batch])
        
        // Highlight the batch
        setTimeout(() => {
          const element = document.getElementById(`batch-${batch.Id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('bg-blue-50', 'border-blue-200')
            setTimeout(() => {
              element.classList.remove('bg-blue-50', 'border-blue-200')
            }, 3000)
          }
        }, 100)
      } else {
        toast.error(`Batch not found for code: ${code}`)
      }
    } catch (error) {
      console.error('Error searching batch:', error)
      toast.error('Error searching for batch')
    }
  }
  const getExpiryStatus = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    
    if (daysToExpiry < 0) return { status: "expired", variant: "error", text: "Expired" }
    if (daysToExpiry <= 7) return { status: "critical", variant: "error", text: `${daysToExpiry} days` }
    if (daysToExpiry <= 30) return { status: "warning", variant: "warning", text: `${daysToExpiry} days` }
    return { status: "good", variant: "success", text: `${daysToExpiry} days` }
  }

  const columns = [
    { key: "batchNumber", label: "Batch Number", sortable: true },
    { key: "productName", label: "Product", sortable: true },
    { key: "productCategory", label: "Category", sortable: true },
    { 
      key: "quantity", 
      label: "Quantity", 
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    { 
      key: "expiryDate", 
      label: "Expiry Status", 
      sortable: true,
      render: (value) => {
        const status = getExpiryStatus(value)
        return (
          <div className="flex flex-col">
            <Badge variant={status.variant}>{status.text}</Badge>
            <span className="text-xs text-gray-500 mt-1">
              {new Date(value).toLocaleDateString()}
            </span>
          </div>
        )
      }
    },
    { key: "supplierName", label: "Supplier", sortable: true },
    { 
      key: "qualityCheckStatus", 
      label: "Quality", 
      sortable: true,
      render: (value) => (
        <Badge variant={value === "passed" ? "success" : value === "failed" ? "error" : "warning"}>
          {value}
        </Badge>
      )
    },
    { key: "storageLocation", label: "Location", sortable: true }
  ]

  const actions = [
    {
      label: "View Details",
      icon: "Eye",
      variant: "primary",
      onClick: (batch) => {
        // Navigate to batch details or show modal
        toast.info(`Viewing batch ${batch.batchNumber}`)
      }
    }
  ]

  const CreateBatchModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Batch</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              <ApperIcon name="X" size={20} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Product"
              type="select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              options={[
                { value: "", label: "Select Product" },
                ...products.map(p => ({ value: p.Id, label: p.name }))
              ]}
              required
            />

            <FormField
              label="Batch Number"
              value={newBatch.batchNumber}
              onChange={(e) => setNewBatch(prev => ({ ...prev, batchNumber: e.target.value }))}
              placeholder="Enter batch number"
              required
            />

            <FormField
              label="Manufacturing Date"
              type="date"
              value={newBatch.manufacturingDate}
              onChange={(e) => setNewBatch(prev => ({ ...prev, manufacturingDate: e.target.value }))}
              required
            />

            <FormField
              label="Expiry Date"
              type="date"
              value={newBatch.expiryDate}
              onChange={(e) => setNewBatch(prev => ({ ...prev, expiryDate: e.target.value }))}
              required
            />

            <FormField
              label="Quantity"
              type="number"
              value={newBatch.quantity}
              onChange={(e) => setNewBatch(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Enter quantity"
              min="1"
              required
            />

            <FormField
              label="Supplier Name"
              value={newBatch.supplierName}
              onChange={(e) => setNewBatch(prev => ({ ...prev, supplierName: e.target.value }))}
              placeholder="Enter supplier name"
              required
            />

            <FormField
              label="Quality Check Status"
              type="select"
              value={newBatch.qualityCheckStatus}
              onChange={(e) => setNewBatch(prev => ({ ...prev, qualityCheckStatus: e.target.value }))}
              options={[
                { value: "pending", label: "Pending" },
                { value: "passed", label: "Passed" },
                { value: "failed", label: "Failed" }
              ]}
            />

            <FormField
              label="Storage Location"
              value={newBatch.storageLocation}
              onChange={(e) => setNewBatch(prev => ({ ...prev, storageLocation: e.target.value }))}
              placeholder="Enter storage location"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBatch}>
              Create Batch
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) return <Loading />
  if (error) return <Error message={error} />

  return (
    <div className="p-6 space-y-6">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600">Track and manage product batches and expiry dates</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setShowScanner(true)}>
            <ApperIcon name="QrCode" size={16} className="mr-2" />
            Scan Batch
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <ApperIcon name="Plus" size={16} className="mr-2" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ApperIcon name="Package" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Batches</p>
              <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-error/10 rounded-lg">
              <ApperIcon name="AlertTriangle" size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-error">{expiringBatches.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <ApperIcon name="CheckCircle" size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Quality Passed</p>
              <p className="text-2xl font-bold text-success">
                {batches.filter(b => b.qualityCheckStatus === "passed").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <ApperIcon name="Clock" size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending QC</p>
              <p className="text-2xl font-bold text-warning">
                {batches.filter(b => b.qualityCheckStatus === "pending").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search by batch number, product, or supplier..."
            />
          </div>
        </div>
      </Card>
{/* Batch Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          title="Scan Batch Barcode"
          placeholder="Position batch barcode in the frame"
          onScan={handleBatchScan}
          onClose={() => setShowScanner(false)}
        />
      )}
      {/* Expiring Batches Alert */}
      {expiringBatches.length > 0 && (
        <Card className="p-4 border-l-4 border-l-warning bg-warning/5">
          <div className="flex items-start space-x-3">
            <ApperIcon name="AlertTriangle" size={20} className="text-warning mt-1" />
            <div>
              <h3 className="font-medium text-gray-900">Batches Expiring Soon</h3>
              <p className="text-sm text-gray-600 mt-1">
                {expiringBatches.length} batch(es) will expire within the next 30 days. 
                Please review and take necessary action.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        {filteredBatches.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredBatches}
            actions={actions}
          />
        ) : (
          <Empty
            title="No batches found"
            message="Create your first batch or adjust your search criteria"
            action={{
              label: "Create Batch",
              onClick: () => setShowCreateModal(true)
            }}
          />
        )}
      </Card>

      {showCreateModal && <CreateBatchModal />}
</div>
  )
}

export default BatchManagement
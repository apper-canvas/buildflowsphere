import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/atoms/Button'
import DataTable from '@/components/molecules/DataTable'
import SearchBar from '@/components/molecules/SearchBar'
import Badge from '@/components/atoms/Badge'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import ApperIcon from '@/components/ApperIcon'
import vendorService from '@/services/api/vendorService'
import { toast } from 'react-toastify'

function VendorList() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const columns = [
    {
      key: 'name',
      header: 'Vendor Name',
      render: (vendor) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{vendor.name}</span>
          <span className="text-sm text-gray-500">{vendor.email}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (vendor) => vendor.phone
    },
    {
      key: 'address',
      header: 'Address',
      render: (vendor) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {vendor.address}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (vendor) => (
        <Badge variant={vendor.status === 'Active' ? 'success' : 'secondary'}>
          {vendor.status}
        </Badge>
      )
    },
    {
      key: 'totalOrders',
      header: 'Total Orders',
      render: (vendor) => vendor.totalOrders || 0
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      render: (vendor) => `₹${(vendor.outstanding || 0).toLocaleString()}`
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vendor) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(vendor)}
            className="h-8 w-8 p-0"
          >
            <ApperIcon name="Edit" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(vendor)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <ApperIcon name="Trash2" size={16} />
          </Button>
        </div>
      )
    }
  ]

  async function loadVendors() {
    try {
      setLoading(true)
      setError(null)
      const data = await vendorService.getAll()
      setVendors(data)
      setFilteredVendors(data)
    } catch (err) {
      setError(err.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(query) {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredVendors(vendors)
      return
    }

    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(query.toLowerCase()) ||
      vendor.email.toLowerCase().includes(query.toLowerCase()) ||
      vendor.phone.includes(query)
    )
    setFilteredVendors(filtered)
  }

  function handleEdit(vendor) {
    toast.info(`Edit vendor: ${vendor.name}`)
    // Navigation to edit form would go here
  }

  async function handleDelete(vendor) {
    if (!confirm(`Are you sure you want to delete ${vendor.name}?`)) {
      return
    }

    try {
      await vendorService.delete(vendor.Id)
      toast.success(`${vendor.name} deleted successfully`)
      await loadVendors()
    } catch (err) {
      toast.error(err.message || 'Failed to delete vendor')
    }
  }

  useEffect(() => {
    loadVendors()
  }, [])

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadVendors} />

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage your vendor relationships</p>
        </div>
        <Button onClick={() => toast.info('Add vendor functionality')}>
          <ApperIcon name="Plus" size={20} className="mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="mb-6">
          <SearchBar
            placeholder="Search vendors by name, email, or phone..."
            onSearch={handleSearch}
            className="max-w-md"
          />
        </div>

        {filteredVendors.length === 0 ? (
          <Empty
            title="No vendors found"
            description={searchQuery ? "No vendors match your search criteria." : "Start by adding your first vendor."}
            action={
              <Button onClick={() => toast.info('Add vendor functionality')}>
                <ApperIcon name="Plus" size={20} className="mr-2" />
                Add Vendor
              </Button>
            }
          />
        ) : (
          <DataTable
            data={filteredVendors}
            columns={columns}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

export default VendorList
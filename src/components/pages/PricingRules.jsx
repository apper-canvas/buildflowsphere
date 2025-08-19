import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'
import FormField from '@/components/molecules/FormField'
import DataTable from '@/components/molecules/DataTable'
import SearchBar from '@/components/molecules/SearchBar'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Badge from '@/components/atoms/Badge'
import pricingRulesService from '@/services/api/pricingRulesService'
import productService from '@/services/api/productService'
import customerService from '@/services/api/customerService'

export default function PricingRules() {
  const [rules, setRules] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'volume',
    discountType: 'volume',
    isActive: true,
    priority: 1,
    applicableProducts: [],
    applicableCustomers: [],
    customerTiers: [],
    volumeBrackets: [
      { minQuantity: 10, maxQuantity: 49, discountValue: 5, discountType: 'percentage' }
    ],
    discountValue: { type: 'percentage', value: 0 },
    minQuantity: 1,
    validFrom: '',
    validUntil: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rulesData, productsData, customersData] = await Promise.all([
        pricingRulesService.getAll(),
        productService.getAll(),
        customerService.getAll()
      ])
      
      setRules(rulesData)
      setProducts(productsData)
      setCustomers(customersData)
      setError(null)
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load pricing rules data')
    } finally {
      setLoading(false)
    }
  }

  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.ruleType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      // Validate form
      const validation = await pricingRulesService.validatePricingRule(formData)
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '))
        return
      }
      
      if (editingRule) {
        await pricingRulesService.update(editingRule.Id, formData)
        toast.success('Pricing rule updated successfully')
      } else {
        await pricingRulesService.create(formData)
        toast.success('Pricing rule created successfully')
      }
      
      await loadData()
      resetForm()
      setShowCreateModal(false)
      setEditingRule(null)
    } catch (err) {
      toast.error(err.message || 'Failed to save pricing rule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      discountType: rule.discountType,
      isActive: rule.isActive,
      priority: rule.priority,
      applicableProducts: rule.applicableProducts || [],
      applicableCustomers: rule.applicableCustomers || [],
      customerTiers: rule.customerTiers || [],
      volumeBrackets: rule.volumeBrackets || [
        { minQuantity: 10, maxQuantity: 49, discountValue: 5, discountType: 'percentage' }
      ],
      discountValue: rule.discountValue || { type: 'percentage', value: 0 },
      minQuantity: rule.minQuantity || 1,
      validFrom: rule.validFrom || '',
      validUntil: rule.validUntil || ''
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return
    
    try {
      await pricingRulesService.delete(ruleId)
      toast.success('Pricing rule deleted successfully')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete pricing rule')
    }
  }

  const handleToggleActive = async (rule) => {
    try {
      await pricingRulesService.update(rule.Id, { ...rule, isActive: !rule.isActive })
      toast.success(`Pricing rule ${rule.isActive ? 'deactivated' : 'activated'} successfully`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to update pricing rule')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ruleType: 'volume',
      discountType: 'volume',
      isActive: true,
      priority: 1,
      applicableProducts: [],
      applicableCustomers: [],
      customerTiers: [],
      volumeBrackets: [
        { minQuantity: 10, maxQuantity: 49, discountValue: 5, discountType: 'percentage' }
      ],
      discountValue: { type: 'percentage', value: 0 },
      minQuantity: 1,
      validFrom: '',
      validUntil: ''
    })
  }

  const addVolumeBracket = () => {
    setFormData(prev => ({
      ...prev,
      volumeBrackets: [
        ...prev.volumeBrackets,
        { minQuantity: 0, maxQuantity: null, discountValue: 0, discountType: 'percentage' }
      ]
    }))
  }

  const removeVolumeBracket = (index) => {
    setFormData(prev => ({
      ...prev,
      volumeBrackets: prev.volumeBrackets.filter((_, i) => i !== index)
    }))
  }

  const updateVolumeBracket = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      volumeBrackets: prev.volumeBrackets.map((bracket, i) => 
        i === index ? { ...bracket, [field]: value } : bracket
      )
    }))
  }

  const columns = [
    {
      key: 'name',
      label: 'Rule Name',
      render: (rule) => (
        <div>
          <div className="font-medium">{rule.name}</div>
          <div className="text-sm text-gray-500">{rule.description}</div>
        </div>
      )
    },
    {
      key: 'ruleType',
      label: 'Type',
      render: (rule) => (
        <Badge variant={rule.ruleType === 'global' ? 'success' : 'default'}>
          {rule.ruleType.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'discountType',
      label: 'Discount Type',
      render: (rule) => (
        <Badge variant="info">
          {rule.discountType.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (rule) => (
        <Badge variant={rule.isActive ? 'success' : 'secondary'}>
          {rule.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'validPeriod',
      label: 'Valid Period',
      render: (rule) => (
        <div className="text-sm">
          <div>{rule.validFrom || 'No start date'}</div>
          <div>{rule.validUntil || 'No end date'}</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (rule) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(rule)}
          >
            <ApperIcon name="Edit" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(rule)}
            className={rule.isActive ? 'text-orange-600' : 'text-green-600'}
          >
            <ApperIcon name={rule.isActive ? 'Pause' : 'Play'} size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(rule.Id)}
            className="text-red-600"
          >
            <ApperIcon name="Trash2" size={16} />
          </Button>
        </div>
      )
    }
  ]

  if (loading) return <Loading />
  if (error) return <Error message={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Rules</h1>
          <p className="text-gray-600">Manage volume discounts and special pricing strategies</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <ApperIcon name="Plus" size={20} className="mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search pricing rules..."
        />
      </Card>

      {/* Rules Table */}
      <Card>
        <DataTable
          data={filteredRules}
          columns={columns}
          loading={loading}
        />
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingRule(null)
                    resetForm()
                  }}
                >
                  <ApperIcon name="X" size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Rule Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <FormField
                    label="Priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                  />
                </div>

                <FormField
                  label="Description"
                  type="textarea"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Rule Type"
                    type="select"
                    value={formData.ruleType}
                    onChange={(e) => setFormData(prev => ({ ...prev, ruleType: e.target.value }))}
                    options={[
                      { value: 'global', label: 'Global' },
                      { value: 'customer_tier', label: 'Customer Tier' },
                      { value: 'customer_specific', label: 'Customer Specific' },
                      { value: 'promotional', label: 'Promotional' },
                      { value: 'seasonal', label: 'Seasonal' }
                    ]}
                  />
                  <FormField
                    label="Discount Type"
                    type="select"
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                    options={[
                      { value: 'volume', label: 'Volume Discount' },
                      { value: 'customer_specific', label: 'Customer Specific' },
                      { value: 'promotional', label: 'Promotional' }
                    ]}
                  />
                </div>

                {/* Volume Brackets */}
                {formData.discountType === 'volume' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Volume Brackets
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVolumeBracket}
                      >
                        <ApperIcon name="Plus" size={16} className="mr-1" />
                        Add Bracket
                      </Button>
                    </div>
                    
                    {formData.volumeBrackets.map((bracket, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-4 border rounded-lg">
                        <div className="col-span-2">
                          <FormField
                            label="Min Qty"
                            type="number"
                            value={bracket.minQuantity}
                            onChange={(e) => updateVolumeBracket(index, 'minQuantity', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            label="Max Qty"
                            type="number"
                            value={bracket.maxQuantity || ''}
                            onChange={(e) => updateVolumeBracket(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Unlimited"
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            label="Discount"
                            type="number"
                            value={bracket.discountValue}
                            onChange={(e) => updateVolumeBracket(index, 'discountValue', parseFloat(e.target.value))}
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            label="Type"
                            type="select"
                            value={bracket.discountType}
                            onChange={(e) => updateVolumeBracket(index, 'discountType', e.target.value)}
                            options={[
                              { value: 'percentage', label: '%' },
                              { value: 'fixed', label: '₹' }
                            ]}
                          />
                        </div>
                        <div className="col-span-4 flex justify-end">
                          {formData.volumeBrackets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVolumeBracket(index)}
                              className="text-red-600"
                            >
                              <ApperIcon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Validity Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Valid From"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                  />
                  <FormField
                    label="Valid Until"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingRule(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
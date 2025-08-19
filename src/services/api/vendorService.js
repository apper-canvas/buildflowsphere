import vendorsData from '@/services/mockData/vendors.json'

// In-memory storage for runtime changes
let vendors = [...vendorsData]
let nextId = Math.max(...vendors.map(v => v.Id)) + 1

async function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class VendorService {
  async getAll() {
    await delay()
    return [...vendors]
  }

  async getById(id) {
    await delay()
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      throw new Error('Invalid vendor ID')
    }
    
    const vendor = vendors.find(v => v.Id === parsedId)
    if (!vendor) {
      throw new Error('Vendor not found')
    }
    return { ...vendor }
  }

  async create(vendorData) {
    await delay()
    
    // Validate required fields
    if (!vendorData.name || !vendorData.email) {
      throw new Error('Name and email are required')
    }

    // Check for duplicate email
    if (vendors.some(v => v.email === vendorData.email)) {
      throw new Error('Vendor with this email already exists')
    }

    const newVendor = {
      ...vendorData,
      Id: nextId++,
      status: vendorData.status || 'Active',
      totalOrders: 0,
      outstanding: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    vendors.push(newVendor)
    return { ...newVendor }
  }

  async update(id, vendorData) {
    await delay()
    
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      throw new Error('Invalid vendor ID')
    }

    const index = vendors.findIndex(v => v.Id === parsedId)
    if (index === -1) {
      throw new Error('Vendor not found')
    }

    // Check for duplicate email (excluding current vendor)
    if (vendorData.email && vendors.some(v => v.Id !== parsedId && v.email === vendorData.email)) {
      throw new Error('Vendor with this email already exists')
    }

    vendors[index] = {
      ...vendors[index],
      ...vendorData,
      Id: parsedId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    return { ...vendors[index] }
  }

  async delete(id) {
    await delay()
    
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      throw new Error('Invalid vendor ID')
    }

    const index = vendors.findIndex(v => v.Id === parsedId)
    if (index === -1) {
      throw new Error('Vendor not found')
    }

    const deletedVendor = vendors[index]
    vendors.splice(index, 1)
    return { ...deletedVendor }
  }

  async updateOutstanding(vendorId, amount) {
    await delay()
    
    const parsedId = parseInt(vendorId)
    if (isNaN(parsedId)) {
      throw new Error('Invalid vendor ID')
    }

    const vendor = vendors.find(v => v.Id === parsedId)
    if (!vendor) {
      throw new Error('Vendor not found')
    }

    vendor.outstanding = (vendor.outstanding || 0) + amount
    vendor.updatedAt = new Date().toISOString()
    
    return { ...vendor }
  }
}

export default new VendorService()
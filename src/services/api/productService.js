import productsData from "@/services/mockData/products.json"

class ProductService {
  constructor() {
    this.products = [...productsData]
    this.batchCounter = this.getMaxBatchId() + 1
  }

  getMaxBatchId() {
    let maxId = 0
    this.products.forEach(product => {
      if (product.batches) {
        product.batches.forEach(batch => {
          if (batch.Id > maxId) maxId = batch.Id
        })
      }
    })
    return maxId
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

async getAll() {
  await this.delay()
  return [...this.products]
}

async getById(id) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(id))
  if (!product) {
    throw new Error("Product not found")
  }
  return { ...product }
}

async getBatches(productId) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  return product.batches || []
}

async getBatchById(productId, batchId) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  const batch = product.batches?.find(b => b.Id === parseInt(batchId))
  if (!batch) {
    throw new Error("Batch not found")
  }
  return { ...batch }
}

async createBatch(productId, batchData) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  
  if (!product.batches) {
    product.batches = []
  }
  
  const newBatch = {
    ...batchData,
    Id: this.batchCounter++,
    receivedDate: new Date().toISOString().split('T')[0]
  }
  
  product.batches.push(newBatch)
  product.currentStock += batchData.quantity
  
  return { ...newBatch }
}

async updateBatch(productId, batchId, batchData) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  
  const batchIndex = product.batches?.findIndex(b => b.Id === parseInt(batchId))
  if (batchIndex === -1) {
    throw new Error("Batch not found")
  }
  
  const oldQuantity = product.batches[batchIndex].quantity
  product.batches[batchIndex] = { ...product.batches[batchIndex], ...batchData }
  
  // Adjust product stock based on quantity change
  product.currentStock += (batchData.quantity - oldQuantity)
  
  return { ...product.batches[batchIndex] }
}

async getExpiringSoon(days = 30) {
  await this.delay()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() + days)
  
  const expiringBatches = []
  this.products.forEach(product => {
    if (product.batches) {
      product.batches.forEach(batch => {
        const expiryDate = new Date(batch.expiryDate)
        if (expiryDate <= cutoffDate) {
          expiringBatches.push({
            ...batch,
            productId: product.Id,
            productName: product.name,
            daysToExpiry: Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
          })
        }
      })
    }
  })
  
  return expiringBatches.sort((a, b) => a.daysToExpiry - b.daysToExpiry)
}

async allocateBatch(productId, batchId, quantity) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  
  const batch = product.batches?.find(b => b.Id === parseInt(batchId))
  if (!batch) {
    throw new Error("Batch not found")
  }
  
  if (batch.quantity < quantity) {
    throw new Error("Insufficient batch quantity")
  }
  
  batch.quantity -= quantity
  product.currentStock -= quantity
  
  return {
    batchId: batch.Id,
    batchNumber: batch.batchNumber,
    allocatedQuantity: quantity,
    expiryDate: batch.expiryDate
  }
}

  async getLowStock() {
    await this.delay()
    return this.products.filter(p => p.currentStock <= p.reorderLevel)
  }

async updateStock(productId, quantity, operation = "add") {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  
  if (operation === "add") {
    product.currentStock += quantity
  } else if (operation === "subtract") {
    product.currentStock = Math.max(0, product.currentStock - quantity)
  }

  // Update status based on stock level
  if (product.currentStock <= product.reorderLevel) {
    product.status = "low_stock"
  } else {
    product.status = "active"
  }
  
  return { ...product }
}

  async search(query) {
    await this.delay()
    const searchTerm = query.toLowerCase()
    return this.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.brand.toLowerCase().includes(searchTerm)
    )
  }

async getByCategory(category) {
  await this.delay()
  return this.products.filter(p => p.category === category)
}

async checkReorderPoints() {
  await this.delay()
  const lowStockProducts = this.products.filter(p => p.currentStock <= p.reorderLevel)
  return lowStockProducts.map(product => ({
    ...product,
    suggestedOrderQuantity: Math.max(
      product.reorderLevel * 2 - product.currentStock,
      product.reorderLevel
    )
  }))
}

async getReorderSuggestion(productId) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }

  const suggestedQuantity = Math.max(
    product.reorderLevel * 2 - product.currentStock,
    product.reorderLevel
  )

  return {
    ...product,
    suggestedOrderQuantity: suggestedQuantity,
    estimatedCost: suggestedQuantity * product.pricing[0].pricePerUnit
  }
}

async calculateOptimalPrice(productId, customerId, quantity = 1) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }

  // Get base price from product pricing tiers
  const basePrice = product.pricing.find(p => p.tier === "retail")?.pricePerUnit || product.pricing[0].pricePerUnit

  // Import pricing rules service dynamically to avoid circular dependency
  const { default: pricingRulesService } = await import('@/services/api/pricingRulesService')
  return await pricingRulesService.calculateOptimalPrice(productId, customerId, quantity, basePrice)
}

async getPricingTiers(productId) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  return [...product.pricing]
}

async updatePricingTier(productId, tier, priceData) {
  await this.delay()
  const product = this.products.find(p => p.Id === parseInt(productId))
  if (!product) {
    throw new Error("Product not found")
  }
  
  const tierIndex = product.pricing.findIndex(p => p.tier === tier)
  if (tierIndex >= 0) {
    product.pricing[tierIndex] = { ...product.pricing[tierIndex], ...priceData }
  } else {
    product.pricing.push({ tier, ...priceData })
  }
  
  return [...product.pricing]
}

async getVolumeBreakpoints(productId, customerId) {
  await this.delay()
  const { default: pricingRulesService } = await import('@/services/api/pricingRulesService')
  return await pricingRulesService.getVolumeBreakpoints(productId, customerId)
}

async getAllBatches() {
  await this.delay()
  const allBatches = []
  this.products.forEach(product => {
    if (product.batches) {
      product.batches.forEach(batch => {
        allBatches.push({
          ...batch,
          productId: product.Id,
          productName: product.name,
          productCategory: product.category
        })
      })
    }
  })
  return allBatches
}

async searchBatches(query) {
  await this.delay()
  const allBatches = await this.getAllBatches()
  return allBatches.filter(batch =>
    batch.batchNumber.toLowerCase().includes(query.toLowerCase()) ||
    batch.productName.toLowerCase().includes(query.toLowerCase()) ||
    batch.supplierName.toLowerCase().includes(query.toLowerCase())
  )
}
}

export default new ProductService()
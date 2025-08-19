import productsData from "@/services/mockData/products.json"

class ProductService {
  constructor() {
    this.products = [...productsData]
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
}

export default new ProductService()
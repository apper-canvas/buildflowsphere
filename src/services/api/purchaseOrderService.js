import purchaseOrdersData from "@/services/mockData/purchaseOrders.json"
import productService from "./productService.js"

class PurchaseOrderService {
  constructor() {
    this.purchaseOrders = [...purchaseOrdersData]
    this.nextId = Math.max(...this.purchaseOrders.map(po => po.Id)) + 1
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  generatePONumber() {
    const date = new Date()
    const year = date.getFullYear()
    const count = this.purchaseOrders.length + 1
    return `PO-${year}-${String(count).padStart(3, '0')}`
  }

  async getAll() {
    await this.delay()
    return [...this.purchaseOrders]
  }

  async getById(id) {
    await this.delay()
    const po = this.purchaseOrders.find(p => p.Id === parseInt(id))
    if (!po) {
      throw new Error("Purchase order not found")
    }
    return { ...po }
  }

  async create(poData) {
    await this.delay()
    const newPO = {
      Id: this.nextId++,
      poNumber: this.generatePONumber(),
      status: "draft",
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...poData,
      items: poData.items.map((item, index) => ({
        Id: index + 1,
        ...item,
        totalPrice: item.quantity * item.unitPrice
      }))
    }

    // Calculate totals
    newPO.subtotal = newPO.items.reduce((sum, item) => sum + item.totalPrice, 0)
    newPO.taxAmount = newPO.subtotal * (newPO.taxRate / 100)
    newPO.total = newPO.subtotal + newPO.taxAmount

    this.purchaseOrders.push(newPO)
    return { ...newPO }
  }

  async update(id, updateData) {
    await this.delay()
    const index = this.purchaseOrders.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Purchase order not found")
    }

    this.purchaseOrders[index] = {
      ...this.purchaseOrders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    // Recalculate totals if items were updated
    if (updateData.items) {
      const po = this.purchaseOrders[index]
      po.subtotal = po.items.reduce((sum, item) => sum + item.totalPrice, 0)
      po.taxAmount = po.subtotal * (po.taxRate / 100)
      po.total = po.subtotal + po.taxAmount
    }

    return { ...this.purchaseOrders[index] }
  }

  async delete(id) {
    await this.delay()
    const index = this.purchaseOrders.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Purchase order not found")
    }

    const deletedPO = this.purchaseOrders.splice(index, 1)[0]
    return { ...deletedPO }
  }

  async generateFromProduct(productId) {
    await this.delay()
    const suggestion = await productService.getReorderSuggestion(productId)
    
    const newPO = await this.create({
      supplierId: 1,
      supplierName: "Auto Supplier",
      supplierEmail: "orders@autosupplier.com",
      supplierPhone: "+91-0000000000",
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{
        productId: suggestion.Id,
        productName: suggestion.name,
        quantity: suggestion.suggestedOrderQuantity,
        unitPrice: suggestion.pricing[0].pricePerUnit
      }],
      taxRate: 18,
      notes: "Auto-generated based on reorder level"
    })

    return newPO
  }

  async updateStatus(id, newStatus) {
    await this.delay()
    return await this.update(id, { status: newStatus })
  }

  async getByStatus(status) {
    await this.delay()
    return this.purchaseOrders.filter(po => po.status === status)
  }

  async search(query) {
    await this.delay()
    const searchTerm = query.toLowerCase()
    return this.purchaseOrders.filter(po =>
      po.poNumber.toLowerCase().includes(searchTerm) ||
      po.supplierName.toLowerCase().includes(searchTerm) ||
      po.items.some(item => item.productName.toLowerCase().includes(searchTerm))
    )
  }
}

export default new PurchaseOrderService()
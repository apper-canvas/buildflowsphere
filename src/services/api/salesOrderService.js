import salesOrdersData from "@/services/mockData/salesOrders.json"

class SalesOrderService {
  constructor() {
    this.salesOrders = [...salesOrdersData]
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll() {
    await this.delay()
    return [...this.salesOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
  }

  async getById(id) {
    await this.delay()
    const order = this.salesOrders.find(o => o.Id === parseInt(id))
    if (!order) {
      throw new Error("Sales order not found")
    }
    return { ...order }
  }

async create(orderData) {
  await this.delay()
  const maxId = Math.max(...this.salesOrders.map(o => o.Id), 0)
  const maxOrderNumber = Math.max(
    ...this.salesOrders.map(o => parseInt(o.orderId.split('-').pop())), 
    0
  )
  
  const newOrder = {
    ...orderData,
    Id: maxId + 1,
    orderId: `SO-2024-${String(maxOrderNumber + 1).padStart(3, '0')}`,
    status: "confirmed",
    orderDate: new Date().toISOString().split('T')[0]
  }
  
  // Allocate batches and update stock
  if (newOrder.items) {
    const productService = (await import('@/services/api/productService')).default
    
    for (const item of newOrder.items) {
      if (item.batchId) {
        try {
          await productService.allocateBatch(item.productId, item.batchId, item.quantity)
        } catch (err) {
          throw new Error(`Failed to allocate batch ${item.batchNumber}: ${err.message}`)
        }
      } else {
        // Fallback to regular stock update if no batch specified
        await productService.updateStock(item.productId, item.quantity, "subtract")
      }
    }
  }
  
  this.salesOrders.push(newOrder)
  return { ...newOrder }
}

async update(id, orderData) {
  await this.delay()
  const index = this.salesOrders.findIndex(o => o.Id === parseInt(id))
  if (index === -1) {
    throw new Error("Sales order not found")
  }
  this.salesOrders[index] = { ...this.salesOrders[index], ...orderData }
  return { ...this.salesOrders[index] }
}

  async updateStatus(id, status) {
    await this.delay()
    const order = this.salesOrders.find(o => o.Id === parseInt(id))
    if (!order) {
      throw new Error("Sales order not found")
    }
    order.status = status
    return { ...order }
  }

  async getByCustomer(customerId) {
    await this.delay()
    return this.salesOrders.filter(o => o.customerId === parseInt(customerId))
  }

  async getByStatus(status) {
    await this.delay()
    return this.salesOrders.filter(o => o.status === status)
  }

  async getPending() {
    await this.delay()
    return this.salesOrders.filter(o => ['confirmed', 'in_progress'].includes(o.status))
  }
}

export default new SalesOrderService()
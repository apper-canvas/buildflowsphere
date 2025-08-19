import challansData from "@/services/mockData/deliveryChallans.json"

class ChallanService {
  constructor() {
    this.challans = [...challansData]
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll() {
    await this.delay()
    return [...this.challans].sort((a, b) => new Date(b.dispatchTime) - new Date(a.dispatchTime))
  }

  async getById(id) {
    await this.delay()
    const challan = this.challans.find(c => c.Id === parseInt(id))
    if (!challan) {
      throw new Error("Delivery challan not found")
    }
    return { ...challan }
  }

  async create(challanData) {
    await this.delay()
    const maxId = Math.max(...this.challans.map(c => c.Id), 0)
    const maxChallanNumber = Math.max(
      ...this.challans.map(c => parseInt(c.challanNumber.split('-').pop())), 
      0
    )
    
    const newChallan = {
      ...challanData,
      Id: maxId + 1,
      challanNumber: `DC-2024-${String(maxChallanNumber + 1).padStart(3, '0')}`,
      status: "dispatched",
      dispatchTime: new Date().toISOString(),
      eWayBillNumber: `EWB${Date.now()}`
    }
    
    this.challans.push(newChallan)
    return { ...newChallan }
  }

  async update(id, challanData) {
    await this.delay()
    const index = this.challans.findIndex(c => c.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Delivery challan not found")
    }
    this.challans[index] = { ...this.challans[index], ...challanData }
    return { ...this.challans[index] }
  }

  async updateStatus(id, status, deliveryData = {}) {
    await this.delay()
    const challan = this.challans.find(c => c.Id === parseInt(id))
    if (!challan) {
      throw new Error("Delivery challan not found")
    }
    
    challan.status = status
    if (status === "delivered") {
      challan.deliveredTime = new Date().toISOString()
      challan.receivedBy = deliveryData.receivedBy || "Customer"
    }
    
    return { ...challan }
  }

  async getByOrder(orderId) {
    await this.delay()
    return this.challans.filter(c => c.orderId === parseInt(orderId))
  }

  async getByStatus(status) {
    await this.delay()
    return this.challans.filter(c => c.status === status)
  }

  async getInTransit() {
    await this.delay()
    return this.challans.filter(c => ['dispatched', 'in_transit'].includes(c.status))
  }
}

export default new ChallanService()
import customersData from "@/services/mockData/customers.json"

class CustomerService {
  constructor() {
    this.customers = [...customersData]
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll() {
    await this.delay()
    return [...this.customers]
  }

  async getById(id) {
    await this.delay()
    const customer = this.customers.find(c => c.Id === parseInt(id))
    if (!customer) {
      throw new Error("Customer not found")
    }
    return { ...customer }
  }

  async create(customerData) {
    await this.delay()
    const maxId = Math.max(...this.customers.map(c => c.Id), 0)
    const newCustomer = {
      ...customerData,
      Id: maxId + 1,
      createdDate: new Date().toISOString().split('T')[0],
      status: "active",
      outstandingAmount: 0
    }
    this.customers.push(newCustomer)
    return { ...newCustomer }
  }

  async update(id, customerData) {
    await this.delay()
    const index = this.customers.findIndex(c => c.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Customer not found")
    }
    this.customers[index] = { ...this.customers[index], ...customerData }
    return { ...this.customers[index] }
  }

  async delete(id) {
    await this.delay()
    const index = this.customers.findIndex(c => c.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Customer not found")
    }
    this.customers.splice(index, 1)
    return true
  }

  async updateOutstanding(customerId, amount) {
    await this.delay()
    const customer = this.customers.find(c => c.Id === parseInt(customerId))
    if (customer) {
      customer.outstandingAmount = (customer.outstandingAmount || 0) + amount
    }
    return customer
  }
}

export default new CustomerService()
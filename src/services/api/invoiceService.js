import invoicesData from "@/services/mockData/invoices.json"

class InvoiceService {
  constructor() {
    this.invoices = [...invoicesData]
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll() {
    await this.delay()
    return [...this.invoices].sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
  }

  async getById(id) {
    await this.delay()
    const invoice = this.invoices.find(i => i.Id === parseInt(id))
    if (!invoice) {
      throw new Error("Invoice not found")
    }
    return { ...invoice }
  }

  async create(invoiceData) {
    await this.delay()
    const maxId = Math.max(...this.invoices.map(i => i.Id), 0)
    const maxInvoiceNumber = Math.max(
      ...this.invoices.map(i => parseInt(i.invoiceNumber.split('-').pop())), 
      0
    )
    
    const newInvoice = {
      ...invoiceData,
      Id: maxId + 1,
      invoiceNumber: `INV-2024-${String(maxInvoiceNumber + 1).padStart(3, '0')}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentStatus: "pending",
      paidAmount: 0
    }
    
    this.invoices.push(newInvoice)
    return { ...newInvoice }
  }

  async update(id, invoiceData) {
    await this.delay()
    const index = this.invoices.findIndex(i => i.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Invoice not found")
    }
    this.invoices[index] = { ...this.invoices[index], ...invoiceData }
    return { ...this.invoices[index] }
  }

  async recordPayment(id, paymentData) {
    await this.delay()
    const invoice = this.invoices.find(i => i.Id === parseInt(id))
    if (!invoice) {
      throw new Error("Invoice not found")
    }
    
    invoice.paidAmount = (invoice.paidAmount || 0) + paymentData.amount
    invoice.paymentMethod = paymentData.method
    invoice.paidDate = new Date().toISOString().split('T')[0]
    
    if (invoice.paidAmount >= invoice.grandTotal) {
      invoice.paymentStatus = "paid"
    } else {
      invoice.paymentStatus = "partial"
    }
    
    return { ...invoice }
  }

  async getByCustomer(customerId) {
    await this.delay()
    return this.invoices.filter(i => i.customerId === parseInt(customerId))
  }

  async getByStatus(status) {
    await this.delay()
    return this.invoices.filter(i => i.paymentStatus === status)
  }

  async getOverdue() {
    await this.delay()
    const today = new Date().toISOString().split('T')[0]
    return this.invoices.filter(i => 
      i.paymentStatus !== "paid" && 
      i.dueDate < today
    )
  }

  async getPending() {
    await this.delay()
    return this.invoices.filter(i => i.paymentStatus === "pending")
  }
}

export default new InvoiceService()
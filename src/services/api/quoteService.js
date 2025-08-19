import quotesData from "@/services/mockData/quotes.json"

class QuoteService {
  constructor() {
    this.quotes = [...quotesData]
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll() {
    await this.delay()
    return [...this.quotes].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
  }

  async getById(id) {
    await this.delay()
    const quote = this.quotes.find(q => q.Id === parseInt(id))
    if (!quote) {
      throw new Error("Quote not found")
    }
    return { ...quote }
  }

  async create(quoteData) {
    await this.delay()
    const maxId = Math.max(...this.quotes.map(q => q.Id), 0)
    const maxQuoteNumber = Math.max(
      ...this.quotes.map(q => parseInt(q.quoteNumber.split('-').pop())), 
      0
    )
    
    const newQuote = {
      ...quoteData,
      Id: maxId + 1,
      quoteNumber: `QT-2024-${String(maxQuoteNumber + 1).padStart(3, '0')}`,
      status: "pending",
      createdDate: new Date().toISOString().split('T')[0]
    }
    
    this.quotes.push(newQuote)
    return { ...newQuote }
  }

  async update(id, quoteData) {
    await this.delay()
    const index = this.quotes.findIndex(q => q.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Quote not found")
    }
    this.quotes[index] = { ...this.quotes[index], ...quoteData }
    return { ...this.quotes[index] }
  }

  async delete(id) {
    await this.delay()
    const index = this.quotes.findIndex(q => q.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Quote not found")
    }
    this.quotes.splice(index, 1)
    return true
  }

  async convertToOrder(id) {
    await this.delay()
    const quote = this.quotes.find(q => q.Id === parseInt(id))
    if (!quote) {
      throw new Error("Quote not found")
    }
    if (quote.status !== "approved") {
      throw new Error("Only approved quotes can be converted to orders")
    }
    
    quote.status = "converted"
    return { ...quote }
  }

  async getByCustomer(customerId) {
    await this.delay()
    return this.quotes.filter(q => q.customerId === parseInt(customerId))
  }

  async getByStatus(status) {
    await this.delay()
    return this.quotes.filter(q => q.status === status)
  }
}

export default new QuoteService()
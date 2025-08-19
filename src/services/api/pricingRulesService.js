import pricingRulesData from '@/services/mockData/pricingRules.json'

class PricingRulesService {
  constructor() {
    this.pricingRules = [...pricingRulesData]
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getAll() {
    await this.delay()
    return [...this.pricingRules]
  }

  async getById(id) {
    await this.delay()
    const rule = this.pricingRules.find(r => r.Id === parseInt(id))
    if (!rule) {
      throw new Error("Pricing rule not found")
    }
    return { ...rule }
  }

  async create(ruleData) {
    await this.delay()
    const maxId = Math.max(...this.pricingRules.map(r => r.Id), 0)
    
    const newRule = {
      ...ruleData,
      Id: maxId + 1,
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    }
    
    this.pricingRules.push(newRule)
    return { ...newRule }
  }

  async update(id, ruleData) {
    await this.delay()
    const index = this.pricingRules.findIndex(r => r.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Pricing rule not found")
    }
    
    this.pricingRules[index] = {
      ...this.pricingRules[index],
      ...ruleData,
      Id: parseInt(id),
      lastModified: new Date().toISOString().split('T')[0]
    }
    
    return { ...this.pricingRules[index] }
  }

  async delete(id) {
    await this.delay()
    const index = this.pricingRules.findIndex(r => r.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Pricing rule not found")
    }
    
    this.pricingRules.splice(index, 1)
    return true
  }

  async getByProduct(productId) {
    await this.delay()
    return this.pricingRules.filter(r => 
      r.applicableProducts.includes(parseInt(productId)) || 
      r.ruleType === 'global'
    )
  }

  async getByCustomer(customerId) {
    await this.delay()
    return this.pricingRules.filter(r => 
      r.applicableCustomers.includes(parseInt(customerId)) ||
      r.ruleType === 'global'
    )
  }

  async getActiveRules() {
    await this.delay()
    const now = new Date()
    return this.pricingRules.filter(r => {
      if (!r.isActive) return false
      if (r.validFrom && new Date(r.validFrom) > now) return false
      if (r.validUntil && new Date(r.validUntil) < now) return false
      return true
    })
  }

  async calculateOptimalPrice(productId, customerId, quantity, basePrice) {
    await this.delay()
    
    const applicableRules = await this.getActiveRules()
    const productRules = applicableRules.filter(r => 
      r.applicableProducts.includes(parseInt(productId)) || 
      r.ruleType === 'global'
    )
    const customerRules = productRules.filter(r => 
      r.applicableCustomers.includes(parseInt(customerId)) ||
      r.customerTiers.length === 0 ||
      r.ruleType === 'global'
    )

    let finalPrice = basePrice
    let appliedDiscounts = []

    // Apply volume discounts
    const volumeRules = customerRules.filter(r => r.discountType === 'volume')
    for (const rule of volumeRules) {
      for (const bracket of rule.volumeBrackets) {
        if (quantity >= bracket.minQuantity && 
            (bracket.maxQuantity === null || quantity <= bracket.maxQuantity)) {
          const discountAmount = bracket.discountType === 'percentage' 
            ? (finalPrice * bracket.discountValue / 100)
            : bracket.discountValue
          
          finalPrice -= discountAmount
          appliedDiscounts.push({
            ruleId: rule.Id,
            ruleName: rule.name,
            type: 'volume',
            discount: discountAmount,
            description: `${bracket.discountValue}${bracket.discountType === 'percentage' ? '%' : ' ₹'} off for ${bracket.minQuantity}+ units`
          })
          break
        }
      }
    }

    // Apply customer-specific discounts
    const customerSpecificRules = customerRules.filter(r => 
      r.discountType === 'customer_specific'
    )
    for (const rule of customerSpecificRules) {
      const discountAmount = rule.discountValue.type === 'percentage' 
        ? (finalPrice * rule.discountValue.value / 100)
        : rule.discountValue.value
      
      finalPrice -= discountAmount
      appliedDiscounts.push({
        ruleId: rule.Id,
        ruleName: rule.name,
        type: 'customer_specific',
        discount: discountAmount,
        description: `Customer-specific discount: ${rule.discountValue.value}${rule.discountValue.type === 'percentage' ? '%' : ' ₹'}`
      })
    }

    // Apply promotional discounts
    const promoRules = customerRules.filter(r => r.discountType === 'promotional')
    for (const rule of promoRules) {
      if (quantity >= (rule.minQuantity || 0)) {
        const discountAmount = rule.discountValue.type === 'percentage' 
          ? (finalPrice * rule.discountValue.value / 100)
          : rule.discountValue.value
        
        finalPrice -= discountAmount
        appliedDiscounts.push({
          ruleId: rule.Id,
          ruleName: rule.name,
          type: 'promotional',
          discount: discountAmount,
          description: rule.description || `Promotional discount: ${rule.discountValue.value}${rule.discountValue.type === 'percentage' ? '%' : ' ₹'}`
        })
      }
    }

    return {
      originalPrice: basePrice,
      finalPrice: Math.max(0, finalPrice),
      totalDiscount: basePrice - finalPrice,
      appliedDiscounts,
      savings: ((basePrice - finalPrice) / basePrice * 100).toFixed(1)
    }
  }

  async getVolumeBreakpoints(productId, customerId) {
    await this.delay()
    const rules = await this.getActiveRules()
    const applicableRules = rules.filter(r => 
      (r.applicableProducts.includes(parseInt(productId)) || r.ruleType === 'global') &&
      (r.applicableCustomers.includes(parseInt(customerId)) || r.customerTiers.length === 0) &&
      r.discountType === 'volume'
    )

    const breakpoints = []
    for (const rule of applicableRules) {
      for (const bracket of rule.volumeBrackets) {
        breakpoints.push({
          quantity: bracket.minQuantity,
          discount: bracket.discountValue,
          discountType: bracket.discountType,
          description: `${bracket.discountValue}${bracket.discountType === 'percentage' ? '%' : ' ₹'} off for ${bracket.minQuantity}+ units`
        })
      }
    }

    return breakpoints.sort((a, b) => a.quantity - b.quantity)
  }

  async validatePricingRule(ruleData) {
    await this.delay()
    const errors = []

    if (!ruleData.name || ruleData.name.trim().length === 0) {
      errors.push("Rule name is required")
    }

    if (!ruleData.discountType) {
      errors.push("Discount type is required")
    }

    if (ruleData.discountType === 'volume' && (!ruleData.volumeBrackets || ruleData.volumeBrackets.length === 0)) {
      errors.push("Volume brackets are required for volume discount rules")
    }

    if (ruleData.validFrom && ruleData.validUntil) {
      if (new Date(ruleData.validFrom) >= new Date(ruleData.validUntil)) {
        errors.push("Valid from date must be before valid until date")
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

const pricingRulesService = new PricingRulesService()
export default pricingRulesService
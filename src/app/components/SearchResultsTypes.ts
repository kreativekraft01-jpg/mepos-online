export interface BoxResult {
  id: string
  name: string
  category: string
  boxId: string
  stockLevel: number
  sellPrice: number
  buyPrice: number
  exchangePrice: number
  requiresSerial: boolean
  status: 'active' | 'discontinued' | 'deleted'
}

export interface CustomerResult {
  id: string
  name: string
  email: string
  phone: string
  loyaltyPoints: number
}

export interface OrderResult {
  id: string
  orderNumber: string
  customer: string
  date: string
  total: number
  type: 'sell' | 'buy' | 'exchange'
}

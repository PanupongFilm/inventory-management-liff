'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Modal } from '@/app/components/ui/modal'
import {
  ShoppingCart,
  Package,
  DollarSign,
  Truck,
  MessageSquare,
  Loader2,
  Check,
  AlertCircle,
  Search,
  Banknote,
  ScanQrCode,
  HeartHandshake,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  stock_quantity: number
  selling_price: number
  promotion_price?: number | null
  promotion_quantity: number
}

interface OrderFormData {
  productId: string
  quantity: number
  paymentMethod: 'CASH' | 'SCAN' | 'THAI_HELP'
  isDelivery: boolean
  note?: string
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'เงินสด', icon: Banknote },
  { value: 'SCAN', label: 'สแกนจ่าย', icon: ScanQrCode },
  { value: 'THAI_HELP', label: 'ไทยช่วยไทย', icon: HeartHandshake },
]

export default function OrderForm() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successOrderData, setSuccessOrderData] = useState<{ productName: string; quantity: number; totalAmount: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState<OrderFormData>({
    productId: '',
    quantity: 1,
    paymentMethod: 'CASH',
    isDelivery: false,
    note: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/product')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (err) {
      setError('ไม่สามารถโหลดสินค้า')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === formData.productId)
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calculateTotalAmount = () => {
    if (!selectedProduct) return 0
    
    let totalAmount = 0
    if (selectedProduct.promotion_quantity !== 0 && selectedProduct.promotion_price) {
      // formData.quantity คือจำนวนแพ็ค
      const promotionCheck = formData.quantity % selectedProduct.promotion_quantity
      if (promotionCheck === 0) {
        totalAmount = selectedProduct.promotion_price * (formData.quantity / selectedProduct.promotion_quantity)
      } else {
        const withoutPromotionAmount = promotionCheck * selectedProduct.selling_price
        const promotionAmount = ((formData.quantity - promotionCheck) / selectedProduct.promotion_quantity) * selectedProduct.promotion_price
        totalAmount = withoutPromotionAmount + promotionAmount
      }
    } else {
      totalAmount = formData.quantity * selectedProduct.selling_price
    }
    return totalAmount
  }

  const totalAmount = calculateTotalAmount()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productId || formData.quantity < 1) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload: any = {
        productID: formData.productId,
        quantity: formData.quantity,
        payment_method: formData.paymentMethod,
        isDelivery: formData.isDelivery ?? false,
      }

      // Only include note if it has a value
      if (formData.note && formData.note.trim()) {
        payload.note = formData.note.trim()
      }

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to create order')
      }

      // Show success modal
      setSuccessOrderData({
        productName: selectedProduct?.name || '',
        quantity: formData.quantity,
        totalAmount,
      })
      setShowSuccessModal(true)

      // Reset form after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
        router.push('/order')
        setFormData({
          productId: '',
          quantity: 1,
          paymentMethod: 'CASH',
          isDelivery: false,
          note: '',
        })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-8 pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <ShoppingCart className="w-6 sm:w-8 h-6 sm:h-8 text-green-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">สร้างออร์เดอร์ใหม่</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">กรอกข้อมูลเพื่อสร้างออร์เดอร์</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-900 font-medium">เกิดข้อผิดพลาด</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Selection */}
          <Card className="border-green-200 overflow-hidden">
            <CardHeader className="bg-white/0 border-b border-green-200 pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                <CardTitle className="text-gray-900">เลือกสินค้า</CardTitle>
              </div>
              <CardDescription className="text-gray-600">ค้นหาและเลือกสินค้าที่ต้องการสั่งซื้อ</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, productId: product.id, quantity: 1 }))
                        setSearchTerm('')
                      }}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        formData.productId === product.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-sm sm:text-base text-gray-900">{product.name}</p>
                        {formData.productId === product.id && (
                          <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ราคา:</span>
                          <div className="font-medium text-gray-900">
                            {product.promotion_quantity > 0 && product.promotion_price ? (
                              <div className="text-right space-y-0.5">
                                <div className="text-sm text-gray-500">฿{product.selling_price.toLocaleString()}/แพ็ค</div>
                                <div className="text-green-600 font-bold">
                                  {product.promotion_quantity} แพ็ค {product.promotion_price.toLocaleString()} บาท
                                </div>
                              </div>
                            ) : (
                              <span>฿{product.selling_price.toLocaleString()}/แพ็ค</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">คงเหลือ:</span>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="font-medium text-gray-900">{product.stock_quantity} แพ็ค</span>
                            {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">ใกล้หมด</Badge>
                            )}
                            {product.stock_quantity === 0 && (
                              <Badge className="bg-red-100 text-red-800 text-xs">หมด</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm col-span-full text-center py-8">
                    ไม่พบสินค้า
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Product Details */}
          {selectedProduct && (
            <Card className="border-green-200 bg-white shadow-md">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600">สินค้าที่เลือก</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                    </div>
                    <Badge className="bg-green-600 text-white text-sm">{selectedProduct.stock_quantity} แพ็ค</Badge>
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">จำนวนแพ็ค</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            quantity: Math.max(1, prev.quantity - 1),
                          }))
                        }
                        className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-medium text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.stock_quantity}
                        value={formData.quantity}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            quantity: Math.min(
                              selectedProduct.stock_quantity,
                              Math.max(1, parseInt(e.target.value) || 1)
                            ),
                          }))
                        }
                        className="w-16 sm:w-20 h-8 sm:h-10 border border-gray-300 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            quantity: Math.min(
                              selectedProduct.stock_quantity,
                              prev.quantity + 1
                            ),
                          }))
                        }
                        className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-medium text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="pt-4 border-t border-green-200 space-y-3 bg-green-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">ราคาต่อแพ็ค:</span>
                      <span className="font-semibold text-gray-900 text-lg">
                        ฿{selectedProduct.selling_price.toLocaleString()}
                      </span>
                    </div>
                    {selectedProduct.promotion_quantity > 0 && selectedProduct.promotion_price && (
                      <div className="flex justify-between items-center text-sm bg-white p-2 rounded border border-green-200">
                        <span className="text-green-700 font-semibold">ราคาพิเศษ:</span>
                        <span className="text-green-600 font-semibold">{selectedProduct.promotion_quantity} แพ็ค {selectedProduct.promotion_price.toLocaleString()} บาท</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="font-bold text-gray-900 text-lg">รวมทั้งสิ้น:</span>
                      <span className="font-bold text-green-600 text-xl">
                        ฿{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="border-green-200">
            <CardHeader className="bg-white/0 border-b border-green-200 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <CardTitle className="text-gray-900">วิธีการชำระเงิน</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({ ...prev, paymentMethod: method.value as any }))
                    }
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium flex flex-col items-center gap-1 ${
                      formData.paymentMethod === method.value
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : 'border-gray-200 text-gray-700 hover:border-green-300'
                    }`}
                  >
                    <method.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <div className="line-clamp-2 text-center">{method.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Note */}
          <Card className="border-green-200">
            <CardHeader className="bg-white/0 border-b border-green-200 pb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                <CardTitle className="text-gray-900">การจัดส่ง</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDelivery}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, isDelivery: e.target.checked }))
                  }
                  className="w-4 h-4 accent-green-600 cursor-pointer"
                />
                <span className="font-medium text-gray-700">ต้องการให้จัดส่ง</span>
              </label>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  หมายเหตุ (ไม่บังคับ)
                </label>
                <textarea
                  value={formData.note}
                  onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="เพิ่มหมายเหตุเกี่ยวกับออร์เดอร์นี้..."
                  className="w-full h-20 sm:h-24 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-4 sticky bottom-0 bg-white pb-4 -mx-3 sm:-mx-4 md:-mx-8 px-3 sm:px-4 md:px-8">
            <Button
              type="submit"
              disabled={submitting || !formData.productId}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm sm:text-base"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>กำลังสร้าง...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                  <span>สร้างออร์เดอร์</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} size="md">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">เพิ่มออร์เดอร์สำเร็จ!</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {successOrderData?.productName}
            </p>
          </div>
          <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">จำนวน:</span>
              <span className="font-semibold text-gray-900">{successOrderData?.quantity} แพ็ค</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-600">รวมทั้งสิ้น:</span>
              <span className="font-bold text-green-600 text-base">
                ฿{successOrderData?.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">กำลังเปลี่ยนหน้า...</p>
        </div>
      </Modal>
    </div>
  )
}

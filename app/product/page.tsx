'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Modal } from '@/app/components/ui/modal'
import ProductForm from '@/app/components/product-form'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Package,
  DollarSign,
  Tag,
  Zap,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  promotion_quantity: number
  promotion_price: number | null
  isActive: boolean
}

interface FormData {
  name: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  promotion_quantity: number
  promotion_price: number | null
}

const initialFormData: FormData = {
  name: '',
  purchase_price: 0,
  selling_price: 0,
  stock_quantity: 0,
  promotion_quantity: 0,
  promotion_price: null,
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setSelectedProduct(null)
    setFormData(initialFormData)
    setShowModal(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      promotion_quantity: product.promotion_quantity,
      promotion_price: product.promotion_price,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || formData.selling_price < 0) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Prepare data to send - exclude optional fields if they are undefined
      const dataToSend: any = {
        name: formData.name,
        purchase_price: formData.purchase_price,
        selling_price: formData.selling_price,
        stock_quantity: formData.stock_quantity || 0,
      }

      // Only include promotion fields if both are set
      if (
        formData.promotion_quantity !== undefined &&
        formData.promotion_quantity > 0 &&
        formData.promotion_price !== undefined &&
        formData.promotion_price !== null &&
        formData.promotion_price > 0
      ) {
        dataToSend.promotion_quantity = formData.promotion_quantity
        dataToSend.promotion_price = formData.promotion_price
      }

      let url = '/api/product'
      if (modalMode === 'edit' && selectedProduct?.id) {
        url = `/api/product?id=${selectedProduct.id}`
      }

      const method = modalMode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to save product')
      }

      await fetchProducts()
      setShowModal(false)
      setFormData(initialFormData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    try {
      setDeleting(true)
      setError(null)
      const response = await fetch(`/api/product?id=${productToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to delete product')
      }

      await fetchProducts()
      setShowDeleteModal(false)
      setProductToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      setTogglingId(product.id)
      setError(null)
      const response = await fetch(`/api/product?id=${product.id}`, {
        method: 'PUT',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to toggle product')
      }

      await fetchProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      console.error(err)
    } finally {
      setTogglingId(null)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-8 pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">จัดการสินค้า</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">เพิ่ม แก้ไข และลบสินค้าในระบบ</p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">เพิ่มสินค้า</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        </div>

        {/* Error Alert */}
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

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Active Products Section */}
        {filteredProducts.filter(p => p.isActive).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">สินค้าที่วางขายอยู่</h2>
              <span className="ml-auto text-sm text-gray-500">
                ({filteredProducts.filter(p => p.isActive).length})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProducts.filter(p => p.isActive).map(product => (
                <Card key={product.id} className="border-green-200 hover:shadow-lg transition-all overflow-hidden flex flex-col bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base text-gray-900 truncate">{product.name}</CardTitle>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs font-semibold flex-shrink-0 whitespace-nowrap">
                        คงเหลือ {product.stock_quantity}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-2 flex-1 flex flex-col">
                    {/* Price Info */}
                    <div className="space-y-1 pb-2 border-b border-gray-100">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">ต้นทุน:</span>
                        <span className="font-semibold text-gray-900">
                          ฿{product.purchase_price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">ขาย:</span>
                        <span className="font-semibold text-green-600">
                          ฿{product.selling_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Promotion Info */}
                    {product.promotion_quantity > 0 && product.promotion_price && (
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                        <div className="text-xs font-bold text-blue-900">
                          {product.promotion_quantity} แพ็ค {product.promotion_price.toLocaleString()} บาท
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button
                        onClick={() => handleOpenEditModal(product)}
                        variant="outline"
                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50 flex items-center justify-center gap-1 text-xs sm:text-sm py-2"
                      >
                        <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">แก้ไข</span>
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(product)}
                        disabled={togglingId === product.id}
                        className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 flex items-center justify-center gap-2 text-xs sm:text-sm py-2 font-semibold"
                      >
                        {togglingId === product.id ? (
                          <>
                            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                            <span>กำลัง...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            <span>เปิดใช้งาน</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Products Section */}
        {filteredProducts.filter(p => !p.isActive).length > 0 && (
          <div className="space-y-4 pt-6 border-t-2 border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-600">สินค้าที่เลิกขายแล้ว</h2>
              <span className="ml-auto text-sm text-gray-500">
                ({filteredProducts.filter(p => !p.isActive).length})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 opacity-60">
              {filteredProducts.filter(p => !p.isActive).map(product => (
                <Card key={product.id} className="border-gray-200 hover:shadow-lg transition-all overflow-hidden flex flex-col bg-gray-50">
                  <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-100 border-b border-gray-200 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base text-gray-600 truncate line-through">{product.name}</CardTitle>
                      </div>
                      <Badge className="bg-gray-300 text-gray-700 text-xs font-semibold flex-shrink-0 whitespace-nowrap">
                        คงเหลือ {product.stock_quantity}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-2 flex-1 flex flex-col">
                    {/* Price Info */}
                    <div className="space-y-1 pb-2 border-b border-gray-200">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">ต้นทุน:</span>
                        <span className="font-semibold text-gray-600">
                          ฿{product.purchase_price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">ขาย:</span>
                        <span className="font-semibold text-gray-600">
                          ฿{product.selling_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button
                        onClick={() => handleOpenEditModal(product)}
                        variant="outline"
                        className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1 text-xs sm:text-sm py-2"
                      >
                        <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">แก้ไข</span>
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(product)}
                        disabled={togglingId === product.id}
                        className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 flex items-center justify-center gap-2 text-xs sm:text-sm py-2 font-semibold"
                      >
                        {togglingId === product.id ? (
                          <>
                            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                            <span>กำลัง...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                            <span>ปิดใช้งาน</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Products */}
        {filteredProducts.length === 0 && (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">
                {searchTerm ? 'ไม่พบสินค้า' : 'ยังไม่มีสินค้า'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}
        size="md"
      >
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">ลบสินค้า?</h3>
              <p className="text-sm text-gray-600 mt-1">
                คุณกำลังจะลบสินค้า <span className="font-semibold text-gray-900">"{productToDelete?.name}"</span> นี้ออกจากระบบ
              </p>
              <p className="text-xs text-red-600 font-semibold mt-2">
                ⚠️ การกระทำนี้ไม่สามารถยกเลิกได้
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">กำลังลบ...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>ลบ</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

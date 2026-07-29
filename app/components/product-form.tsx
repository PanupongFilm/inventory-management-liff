'use client'

import { Button } from '@/app/components/ui/button'
import { Loader2, X } from 'lucide-react'

interface FormData {
  name: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  promotion_quantity: number
  promotion_price: number | null
}

interface ProductFormProps {
  formData: FormData
  setFormData: (data: FormData) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  onCancel: () => void
}

export default function ProductForm({
  formData,
  setFormData,
  onSubmit,
  submitting,
  onCancel,
}: ProductFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numericFields = ['purchase_price', 'selling_price', 'stock_quantity', 'promotion_quantity', 'promotion_price']
    
    let newValue: any = value === '' ? 0 : parseFloat(value)
    
    // Convert 0 to undefined for optional promotion fields
    if ((name === 'promotion_quantity' || name === 'promotion_price') && newValue === 0) {
      newValue = undefined
    }
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? newValue : value,
    })
  }

  const profit = formData.selling_price - formData.purchase_price
  const profitMargin = formData.purchase_price > 0 ? ((profit / formData.purchase_price) * 100).toFixed(1) : '0'

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Product Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ชื่อสินค้า <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="เช่น น้ำแพ็ค 350ml"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          required
        />
      </div>

      {/* Purchase Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ราคาต้นทุน (บาท) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
          <input
            type="number"
            name="purchase_price"
            value={formData.purchase_price || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            required
          />
        </div>
      </div>

      {/* Selling Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ราคาขาย (บาท) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
          <input
            type="number"
            name="selling_price"
            value={formData.selling_price || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            required
          />
        </div>
        {profit !== 0 && (
          <div className={`text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            กำไร: ฿{profit.toLocaleString()} ({profitMargin}%)
          </div>
        )}
      </div>

      {/* Stock Quantity */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          จำนวนคงเหลือ (แพ็ค) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="stock_quantity"
          value={formData.stock_quantity || ''}
          onChange={handleChange}
          placeholder="0"
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          required
        />
      </div>

      {/* Promotion Section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">ราคาพิเศษ (ไม่บังคับ)</h3>
        
        <div className="space-y-3">
          {/* Promotion Quantity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              แพ็คพิเศษ (เช่น 3 แพ็ค)
            </label>
            <input
              type="number"
              name="promotion_quantity"
              value={formData.promotion_quantity || ''}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Promotion Price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ราคาพิเศษทั้งหมด (เช่น 100 บาท)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
              <input
                type="number"
                name="promotion_price"
                value={formData.promotion_price || ''}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Promotion Preview */}
          {formData.promotion_quantity > 0 && formData.promotion_price && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900">
                ตัวอย่าง: {formData.promotion_quantity} แพ็ค ราคา ฿{formData.promotion_price.toLocaleString()}
              </p>
              {formData.promotion_quantity > 0 && (
                <p className="text-xs text-blue-700">
                  ราคาต่อแพ็ค: ฿{(formData.promotion_price / formData.promotion_quantity).toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <X className="w-4 h-4 mr-2" />
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={submitting || !formData.name || formData.selling_price < 0}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">กำลังบันทึก...</span>
            </>
          ) : (
            'บันทึก'
          )}
        </Button>
      </div>
    </form>
  )
}

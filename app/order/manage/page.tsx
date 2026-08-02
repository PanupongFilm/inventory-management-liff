'use client'

import { useState, useEffect } from 'react'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { Button } from '@/app/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Modal } from '@/app/components/ui/modal'
import { Calendar } from '@/app/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Separator } from '@/app/components/ui/separator'
import { cn } from '@/app/lib/utils'
import type { DateRange } from 'react-day-picker'
import {
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  ShoppingCart,
  CalendarIcon,
  Package,
  DollarSign,
  Truck,
  CreditCard,
  MessageSquare,
  Eye,
} from 'lucide-react'

interface OrderProduct {
  id: string
  name: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  promotion_quantity: number
  promotion_price: number | null
  createdAt: string
  updatedAt: string
}

interface Order {
  id: string
  productID: string
  quantity: number
  payment_method: 'CASH' | 'SCAN' | 'THAI_HELP'
  totalAmount: number
  createdAt: string
  isDelivery: boolean
  note: string | null
  product: OrderProduct
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'เงินสด',
  SCAN: 'สแกนจ่าย',
  THAI_HELP: 'ไทยช่วยไทย',
}

function DateRangePicker({
  date,
  onDateChange,
}: {
  date: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  const label = date?.from
    ? date?.to && date?.from !== date?.to
      ? `${format(date.from, 'd MMM yyyy')} — ${format(date.to, 'd MMM yyyy')}`
      : format(date.from, 'd MMM yyyy')
    : 'เลือกช่วงวันที่'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 w-full sm:w-auto justify-start gap-2.5 rounded-lg border-emerald-200 bg-white hover:bg-emerald-50 px-4",
            "font-medium text-foreground",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate text-sm">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-emerald-200 bg-white shadow-lg" align="start" side="bottom">
        <div className="p-4">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={1}
            className="rounded-lg"
          />
        </div>
        <Separator className="bg-emerald-100" />
        <div className="flex gap-2 p-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-emerald-200 hover:bg-emerald-50"
            onClick={() => {
              const now = new Date()
              onDateChange({ from: startOfMonth(now), to: endOfMonth(now) })
              setOpen(false)
            }}
          >
            เดือนนี้
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-emerald-200 hover:bg-emerald-50"
            onClick={() => {
              const now = new Date()
              onDateChange({ from: subDays(now, 6), to: now })
              setOpen(false)
            }}
          >
            7 วันล่าสุด
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setOpen(false)}
          >
            เสร็จสิ้น
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function OrderManagePage() {
  const now = new Date()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: now,
    to: now,
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/order')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setAllOrders(data.data || [])
    } catch (err) {
      setError('ไม่สามารถโหลดรายการสั่งซื้อ')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on date range
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      setOrders(allOrders)
      return
    }

    const startDate = startOfDay(dateRange.from)
    const endDate = endOfDay(dateRange.to)

    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })

    setOrders(filteredOrders)
  }, [dateRange, allOrders])

  const filteredOrders = orders.filter(order =>
    order.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDetailModal = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleOpenDeleteModal = (order: Order) => {
    setOrderToDelete(order)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return

    try {
      setDeleting(true)
      setError(null)
      const response = await fetch(`/api/order?id=${orderToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to delete order')
      }

      await fetchOrders()
      setShowDeleteModal(false)
      setOrderToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
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
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">จัดการออร์เดอร์</h1>
              <p className="text-sm sm:text-base text-gray-600">ดู แก้ไข และลบออร์เดอร์</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">จำนวนแพคทั้งหมด</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{orders.reduce((sum, order) => sum + order.quantity, 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">จำนวน Order</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Date Picker */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <label className="text-sm font-medium text-gray-700">ช่วงเวลาที่ดูข้อมูล:</label>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
          <p className="text-xs text-gray-600">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, 'd MMMM yyyy')} — ${format(dateRange.to, 'd MMMM yyyy')}`
              : 'กรุณาเลือกช่วงวันที่'}
          </p>
        </section>

        <Separator className="bg-gray-200" />

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
            placeholder="ค้นหาชื่อสินค้าหรือ ID ออร์เดอร์..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-700">สินค้า</th>
                  <th className="px-3 sm:px-4 py-3 text-center font-semibold text-gray-700">จำนวน</th>
                  <th className="px-3 sm:px-4 py-3 text-center font-semibold text-gray-700">ชำระเงิน</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-center font-semibold text-gray-700">จัดส่ง</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-semibold text-gray-700">ราคา</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-semibold text-gray-700">ดำเนินการ</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    {/* Product Name */}
                    <td className="px-3 sm:px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900 truncate">{order.product.name}</p>
                        <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <Badge className="bg-blue-100 text-blue-800 mx-auto">
                        {order.quantity} แพ็ค
                      </Badge>
                    </td>

                    {/* Payment Method */}
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <Badge
                        className={`mx-auto ${
                          order.payment_method === 'CASH'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_method === 'SCAN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[order.payment_method]}
                      </Badge>
                    </td>

                    {/* Delivery */}
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-center">
                      <span className="text-lg">{order.isDelivery ? '✅' : '❌'}</span>
                    </td>

                    {/* Amount */}
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <span className="font-bold text-green-600">฿{order.totalAmount.toLocaleString()}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleOpenDetailModal(order)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="รายละเอียด"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(order)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">
                {searchTerm ? 'ไม่พบออร์เดอร์' : 'ยังไม่มีออร์เดอร์'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="รายละเอียดออร์เดอร์"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">📦 สินค้า</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ชื่อ:</span>
                  <span className="font-semibold text-gray-900">{selectedOrder.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวน:</span>
                  <span className="font-semibold text-gray-900">{selectedOrder.quantity} แพ็ค</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ราคารวม:</span>
                  <span className="font-bold text-green-600">฿{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-3">📋 ข้อมูลออร์เดอร์</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ชำระเงิน:</span>
                  <span className="font-semibold text-gray-900">
                    {PAYMENT_METHOD_LABELS[selectedOrder.payment_method]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">จัดส่ง:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedOrder.isDelivery ? '✅ ใช่' : '❌ ไม่'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs text-gray-900 truncate">
                    {selectedOrder.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Note */}
            {selectedOrder.note && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-2">📝 หมายเหตุ</h3>
                <p className="text-sm text-amber-900">{selectedOrder.note}</p>
              </div>
            )}

            {/* Close Button */}
            <Button
              onClick={() => setShowDetailModal(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
            >
              ปิด
            </Button>
          </div>
        )}
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
              <h3 className="text-lg font-bold text-gray-900">ลบออร์เดอร์?</h3>
              <p className="text-sm text-gray-600 mt-1">
                คุณกำลังจะลบออร์เดอร์สินค้า <span className="font-semibold text-gray-900">"{orderToDelete?.product.name}"</span> นี้
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

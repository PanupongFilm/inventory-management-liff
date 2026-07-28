import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ✅ Health check - ตรวจสอบการเชื่อมต่อ DB ตอน startup
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1) // ไม่อนุญาติให้เปิด server
  }
}

// เรียกเมื่อ import ไฟล์นี้
if (typeof window === 'undefined') {
  // Server-side only
  checkDatabaseConnection().catch(() => {
    process.exit(1)
  })
}

export default prisma

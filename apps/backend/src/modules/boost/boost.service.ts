import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoostOrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBoostOrderDto } from './dto/create-boost-order.dto';

export const BOOST_PRODUCTS = [
  {
    id: 'listing',
    name: 'Listing',
    description: 'Get an ad slot for 30 days to post your listing.',
    price: 3000,
    group: 'Listings',
    recommended: false,
  },
  {
    id: 'hot-listing',
    name: 'Hot Listing',
    description:
      'Get an ad slot for 30 days and place your ad above normal listings.',
    price: 7800,
    group: 'Listings',
    recommended: false,
  },
  {
    id: 'super-hot-listing',
    name: 'Super Hot Listing',
    description:
      'Get an ad slot for 30 days and place your ad at the top of search results.',
    price: 21000,
    group: 'Listings',
    recommended: false,
  },
  {
    id: 'refresh-credits',
    name: 'Refresh Credits',
    description: 'Refresh a posted listing and bring it to the top again.',
    price: 240,
    group: 'Credits',
    recommended: false,
  },
  {
    id: 'story-ad-credits',
    name: 'Story Ad Credits',
    description: 'Get more exposure by posting your listing in the story.',
    price: 1000,
    group: 'Credits',
    recommended: false,
  },
  {
    id: 'photography-credits',
    name: 'Verified Photography Credits',
    description:
      'Upgrade your property’s visual appeal with a professional photoshoot service.',
    price: 3600,
    group: 'Credits',
    recommended: true,
  },
  {
    id: 'videography-credits',
    name: 'Verified Videography Credits',
    description:
      'Bring your property to life with our captivating videography service.',
    price: 12000,
    group: 'Credits',
    recommended: true,
  },
] as const;

const ORDER_SELECT = {
  id: true,
  status: true,
  subtotal: true,
  total: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      quantity: true,
      unitPrice: true,
      lineTotal: true,
    },
    orderBy: { productId: 'asc' as const },
  },
} satisfies Prisma.BoostOrderSelect;

@Injectable()
export class BoostService {
  constructor(private readonly prisma: PrismaService) {}

  getCatalog() {
    return { currency: 'PKR', items: BOOST_PRODUCTS };
  }

  async createOrder(
    userId: string,
    dto: CreateBoostOrderDto,
    idempotencyKey?: string,
  ) {
    if (
      idempotencyKey !== undefined &&
      (idempotencyKey.length === 0 ||
        idempotencyKey.length > 120 ||
        !/^[\w.:-]+$/.test(idempotencyKey))
    ) {
      throw new BadRequestException('Idempotency-Key is invalid');
    }

    const requestedItems = this.resolveItems(dto);
    const subtotal = requestedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    if (!Number.isSafeInteger(subtotal)) {
      throw new BadRequestException('Boost order total is invalid');
    }

    return this.prisma.$transaction(async (transaction) => {
      if (idempotencyKey) {
        const lockKey = `boost-order:${userId}:${idempotencyKey}`;
        await transaction.$queryRaw(
          Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
        );
        const existing = await transaction.boostOrder.findFirst({
          where: { userId, idempotencyKey },
          select: ORDER_SELECT,
        });
        if (existing) {
          const existingItems = existing.items
            .map(({ productId, quantity }) => `${productId}:${quantity}`)
            .sort();
          const requestItems = requestedItems
            .map(({ productId, quantity }) => `${productId}:${quantity}`)
            .sort();
          if (existingItems.join('|') !== requestItems.join('|')) {
            throw new BadRequestException(
              'Idempotency-Key was already used for a different boost order',
            );
          }
          return existing;
        }
      }

      return transaction.boostOrder.create({
        data: {
          userId,
          subtotal,
          total: subtotal,
          currency: 'PKR',
          idempotencyKey,
          status: BoostOrderStatus.PENDING_PAYMENT,
          items: {
            create: requestedItems,
          },
        },
        select: ORDER_SELECT,
      });
    });
  }

  async listOrders(userId: string) {
    return this.prisma.boostOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: ORDER_SELECT,
    });
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.boostOrder.findFirst({
      where: { id: orderId, userId },
      select: ORDER_SELECT,
    });
    if (!order) throw new NotFoundException('Boost order not found');
    return order;
  }

  private resolveItems(dto: CreateBoostOrderDto) {
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('At least one boost product is required');
    }
    if (dto.items.length > BOOST_PRODUCTS.length) {
      throw new BadRequestException('Too many boost products in one order');
    }

    const seenProductIds = new Set<string>();
    return dto.items.map((item) => {
      if (!item || typeof item.productId !== 'string') {
        throw new BadRequestException('Boost product is invalid');
      }
      if (seenProductIds.has(item.productId)) {
        throw new BadRequestException(
          'Each boost product can only appear once per order',
        );
      }
      seenProductIds.add(item.productId);
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {
        throw new BadRequestException(
          'Boost quantity must be between 1 and 20',
        );
      }

      const product = BOOST_PRODUCTS.find(
        (catalogItem) => catalogItem.id === item.productId,
      );
      if (!product) {
        throw new BadRequestException(
          `Unknown boost product: ${item.productId}`,
        );
      }
      const lineTotal = product.price * item.quantity;
      if (!Number.isSafeInteger(lineTotal)) {
        throw new BadRequestException('Boost order item total is invalid');
      }
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      };
    });
  }
}

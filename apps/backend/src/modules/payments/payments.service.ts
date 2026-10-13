import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AgreementStatus,
  BookingStatus,
  Payment,
  PaymentProviderType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import {
  PAYMENT_PROVIDER_ADAPTERS,
  PaymentProviderAdapter,
  ProviderVerificationResult,
  ProviderWebhookResult,
} from './providers/payment-provider.interface';

const ACTIVE_BOOKING_PAYMENT_STATUSES: BookingStatus[] = [
  BookingStatus.PAYMENT_PENDING,
  BookingStatus.HELD,
];

const FINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.SUCCESS,
  PaymentStatus.PAID,
  PaymentStatus.REFUNDED,
];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER_ADAPTERS)
    private readonly adapters: PaymentProviderAdapter[],
  ) {}

  async initiate(
    userId: string,
    dto: InitiatePaymentDto,
    idempotencyKey?: string,
  ) {
    const selectedLinkCount = [dto.bookingId, dto.agreementId].filter(
      Boolean,
    ).length;
    if (selectedLinkCount !== 1) {
      throw new BadRequestException(
        'Provide exactly one bookingId or agreementId',
      );
    }
    if (dto.agreementId && !dto.billingMonth) {
      throw new BadRequestException(
        'billingMonth is required for agreement rent payments',
      );
    }
    if (dto.bookingId && dto.billingMonth) {
      throw new BadRequestException(
        'billingMonth is only valid for agreement rent payments',
      );
    }
    if (dto.provider === PaymentProviderType.LEGACY) {
      throw new BadRequestException('LEGACY is not a payment provider');
    }
    if (
      idempotencyKey &&
      (idempotencyKey.length > 120 || !/^[\w.:-]+$/.test(idempotencyKey))
    ) {
      throw new BadRequestException('Idempotency-Key is invalid');
    }
    const adapter = this.getAdapter(dto.provider);

    const created = await this.prisma.$transaction(async (transaction) => {
      const lockKey = dto.bookingId
        ? `booking:${dto.bookingId}`
        : `agreement:${dto.agreementId}:${dto.billingMonth}`;
      await transaction.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
      );
      if (idempotencyKey) {
        const idempotencyLockKey = `idempotency:${userId}:${idempotencyKey}`;
        await transaction.$queryRaw(
          Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${idempotencyLockKey}))`,
        );
      }

      if (idempotencyKey) {
        const duplicate = await transaction.payment.findFirst({
          where: { userId, idempotencyKey },
        });
        if (duplicate) {
          const sameRequest =
            duplicate.provider === dto.provider &&
            duplicate.bookingId === (dto.bookingId ?? null) &&
            duplicate.agreementId === (dto.agreementId ?? null) &&
            (!dto.billingMonth ||
              duplicate.billingMonth?.toISOString().slice(0, 7) ===
                dto.billingMonth);
          if (!sameRequest) {
            throw new BadRequestException(
              'Idempotency-Key was already used for a different payment request',
            );
          }
          return { payment: duplicate, isNew: false };
        }
      }

      if (dto.bookingId) {
        const booking = await transaction.booking.findFirst({
          where: { id: dto.bookingId, tenantId: userId },
          select: {
            id: true,
            tenantId: true,
            totalAmount: true,
            currency: true,
            status: true,
            holdExpiresAt: true,
          },
        });
        if (!booking) throw new NotFoundException('Booking not found');
        if (!ACTIVE_BOOKING_PAYMENT_STATUSES.includes(booking.status)) {
          throw new BadRequestException(
            'Booking is not awaiting payment or has already been confirmed',
          );
        }
        if (booking.holdExpiresAt && booking.holdExpiresAt <= new Date()) {
          throw new BadRequestException('Booking payment hold has expired');
        }
        if (
          !Number.isSafeInteger(booking.totalAmount) ||
          booking.totalAmount <= 0
        ) {
          throw new BadRequestException('Booking amount is invalid');
        }

        const successfulPayment = await transaction.payment.findFirst({
          where: {
            bookingId: booking.id,
            status: { in: [PaymentStatus.SUCCESS, PaymentStatus.PAID] },
          },
        });
        if (successfulPayment) {
          throw new BadRequestException('Booking has already been paid');
        }
        const inProgressPayment = await transaction.payment.findFirst({
          where: {
            bookingId: booking.id,
            status: {
              in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (inProgressPayment) {
          if (inProgressPayment.provider !== dto.provider) {
            throw new BadRequestException(
              'A payment for this booking is already in progress with another provider',
            );
          }
          return { payment: inProgressPayment, isNew: false };
        }

        const payment = await transaction.payment.create({
          data: {
            userId,
            bookingId: booking.id,
            amount: booking.totalAmount,
            currency: booking.currency,
            provider: dto.provider,
            status: PaymentStatus.PENDING,
            idempotencyKey,
          },
        });
        return { payment, isNew: true };
      }

      const billingMonthInput = dto.billingMonth;
      if (!billingMonthInput) {
        throw new BadRequestException(
          'billingMonth is required for agreement rent payments',
        );
      }
      const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(billingMonthInput);
      if (!monthMatch) {
        throw new BadRequestException('billingMonth must use YYYY-MM format');
      }
      const billingMonth = new Date(
        Date.UTC(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1),
      );
      const agreement = await transaction.agreement.findFirst({
        where: { id: dto.agreementId, tenantId: userId },
        select: {
          id: true,
          tenantId: true,
          monthlyRent: true,
          paymentDueDay: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      });
      if (!agreement) throw new NotFoundException('Agreement not found');
      if (
        agreement.status !== AgreementStatus.ACTIVE ||
        (agreement.endDate && agreement.endDate <= new Date())
      ) {
        throw new BadRequestException(
          'Rent can only be paid for an active agreement',
        );
      }
      const monthStart = new Date(
        Date.UTC(
          agreement.startDate.getUTCFullYear(),
          agreement.startDate.getUTCMonth(),
          1,
        ),
      );
      const monthEnd = agreement.endDate
        ? new Date(
            Date.UTC(
              agreement.endDate.getUTCFullYear(),
              agreement.endDate.getUTCMonth(),
              1,
            ),
          )
        : null;
      if (billingMonth < monthStart || (monthEnd && billingMonth > monthEnd)) {
        throw new BadRequestException(
          'billingMonth must fall within the agreement dates',
        );
      }
      if (
        !Number.isSafeInteger(agreement.monthlyRent) ||
        agreement.monthlyRent <= 0
      ) {
        throw new BadRequestException('Agreement rent amount is invalid');
      }

      const successfulPayment = await transaction.payment.findFirst({
        where: {
          agreementId: agreement.id,
          billingMonth,
          status: { in: [PaymentStatus.SUCCESS, PaymentStatus.PAID] },
        },
      });
      if (successfulPayment) {
        throw new BadRequestException(
          'Rent for this billing month has already been paid',
        );
      }
      const inProgressPayment = await transaction.payment.findFirst({
        where: {
          agreementId: agreement.id,
          billingMonth,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (inProgressPayment) {
        if (inProgressPayment.provider !== dto.provider) {
          throw new BadRequestException(
            'A payment for this billing month is already in progress with another provider',
          );
        }
        return { payment: inProgressPayment, isNew: false };
      }
      const dueAt = new Date(
        Date.UTC(
          billingMonth.getUTCFullYear(),
          billingMonth.getUTCMonth(),
          agreement.paymentDueDay,
        ),
      );
      const payment = await transaction.payment.create({
        data: {
          userId,
          agreementId: agreement.id,
          amount: agreement.monthlyRent,
          currency: 'PKR',
          provider: dto.provider,
          billingMonth,
          dueAt,
          status: PaymentStatus.PENDING,
          idempotencyKey,
        },
      });
      return { payment, isNew: true };
    });

    if (!created.isNew) {
      if (created.payment.userId !== userId) {
        throw new ForbiddenException('Payment belongs to another user');
      }
      return {
        payment: this.sanitizePayment(created.payment),
        alreadyExists: true,
      };
    }

    const initiation = await adapter.initiate(created.payment);
    if (
      initiation.status !== PaymentStatus.PENDING &&
      initiation.status !== PaymentStatus.PROCESSING
    ) {
      throw new BadRequestException(
        'Payment provider returned an invalid initiation status',
      );
    }
    const payment = await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${created.payment.id}))`,
      );
      await transaction.payment.updateMany({
        where: {
          id: created.payment.id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        },
        data: {
          status: initiation.status,
          ...(initiation.transactionId && {
            transactionId: initiation.transactionId,
          }),
        },
      });
      return transaction.payment.findUniqueOrThrow({
        where: { id: created.payment.id },
      });
    });
    return {
      payment: this.sanitizePayment(payment),
      redirectUrl: initiation.redirectUrl,
      alreadyExists: false,
    };
  }

  async verify(paymentId: string, userId: string) {
    const payment = await this.getAccessiblePayment(paymentId, userId);
    if (FINAL_PAYMENT_STATUSES.includes(payment.status)) {
      return this.sanitizePayment(payment);
    }
    const adapter = this.getAdapter(payment.provider);
    const verification = await adapter.verify(payment);
    const updated = await this.applyVerifiedResult(payment, verification);
    return this.sanitizePayment(updated);
  }

  async handleWebhook(
    provider: PaymentProviderType,
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const adapter = this.getAdapter(provider);
    const event = await adapter.verifyWebhook(payload, headers);
    if (!event.verified) {
      throw new UnauthorizedException('Provider webhook signature is invalid');
    }
    const payment = event.paymentId
      ? await this.prisma.payment.findFirst({
          where: { id: event.paymentId, provider },
        })
      : event.transactionId
        ? await this.prisma.payment.findFirst({
            where: { transactionId: event.transactionId, provider },
          })
        : null;
    if (!payment) throw new NotFoundException('Payment was not found');
    const updated = await this.applyVerifiedResult(payment, event, provider);
    return {
      payment: this.sanitizePayment(updated),
      duplicateSafe: true,
    };
  }

  async getById(id: string, userId: string) {
    return this.sanitizePayment(await this.getAccessiblePayment(id, userId));
  }

  async getMyPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        OR: [
          { userId },
          { agreement: { landlordId: userId } },
          {
            booking: {
              OR: [
                { property: { ownerId: userId } },
                { listing: { landlordId: userId } },
              ],
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: this.paymentInclude(),
    });
    return payments.map((payment) => this.sanitizePayment(payment));
  }

  async getAgreementPayments(agreementId: string, userId: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      select: { tenantId: true, landlordId: true },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId && agreement.landlordId !== userId) {
      throw new ForbiddenException('You cannot access these payments');
    }
    const payments = await this.prisma.payment.findMany({
      where: { agreementId },
      orderBy: [{ billingMonth: 'desc' }, { createdAt: 'desc' }],
      include: this.paymentInclude(),
    });
    return payments.map((payment) => this.sanitizePayment(payment));
  }

  async getReceipt(id: string, userId: string) {
    const payment = await this.getAccessiblePayment(id, userId);
    if (
      payment.status !== PaymentStatus.SUCCESS &&
      payment.status !== PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'A receipt is available only after verified payment success',
      );
    }
    return {
      receiptNumber: payment.transactionId ?? payment.id,
      paymentId: payment.id,
      userId: payment.userId,
      bookingId: payment.bookingId,
      agreementId: payment.agreementId,
      billingMonth: payment.billingMonth,
      dueAt: payment.dueAt,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      status: payment.status,
    };
  }

  async refund(id: string, userId: string) {
    const payment = await this.getAccessiblePayment(id, userId);
    if (payment.userId !== userId) {
      throw new ForbiddenException('Only the payer can request a refund');
    }
    if (
      payment.status !== PaymentStatus.SUCCESS &&
      payment.status !== PaymentStatus.PAID
    ) {
      throw new BadRequestException('Only successful payments can be refunded');
    }
    const adapter = this.getAdapter(payment.provider);
    if (!adapter.refund) {
      throw new NotImplementedException(
        'Refunds are not available for this payment provider',
      );
    }
    const result = await adapter.refund(
      payment,
      payment.amount,
      `rentra-refund:${payment.id}`,
    );
    if (!result.verified || result.status !== PaymentStatus.REFUNDED) {
      throw new BadRequestException('Provider did not verify the refund');
    }
    const refunded = await this.prisma.payment.updateMany({
      where: {
        id,
        status: { in: [PaymentStatus.SUCCESS, PaymentStatus.PAID] },
      },
      data: {
        status: PaymentStatus.REFUNDED,
        refundTransactionId: result.transactionId,
      },
    });
    if (refunded.count !== 1) {
      throw new BadRequestException('Payment was already refunded');
    }
    return this.sanitizePayment(
      await this.prisma.payment.findUniqueOrThrow({ where: { id } }),
    );
  }

  private async applyVerifiedResult(
    payment: Payment,
    result: ProviderVerificationResult | ProviderWebhookResult,
    provider?: PaymentProviderType,
  ) {
    if (!result.verified) {
      throw new UnauthorizedException(
        'Payment provider could not verify this transaction',
      );
    }
    if (
      result.status === PaymentStatus.SUCCESS &&
      result.paidAt &&
      Number.isNaN(result.paidAt.getTime())
    ) {
      throw new BadRequestException('Provider returned an invalid paidAt date');
    }
    if (FINAL_PAYMENT_STATUSES.includes(payment.status)) return payment;

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${payment.id}))`,
      );
      const current = await transaction.payment.findUnique({
        where: { id: payment.id },
      });
      if (!current) throw new NotFoundException('Payment not found');
      if (
        current.transactionId &&
        result.transactionId &&
        current.transactionId !== result.transactionId
      ) {
        throw new UnauthorizedException(
          'Provider transaction ID does not match this payment',
        );
      }
      if ('providerEventId' in result && provider) {
        const previousEvent = await transaction.paymentWebhookEvent.findUnique({
          where: {
            provider_eventId: {
              provider,
              eventId: result.providerEventId,
            },
          },
        });
        if (previousEvent) {
          if (previousEvent.paymentId !== current.id) {
            throw new UnauthorizedException(
              'Provider event was already used for another payment',
            );
          }
          return current;
        }
        await transaction.paymentWebhookEvent.create({
          data: {
            provider,
            eventId: result.providerEventId,
            paymentId: current.id,
          },
        });
      }
      if (FINAL_PAYMENT_STATUSES.includes(current.status)) return current;

      if (result.status === PaymentStatus.SUCCESS && current.bookingId) {
        const bookingConfirmation = await transaction.booking.updateMany({
          where: {
            id: current.bookingId,
            tenantId: current.userId,
            status: { in: ACTIVE_BOOKING_PAYMENT_STATUSES },
            OR: [
              { holdExpiresAt: null },
              { holdExpiresAt: { gt: new Date() } },
            ],
          },
          data: {
            status: BookingStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        });
        if (bookingConfirmation.count !== 1) {
          throw new BadRequestException(
            'Booking can no longer be confirmed; payment requires reconciliation',
          );
        }
      }

      const updated = await transaction.payment.update({
        where: { id: current.id },
        data: {
          status: result.status,
          ...(result.transactionId && {
            transactionId: result.transactionId,
          }),
          ...(result.status === PaymentStatus.SUCCESS && {
            paidAt: result.paidAt ?? new Date(),
          }),
        },
      });
      return updated;
    });
  }

  private async getAccessiblePayment(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: this.paymentInclude(),
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const isBookingOwner =
      payment.booking?.property?.ownerId === userId ||
      payment.booking?.listing?.landlordId === userId;
    if (
      payment.userId !== userId &&
      payment.agreement?.landlordId !== userId &&
      !isBookingOwner
    ) {
      throw new ForbiddenException('You cannot access this payment');
    }
    return payment;
  }

  private getAdapter(provider: PaymentProviderType) {
    const adapter = this.adapters.find(
      (candidate) => candidate.provider === provider,
    );
    if (!adapter) {
      throw new NotImplementedException(
        `The ${provider} payment provider is not configured`,
      );
    }
    return adapter;
  }

  private paymentInclude() {
    return {
      agreement: {
        select: { id: true, landlordId: true, listingId: true },
      },
      user: {
        select: { id: true, fullName: true, email: true },
      },
      booking: {
        select: {
          id: true,
          property: { select: { ownerId: true } },
          listing: { select: { landlordId: true } },
        },
      },
    } satisfies Prisma.PaymentInclude;
  }

  private sanitizePayment<T extends Payment>(payment: T) {
    const { idempotencyKey: internalIdempotencyKey, ...safePayment } = payment;
    void internalIdempotencyKey;
    return safePayment;
  }
}

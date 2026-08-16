import { BadRequestException } from '@nestjs/common';
import { QuoteStatus, WorkOrderStatus } from './enums';

const quoteTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT, QuoteStatus.APPROVED, QuoteStatus.REJECTED],
  [QuoteStatus.SENT]: [QuoteStatus.APPROVED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED],
  [QuoteStatus.APPROVED]: [],
  [QuoteStatus.REJECTED]: [],
  [QuoteStatus.EXPIRED]: [],
};

const workOrderTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.RECEIVED]: [WorkOrderStatus.DIAGNOSIS, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.DIAGNOSIS]: [WorkOrderStatus.WAITING_APPROVAL, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.WAITING_APPROVAL]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.READY, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.READY]: [WorkOrderStatus.DELIVERED, WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.DELIVERED]: [],
  [WorkOrderStatus.CANCELLED]: [],
};

export function assertQuoteTransition(current: QuoteStatus, next: QuoteStatus): void {
  if (current === next) return;
  if (!quoteTransitions[current].includes(next)) {
    throw new BadRequestException(`Invalid quote status transition: ${current} -> ${next}`);
  }
}

export function assertWorkOrderTransition(current: WorkOrderStatus, next: WorkOrderStatus): void {
  if (current === next) return;
  if (!workOrderTransitions[current].includes(next)) {
    throw new BadRequestException(`Invalid work order status transition: ${current} -> ${next}`);
  }
}

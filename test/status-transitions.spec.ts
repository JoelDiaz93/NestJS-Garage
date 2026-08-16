import { BadRequestException } from '@nestjs/common';
import { QuoteStatus, WorkOrderStatus } from '../src/common/enums';
import { assertQuoteTransition, assertWorkOrderTransition } from '../src/common/status-transitions';

describe('status transitions', () => {
  it('allows a quote to move from sent to approved', () => {
    expect(() => assertQuoteTransition(QuoteStatus.SENT, QuoteStatus.APPROVED)).not.toThrow();
  });

  it('blocks reopening an approved quote', () => {
    expect(() => assertQuoteTransition(QuoteStatus.APPROVED, QuoteStatus.DRAFT)).toThrow(BadRequestException);
  });

  it('allows a work order to progress through the workshop', () => {
    expect(() => assertWorkOrderTransition(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.READY)).not.toThrow();
  });

  it('blocks delivery directly from received', () => {
    expect(() => assertWorkOrderTransition(WorkOrderStatus.RECEIVED, WorkOrderStatus.DELIVERED)).toThrow(BadRequestException);
  });
});

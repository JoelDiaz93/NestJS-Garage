import { IsEnum } from 'class-validator'; import { QuoteStatus } from '../../common/enums'; export class UpdateQuoteStatusDto { @IsEnum(QuoteStatus) status:QuoteStatus; }

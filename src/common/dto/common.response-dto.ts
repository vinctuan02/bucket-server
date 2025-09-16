// src/common/dtos/response.dto.ts

import { HttpException } from '@nestjs/common';
import {
  ERROR_MESSAGE_CODE_DEFAULT,
  ERROR_MESSAGE_DEFAULT,
  ERROR_STATUS_CODE_DEFAULT,
  SUCCESS_MESSAGE_CODE_DEFAULT,
  SUCCESS_MESSAGE_DEFAULT,
  SUCCESS_STATUS_CODE_DEFAULT,
  WARNING_MESSAGE_DEFAULT,
} from '../const/common.const';

export class ResponseSuccess<T> {
  statusCode: number;
  message: string;
  messageCode: string;
  messageWarning: string;
  data?: T;

  constructor({
    statusCode = SUCCESS_STATUS_CODE_DEFAULT,
    message = SUCCESS_MESSAGE_DEFAULT,
    messageCode = SUCCESS_MESSAGE_CODE_DEFAULT,
    messageWarning = WARNING_MESSAGE_DEFAULT,
    data,
  }: {
    statusCode?: number;
    message?: string;
    messageCode?: string;
    messageWarning?: string;
    data?: T;
  } = {}) {
    this.statusCode = statusCode;
    this.message = message;
    this.messageCode = messageCode;
    this.messageWarning = messageWarning;
    this.data = data;
  }
}

export class Metadata {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;

  constructor({
    currentPage = 1,
    pageSize = 0,
    totalItems = 0,
  }: Partial<Metadata> = {}) {
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalItems = totalItems;
    this.totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;
  }
}

export class PageDto<T> {
  metadata: Metadata;
  items: T[];

  constructor({
    items,
    metadata,
  }: {
    items: T[];
    metadata?: Partial<Metadata>;
  }) {
    this.metadata = new Metadata({
      currentPage: metadata?.currentPage ?? 1,
      pageSize: metadata?.pageSize ?? items.length,
      totalItems: metadata?.totalItems ?? items.length,
    });

    this.items = items;
  }
}

export class ResponseError<T = any> extends HttpException {
  statusCode: number;
  message: string;
  messageCode: string;
  messageWarning: string;
  data?: T;

  constructor({
    statusCode = ERROR_STATUS_CODE_DEFAULT,
    message = ERROR_MESSAGE_DEFAULT,
    messageCode = ERROR_MESSAGE_CODE_DEFAULT,
    messageWarning,
    data,
  }: {
    statusCode?: number;
    message?: string;
    messageCode?: string;
    messageWarning?: string;
    data?: T;
  }) {
    const response = {
      statusCode,
      message,
      messageCode,
      messageWarning,
      data,
    };

    super(response, statusCode);

    // this.statusCode = statusCode;
    // this.message = message;
    // this.data = data;
  }
}

export class FieldErrorDetails {
  messageCode: string;
  message: string;
  page: string;
  field: string;

  constructor({
    messageCode = 'validation.input',
    message = 'Please enter information!',
    page = 'unknown',
    field = 'unknown',
  }: {
    messageCode?: string;
    message?: string;
    page?: string;
    field?: string;
  }) {
    this.messageCode = messageCode;
    this.message = message;
    this.page = page;
    this.field = field;
  }
}

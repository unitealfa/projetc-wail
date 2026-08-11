import { randomUUID } from 'node:crypto';

export function createProductCode(): string {
  return `PRD-${randomUUID()}`;
}

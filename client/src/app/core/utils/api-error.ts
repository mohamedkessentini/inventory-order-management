import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models';

export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const data = error.error as ApiErrorResponse | undefined;
    if (data?.fieldErrors?.length) {
      return data.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(', ');
    }
    if (data?.message) {
      return data.message;
    }
  }
  return 'Something went wrong. Please try again.';
}

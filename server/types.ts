export interface CreateTransactionRequest {
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
}

export interface SafePayTransaction {
  transactionId: string;
  checkoutUrl: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface OrderData {
  id?: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'refunded';
  safePayTransactionId: string;
  createdAt: Date;
}

export interface SafePayWebhookPayload {
  transaction_id: string;
  status: 'completed' | 'failed';
  signature: string;
  [key: string]: unknown;
}

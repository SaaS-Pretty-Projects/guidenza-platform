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

import admin from 'firebase-admin';

export interface OrderData {
  id?: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'refunded';
  safePayTransactionId: string;
  createdAt: admin.firestore.FieldValue | FirebaseFirestore.Timestamp;
}

export interface SafePayWebhookPayload {
  transaction_id: string;
  status: 'completed' | 'failed';
  signature: string;
  [key: string]: unknown;
}

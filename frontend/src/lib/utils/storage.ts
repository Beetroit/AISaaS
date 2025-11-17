// frontend/src/lib/utils/storage.ts

const PENDING_PURCHASE_KEY = 'pendingPurchase';

interface PendingPurchase {
  priceId: string;
  returnUrl: string;
}

export const savePendingPurchase = (priceId: string, returnUrl: string): void => {
  const data: PendingPurchase = { priceId, returnUrl };
  localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(data));
};

export const getPendingPurchase = (): PendingPurchase | null => {
  const data = localStorage.getItem(PENDING_PURCHASE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearPendingPurchase = (): void => {
  localStorage.removeItem(PENDING_PURCHASE_KEY);
};

const BUY_NOW_STORAGE_KEY = 'pendingBuyNowIntent';

// Save the latest Buy Now intent - last click wins
export const saveBuyNowIntent = (intent) => {
  if (!intent || !intent.productId || !intent.quantity) return;
  try {
    sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(intent));
  } catch (e) {
    console.error('Failed to save buy now intent', e);
  }
};

// Read without clearing
export const getBuyNowIntent = () => {
  try {
    const raw = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to read buy now intent', e);
    return null;
  }
};

// Read and clear in one step
export const consumeBuyNowIntent = () => {
  const intent = getBuyNowIntent();
  if (intent) {
    sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
  }
  return intent;
};

// Explicitly clear intent
export const clearBuyNowIntent = () => {
  sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
};



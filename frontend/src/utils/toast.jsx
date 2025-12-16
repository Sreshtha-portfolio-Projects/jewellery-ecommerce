import toast from 'react-hot-toast';

/**
 * Show success toast
 */
export const showSuccess = (message) => {
  toast.success(message);
};

/**
 * Show error toast
 */
export const showError = (message) => {
  toast.error(message);
};

/**
 * Show info toast
 */
export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

/**
 * Show loading toast
 */
export const showLoading = (message) => {
  return toast.loading(message);
};

/**
 * Show confirmation dialog using toast
 * Returns a promise that resolves to true if confirmed, false otherwise
 */
export const showConfirm = (message) => {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{message}</p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded text-white"
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: '300px',
        },
      }
    );
  });
};


import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

// Several flows (login, register, post review, logout) end in a
// full-page navigation, which would erase an in-memory toast. Stash the
// message in sessionStorage instead; the provider shows it on the next
// page load and clears it.
export const flashToast = (message, kind = 'success') => {
  sessionStorage.setItem('flash_toast', JSON.stringify({ message, kind }));
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('flash_toast');
    if (raw) {
      sessionStorage.removeItem('flash_toast');
      try {
        const { message, kind } = JSON.parse(raw);
        push(message, kind);
      } catch (e) {
        // A malformed flash value is not worth breaking the page over.
      }
    }
  }, [push]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast_stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast_item toast_${toast.kind}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

import { useState } from 'react';

export default function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: () => {}
  });

  const confirm = ({ 
    title = 'Confirm Action', 
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
  }) => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          resolve(true);
          setIsOpen(false);
        }
      });
      setIsOpen(true);
    });
  };

  const close = () => {
    setIsOpen(false);
  };

  return { isOpen, config, confirm, close };
}

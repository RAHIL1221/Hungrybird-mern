// Custom validation utility

export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getErrorMessage = (input) => {
  if (input.validity.valueMissing) {
    return `${input.placeholder || input.name || 'This field'} is required`;
  }
  if (input.validity.typeMismatch) {
    if (input.type === 'email') {
      return 'Please enter a valid email address';
    }
  }
  if (input.validity.patternMismatch) {
    if (input.type === 'tel' || input.name?.toLowerCase().includes('phone')) {
      return 'Please enter a valid 10-digit phone number';
    }
    return 'Please match the requested format';
  }
  if (input.validity.tooShort) {
    return `Please enter at least ${input.minLength} characters`;
  }
  if (input.validity.tooLong) {
    return `Please enter no more than ${input.maxLength} characters`;
  }
  return '';
};

const showError = (input, message) => {
  const formGroup = input.closest('.form-group');
  if (!formGroup) return;

  // Remove existing error
  const existingError = formGroup.querySelector('.error-message');
  if (existingError) existingError.remove();

  // Add error class to input
  input.classList.add('error');

  // Create and add error message
  if (message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
  }
};

const clearError = (input) => {
  const formGroup = input.closest('.form-group');
  if (!formGroup) return;

  input.classList.remove('error');
  const errorMessage = formGroup.querySelector('.error-message');
  if (errorMessage) errorMessage.remove();
};

export const setCustomValidity = (inputElement) => {
  if (!inputElement) return;

  // Validate on blur
  inputElement.addEventListener('blur', () => {
    if (!inputElement.validity.valid) {
      const message = getErrorMessage(inputElement);
      showError(inputElement, message);
    }
  });

  // Clear error on input
  inputElement.addEventListener('input', () => {
    clearError(inputElement);
    inputElement.setCustomValidity('');
  });

  // Prevent default validation tooltip
  inputElement.addEventListener('invalid', (e) => {
    e.preventDefault();
    const message = getErrorMessage(inputElement);
    showError(inputElement, message);
    inputElement.setCustomValidity(message);
  });
};

export const initFormValidation = (formElement) => {
  if (!formElement) return;

  const inputs = formElement.querySelectorAll('input, textarea, select');
  inputs.forEach(input => setCustomValidity(input));

  // Handle form submit
  formElement.addEventListener('submit', (e) => {
    let isValid = true;
    inputs.forEach(input => {
      if (!input.validity.valid) {
        isValid = false;
        const message = getErrorMessage(input);
        showError(input, message);
      }
    });

    if (!isValid) {
      e.preventDefault();
      // Focus first invalid input
      const firstInvalid = formElement.querySelector('.error');
      if (firstInvalid) firstInvalid.focus();
    }
  });
};

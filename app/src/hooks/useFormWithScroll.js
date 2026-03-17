import { useState, useCallback, useRef } from 'react';

export const useFormWithScroll = (initialState, validateFn) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
    
    // Real-time validation for the changed field
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const setFieldValue = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const scrollToFirstError = useCallback(() => {
    if (Object.keys(errors).length > 0 && formRef.current) {
      const firstErrorKey = Object.keys(errors)[0];
      const element = formRef.current.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus({ preventScroll: true });
      }
    }
  }, [errors]);

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();
    const validationErrors = validateFn(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      await onSubmit(formData);
    } else {
      // Find the first error field and scroll to it
      // We need to wait for the render cycle to update errors/DOM (though refs are immediate, the visual error state might need a tick)
      setTimeout(() => {
        const firstErrorKey = Object.keys(validationErrors)[0];
        const element = formRef.current?.querySelector(`[name="${firstErrorKey}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus({ preventScroll: true });
        }
      }, 100);
    }
  };

  const resetForm = (newState = initialState) => {
    setFormData(newState);
    setErrors({});
  };

  return {
    formData,
    errors,
    handleChange,
    setFieldValue,
    handleSubmit,
    resetForm,
    formRef
  };
};

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateLuhn, validateExpiryDate, validateCVV, validateCardName, capitalizeName, formatExpiryDate, formatCardNumber } from './validation';

describe('Validation Utils', () => {
  describe('Luhn Algorithm', () => {
    it('should validate correct card numbers', () => {
      expect(validateLuhn('4532715372433237')).toBe(true); // Example Visa
    });

    it('should reject incorrect card numbers', () => {
      expect(validateLuhn('4532715372433238')).toBe(false);
    });
  });

  describe('Expiry Date', () => {
    it('should validate future dates', () => {
      const futureYear = (new Date().getFullYear() % 100) + 1;
      expect(validateExpiryDate(`05/${futureYear}`)).toBe(true);
    });

    it('should reject past dates', () => {
      expect(validateExpiryDate('01/20')).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(validateExpiryDate('13/25')).toBe(false);
      expect(validateExpiryDate('00/25')).toBe(false);
      expect(validateExpiryDate('ab/cd')).toBe(false);
    });
  });

  describe('CVV', () => {
    it('should validate 3 or 4 digits', () => {
      expect(validateCVV('123')).toBe(true);
      expect(validateCVV('1234')).toBe(true);
    });

    it('should reject invalid lengths', () => {
      expect(validateCVV('12')).toBe(false);
      expect(validateCVV('12345')).toBe(false);
    });

    it('should reject non-numeric', () => {
      expect(validateCVV('12a')).toBe(false);
    });
  });

  describe('Card Name', () => {
    it('should validate valid names', () => {
      expect(validateCardName('John Doe')).toBe(true);
      expect(validateCardName('Maria Jose')).toBe(true);
    });

    it('should reject short names', () => {
      expect(validateCardName('John')).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(validateCardName('John123')).toBe(false);
      expect(validateCardName('John_Doe')).toBe(false);
    });
  });
});

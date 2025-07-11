/**
 * DSGVO-konformes Kontaktformular
 * Beate's Grill - Client-seitige Validierung und Datenverarbeitung
 */

class ContactForm {
  constructor(formSelector) {
    this.form = document.querySelector(formSelector);
    this.isSubmitting = false;
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.addEventListeners();
    this.setupValidation();
    this.loadFormData();
  }

  addEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time Validierung
    const inputs = this.form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });

    // Datenschutz-Checkbox Überwachung
    const privacyCheckbox = this.form.querySelector('#privacy-consent');
    if (privacyCheckbox) {
      privacyCheckbox.addEventListener('change', () => this.updateSubmitButton());
    }

    // Auto-Save für Formularfelder (nur mit Einwilligung)
    if (window.cookieConsent?.hasConsent('preferences')) {
      this.enableAutoSave();
    }

    // Cookie-Consent Änderungen überwachen
    window.addEventListener('cookieConsentChanged', (e) => {
      if (e.detail.preferences) {
        this.enableAutoSave();
      } else {
        this.disableAutoSave();
      }
    });
  }

  setupValidation() {
    // Custom Validierungsregeln
    this.validators = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZäöüÄÖÜß\s\-\.]+$/,
        message: 'Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen, nur Buchstaben, Leerzeichen, Bindestriche und Punkte)'
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
      },
      phone: {
        required: false,
        pattern: /^[\+]?[0-9\s\-\(\)\/]{7,20}$/,
        message: 'Bitte geben Sie eine gültige Telefonnummer ein'
      },
      message: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        message: 'Ihre Nachricht sollte zwischen 10 und 2000 Zeichen lang sein'
      },
      'privacy-consent': {
        required: true,
        message: 'Sie müssen der Datenschutzerklärung zustimmen'
      }
    };
  }

  validateField(field) {
    const fieldName = field.name || field.id;
    const validator = this.validators[fieldName];
    
    if (!validator) return true;

    const value = field.value.trim();
    const errors = [];

    // Required Check
    if (validator.required && !value) {
      errors.push(`${this.getFieldLabel(field)} ist ein Pflichtfeld`);
    }

    if (value) {
      // Length Checks
      if (validator.minLength && value.length < validator.minLength) {
        errors.push(`${this.getFieldLabel(field)} muss mindestens ${validator.minLength} Zeichen lang sein`);
      }

      if (validator.maxLength && value.length > validator.maxLength) {
        errors.push(`${this.getFieldLabel(field)} darf maximal ${validator.maxLength} Zeichen lang sein`);
      }

      // Pattern Check
      if (validator.pattern && !validator.pattern.test(value)) {
        errors.push(validator.message);
      }
    }

    // Special validation for checkbox
    if (field.type === 'checkbox' && validator.required && !field.checked) {
      errors.push(validator.message);
    }

    this.displayFieldErrors(field, errors);
    return errors.length === 0;
  }

  validateForm() {
    const fields = this.form.querySelectorAll('input[required], textarea[required], input[name], textarea[name]');
    let isValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  getFieldLabel(field) {
    const label = this.form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name;
  }

  displayFieldErrors(field, errors) {
    // Entferne vorherige Fehlermeldungen
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Entferne Error-Klasse
    field.classList.remove('field-invalid');

    if (errors.length > 0) {
      // Füge Error-Klasse hinzu
      field.classList.add('field-invalid');

      // Erstelle Fehlermeldung
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      errorElement.innerHTML = errors.map(error => `<span>${error}</span>`).join('');
      
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  }

  clearFieldError(field) {
    field.classList.remove('field-invalid');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  updateSubmitButton() {
    const submitButton = this.form.querySelector('button[type="submit"]');
    const privacyCheckbox = this.form.querySelector('#privacy-consent');
    
    if (submitButton) {
      submitButton.disabled = !privacyCheckbox?.checked;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;

    // Validierung
    if (!this.validateForm()) {
      this.showMessage('Bitte korrigieren Sie die Fehler im Formular.', 'error');
      return;
    }

    this.isSubmitting = true;
    const submitButton = this.form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
      // Button Status ändern
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner"></span> Wird gesendet...';

      // Formulardaten sammeln
      const formData = this.collectFormData();
      
      // DSGVO-Informationen hinzufügen
      formData.gdprInfo = {
        timestamp: new Date().toISOString(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent.substring(0, 200),
        consentGiven: true,
        dataRetentionPeriod: '2 Jahre gemäß DSGVO',
        processingPurpose: 'Bearbeitung der Kontaktanfrage'
      };

      // Lokale Speicherung (nur bei Einwilligung)
      if (window.cookieConsent?.hasConsent('preferences')) {
        this.saveFormDataLocally(formData);
      }

      // Formular senden (hier würde normalerweise ein Server-Request stattfinden)
      await this.submitForm(formData);

      // Erfolgsmeldung
      this.showMessage('Vielen Dank für Ihre Nachricht! Wir werden uns so bald wie möglich bei Ihnen melden.', 'success');
      
      // Formular zurücksetzen
      this.form.reset();
      this.clearFormData();

    } catch (error) {
      console.error('Form submission error:', error);
      this.showMessage('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an.', 'error');
    } finally {
      this.isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  collectFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Entferne Checkbox-Werte (werden separat behandelt)
    delete data['privacy-consent'];
    
    return data;
  }

  async getClientIP() {
    // In einer echten Anwendung würde dies server-seitig gemacht
    // Hier nur als Platzhalter für DSGVO-Dokumentation
    return 'Server-seitig ermittelt';
  }

  async submitForm(formData) {
    try {
      // CSRF Token generieren falls nicht vorhanden
      if (!formData.csrf_token) {
        formData.csrf_token = this.generateCSRFToken();
      }

      const response = await fetch('contact-handler.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return { success: true, messageId: this.generateMessageId() };
      } else {
        throw new Error(result.errors ? result.errors.join(', ') : 'Unknown error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  }

  generateMessageId() {
    return 'MSG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  generateCSRFToken() {
    // In einer echten Anwendung würde dies server-seitig gemacht
    // Hier generieren wir ein temporäres Token
    return 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }

  enableAutoSave() {
    if (this.autoSaveInterval) return;

    this.autoSaveInterval = setInterval(() => {
      this.saveFormDataLocally();
    }, 30000); // Alle 30 Sekunden speichern
  }

  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.clearFormData();
  }

  saveFormDataLocally(data = null) {
    if (!window.cookieConsent?.hasConsent('preferences')) return;

    if (!data) {
      data = {};
      const inputs = this.form.querySelectorAll('input:not([type="checkbox"]), textarea');
      inputs.forEach(input => {
        if (input.value.trim()) {
          data[input.name || input.id] = input.value;
        }
      });
    }

    localStorage.setItem('beate-grill-contact-draft', JSON.stringify({
      data: data,
      timestamp: new Date().toISOString()
    }));
  }

  loadFormData() {
    if (!window.cookieConsent?.hasConsent('preferences')) return;

    const saved = localStorage.getItem('beate-grill-contact-draft');
    if (!saved) return;

    try {
      const { data, timestamp } = JSON.parse(saved);
      
      // Nur laden wenn nicht älter als 24 Stunden
      const saveTime = new Date(timestamp);
      const now = new Date();
      if (now - saveTime > 24 * 60 * 60 * 1000) {
        this.clearFormData();
        return;
      }

      // Daten in Formular laden
      Object.keys(data).forEach(key => {
        const field = this.form.querySelector(`[name="${key}"], #${key}`);
        if (field && field.type !== 'checkbox') {
          field.value = data[key];
        }
      });

      // Benutzer über geladene Daten informieren
      this.showMessage('Ihre vorherigen Eingaben wurden wiederhergestellt.', 'info');

    } catch (error) {
      console.error('Error loading form data:', error);
      this.clearFormData();
    }
  }

  clearFormData() {
    localStorage.removeItem('beate-grill-contact-draft');
  }

  showMessage(message, type = 'info') {
    // Entferne vorherige Nachrichten
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `form-message form-message--${type}`;
    messageElement.innerHTML = `
      <div class="form-message-content">
        <span class="form-message-icon">${this.getMessageIcon(type)}</span>
        <span class="form-message-text">${message}</span>
      </div>
    `;

    // Nachricht vor dem Formular einfügen
    this.form.parentNode.insertBefore(messageElement, this.form);

    // Auto-Hide für Info/Success Nachrichten
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => messageElement.remove(), 300);
      }, 5000);
    }

    // Scroll zur Nachricht
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  getMessageIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }
}

// Auto-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    window.contactFormHandler = new ContactForm('#contact-form');
  }
});

// Export für Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContactForm;
}
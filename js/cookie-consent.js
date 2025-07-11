/**
 * DSGVO-konformes Cookie-Consent-Tool
 * Beate's Grill - Vollständig lokal, keine externen Abhängigkeiten
 */

class CookieConsent {
  constructor() {
    this.cookieName = 'beate-grill-consent';
    this.cookieExpiry = 365; // Tage
    this.currentConsent = this.getStoredConsent();
    this.init();
  }

  init() {
    // Zeige Banner nur wenn noch keine Einwilligung vorliegt
    if (!this.currentConsent) {
      this.showConsentBanner();
    } else {
      this.applyConsent(this.currentConsent);
    }
    
    // Event Listener für Einstellungen öffnen
    this.addSettingsListener();
  }

  getStoredConsent() {
    const consent = localStorage.getItem(this.cookieName);
    return consent ? JSON.parse(consent) : null;
  }

  storeConsent(consent) {
    consent.timestamp = new Date().toISOString();
    localStorage.setItem(this.cookieName, JSON.stringify(consent));
    
    // Zusätzlich als Cookie für Server-seitige Verarbeitung
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (this.cookieExpiry * 24 * 60 * 60 * 1000));
    document.cookie = `${this.cookieName}=${JSON.stringify(consent)}; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict`;
  }

  showConsentBanner() {
    const banner = this.createBannerHTML();
    document.body.insertAdjacentHTML('beforeend', banner);
    
    // Event Listeners
    document.getElementById('cookie-accept-all').addEventListener('click', () => this.acceptAll());
    document.getElementById('cookie-accept-essential').addEventListener('click', () => this.acceptEssential());
    document.getElementById('cookie-settings').addEventListener('click', () => this.showSettings());
    document.getElementById('cookie-reject-all').addEventListener('click', () => this.rejectAll());
  }

  createBannerHTML() {
    return `
      <div id="cookie-consent-banner" class="cookie-banner">
        <div class="cookie-banner-content">
          <div class="cookie-banner-text">
            <h3>🍪 Cookie-Einstellungen</h3>
            <p>Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
            Einige sind essenziell für den Betrieb der Seite, während andere uns helfen, diese Website 
            und die Nutzererfahrung zu verbessern.</p>
          </div>
          <div class="cookie-banner-actions">
            <button id="cookie-accept-all" class="btn btn-primary">Alle akzeptieren</button>
            <button id="cookie-accept-essential" class="btn btn-secondary">Nur essenzielle</button>
            <button id="cookie-settings" class="btn btn-outline">Einstellungen</button>
            <button id="cookie-reject-all" class="btn btn-text">Alle ablehnen</button>
          </div>
        </div>
      </div>
    `;
  }

  showSettings() {
    const modal = this.createSettingsHTML();
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Event Listeners für Modal
    document.getElementById('cookie-modal-save').addEventListener('click', () => this.saveCustomSettings());
    document.getElementById('cookie-modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('cookie-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'cookie-modal-overlay') this.closeModal();
    });
  }

  createSettingsHTML() {
    const currentSettings = this.currentConsent || {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };

    return `
      <div id="cookie-modal-overlay" class="cookie-modal-overlay">
        <div class="cookie-modal">
          <div class="cookie-modal-header">
            <h2>Cookie-Einstellungen verwalten</h2>
            <button id="cookie-modal-close" class="cookie-modal-close">&times;</button>
          </div>
          <div class="cookie-modal-content">
            <div class="cookie-category">
              <div class="cookie-category-header">
                <h3>Essenziell</h3>
                <label class="cookie-toggle">
                  <input type="checkbox" id="cookie-essential" checked disabled>
                  <span class="cookie-slider"></span>
                </label>
              </div>
              <p>Diese Cookies sind für das Funktionieren der Website unerlässlich und können nicht deaktiviert werden.</p>
              <small>Beispiele: Session-Management, Sicherheitsfeatures, Cookie-Einstellungen</small>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-header">
                <h3>Präferenzen</h3>
                <label class="cookie-toggle">
                  <input type="checkbox" id="cookie-preferences" ${currentSettings.preferences ? 'checked' : ''}>
                  <span class="cookie-slider"></span>
                </label>
              </div>
              <p>Diese Cookies ermöglichen es uns, Ihre Präferenzen zu speichern und die Website entsprechend anzupassen.</p>
              <small>Beispiele: Spracheinstellungen, Designpräferenzen, gespeicherte Formulardaten</small>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-header">
                <h3>Analyse</h3>
                <label class="cookie-toggle">
                  <input type="checkbox" id="cookie-analytics" ${currentSettings.analytics ? 'checked' : ''}>
                  <span class="cookie-slider"></span>
                </label>
              </div>
              <p>Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.</p>
              <small>Beispiele: Besucherstatistiken, Heatmaps, Verweildauer (nur lokale Analyse)</small>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-header">
                <h3>Marketing</h3>
                <label class="cookie-toggle">
                  <input type="checkbox" id="cookie-marketing" ${currentSettings.marketing ? 'checked' : ''}>
                  <span class="cookie-slider"></span>
                </label>
              </div>
              <p>Diese Cookies werden verwendet, um Ihnen relevante Werbung zu zeigen.</p>
              <small>Beispiele: Retargeting, Social Media Integration, personalisierte Angebote</small>
            </div>
          </div>
          <div class="cookie-modal-footer">
            <button id="cookie-modal-save" class="btn btn-primary">Einstellungen speichern</button>
            <a href="datenschutz.html" class="btn btn-text">Datenschutzerklärung</a>
          </div>
        </div>
      </div>
    `;
  }

  acceptAll() {
    const consent = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    this.saveConsent(consent);
  }

  acceptEssential() {
    const consent = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    this.saveConsent(consent);
  }

  rejectAll() {
    const consent = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    this.saveConsent(consent);
  }

  saveCustomSettings() {
    const consent = {
      essential: true, // Immer true
      analytics: document.getElementById('cookie-analytics').checked,
      marketing: document.getElementById('cookie-marketing').checked,
      preferences: document.getElementById('cookie-preferences').checked
    };
    this.saveConsent(consent);
    this.closeModal();
  }

  saveConsent(consent) {
    this.currentConsent = consent;
    this.storeConsent(consent);
    this.applyConsent(consent);
    this.removeBanner();
    
    // Bestätigungsnachricht
    this.showConfirmation();
  }

  applyConsent(consent) {
    // Wende Cookie-Einstellungen an
    if (consent.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    if (consent.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }

    if (consent.preferences) {
      this.enablePreferences();
    } else {
      this.disablePreferences();
    }

    // Dispatch Event für andere Skripte
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
      detail: consent 
    }));
  }

  enableAnalytics() {
    // Hier würde lokale Analyse aktiviert werden
    console.log('Analytics enabled');
    // Beispiel: Lokale Besucherstatistiken
    this.trackPageView();
  }

  disableAnalytics() {
    console.log('Analytics disabled');
    // Entferne Analytics-Cookies
    this.removeCookiesByPattern('_analytics_');
  }

  enableMarketing() {
    console.log('Marketing enabled');
    // Hier würden Marketing-Features aktiviert werden
  }

  disableMarketing() {
    console.log('Marketing disabled');
    // Entferne Marketing-Cookies
    this.removeCookiesByPattern('_marketing_');
  }

  enablePreferences() {
    console.log('Preferences enabled');
    // Aktiviere Präferenz-Speicherung
  }

  disablePreferences() {
    console.log('Preferences disabled');
    // Entferne Präferenz-Cookies
    this.removeCookiesByPattern('_pref_');
  }

  removeCookiesByPattern(pattern) {
    // Entferne Cookies die dem Pattern entsprechen
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes(pattern)) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  }

  trackPageView() {
    // Nur lokale Analyse - keine externen Services
    if (this.currentConsent?.analytics) {
      const pageData = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100) // Gekürzt für Datenschutz
      };
      
      // Lokale Speicherung der Analyse-Daten
      const analyticsData = JSON.parse(localStorage.getItem('beate-grill-analytics') || '[]');
      analyticsData.push(pageData);
      
      // Behalte nur die letzten 100 Einträge
      if (analyticsData.length > 100) {
        analyticsData.splice(0, analyticsData.length - 100);
      }
      
      localStorage.setItem('beate-grill-analytics', JSON.stringify(analyticsData));
    }
  }

  removeBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.remove();
  }

  closeModal() {
    const modal = document.getElementById('cookie-modal-overlay');
    if (modal) modal.remove();
  }

  showConfirmation() {
    const notification = document.createElement('div');
    notification.className = 'cookie-notification';
    notification.innerHTML = '✅ Cookie-Einstellungen gespeichert';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  addSettingsListener() {
    // Füge Cookie-Einstellungen Link im Footer hinzu
    document.addEventListener('click', (e) => {
      if (e.target.id === 'open-cookie-settings') {
        e.preventDefault();
        this.showSettings();
      }
    });
  }

  // Public API für externe Verwendung
  hasConsent(category) {
    return this.currentConsent && this.currentConsent[category] === true;
  }

  revokeConsent() {
    localStorage.removeItem(this.cookieName);
    document.cookie = `${this.cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    this.currentConsent = null;
    this.showConsentBanner();
  }
}

// Initialisiere Cookie-Consent
document.addEventListener('DOMContentLoaded', () => {
  window.cookieConsent = new CookieConsent();
});

// Exportiere für Node.js (falls verwendet)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieConsent;
}
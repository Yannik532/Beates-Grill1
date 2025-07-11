class BeateGrillApp {
  constructor() {
    this.currentSlideIndex = 0;
    this.autoSlideTimer = null;
    this.slides = [];
    this.dots = [];
    this.sliderWrapper = null;
    
    this.init();
  }

  init() {
    this.initializeElements();
    this.setupEventListeners();
    this.initializeSlider();
    this.initializeAnimations();
    this.initializeStatusUpdater();
    this.handleTheme();
  }

  initializeElements() {
    this.slides = document.querySelectorAll('.slider__slide');
    this.dots = document.querySelectorAll('.slider__dot');
    this.sliderWrapper = document.getElementById('sliderWrapper');
  }

  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindNavigationEvents();
      this.bindMobileMenuEvents();
      this.bindSmoothScrolling();
      this.bindSliderEvents();
      this.bindFormEvents();
    });

    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250), { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.changeSlide(-1);
      } else if (e.key === 'ArrowRight') {
        this.changeSlide(1);
      } else if (e.key === 'Escape') {
        this.closeMobileMenu();
      }
    });
  }

  bindNavigationEvents() {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (link.getAttribute('href').startsWith('#')) {
          e.preventDefault();
          this.smoothScrollToSection(link.getAttribute('href'));
        }
      });
    });
  }

  bindMobileMenuEvents() {
    const mobileMenuToggle = document.querySelector('.btn--menu');
    const mobileNav = document.getElementById('mobileNav');
    const mobileClose = document.querySelector('.btn--close');

    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    if (mobileClose) {
      mobileClose.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    document.addEventListener('click', (e) => {
      if (mobileNav && mobileNav.classList.contains('active') && 
          !mobileNav.contains(e.target) && 
          !mobileMenuToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    document.querySelectorAll('.nav--mobile .nav__link').forEach(link => {
      link.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    });
  }

  bindSmoothScrolling() {
    document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          this.smoothScrollToSection(anchor.getAttribute('href'));
        }
      });
    });
  }

  bindSliderEvents() {
    const slider = document.querySelector('.slider');
    if (!slider) return;

    let startX = 0;
    let endX = 0;

    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      this.handleSwipe(startX, endX);
    }, { passive: true });

    slider.addEventListener('mouseenter', () => {
      this.pauseAutoSlide();
    });

    slider.addEventListener('mouseleave', () => {
      this.resumeAutoSlide();
    });
  }

  bindFormEvents() {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        this.handleFormSubmit(e);
      });
    }
  }

  initializeSlider() {
    if (this.slides.length === 0) return;
    
    this.showSlide(0);
    this.startAutoSlide();

    window.changeSlide = (direction) => this.changeSlide(direction);
    window.currentSlide = (index) => this.goToSlide(index);
  }

  initializeAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          if (entry.target.classList.contains('contact__info')) {
            this.animateContactItems(entry.target);
          }
          
          if (entry.target.classList.contains('hours')) {
            this.animateHoursItems(entry.target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in, .contact__info, .hours, .location').forEach(el => {
      observer.observe(el);
    });
  }

  initializeStatusUpdater() {
    this.updateOpeningStatus();
    setInterval(() => {
      this.updateOpeningStatus();
    }, 60000);

    window.toggleMobileMenu = () => this.toggleMobileMenu();
  }

  handleTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  showSlide(index) {
    if (index >= this.slides.length) {
      this.currentSlideIndex = 0;
    } else if (index < 0) {
      this.currentSlideIndex = this.slides.length - 1;
    } else {
      this.currentSlideIndex = index;
    }

    requestAnimationFrame(() => {
      const translateX = -this.currentSlideIndex * 100;
      if (this.sliderWrapper) {
        this.sliderWrapper.style.transform = `translate3d(${translateX}%, 0, 0)`;
      }
      
      this.dots.forEach((dot, i) => {
        dot.classList.toggle('slider__dot--active', i === this.currentSlideIndex);
      });
    });
  }

  changeSlide(direction) {
    this.currentSlideIndex += direction;
    this.showSlide(this.currentSlideIndex);
    this.resetAutoSlide();
  }

  goToSlide(index) {
    this.currentSlideIndex = index - 1;
    this.showSlide(this.currentSlideIndex);
    this.resetAutoSlide();
  }

  nextSlide() {
    this.currentSlideIndex++;
    this.showSlide(this.currentSlideIndex);
  }

  startAutoSlide() {
    this.autoSlideTimer = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  pauseAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  resumeAutoSlide() {
    if (!this.autoSlideTimer) {
      this.startAutoSlide();
    }
  }

  resetAutoSlide() {
    this.pauseAutoSlide();
    this.startAutoSlide();
  }

  handleSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.changeSlide(1);
      } else {
        this.changeSlide(-1);
      }
    }
  }

  handleResize() {
    const translateX = -this.currentSlideIndex * 100;
    if (this.sliderWrapper) {
      this.sliderWrapper.style.transform = `translate3d(${translateX}%, 0, 0)`;
    }
  }

  updateOpeningStatus() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const headerStatusDot = document.getElementById('headerStatusDot');
    const headerStatusText = document.getElementById('headerStatusText');
    
    if (!headerStatusDot || !headerStatusText) return;
    
    let isOpen = false;
    let statusMessage = '';
    
    if (currentDay === 2) {
      isOpen = false;
      statusMessage = 'Geschlossen';
    } else if (currentDay === 1 || (currentDay >= 3 && currentDay <= 6) || currentDay === 0) {
      if (currentTime >= 1200 && currentTime <= 2000) {
        isOpen = true;
        statusMessage = 'Geöffnet';
      } else if (currentTime < 1200) {
        isOpen = false;
        const hoursUntilOpen = Math.floor((1200 - currentTime) / 100);
        const minutesUntilOpen = (1200 - currentTime) % 100;
        if (hoursUntilOpen > 0) {
          statusMessage = `Öffnet in ${hoursUntilOpen}h`;
        } else {
          statusMessage = `Öffnet in ${minutesUntilOpen}min`;
        }
      } else {
        isOpen = false;
        statusMessage = 'Geschlossen';
      }
    } else {
      isOpen = false;
      statusMessage = 'Geschlossen';
    }
    
    headerStatusDot.className = 'header__status-dot ' + (isOpen ? 'open' : 'closed');
    headerStatusText.className = 'header__status-text ' + (isOpen ? 'open' : 'closed');
    headerStatusText.textContent = statusMessage;
  }

  toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
      mobileNav.classList.toggle('active');
      
      if (mobileNav.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav && mobileNav.classList.contains('active')) {
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  smoothScrollToSection(href) {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  animateContactItems(container) {
    const contactItems = container.querySelectorAll('.contact__item');
    contactItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('visible');
      }, index * 100);
    });
  }

  animateHoursItems(container) {
    const hoursItems = container.querySelectorAll('.hours__item');
    hoursItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('visible');
      }, index * 100);
    });
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = form.querySelector('#name')?.value.trim();
    const email = form.querySelector('#email')?.value.trim();
    const message = form.querySelector('#message')?.value.trim();
    
    if (this.validateForm(name, email, message)) {
      this.showFormSuccess();
      form.reset();
    } else {
      this.showFormError('Bitte füllen Sie alle Felder aus.');
    }
  }

  validateForm(name, email, message) {
    return name && email && message && this.isValidEmail(email);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showFormSuccess() {
    this.showNotification('Vielen Dank für Ihre Nachricht! Wir melden uns bald bei Ihnen.', 'success');
  }

  showFormError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

new BeateGrillApp();
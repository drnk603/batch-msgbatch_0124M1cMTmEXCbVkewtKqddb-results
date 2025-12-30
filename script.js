(function() {
    'use strict';

    window.__app = window.__app || {};

    const CONFIG = {
        headerHeight: 80,
        animationDuration: 600,
        scrollOffset: 120,
        debounceDelay: 250,
        throttleDelay: 100,
        notificationDuration: 5000
    };

    const VALIDATION_RULES = {
        firstName: {
            pattern: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
            message: 'Vorname muss 2-50 Zeichen enthalten (nur Buchstaben, Leerzeichen, Bindestrich, Apostroph)'
        },
        lastName: {
            pattern: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
            message: 'Nachname muss 2-50 Zeichen enthalten (nur Buchstaben, Leerzeichen, Bindestrich, Apostroph)'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
        },
        phone: {
            pattern: /^[\d\s+\-()]{10,20}$/,
            message: 'Telefonnummer muss 10-20 Zeichen enthalten (Ziffern, Leerzeichen, +, -, (, ) erlaubt)'
        },
        message: {
            minLength: 10,
            message: 'Nachricht muss mindestens 10 Zeichen enthalten'
        },
        company: {
            pattern: /^[a-zA-ZÀ-ÿ0-9\s'-.&]{2,100}$/,
            message: 'Firmenname muss 2-100 Zeichen enthalten'
        }
    };

    function throttle(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    func.apply(context, args);
                }, wait);
            }
        };
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    class NotificationManager {
        constructor() {
            this.container = null;
            this.init();
        }

        init() {
            if (this.container) return;
            this.container = document.createElement('div');
            this.container.className = 'position-fixed top-0 end-0 p-3';
            this.container.style.zIndex = '9999';
            document.body.appendChild(this.container);
        }

        show(message, type = 'info') {
            const alertType = type === 'error' ? 'danger' : type;
            const alert = document.createElement('div');
            alert.className = `alert alert-${alertType} alert-dismissible fade show`;
            alert.style.minWidth = '300px';
            alert.style.animation = 'slideInRight 0.3s ease-out';
            alert.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" aria-label="Schließen"></button>`;

            const closeBtn = alert.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => this.hide(alert));

            this.container.appendChild(alert);

            setTimeout(() => this.hide(alert), CONFIG.notificationDuration);
        }

        hide(alert) {
            if (!alert.parentNode) return;
            alert.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    }

    class MobileMenuManager {
        constructor() {
            this.toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
            this.menu = document.querySelector('#nav-menu, .navbar-collapse');
            this.body = document.body;
            this.overlay = null;
            this.init();
        }

        init() {
            if (!this.toggle || !this.menu) return;

            this.createOverlay();
            this.bindEvents();
        }

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.className = 'mobile-menu-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: var(--header-h);
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease-in-out;
                z-index: 999;
            `;
            document.body.appendChild(this.overlay);
        }

        bindEvents() {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });

            this.overlay.addEventListener('click', () => this.closeMenu());

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) {
                    this.closeMenu();
                    this.toggle.focus();
                }
            });

            const navLinks = this.menu.querySelectorAll('.nav-link, .c-nav__link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });

            window.addEventListener('resize', debounce(() => {
                if (window.innerWidth >= 992 && this.isOpen()) {
                    this.closeMenu();
                }
            }, CONFIG.debounceDelay));
        }

        toggleMenu() {
            this.isOpen() ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            this.menu.classList.add('show');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.classList.add('u-no-scroll');
            this.overlay.style.opacity = '1';
            this.overlay.style.visibility = 'visible';
            this.menu.style.height = `calc(100vh - var(--header-h))`;
        }

        closeMenu() {
            this.menu.classList.remove('show');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.classList.remove('u-no-scroll');
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            this.menu.style.height = '';
        }

        isOpen() {
            return this.menu.classList.contains('show');
        }
    }

    class SmoothScrollManager {
        constructor() {
            this.header = document.querySelector('.l-header');
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') return;

                const targetId = href.substring(1);
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();
                    this.scrollToElement(target);
                }
            });

            this.createScrollToTopButton();
        }

        scrollToElement(element) {
            const headerHeight = this.header ? this.header.offsetHeight : CONFIG.headerHeight;
            const targetTop = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: 'smooth'
            });
        }

        createScrollToTopButton() {
            const btn = document.createElement('button');
            btn.className = 'scroll-to-top';
            btn.setAttribute('aria-label', 'Nach oben scrollen');
            btn.innerHTML = '↑';
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, var(--color-accent), var(--color-highlight));
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease-in-out;
                z-index: 1000;
                box-shadow: var(--shadow-lg);
            `;

            document.body.appendChild(btn);

            const toggleVisibility = throttle(() => {
                if (window.pageYOffset > 300) {
                    btn.style.opacity = '1';
                    btn.style.visibility = 'visible';
                } else {
                    btn.style.opacity = '0';
                    btn.style.visibility = 'hidden';
                }
            }, CONFIG.throttleDelay);

            window.addEventListener('scroll', toggleVisibility, { passive: true });

            btn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
            });

            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }
    }

    class FormValidator {
        constructor(form) {
            this.form = form;
            this.honeypot = null;
            this.init();
        }

        init() {
            this.createHoneypot();
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.addRealTimeValidation();
        }

        createHoneypot() {
            this.honeypot = document.createElement('input');
            this.honeypot.type = 'text';
            this.honeypot.name = 'website';
            this.honeypot.style.cssText = 'position:absolute;left:-9999px;';
            this.honeypot.tabIndex = -1;
            this.honeypot.setAttribute('aria-hidden', 'true');
            this.form.appendChild(this.honeypot);
        }

        addRealTimeValidation() {
            const inputs = this.form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => {
                    if (input.classList.contains('is-invalid')) {
                        this.validateField(input);
                    }
                });
            });
        }

        validateField(field) {
            const fieldName = field.name;
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            this.clearFieldError(field);

            if (field.hasAttribute('required') && !value) {
                isValid = false;
                errorMessage = 'Dieses Feld ist erforderlich';
            } else if (value) {
                const rule = VALIDATION_RULES[fieldName];
                
                if (rule) {
                    if (rule.pattern && !rule.pattern.test(value)) {
                        isValid = false;
                        errorMessage = rule.message;
                    } else if (rule.minLength && value.length < rule.minLength) {
                        isValid = false;
                        errorMessage = rule.message;
                    }
                }
            }

            if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                isValid = false;
                errorMessage = 'Bitte akzeptieren Sie die Datenschutzerklärung';
            }

            if (!isValid) {
                this.showFieldError(field, errorMessage);
            }

            return isValid;
        }

        showFieldError(field, message) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');

            let feedback = field.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                field.parentElement.appendChild(feedback);
            }
            feedback.textContent = message;
            feedback.style.display = 'block';
        }

        clearFieldError(field) {
            field.classList.remove('is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.style.display = 'none';
            }
        }

        validateForm() {
            const fields = this.form.querySelectorAll('input, textarea, select');
            let isValid = true;

            fields.forEach(field => {
                if (field.name === 'website') return;
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        async handleSubmit(e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.honeypot && this.honeypot.value) {
                return;
            }

            if (!this.validateForm()) {
                window.__app.notify('Bitte korrigieren Sie die Fehler im Formular', 'error');
                return;
            }

            const submitBtn = this.form.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';

            try {
                await this.submitForm();
                window.location.href = 'thank_you.html';
            } catch (error) {
                window.__app.notify('Fehler beim Senden. Bitte versuchen Sie es später erneut.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        async submitForm() {
            const formData = new FormData(this.form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                if (key !== 'website') {
                    data[key] = value;
                }
            }

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const isOnline = navigator.onLine;
                    if (!isOnline) {
                        reject(new Error('Keine Internetverbindung'));
                    } else {
                        resolve(data);
                    }
                }, 1000);
            });
        }
    }

    class ScrollAnimationManager {
        constructor() {
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                }
            );

            this.observeElements();
        }

        observeElements() {
            const elements = document.querySelectorAll('img, .card, .btn, h1, h2, h3, p, .alert, .service-detail');
            
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                el.style.transitionDelay = `${index * 0.05}s`;
                el.setAttribute('data-animate', 'true');
                this.observer.observe(el);
            });
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.getAttribute('data-animate') === 'true') {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.setAttribute('data-animate', 'false');
                }
            });
        }
    }

    class RippleEffectManager {
        constructor() {
            this.init();
        }

        init() {
            const elements = document.querySelectorAll('.btn, .nav-link, .card, a');
            
            elements.forEach(element => {
                element.addEventListener('click', (e) => this.createRipple(e));
            });
        }

        createRipple(event) {
            const button = event.currentTarget;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                left: ${x}px;
                top: ${y}px;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
            `;

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    }

    class CountUpManager {
        constructor() {
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                { threshold: 0.5 }
            );

            const statElements = document.querySelectorAll('[data-count]');
            statElements.forEach(el => this.observer.observe(el));
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    this.animateCount(entry.target);
                }
            });
        }

        animateCount(element) {
            const target = parseInt(element.getAttribute('data-count'));
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;

            const timer = setInterval(() => {
                step++;
                current += increment;
                
                if (step >= steps) {
                    current = target;
                    clearInterval(timer);
                }
                
                element.textContent = Math.floor(current);
            }, duration / steps);
        }
    }

    class ActiveMenuManager {
        constructor() {
            this.init();
        }

        init() {
            this.updateActiveState();
            window.addEventListener('scroll', throttle(() => this.updateScrollSpy(), CONFIG.throttleDelay), { passive: true });
        }

        updateActiveState() {
            const currentPath = location.pathname;
            const navLinks = document.querySelectorAll('.nav-link, .c-nav__link');

            navLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');

                const href = link.getAttribute('href');
                if (href === currentPath || 
                    (currentPath === '/' && href === '/index.html') ||
                    (currentPath === '/index.html' && href === '/')) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }

        updateScrollSpy() {
            const sections = document.querySelectorAll('[id^="section-"]');
            const navLinks = document.querySelectorAll('.nav-link[href^="#section-"]');
            
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (window.pageYOffset >= sectionTop - CONFIG.headerHeight - 50) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }
    }

    class ImageManager {
        constructor() {
            this.init();
        }

        init() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                if (!img.hasAttribute('loading') && 
                    !img.classList.contains('c-logo__img') && 
                    !img.hasAttribute('data-critical')) {
                    img.setAttribute('loading', 'lazy');
                }

                img.addEventListener('error', function() {
                    const width = this.width || 300;
                    const height = this.height || 200;
                    const placeholderSvg = `data:image/svg+xml;base64,${btoa(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                            <rect width="100%" height="100%" fill="#f8f9fa"/>
                            <text x="50%" y="50%" font-family="Arial,sans-serif" font-size="14" fill="#6c757d" text-anchor="middle" dy=".3em">
                                Bild nicht verfügbar
                            </text>
                        </svg>`
                    )}`;
                    this.src = placeholderSvg;
                });
            });
        }
    }

    class ModalManager {
        constructor() {
            this.init();
        }

        init() {
            const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
            
            privacyLinks.forEach(link => {
                if (!link.getAttribute('href').startsWith('privacy.html') && 
                    !link.getAttribute('href').startsWith('/privacy')) {
                    return;
                }

                link.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey) return;
                    
                    const href = link.getAttribute('href');
                    if (href.includes('#') && !href.startsWith('#')) {
                        return;
                    }
                });
            });
        }
    }

    function addAnimationStyles() {
        if (document.getElementById('custom-animations')) return;

        const style = document.createElement('style');
        style.id = 'custom-animations';
        style.textContent = `
            @keyframes ripple-effect {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            .btn, .card, .service-detail {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .btn:hover {
                transform: translateY(-2px);
            }

            .btn:active {
                transform: translateY(0);
            }

            .card:hover {
                transform: translateY(-4px);
            }

            .nav-link {
                position: relative;
            }

            .nav-link::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                width: 0;
                height: 2px;
                background: var(--color-accent);
                transition: all 0.3s ease-in-out;
                transform: translateX(-50%);
            }

            .nav-link:hover::after,
            .nav-link.active::after {
                width: 80%;
            }

            .spinner-border-sm {
                width: 1rem;
                height: 1rem;
                border-width: 0.15em;
            }

            .spinner-border {
                display: inline-block;
                border: 0.25em solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spinner-border 0.75s linear infinite;
            }

            @keyframes spinner-border {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        if (window.__app.initialized) return;
        window.__app.initialized = true;

        addAnimationStyles();

        window.__app.notify = new NotificationManager();
        new MobileMenuManager();
        new SmoothScrollManager();
        new ScrollAnimationManager();
        new RippleEffectManager();
        new CountUpManager();
        new ActiveMenuManager();
        new ImageManager();
        new ModalManager();

        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach(form => new FormValidator(form));

        window.__app.notify = window.__app.notify.show.bind(window.__app.notify);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
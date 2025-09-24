// Navigation - Desktop and Mobile
const navLinks = document.querySelectorAll('.nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const allNavLinks = [...navLinks, ...mobileNavLinks];

// Check if we're on mobile
const isMobile = () => window.innerWidth <= 768;

// Keep navbar always visible
const navbar = document.querySelector('.navbar');
if (navbar) {
    navbar.style.transform = 'translateX(-50%)';
}

// Smooth scroll with offset for fixed navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80; // Height of navbar
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link based on scroll position
const sections = document.querySelectorAll('section[id]');
const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
};

const observerCallback = (entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            // Update both desktop and mobile nav links
            allNavLinks.forEach((link) => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
};

const observer = new IntersectionObserver(observerCallback, observerOptions);
sections.forEach((section) => observer.observe(section));

// Parallax effect for bubbles and gradient fade
const parallaxScroll = () => {
    const scrolled = window.pageYOffset;
    const bubbles = document.querySelectorAll('.bubble');
    const workItems = document.querySelectorAll('.work-item');
    const hero = document.querySelector('.hero');
    
    // Fade gradient based on scroll position
    if (hero) {
        const heroHeight = hero.offsetHeight;
        const fadeStart = 0;
        const fadeEnd = heroHeight * 0.5; // Fade out by 50% of hero height
        
        // Calculate fade amount (1 at top, 0 when scrolled past fadeEnd)
        let fadeAmount = 1;
        if (scrolled > fadeStart) {
            fadeAmount = Math.max(0, 1 - ((scrolled - fadeStart) / (fadeEnd - fadeStart)));
        }
        
        // Update CSS variables for gradient opacity
        hero.style.setProperty('--gradient-opacity-bottom', (0.08 * fadeAmount).toFixed(3));
        hero.style.setProperty('--gradient-opacity-mid', (0.03 * fadeAmount).toFixed(3));
    }

    // Apply parallax only on desktop, reduce effect on mobile
    if (window.innerWidth > 768) {
        bubbles.forEach((element, index) => {
            const speed = 0.15 + (index * 0.08);
            const floatY = Math.sin(scrolled * 0.003 + index) * 10;
            element.style.transform = `translateY(${scrolled * speed + floatY}px)`;
        });
    } else {
        // Simpler effect for mobile to improve performance
        bubbles.forEach((element, index) => {
            const speed = 0.05 + (index * 0.02);
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }
    
    // Subtle rotation on work items
    workItems.forEach((item, index) => {
        if (item.getBoundingClientRect().top < window.innerHeight) {
            const rotation = Math.sin(scrolled * 0.005 + index) * 2;
            item.style.transform = `rotate(${rotation}deg)`;
        }
    });
};

window.addEventListener('scroll', parallaxScroll);

// Reveal animations on scroll
const revealElements = document.querySelectorAll('.work-item, .skill-item');
const revealOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px'
};

const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            observer.unobserve(entry.target);
        }
    });
}, revealOptions);

// Initialize reveal elements
revealElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealOnScroll.observe(element);
});

// Glitch effect removed per user request

// Counter animation for stats
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent);
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Tilt effect for about card
const aboutCard = document.querySelector('.about-card');
const bindBrutalTilt = (el, base = -15) => {
    if (!el) return;
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 8;
        const rotateY = (centerX - x) / 8;
        const scale = 1 + Math.abs(rotateX * rotateY) * 0.0001;
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = `perspective(1000px) rotateY(${base}deg) scale(1)`;
        // Spring effect
        setTimeout(() => {
            el.style.transform = `perspective(1000px) rotateY(${base + 5}deg) scale(0.98)`;
        }, 100);
        setTimeout(() => {
            el.style.transform = `perspective(1000px) rotateY(${base}deg) scale(1)`;
        }, 200);
    });
};

bindBrutalTilt(aboutCard, -15);

// Smooth page load animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Initialize gradient fade effect
    parallaxScroll();
});

// Viewport Scaling System
const initViewportScaling = () => {
    const updateScale = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const screenSize = Math.min(width, height);
        
        let scale = 1;
        let cursorScale = 1;
        let navFontScale = 1;
        
        // Detect device type and apply appropriate scaling
        if (width <= 480) {
            // Mobile phones
            scale = 1;
            cursorScale = 0.5;
            navFontScale = 0.65;
        } else if (width <= 768) {
            // Small tablets
            scale = 0.85;
            cursorScale = 0.6;
            navFontScale = 0.7;
        } else if (width <= 1024) {
            // Tablets and small laptops
            scale = 0.75;
            cursorScale = 0.7;
            navFontScale = 0.85;
        } else if (width <= 1366) {
            // Standard laptops
            scale = 0.8;
            cursorScale = 0.8;
            navFontScale = 0.9;
        } else if (width <= 1920) {
            // HD screens
            scale = 0.9;
            cursorScale = 0.9;
            navFontScale = 1;
        } else {
            // 4K and larger displays
            scale = 1;
            cursorScale = 1;
            navFontScale = 1;
        }
        
        // Apply additional scaling based on pixel density
        const pixelRatio = window.devicePixelRatio || 1;
        if (pixelRatio > 1.5) {
            scale *= 0.9; // Further scale down for high DPI screens
        }
        
        // Update CSS variables for scaling
        document.documentElement.style.setProperty('--viewport-scale', scale);
        document.documentElement.style.setProperty('--cursor-scale', cursorScale);
        document.documentElement.style.setProperty('--font-scale', scale);
        document.documentElement.style.setProperty('--nav-font-scale', navFontScale);
        
        // Update viewport meta tag for proper mobile scaling
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            if (width <= 768) {
                // Fixed viewport for mobile to prevent zooming issues
                viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
            } else {
                viewport.content = `width=device-width, initial-scale=${scale}, minimum-scale=${scale * 0.8}, maximum-scale=${scale * 1.2}`;
            }
        }
    };
    
    // Initial update
    updateScale();
    
    // Update on resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateScale, 100);
    });
    
    // Update on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(updateScale, 100);
    });
};

// Initialize viewport scaling
initViewportScaling();

// Add cursor glow effect with scaling support (desktop only)
if (!('ontouchstart' in window)) {
    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);

    document.addEventListener('mousemove', (e) => {
        // Get the current cursor scale from CSS variable
        const cursorScale = getComputedStyle(document.documentElement)
            .getPropertyValue('--cursor-scale') || 1;
        
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });
}

// Add CSS for cursor glow + glass helpers with scaling
const style = document.createElement('style');
style.textContent = `
    :root {
        --viewport-scale: 1;
        --cursor-scale: 1;
        --font-scale: 1;
    }
    
    .cursor-glow {
        position: fixed;
        width: calc(400px * var(--cursor-scale));
        height: calc(400px * var(--cursor-scale));
        border-radius: 50%;
        background: radial-gradient(circle, rgba(230, 126, 60, 0.1) 0%, transparent 70%);
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 9999;
        mix-blend-mode: screen;
        transition: opacity 0.3s ease, width 0.3s ease, height 0.3s ease;
    }
    
    .nav-link.active {
        color: var(--orange-primary);
    }
    
    .nav-link.active::after {
        width: 100%;
    }
    
    /* Brutalist hover effects */
    .glass:hover::before { opacity: 0.9; }
    .work-item:hover .work-photo { transform: scale(1.1) rotate(-2deg); }
    
    @keyframes pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); opacity: 0.5; }
        100% { transform: scale(0); opacity: 0; }
    }
    
    /* Spawned bubbles */
    .spawned-bubble {
        position: fixed !important;
        z-index: 100;
        cursor: pointer;
        pointer-events: auto;
    }
    
    .spawned-bubble:hover {
        opacity: 1 !important;
        filter: brightness(1.2);
    }
    
    @keyframes ripple {
        0% { width: 20px; height: 20px; opacity: 1; }
        100% { width: 200px; height: 200px; opacity: 0; }
    }
    
    @keyframes multiplier-pulse {
        0% { 
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }
    
    /* Enhanced liquid glass hover effects */
    .liquid-glass-nav:hover {
        box-shadow:
            inset 0 2px 4px rgba(255, 255, 255, 0.5),
            inset 0 -2px 4px rgba(230, 126, 60, 0.15),
            0 25px 50px rgba(0, 0, 0, 0.35),
            0 4px 25px rgba(230, 126, 60, 0.2);
    }
    
    
    /* Dynamic scaling for different screen sizes */
    @media (max-width: 1366px) and (min-width: 1025px) {
        /* Standard laptops */
        .cursor-glow {
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
    
    @media (max-width: 768px) {
        .cursor-glow {
            display: none;
        }
    }
    
    /* Mobile-specific bubble styles */
    @media (max-width: 768px) {
        .bubble {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .spawned-bubble {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .cursor-glow { display: none; }
    }
`;
document.head.appendChild(style);

// Bouncy click effect for interactive elements (excluding skill items)
const addBounceClick = () => {
    const clickables = document.querySelectorAll('.work-item, .btn, .social-link');
    
    clickables.forEach(el => {
        el.addEventListener('click', (e) => {
            // Bounce animation
            el.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                el.style.animation = '';
            }, 500);
        });
        
        el.addEventListener('mousedown', () => {
            el.style.transform = 'scale(0.95)';
        });
        
        el.addEventListener('mouseup', () => {
            el.style.transform = '';
        });
    });
};

addBounceClick();

// Form submission handler (if you add a contact form later)
const handleFormSubmit = (e) => {
    e.preventDefault();
    // Add form handling logic here
    console.log('Form submitted');
};

// Performance optimization: Debounce scroll events
let scrollTimeout;
const debounceScroll = (callback, delay = 10) => {
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(callback, delay);
    });
};

// Optimize parallax with debouncing
debounceScroll(() => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-element');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        element.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.02}deg)`;
    });
});

// Add keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    // Handle tab navigation for mobile bottom nav
    if (e.key === 'Tab' && isMobile()) {
        const focusedElement = document.activeElement;
        const mobileNavContainer = document.querySelector('.mobile-bottom-nav');
        
        if (mobileNavContainer && mobileNavContainer.contains(focusedElement)) {
            // Add visual feedback for keyboard navigation
            focusedElement.style.outline = '2px solid var(--orange-primary)';
            focusedElement.style.outlineOffset = '2px';
        }
    }
});

// Navbar glare interaction (no animations)
const navbarInteraction = () => {
    const navbar = document.querySelector('.navbar');
    const navGlare = document.querySelector('.nav-glare');
    
    if (navbar) {
        navbar.addEventListener('mousemove', (e) => {
            const rect = navbar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const relativeX = x / rect.width;
            
            if (navGlare) {
                navGlare.style.opacity = '0.3';
                navGlare.style.transform = `translateX(${-50 + relativeX * 100}%) rotate(-45deg)`;
            }
        });
        
        navbar.addEventListener('mouseleave', () => {
            if (navGlare) {
                navGlare.style.opacity = '';
                navGlare.style.transform = '';
            }
        });
    }
};

navbarInteraction();

// Bubble spawning and pop effect with ramping
let bubbleCount = 4; // Start with 4 bubbles
let poppedCount = 0; // Track total bubbles popped
let spawnMultiplier = 1; // Increases as more bubbles are popped

// Show multiplier indicator
const showMultiplierIndicator = () => {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        font-weight: 900;
        color: var(--orange-primary);
        z-index: 1000;
        pointer-events: none;
        animation: multiplier-pulse 1s ease-out;
    `;
    indicator.textContent = `×${spawnMultiplier.toFixed(1)} BUBBLES!`;
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 1000);
};

// Bubble counter removed per user request

const createBubble = () => {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble spawned-bubble';
    
    // Get current viewport scale
    const viewportScale = getComputedStyle(document.documentElement)
        .getPropertyValue('--viewport-scale') || 1;
    
    // Random size between 60px and 150px, scaled
    const baseSize = Math.random() * 90 + 60;
    const size = baseSize * parseFloat(viewportScale);
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    
    // Random horizontal position, start at bottom
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    bubble.style.position = 'fixed';
    bubble.style.left = Math.random() * (viewportWidth - size) + 'px';
    bubble.style.top = (viewportHeight + size) + 'px'; // Start below viewport
    
    // Add shine effect
    const shine = document.createElement('div');
    shine.className = 'bubble-shine';
    bubble.appendChild(shine);
    
    // Full opacity like hero bubbles
    const finalOpacity = 1;
    
    // Add to page with fade in
    bubble.style.opacity = '0';
    bubble.style.transform = 'scale(0)';
    document.body.appendChild(bubble);
    
    // Float speed based on size (smaller = faster)
    const floatDuration = (200 - size) * 50 + 10000; // 10-16 seconds
    
    // Animate in and start floating up
    setTimeout(() => {
        bubble.style.opacity = '1';
        bubble.style.transform = 'scale(1)';
        bubble.style.transition = `all ${floatDuration}ms linear`;
        
        // Move to top of screen
        setTimeout(() => {
            bubble.style.top = '-' + (size + 20) + 'px';
        }, 100);
        
        // Auto-pop when reaching top
        setTimeout(() => {
            popBubble(bubble, false); // Don't spawn new ones for auto-pop
        }, floatDuration);
    }, 50);
    
    // Add click/touch handler
    const handleBubblePop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        popBubble(bubble, true); // Do spawn new ones for manual pop
        poppedCount++;
        
        // Increase spawn multiplier every 10 pops
        if (poppedCount % 10 === 0) {
            spawnMultiplier = Math.min(spawnMultiplier + 0.5, 5); // Cap at 5x
            showMultiplierIndicator();
        }
        
        // Spawn bubbles based on multiplier
        const baseSpawn = Math.floor(Math.random() * 2) + 2;
        const newBubbles = Math.floor(baseSpawn * spawnMultiplier);
        
        for (let i = 0; i < newBubbles; i++) {
            setTimeout(() => createBubble(), i * 50);
        }
    };
    
    bubble.addEventListener('click', handleBubblePop);
    bubble.addEventListener('touchstart', handleBubblePop, { passive: false });
    
    bubbleCount++;
};

const popBubble = (bubble, shouldSpawn = false) => {
    bubble.style.animation = 'pop 0.5s ease-out';
    bubble.style.pointerEvents = 'none'; // Prevent multiple clicks
    setTimeout(() => {
        bubble.remove();
        bubbleCount--;
    }, 400);
};

// Add click/touch handlers to existing bubbles
const existingBubbles = document.querySelectorAll('.bubble');
existingBubbles.forEach(bubble => {
    const handleExistingBubblePop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Don't remove original bubbles, just animate them
        bubble.style.animation = 'pop 0.5s ease-out';
        
        poppedCount++;
        
        // Increase spawn multiplier every 10 pops
        if (poppedCount % 10 === 0) {
            spawnMultiplier = Math.min(spawnMultiplier + 0.5, 5); // Cap at 5x
            showMultiplierIndicator();
        }
        
        // Spawn bubbles based on multiplier
        const baseSpawn = Math.floor(Math.random() * 2) + 2;
        const newBubbles = Math.floor(baseSpawn * spawnMultiplier);
        
        for (let i = 0; i < newBubbles; i++) {
            setTimeout(() => createBubble(), i * 50);
        }
        
        // Restore original bubble
        setTimeout(() => {
            bubble.style.opacity = '0';
            setTimeout(() => {
                bubble.style.opacity = '1';
                bubble.style.animation = 'float-bubble 6s ease-in-out infinite';
            }, 500);
        }, 400);
    };
    
    bubble.addEventListener('click', handleExistingBubblePop);
    bubble.addEventListener('touchstart', handleExistingBubblePop, { passive: false });
});

// Preload optimization
const preloadImages = () => {
    const imageUrls = [
        'https://picsum.photos/seed/sculptor/1200/900',
        'https://picsum.photos/seed/xenon/1200/900',
        'https://picsum.photos/seed/webdev/1200/900',
        'https://picsum.photos/seed/opensource/1200/900',
        'https://picsum.photos/seed/ux/1200/900',
        'https://picsum.photos/seed/engineering/1200/900'
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
};

// Call preload on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadImages);
} else {
    preloadImages();
}

// Mobile Navigation Initialization
const initMobileNavigation = () => {
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (mobileNav && isMobile()) {
        // Add touch feedback for mobile nav links
        mobileNavLinks.forEach(link => {
            link.addEventListener('touchstart', (e) => {
                link.style.transform = 'translateY(0) scale(0.95)';
            }, { passive: true });
            
            link.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    link.style.transform = '';
                }, 150);
            }, { passive: true });
            
            // Add haptic feedback if available
            link.addEventListener('click', () => {
                if (navigator.vibrate) {
                    navigator.vibrate(50); // Short vibration
                }
            });
        });
        
        // Set initial active state based on current page/section
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        
        mobileNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if ((href.startsWith('#') && href === currentHash) || 
                (href.endsWith('.html') && currentPath.includes(href))) {
                link.classList.add('active');
            }
        });
    }
};

// Initialize mobile navigation
initMobileNavigation();

console.log('Chase Culbertson Portfolio initialized successfully');

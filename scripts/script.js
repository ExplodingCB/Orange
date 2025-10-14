// Navigation - Desktop and Mobile
const navLinks = document.querySelectorAll('.nav-link');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
const allNavLinks = [...navLinks, ...mobileMenuLinks];

// Check if we're on mobile
const isMobile = () => window.innerWidth <= 768;

// Navbar scroll behavior
const navbar = document.querySelector('.navbar');
let lastScrollTop = 0;

const handleNavbarScroll = () => {
    if (!navbar) return;
    
    // Only apply scroll behavior on mobile
    if (!isMobile()) {
        navbar.classList.remove('hidden');
        return;
    }
    
    // Don't hide navbar if mobile menu is open
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    if (mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
        navbar.classList.remove('hidden');
        return;
    }
    
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Don't hide at the very top
    if (currentScroll <= 50) {
        navbar.classList.remove('hidden');
        lastScrollTop = currentScroll;
        return;
    }
    
    // Scrolling down - hide navbar
    if (currentScroll > lastScrollTop && currentScroll > 50) {
        navbar.classList.add('hidden');
    } 
    // Scrolling up - show navbar
    else if (currentScroll < lastScrollTop) {
        navbar.classList.remove('hidden');
    }
    
    lastScrollTop = currentScroll;
};

// Scroll handler with requestAnimationFrame for smoothness
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleNavbarScroll();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

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

// Gradient fade effect (bubbles no longer move on scroll)
const parallaxScroll = () => {
    const scrolled = window.pageYOffset;
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

// About card - no special effects needed

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
        
        /* Bubbles are hidden on mobile via display: none in main stylesheet */
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

// Keyboard navigation is handled by default browser behavior
// with enhanced focus styles defined in CSS

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

// Bubble spawning and pop effect with ramping (desktop only)
let bubbleCount = 4; // Start with 4 bubbles
let poppedCount = 0; // Track total bubbles popped
let spawnMultiplier = 1; // Increases as more bubbles are popped

// Show multiplier indicator
const showMultiplierIndicator = () => {
    if (isMobile()) return; // No indicators on mobile
    
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

const createBubble = () => {
    if (isMobile()) return; // No bubble spawning on mobile
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

// Add click/touch handlers to existing bubbles (desktop only)
if (!isMobile()) {
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
}

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

// Mobile Menu Toggle
const initMobileMenu = () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    
    if (!hamburger || !mobileMenuOverlay) return;
    
    // Toggle menu
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpening = !mobileMenuOverlay.classList.contains('active');
        
        mobileMenuOverlay.classList.toggle('active');
        hamburger.classList.toggle('active');
        
        // Always show navbar when opening menu
        if (isOpening && navbar) {
            navbar.classList.remove('hidden');
        }
    });
    
    // Close menu when clicking on overlay
    mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay || e.target.classList.contains('mobile-menu-content')) {
            mobileMenuOverlay.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
    
    // Close menu and navigate when clicking links
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
            mobileMenuOverlay.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
};

// Initialize mobile menu (always available, CSS handles visibility)
initMobileMenu();

// Work Preview Functionality with Rolodex Scroll (desktop only)
const initWorkPreview = () => {
    // Skip on mobile - just use simple tap-to-visit
    if (isMobile()) return;
    
    const workList = document.querySelector('.work-list');
    const workItems = document.querySelectorAll('.work-item');
    const workIframe = document.getElementById('work-iframe');

    if (!workItems.length || !workIframe || !workList) return;

    let currentIndex = 0;
    let isDragging = false;
    let startY = 0;
    let scrollTop = 0;

    // Function to update active item and preview
    const updateActiveItem = (index) => {
        if (index < 0) index = 0;
        if (index >= workItems.length) index = workItems.length - 1;

        currentIndex = index;

        // Remove active class from all items
        workItems.forEach((item, i) => {
            item.classList.remove('active');
        });

        // Add active class to current item
        workItems[currentIndex].classList.add('active');

        // Update iframe src
        const url = workItems[currentIndex].getAttribute('data-url');
        if (url && !workIframe.src.includes(url)) {
            workIframe.src = url;
        }
    };

    // Mouse/Touch events for rolodex scrolling
    const handleStart = (e) => {
        isDragging = true;
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        scrollTop = workList.scrollTop;
        workList.style.scrollBehavior = 'auto';
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const deltaY = startY - currentY;

        // Scroll the list
        workList.scrollTop = scrollTop + deltaY;

        // Calculate which item should be active based on scroll position
        const itemHeight = workItems[0].offsetHeight + 8; // height + margin
        const scrollProgress = workList.scrollTop;
        const newIndex = Math.round(scrollProgress / itemHeight);

        if (newIndex !== currentIndex) {
            updateActiveItem(newIndex);
        }
    };

    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        workList.style.scrollBehavior = 'smooth';

        // Snap to nearest item
        const itemHeight = workItems[0].offsetHeight + 8;
        const targetScroll = currentIndex * itemHeight;
        workList.scrollTop = targetScroll;
    };

    // Mouse events
    workList.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    workList.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    // Hover to preview (for non-drag interaction)
    workItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            if (!isDragging) {
                updateActiveItem(index);
            }
        });

        // Click to open in new tab
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const url = item.getAttribute('href');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // Mouse wheel scrolling
    workList.addEventListener('wheel', (e) => {
        e.preventDefault();

        const itemHeight = workItems[0].offsetHeight + 8;
        const delta = Math.sign(e.deltaY);

        updateActiveItem(currentIndex + delta);

        // Smooth scroll to the active item
        workList.scrollTop = currentIndex * itemHeight;
    }, { passive: false });

    // Initialize first item
    updateActiveItem(0);
};

// Initialize work preview
initWorkPreview();

// Mobile work items - simple tap to open
if (isMobile()) {
    const workItems = document.querySelectorAll('.work-item');
    workItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const url = item.getAttribute('href') || item.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    });
}

console.log('Chase Culbertson Portfolio initialized successfully');

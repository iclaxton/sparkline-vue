// Shared mobile menu functionality for all sparkline-vue demo pages
document.addEventListener('DOMContentLoaded', function() {
  // Create mobile menu toggle button if it doesn't exist
  const header = document.querySelector('.header');
  let mobileMenuToggle = document.getElementById('mobileMenuToggle');
  
  if (!mobileMenuToggle && header) {
    // Create the mobile menu toggle button
    mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.id = 'mobileMenuToggle';
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.setAttribute('aria-label', 'Toggle mobile menu');
    
    const menuIcon = document.createElement('span');
    menuIcon.id = 'menuIcon';
    menuIcon.textContent = '☰';
    
    mobileMenuToggle.appendChild(menuIcon);
    header.appendChild(mobileMenuToggle);
  }
  
  const navLinks = document.getElementById('navLinks') || document.querySelector('.nav-links');
  const menuIcon = document.getElementById('menuIcon');
  
  if (mobileMenuToggle && navLinks) {
    // Add ID to nav-links if it doesn't have one
    if (!navLinks.id) {
      navLinks.id = 'navLinks';
    }
    
    mobileMenuToggle.addEventListener('click', function() {
      const isOpen = navLinks.classList.contains('mobile-menu-open');
      
      if (isOpen) {
        // Close menu
        navLinks.classList.remove('mobile-menu-open');
        mobileMenuToggle.classList.remove('menu-open');
        menuIcon.textContent = '☰';
        document.body.style.overflow = '';
      } else {
        // Open menu
        navLinks.classList.add('mobile-menu-open');
        mobileMenuToggle.classList.add('menu-open');
        menuIcon.textContent = '✕';
        document.body.style.overflow = 'hidden';
      }
    });
    
    // Close menu when clicking on nav links
    navLinks.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('mobile-menu-open');
        mobileMenuToggle.classList.remove('menu-open');
        menuIcon.textContent = '☰';
        document.body.style.overflow = '';
      }
    });
    
    // Close menu when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 480 && 
          !navLinks.contains(e.target) && 
          !mobileMenuToggle.contains(e.target) &&
          navLinks.classList.contains('mobile-menu-open')) {
        navLinks.classList.remove('mobile-menu-open');
        mobileMenuToggle.classList.remove('menu-open');
        menuIcon.textContent = '☰';
        document.body.style.overflow = '';
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth > 480 && navLinks.classList.contains('mobile-menu-open')) {
        navLinks.classList.remove('mobile-menu-open');
        mobileMenuToggle.classList.remove('menu-open');
        menuIcon.textContent = '☰';
        document.body.style.overflow = '';
      }
    });
  }
});

// Main JavaScript file for Flask App

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
	console.log('Flask App loaded successfully!');
	
	// Initialize the application
	initApp();
});

// Initialize the application
function initApp() {
	// Add smooth scrolling to navigation links
	addSmoothScrolling();
	
	// Add animation to feature cards
	addFeatureCardAnimations();
	
	// Add form validation if forms exist
	addFormValidation();
}

// Add smooth scrolling to navigation links
function addSmoothScrolling() {
	const navLinks = document.querySelectorAll('.nav-links a');
	
	navLinks.forEach(link => {
		link.addEventListener('click', function(e) {
			const href = this.getAttribute('href');
			
			// Only apply smooth scrolling to same-page links
			if (href.startsWith('#')) {
				e.preventDefault();
				const target = document.querySelector(href);
				if (target) {
					target.scrollIntoView({
						behavior: 'smooth',
						block: 'start'
					});
				}
			}
		});
	});
}

// Add animations to feature cards
function addFeatureCardAnimations() {
	const featureCards = document.querySelectorAll('.feature-card');
	
	// Add intersection observer for scroll animations
	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.style.opacity = '1';
					entry.target.style.transform = 'translateY(0)';
				}
			});
		}, {
			threshold: 0.1
		});
		
		featureCards.forEach(card => {
			card.style.opacity = '0';
			card.style.transform = 'translateY(20px)';
			card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
			observer.observe(card);
		});
	}
}

// Add form validation
function addFormValidation() {
	const forms = document.querySelectorAll('form');
	
	forms.forEach(form => {
		form.addEventListener('submit', function(e) {
			if (!validateForm(this)) {
				e.preventDefault();
			}
		});
	});
}

// Form validation function
function validateForm(form) {
	const inputs = form.querySelectorAll('input[required], textarea[required]');
	let isValid = true;
	
	inputs.forEach(input => {
		if (!input.value.trim()) {
			showError(input, 'This field is required');
			isValid = false;
		} else {
			clearError(input);
		}
	});
	
	return isValid;
}

// Show error message
function showError(input, message) {
	clearError(input);
	
	const errorDiv = document.createElement('div');
	errorDiv.className = 'error-message';
	errorDiv.textContent = message;
	errorDiv.style.color = '#e74c3c';
	errorDiv.style.fontSize = '0.9rem';
	errorDiv.style.marginTop = '0.25rem';
	
	input.parentNode.appendChild(errorDiv);
	input.style.borderColor = '#e74c3c';
}

// Clear error message
function clearError(input) {
	const existingError = input.parentNode.querySelector('.error-message');
	if (existingError) {
		existingError.remove();
	}
	input.style.borderColor = '';
}

// Show message function (called from HTML button)
function showMessage() {
	const messages = [
		'Welcome to Flask App!',
		'Thanks for visiting!',
		'Have a great day!',
		'Flask is awesome!'
	];
	
	const randomMessage = messages[Math.floor(Math.random() * messages.length)];
	
	// Create a toast notification
	showToast(randomMessage);
}

// Show toast notification
function showToast(message) {
	// Remove existing toast if any
	const existingToast = document.querySelector('.toast');
	if (existingToast) {
		existingToast.remove();
	}
	
	// Create toast element
	const toast = document.createElement('div');
	toast.className = 'toast';
	toast.textContent = message;
	
	// Style the toast
	Object.assign(toast.style, {
		position: 'fixed',
		top: '20px',
		right: '20px',
		background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		color: 'white',
		padding: '1rem 2rem',
		borderRadius: '50px',
		boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
		zIndex: '1000',
		transform: 'translateX(100%)',
		transition: 'transform 0.3s ease'
	});
	
	// Add to page
	document.body.appendChild(toast);
	
	// Animate in
	setTimeout(() => {
		toast.style.transform = 'translateX(0)';
	}, 100);
	
	// Remove after 3 seconds
	setTimeout(() => {
		toast.style.transform = 'translateX(100%)';
		setTimeout(() => {
			if (toast.parentNode) {
				toast.remove();
			}
		}, 300);
	}, 3000);
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
	// Add hover effects to buttons
	const buttons = document.querySelectorAll('button');
	buttons.forEach(button => {
		button.addEventListener('mouseenter', function() {
			this.style.transform = 'scale(1.05)';
		});
		
		button.addEventListener('mouseleave', function() {
			this.style.transform = 'scale(1)';
		});
	});
	
	// Add typing effect to hero title
	const heroTitle = document.querySelector('.hero h1');
	if (heroTitle) {
		const text = heroTitle.textContent;
		heroTitle.textContent = '';
		
		let i = 0;
		const typeWriter = () => {
			if (i < text.length) {
				heroTitle.textContent += text.charAt(i);
				i++;
				setTimeout(typeWriter, 100);
			}
		};
		
		// Start typing effect after a short delay
		setTimeout(typeWriter, 500);
	}
});

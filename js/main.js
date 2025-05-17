/**
 * Main JavaScript file for the website
 */

// Constants
const GITHUB_USERNAME = 'sjaykh'; // Your GitHub username
const REPO_NAME = 'sjaykh.github.io'; // GitHub Pages repository name
const BLOGS_PATH = 'blogs'; // Path to blogs folder

// Check if we're running on GitHub Pages (either github.io or custom domain)
function isGitHubPages() {
    // List of known local development hostnames
    const localHostnames = ['localhost', '127.0.0.1', ''];
    
    // If we're on a local hostname, we're not on GitHub Pages
    if (localHostnames.includes(window.location.hostname)) {
        return false;
    }
    
    // Otherwise, assume we're on GitHub Pages (either github.io or custom domain)
    return true;
}

// Log environment information for debugging
console.log('Environment information:');
console.log('- Hostname:', window.location.hostname);
console.log('- Running on GitHub Pages:', isGitHubPages());
console.log('- Full URL:', window.location.href);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the page based on which page we're on
    const featuredPostsContainer = document.getElementById('featured-posts');
    const blogsContainer = document.getElementById('blogs-container');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (featuredPostsContainer) {
        loadFeaturedPosts();
    }
    
    if (blogsContainer) {
        loadAllPosts();
        
        // Set up event listeners for search and filter
        if (searchInput && categoryFilter) {
            searchInput.addEventListener('input', handleSearch);
            categoryFilter.addEventListener('change', handleCategoryFilter);
        }
    }
    
    // Handle newsletter form submission
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
});

// Load featured blog posts for the homepage
async function loadFeaturedPosts() {
    try {
        const featuredPostsContainer = document.getElementById('featured-posts');
        if (!featuredPostsContainer) return;
        
        const posts = await fetchBlogPosts();
        
        // Get the 3 most recent posts as featured
        const featuredPosts = posts.slice(0, 3);
        
        if (featuredPosts.length === 0) {
            featuredPostsContainer.innerHTML = '<p>No featured posts available yet.</p>';
            return;
        }
        
        featuredPostsContainer.innerHTML = '';
        
        // Create HTML for each featured post
        featuredPosts.forEach(post => {
            const postElement = createBlogPostCard(post);
            featuredPostsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading featured posts:', error);
        const featuredPostsContainer = document.getElementById('featured-posts');
        if (featuredPostsContainer) {
            featuredPostsContainer.innerHTML = '<p>Failed to load featured posts. Please try again later.</p>';
        }
    }
}

// Load all blog posts for the blogs page
async function loadAllPosts() {
    try {
        const blogsContainer = document.getElementById('blogs-container');
        if (!blogsContainer) return;
        
        const posts = await fetchBlogPosts();
        
        if (posts.length === 0) {
            blogsContainer.innerHTML = '<p>No blog posts available yet.</p>';
            return;
        }
        
        blogsContainer.innerHTML = '';
        
        // Create HTML for each blog post
        posts.forEach(post => {
            const postElement = createBlogPostCard(post);
            blogsContainer.appendChild(postElement);
        });
        
        // Populate category filter options
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            populateCategoryFilter(posts);
        }
    } catch (error) {
        console.error('Error loading all posts:', error);
        const blogsContainer = document.getElementById('blogs-container');
        if (blogsContainer) {
            blogsContainer.innerHTML = '<p>Failed to load blog posts. Please try again later.</p>';
        }
    }
}

// Fetch blog posts from the index.json file
async function fetchBlogPosts() {
    try {
        // Use relative path for both local and GitHub Pages
        const indexUrl = 'blogs/index.json';
        console.log('Fetching blog index from:', indexUrl);
        
        const response = await fetch(indexUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load blogs index (${response.status})`);
        }
        
        const posts = await response.json();
        console.log(`Loaded ${posts.length} blog posts`);
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => {
            // Parse dates - handle both YYYY-MM-DD and Month DD, YYYY formats
            let dateA = new Date(a.date);
            let dateB = new Date(b.date);
            
            // If date parsing failed, try to parse as YYYY-MM-DD
            if (isNaN(dateA.getTime())) {
                const [yearA, monthA, dayA] = a.date.split('-').map(num => parseInt(num, 10));
                dateA = new Date(yearA, monthA - 1, dayA);
            }
            
            if (isNaN(dateB.getTime())) {
                const [yearB, monthB, dayB] = b.date.split('-').map(num => parseInt(num, 10));
                dateB = new Date(yearB, monthB - 1, dayB);
            }
            
            // Sort newest first
            return dateB - dateA;
        });
        
        return posts;
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return [];
    }
}

// Create a blog post card element
function createBlogPostCard(post) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    
    // Format the date if needed
    const formattedDate = formatDate(post.date);
    
    article.innerHTML = `
        <div class="blog-card-image">
            <img src="${post.image || 'images/blog-placeholder.jpg'}" alt="${post.title}" onerror="this.src='images/blog-placeholder.jpg'">
        </div>
        <div class="blog-card-content">
            <h3 class="blog-card-title"><a href="blog.html?slug=${post.slug}">${post.title}</a></h3>
            <p class="blog-card-excerpt">${post.excerpt}</p>
            <div class="blog-card-meta">
                <span class="blog-card-date">${formattedDate}</span>
                ${post.category ? `<span class="blog-card-category">${post.category}</span>` : ''}
            </div>
        </div>
    `;
    
    return article;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    // If it's already in the desired format, return it
    if (dateString.includes(',')) return dateString;
    
    try {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day);
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
}

// Handle search functionality
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const blogsContainer = document.getElementById('blogs-container');
    
    if (!searchInput || !categoryFilter || !blogsContainer) return;
    
    const searchValue = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    
    const blogCards = blogsContainer.querySelectorAll('.blog-card');
    
    blogCards.forEach(card => {
        const title = card.querySelector('.blog-card-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.blog-card-excerpt').textContent.toLowerCase();
        const categoryElement = card.querySelector('.blog-card-category');
        const category = categoryElement ? categoryElement.textContent : '';
        
        const matchesSearch = title.includes(searchValue) || excerpt.includes(searchValue);
        const matchesCategory = categoryValue === '' || category === categoryValue;
        
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
}

// Handle category filter
function handleCategoryFilter() {
    handleSearch(); // Reuse search logic which also handles category filtering
}

// Populate category filter options
function populateCategoryFilter(posts) {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    // Extract unique categories
    const categories = [...new Set(posts.filter(post => post.category).map(post => post.category))];
    
    // Add options to select element
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Handle newsletter form submission
function handleNewsletterSubmit(event) {
    event.preventDefault();
    const email = event.target.querySelector('input').value;
    
    // In a real implementation, you would send this to a backend service
    // For now, just show an alert
    alert(`Thank you for subscribing with ${email}!`);
    event.target.reset();
}

// Get URL parameters (for blog post page)
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
} 

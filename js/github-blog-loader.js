/**
 * GitHub Blog Loader
 * This script loads blog posts from a GitHub repository.
 * It supports both local development and GitHub Pages deployment.
 */

class GitHubBlogLoader {
    constructor(username, repo, path) {
        this.username = username;
        this.repo = repo;
        this.path = path;
        
        // For GitHub Pages, use direct URLs to the raw content
        if (repo.endsWith('.github.io')) {
            // This is a GitHub Pages site, use URLs relative to the current domain
            this.apiUrl = `https://${username}.github.io/${path}`;
            this.rawContentUrl = `https://${username}.github.io/${path}`;
        } else {
            // Standard GitHub repository
            this.apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
            this.rawContentUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/${path}`;
        }
        
        console.log(`GitHubBlogLoader initialized with API URL: ${this.apiUrl}`);
    }

    /**
     * Fetch all blog posts from the GitHub repository
     * @returns {Promise<Array>} Array of blog post objects
     */
    async fetchBlogPosts() {
        console.log('fetchBlogPosts is deprecated, use fetchPosts instead');
        return this.fetchPosts();
    }

    /**
     * Fetch all blog posts
     * @returns {Promise<Array>} Array of blog post objects
     */
    async fetchPosts() {
        try {
            const isGitHubPages = this.isGitHubPages();
            console.log(`Running on GitHub Pages: ${isGitHubPages}`);
            
            // Use relative path for index.json
            const indexUrl = `${this.path}/index.json`;
            console.log(`Fetching blog index from: ${indexUrl}`);
            
            const response = await fetch(indexUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load blog index: ${response.status} ${response.statusText}`);
            }
            
            const posts = await response.json();
            console.log(`Loaded ${posts.length} blog posts`);
            
            return posts;
        } catch (error) {
            console.error('Error in GitHubBlogLoader.fetchPosts:', error);
            throw error;
        }
    }
    
    /**
     * Check if we're running on GitHub Pages (either github.io or custom domain)
     */
    isGitHubPages() {
        // List of known local development hostnames
        const localHostnames = ['localhost', '127.0.0.1', ''];
        
        // If we're on a local hostname, we're not on GitHub Pages
        if (localHostnames.includes(window.location.hostname)) {
            return false;
        }
        
        // Otherwise, assume we're on GitHub Pages (either github.io or custom domain)
        return true;
    }
}

/**
 * Local Blog Loader
 * This class is used for loading blog posts from a local directory
 */
class LocalBlogLoader {
    constructor(path) {
        this.path = path;
    }
    
    /**
     * Fetch posts from the local index file
     * @returns {Promise<Array>} Array of blog post objects
     */
    async fetchPosts() {
        try {
            console.log(`LocalBlogLoader: Fetching posts from ${this.path}/index.json`);
            
            const indexUrl = `${this.path}/index.json`;
            const response = await fetch(indexUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load blog index: ${response.status} ${response.statusText}`);
            }
            
            const posts = await response.json();
            
            // Sort posts by date (newest first)
            posts.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;  // Descending order (newest first)
            });
            
            console.log(`LocalBlogLoader: Loaded ${posts.length} posts`);
            return posts;
        } catch (error) {
            console.error('Error in LocalBlogLoader.fetchPosts:', error);
            throw error;
        }
    }
    
    /**
     * Backward compatibility method for fetchBlogPosts
     * @returns {Promise<Array>} Array of blog posts
     */
    async fetchBlogPosts() {
        console.warn('fetchBlogPosts is deprecated, use fetchPosts instead');
        return this.fetchPosts();
    }
}

// Export both loaders
window.GitHubBlogLoader = GitHubBlogLoader;
window.LocalBlogLoader = LocalBlogLoader;

class BlogLoader {
    constructor(options = {}) {
        this.path = options.path || 'blogs';
        this.postsPerPage = options.postsPerPage || 10;
        this.currentPage = 1;
        this.totalPosts = 0;
        this.allPosts = [];
        this.filteredPosts = [];
    }
    
    /**
     * Check if we're running on GitHub Pages (either github.io or custom domain)
     */
    isGitHubPages() {
        // List of known local development hostnames
        const localHostnames = ['localhost', '127.0.0.1', ''];
        
        // If we're on a local hostname, we're not on GitHub Pages
        if (localHostnames.includes(window.location.hostname)) {
            return false;
        }
        
        // Otherwise, assume we're on GitHub Pages (either github.io or custom domain)
        return true;
    }
    
    /**
     * Load blog posts from the index file
     */
    async loadPosts() {
        try {
            const isGitHubPages = this.isGitHubPages();
            console.log('Running on GitHub Pages:', isGitHubPages);
            
            // For both GitHub Pages and local development, use relative paths
            const indexUrl = `${this.path}/index.json`;
            
            console.log('Fetching blog index from:', indexUrl);
            
            const response = await fetch(indexUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load blog index: ${response.status} ${response.statusText}`);
            }
            
            const posts = await response.json();
            this.allPosts = posts;
            this.filteredPosts = [...posts];
            this.totalPosts = posts.length;
            
            return posts;
        } catch (error) {
            console.error('Error loading blog posts:', error);
            throw error;
        }
    }

    /**
     * Filter posts by search term
     */
    filterPosts(searchTerm) {
        if (!searchTerm) {
            this.filteredPosts = [...this.allPosts];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredPosts = this.allPosts.filter(post => {
                return (
                    post.title.toLowerCase().includes(term) ||
                    post.excerpt.toLowerCase().includes(term) ||
                    post.author.toLowerCase().includes(term) ||
                    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term)))
                );
            });
        }
        
        this.currentPage = 1;
        return this.filteredPosts;
    }
    
    /**
     * Get posts for the current page
     */
    getPagePosts() {
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        return this.filteredPosts.slice(startIndex, endIndex);
    }
    
    /**
     * Get total number of pages
     */
    getTotalPages() {
        return Math.ceil(this.filteredPosts.length / this.postsPerPage);
    }
    
    /**
     * Set current page
     */
    setPage(page) {
        this.currentPage = page;
    }
}

// Initialize the blog loader if we're on the blogs page
document.addEventListener('DOMContentLoaded', async () => {
    // Only run this script on the blogs page
    const blogEntriesElement = document.getElementById('blog-entries');
    if (!blogEntriesElement) return;
    
    const searchInput = document.getElementById('search-input');
    const paginationElement = document.getElementById('pagination');
    
    // Create blog loader
    const blogLoader = new BlogLoader({
        path: 'blogs',
        postsPerPage: 10
    });
    
    try {
        // Load all posts
        await blogLoader.loadPosts();
        
        // Render initial posts
        renderPosts(blogLoader.getPagePosts());
        renderPagination(blogLoader.getTotalPages(), blogLoader.currentPage);
        
        // Add search functionality
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                const searchTerm = searchInput.value.trim();
                blogLoader.filterPosts(searchTerm);
                renderPosts(blogLoader.getPagePosts());
                renderPagination(blogLoader.getTotalPages(), blogLoader.currentPage);
            }, 300));
        }
    } catch (error) {
        blogEntriesElement.innerHTML = `
            <div class="error">
                <h3>Error Loading Blog Posts</h3>
                <p>${error.message}</p>
                <p>Please try again later.</p>
            </div>
        `;
    }
    
    /**
     * Render blog posts
     */
    function renderPosts(posts) {
        if (posts.length === 0) {
            blogEntriesElement.innerHTML = '<p>No blog posts found matching your search.</p>';
            return;
        }
        
        const postsHTML = posts.map(post => {
            const date = formatDate(post.date);
            return `
                <div class="blog-post-item">
                    <a href="blog.html?slug=${post.slug}" class="blog-post-title">${post.title}</a>
                    <span class="blog-post-date">${date}</span>
                </div>
            `;
        }).join('');
        
        blogEntriesElement.innerHTML = postsHTML;
    }
    
    /**
     * Render pagination
     */
    function renderPagination(totalPages, currentPage) {
        if (!paginationElement) return;
        
        if (totalPages <= 1) {
            paginationElement.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}" 
                ${currentPage === 1 ? 'disabled' : ''}>
                &laquo; Previous
            </button>
        `;
        
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn page-btn ${i === currentPage ? 'active' : ''}" 
                    data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn next-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                ${currentPage === totalPages ? 'disabled' : ''}>
                Next &raquo;
            </button>
        `;
        
        paginationElement.innerHTML = paginationHTML;
        
        // Add event listeners to pagination buttons
        const prevBtn = paginationElement.querySelector('.prev-btn');
        const nextBtn = paginationElement.querySelector('.next-btn');
        const pageButtons = paginationElement.querySelectorAll('.page-btn');
        
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                if (blogLoader.currentPage > 1) {
                    blogLoader.setPage(blogLoader.currentPage - 1);
                    renderPosts(blogLoader.getPagePosts());
                    renderPagination(blogLoader.getTotalPages(), blogLoader.currentPage);
                }
            });
        }
        
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener('click', () => {
                if (blogLoader.currentPage < totalPages) {
                    blogLoader.setPage(blogLoader.currentPage + 1);
                    renderPosts(blogLoader.getPagePosts());
                    renderPagination(blogLoader.getTotalPages(), blogLoader.currentPage);
                }
            });
        }
        
        pageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.dataset.page);
                blogLoader.setPage(page);
                renderPosts(blogLoader.getPagePosts());
                renderPagination(blogLoader.getTotalPages(), blogLoader.currentPage);
            });
        });
    }
    
    /**
     * Format date from YYYY-MM-DD to Month DD, YYYY
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
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
    
    /**
     * Debounce function to limit how often a function can be called
     */
    function debounce(func, delay) {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }
});

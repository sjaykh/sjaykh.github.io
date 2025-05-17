/**
 * Blog List Handler
 * Loads and displays the list of blog posts
 */

document.addEventListener('DOMContentLoaded', function() {
    const blogEntriesContainer = document.getElementById('blog-entries');
    const searchInput = document.getElementById('search-input');
    const paginationContainer = document.getElementById('pagination');
    
    // Number of posts per page
    const postsPerPage = 10;
    let currentPage = 1;
    let allPosts = [];
    let filteredPosts = [];
    
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
    
    // Load blog posts
    async function loadBlogs() {
        try {
            // Initialize the blog loader
            const blogLoader = new LocalBlogLoader('blogs/index.json');
            
            // Fetch all blog posts
            const posts = await blogLoader.fetchPosts();
            
            // Sort posts by date (newest first)
            posts.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;  // Descending order (newest first)
            });
            
            // Display the blog posts
            displayBlogPosts(posts);
        } catch (error) {
            console.error('Error loading blogs:', error);
            document.getElementById('blog-container').innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Blogs</h3>
                    <p>Could not load the blog posts. Please try again later.</p>
                    <p class="error-details">${error.message || 'Unknown error'}</p>
                </div>
            `;
        }
    }
    
    // Format date for display
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
    
    // Display a specific page of posts
    function displayPage(page) {
        // Calculate start and end indices
        const startIndex = (page - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const postsToShow = filteredPosts.slice(startIndex, endIndex);
        
        if (postsToShow.length === 0) {
            blogEntriesContainer.innerHTML = '<div class="no-results">No blog posts found.</div>';
            return;
        }
        
        // Generate HTML for each post
        const postsHTML = postsToShow.map(post => {
            const formattedDate = formatDate(post.date);
            
            return `
                <div class="blog-entry">
                    <h2 class="blog-title">
                        <a href="blog.html?slug=${post.slug}">${post.title}</a>
                    </h2>
                    <div class="blog-meta">
                        <span class="blog-date">${formattedDate}</span>
                        <span class="blog-author">${post.author}</span>
                    </div>
                    <div class="blog-excerpt">${post.excerpt}</div>
                    <a href="blog.html?slug=${post.slug}" class="read-more">Read more →</a>
                </div>
            `;
        }).join('');
        
        blogEntriesContainer.innerHTML = postsHTML;
    }
    
    // Set up pagination
    function setupPagination() {
        if (!paginationContainer) return;
        
        // Calculate total pages
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        // Generate pagination HTML
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
        
        paginationContainer.innerHTML = paginationHTML;
        
        // Add event listeners to pagination buttons
        const prevBtn = paginationContainer.querySelector('.prev-btn');
        const nextBtn = paginationContainer.querySelector('.next-btn');
        const pageButtons = paginationContainer.querySelectorAll('.page-btn');
        
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayPage(currentPage);
                    setupPagination();
                }
            });
        }
        
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    displayPage(currentPage);
                    setupPagination();
                }
            });
        }
        
        pageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.dataset.page);
                currentPage = page;
                displayPage(currentPage);
                setupPagination();
            });
        });
    }
    
    // Set up search functionality
    function setupSearch() {
        if (!searchInput) return;
        
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (searchTerm === '') {
                filteredPosts = [...allPosts];
            } else {
                filteredPosts = allPosts.filter(post => {
                    return (
                        post.title.toLowerCase().includes(searchTerm) ||
                        post.excerpt.toLowerCase().includes(searchTerm) ||
                        post.author.toLowerCase().includes(searchTerm)
                    );
                });
            }
            
            currentPage = 1;
            displayPage(currentPage);
            setupPagination();
        }, 300));
    }
    
    // Debounce function to limit how often a function can be called
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
    
    // Start loading blog posts
    loadBlogs();
}); 

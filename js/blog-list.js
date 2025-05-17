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
    async function loadBlogPosts() {
        try {
            // Show loading state
            if (blogEntriesContainer) {
                blogEntriesContainer.innerHTML = '<div class="loading">Loading blogs...</div>';
            }
            
            // Determine if we're on GitHub Pages
            const onGitHubPages = isGitHubPages();
            console.log('Running on GitHub Pages:', onGitHubPages);
            
            // Use relative path for both local and GitHub Pages with custom domain
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
            
            allPosts = posts;
            filteredPosts = [...posts];
            
            // Display the first page
            displayPage(currentPage);
            
            // Set up pagination
            setupPagination();
            
            // Set up search functionality
            setupSearch();
            
        } catch (error) {
            console.error('Error loading blog posts:', error);
            if (blogEntriesContainer) {
                blogEntriesContainer.innerHTML = `
                    <div class="error">
                        <h3>Error Loading Blog Posts</h3>
                        <p>${error.message}</p>
                        <p>Please try again later.</p>
                    </div>
                    
                    <div class="debugging-info">
                        <h4>Debugging Information</h4>
                        <p>Current URL: ${window.location.href}</p>
                        <p>Hostname: ${window.location.hostname}</p>
                        <p>On GitHub Pages: ${isGitHubPages()}</p>
                    </div>
                `;
            }
        }
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
    
    // Display a page of blog posts
    function displayPage(page) {
        if (!blogEntriesContainer) return;
        
        // Calculate start and end indices
        const startIndex = (page - 1) * postsPerPage;
        const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length);
        
        // Get posts for the current page
        const postsToDisplay = filteredPosts.slice(startIndex, endIndex);
        
        if (postsToDisplay.length === 0) {
            blogEntriesContainer.innerHTML = '<div class="no-results">No blog posts found.</div>';
            return;
        }
        
        // Generate HTML for each post
        const postsHTML = postsToDisplay.map(post => {
            return `
                <div class="blog-entry">
                    <h2 class="blog-title">
                        <a href="blog.html?slug=${post.slug}">${post.title}</a>
                    </h2>
                    <div class="blog-meta">
                        <span class="blog-date">${formatDate(post.date)}</span>
                        <span class="blog-author">${post.author}</span>
                    </div>
                    <div class="blog-excerpt">
                        <p>${post.excerpt}</p>
                    </div>
                    <a href="blog.html?slug=${post.slug}" class="read-more">Read more</a>
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
    if (blogEntriesContainer) {
        loadBlogPosts();
    }
}); 

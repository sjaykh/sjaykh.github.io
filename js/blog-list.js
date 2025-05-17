/**
 * Simple Blog List Script
 * Loads and displays blog posts from blogs/index.json
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get the blog entries container
    const blogEntriesContainer = document.getElementById('blog-entries');
    if (!blogEntriesContainer) {
        console.error('Blog entries container not found');
        return;
    }
    
    // Show loading state
    blogEntriesContainer.innerHTML = '<div class="loading">Loading blogs...</div>';
    
    // Determine if we're on GitHub Pages (with or without custom domain)
    const isGitHubPages = window.location.hostname.includes('github.io') || 
                         !window.location.hostname.includes('localhost');
    const isCustomDomain = isGitHubPages && !window.location.hostname.includes('github.io');
    
    // Set the URL to fetch the blog index
    let indexUrl = 'blogs/index.json';
    
    // If on GitHub Pages with custom domain, try the current domain first
    if (isCustomDomain) {
        indexUrl = `${window.location.origin}/blogs/index.json`;
    }
    // If on GitHub Pages with github.io domain, use raw GitHub content URL
    else if (isGitHubPages) {
        const ghUsername = 'sjaykh';
        const ghRepo = 'sjaykh.github.io';
        indexUrl = `https://raw.githubusercontent.com/${ghUsername}/${ghRepo}/main/blogs/index.json`;
    }
    
    console.log('Fetching blog index from:', indexUrl);
    
    // Fetch the blog index
    fetch(indexUrl)
        .then(response => {
            // If fetch fails and we're on a custom domain, try the raw GitHub URL
            if (!response.ok && isCustomDomain) {
                console.log('Failed to fetch from custom domain, trying raw GitHub URL');
                const ghUsername = 'sjaykh';
                const ghRepo = 'sjaykh.github.io';
                indexUrl = `https://raw.githubusercontent.com/${ghUsername}/${ghRepo}/main/blogs/index.json`;
                console.log('Fetching from:', indexUrl);
                return fetch(indexUrl);
            }
            return response;
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load blogs index (${response.status})`);
            }
            return response.json();
        })
        .then(blogs => {
            console.log('Loaded blog posts:', blogs.length);
            
            // Sort blogs by date (newest first)
            blogs.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            // Display the blogs
            displayBlogs(blogs, blogEntriesContainer);
            
            // Set up search functionality
            setupSearch(blogs, blogEntriesContainer);
        })
        .catch(error => {
            console.error('Error loading blog posts:', error);
            blogEntriesContainer.innerHTML = `
                <div class="error">
                    <h3>Error Loading Blog Posts</h3>
                    <p>${error.message}</p>
                    <p>Please try again later.</p>
                    <div class="debug-section">
                        <h3>Debugging Information</h3>
                        <p>Current URL: ${window.location.href}</p>
                        <p>Blogs path: blogs</p>
                        <p>Files in blogs directory: Blog loader script found</p>
                        <p>Available blog loaders: LocalBlogLoader, GitHubBlogLoader</p>
                    </div>
                </div>
            `;
        });
});

/**
 * Display blogs in the container
 * @param {Array} blogs - Array of blog objects
 * @param {HTMLElement} container - Container element to display blogs in
 */
function displayBlogs(blogs, container) {
    if (blogs.length === 0) {
        container.innerHTML = '<p>No blog posts found.</p>';
        return;
    }
    
    // Create HTML for blogs
    const blogsHtml = blogs.map(blog => {
        const date = new Date(blog.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="blog-post-item">
                <a href="blog.html?slug=${blog.slug}" class="blog-post-title">${blog.title}</a>
                <span class="blog-post-date">${formattedDate}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = blogsHtml;
}

/**
 * Set up search functionality
 * @param {Array} blogs - Array of blog objects
 * @param {HTMLElement} container - Container element to display blogs in
 */
function setupSearch(blogs, container) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            displayBlogs(blogs, container);
            return;
        }
        
        // Filter blogs by search term
        const filteredBlogs = blogs.filter(blog => {
            return (
                blog.title.toLowerCase().includes(searchTerm) ||
                (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm))
            );
        });
        
        displayBlogs(filteredBlogs, container);
    });
} 

// DOM Elements for blog post page
const blogTitle = document.getElementById('blog-title');
const blogDate = document.getElementById('blog-date');
const blogAuthor = document.getElementById('blog-author');
// blogCategory element removed as it's no longer displayed
const blogImage = document.getElementById('blog-image');
const blogContent = document.getElementById('blog-content');
const prevPost = document.getElementById('prev-post');
const nextPost = document.getElementById('next-post');

// Function to format date from YYYY-MM-DD to Month DD, YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    
    // Check if it's already in the desired format
    if (dateString.includes(',')) return dateString;
    
    try {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day);
        
        // Format the date as "Month DD, YYYY"
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString; // Return original if there's an error
    }
}

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

// Initialize the blog post page
document.addEventListener('DOMContentLoaded', () => {
    // Get the blog ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id') || urlParams.get('slug');
    
    if (!blogId) {
        document.getElementById('blog-content').innerHTML = '<p>Blog post not found. No ID specified.</p>';
        return;
    }
    
    console.log('Loading blog post with ID:', blogId);
    
    // Fetch the blog index to get the blog metadata
    const indexUrl = 'blogs/index.json';
    console.log('Fetching blog index from:', indexUrl);
    
    fetch(indexUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load blogs index (${response.status})`);
            }
            return response.json();
        })
        .then(blogs => {
            // Find the blog post with the matching slug
            const blog = blogs.find(b => b.slug === blogId);
            
            if (!blog) {
                blogContent.innerHTML = `
                    <p>Blog post not found with ID: ${blogId}</p>
                    <p>Available posts: ${blogs.map(b => b.slug).join(', ')}</p>
                `;
                return;
            }
            
            console.log('Found blog post:', blog);
            
            // Update the page title and metadata
            document.title = blog.title + ' - Sanjay Krishna';
            blogTitle.textContent = blog.title;
            blogDate.textContent = formatDate(blog.date);
            blogAuthor.textContent = blog.author;
            
            // Check if we're on GitHub Pages with custom domain
            const isCustomDomain = window.location.hostname !== 'localhost' && 
                                   window.location.hostname !== '127.0.0.1' &&
                                   !window.location.hostname.includes('github.io');
            
            if (isCustomDomain) {
                console.log('Custom domain detected, using GitHub API');
                
                // Get the file path relative to repository root
                let filePath = blog.path;
                if (filePath.startsWith('/')) {
                    filePath = filePath.substring(1);
                }
                
                // Use GitHub API to fetch content
                const ghUsername = 'sjaykh';
                const ghRepo = 'sjaykh.github.io';
                const apiUrl = `https://api.github.com/repos/${ghUsername}/${ghRepo}/contents/${filePath}`;
                
                console.log('Fetching from GitHub API:', apiUrl);
                
                return fetch(apiUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`GitHub API error: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // GitHub API returns content as base64
                        const content = atob(data.content);
                        return processContent(content, blog);
                    });
            } else {
                // For local development or github.io, use direct fetch
                let contentUrl = blog.path;
                if (contentUrl.startsWith('/')) {
                    contentUrl = contentUrl.substring(1);
                }
                
                console.log('Fetching content directly:', contentUrl);
                
                return fetch(contentUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load content: ${response.status}`);
                        }
                        return response.text();
                    })
                    .then(content => processContent(content, blog));
            }
        })
        .catch(error => {
            console.error('Error loading blog post:', error);
            blogContent.innerHTML = `
                <div class="error">
                    <h3>Error Loading Blog Post</h3>
                    <p>${error.message}</p>
                    <p>Please try again later.</p>
                    <p>Debug info: Looking for post with ID '${blogId}'</p>
                </div>
            `;
        });
});

/**
 * Process blog content - parse markdown and apply fixes
 */
function processContent(content, blog) {
    // Configure marked for proper rendering
    marked.setOptions({
        breaks: true,
        gfm: true
    });
    
    // For markdown files, parse the content
    let htmlContent;
    if (blog.path.endsWith('.md')) {
        // Remove frontmatter from markdown
        const cleanContent = content.replace(/^---[\s\S]*?---\n/, '');
        htmlContent = marked.parse(cleanContent);
    } else {
        // For HTML files, use as is
        htmlContent = content;
    }
    
    // Fix image paths
    htmlContent = htmlContent.replace(/src="\.\.\/images\//g, 'src="images/');
    htmlContent = htmlContent.replace(/src="\.\/images\//g, 'src="images/');
    
    // Display the content
    blogContent.innerHTML = htmlContent;
    
    // Setup post navigation
    setupPostNavigation(blogs, blog);
    
    // Process images and links
    enhanceContentDisplay();
    
    return blog;
}

/**
 * Enhance images and links in the blog content
 */
function enhanceContentDisplay() {
    // Process images for better display
    const images = document.getElementById('blog-content').querySelectorAll('img');
    images.forEach(img => {
        // Add loading="lazy" for better performance
        img.setAttribute('loading', 'lazy');
        
        // Add class for styling
        img.classList.add('blog-image');
        
        // Wrap single images in paragraphs with a class for better styling
        if (img.parentNode.nodeName === 'P' && 
            img.parentNode.childNodes.length === 1) {
            img.parentNode.classList.add('image-container');
        }
    });
    
    // Add target="_blank" to all external links
    const links = document.getElementById('blog-content').querySelectorAll('a');
    links.forEach(link => {
        if (link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// Set up navigation to previous and next posts
function setupPostNavigation(posts, currentPost) {
    // Find the index of the current post
    const currentIndex = posts.findIndex(post => post.slug === currentPost.slug);
    
    // If there's a previous post
    if (currentIndex > 0) {
        const previous = posts[currentIndex - 1];
        prevPost.innerHTML = `<a href="blog.html?slug=${previous.slug}"><i class="fas fa-arrow-left"></i> ${previous.title}</a>`;
        prevPost.style.display = 'block';
    } else {
        prevPost.style.display = 'none';
    }
    
    // If there's a next post
    if (currentIndex < posts.length - 1) {
        const next = posts[currentIndex + 1];
        nextPost.innerHTML = `<a href="blog.html?slug=${next.slug}">${next.title} <i class="fas fa-arrow-right"></i></a>`;
        nextPost.style.display = 'block';
    } else {
        nextPost.style.display = 'none';
    }
}

// Get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
} 

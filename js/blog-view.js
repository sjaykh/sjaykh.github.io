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
    // Get the blog ID from the URL query parameter (support both 'id' and 'slug' parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id') || urlParams.get('slug');
    
    if (!blogId) {
        document.getElementById('blog-content').innerHTML = '<p>Blog post not found. No ID specified.</p>';
        return;
    }
    
    console.log('Loading blog post with ID:', blogId);
    
    // Determine if we're on GitHub Pages (including custom domain)
    const onGitHubPages = isGitHubPages();
    console.log('Running on GitHub Pages:', onGitHubPages);
    
    // Fetch the blog index to get the blog metadata
    let indexUrl = 'blogs/index.json';
    
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
                document.getElementById('blog-content').innerHTML = `
                    <p>Blog post not found with ID: ${blogId}</p>
                    <p>Available posts: ${blogs.map(b => b.slug).join(', ')}</p>
                `;
                return;
            }
            
            console.log('Found blog post:', blog);
            
            // Update the page title and metadata
            document.title = blog.title + ' - Sanjay Krishna';
            document.getElementById('blog-title').textContent = blog.title;
            document.getElementById('blog-date').textContent = formatDate(blog.date);
            document.getElementById('blog-author').textContent = blog.author;
            
            // Fetch content using GitHub API if on custom domain
            return fetchBlogContentUsingGitHubAPI(blog)
                .then(content => {
                    // Configure marked for proper rendering
                    marked.setOptions({
                        breaks: true,
                        gfm: true
                    });
                    
                    // Parse the markdown content
                    try {
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
                        
                        // Fix image paths after parsing
                        let fixedHtml = htmlContent;
                        
                        // Fix relative image paths
                        fixedHtml = fixedHtml.replace(/src="\.\.\/images\//g, 'src="images/');
                        fixedHtml = fixedHtml.replace(/src="\.\/images\//g, 'src="images/');
                        
                        // Display the content
                        document.getElementById('blog-content').innerHTML = fixedHtml;
                        
                        // Setup post navigation
                        setupPostNavigation(blogs, blog);
                        
                        // Process images and links
                        enhanceContentDisplay();
                        
                        return blog;
                    } catch (parseError) {
                        console.error('Error parsing markdown:', parseError);
                        throw parseError;
                    }
                });
        })
        .catch(error => {
            console.error('Error loading blog post:', error);
            document.getElementById('blog-content').innerHTML = `
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
 * Fetch blog content using GitHub API directly if on custom domain
 * This should work more reliably than using relative paths
 */
async function fetchBlogContentUsingGitHubAPI(blog) {
    try {
        console.log('Fetching blog content for:', blog.slug);
        
        // Handle both relative and absolute paths
        let filePath = blog.path;
        
        // Remove leading slash if present
        if (filePath.startsWith('/')) {
            filePath = filePath.substring(1);
        }
        
        // Determine if we're running on custom domain or github.io
        const isGitHubPages = !['localhost', '127.0.0.1', ''].includes(window.location.hostname);
        const isCustomDomain = isGitHubPages && !window.location.hostname.includes('github.io');
        
        console.log('Running on GitHub Pages:', isGitHubPages);
        console.log('Running on custom domain:', isCustomDomain);
        
        let contentUrl;
        
        if (isCustomDomain) {
            // For custom domains, use the GitHub API to fetch content directly
            const username = 'sjaykh';
            const repo = 'sjaykh.github.io';
            
            // First try the Raw Content URL as it's more reliable
            contentUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/${filePath}`;
            console.log('Trying GitHub raw URL:', contentUrl);
            
            try {
                const response = await fetch(contentUrl, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'text/plain, text/markdown',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    console.log(`Successfully fetched ${content.length} bytes from Raw GitHub`);
                    return content;
                }
                
                console.warn(`Raw GitHub fetch failed with status ${response.status}, trying API fallback`);
            } catch (error) {
                console.warn('Error fetching from Raw GitHub, trying API fallback:', error);
            }
            
            // Fallback to GitHub API
            const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;
            console.log('Falling back to GitHub API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                cache: 'no-store',
                headers: {
                    'Accept': 'application/vnd.github.v3.raw',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch from GitHub API: ${response.status} ${response.statusText}`);
            }
            
            const content = await response.text();
            console.log(`Successfully fetched ${content.length} bytes from GitHub API`);
            return content;
        } else {
            // For github.io or local development, use relative paths
            contentUrl = new URL(filePath, window.location.origin).href;
            console.log('Using relative URL:', contentUrl);
            
            const response = await fetch(contentUrl, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch blog content: ${response.status} ${response.statusText}`);
            }
            
            const content = await response.text();
            console.log(`Successfully fetched ${content.length} bytes`);
            return content;
        }
    } catch (error) {
        console.error('Error fetching blog content:', error);
        throw new Error(`Failed to load blog content: ${error.message}`);
    }
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
    
    // Style blockquotes
    const blockquotes = document.getElementById('blog-content').querySelectorAll('blockquote');
    blockquotes.forEach(blockquote => {
        // Check if this is a nested blockquote
        if (blockquote.querySelector('blockquote')) {
            blockquote.classList.add('outer-quote');
            
            // Find all nested blockquotes and add a class
            const nestedQuotes = blockquote.querySelectorAll('blockquote');
            nestedQuotes.forEach(nested => {
                nested.classList.add('nested-quote');
            });
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

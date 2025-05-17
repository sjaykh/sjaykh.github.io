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
    
    // Determine if we're on GitHub Pages (with or without custom domain)
    const isGitHubPages = window.location.hostname.includes('github.io') || 
                         !window.location.hostname.includes('localhost');
    const isCustomDomain = isGitHubPages && !window.location.hostname.includes('github.io');
    
    // Fetch the blog index to get the blog metadata
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
            
            // Determine the URL to fetch the blog content
            let contentUrl = blog.path;
            
            // If on GitHub Pages with custom domain, try the current domain first
            if (isCustomDomain) {
                // Remove any leading slash and 'blogs/' prefix if it exists
                const cleanPath = blog.path.startsWith('/') ? blog.path.substring(1) : blog.path;
                contentUrl = `${window.location.origin}/${cleanPath}`;
            }
            // If on GitHub Pages with github.io domain, use raw GitHub content URL
            else if (isGitHubPages) {
                const ghUsername = 'sjaykh';
                const ghRepo = 'sjaykh.github.io';
                
                // Remove any leading slash
                const cleanPath = blog.path.startsWith('/') ? blog.path.substring(1) : blog.path;
                
                contentUrl = `https://raw.githubusercontent.com/${ghUsername}/${ghRepo}/main/${cleanPath}`;
            }
            
            console.log('Fetching blog content from:', contentUrl);
            
            // Fetch the blog content
            return fetch(contentUrl)
                .then(response => {
                    // If fetch fails and we're on a custom domain, try the raw GitHub URL
                    if (!response.ok && isCustomDomain) {
                        console.log('Failed to fetch from custom domain, trying raw GitHub URL');
                        const ghUsername = 'sjaykh';
                        const ghRepo = 'sjaykh.github.io';
                        
                        // Remove any leading slash
                        const cleanPath = blog.path.startsWith('/') ? blog.path.substring(1) : blog.path;
                        
                        const rawUrl = `https://raw.githubusercontent.com/${ghUsername}/${ghRepo}/main/${cleanPath}`;
                        console.log('Fetching from:', rawUrl);
                        return fetch(rawUrl);
                    }
                    return response;
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load blog content from ${contentUrl} (${response.status})`);
                    }
                    return response.text();
                })
                .then(markdown => {
                    // Remove frontmatter from markdown
                    const content = markdown.replace(/^---[\s\S]*?---\n/, '');
                    
                    // Configure marked for proper rendering
                    marked.setOptions({
                        breaks: true,
                        gfm: true
                    });
                    
                    // Parse the markdown content directly without custom renderers
                    try {
                        const htmlContent = marked.parse(content);
                        
                        // Fix image paths after parsing
                        let fixedHtml = htmlContent;
                        
                        // If on GitHub Pages, use absolute URLs for images
                        if (isGitHubPages) {
                            let baseUrl;
                            
                            if (isCustomDomain) {
                                // For custom domain, use the current domain
                                baseUrl = `${window.location.origin}/`;
                            } else {
                                // For github.io domain, use raw GitHub content URL
                                const ghUsername = 'sjaykh';
                                const ghRepo = 'sjaykh.github.io';
                                baseUrl = `https://raw.githubusercontent.com/${ghUsername}/${ghRepo}/main/`;
                            }
                            
                            // Replace relative image paths with absolute URLs
                            fixedHtml = fixedHtml.replace(/src="\.\.\/images\//g, `src="${baseUrl}images/`);
                            fixedHtml = fixedHtml.replace(/src="\.\/images\//g, `src="${baseUrl}images/`);
                            fixedHtml = fixedHtml.replace(/src="images\//g, `src="${baseUrl}images/`);
                        } else {
                            // For local development, just fix relative paths
                            fixedHtml = fixedHtml.replace(/src="\.\.\/images\//g, 'src="images/');
                            fixedHtml = fixedHtml.replace(/src="\.\/images\//g, 'src="images/');
                        }
                        
                        // Display the content
                        document.getElementById('blog-content').innerHTML = fixedHtml;
                        
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

// Add debug function to help troubleshoot issues
function addDebugInfo(container) {
    // Create debug section
    const debugSection = document.createElement('div');
    debugSection.className = 'debug-section';
    debugSection.innerHTML = `
        <h3>Debugging Information</h3>
        <div class="debug-log">Current URL: ${window.location.href}</div>
        <div class="debug-log">Requested slug: ${getUrlParameter('slug')}</div>
        <div class="debug-log">Blogs path: ${blogLoader.path}</div>
        <div class="debug-log">Available blog loaders: ${window.LocalBlogLoader ? 'LocalBlogLoader' : 'None'}, 
            ${window.GitHubBlogLoader ? 'GitHubBlogLoader' : 'None'}</div>
        <div class="debug-log">Index file: ${blogLoader.indexFile}</div>
    `;
    
    container.appendChild(debugSection);
    
    // Try to check actual blog files
    try {
        fetch(blogLoader.indexFile)
            .then(response => {
                const debugLog = document.createElement('div');
                debugLog.className = 'debug-log';
                
                if (response.ok) {
                    response.json().then(data => {
                        if (data && data.posts) {
                            debugLog.innerHTML = `Index file loaded successfully. Contains ${data.posts.length} posts.`;
                            const slugs = data.posts.map(p => p.name.replace(/\.(html|md)$/, '')).join(', ');
                            
                            const slugsList = document.createElement('div');
                            slugsList.className = 'debug-log';
                            slugsList.innerHTML = `Available slugs: ${slugs}`;
                            debugSection.appendChild(slugsList);
                        } else {
                            debugLog.innerHTML = 'Index file found but has no posts data';
                            debugLog.classList.add('error-log');
                        }
                    }).catch(err => {
                        debugLog.innerHTML = `Error parsing index file: ${err.message}`;
                        debugLog.classList.add('error-log');
                    });
                } else {
                    debugLog.innerHTML = `Index file not found (${response.status} ${response.statusText})`;
                    debugLog.classList.add('error-log');
                }
                
                debugSection.appendChild(debugLog);
            })
            .catch(err => {
                const debugLog = document.createElement('div');
                debugLog.className = 'debug-log error-log';
                debugLog.innerHTML = `Error checking index file: ${err.message}`;
                debugSection.appendChild(debugLog);
            });
    } catch (e) {
        console.error('Error in debug section:', e);
    }
}

// Load the blog post content
async function loadBlogPost() {
    try {
        // Get the slug from URL parameter
        const slug = getUrlParameter('slug');
        
        if (!slug) {
            console.warn('No slug parameter found in URL, redirecting to blogs listing');
            window.location.href = 'blogs.html';
            return;
        }
        
        // Show loading state
        blogContent.innerHTML = '<p class="loading">Loading blog content...</p>';
        
        // Get all blog posts
        const posts = await fetchBlogPosts();
        console.log('Fetched all blog posts:', posts.length);
        
        // Find the current post by slug
        const currentPost = posts.find(post => post.slug === slug);
        
        if (!currentPost) {
            console.error('Blog post not found for slug:', slug);
            blogContent.innerHTML = `
                <div class="error">
                    <h3>Blog Post Not Found</h3>
                    <p>The requested blog post could not be found.</p>
                    <div class="hint">Check the URL and try again.</div>
                </div>
            `;
            
            // Add debug info to help troubleshoot
            addDebugInfo(blogContent);
            return;
        }
        
        
        // Update page title
        document.title = `${currentPost.title} - Sanjay Krishna`;
        
        // Populate blog post data
        blogTitle.textContent = currentPost.title;
        blogDate.textContent = formatDate(currentPost.date);
        blogAuthor.textContent = currentPost.author;
        
        // Set featured image
        if (currentPost.image) {
            blogImage.src = currentPost.image;
            blogImage.alt = currentPost.title;
            blogImage.style.display = 'block';
        }
        
        // Display the blog content
        if (currentPost.content) {
            blogContent.innerHTML = currentPost.content;
        } else {
            // Try to fetch the content directly from the file
            try {
                const content = await fetchBlogContent(currentPost);
                if (content) {
                    blogContent.innerHTML = content;
                } else {
                    blogContent.innerHTML = '<p>Failed to load blog content. Please try again later.</p>';
                }
            } catch (error) {
                console.error('Error loading blog content:', error);
                blogContent.innerHTML = `
                    <div class="error">
                        <h3>Unable to Load Content</h3>
                        <p class="hint">There was an error loading the blog content: ${error.message}</p>
                    </div>
                `;
            }
        }
        
        // Set up navigation to previous and next posts
        setupPostNavigation(posts, currentPost);
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        blogContent.innerHTML = `
            <div class="error">
                <h3>Failed to Load Blog Post</h3>
                <p class="hint">${error.message || 'Please try again later.'}</p>
            </div>
        `;
        
        // Add debug info to help troubleshoot
        addDebugInfo(blogContent);
    }
}

// Fetch blog posts using the LocalBlogLoader
async function fetchBlogPosts() {
    try {
        // Use the blog loader to fetch posts
        const posts = await blogLoader.fetchPosts();
        
        // For each post, make sure it has a slug
        posts.forEach(post => {
            if (!post.slug) {
                post.slug = post.name ? post.name.replace(/\.(html|md)$/, '') : '';
            }
        });
        
        console.log(`Loaded ${posts.length} blog posts`);
        return posts;
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
    }
}

/**
 * Fetch and display a blog post's content
 * @param {Object} post - Blog post metadata
 * @returns {Promise<string>} HTML content of the blog post
 */
async function fetchBlogContent(post) {
    try {
        // Handle both relative and absolute paths
        let filePath = post.path;
        let fullUrl;
        
        // Create GitHub Pages URL
        if (window.location.hostname.includes('github.io')) {
            // Direct fetch from GitHub raw content
            const ghUsername = 'sjaykh';
            const ghRepo = 'sjaykh.github.io';
            
            // Remove leading slash if present
            if (filePath.startsWith('/')) {
                filePath = filePath.substring(1);
            }
            
            // Use raw.githubusercontent.com for direct content access
            fullUrl = `https://raw.githubusercontent.com/${ghUsername}/${ghRepo}/main/${filePath}`;
            console.log(`Trying to fetch blog from GitHub raw content: ${fullUrl}`);
        } else {
            // Local development
            if (filePath.startsWith('/')) {
                filePath = filePath.substring(1);
            }
            fullUrl = new URL(filePath, window.location.origin).href;
            console.log(`Trying to fetch blog locally: ${fullUrl}`);
        }
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
            console.error(`Failed to fetch blog ${fullUrl}: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch blog: ${response.status} ${response.statusText}`);
        }
        
        const content = await response.text();
        
        // Process Markdown files
        if (post.path.endsWith('.md')) {
            // Remove frontmatter and convert to HTML
            const cleanContent = content.replace(/---[\s\S]*?---/, '').trim();
            const html = marked.parse(cleanContent);
            
            return html;
        }
        
        // Process HTML files (if any)
        let htmlContent = content;
        
        // Extract content from article tag if available
        const articleMatch = htmlContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
        if (articleMatch && articleMatch[1]) {
            htmlContent = articleMatch[1];
        } else {
            // Extract content from body tag if available
            const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch && bodyMatch[1]) {
                // Filter out any script tags
                htmlContent = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '');
            }
        }
        
        return htmlContent;
    } catch (error) {
        console.error('Error fetching blog content:', error);
        return `<div class="error-message">
                    <h3>Error Loading Blog Post</h3>
                    <p>Could not load the blog post content. Please try again later.</p>
                    <p class="error-details">${error.message || 'Unknown error'}</p>
                </div>`;
    }
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

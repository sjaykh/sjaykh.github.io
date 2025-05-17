/**
 * GitHub Blog Loader
 * 
 * A simplified loader that works with both GitHub Pages and local development
 */

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

// Fetch blog posts from the index file
async function fetchBlogPosts(path = 'blogs') {
    try {
        // Use relative path for both local and GitHub Pages
        const indexUrl = `${path}/index.json`;
        console.log('Fetching blog index from:', indexUrl);
        
        const response = await fetch(indexUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load blogs index (${response.status})`);
        }
        
        const posts = await response.json();
        console.log(`Loaded ${posts.length} blog posts`);
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        
        return posts;
    } catch (error) {
        console.error('Error loading blog posts:', error);
        throw error;
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

// Fetch a single blog post by slug
async function fetchBlogPost(slug, path = 'blogs') {
    try {
        // First get all posts to find the one with matching slug
        const posts = await fetchBlogPosts(path);
        const post = posts.find(p => p.slug === slug);
        
        if (!post) {
            throw new Error(`Blog post with slug "${slug}" not found`);
        }
        
        // Now fetch the actual content
        const contentUrl = post.path;
        console.log('Fetching blog content from:', contentUrl);
        
        const response = await fetch(contentUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load blog content from ${contentUrl} (${response.status})`);
        }
        
        const content = await response.text();
        
        // Return both the post metadata and content
        return {
            ...post,
            content
        };
    } catch (error) {
        console.error('Error fetching blog post:', error);
        throw error;
    }
}

// Export functions for use in other files
window.BlogUtils = {
    isGitHubPages,
    fetchBlogPosts,
    fetchBlogPost,
    formatDate
};

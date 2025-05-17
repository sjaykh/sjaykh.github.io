// Constants
const GITHUB_USERNAME = 'gourikartha'; // Your actual GitHub username
const REPO_NAME = 'gourikartha.github.io'; // Changed from 'webs' to the GitHub Pages repository name
const BLOGS_PATH = 'blogs'; // Path to your blogs folder in the repository

// Initialize blog loaders
const githubBlogLoader = new GitHubBlogLoader(GITHUB_USERNAME, REPO_NAME, BLOGS_PATH);
const localBlogLoader = new LocalBlogLoader(BLOGS_PATH);

// DOM Elements
const featuredPostsContainer = document.getElementById('featured-posts');
const blogsContainer = document.getElementById('blogs-container');
const blogEntriesContainer = document.getElementById('blog-entries');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the page based on which page we're on
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
        featuredPostsContainer.innerHTML = '<p>Failed to load featured posts. Please try again later.</p>';
    }
}

// Load all blog posts for the blogs page
async function loadAllPosts() {
    try {
        const posts = await fetchBlogPosts();
        
        if (posts.length === 0) {
            if (blogsContainer) {
                blogsContainer.innerHTML = '<p>No blog posts available yet.</p>';
            }
            return;
        }
        
        if (blogsContainer) {
            blogsContainer.innerHTML = '';
            
            // Create HTML for each blog post
            posts.forEach(post => {
                const postElement = createBlogPostCard(post);
                blogsContainer.appendChild(postElement);
            });
            
            // Populate category filter options
            if (categoryFilter) {
                populateCategoryFilter(posts);
            }
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        if (blogsContainer) {
            blogsContainer.innerHTML = '<p>Failed to load blog posts. Please try again later.</p>';
        }
    }
}

// Fetch blog posts from local directory or GitHub repository
async function fetchBlogPosts() {
    try {
        // Try to fetch posts from GitHub first
        try {
            const posts = await githubBlogLoader.fetchBlogPosts();
            if (posts && posts.length > 0) {
                console.log(`Loaded ${posts.length} posts from GitHub repository`);
                return posts;
            }
        } catch (githubError) {
            console.warn('Failed to load posts from GitHub:', githubError);
        }
        
        // Try local loader as fallback
        try {
            const posts = await localBlogLoader.fetchBlogPosts();
            if (posts && posts.length > 0) {
                console.log(`Loaded ${posts.length} posts from local directory`);
                return posts;
            }
        } catch (localError) {
            console.warn('Failed to load posts from local directory:', localError);
        }
        
        // If both methods fail, use hardcoded posts
        const hardcodedPosts = [
            {
                id: 'sample-post-1',
                title: 'Exploring Kochi in a Day',
                date: "2025-05-07",
                author: 'Gouri Kartha',
                category: 'Travel',
                excerpt: 'Join me on a memorable journey through the scenic gems of Kochi as I explore this beautiful city in just one day.',
                image: 'images/blog-placeholder.jpg',
                tags: ['travel', 'india', 'kochi'],
                slug: 'exploring-kochi-in-a-day',
                path: '#',
                content: `
                    <h2>Exploring Kochi in a Day</h2>
                    <p>Welcome to this virtual tour of Kochi, a beautiful coastal city in Kerala, India. Known for its rich history and cultural diversity, Kochi offers a unique blend of colonial heritage, traditional art forms, and natural beauty.</p>
                    
                    <h3>Morning: Fort Kochi and Chinese Fishing Nets</h3>
                    <p>Start your day at the iconic Chinese fishing nets at Fort Kochi beach. These massive cantilever nets, believed to have been introduced by Chinese traders around the 14th century, create a stunning silhouette against the morning sun. Watch the fishermen operate these nets using a traditional technique that has remained unchanged for centuries.</p>
                    
                    <h3>Midday: Historical Landmarks</h3>
                    <p>After a delightful breakfast of puttu and kadala curry at a local café, head to St. Francis Church, the oldest European church in India, built in 1503. Don't miss the Dutch Palace (Mattancherry Palace) with its stunning murals depicting scenes from the Ramayana and Mahabharata.</p>
                    
                    <h3>Afternoon: Cultural Experiences</h3>
                    <p>Spend your afternoon exploring the Jewish Synagogue in the historic Jew Town, home to antique shops and spice markets. Experience a traditional Kathakali performance, Kerala's classical dance form that combines elaborate costumes, expressive gestures, and live music.</p>
                    
                    <h3>Evening: Sunset Cruise and Seafood</h3>
                    <p>End your day with a sunset cruise on the backwaters, offering a different perspective of this coastal city. Finally, treat yourself to a sumptuous seafood dinner at one of the many restaurants lining the shore.</p>
                    
                    <p>While one day is hardly enough to fully experience all that Kochi has to offer, this itinerary gives you a taste of the city's diverse attractions. Next time, I hope to stay longer and explore more of Kerala's backwaters and the beautiful countryside beyond.</p>
                `
            },
            {
                id: 'sample-post-2',
                title: 'Getting Started With Blogging',
                date: "2025-04-15",
                author: 'Gouri Kartha',
                category: 'Writing',
                excerpt: 'Tips and tricks for starting your own successful blog.',
                image: 'images/blog-placeholder.jpg',
                tags: ['writing', 'blogging', 'tips'],
                slug: 'getting-started-with-blogging',
                path: '#',
                content: `
                    <h2>Getting Started With Blogging</h2>
                    <p>Blogging is a wonderful way to share your thoughts, experiences, and expertise with the world. Whether you're passionate about travel, food, technology, or poetry, a blog gives you a platform to express yourself and connect with like-minded individuals.</p>
                    
                    <h3>Finding Your Niche</h3>
                    <p>Begin by identifying what you're passionate about. Your blog should focus on topics you genuinely enjoy exploring and discussing. Authenticity resonates with readers, so choose a niche that aligns with your interests and expertise.</p>
                    
                    <h3>Choosing a Platform</h3>
                    <p>There are numerous blogging platforms available today, each with its own advantages. WordPress, Blogger, and Medium are popular choices, offering a range of customization options and user-friendly interfaces. Consider your technical skills and specific needs when making this decision.</p>
                    
                    <h3>Creating Quality Content</h3>
                    <p>Content is king in the blogging world. Focus on creating valuable, well-researched, and engaging posts. Use images, videos, and infographics to enhance your content. Remember, consistency is key – establish a regular posting schedule to keep your audience engaged.</p>
                    
                    <h3>Building Your Community</h3>
                    <p>Engage with your readers through comments and social media. Respond to feedback, ask questions, and create opportunities for interaction. Building a community around your blog adds depth to your writing journey and can provide valuable insights and inspiration.</p>
                    
                    <p>Starting a blog is just the first step in a rewarding journey of self-expression and connection. Embrace the process, stay true to your voice, and enjoy the adventure!</p>
                `
            }
        ];
        
        console.log(`Using ${hardcodedPosts.length} hardcoded posts as fallback`);
        return hardcodedPosts;
    } catch (error) {
        console.error('Error loading blog posts:', error);
        return [];
    }
}

// Create a blog post card element
function createBlogPostCard(post) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    
    article.innerHTML = `
        <div class="blog-card-image">
            <img src="${post.image}" alt="${post.title}" onerror="this.src='images/blog-placeholder.jpg'">
        </div>
        <div class="blog-card-content">
            <h3 class="blog-card-title"><a href="blog.html?slug=${post.slug}">${post.title}</a></h3>
            <p class="blog-card-excerpt">${post.excerpt}</p>
            <div class="blog-card-meta">
                <span class="blog-card-date">${post.date}</span>
                <span class="blog-card-category">${post.category}</span>
            </div>
        </div>
    `;
    
    return article;
}

// Handle search functionality
function handleSearch() {
    const searchValue = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    
    const blogCards = blogsContainer.querySelectorAll('.blog-card');
    
    blogCards.forEach(card => {
        const title = card.querySelector('.blog-card-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.blog-card-excerpt').textContent.toLowerCase();
        const category = card.querySelector('.blog-card-category').textContent;
        
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
    // Extract unique categories
    const categories = [...new Set(posts.map(post => post.category))];
    
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
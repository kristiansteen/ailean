# API Client Usage Guide

**File**: `frontend/assets/js/api-client.js`

This guide shows you how to use the API client in your frontend code.

---

## 🚀 Quick Start

### 1. Include in HTML

```html
<script src="assets/js/api-client.js"></script>
```

### 2. Initialize

```javascript
const apiClient = new ApiClient();
// or with custom URL
const apiClient = new ApiClient('https://your-backend-url.com/api/v1');
```

### 3. Use

```javascript
// Login
const response = await apiClient.login('user@example.com', 'password');

// Get boards
const boards = await apiClient.getBoards();
```

---

## 🧪 Test the API Client

### Option 1: Use Test Page (Easiest)

1. Make sure backend is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Open test page in browser:
   ```
   frontend/test-api-client.html
   ```

3. Click buttons to test each endpoint!

### Option 2: Browser Console

1. Open `frontend/index.html` or any page that includes `api-client.js`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Type commands:

```javascript
const apiClient = new ApiClient();

// Register
await apiClient.register('test@example.com', 'Test1234', 'Test User');

// Login
await apiClient.login('test@example.com', 'Test1234');

// Create board
await apiClient.createBoard('My Board', 'A test board');

// Get boards
await apiClient.getBoards();
```

---

## 📚 API Reference

### Authentication

#### Register User
```javascript
const response = await apiClient.register(email, password, name);
// Returns: { user: {...}, accessToken: "..." }
```

#### Login
```javascript
const response = await apiClient.login(email, password);
// Returns: { user: {...}, accessToken: "..." }
```

#### Logout
```javascript
await apiClient.logout();
// Clears token and logs out
```

#### Get Current User
```javascript
const user = await apiClient.getCurrentUser();
// Returns: { user: { id, email, name, ... } }
```

#### Check if Authenticated
```javascript
if (apiClient.isAuthenticated()) {
    // User is logged in
}
```

---

### Boards

#### Get All Boards
```javascript
const boards = await apiClient.getBoards();
// Returns: [{ id, title, description, updatedAt, ... }, ...]
```

#### Get Single Board
```javascript
const board = await apiClient.getBoard(boardId);
// Returns: { id, title, sections: [...], postits: [...], ... }
```

#### Create Board
```javascript
const board = await apiClient.createBoard(
    'Board Title',
    'Optional description'
);
// Returns: { id, title, slug, userId, ... }
```

#### Update Board
```javascript
const board = await apiClient.updateBoard(boardId, {
    title: 'New Title',
    description: 'New description',
    gridData: {...},
    settings: {...}
});
// Returns: { id, title, ... }
```

#### Delete Board
```javascript
await apiClient.deleteBoard(boardId);
// Returns: { message: "Board deleted successfully" }
```

---

### Sections

#### Create Section
```javascript
const section = await apiClient.createSection(boardId, {
    type: 'matrix',           // 'matrix', 'text', 'team', 'kpi', etc.
    title: 'Section Title',
    positionX: 0,
    positionY: 0,
    width: 6,
    height: 4,
    content: {}               // Section-specific content
});
// Returns: { id, type, title, ... }
```

#### Update Section
```javascript
const section = await apiClient.updateSection(boardId, sectionId, {
    title: 'Updated Title',
    isLocked: true,
    content: {...}
});
// Returns: { id, title, ... }
```

#### Delete Section
```javascript
await apiClient.deleteSection(boardId, sectionId);
// Returns: { message: "Section deleted successfully" }
```

---

### Post-its

#### Create Post-it
```javascript
const postit = await apiClient.createPostit(boardId, {
    sectionId: 'section-id',
    color: 'yellow',          // 'yellow', 'pink', 'blue', 'green', 'orange'
    content: 'Note content',
    status: 'todo',           // 'todo', 'in-progress', 'done'
    positionX: 100,
    positionY: 200,
    owner: 'John Doe',        // optional
    xValue: 'High',           // optional (for matrix)
    yValue: 'High'            // optional (for matrix)
});
// Returns: { id, color, content, ... }
```

#### Update Post-it
```javascript
const postit = await apiClient.updatePostit(boardId, postitId, {
    content: 'Updated content',
    status: 'done',
    positionX: 150,
    positionY: 250
});
// Returns: { id, content, ... }
```

#### Delete Post-it
```javascript
await apiClient.deletePostit(boardId, postitId);
// Returns: { message: "Post-it deleted successfully" }
```

---

## ⚠️ Error Handling

All API methods can throw `ApiError`. Always use try-catch:

```javascript
try {
    const boards = await apiClient.getBoards();
    console.log('Boards:', boards);
} catch (error) {
    if (error.isUnauthorized()) {
        // Token expired - redirect to login
        window.location.href = 'login.html';
    } else if (error.isNetworkError()) {
        // No internet connection
        alert('No internet connection');
    } else if (error.isServerError()) {
        // Server error (5xx)
        alert('Server error. Please try again later.');
    } else {
        // Other error
        alert(error.message);
    }
}
```

### Error Helper Methods

```javascript
error.isNetworkError()    // Network failure (offline)
error.isUnauthorized()    // 401 - Not authenticated
error.isForbidden()       // 403 - No permission
error.isNotFound()        // 404 - Resource not found
error.isServerError()     // 500+ - Server error
```

---

## 🔐 Token Management

The API client automatically:
- ✅ Stores token in localStorage on login
- ✅ Adds `Authorization: Bearer <token>` header to all requests
- ✅ Refreshes expired tokens automatically
- ✅ Clears token on logout
- ✅ Handles 401 errors

### Manual Token Operations

```javascript
// Get token
const token = apiClient.getToken();

// Set token
apiClient.setToken('your-token');

// Clear token
apiClient.clearToken();

// Check if authenticated
if (apiClient.isAuthenticated()) {
    console.log('User is logged in');
}
```

---

## 🎯 Common Patterns

### Login Flow

```javascript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await apiClient.login(email, password);
        
        // Success - redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        // Show error message
        document.getElementById('error').textContent = error.message;
    }
});
```

### Protected Page

```javascript
// At top of protected pages (board.html, dashboard.html)
async function checkAuth() {
    try {
        await apiClient.getCurrentUser();
        // User is authenticated, continue
    } catch (error) {
        // Not authenticated, redirect to login
        window.location.href = 'login.html';
    }
}

checkAuth();
```

### Load Board

```javascript
async function loadBoard(boardId) {
    try {
        const board = await apiClient.getBoard(boardId);
        
        // Render sections
        board.sections.forEach(section => {
            renderSection(section);
        });
        
        // Render post-its
        board.postits.forEach(postit => {
            renderPostit(postit);
        });
        
    } catch (error) {
        console.error('Failed to load board:', error);
        alert('Failed to load board');
    }
}
```

### Auto-Save with Debounce

```javascript
let saveTimeout;

function saveBoardState() {
    clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
        try {
            showSavingIndicator();
            
            const data = {
                gridData: grid.save(),
                settings: currentSettings
            };
            
            await apiClient.updateBoard(currentBoardId, data);
            
            showSavedIndicator();
        } catch (error) {
            console.error('Save failed:', error);
            showSaveError();
        }
    }, 1000); // Wait 1 second after last change
}

// Call this whenever something changes
document.addEventListener('change', saveBoardState);
```

### Create Section

```javascript
async function createSection(type, title) {
    try {
        const sectionData = {
            type: type,
            title: title,
            positionX: 0,
            positionY: 0,
            width: 6,
            height: 4,
            content: {}
        };
        
        const section = await apiClient.createSection(currentBoardId, sectionData);
        
        // Add section to UI
        renderSection(section);
        
        return section;
    } catch (error) {
        console.error('Failed to create section:', error);
        alert('Failed to create section');
    }
}
```

### Create Post-it

```javascript
async function createPostit(sectionId, color, content) {
    try {
        const postitData = {
            sectionId: sectionId,
            color: color,
            content: content,
            status: 'todo',
            positionX: 100,
            positionY: 100
        };
        
        const postit = await apiClient.createPostit(currentBoardId, postitData);
        
        // Add post-it to UI
        renderPostit(postit);
        
        return postit;
    } catch (error) {
        console.error('Failed to create post-it:', error);
        alert('Failed to create post-it');
    }
}
```

---

## 🔄 Automatic Token Refresh

The API client automatically handles token expiration:

1. **Request with expired token** → Gets 401 error
2. **Automatically calls** `/auth/refresh` to get new token
3. **Retries original request** with new token
4. **Returns response** to your code

You don't need to do anything! It just works.

**If refresh fails** (refresh token also expired):
- Token is cleared
- All pending requests fail with 401
- Redirect user to login page

---

## 🎨 UI Integration Examples

### Loading Indicator

```javascript
// Show spinner
function showLoading() {
    document.getElementById('spinner').style.display = 'block';
}

// Hide spinner
function hideLoading() {
    document.getElementById('spinner').style.display = 'none';
}

// Use with API calls
async function loadData() {
    showLoading();
    try {
        const boards = await apiClient.getBoards();
        renderBoards(boards);
    } catch (error) {
        alert('Failed to load boards');
    } finally {
        hideLoading();
    }
}
```

### Save Indicator

```javascript
function showSavingIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.textContent = '💾 Saving...';
    indicator.className = 'saving';
}

function showSavedIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.textContent = '✓ Saved';
    indicator.className = 'saved';
    
    setTimeout(() => {
        indicator.textContent = '';
    }, 2000);
}

function showSaveError() {
    const indicator = document.getElementById('saveIndicator');
    indicator.textContent = '✗ Save failed';
    indicator.className = 'error';
}
```

---

## ⚡ Performance Tips

### 1. Debounce Frequent Updates

```javascript
// Don't save on every keystroke
let timeout;
input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => saveToAPI(), 1000);
});
```

### 2. Batch Operations

```javascript
// Instead of multiple API calls
for (const postit of postits) {
    await apiClient.updatePostit(boardId, postit.id, postit); // Slow!
}

// Better: Update board once with all changes
await apiClient.updateBoard(boardId, { postits: postits });
```

### 3. Cache Board Data

```javascript
let cachedBoard = null;

async function getBoard(boardId) {
    if (cachedBoard && cachedBoard.id === boardId) {
        return cachedBoard;
    }
    
    cachedBoard = await apiClient.getBoard(boardId);
    return cachedBoard;
}
```

---

## 🐛 Debugging

### Enable Console Logging

Add this to see all API requests:

```javascript
// At top of your file
const originalRequest = apiClient.request.bind(apiClient);
apiClient.request = async function(endpoint, options) {
    console.log('API Request:', endpoint, options);
    const result = await originalRequest(endpoint, options);
    console.log('API Response:', result);
    return result;
};
```

### Check Network Tab

Open DevTools → Network tab to see:
- Request URL
- Request headers (Authorization)
- Request body
- Response status
- Response body

---

## ✅ Testing Checklist

- [ ] Can register new user
- [ ] Can login
- [ ] Can get current user
- [ ] Can logout
- [ ] Can create board
- [ ] Can list boards
- [ ] Can get single board
- [ ] Can update board
- [ ] Can delete board
- [ ] Can create section
- [ ] Can create post-it
- [ ] Token automatically refreshes
- [ ] 401 errors redirect to login

---

## 📞 Need Help?

**Common Issues:**

**"401 Unauthorized"**
→ Token expired or invalid. Make sure you're logged in.

**"Network error"**
→ Backend not running. Start it: `npm run dev`

**"CORS error"**
→ Backend CORS settings. Check backend/.env ALLOWED_ORIGINS

**"404 Not Found"**
→ Wrong endpoint URL. Check baseURL in constructor.

---

**Next Steps:**

1. Test the API client with `test-api-client.html`
2. Use it in your login page
3. Use it in your dashboard
4. Integrate into board.js

**The API client is ready to use!** 🚀

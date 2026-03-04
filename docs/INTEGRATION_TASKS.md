# Frontend-Backend Integration Tasks

**Goal**: Connect your existing vimpl board interface to the backend API for full SaaS functionality.

**Estimated Time**: 2-3 weeks (depending on experience)

---

## 📊 Overview

**What You Have:**
- ✅ Backend API (fully functional)
- ✅ Frontend UI (board.html, board.js - localStorage-based)

**What You Need:**
- 🔄 Connect frontend to backend
- 🔄 Add authentication pages
- 🔄 Replace localStorage with API calls

---

## 🎯 Phase 1: Foundation (Week 1)

### Task 1.1: Create API Client Wrapper
**Priority**: 🔴 Critical  
**Time**: 2-3 hours  
**File**: `frontend/assets/js/api-client.js` (NEW)

**What to Build:**
A JavaScript class that handles all API communication.

**Code Structure:**
```javascript
class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3001/api/v1';
        this.token = localStorage.getItem('accessToken');
    }

    // Authentication methods
    async login(email, password) { }
    async register(email, password, name) { }
    async logout() { }
    async getCurrentUser() { }
    async refreshToken() { }

    // Board methods
    async getBoards() { }
    async getBoard(boardId) { }
    async createBoard(title, description) { }
    async updateBoard(boardId, data) { }
    async deleteBoard(boardId) { }

    // Section methods
    async createSection(boardId, sectionData) { }
    async updateSection(boardId, sectionId, data) { }
    async deleteSection(boardId, sectionId) { }

    // Post-it methods
    async createPostit(boardId, postitData) { }
    async updatePostit(boardId, postitId, data) { }
    async deletePostit(boardId, postitId) { }

    // Helper methods
    async request(endpoint, options) { }
}
```

**Deliverable:**
- `api-client.js` file with all methods implemented
- Error handling for network failures
- Token refresh logic
- Request/response interceptors

**Acceptance Criteria:**
- [ ] Can call `apiClient.login()` and get token
- [ ] Can call `apiClient.createBoard()` and get board object
- [ ] Automatically adds Authorization header
- [ ] Handles 401 errors (expired token)
- [ ] Throws meaningful errors

---

### Task 1.2: Create Login Page
**Priority**: 🔴 Critical  
**Time**: 3-4 hours  
**File**: `frontend/login.html` (NEW)

**What to Build:**
A login page with email/password form and Google OAuth option.

**HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Login - vimpl</title>
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <h1>Welcome back</h1>
            <form id="loginForm">
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Log in</button>
            </form>
            <div class="divider">or</div>
            <button id="googleLogin" class="google-btn">
                Sign in with Google
            </button>
            <p>Don't have an account? <a href="register.html">Sign up</a></p>
        </div>
    </div>
    <script src="assets/js/api-client.js"></script>
    <script src="assets/js/login.js"></script>
</body>
</html>
```

**JavaScript Logic** (`login.js`):
```javascript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await apiClient.login(email, password);
        localStorage.setItem('accessToken', response.accessToken);
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError('Invalid email or password');
    }
});
```

**Deliverable:**
- `login.html` with form
- `login.js` with form handling
- `auth.css` for styling
- Error message display
- Loading state during login

**Acceptance Criteria:**
- [ ] Can enter email and password
- [ ] Shows loading spinner when submitting
- [ ] Redirects to dashboard on success
- [ ] Shows error message on failure
- [ ] "Remember me" checkbox (optional)
- [ ] "Forgot password" link (optional)

---

### Task 1.3: Create Registration Page
**Priority**: 🔴 Critical  
**Time**: 2-3 hours  
**File**: `frontend/register.html` (NEW)

**What to Build:**
Similar to login page but for new user registration.

**Features:**
- Email field
- Password field (with strength indicator)
- Confirm password field
- Name field
- Terms & conditions checkbox
- Google OAuth option

**JavaScript Logic** (`register.js`):
```javascript
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('name').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        const response = await apiClient.register(email, password, name);
        localStorage.setItem('accessToken', response.accessToken);
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message || 'Registration failed');
    }
});
```

**Deliverable:**
- `register.html` with form
- `register.js` with validation
- Password strength indicator
- Confirm password matching
- Terms acceptance

**Acceptance Criteria:**
- [ ] Can register new account
- [ ] Password validation (min 8 chars)
- [ ] Passwords must match
- [ ] Shows clear error messages
- [ ] Redirects to dashboard on success

---

### Task 1.4: Create Dashboard Page
**Priority**: 🔴 Critical  
**Time**: 4-5 hours  
**File**: `frontend/dashboard.html` (NEW)

**What to Build:**
A page that lists all user's boards with options to create, open, or delete.

**Layout:**
```
┌─────────────────────────────────────────┐
│  vimpl          [+ New Board]  [Logout] │
├─────────────────────────────────────────┤
│                                         │
│  My Boards                              │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  Q1 Planning │  │  Risk Matrix │   │
│  │  Updated 2h  │  │  Updated 5d  │   │
│  │  [Open] [⋮]  │  │  [Open] [⋮]  │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐                      │
│  │  Team Tasks  │                      │
│  │  Updated 1w  │                      │
│  │  [Open] [⋮]  │                      │
│  └──────────────┘                      │
└─────────────────────────────────────────┘
```

**JavaScript Logic** (`dashboard.js`):
```javascript
async function loadBoards() {
    try {
        const boards = await apiClient.getBoards();
        renderBoards(boards);
    } catch (error) {
        if (error.status === 401) {
            window.location.href = 'login.html';
        }
    }
}

function renderBoards(boards) {
    const container = document.getElementById('boardsContainer');
    container.innerHTML = boards.map(board => `
        <div class="board-card">
            <h3>${board.title}</h3>
            <p>${formatDate(board.updatedAt)}</p>
            <button onclick="openBoard('${board.id}')">Open</button>
            <button onclick="deleteBoard('${board.id}')">Delete</button>
        </div>
    `).join('');
}

async function createNewBoard() {
    const title = prompt('Board title:');
    if (title) {
        const board = await apiClient.createBoard(title);
        window.location.href = `board.html?id=${board.id}`;
    }
}
```

**Deliverable:**
- `dashboard.html` with board grid
- `dashboard.js` with API calls
- `dashboard.css` for styling
- Create board modal/prompt
- Delete board confirmation
- Search/filter boards (optional)

**Acceptance Criteria:**
- [ ] Shows all user's boards
- [ ] Can create new board
- [ ] Can open existing board
- [ ] Can delete board (with confirmation)
- [ ] Shows loading state while fetching
- [ ] Redirects to login if not authenticated

---

## 🔧 Phase 2: Board Integration (Week 2)

### Task 2.1: Add Authentication Check to Board Page
**Priority**: 🔴 Critical  
**Time**: 1 hour  
**File**: `frontend/board.html` (MODIFY)

**What to Add:**
At the top of board.html, add authentication check:

```html
<script src="assets/js/api-client.js"></script>
<script>
    // Check authentication before loading board
    const apiClient = new ApiClient();
    
    async function checkAuth() {
        try {
            await apiClient.getCurrentUser();
        } catch (error) {
            window.location.href = 'login.html';
        }
    }
    
    checkAuth();
</script>
```

**Deliverable:**
- Authentication check added
- Redirects to login if not authenticated
- Gets board ID from URL parameter

**Acceptance Criteria:**
- [ ] Unauthenticated users redirected to login
- [ ] Board ID extracted from URL (?id=xxx)
- [ ] Shows error if board not found

---

### Task 2.2: Replace LoadBoardState with API
**Priority**: 🔴 Critical  
**Time**: 3-4 hours  
**File**: `frontend/assets/js/board.js` (MODIFY)

**Current Code** (around line 100-150):
```javascript
function loadBoardState() {
    const saved = localStorage.getItem('vimplBoardState');
    if (saved) {
        const data = JSON.parse(saved);
        // ... restore sections, post-its, etc.
    }
}
```

**New Code:**
```javascript
async function loadBoardState() {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('id');
    
    if (!boardId) {
        alert('No board ID provided');
        window.location.href = 'dashboard.html';
        return;
    }
    
    try {
        showLoadingSpinner();
        const board = await apiClient.getBoard(boardId);
        
        // Restore sections
        if (board.sections) {
            board.sections.forEach(section => {
                createSectionFromData(section);
            });
        }
        
        // Restore post-its
        if (board.postits) {
            board.postits.forEach(postit => {
                createPostitFromData(postit);
            });
        }
        
        hideLoadingSpinner();
    } catch (error) {
        console.error('Failed to load board:', error);
        alert('Failed to load board');
    }
}
```

**Deliverable:**
- Replace localStorage loading with API call
- Handle board not found error
- Show loading spinner
- Restore all sections and post-its from API data

**Acceptance Criteria:**
- [ ] Loads board from API using board ID
- [ ] Recreates all sections
- [ ] Recreates all post-its
- [ ] Shows loading state
- [ ] Handles errors gracefully

---

### Task 2.3: Replace SaveBoardState with API
**Priority**: 🔴 Critical  
**Time**: 4-5 hours  
**File**: `frontend/assets/js/board.js` (MODIFY)

**Current Code** (around line 200-250):
```javascript
function saveBoardState() {
    const data = {
        sections: getAllSections(),
        postits: getAllPostits(),
        // ...
    };
    localStorage.setItem('vimplBoardState', JSON.stringify(data));
}
```

**New Code:**
```javascript
let saveTimeout;
async function saveBoardState() {
    // Debounce saves
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            showSavingIndicator();
            
            const boardData = {
                gridData: grid.save(),
                settings: { /* current settings */ }
            };
            
            await apiClient.updateBoard(currentBoardId, boardData);
            
            showSavedIndicator();
        } catch (error) {
            console.error('Failed to save board:', error);
            showSaveError();
        }
    }, 1000); // Wait 1 second after last change
}
```

**Deliverable:**
- Replace localStorage save with API call
- Add debouncing (don't save on every keystroke)
- Show save status indicator
- Handle save errors

**Acceptance Criteria:**
- [ ] Saves board to API
- [ ] Debounced (waits 1 sec after last change)
- [ ] Shows "Saving..." indicator
- [ ] Shows "Saved" indicator on success
- [ ] Shows error message on failure
- [ ] Retries on network failure

---

### Task 2.4: Update Section CRUD Operations
**Priority**: 🟡 High  
**Time**: 3-4 hours  
**File**: `frontend/assets/js/board.js` (MODIFY)

**Functions to Update:**
- `addSection()` - Call API to create section
- `deleteSection()` - Call API to delete section
- `updateSection()` - Call API to update section

**Example - Create Section:**

**Current:**
```javascript
function addSection(type) {
    const section = {
        id: generateId(),
        type: type,
        // ...
    };
    sections.push(section);
    saveBoardState();
}
```

**New:**
```javascript
async function addSection(type) {
    const sectionData = {
        type: type,
        title: `New ${type} section`,
        positionX: 0,
        positionY: 0,
        width: 6,
        height: 4,
        content: {}
    };
    
    try {
        const section = await apiClient.createSection(currentBoardId, sectionData);
        createSectionUI(section);
    } catch (error) {
        console.error('Failed to create section:', error);
        alert('Failed to create section');
    }
}
```

**Deliverable:**
- Update all section CRUD functions
- Call API endpoints
- Handle errors
- Update UI optimistically (show immediately, sync later)

**Acceptance Criteria:**
- [ ] Creating section calls API and updates UI
- [ ] Deleting section calls API and removes from UI
- [ ] Updating section calls API
- [ ] Shows loading states
- [ ] Rolls back on API error

---

### Task 2.5: Update Post-it CRUD Operations
**Priority**: 🟡 High  
**Time**: 3-4 hours  
**File**: `frontend/assets/js/board.js` (MODIFY)

**Functions to Update:**
- `createPostit()` - Call API
- `updatePostit()` - Call API
- `deletePostit()` - Call API
- `movePostit()` - Call API

**Example - Create Post-it:**

**Current:**
```javascript
function createPostit(sectionId, color) {
    const postit = {
        id: generateId(),
        sectionId: sectionId,
        color: color,
        content: '',
        // ...
    };
    postits.push(postit);
    saveBoardState();
}
```

**New:**
```javascript
async function createPostit(sectionId, color, position) {
    const postitData = {
        sectionId: sectionId,
        color: color,
        content: '',
        status: 'todo',
        positionX: position.x,
        positionY: position.y
    };
    
    try {
        const postit = await apiClient.createPostit(currentBoardId, postitData);
        createPostitUI(postit);
        return postit;
    } catch (error) {
        console.error('Failed to create post-it:', error);
        alert('Failed to create post-it');
    }
}
```

**Deliverable:**
- Update all post-it CRUD functions
- Call API endpoints
- Handle errors
- Optimistic UI updates

**Acceptance Criteria:**
- [ ] Creating post-it calls API
- [ ] Updating post-it calls API (debounced)
- [ ] Deleting post-it calls API
- [ ] Moving post-it calls API
- [ ] Shows errors on failure

---

## 🎨 Phase 3: Polish & Features (Week 3)

### Task 3.1: Add Loading States
**Priority**: 🟡 High  
**Time**: 2-3 hours  
**File**: Multiple files

**What to Add:**
Loading indicators for all async operations:

1. **Board loading**: Spinner while loading board data
2. **Saving indicator**: "Saving..." / "Saved" / "Failed to save"
3. **Action loading**: Disable buttons while processing

**Example Loading Spinner:**
```html
<div id="loadingSpinner" class="spinner-overlay" style="display: none;">
    <div class="spinner"></div>
    <p>Loading board...</p>
</div>
```

**Deliverable:**
- Loading spinner component
- Save status indicator
- Button disabled states
- Skeleton screens (optional)

**Acceptance Criteria:**
- [ ] Shows spinner when loading board
- [ ] Shows save status in top bar
- [ ] Buttons disabled during actions
- [ ] Clear visual feedback for all operations

---

### Task 3.2: Add Error Handling
**Priority**: 🟡 High  
**Time**: 2-3 hours  
**File**: Multiple files

**What to Add:**
Graceful error handling for all API operations:

1. **Network errors**: "No internet connection"
2. **Server errors**: "Server error, please try again"
3. **Not found errors**: "Board not found"
4. **Permission errors**: "You don't have access"

**Example Error Handler:**
```javascript
function handleApiError(error) {
    let message = 'An error occurred';
    
    if (error.status === 401) {
        window.location.href = 'login.html';
        return;
    } else if (error.status === 403) {
        message = 'You do not have permission';
    } else if (error.status === 404) {
        message = 'Board not found';
    } else if (error.status >= 500) {
        message = 'Server error, please try again';
    } else if (!navigator.onLine) {
        message = 'No internet connection';
    }
    
    showErrorToast(message);
}
```

**Deliverable:**
- Error toast notification system
- Error message mapping
- Retry logic for failed saves
- Offline detection

**Acceptance Criteria:**
- [ ] Shows user-friendly error messages
- [ ] Handles network failures gracefully
- [ ] Redirects to login on 401
- [ ] Shows retry option for failed saves

---

### Task 3.3: Add Logout Functionality
**Priority**: 🟢 Medium  
**Time**: 1 hour  
**File**: `frontend/board.html`, `dashboard.html`

**What to Add:**
Logout button in header that clears tokens and redirects to login.

**Code:**
```javascript
async function logout() {
    try {
        await apiClient.logout();
    } catch (error) {
        // Ignore errors
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'login.html';
    }
}
```

**Deliverable:**
- Logout button in header
- Clear all tokens
- Redirect to login page

**Acceptance Criteria:**
- [ ] Logout button visible in header
- [ ] Clears all tokens
- [ ] Calls logout API endpoint
- [ ] Redirects to login page

---

### Task 3.4: Add User Profile Display
**Priority**: 🟢 Medium  
**Time**: 2 hours  
**File**: `frontend/board.html`, `dashboard.html`

**What to Add:**
Show logged-in user's name/email in header.

**Code:**
```javascript
async function loadUserProfile() {
    try {
        const user = await apiClient.getCurrentUser();
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}
```

**Deliverable:**
- User name in header
- User dropdown menu
- Profile picture (optional)

**Acceptance Criteria:**
- [ ] Shows user's name in header
- [ ] Dropdown with "Settings" and "Logout"
- [ ] User info loads on page load

---

### Task 3.5: Update Navigation Links
**Priority**: 🟢 Medium  
**Time**: 1 hour  
**File**: All HTML files

**What to Update:**
Update all navigation links to point to correct pages:

- Landing page → Login/Dashboard (if authenticated)
- Logo → Dashboard (if authenticated)
- "My Boards" → Dashboard
- Add authentication checks

**Deliverable:**
- Updated navigation
- Authentication-aware routing
- Breadcrumbs (optional)

**Acceptance Criteria:**
- [ ] All links work correctly
- [ ] Logo redirects appropriately
- [ ] Navigation shows correct items based on auth state

---

### Task 3.6: Remove localStorage References
**Priority**: 🟡 High  
**Time**: 2 hours  
**File**: `frontend/assets/js/board.js`

**What to Do:**
Search for and remove all localStorage operations except for token storage:

**Keep:**
- `localStorage.getItem('accessToken')`
- `localStorage.setItem('accessToken', token)`

**Remove:**
- `localStorage.getItem('vimplBoardState')`
- `localStorage.setItem('vimplBoardState', data)`
- Any other board data storage

**Deliverable:**
- Remove localStorage board data storage
- Keep only token storage
- Clean up unused code

**Acceptance Criteria:**
- [ ] No board data stored in localStorage
- [ ] Tokens still stored in localStorage
- [ ] All functionality still works

---

## 🧪 Phase 4: Testing (Throughout)

### Task 4.1: Manual Testing Checklist
**Priority**: 🔴 Critical  
**Time**: Ongoing

**Test Cases:**

**Authentication:**
- [ ] Can register new account
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] Token automatically refreshes when expired
- [ ] Logout clears all data
- [ ] Redirected to login when not authenticated

**Dashboard:**
- [ ] Shows all user's boards
- [ ] Can create new board
- [ ] Can open existing board
- [ ] Can delete board
- [ ] Deleted boards disappear immediately

**Board Operations:**
- [ ] Board loads correctly
- [ ] All sections appear
- [ ] All post-its appear
- [ ] Can create new section
- [ ] Can delete section
- [ ] Can create new post-it
- [ ] Can edit post-it
- [ ] Can delete post-it
- [ ] Can drag and drop post-its
- [ ] Changes auto-save
- [ ] Shows "Saving..." indicator
- [ ] Shows "Saved" indicator

**Error Handling:**
- [ ] Shows error for network failures
- [ ] Shows error for server errors
- [ ] Can retry failed saves
- [ ] Gracefully handles offline mode

---

### Task 4.2: Browser Testing
**Priority**: 🟡 High  
**Time**: 2-3 hours

**Test in Multiple Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (Mac only)
- [ ] Edge (latest)

**Test Responsiveness:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 📋 Summary Checklist

### Phase 1: Foundation ✅
- [ ] Task 1.1: API Client Wrapper
- [ ] Task 1.2: Login Page
- [ ] Task 1.3: Registration Page
- [ ] Task 1.4: Dashboard Page

### Phase 2: Integration ✅
- [ ] Task 2.1: Auth Check
- [ ] Task 2.2: Load from API
- [ ] Task 2.3: Save to API
- [ ] Task 2.4: Section CRUD
- [ ] Task 2.5: Post-it CRUD

### Phase 3: Polish ✅
- [ ] Task 3.1: Loading States
- [ ] Task 3.2: Error Handling
- [ ] Task 3.3: Logout
- [ ] Task 3.4: User Profile
- [ ] Task 3.5: Navigation
- [ ] Task 3.6: Remove localStorage

### Phase 4: Testing ✅
- [ ] Task 4.1: Manual Testing
- [ ] Task 4.2: Browser Testing

---

## 🎯 Priority Order

**Week 1 (Must Have):**
1. API Client Wrapper (1.1)
2. Login Page (1.2)
3. Dashboard Page (1.4)

**Week 2 (Core Integration):**
4. Load from API (2.2)
5. Save to API (2.3)
6. Section CRUD (2.4)
7. Post-it CRUD (2.5)

**Week 3 (Polish):**
8. Error Handling (3.2)
9. Loading States (3.1)
10. Testing (4.1, 4.2)

---

## 💡 Development Tips

1. **Start with API Client**: Build this first, test it independently
2. **Test Each Task**: Don't move to next task until current one works
3. **Commit Often**: Use Git to save progress after each task
4. **Keep Backend Running**: Always have backend server running during development
5. **Use Browser DevTools**: Check Network tab for API calls
6. **Test Errors**: Intentionally cause errors to test error handling

---

## 🆘 Need Help?

**I can help you with:**
- Writing the API client wrapper
- Creating login/register pages
- Modifying board.js for API integration
- Debugging API calls
- Testing the integration

Just let me know which task you want to start with!

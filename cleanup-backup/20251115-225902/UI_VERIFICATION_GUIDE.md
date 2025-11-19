# Phase 1 UI Verification Guide

## Access the Application

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:3001/api

---

## UI Components Overview

### 1. Login Page (Landing Page)
**Location:** `frontend/src/pages/Login.tsx`  
**Features:**
- ✅ Responsive design with gradient background (blue to indigo)
- ✅ "Portfolio Management" title header
- ✅ Email input field with placeholder
- ✅ Password input field (masked) with placeholder
- ✅ "Sign In" button (disabled while loading)
- ✅ "Create Account" link to switch to registration
- ✅ Real API integration with error display
- ✅ Form validation

### 2. Registration Form
**Triggered by:** Click "Create Account" link on Login page  
**Additional Fields:**
- ✅ First Name input (e.g., "John")
- ✅ Last Name input (e.g., "Doe")
- ✅ Password helper text: "At least 8 characters"
- ✅ "Create Account" button
- ✅ "Sign In" link to switch back

### 3. Dashboard Page
**Location:** `frontend/src/pages/Dashboard.tsx`  
**Route:** `/dashboard` (protected)  
**Features:**
- ✅ Only visible after successful authentication
- ✅ Shows sample KPI cards
- ✅ Integrated with navigation sidebar

### 4. Navigation Sidebar
**Location:** `frontend/src/components/Navigation.tsx`  
**Visible After Login:**
- ✅ "Portfolio Mgmt" title with "IT Delivery" subtitle
- ✅ Navigation items:
  - Dashboard
  - Projects
  - Employees
  - Analytics
  - Reports
  - Settings
- ✅ Logout button (red text, bottom of sidebar)
- ✅ Dark theme (gray-900 background)

---

## Test Scenarios

### Scenario 1: User Registration
**Steps:**
1. Open http://localhost:5173
2. Click "Create Account" link
3. Enter:
   - First Name: `TestUser`
   - Last Name: `Demo`
   - Email: `testuser.demo@test.com` (use unique email)
   - Password: `TestPassword123!`
4. Click "Create Account" button
5. Wait for loading animation
6. Should see Dashboard after success

**Expected Result:** ✅
- Loading button changes text to "Creating Account..."
- After ~150ms, redirects to dashboard
- Tokens saved to localStorage

**Error Cases:**
- Empty fields: Form validation prevents submission
- Email exists: Shows error message "User with this email already exists"
- Password < 8 chars: Shows error message

---

### Scenario 2: User Login
**Steps:**
1. On Login page, enter credentials from Scenario 1
2. Click "Sign In" button
3. Wait for loading animation

**Expected Result:** ✅
- Loading button changes text to "Signing in..."
- After ~120ms, redirects to dashboard
- Tokens saved to localStorage

**Error Cases:**
- Wrong password: Shows "Invalid email or password"
- Invalid email: Shows "Invalid email or password"
- User not found: Shows "Invalid email or password"

---

### Scenario 3: Dashboard Access (Protected)
**Steps:**
1. After login, you should see:
   - Navigation sidebar on the left
   - Dashboard content in main area
   - Dashboard title and KPI cards

**Features Visible:**
- ✅ "Portfolio Mgmt" sidebar header
- ✅ Navigation menu items
- ✅ Logout button (red, at bottom)
- ✅ Dashboard title "Dashboard"
- ✅ Sample KPI cards (Utilization, Capacity, Variance)

---

### Scenario 4: Logout
**Steps:**
1. On Dashboard, click "Logout" button (bottom of sidebar)
2. Should redirect to Login page

**Expected Result:** ✅
- authToken removed from localStorage
- Page redirects to /login
- Login form displayed

---

### Scenario 5: Navigation
**Steps:**
1. After login, click different nav items:
   - Projects
   - Employees
   - Analytics
   - Reports
   - Settings

**Expected Result:** ✅
- Page content changes
- Sidebar highlights current page
- Can navigate freely between pages

---

## API Integration Testing

### Test Registration API
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "NewPassword123!",
    "firstName": "New",
    "lastName": "User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "newuser@test.com",
      "first_name": "New",
      "last_name": "User",
      "company_id": "uuid",
      "role": "user",
      "is_active": true
    }
  }
}
```

### Test Login API
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "NewPassword123!"
  }'
```

### Test Current User API
```bash
TOKEN="<access_token_from_login>"
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "newuser@test.com",
    "companyId": "uuid",
    "role": "user",
    "iat": 1763021404,
    "exp": 1763107804
  }
}
```

---

## UI Design Details

### Color Scheme
- **Primary:** Indigo-600 (#4F46E5)
- **Hover:** Indigo-700 (#4338CA)
- **Background:** Blue-50 to Indigo-100 (gradient)
- **Sidebar:** Gray-900 (dark)
- **Error:** Red (#DC2626)

### Layout
- **Login Page:** Centered card layout, full-height gradient background
- **Dashboard:** 2-column layout (sidebar + main content)
- **Sidebar:** Fixed width (w-64 = 16rem = 256px)
- **Main Content:** Flex-1 (takes remaining space)

### Typography
- **Main Title:** text-3xl, font-bold
- **Section Title:** text-2xl, font-bold
- **Labels:** font-semibold, text-gray-700
- **Helper Text:** text-sm, text-gray-500

### Spacing
- **Form Elements:** mb-4 (margin-bottom: 1rem)
- **Page Sections:** mb-6 (margin-bottom: 1.5rem)
- **Container Padding:** p-8 (padding: 2rem)

---

## Browser Console Checks

### Check localStorage
Open DevTools (F12 → Application → LocalStorage):

```javascript
// After login, you should see:
localStorage.getItem('authToken')     // JWT access token
localStorage.getItem('refreshToken')  // JWT refresh token

// Example token (will be long JWT string):
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi..."
```

### Check Network Requests
Open DevTools (F12 → Network):

1. **POST /api/auth/register**
   - Status: 201 Created
   - Response: User object + tokens

2. **POST /api/auth/login**
   - Status: 200 OK
   - Response: User object + tokens

3. **GET /api/auth/me**
   - Status: 200 OK
   - Headers: Authorization: Bearer {token}
   - Response: User data from token

---

## Responsive Design Testing

### Desktop (1920x1080)
- Sidebar visible full-height
- Form centered with good margins
- All elements properly spaced

### Tablet (768x1024)
- Sidebar visible but narrower
- Form still centered
- Navigation might become hamburger menu (if implemented)

### Mobile (375x667)
- Form full-width with padding
- Sidebar collapses or becomes drawer (if implemented)
- Touch-friendly button sizes (min 44px)

---

## Accessibility Checklist

- ✅ Form labels associated with inputs
- ✅ Password fields masked
- ✅ Error messages displayed clearly
- ✅ Focus states on inputs (focus:ring-2)
- ✅ Color contrast meets WCAG AA standards
- ✅ Keyboard navigation functional
- ✅ Button states clear (disabled state visible)

---

## Performance Metrics

### Expected Page Load Times
- **Initial Load:** ~500ms (React + Vite optimized)
- **Login Request:** ~120ms (API + password verification)
- **Register Request:** ~150ms (API + password hashing)
- **Page Transitions:** <100ms (client-side routing)

### Network Requests
- **JS Bundle:** ~45KB (gzipped)
- **CSS:** ~15KB (Tailwind optimized)
- **API Payloads:** <5KB each

---

## Known Limitations (Phase 1)

- ⚠️ No email verification
- ⚠️ No password reset functionality
- ⚠️ No rate limiting on auth endpoints
- ⚠️ No social login (GitHub, Google, etc.)
- ⚠️ No multi-factor authentication
- ⚠️ Sidebar navigation pages not fully implemented (dashboards only)

---

## Verification Checklist

### UI Rendering
- [ ] Login page displays correctly
- [ ] Form inputs are visible and functional
- [ ] Buttons display proper states (enabled/disabled/loading)
- [ ] Error messages appear when needed
- [ ] Registration/Login toggle works

### Functionality
- [ ] Can register with valid credentials
- [ ] Can login with registered credentials
- [ ] Gets redirected to dashboard after successful auth
- [ ] Dashboard shows sidebar navigation
- [ ] Can logout and return to login
- [ ] Protected routes require authentication

### Styling
- [ ] Colors match design (indigo theme)
- [ ] Gradient background displays
- [ ] Responsive layout works
- [ ] Shadows and borders render correctly
- [ ] Hover states work on buttons/links

### Integration
- [ ] API calls succeed to backend
- [ ] Tokens stored in localStorage
- [ ] Authorization header sent to API
- [ ] Errors from API displayed to user
- [ ] Token refresh works (if needed)

---

## Next Steps

Once Phase 1 UI verification is complete, Phase 2 will add:

- Master data management pages (Clients, Projects, Employees)
- Dashboard with real KPIs
- Data tables with CRUD operations
- Advanced filtering and search
- Bulk import functionality
- Report generation UI

---

## Support & Debugging

### Issue: Login page not loading
```bash
# Check if frontend is running
lsof -i :5173
# Start frontend
cd frontend && npm run dev
```

### Issue: Login fails with API error
```bash
# Check if backend is running
lsof -i :3001
# Check backend logs
tail /tmp/backend.log
```

### Issue: Tokens not saved
```javascript
// Check localStorage
localStorage.getItem('authToken')
// Should return JWT token, not null/undefined
```

### Issue: Page redirects to login after successful auth
```javascript
// Check if dashboard is redirecting to login
// This happens when localStorage.getItem('authToken') is null
localStorage.setItem('authToken', 'test-token')
```

---

**UI Verification Status:** Ready for testing ✅

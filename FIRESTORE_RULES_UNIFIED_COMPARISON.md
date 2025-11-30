# Firestore Rules: Unified Comparison & Compatibility Guide

**Projects:** NextElite, NextDoc, NextEliteTask, Clipboard Manager  
**Date:** November 2024  
**Purpose:** Compare and unify Firestore security rules across all projects

---

## Executive Summary

All four projects share the **same Firebase project** (`nextelite-89f47`), so they must use **one unified Firestore rules file**. This document compares the rules from each project and provides a unified, non-conflicting ruleset.

---

## 1. Collection Inventory

### 1.1 NextElite Collections
- `classes` - Class information
- `students` - Student records
- `teachers` - Teacher records
- `assistants` - Assistant records
- `parents` - Parent records
- `locations` - Location data
- `attendance` - Attendance records
- `messages` - Messages
- `comments` - Comments
- `makeUpClasses` - Make-up class records
- `payments` - Payment records
- `documents` - Document storage
- `users` - User profiles

### 1.2 NextDoc Collections
- `courses` - Course information
  - `levels` (subcollection)
    - `lessons` (subcollection)
      - `documents` (subcollection)
        - `viewLogs` (subcollection)
- `documentViewLogs` - Document view tracking

### 1.3 NextEliteTask Collections
- `tasks` - Task management
- `deleted_tasks` - Archived/deleted tasks
- `budget_incomes` - Income records
- `budget_expenses` - Expense records
- Also uses: `classes`, `students`, `attendance`, `payments`, `teachers` (from NextElite)

### 1.4 Clipboard Manager Collections
- `clips` - Clipboard items (user-specific)

### 1.5 Shared Collections (All Projects)
- `fcmTokens` - FCM push notification tokens (user-specific)
- `documentViews` - Document view tracking
- `notifications` - Push notifications

---

## 2. Current Rules Comparison

### 2.1 Clipboard Manager Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} {
      allow list: if request.auth != null;
      allow get: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

**Pattern:** User-specific by field (`userId` field)

---

### 2.2 NextDoc Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // NEXTELITE COLLECTIONS
    match /classes/{classId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    // ... (other NextElite collections)
    
    // NEXTDOC COLLECTIONS
    match /courses/{courseId} {
      allow read, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
      match /levels/{levelId} {
        allow read, list: if isAuthenticated();
        allow create, update, delete: if isAuthenticated();
        match /lessons/{lessonId} {
          allow read, list: if isAuthenticated();
          allow create, update, delete: if isAuthenticated();
          match /documents/{documentId} {
            match /viewLogs/{logId} {
              allow read, list: if isAuthenticated();
              allow create: if isAuthenticated();
            }
          }
        }
      }
    }
    
    match /documentViewLogs/{logId} {
      allow read, list: if isAuthenticated();
      allow create: if isAuthenticated();
    }
    
    // SHARED COLLECTIONS
    match /fcmTokens/{userId} {
      allow get, list, create, update, delete: 
        if isAuthenticated() && request.auth.uid == userId;
    }
    
    match /documentViews/{viewId} {
      allow get, list, create: if isAuthenticated();
    }
    
    match /notifications/{notificationId} {
      allow get, list, create: if isAuthenticated();
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Pattern:** Shared collections (all authenticated users)

---

### 2.3 NextElite Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // NEXTELITE COLLECTIONS
    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    // ... (similar pattern for all NextElite collections)
    
    match /makeUpClasses/{makeUpClassId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /payments/{paymentId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    // NEXTDOC COLLECTIONS (same as NextDoc)
    match /courses/{courseId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
      // ... (subcollections)
    }
    
    // SHARED COLLECTIONS
    match /fcmTokens/{userId} {
      // More complex: supports UID or email-sanitized ID
      allow read: if isAuthenticated() && 
        (request.auth.uid == userId || 
         (resource != null && resource.data.userId == request.auth.uid));
      allow create: if isAuthenticated() && 
        (request.auth.uid == userId || 
         request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAuthenticated() && 
        (request.auth.uid == userId || 
         (resource != null && resource.data.userId == request.auth.uid) ||
         request.resource.data.userId == request.auth.uid);
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Pattern:** Uses `read` (includes both `get` and `list`), more complex `fcmTokens` rule

---

### 2.4 NextEliteTask Rules

**Status:** ❌ **NO RULES FILE FOUND**

NextEliteTask does not have a `firestore.rules` file, meaning it relies on whatever rules are currently deployed in Firebase.

**Collections Used:**
- `tasks` - No rules defined
- `deleted_tasks` - No rules defined
- `budget_incomes` - No rules defined
- `budget_expenses` - No rules defined
- Also uses: `classes`, `students`, `attendance`, `payments`, `teachers` (covered by NextElite rules)

---

## 3. Key Differences & Issues

### 3.1 Permission Syntax Differences

| Project | Read Syntax | List Syntax | Notes |
|---------|------------|-------------|-------|
| **NextElite** | `allow read:` | Included in `read` | `read` = `get` + `list` |
| **NextDoc** | `allow read, list:` | `allow list:` | Explicit separation |
| **Clipboard** | `allow get:` | `allow list:` | Explicit separation |
| **NextEliteTask** | ❌ None | ❌ None | No rules file |

### 3.2 FCM Tokens Rule Complexity

- **NextDoc:** Simple - `request.auth.uid == userId` (document ID)
- **NextElite:** Complex - Supports UID or email-sanitized ID, checks both document ID and `userId` field
- **Clipboard:** ❌ Not defined (would use default deny)

### 3.3 Missing Collections

**NextEliteTask collections are NOT in any rules file:**
- ❌ `tasks` - No rules
- ❌ `deleted_tasks` - No rules
- ❌ `budget_incomes` - No rules
- ❌ `budget_expenses` - No rules

**Clipboard collection is NOT in NextElite/NextDoc rules:**
- ❌ `clips` - Only in clipboard rules

---

## 4. Conflicts & Compatibility Issues

### 4.1 Syntax Conflicts

**Issue:** NextElite uses `allow read:` while NextDoc/Clipboard use `allow get, list:` or `allow list:` separately.

**Impact:** 
- Both work, but inconsistent
- `read` is shorthand for `get + list`
- Explicit is clearer

**Recommendation:** Use explicit `get, list` for clarity and consistency.

### 4.2 Missing Collections

**Critical Issue:** NextEliteTask collections have no rules, so they're blocked by the default deny rule.

**Impact:**
- NextEliteTask cannot read/write its own collections
- Users get "permission-denied" errors

**Solution:** Add rules for NextEliteTask collections.

### 4.3 FCM Tokens Rule Mismatch

**Issue:** NextElite has complex FCM token rules, NextDoc has simple rules.

**Impact:**
- If using NextElite rules, NextDoc FCM tokens might not work
- If using NextDoc rules, NextElite FCM tokens might not work

**Solution:** Use NextElite's complex rule (more flexible).

---

## 5. Unified Rules Solution

### 5.1 Design Principles

1. **Include ALL collections** from all projects
2. **Use consistent syntax** (`get, list` instead of `read`)
3. **Use most permissive rule** where there's a conflict (to avoid breaking apps)
4. **Maintain security** - user-specific collections still check ownership
5. **Add missing collections** (NextEliteTask)

### 5.2 Unified Rules File

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // ============================================
    // NEXTELITE COLLECTIONS
    // ============================================
    
    match /classes/{classId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /students/{studentId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /teachers/{teacherId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /assistants/{assistantId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /parents/{parentId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /locations/{locationId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /attendance/{attendanceId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /messages/{messageId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /comments/{commentId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /makeUpClasses/{makeUpClassId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /payments/{paymentId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /documents/{documentId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /users/{userId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    // ============================================
    // NEXTDOC COLLECTIONS
    // ============================================
    
    match /courses/{courseId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
      
      // Levels subcollection
      match /levels/{levelId} {
        allow get, list: if isAuthenticated();
        allow create, update, delete: if isAuthenticated();
        
        // Lessons subcollection
        match /lessons/{lessonId} {
          allow get, list: if isAuthenticated();
          allow create, update, delete: if isAuthenticated();
          
          // Documents subcollection for view logs
          match /documents/{documentId} {
            match /viewLogs/{logId} {
              allow get, list: if isAuthenticated();
              allow create: if isAuthenticated();
            }
          }
        }
      }
    }
    
    match /documentViewLogs/{logId} {
      allow get, list: if isAuthenticated();
      allow create: if isAuthenticated();
    }
    
    // ============================================
    // NEXTELITETASK COLLECTIONS
    // ============================================
    
    match /tasks/{taskId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /deleted_tasks/{taskId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /budget_incomes/{incomeId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    match /budget_expenses/{expenseId} {
      allow get, list: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    // ============================================
    // CLIPBOARD MANAGER COLLECTIONS
    // ============================================
    
    match /clips/{clipId} {
      // Allow queries - the where('userId', '==', userId) clause filters to user's own clips
      allow list: if isAuthenticated();
      
      // Allow reading individual document if user owns it
      allow get: if isAuthenticated() 
        && request.auth.uid == resource.data.userId;
      
      // Allow creating clips with own userId
      allow create: if isAuthenticated() 
        && request.auth.uid == request.resource.data.userId;
      
      // Allow updating own clips
      allow update: if isAuthenticated() 
        && request.auth.uid == resource.data.userId;
      
      // Allow deleting own clips
      allow delete: if isAuthenticated() 
        && request.auth.uid == resource.data.userId;
    }
    
    // ============================================
    // SHARED COLLECTIONS
    // ============================================
    
    // FCM tokens - users can access their own token
    // Supports both UID as document ID and email-sanitized ID
    // Uses NextElite's more flexible rule
    match /fcmTokens/{userId} {
      allow get, list: if isAuthenticated() && 
        (request.auth.uid == userId || 
         (resource != null && resource.data.userId == request.auth.uid));
      allow create: if isAuthenticated() && 
        (request.auth.uid == userId || 
         request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAuthenticated() && 
        (request.auth.uid == userId || 
         (resource != null && resource.data.userId == request.auth.uid) ||
         request.resource.data.userId == request.auth.uid);
    }
    
    // Document views - all authenticated users can create and read
    match /documentViews/{viewId} {
      allow get, list, create: if isAuthenticated();
    }
    
    // Notifications collection (for push notifications)
    match /notifications/{notificationId} {
      allow get, list, create: if isAuthenticated();
    }
    
    // ============================================
    // DEFAULT: DENY ALL OTHER ACCESS
    // ============================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 6. Implementation Steps

### Step 1: Create Unified Rules File

1. Copy the unified rules above
2. Save as `firestore.rules` in the **main project** (NextElite or shared location)
3. Or save in each project's root directory

### Step 2: Update firebase.json

Each project's `firebase.json` should reference the rules:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    // ... existing config
  }
}
```

### Step 3: Deploy Rules

**Option A: Deploy from one project**
```bash
cd /path/to/project
firebase deploy --only firestore:rules
```

**Option B: Deploy from each project** (if they have separate firebase.json)
- Each project can deploy the same rules file
- Last deployment wins (they're all for the same Firebase project)

### Step 4: Verify

Test each app:
- ✅ NextElite - Can access classes, students, etc.
- ✅ NextDoc - Can access courses, documents
- ✅ NextEliteTask - Can access tasks, budget collections
- ✅ Clipboard - Can access clips (user-specific)

---

## 7. Security Analysis

### 7.1 Shared Collections (All Authenticated Users)

**Collections:** `classes`, `students`, `teachers`, `courses`, `tasks`, etc.

**Security Model:**
- ✅ All authenticated users can read/list
- ✅ All authenticated users can write
- ⚠️ **Frontend must validate roles/permissions**
- ⚠️ **No server-side role checking in rules**

**Rationale:**
- These are shared business data
- Frontend applications handle authorization
- Rules provide basic authentication check only

### 7.2 User-Specific Collections

**Collections:** `clips`, `fcmTokens`

**Security Model:**
- ✅ Users can only access their own data
- ✅ Ownership checked in rules
- ✅ Server-side enforcement

**Rationale:**
- Personal data must be protected
- Rules enforce ownership at database level

### 7.3 Log/View Collections

**Collections:** `documentViews`, `documentViewLogs`, `notifications`

**Security Model:**
- ✅ All authenticated users can read/create
- ✅ No update/delete (immutable logs)
- ✅ Prevents data tampering

---

## 8. Migration Checklist

- [ ] Create unified `firestore.rules` file
- [ ] Update `firebase.json` in all projects to reference rules
- [ ] Deploy rules to Firebase
- [ ] Test NextElite - verify all collections accessible
- [ ] Test NextDoc - verify courses and documents work
- [ ] Test NextEliteTask - verify tasks and budget collections work
- [ ] Test Clipboard - verify clips are user-specific
- [ ] Verify FCM tokens work in all apps
- [ ] Check console for any permission errors
- [ ] Document any app-specific requirements

---

## 9. Maintenance Guidelines

### 9.1 Adding New Collections

When adding a new collection to any app:

1. **Determine access pattern:**
   - Shared (all authenticated users) → Use `allow get, list: if isAuthenticated()`
   - User-specific (by field) → Use `clips` pattern
   - User-specific (by document ID) → Use `fcmTokens` pattern

2. **Add to unified rules file:**
   - Add collection rule
   - Add to appropriate section (NextElite, NextDoc, etc.)

3. **Deploy rules:**
   - Deploy from any project
   - Rules apply to entire Firebase project

### 9.2 Updating Existing Rules

1. **Edit unified rules file**
2. **Test locally** (if possible)
3. **Deploy to Firebase**
4. **Test all affected apps**

### 9.3 Version Control

- Keep `firestore.rules` in each project's repository
- Or maintain in a shared repository
- Document changes in commit messages

---

## 10. Troubleshooting

### Issue: "Permission Denied" After Deployment

**Possible Causes:**
1. Rules not deployed correctly
2. Collection name mismatch
3. Authentication not working
4. Rule syntax error

**Solutions:**
1. Check Firebase Console → Firestore → Rules (verify rules are deployed)
2. Check browser console for exact collection name
3. Verify user is authenticated (`request.auth != null`)
4. Use Firebase Rules Simulator to test

### Issue: One App Works, Others Don't

**Possible Causes:**
1. Collection not in unified rules
2. Different authentication method
3. Different query pattern

**Solutions:**
1. Add missing collection to rules
2. Verify all apps use same Firebase project
3. Check query patterns match rule expectations

---

## 11. Summary

### Key Points:

1. ✅ **All projects share same Firebase project** - need unified rules
2. ✅ **NextEliteTask was missing rules** - now included
3. ✅ **Clipboard uses user-specific pattern** - correctly implemented
4. ✅ **Consistent syntax** - using `get, list` instead of `read`
5. ✅ **FCM tokens** - using most flexible rule (NextElite's)

### Next Steps:

1. Deploy unified rules to Firebase
2. Test all applications
3. Monitor for permission errors
4. Update documentation as needed

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Ready for Implementation


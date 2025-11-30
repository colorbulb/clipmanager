# Clipboard Manager - Firestore Collections

**Repository:** clipmanager  
**Firebase Project:** nextelite-89f47  
**Last Updated:** November 2024

This document lists all Firestore collections used **exclusively** or **primarily** by the Clipboard Manager app.

## Collections Used by This App

### 1. `clips` (User-Specific) ⭐ PRIMARY
- **Purpose:** Stores clipboard items
- **Access Pattern:** User-specific (users can only access their own clips)
- **Document Structure:**
  ```javascript
  {
    userId: string,        // Owner's user ID (field, not document ID)
    title: string,         // Clip title
    content: string,       // HTML content
    tags: array,          // Tags
    category: string,      // Category
    images: array,        // Base64 image data
    createdAt: timestamp,
    updatedAt: timestamp
  }
  ```
- **Query Pattern:**
  ```javascript
  query(collection(db, 'clips'), where('userId', '==', userId))
  ```
- **Rules Required:**
  ```javascript
  match /clips/{clipId} {
    allow list: if isAuthenticated();  // For queries
    allow get: if isAuthenticated() && request.auth.uid == resource.data.userId;
    allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
    allow update: if isAuthenticated() && request.auth.uid == resource.data.userId;
    allow delete: if isAuthenticated() && request.auth.uid == resource.data.userId;
  }
  ```
- **Notes:**
  - Document ID is auto-generated (not user ID)
  - Uses `userId` field for ownership
  - Requires `list` permission for queries (where clause filters server-side)

## Shared Collections (Used by Multiple Apps)

### `fcmTokens` (User-Specific)
- **Purpose:** FCM push notification tokens
- **Access Pattern:** Users can only access their own token
- **Used By:** All apps (NextElite, NextDoc, NextEliteTask, NextEliteBN, Clipboard)
- **Rules:** Already defined in unified rules

### `notifications` (Shared)
- **Purpose:** Push notifications
- **Access Pattern:** All authenticated users can read/create
- **Used By:** All apps
- **Rules:** Already defined in unified rules

## Collections NOT Used by This App

This app does **NOT** use:
- ❌ `classes`, `students`, `teachers` (NextElite)
- ❌ `courses`, `documentViewLogs` (NextDoc)
- ❌ `tasks`, `budget_incomes`, `budget_expenses` (NextEliteTask)
- ❌ Any NextEliteBN collections

## Important Notes

⚠️ **CRITICAL:** All apps share the **same Firebase project** (`nextelite-89f47`), so:
- All apps must use the **same unified Firestore rules**
- Rules cannot be separated per repository
- When updating rules, must include ALL collections from ALL apps
- See `FIRESTORE_RULES_UNIFIED_COMPARISON.md` for complete unified rules

## When Adding New Collections

If you need to add a new collection to this app:

1. **Document it here** in this file
2. **Add to unified rules** (see `FIRESTORE_RULES_UNIFIED_COMPARISON.md`)
3. **Deploy rules** from any repo: `firebase deploy --only firestore:rules`
4. **Test** that the new collection works

## Rules Deployment

To deploy rules that include this app's collections:
```bash
firebase deploy --only firestore:rules
```

The unified rules file (`firestore.rules`) in this repo includes all collections from all apps.

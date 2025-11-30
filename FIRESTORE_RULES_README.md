# Firestore Rules - Important Information

## ⚠️ Shared Firebase Project

**All repositories share the same Firebase project** (`nextelite-89f47`):
- nextelite
- nextdoc
- nextelitetask
- nextelitebn
- clipmanager

This means **all apps must use the same unified Firestore rules file**.

## 📋 Collection Documentation

Each repository has a `FIRESTORE_COLLECTIONS.md` file that documents:
- Which collections that specific app uses
- What access patterns it needs
- Rules required for those collections

**When updating rules, check all repos' `FIRESTORE_COLLECTIONS.md` files to ensure all collections are included.**

## 🔄 Rules File Location

The unified `firestore.rules` file is maintained in:
- **Primary:** This repository (clipmanager)
- **Copies:** nextelite, nextdoc, nextelitetask (for reference)

All repos should have the same `firestore.rules` file.

## 🚀 Deploying Rules

You can deploy rules from **any repository**:
```bash
firebase deploy --only firestore:rules
```

The rules will apply to the entire Firebase project (all apps).

## 📝 Adding New Collections

If you add a new collection to this app:

1. **Document it** in `FIRESTORE_COLLECTIONS.md`
2. **Add rules** to `firestore.rules` in this repo
3. **Copy updated rules** to other repos (optional, for reference)
4. **Deploy:** `firebase deploy --only firestore:rules`
5. **Test** the new collection

## 🔍 Checking What Collections Are Needed

Before deploying rules, check:
- ✅ `clipmanager/FIRESTORE_COLLECTIONS.md`
- ✅ `nextelite/FIRESTORE_COLLECTIONS.md`
- ✅ `nextdoc/FIRESTORE_COLLECTIONS.md`
- ✅ `nextelitetask/FIRESTORE_COLLECTIONS.md`
- ✅ `nextelitebn/FIRESTORE_COLLECTIONS.md`

Ensure all collections listed in these files are included in `firestore.rules`.

## 📚 Full Documentation

See `FIRESTORE_RULES_UNIFIED_COMPARISON.md` for:
- Complete comparison of all repos' rules
- Unified rules solution
- Security analysis
- Migration guide


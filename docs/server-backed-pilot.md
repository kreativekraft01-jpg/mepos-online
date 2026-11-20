# Rollback and checkout recovery

During evaluation, keep the original repository, service and database independent of this standalone deployment. You can resume using the original service at its original URL. Compare and reconcile any receipts created on the new service before moving sales activity. Changing a Git deployment does not undo a database transaction.

For a code regression on the new service, select a previously working deployment in Render. Check that version supports the current database schema. The initial schema and search indexes use versioned Prisma migrations. Keep a Neon restore point or backup before applying future schema changes.

The current code also supports explicit POS_MODE=legacy for compatibility testing on a disposable database. This mode loads and writes whole-store snapshots. Keep all clients of a given database in one mode. Use a fresh browser profile for compatibility tests to avoid uploading an old snapshot.

A pending online checkout keeps its request ID and line inputs in the same browser tab's session storage. If a response is interrupted, sign in with the same user in that tab and choose Retry checkout to recover the receipt. After closing the tab, reconcile the uncertain sale before recording it again.

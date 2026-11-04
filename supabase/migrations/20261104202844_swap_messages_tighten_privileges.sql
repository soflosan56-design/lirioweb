/*
# Swap messages: tighten table privileges

Plain-English summary: messages were already stored correctly. This change only removes database permissions that the app never uses, so visitors who are not signed in and signed-in users cannot change or delete messages. No messages are deleted.

## 1. Changed permissions
- Visitors (not signed in): no access to the messages table at all.
- Signed-in users: they can read and send messages only. Editing and deleting messages stays blocked.

## 2. Important notes
1. No data is changed.
*/

REVOKE ALL ON swap_messages FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON swap_messages FROM authenticated;

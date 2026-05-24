# Dino Collection Software Architecture

## Front-end

The front-end is a React app built with Vite.

Responsibilities:
- Manage login, registration, active session, and logout with Supabase Auth.
- Show only the authenticated user's collection.
- Read the public card catalog from `public.cards`.
- Add one card manually or add all missing cards for a rarity in bulk.
- Track sets, variants, duplicates, friendships, and historical snapshots.
- Group duplicate variants under their card and collection section in trading views.
- Show duplicates owned by an accepted friend only when the current user is missing that card.
- Exchange predefined quick messages with accepted friends.
- Let users choose a unique nickname for exact friend search.
- Request permanent account deletion through a protected server function.
- Never decide data ownership by itself. It always sends `user_id`, and Supabase RLS validates that it matches the logged-in user.

Main files:
- `src/App.jsx`: user interface, auth flow, collection actions, bulk add.
- `src/supabase.js`: Supabase browser client.

## Back-end

The back-end is Supabase:
- Supabase Auth manages users and email confirmation.
- Postgres stores cards and user collections.
- Row Level Security protects private collection rows.
- An authenticated Edge Function deletes an account through the Admin API after explicit user confirmation.
- The browser uses only the anon/publishable key. Service role keys must never be used in the front-end.

## Database Tables

`public.cards`
- Public catalog of all collectible variants.
- Readable by anonymous and authenticated users.
- Used by the app to know which cards belong to each rarity.
- Contains the base collection plus Time Shifted, Special Card, and Pre Order variants.

Important columns:
- `card_id`: stable card identifier.
- `name`: display name.
- `rarity`: display rarity, such as `Comune`, `Time Shifted`, `Master piece`, or `Safari`.
- `sort_order`: stable ordering.

`public.profiles`
- Public-to-members user identity surface for friend discovery.
- Readable only by authenticated users.
- Editable only by the profile owner.
- `nickname_key` is a generated lowercase key with a unique index, so friend nicknames cannot collide.

`public.friendships`
- Friend request and accepted-friend relationship table.
- Rows are visible only to the requester or recipient.
- Requests can be answered only by the recipient.

`public.collection_snapshots`
- Daily private progression records.
- Readable and writable only by their owner.

`public.friend_messages`
- Immutable quick-message chat rows between accepted friends.
- Stores an allowed message code and, for card requests, the owned card identifier, including historical cards outside the current catalog.
- Does not accept free-form message content.

`public.collections`
- Private ownership table.
- One row means one user owns one card.

Important columns:
- `id`: row id.
- `user_id`: owner, linked to `auth.users.id`.
- `card_id`: owned card identifier.
- `found`: whether the card is owned.
- `dupes`: duplicate count.
- `rarity`: card rarity snapshot.

Constraints:
- Unique ownership is `user_id + card_id`, so two users can own the same card independently.
- `user_id` is required for new collection rows.

## RLS Model

`public.cards`
- Select is allowed for `anon` and `authenticated`.
- No client-side insert/update/delete permissions.

`public.collections`
- `anon` has no table permissions.
- Owners can insert, update, and delete their own rows.
- Accepted friends can read a collection for the trading view, but cannot edit it.

Policies:
- Users can view own cards.
- Accepted friends can view collection cards.
- Users can insert own cards.
- Users can update own cards.
- Users can delete own cards.

`public.friend_messages`
- Only the sender and recipient can read messages while their friendship is accepted.
- Only an authenticated sender in an accepted friendship can insert a message.
- Allowed messages are limited by a database constraint.
- A card request is accepted only when the recipient owns that duplicate and the sender is missing the same owned card identifier.

## App Flows

Registration:
1. User submits email and password.
2. Supabase sends confirmation email.
3. App clears email and password immediately.
4. User confirms email.
5. User must retype credentials and log in.

Login:
1. User submits credentials.
2. Supabase creates a session.
3. App loads that user's collection.

Bulk add:
1. App reads all cards for the chosen rarity from `public.cards`.
2. App compares catalog cards with cards already owned by the current user.
3. App upserts only missing cards into `public.collections`.
4. RLS confirms every inserted row belongs to the current user.

Friends and progress:
1. A member searches another member by exact unique nickname and sends a request.
2. The recipient accepts or declines the request.
3. Accepted friends can view duplicate cards useful to complete their own collection.
4. Friends can exchange only predefined quick messages, including a request for a specific missing card.
5. Daily snapshots remain private to their owner.
6. The Progress view describes collection growth only; duplicate management stays in the Doppioni view.

Logout:
1. Supabase session is cleared.
2. App clears local collection state.
3. Private data disappears from the UI.

Account deletion:
1. The owner types `ELIMINA` in settings and confirms the permanent action.
2. The browser invokes the authenticated `delete-account` Edge Function.
3. The function validates the active user and uses server-only privileges to delete that same account.
4. Database cascading relationships remove the owner's private collection, profile, friendships, snapshots, and messages.

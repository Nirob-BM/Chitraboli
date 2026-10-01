# Rename admin route and refine mobile login

## Changes
- Change the protected admin address from `/admin` to `/localhost-69`.
- Update every admin redirect, navigation link, and admin-page visibility check to use the new address.
- On phone layouts, remove the standalone login control from the top bar and place login/account actions inside the opened menu.
- Preserve the current desktop login/account control.
- Keep email/password, Google sign-in, sign-up, password reset, session handling, profile redirect, and admin redirect working with the renamed route.

## Verification
- Check signed-out mobile navigation and the login page at phone size.
- Confirm the old `/admin` address no longer opens the admin area.
- Confirm `/localhost-69` remains protected and authenticated admins are redirected there.

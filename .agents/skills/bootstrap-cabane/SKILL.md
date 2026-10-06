---
name: bootstrap-cabane
description: Install Cabane dependencies, start its local development server, and open the app in a browser. Use for a fresh checkout or when the user asks to run the app; do not use for deployment or home generation.
---

# Bootstrap Cabane

Bring the repository to an open local app. The product owns all onboarding
after the page loads.

## Run

1. From the repository root, install the locked dependencies with `npm ci`.
   Preserve the checked-in lockfile and package manager.
2. Start `npm run dev` and keep the server running on the loopback address it
   prints. Do not change the bind address.
3. Open that exact URL in the available browser and stop once the product page
   is loaded.

Do not run repository verification unless the user separately asks for it. Do
not create a Home Assistant environment file, request Home Assistant access or
credentials, or reproduce the URL, OAuth, discovery, mapping, or modeling flow
as agent instructions. The in-product experience owns those steps.

If installation or startup fails, report the failing command and its actionable
error without changing product code. Otherwise, report the open local URL.

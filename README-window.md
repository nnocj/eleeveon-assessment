# Eleeveon Window Chrome and Workspace Launch Upgrade

CREATE
- app/components/window/WindowTitleBar.tsx
- app/components/window/WindowChromeRuntime.tsx
- app/context/window-chrome-context.tsx

UPDATE
- public/manifest.json
- app/layout.tsx
- app/providers.tsx
- app/components/role-portals/RolePortalShell.tsx
- app/components/role-portals/shell/PortalHeader.tsx
- app/components/LocalAppearanceRuntime.tsx
- app/globals.css

Behaviour
- Installed desktop Chromium PWAs use Window Controls Overlay when supported.
- Page title, workspace, member image/name/role move into the OS title-bar area.
- The internal header automatically hides duplicated title/member information.
- Unsupported browsers and mobile retain the existing PortalHeader fallback.
- Light/dark appearance updates the window chrome and theme-color meta.
- Opening the installed app at / redirects authenticated users to their active/stored workspace.
- Visitors and signed-out users remain on the public root page.

After deployment, uninstall and reinstall the PWA or clear/update the old manifest so display_override is applied.

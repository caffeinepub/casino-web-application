# Specification

## Summary
**Goal:** Use the user-uploaded logo as the default static fallback site logo used by the header when no custom logo is available or if the header logo fails to load.

**Planned changes:**
- Format the user-provided logo image to a 256×256 square, preserving transparency if present, and save it as `frontend/public/assets/generated/site-logo-fallback.dim_256x256.png`.
- Ensure the frontend requests the fallback logo directly via `/assets/generated/site-logo-fallback.dim_256x256.png` (served as a static asset), without involving backend routes or storage.
- Update the header logo rendering to use the new fallback image when no backend `site-logo` is stored and to fall back to it on image load errors without breaking layout.

**User-visible outcome:** The header reliably displays a default logo (from the uploaded image) whenever no custom site logo is configured or when the logo image fails to load.

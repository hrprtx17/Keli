# Keli AI Brand Logo Resources

To ensure maximum fidelity and pixel-perfect rendering across all devices, screens, and dark/light modes, please place your custom high-quality logo files in this directory.

## Recommended Logos & Files

Please upload your custom logos matching the following names, formats, and specifications:

1. **`logo-light.svg`** or **`logo-light.png`** (Full Horizontal Logo for Light Theme)
   - **Where it is used**: In the Navbar and Sidebar under Light Mode.
   - **Recommended Dimensions**: 600px width x 150px height (horizontal aspect ratio).
   - **Format**: SVG (highly recommended for vector crispness) or high-res transparent PNG.

2. **`logo-dark.svg`** or **`logo-dark.png`** (Full Horizontal Logo for Dark Theme)
   - **Where it is used**: In the Navbar, Sidebar, and Footer under Dark Mode.
   - **Recommended Dimensions**: 600px width x 150px height.
   - **Format**: SVG or high-res transparent PNG.

3. **`icon.svg`** or **`icon.png`** (Square Brand Mark / Favicon)
   - **Where it is used**: Browser tab favicon, Chat Widget launcher bubble, mini avatar icons, and loading animations.
   - **Recommended Dimensions**: 512px x 512px (1:1 square ratio).
   - **Format**: SVG or transparent PNG.

---

### Integration Guide

We have configured the site-wide `Logo.tsx` component to fall back gracefully. Once you drop your files in this folder (`public/logos/`), the website will automatically pull and render them in high-fidelity across both dark and light modes.

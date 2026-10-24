# Meesho-Sale — Fresh static website

This is a clean, mobile-friendly static storefront. It uses plain HTML, CSS and JavaScript, so there is no Node/Vite build step and no `package-lock.json` requirement.

## Included
- Responsive home page, product cards, categories and search
- Product prices of ₹149, ₹199, ₹249 and ₹299
- Cart with quantity controls and subtotal
- 10-minute display countdown
- Checkout preview form (does not collect payments or submit real orders)
- Demo admin panel (PIN `2468`) for adding demo products in the current browser
- Cash on Delivery shown as unavailable

## Publish on GitHub Pages (iPad-friendly)
1. Open your GitHub repository `Meesho-sale-`.
2. On the **Code** tab, delete the old project files/folders that belong to the previous React/Vite setup (for example `.github`, `index.js`, `main.jsx`, `package.json`, `vite.config.js`, and any old `src` folder). Keep a copy if you want to preserve the old version.
3. Upload these three files from this ZIP to the repository root: `index.html`, `style.css`, and `app.js`. You may also upload `README.md`.
4. Commit the files to branch `main`.
5. Open **Settings → Pages**. Set **Build and deployment** to **Deploy from a branch**, choose branch `main` and folder `/(root)`, then Save.
6. Wait a minute or two and open: https://hemantrh18-lang.github.io/Meesho-sale-/

Because this version is plain static HTML, you do not need GitHub Actions or the old `deploy.yml` workflow. If Pages is configured to use GitHub Actions, switch it to deploy from branch `main` / root as described above.

## Important production limitations
- Checkout is a **preview only**. No payment is taken, no real order is submitted, and customer details are not sent to a server.
- The demo admin PIN is visible in the code and is not secure. Browser-local changes are not shared with other visitors.
- Before accepting customers or payments, connect a trusted payment provider and a secure backend/database. Never put payment secrets or private API keys in browser code.
- This is an independent demo storefront and is not affiliated with or endorsed by Meesho.

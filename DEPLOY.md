# Color Fuse Deployment Notes

App Name: Color Fuse
Tagline: Mix a swatch
Description: Save a two-color blend with label, mood, note, wallet, and timestamp on Base as a public swatch receipt.

## After Base Gives `base:app_id`

Copy the meta tag to Codex. The app id must be written to:

- `src/app/layout.tsx`
- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BASE_APP_ID`

Then deploy once with the project token in `Vercel.txt`, deploy the contract, and write the contract address to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_COLOR_FUSE_CONTRACT_ADDRESS`

## After Base Gives Builder Code

Write the Builder Code to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BUILDER_CODE`

Then run production deploy again.

## Required Vercel Production Env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0babc9b8f12662c9140c6a
NEXT_PUBLIC_BUILDER_CODE=replace_with_builder_code
NEXT_PUBLIC_COLOR_FUSE_CONTRACT_ADDRESS=replace_with_color_fuse_contract_address
```

## Contract

```bash
npm run deploy:contract
```

# Share card

The public share image is `chase-share-v3.jpg`, a 1200 x 630 JPEG. It is a capture of the homepage itself (the painted sky, the name and the sunflower) with the nav and icon links hidden, taken by `share-src/render-home-card.mjs`. The comment at the top of that file has the command. Open Graph and X metadata in `index.html` reference its absolute URL on `https://explodingcb.com`.

When replacing the image, use a new versioned filename and update both image URLs and their dimensions in the page metadata. This gives preview services a fresh image URL.

`chase-share-v2.jpg` (the text-character forest, still used by the About page) and `chase-share-v1.jpg` (the first, AI-generated card) are kept so previews already cached against them still resolve.

## Metadata references

- [Open Graph protocol](https://ogp.me/)
- [Apple: Create rich previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages/)
- [Google: Profile page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

## ChApp Store cards

The store and each app page under `/apps/` have their own 1200 x 630 card in `assets/apps/share/`. Those are rendered from `share-src/app-card.html` rather than generated; the comment at the top of that file has the command. The same versioned-filename rule applies.

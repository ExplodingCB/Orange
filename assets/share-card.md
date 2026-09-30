# Share card

The public share image is `chase-share-v2.jpg`, a 1200 x 630 JPEG. It is rendered from `share-src/home-card.html`, which draws the forest with the site's own `journey.js`, so the card matches the homepage. The comment at the top of that file has the render command. Open Graph and X metadata in `index.html` reference its absolute URL on `https://explodingcb.com`.

When replacing the image, use a new versioned filename and update both image URLs and their dimensions in the page metadata. This gives preview services a fresh image URL.

`chase-share-v1.jpg` is the earlier, AI-generated card, kept so previews already cached against it still resolve.

## Metadata references

- [Open Graph protocol](https://ogp.me/)
- [Apple: Create rich previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages/)
- [Google: Profile page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

## ChApp Store cards

The store and each app page under `/apps/` have their own 1200 x 630 card in `assets/apps/share/`. Those are rendered from `share-src/app-card.html` rather than generated; the comment at the top of that file has the command. The same versioned-filename rule applies.

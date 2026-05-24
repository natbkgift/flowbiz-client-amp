# Asset Usage Review

## Summary

The prototype uses only local assets from `static-prototype/assets/images/` and `static-prototype/assets/icons/`. No external hotlinked images are used. Several project/import images are production-usable candidates, but the legacy 150x100 PNG placeholders are not production-quality for hero, card or gallery usage.

## Images Used

| Page | Image File | Usage | Good Match? | Notes |
|---|---|---|---|---|
| Home | `hero-banner.webp` | Hero background | Yes | Good visual tone and local asset. Confirm final crop at mobile. |
| Home | `riviera-beverly-hills.webp` | Featured project | Yes | Good project-specific image. |
| Home | `once-wongamat.jpg` | Featured project and area card | Yes | Good quality, but reused for area card. |
| Home | `grand-solaire.jpg` | Featured property/project | Yes | Good quality. |
| Home | `riviera-palm-beach.jpg` | Area/project visual | Yes | Wide crop works for cards, needs art direction for square cards. |
| Home | `arom-jomtien.jpg` | Area/project visual | Yes | Good resolution. |
| Buy | `grand-solaire.jpg` | Property card | Yes | Strong listing image. |
| Buy | `once-wongamat.jpg` | Property card | Yes | Strong listing image. |
| Buy | `riviera-palm-beach.jpg` | Property card | Yes | Strong but wide aspect ratio. |
| Buy | `seaspire-jomtien.jpg` | Property card | Yes | High resolution, largest file in prototype. Optimize before production. |
| Buy | `arom-jomtien.jpg` | Property card | Yes | Strong listing image. |
| Buy | `villa-garden.png` | Villa card | No | 150x100 placeholder. |
| Rent | `once-pattaya-rent.jpg` | Rental card | Yes | Portrait image needs crop handling. |
| Rent | `arom-jomtien.jpg` | Rental card | Yes | Good image. |
| Rent | `villa-garden.png` | Villa rental card | No | 150x100 placeholder. |
| Projects | `riviera-beverly-hills.webp` | Project card | Yes | Good match. |
| Projects | `once-wongamat.jpg` | Project card | Yes | Good match. |
| Projects | `seaspire-jomtien.jpg` | Project card | Yes | Good match, optimize before production. |
| Project Detail | `riviera-beverly-hills.webp` | Hero gallery | Yes | Good primary image. |
| Project Detail | `project-overview.png` | Gallery tile | No | 150x100 placeholder. |
| Project Detail | `property-pool.png` | Gallery tile | No | 150x100 placeholder. |
| Project Detail | `property-interior.png` | Gallery tile | No | 150x100 placeholder. |
| Project Detail | `seaspire-jomtien.jpg` | Gallery/related card | Partial | Real project image, not the same project. |
| Project Detail | `once-wongamat.jpg` | Related project | Yes | Good project image. |
| Project Detail | `arom-jomtien.jpg` | Related project | Yes | Good project image. |
| Property Detail | `grand-solaire.jpg` | Main gallery | Yes | Good match for Grand Solaire. |
| Property Detail | `property-interior.png` | Thumbnail | No | Low-resolution placeholder. |
| Property Detail | `property-pool.png` | Thumbnail | No | Low-resolution placeholder. |
| Property Detail | `property-exterior.png` | Thumbnail | No | Low-resolution placeholder. |
| Property Detail | `once-wongamat.jpg` | Similar card | Yes | Good image. |
| Property Detail | `arom-jomtien.jpg` | Similar card | Yes | Good image. |
| Property Detail | `seaspire-jomtien.jpg` | Similar card | Yes | Good image. |
| Property Detail | `riviera-palm-beach.jpg` | Similar card | Yes | Good image. |
| Sell | `property-exterior.png` | Seller page visual | No | Low-resolution placeholder. |
| About | `team-photo.png` | Team/advisor section | No | Low-resolution placeholder. |
| Shortlist | `grand-solaire.jpg` | Saved property card | Yes | Good image. |
| Shortlist | `riviera-beverly-hills.webp` | Saved project card | Yes | Good image. |
| Compare | `riviera-beverly-hills.webp` | Comparison card | Yes | Good image. |
| Compare | `once-wongamat.jpg` | Comparison card | Yes | Good image. |
| Compare | `seaspire-jomtien.jpg` | Comparison card | Yes | Good image. |
| Smart Finder | `riviera-beverly-hills.webp` | Recommended result | Yes | Good image. |
| Smart Finder | `once-wongamat.jpg` | Recommended result | Yes | Good image. |
| Smart Finder | `seaspire-jomtien.jpg` | Recommended result | Yes | Good image. |
| Area Guide | `once-wongamat.jpg` | Area hero/project | Yes | Good image, but should be replaced by area-specific photography. |
| Area Guide | `riviera-palm-beach.jpg` | Project/area card | Yes | Good image. |
| Area Guide | `arom-jomtien.jpg` | Project/area card | Yes | Good image. |
| Admin Property Form | `grand-solaire.jpg` | Media upload preview | Yes | Fine as example only. |
| Admin Project Form | `riviera-beverly-hills.webp` | Gallery preview | Yes | Fine as example only. |

## Placeholder Images

| Page | Placeholder | Reason | Replacement Needed |
|---|---|---|---|
| Buy, Rent | `villa-garden.png` | 150x100 generic villa placeholder | Real pool villa exterior/interior at minimum 1200px wide. |
| Project Detail | `project-overview.png` | 150x100 generic project placeholder | Project-specific lobby/exterior/render/gallery images. |
| Project Detail, Property Detail | `property-pool.png` | 150x100 generic pool placeholder | Real amenity/pool photography per project. |
| Project Detail, Property Detail | `property-interior.png` | 150x100 generic interior placeholder | Unit-specific interior image or staged render. |
| Property Detail, Sell | `property-exterior.png` | 150x100 generic exterior placeholder | Property-specific exterior or seller service photo. |
| About | `team-photo.png` | 150x100 generic team placeholder | Licensed team/advisor photography. |
| Area Guide | `area-guide-pattaya.png` | 150x100 area placeholder, currently not heavily used | Area-specific hero images for Wongamat, Jomtien, Pratumnak, Na Jomtien, Central Pattaya and Bang Saray. |
| Blog/unused | `blog-real-estate.png`, `condo-view.png` | Low-resolution legacy placeholders | Replace before any blog/editorial migration. |

## Missing Design Assets

| Needed Asset | Where Needed | Priority |
|---|---|---|
| Full project gallery sets for Riviera Beverly Hills, Once Wongamat, Skypark Lucean Jomtien, Grand Solaire Noble and Arom Wongamat | Project detail, property detail, cards | High |
| Unit interior galleries by listing | Property detail, Buy, Rent, Similar properties | High |
| Area photography for Wongamat, Pratumnak, Jomtien, Na Jomtien, Central Pattaya, Bang Saray | Home area section, Area Guide | High |
| Advisor/team portraits with usage rights | About, Contact, lead rail, admin activity | Medium |
| Map/pin visual assets or production map style | Projects, Project Detail, Area Guide, Contact | Medium |
| Floor plan images/PDF thumbnails per project | Project Detail, Property Detail | Medium |
| Admin media/upload empty-state illustrations | Admin forms/media sections | Low |

## Production Asset Recommendations

- Prefer existing production image pipeline: `public/media/import-assets`, `LocalMediaImage`, `SafeCoverImage`, `RemoteImage` and Next image configuration.
- Do not copy `static-prototype/assets/images/` directly into production unless the file has confirmed rights, sufficient resolution and correct entity mapping.
- Replace 150x100 PNG placeholders before migrating hero, gallery or large-card surfaces.
- Audit file sizes before production. `seaspire-jomtien.jpg` is roughly 1 MB and should be optimized or served through Next image optimization.
- Keep all images local or managed by the app media pipeline. Do not hotlink third-party imagery.


# AI Image Generation Prompts for Real Estate

## Overview
This document provides comprehensive AI prompts for generating property images, marketing graphics, and visual content for Asset Management Property using AI tools like Midjourney, DALL-E 3, Stable Diffusion, and other image generation platforms.

## How to Use These Prompts

1. **Choose the appropriate AI tool** based on your needs:
   - **Midjourney**: Best for artistic, architectural renders
   - **DALL-E 3**: Best for photorealistic scenes, complex compositions
   - **Stable Diffusion**: Best for customization, local generation
   - **Adobe Firefly**: Best for commercial-safe images

2. **Select the prompt type** that matches your content need
3. **Replace [VARIABLES]** with specific details
4. **Copy the complete prompt** into your chosen AI tool
5. **Adjust technical parameters** for your platform requirements
6. **Generate multiple variations** and select the best
7. **Post-process if needed** (color correction, text overlay, branding)

---

## Property Render Prompts

### Luxury Beachfront Condo Exterior

#### Midjourney Prompt
```
[STYLE] architectural photography of luxury beachfront condominium in Pattaya Thailand, 
[NUMBER]-story modern building with [ARCHITECTURAL_FEATURES], floor-to-ceiling glass windows, 
infinity pool on rooftop, tropical landscaping with palm trees, golden hour lighting, 
crystal clear turquoise ocean in background, white sand beach, contemporary Thai architecture, 
premium materials [MATERIALS], [VIEW_ANGLE], professional real estate photography, 
ultra detailed, photorealistic, 8K resolution --ar [ASPECT_RATIO] --style raw --v 6
```

**Variables:**
- `[STYLE]` - Contemporary, Modern luxury, Minimalist, Resort-style
- `[NUMBER]` - Building height (8, 15, 25, 30)
- `[ARCHITECTURAL_FEATURES]` - curved balconies, geometric facades, flowing design, stepped terraces
- `[MATERIALS]` - white marble, natural stone, brushed metal, wood accents
- `[VIEW_ANGLE]` - aerial view, street level, three-quarter angle, dramatic low angle
- `[ASPECT_RATIO]` - 16:9 (landscape), 4:5 (Instagram), 9:16 (Stories), 1:1 (square)

**Technical Parameters:**
- Resolution: 8K (3840x2160) for web
- Quality: Maximum
- Lighting: Golden hour (warm, soft)
- Style: Raw photographic (--style raw for Midjourney v6)

**Negative Prompts (What to Avoid):**
```
--no people, cars, text, watermarks, low quality, blurry, distorted, unrealistic, 
cartoon, illustration, oversaturated, dark shadows, cloudy sky
```

**Expected Output:** Photorealistic luxury condominium with dramatic lighting, clear architectural details, appealing beach setting

---

### Modern Condo Interior - Living Room

#### DALL-E 3 Prompt
```
Photorealistic interior design of luxury condominium living room in Pattaya Thailand, 
[SIZE] space with [CEILING_HEIGHT] ceiling, floor-to-ceiling windows overlooking 
[VIEW] view, [COLOR_SCHEME] color palette, [FURNITURE_STYLE] furniture, 
[FLOORING] flooring, modern [LIGHTING_TYPE], minimalist decor with Thai accents, 
indoor plants, open concept design, natural lighting, professional interior photography, 
ultra high definition, 8K quality, shot with [CAMERA_SPECS]
```

**Variables:**
- `[SIZE]` - Spacious 45sqm, Compact 30sqm, Generous 60sqm
- `[CEILING_HEIGHT]` - 3-meter high, double-height, standard
- `[VIEW]` - ocean, city skyline, mountain, pool, garden
- `[COLOR_SCHEME]` - Neutral whites and grays, Warm earth tones, Cool blues and whites, Sophisticated dark tones
- `[FURNITURE_STYLE]` - Contemporary Scandinavian, Modern luxury, Minimalist Japanese, Tropical modern
- `[FLOORING]` - Polished marble, Light oak wood, Porcelain tiles, Engineered hardwood
- `[LIGHTING_TYPE]` - LED strip lighting, Pendant lights, Recessed lighting, Designer fixtures
- `[CAMERA_SPECS]` - Sony A7R IV with 24mm wide-angle lens, Canon 5D Mark IV

**Composition Guidelines:**
- Rule of thirds
- Show depth with foreground, midground, background
- Include lifestyle elements (books, coffee, plants)
- Balance furnished and open space

**Style Variations:**
1. **Minimalist Modern**: Clean lines, neutral palette, sparse decor
2. **Tropical Luxury**: Natural materials, plants, warm tones
3. **Contemporary Thai**: Modern with traditional Thai elements
4. **Smart Home**: Visible technology, modern integration

---

### Bedroom Interior

#### Stable Diffusion Prompt
```
((photorealistic)), masterpiece, best quality, ultra detailed, 8k resolution, 
luxury condominium master bedroom interior, [BED_SIZE] bed with [BEDDING_STYLE], 
[DESIGN_STYLE] design, balcony access with [VIEW] view through sliding glass doors, 
[COLOR_PALETTE], [FLOORING], soft ambient lighting, [FEATURES], 
peaceful atmosphere, hotel-like quality, professional architecture photography, 
perfect lighting, sharp focus, high dynamic range
```

**Variables:**
- `[BED_SIZE]` - King-size, Queen-size, Super king
- `[BEDDING_STYLE]` - white hotel-quality linens, luxury silk bedding, contemporary gray
- `[DESIGN_STYLE]` - Modern minimalist, Boutique hotel, Romantic luxury, Contemporary zen
- `[VIEW]` - sea, city lights, tropical garden, pool area
- `[COLOR_PALETTE]` - Soft neutrals with gold accents, All-white serenity, Warm beige and cream, Cool gray and blue
- `[FLOORING]` - Warm hardwood, Marble, Carpet, Wood-look tile
- `[FEATURES]` - walk-in closet, ensuite bathroom, study corner, seating area

**Negative Prompt:**
```
(low quality), (worst quality), blurry, distorted, disfigured, unrealistic colors, 
oversaturated, people, cluttered, messy, dark, gloomy, watermark, text
```

**Model Settings:**
- Sampling Steps: 30-50
- CFG Scale: 7-9
- Sampling Method: DPM++ 2M Karras or Euler A

---

### Kitchen & Dining Area

#### Midjourney Prompt
```
Professional architectural photography of modern luxury condo kitchen in Pattaya, 
[LAYOUT] layout, [CABINET_COLOR] custom cabinetry with [FINISH], 
[COUNTERTOP] countertops, [APPLIANCES] appliances, [BACKSPLASH], 
large island with [ISLAND_SEATING], open concept dining area, pendant lighting, 
natural light from windows, contemporary Thai style, clean minimalist design, 
professional real estate photography, ultra detailed, 8K --ar 16:9 --style raw --v 6
```

**Variables:**
- `[LAYOUT]` - Open concept, Galley with island, L-shaped, U-shaped
- `[CABINET_COLOR]` - White gloss, Natural wood tone, Dark charcoal, Two-tone (white and wood)
- `[FINISH]` - handleless modern, minimalist hardware, gold hardware accents
- `[COUNTERTOP]` - White quartz, Black granite, Marble, Solid surface
- `[APPLIANCES]` - Stainless steel European, Built-in black, Premium brands visible
- `[BACKSPLASH]` - Subway tile, Large format porcelain, Glass, Natural stone
- `[ISLAND_SEATING]` - bar seating for 4, breakfast bar, integrated dining table

---

### Bathroom Luxury Shots

#### DALL-E 3 Prompt
```
Ultra-luxury bathroom interior in Pattaya beachfront condominium, 
[STYLE] design, [SIZE] space, [CENTERPIECE], floor-to-ceiling [TILES], 
separate rainfall shower with glass enclosure, [VANITY], [LIGHTING], 
large mirror with [MIRROR_LIGHTING], [WINDOW_VIEW], white towels, 
spa-like atmosphere, high-end fixtures in [FINISH], tropical plants, 
professional interior photography, perfect lighting, 8K resolution, photorealistic
```

**Variables:**
- `[STYLE]` - Contemporary spa, Modern luxury, Hotel-inspired, Minimalist zen
- `[SIZE]` - Generous master bathroom, Compact elegant, Spacious ensuite
- `[CENTERPIECE]` - freestanding soaking tub, large walk-in shower, modern vanity feature
- `[TILES]` - Large format marble-look porcelain, Natural stone, White subway, Gray contemporary
- `[VANITY]` - Double floating vanity, Single statement piece, Wall-mounted modern
- `[LIGHTING]` - Backlit mirror, Pendant lights, Recessed LED, Natural skylight
- `[MIRROR_LIGHTING]` - LED backlight, Sconce lighting, Smart mirror
- `[WINDOW_VIEW]` - Ocean view (with privacy), Garden view, Frosted for privacy, None
- `[FINISH]` - Brushed gold, Matte black, Chrome, Brushed nickel

---

## Lifestyle & Amenity Images

### Resort-Style Pool Area

#### Midjourney Prompt
```
Stunning infinity swimming pool at luxury condominium in Pattaya Thailand, 
[POOL_TYPE], [SIZE] pool with [EDGE_STYLE] edge, [DECK_MATERIAL] deck, 
[SEATING_AREA], tropical landscaping with [PLANTS], [BACKGROUND_VIEW], 
[TIME_OF_DAY] lighting, [WATER_COLOR], [ARCHITECTURAL_ELEMENTS], 
luxury resort atmosphere, professional hospitality photography, 
ultra detailed, photorealistic, 8K --ar 16:9 --style raw --v 6
```

**Variables:**
- `[POOL_TYPE]` - Rooftop infinity, Ground level resort-style, Multi-level cascading
- `[SIZE]` - 25-meter lap pool, Large freeform, Olympic-sized
- `[EDGE_STYLE]` - Infinity overlooking ocean, Knife-edge modern, Traditional tile edge
- `[DECK_MATERIAL]` - Wooden deck, Natural stone pavers, Light concrete, Composite decking
- `[SEATING_AREA]` - Pool loungers with umbrellas, Cabanas, Sunbathing area, Poolside bar
- `[PLANTS]` - Palm trees, Tropical foliage, Manicured gardens, Bamboo features
- `[BACKGROUND_VIEW]` - Ocean panorama, City skyline, Mountain backdrop, Garden vista
- `[TIME_OF_DAY]` - Golden hour sunset, Bright morning, Blue hour twilight, Midday sun
- `[WATER_COLOR]` - Crystal clear turquoise, Deep blue, Emerald green, Mirror-like reflection
- `[ARCHITECTURAL_ELEMENTS]` - Modern pavilion, Glass balustrades, Stone features, Wood pergola

**Negative Prompt:**
```
--no people, crowded, cluttered, dirty, old, damaged, text, watermark
```

---

### Fitness Center

#### DALL-E 3 Prompt
```
Modern fitness center in luxury Pattaya condominium, [SIZE] space with 
[CEILING_HEIGHT] ceiling, [EQUIPMENT_LIST], [FLOORING], floor-to-ceiling 
windows with [VIEW], [LIGHTING], [COLOR_SCHEME], mirrors on walls, 
air-conditioned space, motivational atmosphere, professional gym photography, 
clean and organized, high-end fitness facility, 8K resolution, photorealistic
```

**Variables:**
- `[SIZE]` - Spacious 150sqm, Compact 80sqm, Large multi-zone 200sqm+
- `[CEILING_HEIGHT]` - High ceiling with exposed concrete, Standard with modern lighting
- `[EQUIPMENT_LIST]` - Latest cardio machines, free weights section, strength training equipment, TRX area, yoga mats
- `[FLOORING]` - Rubber gym flooring, Wood-look athletic floor
- `[VIEW]` - Ocean view, Pool view, City view, Garden view
- `[LIGHTING]` - Natural daylight, Modern pendant lights, LED strip lighting, Energizing bright lights
- `[COLOR_SCHEME]` - Energetic red accents, Calm blue and gray, Modern black and white, Natural wood tones

---

### Co-working Space / Lounge

#### Midjourney Prompt
```
Contemporary co-working lounge in Pattaya luxury condominium, 
[LAYOUT] space design, [SEATING_OPTIONS], [WORK_ZONES], 
high-speed WiFi visible symbols, [DESIGN_STYLE], [COLOR_SCHEME], 
natural light from [WINDOW_TYPE], [FLOORING], [LIGHTING], 
coffee bar area, [TECH_FEATURES], comfortable and productive atmosphere, 
professional workspace photography, modern and inviting, 8K --ar 16:9 --v 6
```

**Variables:**
- `[LAYOUT]` - Open concept, Divided zones, Flexible arrangement
- `[SEATING_OPTIONS]` - Individual work pods, Communal tables, Comfortable lounge seating, Private booths
- `[WORK_ZONES]` - Quiet work area, Collaboration zone, Phone booths, Lounge area
- `[DESIGN_STYLE]` - Modern minimalist, Creative industrial, Comfortable contemporary, Scandinavian
- `[COLOR_SCHEME]` - Professional neutrals, Energizing yellow and gray, Calming blue and wood, Modern mono-chrome
- `[WINDOW_TYPE]` - Floor-to-ceiling windows, Large picture windows, Balcony access
- `[FLOORING]` - Wood-look vinyl, Carpet tiles, Polished concrete
- `[LIGHTING]` - Task lighting, Pendant lights, Natural light, Adjustable LED
- `[TECH_FEATURES]` - Large monitors, Charging stations, Video conferencing setup, Smart boards

---

## Marketing Graphics & Social Media

### Property Feature Infographic

#### DALL-E 3 Prompt
```
Clean modern infographic design for Pattaya real estate property features, 
[LAYOUT_STYLE] layout, [COLOR_SCHEME] based on Asset Management Property branding, 
[NUMBER] key features displayed with [ICON_STYLE] icons, 
[DATA_VISUALIZATION] for property statistics, minimalist design, 
professional real estate marketing, clear hierarchy, easy to read at small sizes, 
suitable for Instagram post, 8K quality, [BACKGROUND]
```

**Variables:**
- `[LAYOUT_STYLE]` - Vertical flow, Grid layout, Circular design, Timeline style
- `[COLOR_SCHEME]` - Blue and gold professional, Teal and white fresh, Modern grayscale with accent color
- `[NUMBER]` - 4, 5, 6, 8 (key features)
- `[ICON_STYLE]` - Line icons minimalist, Filled modern, Flat design, 3D subtle
- `[DATA_VISUALIZATION]` - Bar charts, Comparison tables, Number highlights, Progress indicators
- `[BACKGROUND]` - White clean, Gradient subtle, Property photo blurred, Solid color

**Content Elements to Include:**
- Property size (sqm)
- Bedrooms/Bathrooms count
- Price or price range
- Key amenities (pool, gym, parking, security)
- Distance to beach/city
- ROI or rental yield (for investors)

---

### Before & After Renovation Comparison

#### Midjourney Prompt
```
Split-screen comparison image showing [ROOM_TYPE] renovation transformation, 
left side: [BEFORE_STATE], right side: [AFTER_STATE], 
same camera angle and composition, clear visual divide, 
[DESIGN_STYLE] renovation in Pattaya condominium, 
dramatic improvement, professional before-after photography, 
realistic lighting, high contrast between old and new, 8K quality 
--ar 16:9 --style raw --v 6
```

**Variables:**
- `[ROOM_TYPE]` - Living room, Kitchen, Bathroom, Bedroom, Balcony
- `[BEFORE_STATE]` - Outdated 90s style, Worn and tired, Basic developer finish, Dark and cramped
- `[AFTER_STATE]` - Modern luxury, Fresh contemporary, Bright and open, Designer quality
- `[DESIGN_STYLE]` - Contemporary modern, Minimalist white, Natural tropical, Industrial chic

**Composition Tips:**
- Use vertical divider (50/50 split)
- Match perspective and framing exactly
- Show clear improvement
- Add subtle labels "Before" / "After" (can be added in post)

---

### Property Comparison Chart Visual

#### DALL-E 3 Prompt
```
Professional property comparison infographic for Pattaya real estate, 
comparing [NUMBER] properties side by side, [LAYOUT] layout, 
showing [COMPARISON_FACTORS], [VISUAL_STYLE] design, 
blue and white color scheme matching Asset Management Property brand, 
clear data visualization, icons for features, pricing highlighted, 
easy to understand at glance, suitable for Facebook and Instagram, 
high quality marketing material, 8K resolution
```

**Variables:**
- `[NUMBER]` - 2, 3, or 4 properties
- `[LAYOUT]` - Horizontal columns, Vertical rows, Grid format
- `[COMPARISON_FACTORS]` - Price, Size, Location, Amenities, ROI, Distance to beach, Rental potential
- `[VISUAL_STYLE]` - Modern minimalist, Data-rich detailed, Simple clean, Professional corporate

---

### Location Map Visualization

#### Midjourney Prompt
```
Stylized illustrated map of Pattaya showing [PROPERTY_LOCATION] and key landmarks, 
[MAP_STYLE] design, showing [LANDMARKS], distance markers, 
[VIEWPOINT], clean and modern illustration, blue pins for properties, 
icons for attractions, [DETAIL_LEVEL], suitable for real estate marketing, 
professional cartography style, 8K quality --ar 16:9 --v 6
```

**Variables:**
- `[PROPERTY_LOCATION]` - Central Pattaya, Jomtien, Naklua, Pratumnak, Wong Amat
- `[MAP_STYLE]` - Minimal modern, Illustrated colorful, Professional cartographic, Isometric 3D
- `[LANDMARKS]` - Beach, Walking Street, Terminal 21, Big C, Schools, Hospitals, Shopping malls
- `[VIEWPOINT]` - Bird's eye view, Angled perspective, Flat top-down
- `[DETAIL_LEVEL]` - Simple key points only, Moderate detail with streets, Highly detailed with all features

**Essential Elements:**
- Property location (highlighted)
- Beach/waterfront
- Major roads
- Shopping centers
- Hospitals/medical
- International schools
- Entertainment areas
- Distance indicators (km)

---

### Investment ROI Visualization

#### DALL-E 3 Prompt
```
Professional financial infographic showing property investment ROI in Pattaya, 
[CHART_TYPE] visualization, [TIME_PERIOD] projection, 
showing [KEY_METRICS], blue and green color scheme for growth, 
clean modern financial design, easy-to-understand data presentation, 
currency in Thai Baht, percentage returns highlighted, 
professional investment marketing material, 8K quality, suitable for LinkedIn
```

**Variables:**
- `[CHART_TYPE]` - Line graph showing appreciation, Bar chart comparing returns, Pie chart for expense breakdown, Combined dashboard
- `[TIME_PERIOD]` - 5-year projection, 10-year outlook, Annual breakdown
- `[KEY_METRICS]` - Capital appreciation %, Rental yield %, Total ROI, Monthly income, Initial investment vs. current value

---

## Architectural Render Variations

### Aerial/Drone Perspective

#### Midjourney Prompt
```
Aerial drone photography of [PROJECT_NAME] in Pattaya, bird's eye view, 
[HEIGHT] altitude, showing [COMPLEX_LAYOUT], surrounding [CONTEXT], 
[WEATHER_CONDITIONS], [TIME_OF_DAY], professional real estate drone photography, 
ultra high resolution, 8K, cinematic composition, showing scale and location 
--ar 16:9 --style raw --v 6
```

**Variables:**
- `[PROJECT_NAME]` - Specific project or generic "luxury beachfront condominium complex"
- `[HEIGHT]` - 100 meters up, 200 meters aerial, High altitude overview
- `[COMPLEX_LAYOUT]` - Multiple towers, Single tower with amenities, Sprawling resort-style development
- `[CONTEXT]` - Beachfront location, Urban setting, Surrounded by greenery, Near marina
- `[WEATHER_CONDITIONS]` - Clear blue sky, Partly cloudy, Dramatic clouds, Perfect sunny day
- `[TIME_OF_DAY]` - Golden hour, Midday sun, Blue hour twilight, Daytime clear

---

### Night/Evening Illuminated

#### DALL-E 3 Prompt
```
Stunning nighttime architectural photography of luxury condominium in Pattaya, 
[BUILDING_STYLE] building fully illuminated, [LIGHTING_FEATURES], 
blue hour sky, [CONTEXT_LIGHTS], warm interior lighting visible through windows, 
architectural lighting on facade, [FOREGROUND], dramatic evening atmosphere, 
professional long-exposure photography, 8K resolution, photorealistic
```

**Variables:**
- `[BUILDING_STYLE]` - Modern curved, Contemporary angular, Sleek minimalist, Resort-style low-rise
- `[LIGHTING_FEATURES]` - LED facade lighting, Uplighting on structure, Pool glow, Rooftop highlights
- `[CONTEXT_LIGHTS]` - City lights in background, Beach reflections, Street lighting, Other buildings lit
- `[FOREGROUND]` - Landscaped entry, Pool area, Reflection in water feature, Approaching driveway

---

### Interior-Exterior Connection

#### Midjourney Prompt
```
Luxury condo living room with massive sliding glass doors fully open, 
seamless indoor-outdoor living, interior: [INTERIOR_STYLE], 
exterior: [EXTERIOR_SPACE], [VIEW] visible beyond, [TIME_OF_DAY], 
no barrier between inside and outside, tropical breeze feeling, 
Pattaya Thailand lifestyle, professional architectural photography, 
perfect lighting balance inside and out, 8K --ar 16:9 --style raw --v 6
```

**Variables:**
- `[INTERIOR_STYLE]` - Modern minimalist, Contemporary luxury, Comfortable tropical
- `[EXTERIOR_SPACE]` - Large balcony with furniture, Private pool terrace, Garden area, Expansive deck
- `[VIEW]` - Ocean panorama, City skyline, Tropical garden, Pool area
- `[TIME_OF_DAY]` - Sunset golden hour, Bright afternoon, Early morning, Twilight

---

## Seasonal & Campaign-Specific Images

### Songkran (Thai New Year) Themed

#### DALL-E 3 Prompt
```
Festive Songkran celebration at Pattaya condominium pool area, 
traditional Thai water festival elements, [SETTING], modern luxury property, 
tasteful decorations with [THAI_ELEMENTS], [WATER_FEATURES], 
tropical flowers, happy celebratory atmosphere without people visible, 
cultural respect, professional event photography, 8K quality, suitable for Thai audience
```

**Variables:**
- `[SETTING]` - Pool area, Lobby, Garden area, Rooftop
- `[THAI_ELEMENTS]` - Jasmine garlands, Traditional Thai flowers, Respectful Buddhist symbols, Thai flags
- `[WATER_FEATURES]` - Decorative water bowls, Flower floating in pools, Water elements

---

### Loy Krathong Themed

#### Midjourney Prompt
```
Romantic Loy Krathong evening at luxury Pattaya waterfront condominium, 
[WATER_SETTING] with [KRATHONG_ELEMENTS], soft lantern lighting, 
full moon visible, traditional Thai elements, elegant and peaceful atmosphere, 
modern property with cultural celebration, no people, professional photography, 
8K resolution --ar 4:5 --v 6
```

**Variables:**
- `[WATER_SETTING]` - Pool decorated, Beachfront view, Water feature, Private pond
- `[KRATHONG_ELEMENTS]` - Floating krathongs with candles, Decorated banana leaf boats, Flowers and incense

---

### Christmas/New Year Holiday

#### DALL-E 3 Prompt
```
Elegant holiday season at luxury Pattaya condominium, [LOCATION] with 
sophisticated [DECORATIONS], tropical meets winter holiday theme, 
upscale and tasteful, [LIGHTING], modern luxury property, 
warm inviting atmosphere, no people, professional photography, 8K quality
```

**Variables:**
- `[LOCATION]` - Lobby entrance, Pool area, Rooftop lounge, Garden area
- `[DECORATIONS]` - Elegant Christmas tree, Warm string lights, Tropical-modern holiday decor, Subtle festive touches
- `[LIGHTING]` - Warm golden lights, White fairy lights, Colored ambient lighting, Natural with accents

---

## Technical Specifications Reference

### Resolution Standards

**Platform-Specific Requirements:**

| Platform | Optimal Size | Aspect Ratio | Format |
|----------|--------------|--------------|--------|
| Facebook Feed | 1200 x 630 px | 1.91:1 | JPG/PNG |
| Facebook Story | 1080 x 1920 px | 9:16 | JPG/PNG |
| Instagram Feed | 1080 x 1080 px | 1:1 | JPG |
| Instagram Story | 1080 x 1920 px | 9:16 | JPG/PNG |
| Instagram Reels | 1080 x 1920 px | 9:16 | JPG cover |
| TikTok | 1080 x 1920 px | 9:16 | JPG |
| LinkedIn | 1200 x 627 px | 1.91:1 | JPG/PNG |
| LINE | 1040 x 1040 px | 1:1 | JPG |
| Website Hero | 1920 x 1080 px | 16:9 | JPG |
| Website Gallery | 1200 x 800 px | 3:2 | JPG |

### Aspect Ratio Quick Reference

**Midjourney Aspect Ratios:**
- `--ar 16:9` - Landscape, YouTube thumbnails, website headers
- `--ar 4:5` - Instagram portrait
- `--ar 1:1` - Square, Instagram feed
- `--ar 9:16` - Vertical, Stories, Reels, TikTok
- `--ar 3:2` - Classic photography ratio
- `--ar 21:9` - Ultra-wide cinematic

**DALL-E 3 Sizes:**
- 1024 x 1024 (Square)
- 1024 x 1792 (Portrait)
- 1792 x 1024 (Landscape)

### Midjourney Parameters Explained

**Style Parameters:**
- `--style raw` - More photographic, less artistic (v6)
- `--style expressive` - More artistic interpretation
- `--stylize [0-1000]` - Default 100, higher = more stylized
- `--s 50` - More literal interpretation
- `--s 750` - More artistic interpretation

**Quality Parameters:**
- `--quality .25` - Fast, less detailed
- `--quality .5` - Balanced (good for testing)
- `--quality 1` - Standard quality (default)
- `--quality 2` - Higher detail (uses more credits)

**Version:**
- `--v 6` - Latest version (best photorealism)
- `--v 5.2` - Previous version
- `--niji 6` - Anime/illustration style (not for real estate)

### Lighting Conditions Reference

**Times of Day:**
- **Golden Hour** (Best for most real estate): 5:30-6:30 PM, warm soft light
- **Blue Hour** (Dramatic evening shots): 6:30-7:15 PM, deep blue sky, artificial lights on
- **Midday** (Bright, energetic): 11 AM-2 PM, bright direct sunlight
- **Overcast** (Even, soft): Cloudy day, no harsh shadows
- **Morning** (Fresh, clean): 7-9 AM, clear light

**Artificial Lighting:**
- Warm white (2700-3000K): Cozy residential
- Natural white (3500-4000K): Neutral, professional
- Cool white (5000-6500K): Modern, bright
- Mixed (Natural + artificial): Realistic interior

### Color Schemes for Real Estate

**Professional Neutral:**
- White: #FFFFFF
- Light Gray: #F5F5F5
- Medium Gray: #9E9E9E
- Charcoal: #424242

**Asset Management Property Brand:**
- Primary Blue: [Insert brand color]
- Secondary Gold: [Insert brand color]
- Accent Teal: [Insert brand color]

**Pattaya/Tropical:**
- Ocean Blue: #0077BE
- Turquoise: #40E0D0
- Sandy Beige: #F5DEB3
- Palm Green: #4A7C59

**Luxury Real Estate:**
- Gold: #D4AF37
- Deep Blue: #1A365D
- Cream: #FFFFF0
- Slate Gray: #708090

---

## Style Variations

### Photorealistic vs. Artistic

**Photorealistic (Preferred for most listings):**
```
Add to prompts: photorealistic, ultra realistic, photo-quality, sharp focus, 
professional photography, 8K, high dynamic range, natural lighting
```

**Artistic/Conceptual (For branding, future projects):**
```
Add to prompts: architectural visualization, artistic rendering, concept art, 
professional 3D render, stunning visual, cinematic
```

### Minimalist vs. Detailed

**Minimalist (Modern, clean listings):**
```
Add to prompts: minimalist, clean lines, uncluttered, simple elegance, 
negative space, modern simplicity, less is more
```

**Detailed (Luxury, established properties):**
```
Add to prompts: richly detailed, layered textures, intricate details, 
luxurious finishes, carefully decorated, designer touches
```

---

## Negative Prompts Library

### Universal Negative Prompts
```
--no people, faces, humans, text, watermark, logo, signature, username, 
low quality, blurry, distorted, disfigured, bad anatomy, bad proportions, 
oversaturated, high contrast, dark, gloomy, cluttered
```

### Interior-Specific Negative Prompts
```
--no people, messy, cluttered, dirty, old furniture, dated décor, 
personal items, clothes, dishes, trash, wires visible, poor lighting, 
dark corners, small windows
```

### Exterior-Specific Negative Prompts
```
--no people, cars, parking lots, power lines, trash, construction debris, 
old buildings, pollution, smog, overcast, stormy, damaged, graffiti, 
signage, advertisements
```

### Pool/Amenity Negative Prompts
```
--no people, crowds, splashing, toys, floats, leaves in water, dirty tiles, 
stains, cracks, old equipment, faded areas, cloudy water
```

---

## Advanced Techniques

### Composition Prompts

#### Rule of Thirds
```
Add to prompts: rule of thirds composition, balanced framing, 
professional composition, visual interest points
```

#### Leading Lines
```
Add to prompts: leading lines toward [FOCAL_POINT], architectural lines, 
perspective drawing eye to [ELEMENT], depth created by [FEATURE]
```

#### Symmetry
```
Add to prompts: perfect symmetry, centered composition, balanced symmetrical design, 
mirror reflection, harmonious balance
```

### Mood & Atmosphere

#### Luxurious
```
Add to prompts: luxurious atmosphere, premium quality, high-end, sophisticated elegance, 
exclusive feeling, prestigious, upscale ambiance
```

#### Welcoming/Homey
```
Add to prompts: warm and inviting, comfortable atmosphere, homey feeling, 
lived-in but perfect, welcoming space, cozy elegance
```

#### Modern/Cool
```
Add to prompts: sleek modern atmosphere, contemporary cool, minimalist vibe, 
cutting-edge design, tech-forward, urban chic
```

### Camera & Lens Simulation

#### Wide Angle (Interiors)
```
Add to prompts: shot with 16mm wide-angle lens, expansive view, 
room appears spacious, architectural photography lens
```

#### Standard (Balanced)
```
Add to prompts: shot with 24mm lens, natural perspective, 
professional real estate photography standard
```

#### Telephoto (Compression, exteriors)
```
Add to prompts: shot with 70mm lens, compressed perspective, 
background brought closer, elegant proportion
```

---

## Batch Generation Strategy

### Creating Property Series

**Consistent Style Set:**
```
Generate 5-6 images with identical style parameters:
1. Exterior street view
2. Entrance/Lobby
3. Living room interior
4. Kitchen
5. Bedroom
6. Balcony view

Use same [STYLE], [LIGHTING], [COLOR_SCHEME] across all
Maintain consistent quality settings
Result: Cohesive property portfolio
```

### Variation Testing

**A/B Testing Different Times:**
```
Same property/angle, vary:
- Golden hour version: --ar 16:9 --v 6 [golden hour lighting]
- Blue hour version: --ar 16:9 --v 6 [blue hour twilight]
- Midday version: --ar 16:9 --v 6 [bright midday sun]

Test audience engagement, use best performer
```

---

## Post-Processing Guidelines

### What to Adjust

1. **Color Correction:**
   - Ensure whites are truly white
   - Balance warm/cool tones
   - Maintain natural skin tones (if minimal people visible)

2. **Brightness/Contrast:**
   - Brighten slightly for social media
   - Increase contrast moderately for impact
   - Avoid crushing blacks or blowing highlights

3. **Sharpening:**
   - Apply subtle sharpening for social media
   - Avoid over-sharpening (halos)

4. **Branding:**
   - Add Asset Management Property logo (corner)
   - Add watermark if needed
   - Add property details overlay (for listings)

### What NOT to Change

- Don't alter proportions or architecture
- Don't add unrealistic elements
- Don't over-saturate colors
- Don't mislead about property features

---

## Legal & Ethical Considerations

### Disclosure Requirements

1. **AI-Generated Label**: Consider disclosing AI-generated images, especially for:
   - Properties not yet built
   - Conceptual designs
   - Lifestyle scenes

2. **Accurate Representation**: Ensure AI images accurately represent:
   - Actual property features
   - Realistic materials and finishes
   - True location and views
   - Accurate sizing and proportions

3. **Copyright**: 
   - Verify AI tool's commercial use policy
   - Most major tools (Midjourney, DALL-E 3) allow commercial use
   - Keep generation records

### Best Practices

- Use AI images for:
  ✅ Pre-construction visualization
  ✅ Lifestyle and concept shots
  ✅ Marketing graphics
  ✅ Social media content
  ✅ Amenity visualization

- Prefer real photography for:
  ✅ Completed property listings
  ✅ Actual property conditions
  ✅ Legal documentation
  ✅ Final sales materials

---

## Integration with Content Strategy

### Content Pillars Alignment

**Educational Content (40%):**
- Use infographics
- Comparison charts
- Location maps
- Market data visualizations

**Promotional Content (30%):**
- Property exteriors
- Interior glamour shots
- Amenity highlights
- Special offer graphics

**Engagement Content (20%):**
- Lifestyle scenes
- Aspirational imagery
- Before/after transformations
- Behind-the-scenes

**Branding Content (10%):**
- Brand story visuals
- Team and culture (minimal AI use)
- Community involvement (real photos preferred)
- Company milestone graphics

### Platform-Specific Image Strategy

**Facebook:** Mix of all image types, longer captions, multiple images per post
**Instagram:** Primarily lifestyle and aspirational, high visual quality, cohesive feed aesthetic
**TikTok:** Attention-grabbing thumbnails, dynamic compositions, bold visuals
**LinkedIn:** Professional, data-driven infographics, architectural renders
**LINE:** Friendly, informative, Thai-culture appropriate

---

## Troubleshooting Common Issues

### Problem: Images Too Artificial/Computer-Generated Looking
**Solution:**
- Add "photorealistic, real photography" to prompt
- Use `--style raw` in Midjourney v6
- Increase quality parameter
- Add specific camera/lens references
- Include natural lighting details

### Problem: Proportions Look Wrong
**Solution:**
- Specify actual dimensions in prompt
- Reference real camera perspectives
- Add architectural accuracy keywords
- Regenerate with adjusted aspect ratio
- Use reference images if available

### Problem: Inconsistent Style Across Series
**Solution:**
- Copy exact style parameters across prompts
- Use same seed number (Midjourney)
- Generate all images in same session
- Keep lighting and time of day consistent
- Use style reference images

### Problem: Wrong Cultural Context
**Solution:**
- Specify "Thailand" or "Pattaya" explicitly
- Add "tropical" architectural elements
- Include Thai cultural touches
- Reference Southeast Asian design
- Avoid Western-only elements

### Problem: Images Don't Match Brand
**Solution:**
- Include brand color codes in prompt
- Specify brand style (modern luxury, professional)
- Add Asset Management Property aesthetic descriptors
- Review brand guidelines before generating
- Create brand-specific prompt template

---

## Resource Links & Tools

### AI Image Generation Platforms

**Midjourney:**
- Website: midjourney.com
- Best for: Architectural renders, artistic property shots
- Pricing: Subscription-based
- Access: Discord-based

**DALL-E 3:**
- Access: ChatGPT Plus, Bing Image Creator
- Best for: Photorealistic interiors, specific compositions
- Pricing: Included with ChatGPT Plus

**Stable Diffusion:**
- Best for: Full control, local generation, customization
- Pricing: Free (open source) or paid hosting
- Learning curve: Higher

**Adobe Firefly:**
- Website: firefly.adobe.com
- Best for: Commercial-safe images, Adobe integration
- Pricing: Included with Creative Cloud

### Post-Processing Tools

**Professional:**
- Adobe Photoshop
- Adobe Lightroom
- Capture One

**Free/Accessible:**
- GIMP (free Photoshop alternative)
- Canva (for graphics and overlays)
- Photopea (browser-based editing)

### Aspect Ratio Calculators
- Online ratio calculators for precise sizing
- Social media size guides (updated regularly)

---

## Quality Checklist

Before using any AI-generated property image:

- [ ] Resolution meets platform requirements
- [ ] Aspect ratio is correct
- [ ] Lighting looks natural and appealing
- [ ] Architecture proportions are realistic
- [ ] No obvious AI artifacts or distortions
- [ ] Colors are accurate and appealing
- [ ] Style matches Asset Management Property brand
- [ ] Culturally appropriate for Thai audience
- [ ] No misleading or false representations
- [ ] Copyright/usage rights confirmed
- [ ] Image enhances the message
- [ ] Suitable for target platform
- [ ] Post-processing complete (if needed)
- [ ] Branding added (logo/watermark if required)
- [ ] File properly named and organized

---

## Contact & Support

For questions about AI image generation or visual content strategy:
- Marketing Team: [Contact Details]
- Creative Director: [Contact Details]
- Social Media Team: [Contact Details]

---

*Last Updated: 2024*
*Version: 1.0*
*Asset Management Property - Social Media Content Strategy*

# 🎨 AI CREATIVE PRODUCTION GUIDE
## The Riviera Palm Beach Wongamat — สื่อโฆษณาทั้งหมด

> **แหล่งข้อมูล:** Google Drive — https://drive.google.com/drive/folders/1oMt-EsKs4M4uAtpZmMCancAo1sUepptd
> **AI Prompt Library:** `docs/social-media-content/ai-prompts/image-prompts.md`
> **Video Prompts:** `docs/social-media-content/ai-prompts/video-prompts.md`
> **Script Prompts:** `docs/social-media-content/ai-prompts/script-prompts.md`

---

## 📁 ขั้นตอนที่ 1: จัดกลุ่ม Source Files จาก Developer Folder

ดาวน์โหลดไฟล์จาก Google Drive folder แล้วจัดกลุ่มดังนี้:

```
📂 Riviera_Palm_Beach_Source/
├── 📂 Renders_3D/          ← ภาพ 3D Render จาก Developer
│   ├── Exterior/           ← ภาพตึกภายนอก, มุมสูง, วิวทะเล
│   ├── Interior/           ← ภาพห้องตัวอย่าง (Living, Bedroom, Kitchen)
│   ├── Facilities/         ← Sky Pool, Onsen, Sky Garden, Gym
│   └── Aerial/             ← มุม Drone/Bird's eye
├── 📂 Floor_Plans/         ← แปลนห้องทุก Unit Type
├── 📂 Master_Plan/         ← ผังโครงการ
├── 📂 Location/            ← แผนที่ ภาพทำเล ภาพหาดวงศ์อมาตย์
├── 📂 Logo_Branding/       ← โลโก้โครงการ + Developer
└── 📂 Video_Raw/           ← วิดีโอ (ถ้ามี) Drone footage, walkthrough
```

---

## 🖼️ ขั้นตอนที่ 2: สร้างรูปภาพด้วย AI

### ASSET 1: Hero Images — Exterior Building (10 ชิ้น)

**Source File ที่ใช้:** `Renders_3D/Exterior/` (ภาพ 3D Render อาคาร)

**AI Model:** Midjourney v6 (best for architectural renders)

**Prompt สำหรับ Midjourney:**

```
Contemporary luxury architectural photography of a 47-story ultra-luxury 
beachfront condominium on Wongamat Beach Pattaya Thailand, 
sleek modern glass facade with curved balconies, infinity pool on level 28 
visible through glass, tropical landscaping with coconut palm trees, 
golden hour lighting with warm sunset reflections, crystal clear turquoise 
Gulf of Thailand ocean, white sand beach in foreground, 
premium marble and glass materials, three-quarter angle view, 
professional real estate photography, ultra detailed, photorealistic, 
8K resolution --ar 4:5 --style raw --v 6
```

**Variations สำหรับ A/B Test:**

| # | Variation | Prompt Modifier | Aspect Ratio | ใช้สำหรับ |
|---|-----------|----------------|-------------|----------|
| 1 | Sunset Golden Hour | `golden hour, warm sunset` | 4:5 | IG Feed |
| 2 | Blue Hour Twilight | `blue hour twilight, city lights` | 4:5 | IG Feed |
| 3 | Aerial/Drone View | `aerial drone perspective, bird's eye` | 16:9 | FB Feed |
| 4 | Beach Level View | `beach level, waves in foreground` | 9:16 | Stories/Reels |
| 5 | Night Illuminated | `night time, building illuminated, pool lights` | 1:1 | IG Square |

**Post-Processing:** Canva/Photoshop → เพิ่ม Logo + Price Tag + CTA

---

### ASSET 2: Interior Room Images (10 ชิ้น)

**Source File ที่ใช้:** `Renders_3D/Interior/` (ภาพห้อง 3D)

**AI Model:** DALL-E 3 (best for photorealistic interiors)

**Prompt — Living Room with Ocean View:**
```
Photorealistic interior design of ultra-luxury condominium living room 
in Pattaya Thailand, spacious 50sqm space with 3-meter high ceiling, 
floor-to-ceiling windows overlooking crystal clear ocean and white sand beach, 
neutral whites and warm earth tones color palette, contemporary luxury furniture, 
polished Italian marble flooring, modern LED strip lighting and designer pendant lights, 
minimalist decor with subtle Thai accents, indoor tropical plants, open concept design, 
golden hour natural lighting streaming in, professional interior photography, 
ultra high definition, 8K quality, shot with Sony A7R IV with 16mm wide-angle lens
```

**Prompt — Bedroom with Sea View:**
```
Photorealistic master bedroom of ultra-luxury beachfront condominium, 
king-size bed with premium white linens facing panoramic ocean view, 
floor-to-ceiling windows with sheer curtains slightly blowing, 
warm neutral tones with teak wood accents, walk-in closet partially visible, 
ensuite bathroom glimpse through open door, morning golden sunlight, 
minimalist Japanese-inspired design, fresh flowers on bedside, 
professional architectural photography, 8K resolution
```

**Prompt — Sky Pool (28F):**
```
Photorealistic infinity-edge swimming pool on 28th floor rooftop of luxury 
condominium building, pool edge blending with turquoise ocean horizon, 
sun loungers with cream cushions, tropical cocktail on side table, 
palm trees framing the scene, Pattaya coastline visible below, 
crystal clear pool water reflecting golden sunset sky, 
Japanese onsen spa visible in background, ultra-luxury resort atmosphere, 
professional lifestyle photography, 8K, golden hour
```

---

### ASSET 3: Location Map (2 ชิ้น)

**Source File ที่ใช้:** `Location/` (แผนที่ทำเล)

**AI Model:** Midjourney v6

**Prompt:**
```
Stylized illustrated map of Wongamat Beach Pattaya showing peninsula tip 
property location and key landmarks, minimal modern design, 
showing Wongamat Beach, Terminal 21 Pattaya, Royal Garden Plaza, 
Pattaya Beach, international hospitals, international schools, 
distance markers in kilometers, bird's eye view, 
clean and modern illustration, gold pin for property location, 
blue icons for beach, green for parks, professional cartography style, 
8K quality --ar 1:1 --v 6
```

**Post-Processing:** Canva → เพิ่มข้อมูลระยะทาง + Logo

---

### ASSET 4: Carousel Sets (3-5 ชุด)

**Source Files ที่ใช้:** ผสม Renders + Floor Plans + Location

**AI Model:** Canva AI / DALL-E 3 for hero image per carousel

**Carousel Set 1: Unit Types + Prices** (5 slides)
```
Slide 1 (Hook): AI-generated hero exterior → "Absolute Beachfront from ฿6.96M"
Slide 2: 1BR render + floor plan → "1 Bedroom | 40-49 sqm | From ฿6.96M"
Slide 3: 2BR render + floor plan → "2 Bedroom | 61-104 sqm | From ฿12.1M"
Slide 4: 3BR render + floor plan → "3 Bedroom | 104-150 sqm | From ฿30.6M"
Slide 5 (CTA): Sky Pool render → "Register for VIP Price List"
```

**Carousel Set 2: Facilities** (5 slides)
```
Slide 1 (Hook): Sky Pool render → "World-Class Facilities at Every Floor"
Slide 2: AI Infinity Pool 28F → "Infinity-Edge Sky Pool (28th Floor)"
Slide 3: AI Onsen image → "Japanese Onsen & Wellness"
Slide 4: AI Sky Garden → "Sky Gardens on 4 Levels"
Slide 5 (CTA): Oceanfront dining → "Experience Ultra-Luxury Living"
```

**Carousel Set 3: Location** (5 slides)
```
Slide 1: AI Beach view → "0 Meters to Wongamat Beach"
Slide 2: AI Map → "Peninsula Tip Location"
Slide 3: Real photo area → "Quiet, Private, Exclusive"
Slide 4: Nearby amenities → "Everything Within Reach"
Slide 5 (CTA): Building render → "Book Your Private Consultation"
```

---

## 📹 ขั้นตอนที่ 3: สร้างวิดีโอด้วย AI

### VIDEO 1: Hook Reel — "0 Meters to the Beach" (10 วินาที)

**Source Files ที่ใช้:** 
- `Renders_3D/Aerial/` → ภาพ aerial ของตึก
- `Renders_3D/Facilities/` → ภาพ Sky Pool
- `Location/` → ภาพหาดวงศ์อมาตย์

**AI Model:** Runway Gen-3 Alpha (Image-to-Video)

**ขั้นตอน:**
1. เลือก Exterior Render ที่ดีที่สุด → Upload เข้า Runway
2. ใช้ prompt ให้สร้าง motion:

**Runway Prompt (Image-to-Video):**
```
Slow cinematic camera pull back from the building revealing the ocean 
and white sand beach below, golden hour lighting, gentle waves, 
tropical breeze through palm trees, ultra smooth camera movement, 
cinematic color grading, luxury real estate commercial style
```

**Duration:** 4 seconds → ต่อกับ image อื่นเป็น 10 วินาที

---

### VIDEO 2: Hook Reel — "Sky Pool 28th Floor" (10 วินาที)

**Source File:** `Renders_3D/Facilities/` → ภาพ Sky Pool

**AI Model:** Runway Gen-3 Alpha

**Runway Prompt:**
```
Camera slowly pans across infinity pool on 28th floor with ocean horizon 
visible beyond pool edge, golden sunset reflections on water surface, 
subtle water ripples, warm cinematic lighting, slow motion, 
luxury lifestyle atmosphere, high-end real estate commercial quality
```

---

### VIDEO 3: Hook Reel — "Sunset from Your Balcony" (10 วินาที)

**Source File:** `Renders_3D/Interior/` → ภาพห้องกับวิวทะเล

**AI Model:** Runway Gen-3 Alpha

**Runway Prompt:**
```
Camera slowly pushes forward through luxury living room toward 
floor-to-ceiling window revealing stunning ocean sunset view, 
sheer curtains gently blowing in breeze, warm golden light filling room, 
wine glass on table catching light, peaceful luxury atmosphere, 
slow smooth dolly movement, cinematic film quality
```

---

### VIDEO 4: Explainer — "Project Overview" (30 วินาที)

**Source Files ที่ใช้:**
- `Renders_3D/Exterior/` (2-3 ภาพ) → สร้าง 4-second clips each
- `Renders_3D/Interior/` (2 ภาพ) → สร้าง 4-second clips each  
- `Renders_3D/Facilities/` (2 ภาพ) → สร้าง 4-second clips each
- `Master_Plan/` → สร้าง animated reveal

**AI Models ที่ใช้ร่วมกัน:**
| ขั้นตอน | Model | ใช้ทำอะไร |
|---------|-------|----------|
| Image-to-Video | **Runway Gen-3 Alpha** | สร้าง motion จาก render ทุกภาพ |
| Voiceover TH | **ElevenLabs** | สร้างเสียงบรรยายภาษาไทย |
| Voiceover EN | **ElevenLabs** | สร้างเสียงบรรยายภาษาอังกฤษ |
| Music | **Suno AI** หรือ **Epidemic Sound** | เพลงประกอบ luxury feel |
| Edit + Assembly | **CapCut Pro** | ตัดต่อ + Text overlay + Logo |

**Script (ใช้ Prompt กับ ChatGPT/Claude):**
```
Write a 30-second luxury real estate video script for The Riviera Palm Beach 
Wongamat — an ultra-luxury 47-floor beachfront condominium on Wongamat Peninsula 
Tip, Pattaya. 298 units, Infinity Sky Pool on 28F, Japanese Onsen.
Starting from ฿6.96M. Off-plan presale.

Target: HNWI Thai + International buyers
Tone: Sophisticated, exclusive, aspirational
Language: Thai with English subtitles

Include: Hook first 3 sec, 5 key scenes, CTA at end
Format: Shot-by-shot with timing + text overlay + voiceover
```

---

### VIDEO 5: Hook Reel — "Drone Fly-Over Wongamat" (15 วินาที)

**Source File:** `Video_Raw/` หรือ `Renders_3D/Aerial/`

**ถ้ามี Drone footage จริง:**
- ตัดต่อใน CapCut Pro → เพิ่ม Text overlay + Music

**ถ้ายังไม่มี Drone footage (ใช้ AI):**

**AI Model:** Runway Gen-3 Alpha + Midjourney for source image

**Step 1 — Midjourney สร้างภาพ aerial:**
```
Stunning aerial drone photograph of Wongamat Beach Peninsula Tip Pattaya 
Thailand, turquoise ocean, white sand beach, coconut palm trees, 
luxury high-rise condominium at the tip of peninsula, clear sky, 
midday lighting, ultra wide angle, photorealistic, 8K --ar 16:9 --v 6
```

**Step 2 — Runway สร้าง motion:**
```
Slow cinematic drone flyover from ocean toward beachfront luxury building, 
camera gradually rising and tilting down to reveal full property and 
surrounding beach, crystal clear water below, gentle waves on shore, 
beautiful tropical scenery, smooth and steady aerial movement
```

---

## 📊 สรุปตาราง: ไฟล์ไหน → ใช้ AI อะไร → สร้างอะไร

### 🖼️ STATIC IMAGES

| # | Output | Source File | AI Model | Aspect Ratio |
|---|--------|-------------|----------|-------------|
| 1 | Building Exterior Hero (x5) | `Renders_3D/Exterior/` | **Midjourney v6** | 4:5, 1:1, 16:9 |
| 2 | Interior Living Room (x3) | `Renders_3D/Interior/` | **DALL-E 3** | 4:5, 1:1 |
| 3 | Interior Bedroom (x2) | `Renders_3D/Interior/` | **DALL-E 3** | 4:5 |
| 4 | Sky Pool Lifestyle (x3) | `Renders_3D/Facilities/` | **Midjourney v6** | 4:5, 9:16 |
| 5 | Onsen / Wellness (x2) | `Renders_3D/Facilities/` | **DALL-E 3** | 4:5 |
| 6 | Location Map (x2) | `Location/` | **Midjourney v6** + Canva | 1:1 |
| 7 | Floor Plan (visual) | `Floor_Plans/` | **Canva** (design only) | 4:5 |
| 8 | Price List Graphic | Manual data | **Canva** | 4:5 |
| 9 | Comparison Infographic | Research | **DALL-E 3** + Canva | 4:5 |
| 10 | Investment ROI Chart | Investment Package | **Canva** | 4:5 |

### 📹 VIDEOS

| # | Output | Source Files | AI Models | Duration |
|---|--------|-------------|-----------|----------|
| 1 | Hook: Beach 0m | Exterior render | **Runway Gen-3** | 10s |
| 2 | Hook: Sky Pool | Facilities render | **Runway Gen-3** | 10s |
| 3 | Hook: Sunset View | Interior render | **Runway Gen-3** | 10s |
| 4 | Hook: Drone Flyover | Aerial render/footage | **Runway Gen-3** | 15s |
| 5 | Hook: Luxury Living | Multiple renders | **Runway Gen-3** | 10s |
| 6 | Explainer: Overview | All renders | **Runway + ElevenLabs + CapCut** | 30s |
| 7 | Explainer: Unit Tour | Interior renders | **Runway + ElevenLabs** | 45s |
| 8 | Explainer: Investment | Charts + renders | **CapCut + ElevenLabs** | 45s |
| 9 | Long: Full Tour | All assets | **Runway + ElevenLabs + CapCut** | 2 min |
| 10 | Long: Location | Drone + location | **Runway + CapCut** | 1.5 min |

### 📄 DOCUMENTS

| # | Output | AI Tool | Languages |
|---|--------|---------|-----------|
| 1 | E-Brochure | **Canva** + AI images | TH/EN/ZH/RU |
| 2 | Price List PDF | **Canva** | TH/EN |
| 3 | Foreign Buyer Guide | **Claude/GPT** + Canva | EN/ZH/RU |
| 4 | Payment Plan PDF | **Canva** | TH/EN |
| 5 | Investment Package | **Claude/GPT** + Canva | EN |

### 🗣️ VOICEOVER

| # | Language | AI Model | Voice Style |
|---|----------|----------|-------------|
| 1 | Thai | **ElevenLabs** | Female, warm, professional |
| 2 | English | **ElevenLabs** | Male, confident, luxury |
| 3 | Chinese | **ElevenLabs** | Female, professional |
| 4 | Russian | **ElevenLabs** | Male, confident |

### 🎵 MUSIC

| # | Type | Source | Style |
|---|------|--------|-------|
| 1 | Hook videos | **Epidemic Sound** / **Artlist** | Luxury, cinematic, 100-120 BPM |
| 2 | Explainer | **Epidemic Sound** | Sophisticated, uplifting, 90-110 BPM |
| 3 | Long-form | **Epidemic Sound** | Ambient, elegant, varied |

---

## ⚠️ COMPLIANCE REMINDERS

1. ✅ ภาพ AI ต้องระบุ "Artist Impression" ทุกชิ้น
2. ✅ ห้ามใช้คำว่า "การันตี / Guaranteed" สำหรับ yield
3. ✅ ราคาต้องระบุ "เริ่มต้น" + disclaimer
4. ✅ "Absolute Beachfront 0m" ต้องตรงกับ project materials
5. ✅ เพลงต้อง licensed สำหรับ commercial use
6. ✅ ภาพคนในรูปต้องมี release form (หรือใช้ AI-generated people)
from __future__ import annotations

# ruff: noqa: E501, I001

import argparse
import json
import mimetypes
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx


WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_API_BASE = "http://127.0.0.1:8101"
DEFAULT_ADMIN_BASE = "http://127.0.0.1:8102"
DEFAULT_EMAIL = "admin@local.dev"
DEFAULT_PASSWORD = "admin123"
WORKSPACE_NAME = "AMP Pattaya"

BACKUP_ENTITIES = {
    "developers": {"path": "/admin/developers", "items_key": "data", "kind": "uuid"},
    "areas": {"path": "/admin/areas", "items_key": "data", "kind": "uuid"},
    "projects": {"path": "/admin/projects", "items_key": "data", "kind": "uuid"},
    "properties": {
        "path": "/admin/properties",
        "items_key": "data",
        "kind": "uuid",
        "params": {"page": 1, "limit": 200},
    },
    "testimonials": {"path": "/admin/testimonials", "items_key": "data", "kind": "uuid"},
    "articles": {
        "path": "/admin/content/articles",
        "items_key": "data",
        "kind": "slug",
        "paged": True,
        "params": {"page": 1, "limit": 200},
    },
    "videos": {
        "path": "/admin/content/videos",
        "items_key": "data",
        "kind": "slug",
        "paged": True,
        "params": {"page": 1, "limit": 200},
    },
    "company": {"path": "/admin/company", "items_key": "data", "kind": "slug"},
    "media": {
        "path": "/admin/media",
        "items_key": "items",
        "kind": "uuid",
        "params": {"limit": 200},
    },
}


MEDIA_SOURCES = [
    {
        "key": "area_jomtien",
        "path": "storage/media/project-covers/the-riviera-jomtien/cover_5a3289c054a1.jpg",
        "title": "Demo Jomtien shoreline",
    },
    {
        "key": "area_pratumnak",
        "path": "storage/media/library/variants/0420bb47-5755-450e-b9e6-babba2d283aa.webp",
        "title": "Demo Pratumnak hillside",
    },
    {
        "key": "area_wongamat",
        "path": "storage/media/library/variants/1f188411-9101-487d-a158-26c46cdab44c.webp",
        "title": "Demo Wongamat beachfront",
    },
    {
        "key": "area_central",
        "path": "storage/media/library/variants/2907506f-b4a3-4689-be0c-2f4f600b0437.webp",
        "title": "Demo Central Pattaya skyline",
    },
    {
        "key": "area_najomtien",
        "path": "storage/media/library/variants/518c2919-8c9a-4ba1-8ef3-111747c3b3d2.webp",
        "title": "Demo Na Jomtien coast",
    },
    {
        "key": "developer_harborline",
        "path": "storage/media/library/variants/5fc66ff2-b47d-4edc-b640-a7eb398eee8d.webp",
        "title": "Demo developer harborline",
    },
    {
        "key": "developer_gulf",
        "path": "storage/media/library/variants/5fd05e4e-a5e8-4813-ac82-d159d9646dd3.webp",
        "title": "Demo developer gulf crest",
    },
    {
        "key": "developer_skyline",
        "path": "storage/media/library/variants/6f21f5c7-0e09-4544-846c-a34e71499ebe.webp",
        "title": "Demo developer skyline",
    },
    {
        "key": "developer_blueharbor",
        "path": "storage/media/library/variants/831f731d-a9ea-4980-b921-effc67629126.webp",
        "title": "Demo developer blue harbor",
    },
    {
        "key": "project_hero_a",
        "path": "storage/media/library/variants/870b9a3c-9d3f-4be0-9e48-669ae1ac8796.webp",
        "title": "Demo project hero A",
    },
    {
        "key": "project_hero_b",
        "path": "storage/media/library/variants/8f2ae4d6-80b8-4e5a-a291-4893e4dd06ed.webp",
        "title": "Demo project hero B",
    },
    {
        "key": "project_hero_c",
        "path": "storage/media/library/variants/91ac7856-7ead-412a-8351-ec415d700104.webp",
        "title": "Demo project hero C",
    },
    {
        "key": "project_hero_d",
        "path": "storage/media/library/variants/98f82ac4-c35f-41d6-ad44-2fceb8f4a662.webp",
        "title": "Demo project hero D",
    },
    {
        "key": "project_hero_e",
        "path": "storage/media/library/variants/99804af0-8e46-4c5f-a0ac-30e5efbab064.webp",
        "title": "Demo project hero E",
    },
    {
        "key": "project_hero_f",
        "path": "storage/media/library/variants/af6a4bfe-32e4-4301-a950-3fad8a60a633.webp",
        "title": "Demo project hero F",
    },
    {
        "key": "project_hero_g",
        "path": "storage/media/library/variants/ddfe824d-c7c9-4097-8f9c-cc00298e55d9.webp",
        "title": "Demo project hero G",
    },
    {
        "key": "project_hero_h",
        "path": "storage/media/library/variants/e0f72fb9-861b-47f5-989d-9565db80d4c6.webp",
        "title": "Demo project hero H",
    },
    {
        "key": "article_hero_a",
        "path": "storage/media/library/variants/e224c206-6547-447f-bd28-0fc6f03a8362.webp",
        "title": "Demo article hero A",
    },
    {
        "key": "article_hero_b",
        "path": "storage/media/library/variants/f0c02ef0-5cb9-4730-853d-e0cac04b88d5.webp",
        "title": "Demo article hero B",
    },
    {
        "key": "article_hero_c",
        "path": "storage/media/library/variants/f633babe-9ba1-45cf-9ac3-61f4230d118d.webp",
        "title": "Demo article hero C",
    },
    {
        "key": "article_hero_d",
        "path": "storage/media/library/variants/fd332917-3026-40d4-a165-16f060d3b716.webp",
        "title": "Demo article hero D",
    },
    {
        "key": "video_thumb_a",
        "path": "admin-app/public/media/video-thumbs/77If6rT5fdE.jpg",
        "title": "Demo video thumbnail A",
    },
    {
        "key": "video_thumb_b",
        "path": "admin-app/public/media/video-thumbs/_-Yzpo3tCuQ.jpg",
        "title": "Demo video thumbnail B",
    },
]


AREAS = [
    {
        "slug": "jomtien",
        "name": "Jomtien",
        "city": "Pattaya",
        "media": ("area_jomtien", "project_hero_a"),
        "map_center": {"lat": 12.8806, "lng": 100.883, "zoom": 13},
        "summary": {
            "en": "A broad beachfront district for buyers who want daily convenience, walkable cafés, and a balance between owner-occupier demand and rental resilience.",
            "th": "ย่านริมทะเลที่ตอบโจทย์ทั้งการอยู่อาศัยจริงและการปล่อยเช่า ด้วยร้านอาหาร คาเฟ่ และการเดินทางที่สะดวกกว่าหลายโซนชายหาด",
        },
        "content": {
            "en": {
                "why_live_invest": "Jomtien suits buyers who want a Pattaya address with a softer pace than Central Pattaya while still keeping year-round rental demand from long-stay residents and repeat holiday traffic.",
                "transport": "Access is straightforward via Jomtien Second Road, Sukhumvit Road, and regular baht bus coverage toward central retail and beachfront destinations.",
                "lifestyle": "The area mixes beachfront walks, casual dining, convenience retail, family services, and a growing set of lifestyle stops that support both weekends and longer stays.",
                "beach_proximity": "Most condo clusters sit within a short drive or walk of the beach, which keeps daily usability strong for both owner-occupiers and short-stay tenants.",
                "metrics_update_cadence": "Sample market metrics are refreshed monthly for demo purposes and should be replaced with advisor-verified snapshots before live client use.",
            },
            "th": {
                "why_live_invest": "Jomtien เหมาะกับผู้ซื้อที่ต้องการบรรยากาศผ่อนคลายกว่าฝั่งเมือง แต่ยังมีดีมานด์เช่าจริงจากผู้พักระยะยาวและนักท่องเที่ยวซ้ำทุกฤดูกาล.",
                "transport": "การเดินทางเชื่อมต่อได้สะดวกผ่านถนนจอมเทียนสายสอง ถนนสุขุมวิท และรถสองแถวที่วิ่งเข้าสู่ย่านเมืองและหน้าหาดอย่างต่อเนื่อง.",
                "lifestyle": "โซนนี้มีทั้งทางเดินริมหาด ร้านอาหาร คาเฟ่ ร้านสะดวกซื้อ และบริการสำหรับอยู่อาศัยจริง ทำให้ใช้งานได้ทั้งวันหยุดและการพักระยะยาว.",
                "beach_proximity": "คอนโดส่วนใหญ่ในโซนหลักอยู่ใกล้หาดในระยะเดินหรือขับรถสั้น ๆ จึงเหมาะทั้งการอยู่เองและการปล่อยเช่าระยะสั้นถึงกลาง.",
                "metrics_update_cadence": "ตัวเลขตลาดในชุดตัวอย่างนี้อัปเดตรายเดือนสำหรับเดโม และควรแทนที่ด้วยข้อมูลที่ที่ปรึกษาตรวจสอบก่อนใช้งานจริงกับลูกค้า.",
            },
        },
        "source_note": "Sample area guide for local preview reseed. Uses neutral demo wording and local media only.",
        "statistics": {
            "avg_price_sqm": 78500,
            "avg_rent_monthly": 28500,
            "avg_roi_percent": 5.2,
            "total_projects": 18,
            "total_units": 11240,
            "as_of_date": "2026-03-21",
        },
    },
    {
        "slug": "pratumnak",
        "name": "Pratumnak",
        "city": "Pattaya",
        "media": ("area_pratumnak", "project_hero_b"),
        "map_center": {"lat": 12.9135, "lng": 100.8582, "zoom": 13},
        "summary": {
            "en": "A hillside neighborhood favored for privacy, compact travel times, and boutique low-density inventory close to both the city and the sea.",
            "th": "ย่านเนินเขาที่เด่นเรื่องความสงบ ความเป็นส่วนตัว และการเดินทางสั้นไปทั้งฝั่งเมืองและชายหาด พร้อมซัพพลายแบบบูติกความหนาแน่นไม่สูง",
        },
        "content": {
            "en": {
                "why_live_invest": "Pratumnak draws lifestyle buyers who prefer quieter surroundings, compact driving distances, and a more residential tone than the busier central beachfront corridors.",
                "transport": "Residents connect quickly to South Pattaya, Bali Hai, and Jomtien by road, which makes the area practical despite its more tucked-away feel.",
                "lifestyle": "Cafés, wellness venues, hilltop viewpoints, and small-format restaurants shape a slower daily rhythm that appeals to end-users and repeat seasonal residents.",
                "beach_proximity": "Several residential pockets sit close to smaller beaches and lookout points, which supports premium positioning even when projects are not directly beachfront.",
                "metrics_update_cadence": "Sample metrics cadence is monthly in preview. Replace with current verified evidence before making yield or pricing claims externally.",
            },
            "th": {
                "why_live_invest": "Pratumnak เหมาะกับผู้ซื้อที่ต้องการบรรยากาศสงบกว่าโซนชายหาดหลัก แต่ยังขับรถเข้าเมืองหรือไป Jomtien ได้ในเวลาไม่นาน.",
                "transport": "การเชื่อมต่อไป South Pattaya, Bali Hai และ Jomtien ทำได้รวดเร็ว จึงใช้งานจริงได้ดีแม้ย่านจะมีความเป็นส่วนตัวสูงกว่า.",
                "lifestyle": "คาเฟ่ ร้านอาหารขนาดเล็ก จุดชมวิว และสถานที่ดูแลสุขภาพทำให้ย่านนี้เหมาะกับผู้อยู่อาศัยจริงและผู้พักฤดูกาลซ้ำ.",
                "beach_proximity": "หลายจุดพักอาศัยอยู่ใกล้หาดขนาดเล็กและจุดชมวิว ทำให้โครงการในย่านนี้ยังคงมีภาพลักษณ์พรีเมียมแม้ไม่ติดหาดโดยตรง.",
                "metrics_update_cadence": "ตัวเลขตัวอย่างใน preview อัปเดตรายเดือน และต้องเปลี่ยนเป็นข้อมูลที่ยืนยันแล้วก่อนนำไปใช้สื่อสารเรื่องราคาและผลตอบแทน.",
            },
        },
        "source_note": "Sample area guide for local preview reseed. Uses neutral demo wording and local media only.",
        "statistics": {
            "avg_price_sqm": 91500,
            "avg_rent_monthly": 32200,
            "avg_roi_percent": 4.8,
            "total_projects": 12,
            "total_units": 5140,
            "as_of_date": "2026-03-21",
        },
    },
    {
        "slug": "wongamat",
        "name": "Wongamat",
        "city": "Pattaya",
        "media": ("area_wongamat", "project_hero_c"),
        "map_center": {"lat": 12.9608, "lng": 100.8843, "zoom": 13},
        "summary": {
            "en": "A premium north Pattaya beachfront pocket known for stronger seaview positioning, resort-style towers, and an upper-mid to luxury buyer profile.",
            "th": "ย่านชายหาดฝั่งเหนือที่ภาพลักษณ์ค่อนข้างพรีเมียม เด่นเรื่องวิวทะเล อาคารรีสอร์ทไฮไรส์ และกลุ่มผู้ซื้อระดับบนถึงลักชัวรี",
        },
        "content": {
            "en": {
                "why_live_invest": "Wongamat attracts buyers focused on seaview stock, branded lifestyle positioning, and premium resale narratives with relatively limited beachfront land.",
                "transport": "Road access remains practical to Terminal 21, North Pattaya Road, and city retail despite the area feeling more secluded than central beachfront districts.",
                "lifestyle": "Beach clubs, hotel-led dining, wellness offerings, and quieter residential pockets create a resort-oriented day-to-day environment.",
                "beach_proximity": "Projects in this area often trade on direct or partial sea access, which is central to pricing logic and investor storytelling.",
                "metrics_update_cadence": "Preview metrics refresh monthly and are intended only as demo placeholders pending verified market evidence.",
            },
            "th": {
                "why_live_invest": "Wongamat เหมาะกับผู้ซื้อที่เน้นวิวทะเล ภาพลักษณ์รีสอร์ท และเรื่องเล่าการขายต่อในตลาดระดับกลางบนถึงลักชัวรี.",
                "transport": "แม้บรรยากาศจะสงบกว่าฝั่งเมือง แต่ยังเชื่อมต่อไป Terminal 21 ถนนพัทยาเหนือ และย่านค้าปลีกหลักได้สะดวก.",
                "lifestyle": "มีทั้งร้านอาหารในโรงแรม บีชคลับ พื้นที่ดูแลสุขภาพ และชุมชนพักอาศัยที่เงียบกว่าโซนชายหาดหลัก.",
                "beach_proximity": "จุดขายหลักของหลายโครงการคือการเข้าถึงหาดหรือวิวทะเล ซึ่งมีผลโดยตรงต่อระดับราคาและการสื่อสารการลงทุน.",
                "metrics_update_cadence": "ตัวเลขใน preview อัปเดตรายเดือนและใช้เป็น placeholder สำหรับเดโมเท่านั้น จนกว่าจะมีข้อมูลตลาดที่ยืนยันแล้ว.",
            },
        },
        "source_note": "Sample area guide for local preview reseed. Uses neutral demo wording and local media only.",
        "statistics": {
            "avg_price_sqm": 126000,
            "avg_rent_monthly": 39500,
            "avg_roi_percent": 4.5,
            "total_projects": 10,
            "total_units": 4680,
            "as_of_date": "2026-03-21",
        },
    },
    {
        "slug": "central-pattaya",
        "name": "Central Pattaya",
        "city": "Pattaya",
        "media": ("area_central", "project_hero_d"),
        "map_center": {"lat": 12.9292, "lng": 100.8803, "zoom": 13},
        "summary": {
            "en": "A highly practical urban core for buyers who prioritize retail access, transport convenience, and all-day walkability over resort-style privacy.",
            "th": "ศูนย์กลางเมืองที่ตอบโจทย์เรื่องห้าง ร้านอาหาร การเดินทาง และการใช้ชีวิตแบบเดินถึงได้ เหมาะกับผู้ซื้อที่เน้นความสะดวกมากกว่าความเป็นส่วนตัวแบบรีสอร์ท",
        },
        "content": {
            "en": {
                "why_live_invest": "Central Pattaya works for buyers who value immediate access to retail, hospitals, entertainment, and transport without depending heavily on private car use.",
                "transport": "Major arterial roads, baht bus routes, and easy connections to highway links support steady daily mobility.",
                "lifestyle": "Large malls, everyday services, dining, nightlife, and office-related activity keep this zone active across both weekday and weekend demand cycles.",
                "beach_proximity": "Beach access exists, but the district usually sells more on convenience and urban functionality than quiet seafront living.",
                "metrics_update_cadence": "Preview metrics are refreshed monthly for demo use and should not be treated as client-ready research.",
            },
            "th": {
                "why_live_invest": "Central Pattaya เหมาะกับผู้ซื้อที่ต้องการความสะดวกสูงสุดทั้งห้าง โรงพยาบาล ร้านอาหาร และการเดินทางในชีวิตประจำวัน.",
                "transport": "มีถนนหลัก รถสองแถว และทางเชื่อมออกเส้นหลักได้ง่าย จึงรองรับการใช้ชีวิตประจำวันและการปล่อยเช่าจริงได้ดี.",
                "lifestyle": "ห้าง ร้านอาหาร บริการประจำวัน และกิจกรรมทั้งกลางวันกลางคืนทำให้โซนนี้มีการใช้งานต่อเนื่องตลอดสัปดาห์.",
                "beach_proximity": "แม้เข้าหาดได้สะดวก แต่จุดขายหลักของย่านนี้คือความสะดวกเชิงเมืองมากกว่าบรรยากาศชายทะเลแบบสงบ.",
                "metrics_update_cadence": "ตัวเลข preview อัปเดตรายเดือนเพื่อใช้เดโมเท่านั้น และไม่ควรใช้เป็นข้อมูลแนะนำลูกค้าโดยตรง.",
            },
        },
        "source_note": "Sample area guide for local preview reseed. Uses neutral demo wording and local media only.",
        "statistics": {
            "avg_price_sqm": 88200,
            "avg_rent_monthly": 30100,
            "avg_roi_percent": 5.0,
            "total_projects": 22,
            "total_units": 13850,
            "as_of_date": "2026-03-21",
        },
    },
    {
        "slug": "na-jomtien",
        "name": "Na Jomtien",
        "city": "Pattaya",
        "media": ("area_najomtien", "project_hero_e"),
        "map_center": {"lat": 12.8242, "lng": 100.9121, "zoom": 13},
        "summary": {
            "en": "A southern coastal stretch with lower density, wider resort-style plots, and appeal for second-home buyers who want more breathing room.",
            "th": "แนวชายฝั่งตอนใต้ที่มีความหนาแน่นต่ำกว่า พื้นที่โครงการกว้างกว่า และเหมาะกับผู้ซื้อบ้านพักตากอากาศที่ต้องการบรรยากาศโล่งกว่าโซนเมือง",
        },
        "content": {
            "en": {
                "why_live_invest": "Na Jomtien appeals to second-home and lifestyle-led buyers who prefer broader plots, resort adjacency, and a less compressed skyline.",
                "transport": "Private car mobility matters more here, but the area connects well via Sukhumvit and major coastal routes toward marinas and leisure destinations.",
                "lifestyle": "Beach clubs, marina-oriented leisure, family resort activity, and quieter residential compounds define the local positioning.",
                "beach_proximity": "Low-density seafront land and marina access are central to the area narrative, especially for premium or family-led product.",
                "metrics_update_cadence": "Preview metrics refresh monthly and should be replaced with verified stock-specific data before external use.",
            },
            "th": {
                "why_live_invest": "Na Jomtien เหมาะกับผู้ซื้อบ้านพักตากอากาศหรือผู้ที่ต้องการโครงการที่พื้นที่กว้างและบรรยากาศไม่หนาแน่นเหมือนฝั่งเมือง.",
                "transport": "การใช้รถส่วนตัวมีบทบาทมากกว่า แต่ยังเชื่อมต่อผ่านสุขุมวิทและเส้นชายฝั่งไปยังท่าจอดเรือและจุดพักผ่อนได้สะดวก.",
                "lifestyle": "บีชคลับ มาริน่า รีสอร์ทสำหรับครอบครัว และคอมมูนิตี้พักอาศัยที่สงบ เป็นภาพรวมของการใช้ชีวิตในย่านนี้.",
                "beach_proximity": "ทำเลติดทะเลที่ความหนาแน่นต่ำและการเข้าถึงมาริน่าคือหัวใจของ narrative ด้านการอยู่อาศัยและภาพลักษณ์พรีเมียม.",
                "metrics_update_cadence": "ตัวเลข preview อัปเดตรายเดือน และควรเปลี่ยนเป็นข้อมูลจริงระดับโครงการก่อนนำไปใช้งานภายนอก.",
            },
        },
        "source_note": "Sample area guide for local preview reseed. Uses neutral demo wording and local media only.",
        "statistics": {
            "avg_price_sqm": 96500,
            "avg_rent_monthly": 34700,
            "avg_roi_percent": 4.7,
            "total_projects": 9,
            "total_units": 4210,
            "as_of_date": "2026-03-21",
        },
    },
]


DEVELOPERS = [
    {
        "slug": "demo-harborline-developments",
        "name": "Harborline Developments Demo",
        "website": "https://localhost/demo/harborline",
        "tier": "premium",
        "logo_media": "developer_harborline",
        "cover_media": "project_hero_f",
        "profile": {
            "en": "Sample developer profile for local preview only. Harborline focuses on waterfront-oriented urban residential concepts, conservative delivery messaging, and documentation that is easy for demo users to review.",
            "th": "โปรไฟล์ผู้พัฒนาตัวอย่างสำหรับ local preview เท่านั้น Harborline เน้นแนวคิดที่อยู่อาศัยใกล้น้ำ การสื่อสารกำหนดการแบบระมัดระวัง และเอกสารที่อ่านง่ายสำหรับการสาธิต.",
        },
        "summary": {
            "en": "Preview-only developer record used to anchor sample projects in Pattaya.",
            "th": "เรคคอร์ดผู้พัฒนาตัวอย่างสำหรับผูกกับโครงการเดโมในพัทยา.",
        },
        "source_note": "Demo developer profile created for local preview reseed. Not a verified real-world developer profile.",
        "trust_proof": {
            "en": "Demo governance note: sample profile copy reviewed for neutral claims and local-media usage.",
            "th": "หมายเหตุด้าน governance สำหรับเดโม: เนื้อหาเป็นตัวอย่างแบบกลางและใช้ local media เท่านั้น.",
            "approval_status": "approved",
            "legal_approved": True,
        },
    },
    {
        "slug": "demo-gulf-crest-residences",
        "name": "Gulf Crest Residences Demo",
        "website": "https://localhost/demo/gulf-crest",
        "tier": "mid",
        "logo_media": "developer_gulf",
        "cover_media": "project_hero_g",
        "profile": {
            "en": "Sample developer profile for preview usage. Gulf Crest is positioned as a mid-market operator with practical layouts, hospitality-style common areas, and demo-safe buyer guidance.",
            "th": "โปรไฟล์ผู้พัฒนาตัวอย่างสำหรับ preview โดย Gulf Crest ถูกวางให้เป็นผู้พัฒนาระดับกลางที่เน้นผังห้องใช้งานง่าย พื้นที่ส่วนกลางแนว hospitality และคำแนะนำผู้ซื้อแบบปลอดภัยสำหรับเดโม.",
        },
        "summary": {
            "en": "Mid-market demo developer used for practical project examples.",
            "th": "ผู้พัฒนาระดับกลางแบบเดโมสำหรับตัวอย่างโครงการเชิงใช้งานจริง.",
        },
        "source_note": "Demo developer profile created for local preview reseed. Neutral wording only.",
        "trust_proof": {
            "en": "Demo trust proof: preview content prepared with no live commercial claims.",
            "th": "หลักฐานความน่าเชื่อถือแบบเดโม: เนื้อหา preview ไม่มีการอ้าง claim เชิงพาณิชย์จริง.",
            "approval_status": "approved",
            "legal_approved": True,
        },
    },
    {
        "slug": "demo-skyline-bay-homes",
        "name": "Skyline Bay Homes Demo",
        "website": "https://localhost/demo/skyline-bay",
        "tier": "premium",
        "logo_media": "developer_skyline",
        "cover_media": "project_hero_h",
        "profile": {
            "en": "Sample developer profile focused on skyline product positioning, mixed buyer personas, and preview-ready bilingual copy.",
            "th": "โปรไฟล์ผู้พัฒนาตัวอย่างที่เน้น positioning ด้าน skyline รองรับ buyer persona หลายแบบ และใช้ข้อความสองภาษาที่พร้อมสำหรับ preview.",
        },
        "summary": {
            "en": "Premium-oriented demo developer for urban and seaview project scenarios.",
            "th": "ผู้พัฒนาตัวอย่างระดับพรีเมียมสำหรับสถานการณ์โครงการในเมืองและวิวทะเล.",
        },
        "source_note": "Demo developer profile created for local preview reseed. Not a verified market profile.",
        "trust_proof": {
            "en": "Demo trust proof: sample profile passed local content review and uses approved local media metadata.",
            "th": "หลักฐานแบบเดโม: โปรไฟล์ผ่านการทบทวนเนื้อหาในเครื่องและใช้ metadata ของ local media ที่ตั้งสถานะ approved.",
            "approval_status": "approved",
            "legal_approved": True,
        },
    },
    {
        "slug": "demo-blue-harbor-living",
        "name": "Blue Harbor Living Demo",
        "website": "https://localhost/demo/blue-harbor",
        "tier": "mid",
        "logo_media": "developer_blueharbor",
        "cover_media": "article_hero_a",
        "profile": {
            "en": "Sample developer profile that supports family-led and second-home product stories in the local preview stack.",
            "th": "โปรไฟล์ผู้พัฒนาตัวอย่างที่รองรับเรื่องเล่าของสินค้าแนวครอบครัวและบ้านพักตากอากาศใน local preview stack.",
        },
        "summary": {
            "en": "Lifestyle-led demo developer for family and second-home narratives.",
            "th": "ผู้พัฒนาตัวอย่างแนว lifestyle สำหรับ narrative ของครอบครัวและบ้านพักตากอากาศ.",
        },
        "source_note": "Demo developer profile created for local preview reseed. Neutral wording only.",
        "trust_proof": {
            "en": "Demo trust proof: sample content only, approved for local preview demonstrations.",
            "th": "หลักฐานแบบเดโม: ใช้สำหรับการสาธิต local preview เท่านั้นและตั้งสถานะ approved แล้ว.",
            "approval_status": "approved",
            "legal_approved": True,
        },
    },
]


PROJECTS = [
    {
        "slug": "demo-jomtien-horizon-residence",
        "name": "Jomtien Horizon Residence Demo",
        "area_slug": "jomtien",
        "developer_slug": "demo-harborline-developments",
        "property_type": "condo",
        "hero_media": "project_hero_a",
        "cover_media": "area_jomtien",
        "summary": {
            "en": "Sample high-rise condo concept near Jomtien Second Road with practical unit mixes for owner-occupiers and long-stay renters.",
            "th": "คอนเซปต์คอนโดไฮไรส์ตัวอย่างใกล้ถนนจอมเทียนสายสอง พร้อมสัดส่วนยูนิตที่เหมาะทั้งผู้อยู่อาศัยจริงและผู้เช่าระยะยาว.",
        },
        "description": {
            "en": "Demo project description: positioned for preview walkthroughs, not as verified market inventory.",
            "th": "คำอธิบายโครงการแบบเดโม: ใช้สำหรับการสาธิต preview ไม่ใช่อินเวนทอรีที่ยืนยันแล้วในตลาด.",
        },
        "amenities": ["pool", "fitness", "co-working lounge", "shuttle to beachfront"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Balanced end-user and rental demand",
                "th": "สมดุลระหว่างผู้ซื้ออยู่เองและตลาดเช่า",
            },
        },
    },
    {
        "slug": "demo-jomtien-bay-suites",
        "name": "Jomtien Bay Suites Demo",
        "area_slug": "jomtien",
        "developer_slug": "demo-gulf-crest-residences",
        "property_type": "condo",
        "hero_media": "project_hero_b",
        "cover_media": "project_hero_b",
        "summary": {
            "en": "Sample resort-style condo project focused on flexible stay patterns and straightforward operations for demo buyers.",
            "th": "โครงการคอนโดสไตล์รีสอร์ทตัวอย่างที่เน้นการพักอาศัยได้หลายรูปแบบและภาพรวมการดูแลง่ายสำหรับผู้ซื้อเดโม.",
        },
        "description": {
            "en": "Demo project description: sample only, with bilingual copy for local preview surfaces.",
            "th": "รายละเอียดโครงการแบบเดโม ใช้เป็นตัวอย่างพร้อมข้อความสองภาษาสำหรับหน้า preview.",
        },
        "amenities": ["pool", "kids room", "meeting pod", "security"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Flexible stay profile in Jomtien",
                "th": "เหมาะกับการพักหลายรูปแบบใน Jomtien",
            },
        },
    },
    {
        "slug": "demo-pratumnak-terrace-house",
        "name": "Pratumnak Terrace House Demo",
        "area_slug": "pratumnak",
        "developer_slug": "demo-blue-harbor-living",
        "property_type": "condo",
        "hero_media": "project_hero_c",
        "cover_media": "area_pratumnak",
        "summary": {
            "en": "Sample boutique residence designed for privacy-led buyers seeking Pratumnak convenience without a resort-scale footprint.",
            "th": "เรสซิเดนซ์บูติกตัวอย่างสำหรับผู้ซื้อที่เน้นความเป็นส่วนตัวและต้องการความสะดวกของ Pratumnak โดยไม่ต้องอยู่ในโครงการขนาดใหญ่.",
        },
        "description": {
            "en": "Demo project description prepared for preview only.",
            "th": "คำอธิบายโครงการตัวอย่างสำหรับ preview เท่านั้น.",
        },
        "amenities": ["pool", "lounge", "parking", "rooftop deck"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {"en": "Privacy-led boutique product", "th": "สินค้าแบบบูติกที่เน้นความเป็นส่วนตัว"},
        },
    },
    {
        "slug": "demo-wongamat-shoreline-tower",
        "name": "Wongamat Shoreline Tower Demo",
        "area_slug": "wongamat",
        "developer_slug": "demo-skyline-bay-homes",
        "property_type": "condo",
        "hero_media": "project_hero_d",
        "cover_media": "area_wongamat",
        "summary": {
            "en": "Sample premium seaview tower concept for clients comparing higher-end beachfront positioning in north Pattaya.",
            "th": "คอนเซปต์ทาวเวอร์วิวทะเลระดับพรีเมียมตัวอย่าง สำหรับลูกค้าที่ต้องการเทียบทำเลริมหาดฝั่งเหนือของพัทยา.",
        },
        "description": {
            "en": "Demo project description prepared for premium preview scenarios.",
            "th": "คำอธิบายโครงการเดโมสำหรับสถานการณ์ preview ระดับพรีเมียม.",
        },
        "amenities": ["beach access", "sky lounge", "concierge", "fitness"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Premium seaview resale narrative",
                "th": "narrative ด้านการขายต่อและวิวทะเลระดับพรีเมียม",
            },
        },
    },
    {
        "slug": "demo-central-pattaya-city-lofts",
        "name": "Central Pattaya City Lofts Demo",
        "area_slug": "central-pattaya",
        "developer_slug": "demo-gulf-crest-residences",
        "property_type": "condo",
        "hero_media": "project_hero_e",
        "cover_media": "area_central",
        "summary": {
            "en": "Sample urban condo product for buyers who prioritize retail access, compact commutes, and flexible central living.",
            "th": "สินค้าคอนโดในเมืองแบบตัวอย่างสำหรับผู้ซื้อที่ให้ความสำคัญกับห้าง การเดินทางสั้น และการใช้ชีวิตในโซนกลางเมือง.",
        },
        "description": {
            "en": "Demo project description: city-led product story for preview comparison.",
            "th": "รายละเอียดโครงการเดโม: เรื่องเล่าสินค้าแนวเมืองสำหรับใช้เปรียบเทียบใน preview.",
        },
        "amenities": ["co-working", "gym", "parcel room", "security"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Central convenience-led demand",
                "th": "ดีมานด์ขับเคลื่อนด้วยความสะดวกในโซนเมือง",
            },
        },
    },
    {
        "slug": "demo-najomtien-marina-park",
        "name": "Na Jomtien Marina Park Demo",
        "area_slug": "na-jomtien",
        "developer_slug": "demo-blue-harbor-living",
        "property_type": "condo",
        "hero_media": "project_hero_f",
        "cover_media": "area_najomtien",
        "summary": {
            "en": "Sample coastal low-density project narrative for second-home and marina-adjacent buyer discussions.",
            "th": "narrative โครงการชายฝั่งความหนาแน่นต่ำแบบตัวอย่าง สำหรับการพูดคุยกับผู้ซื้อบ้านพักตากอากาศและกลุ่มที่สนใจมาริน่า.",
        },
        "description": {
            "en": "Demo project description for southern coastal preview scenarios.",
            "th": "คำอธิบายโครงการเดโมสำหรับสถานการณ์ preview ฝั่งชายฝั่งตอนใต้.",
        },
        "amenities": ["pool", "family club", "shuttle", "garden"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Second-home led coastal positioning",
                "th": "positioning ชายฝั่งที่ขับเคลื่อนโดยผู้ซื้อบ้านพักตากอากาศ",
            },
        },
    },
    {
        "slug": "demo-pratumnak-view-residence",
        "name": "Pratumnak View Residence Demo",
        "area_slug": "pratumnak",
        "developer_slug": "demo-harborline-developments",
        "property_type": "condo",
        "hero_media": "project_hero_g",
        "cover_media": "project_hero_g",
        "summary": {
            "en": "Sample mid-rise concept with hillside privacy and short-drive beach access for owner-occupier conversations.",
            "th": "คอนเซปต์มิดไรส์ตัวอย่างที่เด่นเรื่องความเป็นส่วนตัวบนเนินเขาและการเข้าหาดในระยะขับรถสั้น ๆ สำหรับการคุยกับผู้ซื้ออยู่เอง.",
        },
        "description": {
            "en": "Demo project description: preview-only residential positioning.",
            "th": "คำอธิบายโครงการเดโม: positioning เพื่อการสาธิตเท่านั้น.",
        },
        "amenities": ["pool", "fitness", "lobby", "parking"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Low-density residential comfort",
                "th": "ความสบายแบบที่อยู่อาศัยความหนาแน่นต่ำ",
            },
        },
    },
    {
        "slug": "demo-wongamat-bay-club",
        "name": "Wongamat Bay Club Demo",
        "area_slug": "wongamat",
        "developer_slug": "demo-skyline-bay-homes",
        "property_type": "condo",
        "hero_media": "project_hero_h",
        "cover_media": "project_hero_h",
        "summary": {
            "en": "Sample upper-mid seaview project with resort-style amenities for comparison flows and shortlist demos.",
            "th": "โครงการวิวทะเลระดับ upper-mid แบบตัวอย่าง พร้อมส่วนกลางสไตล์รีสอร์ทสำหรับ flow เปรียบเทียบและเดโม shortlist.",
        },
        "description": {
            "en": "Demo project description used for compare and shortlist preview paths.",
            "th": "คำอธิบายโครงการเดโมที่ใช้กับเส้นทาง preview แบบ compare และ shortlist.",
        },
        "amenities": ["pool", "kids club", "sky lounge", "security"],
        "investment_snapshot": {
            "source": "Demo market range, local preview only",
            "updated_at": "2026-03-21",
            "headline": {
                "en": "Upper-mid beachfront compare set",
                "th": "ชุดเปรียบเทียบชายหาดระดับ upper-mid",
            },
        },
    },
]


PROPERTY_SPECS = [
    (
        "demo-jomtien-horizon-residence",
        "demo-jomtien-horizon-1br-city-view",
        "1BR Condo - Jomtien Horizon (City View)",
        2890000,
        1,
        1,
        38,
        "Jomtien Second Road, Pattaya",
        "new",
    ),
    (
        "demo-jomtien-horizon-residence",
        "demo-jomtien-horizon-2br-corner",
        "2BR Condo - Jomtien Horizon (Corner)",
        4980000,
        2,
        2,
        64,
        "Jomtien Second Road, Pattaya",
        "new",
    ),
    (
        "demo-jomtien-bay-suites",
        "demo-jomtien-bay-rental-suite",
        "1BR Rental Suite - Jomtien Bay",
        26000,
        1,
        1,
        42,
        "Jomtien Beach Road, Pattaya",
        "rent",
    ),
    (
        "demo-jomtien-bay-suites",
        "demo-jomtien-bay-family-2br",
        "2BR Family Condo - Jomtien Bay",
        4720000,
        2,
        2,
        71,
        "Jomtien Beach Road, Pattaya",
        "resale",
    ),
    (
        "demo-pratumnak-terrace-house",
        "demo-pratumnak-terrace-1br",
        "1BR Residence - Pratumnak Terrace",
        3650000,
        1,
        1,
        46,
        "Pratumnak Soi 5, Pattaya",
        "resale",
    ),
    (
        "demo-pratumnak-terrace-house",
        "demo-pratumnak-terrace-2br",
        "2BR Residence - Pratumnak Terrace",
        6120000,
        2,
        2,
        79,
        "Pratumnak Soi 5, Pattaya",
        "resale",
    ),
    (
        "demo-wongamat-shoreline-tower",
        "demo-wongamat-shoreline-1br",
        "1BR Seaview Condo - Wongamat Shoreline",
        6890000,
        1,
        1,
        48,
        "Naklua Soi 16, Pattaya",
        "new",
    ),
    (
        "demo-wongamat-shoreline-tower",
        "demo-wongamat-shoreline-2br",
        "2BR Seaview Condo - Wongamat Shoreline",
        11450000,
        2,
        2,
        86,
        "Naklua Soi 16, Pattaya",
        "new",
    ),
    (
        "demo-central-pattaya-city-lofts",
        "demo-central-city-lofts-studio",
        "Studio Loft - Central Pattaya City Lofts",
        2390000,
        0,
        1,
        29,
        "Pattaya Klang, Pattaya",
        "new",
    ),
    (
        "demo-central-pattaya-city-lofts",
        "demo-central-city-lofts-1br",
        "1BR Loft - Central Pattaya City Lofts",
        3490000,
        1,
        1,
        41,
        "Pattaya Klang, Pattaya",
        "resale",
    ),
    (
        "demo-central-pattaya-city-lofts",
        "demo-central-city-lofts-rent",
        "1BR Rental Loft - Central Pattaya City Lofts",
        22000,
        1,
        1,
        40,
        "Pattaya Klang, Pattaya",
        "rent",
    ),
    (
        "demo-najomtien-marina-park",
        "demo-najomtien-marina-1br",
        "1BR Coastal Condo - Na Jomtien Marina Park",
        4190000,
        1,
        1,
        47,
        "Na Jomtien Soi 10, Pattaya",
        "new",
    ),
    (
        "demo-najomtien-marina-park",
        "demo-najomtien-marina-2br",
        "2BR Coastal Condo - Na Jomtien Marina Park",
        7350000,
        2,
        2,
        88,
        "Na Jomtien Soi 10, Pattaya",
        "new",
    ),
    (
        "demo-pratumnak-view-residence",
        "demo-pratumnak-view-1br",
        "1BR Hillview Residence - Pratumnak View",
        3980000,
        1,
        1,
        45,
        "Pratumnak Hill, Pattaya",
        "resale",
    ),
    (
        "demo-pratumnak-view-residence",
        "demo-pratumnak-view-rent",
        "1BR Rental Residence - Pratumnak View",
        24000,
        1,
        1,
        44,
        "Pratumnak Hill, Pattaya",
        "rent",
    ),
    (
        "demo-wongamat-bay-club",
        "demo-wongamat-bay-club-1br",
        "1BR Bay Club Residence - Wongamat",
        5980000,
        1,
        1,
        44,
        "Naklua Soi 18, Pattaya",
        "new",
    ),
    (
        "demo-wongamat-bay-club",
        "demo-wongamat-bay-club-2br",
        "2BR Bay Club Residence - Wongamat",
        9850000,
        2,
        2,
        76,
        "Naklua Soi 18, Pattaya",
        "resale",
    ),
    (
        "demo-jomtien-horizon-residence",
        "demo-jomtien-horizon-family-rent",
        "2BR Family Rental - Jomtien Horizon",
        32000,
        2,
        2,
        66,
        "Jomtien Second Road, Pattaya",
        "rent",
    ),
]


TESTIMONIALS = [
    {
        "slug": "demo-testimonial-investor-jomtien",
        "persona": "investor",
        "intent": "buy",
        "quote": "The sample shortlist felt coherent immediately. Pricing, area context, and next-step prompts all lined up in a way that made the demo feel operational instead of placeholder-only.",
        "attribution_name": "Preview Investor A",
        "context": "Used for local preview walkthroughs only.",
    },
    {
        "slug": "demo-testimonial-family-central",
        "persona": "lifestyle_buyer",
        "intent": "buy",
        "quote": "We could explain Central Pattaya versus Jomtien in one session because the sample content already showed lifestyle differences, commute logic, and realistic unit examples.",
        "attribution_name": "Preview Family Buyer",
        "context": "Used for local preview walkthroughs only.",
    },
    {
        "slug": "demo-testimonial-expat-rent",
        "persona": "expat",
        "intent": "rent",
        "quote": "The preview content made the rental options feel tangible. It was easy to compare practical layouts, transport notes, and local images without broken media.",
        "attribution_name": "Preview Expat Renter",
        "context": "Used for local preview walkthroughs only.",
    },
    {
        "slug": "demo-testimonial-premium-wongamat",
        "persona": "investor",
        "intent": "buy",
        "quote": "For higher-end demos, the Wongamat sample pages gave enough narrative structure to discuss seaview positioning without making risky promises about returns.",
        "attribution_name": "Preview Premium Buyer",
        "context": "Used for local preview walkthroughs only.",
    },
    {
        "slug": "demo-testimonial-second-home",
        "persona": "lifestyle_buyer",
        "intent": "buy",
        "quote": "Na Jomtien sample content helped frame the second-home conversation clearly. The pages looked complete, the imagery loaded, and nothing felt unfinished.",
        "attribution_name": "Preview Second-Home Buyer",
        "context": "Used for local preview walkthroughs only.",
    },
    {
        "slug": "demo-testimonial-seller-context",
        "persona": "seller",
        "intent": "sell",
        "quote": "Even in a demo environment, the content felt structured enough to discuss positioning, audience fit, and what a cleaner listing workflow could look like.",
        "attribution_name": "Preview Seller",
        "context": "Used for local preview walkthroughs only.",
    },
]


ARTICLES = [
    {
        "slug": "demo-pattaya-buying-basics-2026",
        "category": "guide",
        "hero_media": "article_hero_a",
        "title": {
            "en": "Pattaya Buying Basics for a Local Preview Demo",
            "th": "พื้นฐานการซื้ออสังหาฯ พัทยา สำหรับเดโม local preview",
        },
        "excerpt": {
            "en": "Sample guide that explains how to read areas, project fit, and next steps without using unverified claims.",
            "th": "คู่มือตัวอย่างที่อธิบายการอ่านทำเล ความเหมาะสมของโครงการ และขั้นตอนถัดไปโดยไม่ใช้ claim ที่ยังไม่ยืนยัน.",
        },
        "body_md": {
            "en": "## Why this sample guide exists\n\nThis article is written for local preview content reseed mode. It demonstrates how a buyer education page can look complete without pretending the data is final.\n\n## What to confirm in a real workflow\n\n- Legal structure and foreign quota availability\n- Payment schedule and transfer timing\n- Building management quality and operating costs\n- Whether the area suits end-use, rental demand, or both\n\n## How to use this guide in demo mode\n\nUse it to explain process, not to promise outcomes. The purpose is to keep the public-facing guide pages informative, bilingual, and visually complete in a local or staging environment.",
            "th": "## เหตุผลที่คู่มือตัวอย่างนี้ถูกสร้างขึ้น\n\nบทความนี้เขียนขึ้นสำหรับโหมด reseed ของ local preview เพื่อแสดงให้เห็นว่าหน้าให้ความรู้ผู้ซื้อสามารถดูครบถ้วนได้ โดยไม่ทำเหมือนว่าข้อมูลทุกอย่างเป็นข้อมูลยืนยันแล้ว.\n\n## สิ่งที่ควรยืนยันใน workflow จริง\n\n- โครงสร้างทางกฎหมายและ foreign quota\n- ตารางชำระเงินและช่วงเวลาการโอน\n- คุณภาพการบริหารอาคารและต้นทุนการถือครอง\n- ความเหมาะสมของทำเลต่อการอยู่เอง การปล่อยเช่า หรือทั้งสองอย่าง\n\n## วิธีใช้บทความนี้ในโหมดเดโม\n\nใช้เพื่ออธิบายกระบวนการ ไม่ใช่เพื่อการการันตีผลลัพธ์ เป้าหมายคือทำให้หน้า guide ฝั่ง public มีข้อมูลสองภาษาและภาพประกอบพร้อมใช้งานใน local หรือ staging environment.",
        },
    },
    {
        "slug": "demo-jomtien-vs-central-pattaya",
        "category": "blog",
        "hero_media": "article_hero_b",
        "title": {
            "en": "Jomtien vs Central Pattaya: Sample Positioning Notes",
            "th": "Jomtien เทียบ Central Pattaya: บันทึกการวาง positioning แบบตัวอย่าง",
        },
        "excerpt": {
            "en": "A neutral sample comparison of two buyer journeys in Pattaya.",
            "th": "การเปรียบเทียบเส้นทางการตัดสินใจของผู้ซื้อสองแบบในพัทยาอย่างเป็นกลาง.",
        },
        "body_md": {
            "en": "## Jomtien\n\nJomtien usually works well when the conversation centers on beachfront habit, easier family rhythm, and steady long-stay demand.\n\n## Central Pattaya\n\nCentral Pattaya fits when the buyer values walkability, retail access, and shorter daily errands.\n\n## Demo note\n\nThis is sample editorial copy used to keep the blog surface populated in preview.",
            "th": "## Jomtien\n\nJomtien มักเหมาะเมื่อบทสนทนาเน้นการใช้ชีวิตใกล้หาด จังหวะชีวิตที่เหมาะกับครอบครัว และดีมานด์เช่าระยะยาวที่สม่ำเสมอ.\n\n## Central Pattaya\n\nCentral Pattaya เหมาะเมื่อผู้ซื้อให้ความสำคัญกับการเดินถึงได้ ห้าง และภารกิจประจำวันที่สั้นลง.\n\n## หมายเหตุสำหรับเดโม\n\nบทความนี้เป็นข้อความตัวอย่างเพื่อให้พื้นผิว blog ใน preview มีคอนเทนต์ครบถ้วน.",
        },
    },
    {
        "slug": "demo-foreign-buyer-documents-checklist",
        "category": "guide",
        "hero_media": "article_hero_c",
        "title": {
            "en": "Foreign Buyer Documents Checklist: Demo Guide",
            "th": "เช็กลิสต์เอกสารผู้ซื้อชาวต่างชาติ: คู่มือตัวอย่าง",
        },
        "excerpt": {
            "en": "Sample checklist structure for explaining the documentation phase clearly.",
            "th": "โครงสร้างเช็กลิสต์ตัวอย่างสำหรับอธิบายช่วงเตรียมเอกสารให้ชัดเจน.",
        },
        "body_md": {
            "en": "## Core documents\n\n- Passport copy\n- Reservation and payment records\n- Bank transfer evidence when applicable\n- Contact details for transfer coordination\n\n## Demo positioning\n\nThe exact document set varies by project and legal structure. This guide is intentionally neutral and meant only to demonstrate a complete public content surface in preview mode.",
            "th": "## เอกสารหลัก\n\n- สำเนาพาสปอร์ต\n- หลักฐานการจองและการชำระเงิน\n- หลักฐานการโอนเงินจากธนาคารเมื่อเกี่ยวข้อง\n- ข้อมูลติดต่อสำหรับประสานงานวันโอน\n\n## การวางเนื้อหาแบบเดโม\n\nชุดเอกสารจริงอาจต่างกันตามโครงการและโครงสร้างทางกฎหมาย คู่มือนี้จงใจเขียนแบบกลางและใช้เพื่อทำให้พื้นผิว content ฝั่ง public ครบในโหมด preview เท่านั้น.",
        },
    },
    {
        "slug": "demo-pratumnak-boutique-living",
        "category": "blog",
        "hero_media": "article_hero_d",
        "title": {
            "en": "Pratumnak Boutique Living: Demo Area Story",
            "th": "Pratumnak แบบบูติก: เรื่องเล่าทำเลสำหรับเดโม",
        },
        "excerpt": {
            "en": "Sample area-led blog copy for quieter hillside residential positioning.",
            "th": "ข้อความ blog แบบตัวอย่างที่เล่าผ่านมุมมองทำเลบนเนินเขาที่สงบกว่า.",
        },
        "body_md": {
            "en": "Pratumnak often enters the conversation when a buyer wants a shorter route between city energy and private residential time. This sample article keeps the story balanced and avoids unverified superlatives.",
            "th": "Pratumnak มักถูกพูดถึงเมื่อผู้ซื้อต้องการระยะทางที่สั้นระหว่างความคึกคักของเมืองกับเวลาส่วนตัวในที่พักอาศัย บทความตัวอย่างนี้เล่าเรื่องอย่างสมดุลและหลีกเลี่ยงการใช้คำเกินจริงที่ยังไม่ยืนยัน.",
        },
    },
    {
        "slug": "demo-shortlist-to-viewing-next-steps",
        "category": "guide",
        "hero_media": "article_hero_a",
        "title": {
            "en": "From Shortlist to Viewing: Demo Next Steps",
            "th": "จาก shortlist ไปสู่การนัดดูห้อง: ขั้นตอนตัวอย่าง",
        },
        "excerpt": {
            "en": "Sample operational guide for moving a buyer from browsing into a clearer viewing brief.",
            "th": "คู่มือเชิงปฏิบัติการแบบตัวอย่างสำหรับพาผู้ซื้อจากการดูข้อมูลไปสู่ brief สำหรับนัดดูห้องที่ชัดเจนขึ้น.",
        },
        "body_md": {
            "en": "Use a shortlist to narrow product type, area fit, and budget comfort first. In a live workflow, the next step would be validating unit availability and documentation. In preview mode, this guide exists to keep the page informative and complete.",
            "th": "ใช้ shortlist เพื่อกรองประเภทสินค้า ความเหมาะสมของทำเล และระดับงบประมาณก่อน ใน workflow จริง ขั้นตอนถัดไปคือยืนยันยูนิตที่ว่างและเอกสารที่เกี่ยวข้อง ส่วนใน preview คู่มือนี้มีไว้เพื่อให้หน้าเว็บมีข้อมูลครบและใช้งานได้จริงในเดโม.",
        },
    },
    {
        "slug": "demo-wongamat-premium-positioning",
        "category": "blog",
        "hero_media": "article_hero_b",
        "title": {
            "en": "Wongamat Premium Positioning: Demo Notes",
            "th": "การวาง positioning ระดับพรีเมียมของ Wongamat: บันทึกตัวอย่าง",
        },
        "excerpt": {
            "en": "Sample premium-market story for public blog completeness in preview.",
            "th": "เรื่องเล่าตลาดระดับพรีเมียมแบบตัวอย่าง เพื่อให้ blog ฝั่ง public ครบถ้วนใน preview.",
        },
        "body_md": {
            "en": "Wongamat sample content should focus on seaview scarcity, quiet beachfront identity, and buyer fit rather than promising returns. That keeps the story credible even in a demo environment.",
            "th": "คอนเทนต์ตัวอย่างของ Wongamat ควรเน้นความหายากของวิวทะเล อัตลักษณ์ชายหาดที่สงบ และความเหมาะสมของผู้ซื้อ มากกว่าการให้คำมั่นเรื่องผลตอบแทน วิธีนี้ทำให้เรื่องเล่าดูน่าเชื่อถือแม้อยู่ในสภาพแวดล้อมเดโม.",
        },
    },
]


VIDEOS = [
    {
        "slug": "demo-pattaya-area-overview-video",
        "title": {"en": "Pattaya Area Overview Demo Video", "th": "วิดีโอเดโมภาพรวมทำเลพัทยา"},
        "caption": {
            "en": "Sample bilingual caption for an area overview walkthrough.",
            "th": "คำบรรยายสองภาษาตัวอย่างสำหรับวิดีโอพาทัวร์ภาพรวมทำเล.",
        },
        "youtube_url": "https://www.youtube.com/watch?v=M7lc1UVf-VE",
        "thumbnail_media": "video_thumb_a",
    },
    {
        "slug": "demo-jomtien-project-walkthrough-video",
        "title": {"en": "Jomtien Project Walkthrough Demo", "th": "เดโมพาทัวร์โครงการฝั่ง Jomtien"},
        "caption": {
            "en": "Sample caption for a preview-only project walkthrough.",
            "th": "คำบรรยายตัวอย่างสำหรับวิดีโอพาทัวร์โครงการในโหมด preview เท่านั้น.",
        },
        "youtube_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        "thumbnail_media": "video_thumb_b",
    },
    {
        "slug": "demo-foreign-buyer-qa-video",
        "title": {"en": "Foreign Buyer Q&A Demo", "th": "เดโมถามตอบสำหรับผู้ซื้อชาวต่างชาติ"},
        "caption": {
            "en": "Sample caption for a neutral buyer-education video.",
            "th": "คำบรรยายตัวอย่างสำหรับวิดีโอให้ความรู้ผู้ซื้อแบบเป็นกลาง.",
        },
        "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        "thumbnail_media": "article_hero_c",
    },
    {
        "slug": "demo-shortlist-next-step-video",
        "title": {"en": "Shortlist Next-Step Demo", "th": "เดโมขั้นตอนถัดไปหลังทำ shortlist"},
        "caption": {
            "en": "Sample caption that explains how the preview shortlist flow can be used in demos.",
            "th": "คำบรรยายตัวอย่างที่อธิบายการใช้ flow shortlist ในการสาธิต preview.",
        },
        "youtube_url": "https://www.youtube.com/watch?v=ScMzIvxBSi4",
        "thumbnail_media": "article_hero_d",
    },
]


COMPANY_PAGES = [
    {
        "slug": "demo-about",
        "title": "About This Preview Demo | เกี่ยวกับเดโมนี้",
        "content": "## EN\nThis company page is sample content for the local preview environment. It explains the advisory style, the limits of demo data, and how a complete public page should read.\n\n## TH\nหน้านี้เป็นคอนเทนต์ตัวอย่างสำหรับ local preview ใช้อธิบายแนวทางการให้คำปรึกษา ขอบเขตของข้อมูลเดโม และรูปแบบของหน้า public ที่ควรอ่านได้ครบ.",
        "meta_title": "About Preview Demo | เกี่ยวกับ Preview Demo",
        "meta_description": "Sample company page for preview content reseed in English and Thai.",
    },
    {
        "slug": "demo-how-we-work",
        "title": "How We Work in Demo Mode | วิธีทำงานในโหมดเดโม",
        "content": "## EN\nThe sample workflow starts with area fit, project shortlist, and documentation preparation. It is written to demonstrate process clarity rather than live operational commitments.\n\n## TH\nworkflow ตัวอย่างเริ่มจากการดูความเหมาะสมของทำเล การทำ shortlist โครงการ และการเตรียมเอกสาร เนื้อหานี้มีไว้เพื่อสาธิตความชัดเจนของกระบวนการ ไม่ใช่คำมั่นเชิงปฏิบัติการจริง.",
        "meta_title": "How We Work Demo | วิธีทำงานเดโม",
        "meta_description": "Preview-only company page describing a sample advisory workflow.",
    },
    {
        "slug": "demo-buyer-prep",
        "title": "Buyer Preparation Demo | การเตรียมตัวของผู้ซื้อแบบเดโม",
        "content": "## EN\nUse this page to demonstrate what a buyer-prep page looks like when sample copy, internal links, and bilingual structure are fully filled in.\n\n## TH\nใช้หน้านี้เพื่อสาธิตว่าหน้าเตรียมตัวของผู้ซื้อควรมีหน้าตาอย่างไร เมื่อข้อความตัวอย่าง ลิงก์ภายใน และโครงสร้างสองภาษาถูกเติมครบแล้ว.",
        "meta_title": "Buyer Prep Demo | เดโมการเตรียมตัวผู้ซื้อ",
        "meta_description": "Sample bilingual buyer-preparation page for local preview demos.",
    },
]


@dataclass
class ApiClient:
    api_base: str
    admin_base: str
    email: str
    password: str
    timeout: float = 30.0

    def __post_init__(self) -> None:
        self.http = httpx.Client(timeout=self.timeout, follow_redirects=True)
        self.token = self.login()

    def close(self) -> None:
        self.http.close()

    def login(self) -> str:
        response = self.http.post(
            f"{self.api_base}/v1/auth/login",
            json={"email": self.email, "password": self.password},
        )
        response.raise_for_status()
        payload = response.json()
        token = str(payload.get("access_token") or "").strip()
        if not token:
            raise RuntimeError("Login succeeded without access token")
        return token

    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    def get(self, path: str, *, params: dict[str, Any] | None = None) -> Any:
        response = self.http.get(f"{self.api_base}{path}", headers=self.headers(), params=params)
        response.raise_for_status()
        return response.json()

    def post(
        self,
        path: str,
        *,
        json_body: Any | None = None,
        files: Any | None = None,
        data: dict[str, Any] | None = None,
    ) -> Any:
        response = self.http.post(
            f"{self.api_base}{path}",
            headers=self.headers() if files is None else {"Authorization": f"Bearer {self.token}"},
            json=json_body if files is None else None,
            files=files,
            data=data,
        )
        response.raise_for_status()
        if not response.text.strip():
            return {}
        return response.json()

    def patch(self, path: str, *, json_body: Any) -> Any:
        response = self.http.patch(f"{self.api_base}{path}", headers=self.headers(), json=json_body)
        response.raise_for_status()
        return response.json()

    def put(self, path: str, *, json_body: Any) -> Any:
        response = self.http.put(f"{self.api_base}{path}", headers=self.headers(), json=json_body)
        response.raise_for_status()
        return response.json()

    def delete(self, path: str) -> Any:
        response = self.http.delete(f"{self.api_base}{path}", headers=self.headers())
        response.raise_for_status()
        if not response.text.strip():
            return {}
        return response.json()

    def public_get(self, path: str) -> httpx.Response:
        response = self.http.get(f"{self.admin_base}{path}")
        response.raise_for_status()
        return response


def iso_timestamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


def ensure_local_preview_gate(api_base: str, admin_base: str) -> dict[str, Any]:
    with httpx.Client(timeout=20.0, follow_redirects=True) as client:
        api_version = client.get(f"{api_base}/platform/version")
        api_version.raise_for_status()
        api_payload = api_version.json()

        developers_page = client.get(f"{admin_base}/en/developers")
        developers_page.raise_for_status()

    api_host = httpx.URL(api_base).host
    admin_host = httpx.URL(admin_base).host
    if api_host not in {"127.0.0.1", "localhost"}:
        raise RuntimeError(f"Unsafe API host for reseed: {api_base}")
    if admin_host not in {"127.0.0.1", "localhost"}:
        raise RuntimeError(f"Unsafe admin/public host for reseed: {admin_base}")
    if "amppattaya.com" in api_base or "amppattaya.com" in admin_base:
        raise RuntimeError("Production public base URL must not be used for reseed operations")

    source = str(api_payload.get("source") or "")
    environment_name = "preview" if "deploy_preview" in source else "local"

    return {
        "current_base_url": admin_base,
        "api_base_url": api_base,
        "current_environment_name": environment_name,
        "workspace_identifier": WORKSPACE_NAME,
        "non_production_confirmed": True,
        "production_public_base_url_used": False,
        "evidence": {
            "platform_version": api_payload,
            "developers_page_status": developers_page.status_code,
        },
    }


def paged_fetch(
    client: ApiClient, path: str, *, params: dict[str, Any], items_key: str
) -> list[dict[str, Any]]:
    page = int(params.get("page", 1))
    limit = int(params.get("limit", 200))
    items: list[dict[str, Any]] = []
    while True:
        payload = client.get(path, params={**params, "page": page, "limit": limit})
        chunk = payload.get(items_key) or []
        items.extend(chunk)
        meta = payload.get("meta") or {}
        total = int(meta.get("total") or len(items))
        if len(items) >= total or not chunk:
            break
        page += 1
    return items


def fetch_entity(client: ApiClient, entity: str) -> list[dict[str, Any]]:
    cfg = BACKUP_ENTITIES[entity]
    params = dict(cfg.get("params") or {})
    if cfg.get("paged"):
        return paged_fetch(client, cfg["path"], params=params, items_key=cfg["items_key"])
    payload = client.get(cfg["path"], params=params or None)
    items = payload.get(cfg["items_key"]) or []
    if entity == "media" and len(items) >= int(params.get("limit", 200)):
        raise RuntimeError(
            "Media backup reached the current hard limit; aborting to avoid incomplete backup"
        )
    return items


def write_backup(
    backup_dir: Path, entity: str, items: list[dict[str, Any]], stamp: str
) -> dict[str, Any]:
    path = backup_dir / f"{stamp}_{entity}.json"
    path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    verified = False
    if items:
        try:
            reread = json.loads(path.read_text(encoding="utf-8"))
            verified = isinstance(reread, list) and len(reread) == len(items)
        except Exception:
            verified = False
    else:
        verified = True
    return {
        "path": str(path),
        "count": len(items),
        "verified_readable_non_empty": verified,
    }


def _media_source_metadata(item: dict[str, str]) -> dict[str, str]:
    return {
        "source_note": "Local repository media reused for preview sample content reseed.",
        "original_local_path": item["path"],
        "workspace": WORKSPACE_NAME,
    }


def _stable_testimonial_key(*, attribution_name: str | None, context: str | None) -> str:
    return f"{str(attribution_name or '').strip()}|{str(context or '').strip()}"


def _index_existing_media(items: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    known_keys = {row["key"] for row in MEDIA_SOURCES}
    indexed: dict[str, dict[str, str]] = {}
    for item in items:
        raw_tags = item.get("tags") or []
        tags = {str(tag).strip() for tag in raw_tags if str(tag).strip()}
        if "demo" not in tags or "preview-reseed" not in tags:
            continue
        matched_keys = sorted(key for key in known_keys if key in tags)
        if not matched_keys:
            continue
        key = matched_keys[0]
        indexed[key] = {
            "media_id": str(item["id"]),
            "path": str(item["storage_path"]),
            "title": str(item.get("title") or "").strip() or key,
        }
    return indexed


def _index_by_slug(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if slug:
            indexed[slug] = item
    return indexed


def _index_properties_by_source_id(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for item in items:
        source_id = str(item.get("source_id") or "").strip()
        if source_id:
            indexed[source_id] = item
    return indexed


def _index_testimonials(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for item in items:
        key = _stable_testimonial_key(
            attribution_name=item.get("attribution_name"),
            context=item.get("context"),
        )
        if key.strip("|"):
            indexed[key] = item
    return indexed


def _is_known_demo_record(entity: str, item: dict[str, Any]) -> bool:
    slug = str(item.get("slug") or "").strip()
    if entity == "developers":
        return slug in {row["slug"] for row in DEVELOPERS}
    if entity == "areas":
        return slug in {row["slug"] for row in AREAS}
    if entity == "projects":
        return slug in {row["slug"] for row in PROJECTS}
    if entity == "properties":
        source_id = str(item.get("source_id") or "").strip()
        return source_id.startswith("demo-local-")
    if entity == "articles":
        return slug in {row["slug"] for row in ARTICLES}
    if entity == "videos":
        return slug in {row["slug"] for row in VIDEOS}
    if entity == "company":
        return slug in {row["slug"] for row in COMPANY_PAGES}
    if entity == "testimonials":
        key = _stable_testimonial_key(
            attribution_name=item.get("attribution_name"),
            context=item.get("context"),
        )
        known = {
            _stable_testimonial_key(
                attribution_name=row["attribution_name"],
                context=row["context"],
            )
            for row in TESTIMONIALS
        }
        return key in known
    return False


def _record_entity_action(
    report: dict[str, Any],
    *,
    entity: str,
    action: str,
    payload: dict[str, Any],
) -> None:
    report[f"{action}_records_by_entity"][entity].append(payload)


def upload_media_bundle(
    client: ApiClient,
    report: dict[str, Any],
    *,
    existing_media: dict[str, dict[str, str]],
) -> dict[str, dict[str, str]]:
    uploaded: dict[str, dict[str, str]] = {}
    for item in MEDIA_SOURCES:
        disk_path = WORKSPACE_ROOT / item["path"]
        if not disk_path.exists():
            raise RuntimeError(f"Local media source not found: {disk_path}")
        source_metadata_payload = _media_source_metadata(item)
        existing = existing_media.get(item["key"])
        if existing is not None:
            media_id = existing["media_id"]
            client.patch(
                f"/admin/media/{media_id}",
                json_body={
                    "title": item["title"],
                    "alt_en": f"{item['title']} sample image",
                    "alt_th": f"ภาพตัวอย่าง {item['title']}",
                    "caption_en": "Sample local media uploaded for preview reseed.",
                    "caption_th": "สื่อ local ตัวอย่างที่อัปโหลดสำหรับการ reseed ใน preview.",
                    "tags": ["demo", "preview-reseed", item["key"]],
                    "rights_status": "approved",
                    "approval_status": "approved",
                    "credit": "FlowBiz local preview asset",
                    "source_metadata": source_metadata_payload,
                },
            )
            uploaded[item["key"]] = {
                "media_id": media_id,
                "path": existing["path"],
                "title": item["title"],
            }
            report["reused_media_list"].append(
                {
                    "key": item["key"],
                    "media_id": media_id,
                    "path": existing["path"],
                    "source_note": "Reused existing preview reseed media asset.",
                }
            )
            continue
        mime = mimetypes.guess_type(disk_path.name)[0] or "application/octet-stream"
        source_metadata = json.dumps(source_metadata_payload, ensure_ascii=False)
        with disk_path.open("rb") as handle:
            payload = client.post(
                "/admin/media/upload",
                files={"file": (disk_path.name, handle, mime)},
                data={
                    "title": item["title"],
                    "alt_en": f"{item['title']} sample image",
                    "alt_th": f"ภาพตัวอย่าง {item['title']}",
                    "caption_en": "Sample local media uploaded for preview reseed.",
                    "caption_th": "สื่อ local ตัวอย่างที่อัปโหลดสำหรับการ reseed ใน preview.",
                    "tags": json.dumps(["demo", "preview-reseed", item["key"]]),
                    "source_domain": "local-repo",
                    "rights_status": "approved",
                    "approval_status": "approved",
                    "rights_note": "Approved for local preview demo use.",
                    "credit": "FlowBiz local preview asset",
                    "source_metadata": source_metadata,
                },
            )
        media = payload["media"]
        uploaded[item["key"]] = {
            "media_id": str(media["id"]),
            "path": str(media["storage_path"]),
            "title": str(media.get("title") or item["title"]),
        }
        report["uploaded_media_list"].append(
            {
                "key": item["key"],
                "media_id": str(media["id"]),
                "path": str(media["storage_path"]),
                "source_note": "Local repository media reused for preview sample content reseed.",
            }
        )
    return uploaded


def create_developers(
    client: ApiClient,
    media: dict[str, dict[str, str]],
    report: dict[str, Any],
    *,
    existing_by_slug: dict[str, dict[str, Any]],
) -> dict[str, str]:
    ids: dict[str, str] = {}
    for row in DEVELOPERS:
        payload = {
            "slug": row["slug"],
            "name": row["name"],
            "website": row["website"],
            "tier": row["tier"],
            "profile": row["profile"],
            "summary": row["summary"],
            "source_note": row["source_note"],
            "trust_proof": row["trust_proof"],
            "logo_url": media[row["logo_media"]]["path"],
            "cover_image_url": media[row["cover_media"]]["path"],
            "status": "inactive",
        }
        existing = existing_by_slug.get(row["slug"])
        if existing is not None:
            updated = client.patch(f"/admin/developers/{existing['id']}", json_body=payload)
            developer = updated["developer"]
            _record_entity_action(
                report,
                entity="developers",
                action="updated",
                payload={"slug": row["slug"], "id": developer["id"]},
            )
        else:
            created = client.post("/admin/developers", json_body=payload)
            developer = created["developer"]
            _record_entity_action(
                report,
                entity="developers",
                action="created",
                payload={"slug": row["slug"], "id": developer["id"]},
            )
        ids[row["slug"]] = developer["id"]
    return ids


def create_areas(
    client: ApiClient,
    media: dict[str, dict[str, str]],
    report: dict[str, Any],
    *,
    existing_by_slug: dict[str, dict[str, Any]],
) -> dict[str, str]:
    ids: dict[str, str] = {}
    for row in AREAS:
        payload = {
            "slug": row["slug"],
            "name": row["name"],
            "city": row["city"],
            "summary": row["summary"],
            "content": row["content"],
            "source_note": row["source_note"],
            "map_center": row["map_center"],
            "cover_image_url": media[row["media"][0]]["path"],
            "hero_image_url": media[row["media"][1]]["path"],
            "status": "draft",
        }
        existing = existing_by_slug.get(row["slug"])
        if existing is not None:
            updated = client.patch(f"/admin/areas/{existing['id']}", json_body=payload)
            area = updated["area"]
            _record_entity_action(
                report,
                entity="areas",
                action="updated",
                payload={"slug": row["slug"], "id": area["id"]},
            )
        else:
            created = client.post("/admin/areas", json_body=payload)
            area = created["area"]
            _record_entity_action(
                report,
                entity="areas",
                action="created",
                payload={"slug": row["slug"], "id": area["id"]},
            )
        ids[row["slug"]] = area["id"]
        client.put(f"/admin/areas/{area['id']}/statistics", json_body=row["statistics"])
        client.post(f"/admin/areas/{area['id']}/publish")
        report["published_records_by_entity"]["areas"].append(
            {"slug": row["slug"], "id": area["id"]}
        )
    return ids


def create_projects(
    client: ApiClient,
    media: dict[str, dict[str, str]],
    area_ids: dict[str, str],
    developer_ids: dict[str, str],
    report: dict[str, Any],
    *,
    existing_by_slug: dict[str, dict[str, Any]],
) -> dict[str, str]:
    ids: dict[str, str] = {}
    for row in PROJECTS:
        payload = {
            "slug": row["slug"],
            "name": row["name"],
            "status": "draft",
            "area_id": area_ids[row["area_slug"]],
            "developer_id": developer_ids[row["developer_slug"]],
            "property_type": row["property_type"],
            "cover_image_url": media[row["cover_media"]]["path"],
            "hero_image_url": media[row["hero_media"]]["path"],
            "images": [media[row["hero_media"]]["path"], media[row["cover_media"]]["path"]],
            "summary": row["summary"],
            "description": row["description"],
            "amenities": row["amenities"],
            "source_notes": {
                "en": "Sample project record for local preview only.",
                "th": "เรคคอร์ดโครงการตัวอย่างสำหรับ local preview เท่านั้น.",
            },
            "investment_snapshot": row["investment_snapshot"],
        }
        existing = existing_by_slug.get(row["slug"])
        if existing is not None:
            updated = client.patch(f"/admin/projects/{existing['id']}", json_body=payload)
            project = updated["project"]
            _record_entity_action(
                report,
                entity="projects",
                action="updated",
                payload={"slug": row["slug"], "id": project["id"]},
            )
        else:
            created = client.post("/admin/projects", json_body=payload)
            project = created["project"]
            _record_entity_action(
                report,
                entity="projects",
                action="created",
                payload={"slug": row["slug"], "id": project["id"]},
            )
        ids[row["slug"]] = project["id"]
        client.post(f"/admin/projects/{project['id']}/publish")
        report["published_records_by_entity"]["projects"].append(
            {"slug": row["slug"], "id": project["id"]}
        )
    return ids


def publish_developers(
    client: ApiClient, developer_ids: dict[str, str], report: dict[str, Any]
) -> None:
    for slug, developer_id in developer_ids.items():
        client.post(f"/admin/developers/{developer_id}/publish")
        report["published_records_by_entity"]["developers"].append(
            {"slug": slug, "id": developer_id}
        )


def create_properties(
    client: ApiClient,
    media: dict[str, dict[str, str]],
    area_ids: dict[str, str],
    developer_ids: dict[str, str],
    project_ids: dict[str, str],
    report: dict[str, Any],
    *,
    existing_by_source_id: dict[str, dict[str, Any]],
) -> dict[str, str]:
    ids: dict[str, str] = {}
    image_cycle = [
        media["project_hero_a"]["path"],
        media["project_hero_b"]["path"],
        media["project_hero_c"]["path"],
        media["project_hero_d"]["path"],
        media["project_hero_e"]["path"],
        media["project_hero_f"]["path"],
        media["project_hero_g"]["path"],
        media["project_hero_h"]["path"],
        media["area_jomtien"]["path"],
        media["area_pratumnak"]["path"],
        media["area_wongamat"]["path"],
        media["area_central"]["path"],
        media["area_najomtien"]["path"],
    ]
    project_lookup = {row["slug"]: row for row in PROJECTS}
    for index, (
        project_slug,
        property_slug,
        title,
        price,
        bedrooms,
        bathrooms,
        size_sqm,
        address,
        listing_type,
    ) in enumerate(PROPERTY_SPECS):
        project_row = project_lookup[project_slug]
        cover = image_cycle[index % len(image_cycle)]
        source_id = f"demo-local-{property_slug}"
        payload = {
            "source_id": source_id,
            "slug": property_slug,
            "title": title,
            "type": listing_type,
            "property_type": "condo",
            "status": "inactive",
            "price": price,
            "currency": "THB",
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "size_sqm": size_sqm,
            "address": address,
            "city": "Pattaya",
            "project_id": project_ids[project_slug],
            "area_id": area_ids[project_row["area_slug"]],
            "developer_id": developer_ids[project_row["developer_slug"]],
            "cover_image": cover,
            "cover_image_url": cover,
            "local_images": [cover],
            "images": [cover],
            "features": {
                "tags": ["demo", project_row["area_slug"], listing_type],
                "view_label": "sample-seaview"
                if project_row["area_slug"] in {"wongamat", "na-jomtien", "jomtien"}
                else "sample-city-view",
            },
            "source_meta": {
                "source_note": "Demo property record created for local preview reseed.",
                "source_domain": "local-preview",
                "trust_proof": "sample-only",
            },
        }
        existing = existing_by_source_id.get(source_id)
        if existing is not None:
            update_payload = dict(payload)
            update_payload.pop("source_id", None)
            prop = client.patch(f"/admin/properties/{existing['id']}", json_body=update_payload)
            _record_entity_action(
                report,
                entity="properties",
                action="updated",
                payload={"slug": property_slug, "id": prop["id"], "source_id": source_id},
            )
        else:
            prop = client.post("/admin/properties", json_body=payload)
            _record_entity_action(
                report,
                entity="properties",
                action="created",
                payload={"slug": property_slug, "id": prop["id"], "source_id": source_id},
            )
        ids[property_slug] = prop["id"]
        client.post(f"/admin/properties/{prop['id']}/publish")
        report["published_records_by_entity"]["properties"].append(
            {"slug": property_slug, "id": prop["id"]}
        )
    return ids


def create_testimonials(
    client: ApiClient,
    report: dict[str, Any],
    *,
    existing_by_key: dict[str, dict[str, Any]],
) -> None:
    for order, item in enumerate(TESTIMONIALS):
        payload = {
            "status": "draft",
            "persona": item["persona"],
            "intent": item["intent"],
            "quote": item["quote"],
            "attribution_name": item["attribution_name"],
            "context": item["context"],
            "display_order": order,
        }
        stable_key = _stable_testimonial_key(
            attribution_name=item["attribution_name"],
            context=item["context"],
        )
        existing = existing_by_key.get(stable_key)
        if existing is not None:
            updated = client.patch(f"/admin/testimonials/{existing['id']}", json_body=payload)
            testimonial_id = updated["id"]
            _record_entity_action(
                report,
                entity="testimonials",
                action="updated",
                payload={"slug": item["slug"], "id": testimonial_id},
            )
        else:
            created = client.post("/admin/testimonials", json_body=payload)
            testimonial_id = created["id"]
            _record_entity_action(
                report,
                entity="testimonials",
                action="created",
                payload={"slug": item["slug"], "id": testimonial_id},
            )
        client.post(f"/admin/testimonials/{testimonial_id}/publish")
        report["published_records_by_entity"]["testimonials"].append(
            {"slug": item["slug"], "id": testimonial_id}
        )


def create_articles(
    client: ApiClient,
    media: dict[str, dict[str, str]],
    report: dict[str, Any],
    *,
    existing_by_slug: dict[str, dict[str, Any]],
) -> None:
    for article in ARTICLES:
        create_payload = {
            "slug": article["slug"],
            "category": article["category"],
            "status": "draft",
            "title": article["title"],
            "excerpt": article["excerpt"],
            "body_md": article["body_md"],
            "source_url": "https://local.preview/articles/sample",
            "source_domain": "local-preview",
            "source_rights": "sample-neutral",
            "hero_image_url": media[article["hero_media"]]["path"],
            "hero_media_asset_id": media[article["hero_media"]]["media_id"],
        }
        existing = existing_by_slug.get(article["slug"])
        if existing is not None:
            update_payload = dict(create_payload)
            update_payload.pop("status", None)
            client.patch(f"/admin/content/articles/{article['slug']}", json_body=update_payload)
            _record_entity_action(
                report,
                entity="articles",
                action="updated",
                payload={"slug": article["slug"]},
            )
        else:
            client.post("/admin/content/articles", json_body=create_payload)
            _record_entity_action(
                report,
                entity="articles",
                action="created",
                payload={"slug": article["slug"]},
            )
        existing_status = str((existing or {}).get("status") or "draft").strip().lower()
        if existing_status == "draft":
            client.patch(
                f"/admin/content/articles/{article['slug']}",
                json_body={"status": "in_review"},
            )
            existing_status = "in_review"
        if existing_status == "in_review":
            client.patch(
                f"/admin/content/articles/{article['slug']}",
                json_body={"status": "approved"},
            )
            existing_status = "approved"
        if existing_status != "published":
            client.post(f"/admin/content/articles/{article['slug']}/publish")
        report["published_records_by_entity"]["articles"].append({"slug": article["slug"]})


def create_videos(
    client: ApiClient,
    media: dict[str, dict[str, str]],
    report: dict[str, Any],
    *,
    existing_by_slug: dict[str, dict[str, Any]],
) -> None:
    for order, video in enumerate(VIDEOS):
        payload = {
            "slug": video["slug"],
            "status": "draft",
            "title": video["title"],
            "caption": video["caption"],
            "youtube_url": video["youtube_url"],
            "thumbnail_path": media[video["thumbnail_media"]]["path"],
            "source_url": video["youtube_url"],
            "source_domain": "youtube.com",
            "verification_status": "sample-demo",
            "display_order": order,
        }
        existing = existing_by_slug.get(video["slug"])
        if existing is not None:
            update_payload = dict(payload)
            update_payload.pop("status", None)
            client.patch(f"/admin/content/videos/{video['slug']}", json_body=update_payload)
            _record_entity_action(
                report,
                entity="videos",
                action="updated",
                payload={"slug": video["slug"]},
            )
        else:
            client.post("/admin/content/videos", json_body=payload)
            _record_entity_action(
                report,
                entity="videos",
                action="created",
                payload={"slug": video["slug"]},
            )
        existing_status = str((existing or {}).get("status") or "draft").strip().lower()
        if existing_status != "published":
            client.post(f"/admin/content/videos/{video['slug']}/publish")
        report["published_records_by_entity"]["videos"].append({"slug": video["slug"]})


def upsert_company_pages(
    client: ApiClient,
    report: dict[str, Any],
    *,
    existing_by_slug: dict[str, dict[str, Any]],
) -> None:
    for page in COMPANY_PAGES:
        payload = {
            "title": page["title"],
            "content": page["content"],
            "meta_title": page["meta_title"],
            "meta_description": page["meta_description"],
        }
        if page["slug"] in existing_by_slug:
            client.patch(f"/admin/company/{page['slug']}", json_body=payload)
            _record_entity_action(
                report,
                entity="company",
                action="updated",
                payload={"slug": page["slug"]},
            )
        else:
            client.post("/admin/company", json_body={"slug": page["slug"], **payload})
            _record_entity_action(
                report,
                entity="company",
                action="created",
                payload={"slug": page["slug"]},
            )


def delete_records(
    client: ApiClient, backups: dict[str, list[dict[str, Any]]], report: dict[str, Any]
) -> None:
    delete_order = [
        "testimonials",
        "videos",
        "articles",
        "properties",
        "projects",
        "areas",
        "developers",
    ]
    for entity in delete_order:
        cfg = BACKUP_ENTITIES[entity]
        for item in backups[entity]:
            if _is_known_demo_record(entity, item):
                continue
            if cfg["kind"] == "slug":
                identifier = item["slug"]
                client.delete(f"{cfg['path']}/{identifier}")
                report["deleted_records_by_entity"][entity].append({"slug": identifier})
            else:
                identifier = item["id"]
                client.delete(f"{cfg['path']}/{identifier}")
                report["deleted_records_by_entity"][entity].append(
                    {"id": identifier, "slug": item.get("slug")}
                )


def verify_public_urls(
    client: ApiClient, property_slug: str, project_slugs: list[str], report: dict[str, Any]
) -> None:
    urls = [
        "/en/developers",
        "/en/area-guide",
        "/en/projects",
        f"/en/property/{property_slug}",
        "/en/compare",
        "/en/shortlist",
        "/en/smart-finder",
        "/en/buying-cost-estimator",
    ]
    compare_url = f"/en/compare?ids={project_slugs[0]},{project_slugs[1]}"
    urls.append(compare_url)
    for url in urls:
        result = {"url": url, "status": "FAIL", "http_status": None, "notes": []}
        try:
            response = client.public_get(url)
            result["http_status"] = response.status_code
            body = response.text
            if response.status_code == 200:
                result["status"] = "PASS"
            if "/media/" not in body and url not in {
                "/en/shortlist",
                "/en/compare",
                compare_url,
                "/en/buying-cost-estimator",
            }:
                result["notes"].append("No /media/ reference detected in HTML response")
            if "No published" in body or "ยังไม่มี" in body:
                result["notes"].append("Potential empty-state text detected")
        except Exception as exc:
            result["notes"].append(str(exc))
        report["public_urls_verified"].append(result)


def init_report(stamp: str, backup_dir: Path) -> dict[str, Any]:
    return {
        "run_timestamp": stamp,
        "backup_files_created": [],
        "before_counts": {},
        "after_counts": {},
        "deleted_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
                "company",
                "media",
            ]
        },
        "uploaded_media_list": [],
        "reused_media_list": [],
        "created_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
                "company",
            ]
        },
        "updated_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
                "company",
            ]
        },
        "published_records_by_entity": {
            key: []
            for key in [
                "developers",
                "areas",
                "projects",
                "properties",
                "testimonials",
                "articles",
                "videos",
            ]
        },
        "unresolved_items": [],
        "public_urls_verified": [],
        "final_readiness_summary": {},
        "report_path": str(backup_dir / f"{stamp}_report.json"),
    }


def save_report(report: dict[str, Any]) -> None:
    path = Path(report["report_path"])
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backup and reseed local/staging admin sample content through existing admin APIs."
    )
    parser.add_argument("--api-base", default=DEFAULT_API_BASE)
    parser.add_argument("--admin-base", default=DEFAULT_ADMIN_BASE)
    parser.add_argument("--email", default=DEFAULT_EMAIL)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Run destructive delete + reseed. Without this flag the script performs gate checks and backups only.",
    )
    args = parser.parse_args()

    stamp = iso_timestamp()
    backup_dir = WORKSPACE_ROOT / "artifacts" / "admin-sample-reseed" / stamp
    backup_dir.mkdir(parents=True, exist_ok=True)
    report = init_report(stamp, backup_dir)

    try:
        report["environment_gate"] = ensure_local_preview_gate(args.api_base, args.admin_base)
        client = ApiClient(args.api_base, args.admin_base, args.email, args.password)
        try:
            backups: dict[str, list[dict[str, Any]]] = {}
            for entity in BACKUP_ENTITIES:
                items = fetch_entity(client, entity)
                backups[entity] = items
                report["before_counts"][entity] = len(items)
                backup_meta = write_backup(backup_dir, entity, items, stamp)
                report["backup_files_created"].append({"entity": entity, **backup_meta})

            bad_backup = [
                item
                for item in report["backup_files_created"]
                if item["count"] > 0 and not item["verified_readable_non_empty"]
            ]
            if bad_backup:
                raise RuntimeError(
                    f"Backup verification failed for: {', '.join(item['entity'] for item in bad_backup)}"
                )

            report["classification_basis"] = {
                "mode": "full_preview_scope",
                "reason": "User requested full local/staging reseed for in-scope CMS entities and the current target is verified localhost preview.",
            }

            report["unresolved_items"].append(
                "Existing admin APIs do not expose delete endpoints for company pages or media assets, so old company/media records are backed up but not programmatically deleted in this run."
            )
            report["unresolved_items"].append(
                "Testimonial API schema does not currently support property_id or avatar_media_id even though the admin UI hints at those fields, so testimonials were reseeded with the fields the API actually accepts."
            )
            report["unresolved_items"].append(
                "Company pages only support single-string title/content/meta fields in the current API. Bilingual content was embedded inside those strings instead of locale maps."
            )

            if not args.execute:
                report["final_readiness_summary"] = {
                    "mode": "audit-only",
                    "destructive_actions_run": False,
                    "backup_gate_passed": True,
                    "message": "Environment and backup gates passed. Re-run with --execute to perform delete and reseed.",
                }
                save_report(report)
                print(json.dumps(report, ensure_ascii=False, indent=2))
                return 0

            delete_records(client, backups, report)
            uploaded_media = upload_media_bundle(
                client,
                report,
                existing_media=_index_existing_media(backups["media"]),
            )
            developer_ids = create_developers(
                client,
                uploaded_media,
                report,
                existing_by_slug=_index_by_slug(backups["developers"]),
            )
            area_ids = create_areas(
                client,
                uploaded_media,
                report,
                existing_by_slug=_index_by_slug(backups["areas"]),
            )
            project_ids = create_projects(
                client,
                uploaded_media,
                area_ids,
                developer_ids,
                report,
                existing_by_slug=_index_by_slug(backups["projects"]),
            )
            publish_developers(client, developer_ids, report)
            property_ids = create_properties(
                client,
                uploaded_media,
                area_ids,
                developer_ids,
                project_ids,
                report,
                existing_by_source_id=_index_properties_by_source_id(backups["properties"]),
            )
            create_testimonials(
                client,
                report,
                existing_by_key=_index_testimonials(backups["testimonials"]),
            )
            create_articles(
                client,
                uploaded_media,
                report,
                existing_by_slug=_index_by_slug(backups["articles"]),
            )
            create_videos(
                client,
                uploaded_media,
                report,
                existing_by_slug=_index_by_slug(backups["videos"]),
            )
            upsert_company_pages(
                client,
                report,
                existing_by_slug=_index_by_slug(backups["company"]),
            )

            for entity in BACKUP_ENTITIES:
                report["after_counts"][entity] = len(fetch_entity(client, entity))

            first_property_slug = next(iter(property_ids))
            verify_public_urls(client, first_property_slug, list(project_ids.keys())[:2], report)

            report["final_readiness_summary"] = {
                "mode": "execute",
                "destructive_actions_run": True,
                "backup_gate_passed": True,
                "environment_gate_passed": True,
                "minimum_targets_met": {
                    "developers": report["after_counts"].get("developers", 0) >= 4,
                    "areas": report["after_counts"].get("areas", 0) >= 5,
                    "projects": report["after_counts"].get("projects", 0) >= 8,
                    "properties": report["after_counts"].get("properties", 0) >= 18,
                    "testimonials": report["after_counts"].get("testimonials", 0) >= 6,
                    "articles": report["after_counts"].get("articles", 0) >= 6,
                    "videos": report["after_counts"].get("videos", 0) >= 4,
                    "company": report["after_counts"].get("company", 0) >= 3,
                },
            }
            save_report(report)
            print(json.dumps(report, ensure_ascii=False, indent=2))
            return 0
        finally:
            client.close()
    except Exception as exc:
        report["final_readiness_summary"] = {
            "mode": "failed",
            "destructive_actions_run": bool(args.execute),
            "error": str(exc),
        }
        report["unresolved_items"].append(f"Run failed: {exc}")
        save_report(report)
        print(json.dumps(report, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

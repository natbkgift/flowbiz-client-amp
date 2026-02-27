#!/usr/bin/env python3
"""
Generate AMP Presentation Template (PowerPoint)

Creates a professional presentation template for real estate project marketing plans
with pre-structured slides for: Overview, Target Audience, Message, Channels, Budget,
Creative Direction, KPIs, and Tracking.

Requirements:
    pip install python-pptx

Usage:
    python generate_presentation_template.py
"""

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


def create_presentation_template():
    """Create the presentation template with all required slides."""
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    # Define color scheme
    brand_primary = RGBColor(41, 128, 185)  # Blue
    brand_secondary = RGBColor(52, 73, 94)  # Dark Blue
    accent_color = RGBColor(231, 76, 60)  # Red
    text_dark = RGBColor(44, 62, 80)  # Dark Gray
    text_light = RGBColor(236, 240, 241)  # Light Gray

    # Slide 1: Title Slide
    slide1 = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout

    # Add background color
    background = slide1.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = brand_primary

    # Add title
    title_box = slide1.shapes.add_textbox(Inches(1), Inches(2.5), Inches(8), Inches(1.5))
    title_frame = title_box.text_frame
    title_frame.text = "แผนการตลาดดิจิทัล\nDigital Marketing Plan"
    title_para = title_frame.paragraphs[0]
    title_para.font.size = Pt(44)
    title_para.font.bold = True
    title_para.font.color.rgb = text_light
    title_para.alignment = PP_ALIGN.CENTER

    # Add subtitle
    subtitle_box = slide1.shapes.add_textbox(Inches(1), Inches(4.5), Inches(8), Inches(1))
    subtitle_frame = subtitle_box.text_frame
    subtitle_frame.text = "[ชื่อโครงการ / Project Name]"
    subtitle_para = subtitle_frame.paragraphs[0]
    subtitle_para.font.size = Pt(28)
    subtitle_para.font.color.rgb = text_light
    subtitle_para.alignment = PP_ALIGN.CENTER

    # Add presenter info
    info_box = slide1.shapes.add_textbox(Inches(1), Inches(6), Inches(8), Inches(0.8))
    info_frame = info_box.text_frame
    info_frame.text = "นำเสนอโดย: [ชื่อทีม/บริษัท] | วันที่: [DD/MM/YYYY]"
    info_para = info_frame.paragraphs[0]
    info_para.font.size = Pt(18)
    info_para.font.color.rgb = text_light
    info_para.alignment = PP_ALIGN.CENTER

    # Slide 2: Overview / Executive Summary
    slide2 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide2, "1. Overview / ภาพรวมโครงการ", brand_primary, text_light)

    content_box = slide2.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "📋 Campaign Overview", 24, text_dark, True)
    add_bullet_point(tf, "• Objective: [เป้าหมายหลักของแคมเปญ]", 18, text_dark, False)
    add_bullet_point(tf, "• Duration: [ระยะเวลา]", 18, text_dark, False)
    add_bullet_point(tf, "• Total Budget: ฿XXX,XXX/เดือน", 18, text_dark, False)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "🏠 โครงการ / Project Details", 24, text_dark, True)
    add_bullet_point(tf, "• ชื่อโครงการ: [Project Name]", 18, text_dark, False)
    add_bullet_point(tf, "• ประเภท: [Condo/Villa/House]", 18, text_dark, False)
    add_bullet_point(tf, "• ราคา: ฿X.X - ฿XX ล้าน", 18, text_dark, False)
    add_bullet_point(tf, "• ทำเล: [Location, Pattaya]", 18, text_dark, False)

    # Slide 3: Target Audience
    slide3 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide3, "2. Target Audience / กลุ่มเป้าหมาย", brand_primary, text_light)

    content_box = slide3.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "🎯 Primary Audience / กลุ่มเป้าหมายหลัก", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "Persona 1: [ชื่อ Persona]", 20, brand_secondary, True)
    add_bullet_point(tf, "• Age: XX-XX years", 18, text_dark, False)
    add_bullet_point(tf, "• Income: ฿XXX,XXX+/month", 18, text_dark, False)
    add_bullet_point(tf, "• Occupation: [อาชีพ]", 18, text_dark, False)
    add_bullet_point(tf, "• Motivation: [แรงจูงใจ]", 18, text_dark, False)
    add_bullet_point(tf, "• Pain Points: [ปัญหาที่ต้องแก้]", 18, text_dark, False)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "📊 Behavioral Insights / พฤติกรรม", 20, brand_secondary, True)
    add_bullet_point(tf, "• [Insight 1]", 18, text_dark, False)
    add_bullet_point(tf, "• [Insight 2]", 18, text_dark, False)
    add_bullet_point(tf, "• [Insight 3]", 18, text_dark, False)

    # Slide 4: Message & Creative Direction
    slide4 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(
        slide4, "3. Message & Creative Direction / แนวคิดและสื่อสาร", brand_primary, text_light
    )

    content_box = slide4.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "💬 Main Message / ข้อความหลัก", 24, text_dark, True)
    add_bullet_point(tf, '• Thai: "[สโลแกนภาษาไทย]"', 18, text_dark, False)
    add_bullet_point(tf, '• English: "[English Slogan]"', 18, text_dark, False)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "🎨 Creative Direction / ทิศทางครีเอทีฟ", 24, text_dark, True)
    add_bullet_point(
        tf, "• Visual Style: [e.g., Luxury & Premium, Modern & Clean]", 18, text_dark, False
    )
    add_bullet_point(
        tf, "• Tone of Voice: [e.g., Professional, Aspirational]", 18, text_dark, False
    )
    add_bullet_point(tf, "• Key Visual Elements: [สี, ฟอนต์, สไตล์ภาพ]", 18, text_dark, False)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(
        tf, "🎯 Key Messages by Audience / ข้อความตามกลุ่มเป้าหมาย", 20, brand_secondary, True
    )
    add_bullet_point(tf, "• Audience 1: [Message]", 18, text_dark, False)
    add_bullet_point(tf, "• Audience 2: [Message]", 18, text_dark, False)

    # Slide 5: Channels Strategy
    slide5 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide5, "4. Channels / ช่องทาง", brand_primary, text_light)

    content_box = slide5.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "📢 Channel Mix / ช่องทางโฆษณา", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "1. Google Ads (35% งบ)", 20, brand_secondary, True)
    add_bullet_point(tf, "• Search: Branded + Generic keywords", 18, text_dark, False)
    add_bullet_point(tf, "• Display: Retargeting website visitors", 18, text_dark, False)
    add_bullet_point(tf, "• Target: [X] leads, CPL < ฿XXX", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "2. Facebook / Instagram (35% งบ)", 20, brand_secondary, True)
    add_bullet_point(tf, "• Lead Generation: Instant Forms", 18, text_dark, False)
    add_bullet_point(tf, "• Traffic: Drive to landing page", 18, text_dark, False)
    add_bullet_point(tf, "• Audience: Lookalike + Interests + Retargeting", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "3. LINE Ads (15% งบ)", 20, brand_secondary, True)
    add_bullet_point(tf, "• Talk Head View + Display Ads", 18, text_dark, False)
    add_bullet_point(tf, "• Focus: Retargeting warm audiences", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "4. TikTok (15% งบ)", 20, brand_secondary, True)
    add_bullet_point(tf, "• In-Feed Ads: Property tours & lifestyle", 18, text_dark, False)
    add_bullet_point(tf, "• Objective: Brand awareness & engagement", 18, text_dark, False)

    # Slide 6: Budget
    slide6 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide6, "5. Budget / งบประมาณ", brand_primary, text_light)

    content_box = slide6.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "💰 Monthly Budget Allocation / การจัดสรรงบรายเดือน", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "Advertising Spend:", 20, brand_secondary, True)
    add_bullet_point(tf, "• Google Ads: ฿XX,XXX (35%)", 18, text_dark, False)
    add_bullet_point(tf, "• Facebook/Instagram: ฿XX,XXX (35%)", 18, text_dark, False)
    add_bullet_point(tf, "• LINE Ads: ฿X,XXX (15%)", 18, text_dark, False)
    add_bullet_point(tf, "• TikTok: ฿X,XXX (15%)", 18, text_dark, False)
    add_bullet_point(tf, "• Advertising Subtotal: ฿XX,XXX", 18, accent_color, True)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "Other Costs:", 20, brand_secondary, True)
    add_bullet_point(tf, "• Content Production: ฿X,XXX", 18, text_dark, False)
    add_bullet_point(tf, "• Tools & Software: ฿X,XXX", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "📊 Grand Total: ฿XX,XXX/month", 22, accent_color, True)

    # Slide 7: KPIs
    slide7 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide7, "6. KPIs / ตัวชี้วัดความสำเร็จ", brand_primary, text_light)

    content_box = slide7.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "📊 Primary KPIs / ตัวชี้วัดหลัก", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "• Leads per Month: [X]+ qualified leads", 18, text_dark, False)
    add_bullet_point(tf, "• Cost Per Lead (CPL): < ฿XXX", 18, text_dark, False)
    add_bullet_point(tf, "• Lead Quality Score: [X]/10 average", 18, text_dark, False)
    add_bullet_point(tf, "• Lead-to-Appointment Rate: > XX%", 18, text_dark, False)
    add_bullet_point(tf, "• Return on Ad Spend (ROAS): > X:1", 18, text_dark, False)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "📈 Secondary KPIs / ตัวชี้วัดรอง", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "• Click-Through Rate (CTR): > 1.5%", 18, text_dark, False)
    add_bullet_point(tf, "• Landing Page Conversion Rate: > 5%", 18, text_dark, False)
    add_bullet_point(tf, "• Cost Per Click (CPC): < ฿20", 18, text_dark, False)
    add_bullet_point(tf, "• Impression Share: > 60%", 18, text_dark, False)

    # Slide 8: Tracking & Reporting
    slide8 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide8, "7. Tracking / การติดตามผล", brand_primary, text_light)

    content_box = slide8.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "📊 Tracking Setup / ระบบติดตามผล", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "Tools & Platforms:", 20, brand_secondary, True)
    add_bullet_point(
        tf, "• Google Analytics 4: Website traffic & conversions", 18, text_dark, False
    )
    add_bullet_point(tf, "• Google Tag Manager: Event tracking", 18, text_dark, False)
    add_bullet_point(tf, "• Meta Pixel: Facebook/Instagram tracking", 18, text_dark, False)
    add_bullet_point(tf, "• Call tracking: Phone lead attribution", 18, text_dark, False)
    add_bullet_point(tf, "• CRM Integration: Lead management", 18, text_dark, False)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "📅 Reporting Schedule / กำหนดการรายงาน", 20, brand_secondary, True)
    add_bullet_point(tf, "• Weekly: Quick performance dashboard", 18, text_dark, False)
    add_bullet_point(
        tf, "• Monthly: Full report with insights & recommendations", 18, text_dark, False
    )
    add_bullet_point(tf, "• Quarterly: Strategic review & planning", 18, text_dark, False)

    # Slide 9: Timeline
    slide9 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide9, "8. Timeline / กำหนดการ", brand_primary, text_light)

    content_box = slide9.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "📅 Campaign Timeline / แผนงาน", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "Month 1: Setup & Launch", 20, brand_secondary, True)
    add_bullet_point(tf, "• Week 1-2: Campaign setup, creative production", 18, text_dark, False)
    add_bullet_point(tf, "• Week 3: Soft launch & testing", 18, text_dark, False)
    add_bullet_point(tf, "• Week 4: Full launch", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "Month 2: Testing & Optimization", 20, brand_secondary, True)
    add_bullet_point(tf, "• A/B testing audiences & creatives", 18, text_dark, False)
    add_bullet_point(tf, "• Strategy adjustment based on data", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "Month 3: Scaling", 20, brand_secondary, True)
    add_bullet_point(tf, "• Scale winning campaigns", 18, text_dark, False)
    add_bullet_point(tf, "• Expand to additional audiences", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "Month 4+: Mature & Optimize", 20, brand_secondary, True)
    add_bullet_point(tf, "• Continue optimization & creative refresh", 18, text_dark, False)
    add_bullet_point(tf, "• Consistent ROI & predictable results", 18, text_dark, False)

    # Slide 10: Next Steps / Q&A
    slide10 = prs.slides.add_slide(prs.slide_layouts[6])
    add_slide_header(slide10, "Next Steps / ขั้นตอนถัดไป", brand_primary, text_light)

    content_box = slide10.shapes.add_textbox(Inches(1), Inches(1.5), Inches(8), Inches(4.5))
    tf = content_box.text_frame
    tf.word_wrap = True

    add_bullet_point(tf, "✅ Immediate Actions / ดำเนินการทันที", 24, text_dark, True)
    add_bullet_point(tf, "", 12, text_dark, False)

    add_bullet_point(tf, "1. Approve Strategy & Budget", 20, brand_secondary, True)
    add_bullet_point(tf, "   • Confirm budget allocation", 18, text_dark, False)
    add_bullet_point(tf, "   • Sign off on creative direction", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "2. Kickoff Meeting", 20, brand_secondary, True)
    add_bullet_point(tf, "   • Date: [Proposed date]", 18, text_dark, False)
    add_bullet_point(tf, "   • Finalize details & assign responsibilities", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "3. Campaign Setup (Week 1-2)", 20, brand_secondary, True)
    add_bullet_point(tf, "   • Landing page development", 18, text_dark, False)
    add_bullet_point(tf, "   • Ad account setup & creative production", 18, text_dark, False)
    add_bullet_point(tf, "", 10, text_dark, False)

    add_bullet_point(tf, "4. Launch (Week 3)", 20, brand_secondary, True)
    add_bullet_point(tf, "   • Soft launch → Monitor → Full launch", 18, text_dark, False)

    # Add contact info at bottom
    contact_box = slide10.shapes.add_textbox(Inches(1), Inches(6.2), Inches(8), Inches(0.8))
    contact_tf = contact_box.text_frame
    contact_tf.text = "📞 Contact: [Your Name] | Email: [email] | LINE: [@lineid]"
    contact_para = contact_tf.paragraphs[0]
    contact_para.font.size = Pt(14)
    contact_para.font.color.rgb = text_dark
    contact_para.alignment = PP_ALIGN.CENTER

    return prs


def add_slide_header(slide, text, bg_color, text_color):
    """Add a header bar to a slide."""
    # Add header background (Rectangle shape)
    header_bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(10), Inches(1)
    )
    header_bg.fill.solid()
    header_bg.fill.fore_color.rgb = bg_color
    header_bg.line.color.rgb = bg_color

    # Add header text
    header_text = slide.shapes.add_textbox(Inches(0.5), Inches(0.25), Inches(9), Inches(0.5))
    tf = header_text.text_frame
    tf.text = text
    p = tf.paragraphs[0]
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = text_color


def add_bullet_point(text_frame, text, font_size, color, bold=False):
    """Add a bullet point to a text frame.

    Args:
        text_frame: The text frame to add the paragraph to
        text: The text content of the bullet point
        font_size: Font size in points
        color: RGB color for the text
        bold: Whether to make the text bold

    Returns:
        The created paragraph object
    """
    p = text_frame.add_paragraph()
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.level = 0  # Base indentation level (no indent)
    return p


def main():
    """Main function to generate the presentation."""
    print("🎨 Generating AMP Presentation Template...")

    # Create presentation
    prs = create_presentation_template()

    # Save presentation
    output_file = "AMP_Presentation_Template.pptx"
    prs.save(output_file)

    print(f"✅ Presentation template created: {output_file}")
    print(f"📊 Total slides: {len(prs.slides)}")
    print("\n📋 Slides included:")
    print("   1. Title Slide")
    print("   2. Overview / Executive Summary")
    print("   3. Target Audience")
    print("   4. Message & Creative Direction")
    print("   5. Channels Strategy")
    print("   6. Budget")
    print("   7. KPIs")
    print("   8. Tracking & Reporting")
    print("   9. Timeline")
    print("  10. Next Steps / Q&A")
    print("\n💡 Tip: Open with PowerPoint, Google Slides, or LibreOffice Impress")


if __name__ == "__main__":
    main()

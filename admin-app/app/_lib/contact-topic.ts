export type ContactTopicPreset = {
  description?: string;
  draftMessage?: string;
  purpose?: string;
  inquiryTag?: string;
};

export function getContactTopicPreset(locale: 'en' | 'th', topic: string | null | undefined): ContactTopicPreset {
  const normalizedTopic = String(topic || '').trim().toLowerCase();

  if (normalizedTopic === 'private_tour') {
    return {
      description:
        locale === 'th'
          ? 'ใช้ฟอร์มนี้เพื่อนัด private tour พร้อมแจ้งทำเล งบประมาณ และช่วงเวลาที่สะดวก เพื่อให้ทีมจัด viewing step ที่เหมาะที่สุดต่อได้ทันที'
          : 'Use this form to request a private tour with your preferred areas, budget, and timing so the team can line up the most relevant viewing step.',
      draftMessage:
        locale === 'th'
          ? 'ต้องการนัด private tour และอยากให้ทีมช่วยคัดตัวเลือกที่ควรเข้าไปดูเป็นลำดับถัดไป'
          : 'I want to book a private tour and would like the team to narrow down the most relevant properties to view next.',
      purpose: 'buy',
      inquiryTag: 'topic:private_tour',
    };
  }

  if (normalizedTopic === 'investment_plan') {
    return {
      description:
        locale === 'th'
          ? 'ใช้ฟอร์มนี้เพื่อคุยแผนการลงทุน โดยแจ้งงบประมาณ ผลตอบแทนที่คาดหวัง และทำเลที่สนใจ เพื่อให้ทีมจัด shortlist ตาม thesis การลงทุนของคุณ'
          : 'Use this form to request an investment-plan conversation with your budget, target return, and preferred areas so the team can shape the shortlist around your thesis.',
      draftMessage:
        locale === 'th'
          ? 'ต้องการคุยแผนการลงทุนและให้ทีมช่วยจัด shortlist ที่สอดคล้องกับเป้าหมายผลตอบแทนและความเสี่ยงที่รับได้'
          : 'I want to discuss an investment plan and have the team shape a shortlist around my return goals and risk tolerance.',
      purpose: 'invest',
      inquiryTag: 'topic:investment_plan',
    };
  }

  return {};
}
// AMP Demo Website - Property Lifestyle Quiz
// Quiz logic and recommendation engine

const QUIZ_QUESTIONS = [
  {
    id: 'purpose',
    th: 'วัตถุประสงค์หลักของคุณคืออะไร?',
    en: 'What is your main purpose?',
    options: [
      { value: 'live', th: 'อยู่อาศัย', en: 'Living' },
      { value: 'invest', th: 'ลงทุนให้เช่า', en: 'Investment/Rental' },
      { value: 'vacation', th: 'บ้านพักตากอากาศ', en: 'Vacation Home' },
      { value: 'retire', th: 'เกษียณ', en: 'Retirement' }
    ]
  },
  {
    id: 'budget',
    th: 'งบประมาณของคุณเท่าไหร่?',
    en: 'What is your budget?',
    options: [
      { value: 'under2', th: 'ต่ำกว่า 2 ล้านบาท', en: 'Under 2M THB' },
      { value: '2to5', th: '2-5 ล้านบาท', en: '2-5M THB' },
      { value: '5to10', th: '5-10 ล้านบาท', en: '5-10M THB' },
      { value: 'over10', th: 'มากกว่า 10 ล้านบาท', en: 'Over 10M THB' }
    ]
  },
  {
    id: 'propertyType',
    th: 'คุณชอบอสังหาประเภทไหน?',
    en: 'What property type do you prefer?',
    options: [
      { value: 'condo', th: 'คอนโด (บำรุงรักษาง่าย)', en: 'Condo (Low maintenance)' },
      { value: 'villa', th: 'วิลล่า/บ้าน (มีพื้นที่ส่วนตัว)', en: 'Villa/House (Private space)' },
      { value: 'both', th: 'ทั้งคู่ (ยืดหยุ่น)', en: 'Both (Flexible)' }
    ]
  },
  {
    id: 'lifestyle',
    th: 'ความชอบด้านไลฟ์สไตล์?',
    en: 'Lifestyle preference?',
    options: [
      { value: 'beach', th: 'ติดชายหาด', en: 'Beachfront' },
      { value: 'city', th: 'ใจกลางเมือง', en: 'City Center' },
      { value: 'quiet', th: 'เงียบสงบ', en: 'Quiet Area' },
      { value: 'family', th: 'เหมาะครอบครัว', en: 'Family-friendly' }
    ]
  },
  {
    id: 'timeline',
    th: 'ต้องการซื้อเมื่อไหร่?',
    en: 'When do you want to buy?',
    options: [
      { value: 'immediately', th: 'พร้อมอยู่ทันที', en: 'Move in immediately' },
      { value: '3months', th: '1-3 เดือน', en: '1-3 months' },
      { value: '6months', th: '3-6 เดือน', en: '3-6 months' },
      { value: '1year', th: 'มากกว่า 1 ปี', en: 'More than 1 year' }
    ]
  }
];

let currentStep = 0;
let quizAnswers = {};

function startQuiz() {
  currentStep = 0;
  quizAnswers = {};
  showQuestion(0);
}

function showQuestion(step) {
  const lang = document.documentElement.lang || 'th';
  const question = QUIZ_QUESTIONS[step];
  
  // Update progress
  updateProgress(step);
  
  // Get container
  const container = document.getElementById('quiz-question-container');
  if (!container) return;
  
  // Render question
  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">
        ${QUIZ_QUESTIONS.map((_, i) => `
          <div class="quiz-progress-step ${i <= step ? 'active' : ''}"></div>
        `).join('')}
      </div>
      
      <h2 class="quiz-question">${question[lang]}</h2>
      
      <div class="quiz-options">
        ${question.options.map(option => `
          <button class="quiz-option ${quizAnswers[question.id] === option.value ? 'selected' : ''}" 
                  onclick="selectOption('${question.id}', '${option.value}')">
            <div class="quiz-option-title">${option[lang]}</div>
          </button>
        `).join('')}
      </div>
      
      <div class="quiz-buttons">
        <button class="btn btn-secondary" 
                onclick="previousQuestion()" 
                ${step === 0 ? 'disabled' : ''}>
          ${lang === 'th' ? 'ย้อนกลับ' : 'Previous'}
        </button>
        <button class="btn btn-primary" 
                onclick="nextQuestion()" 
                ${!quizAnswers[question.id] ? 'disabled' : ''}>
          ${step === QUIZ_QUESTIONS.length - 1 
            ? (lang === 'th' ? 'ดูผลลัพธ์' : 'See Results')
            : (lang === 'th' ? 'ถัดไป' : 'Next')}
        </button>
      </div>
    </div>
  `;
  
  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function selectOption(questionId, value) {
  quizAnswers[questionId] = value;
  
  // Update button states
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.classList.remove('selected');
  });
  event.target.closest('.quiz-option').classList.add('selected');
  
  // Enable next button
  const nextBtn = document.querySelector('.quiz-buttons .btn-primary');
  if (nextBtn) {
    nextBtn.disabled = false;
  }
}

function previousQuestion() {
  if (currentStep > 0) {
    currentStep--;
    showQuestion(currentStep);
  }
}

function nextQuestion() {
  if (currentStep < QUIZ_QUESTIONS.length - 1) {
    currentStep++;
    showQuestion(currentStep);
  } else {
    showResults();
  }
}

function updateProgress(step) {
  const progressSteps = document.querySelectorAll('.quiz-progress-step');
  progressSteps.forEach((el, i) => {
    if (i <= step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

function showResults() {
  const lang = document.documentElement.lang || 'th';
  const recommendations = generateRecommendations(quizAnswers);
  
  const container = document.getElementById('quiz-question-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="quiz-results">
      <div class="quiz-results-header">
        <h2 class="quiz-results-title">${lang === 'th' ? 'ผลการค้นหาของคุณ' : 'Your Results'}</h2>
        <p class="quiz-results-subtitle">${lang === 'th' ? 'นี่คือคำแนะนำที่เหมาะสมกับคุณ' : 'Here are our recommendations for you'}</p>
      </div>
      
      <div class="quiz-results-section">
        <h3 class="quiz-results-section-title">${lang === 'th' ? 'พื้นที่แนะนำ' : 'Recommended Areas'}</h3>
        <div class="quiz-recommendations">
          ${recommendations.areas.map(area => `
            <div class="quiz-recommendation-card">
              <h4 class="quiz-recommendation-title">${area.name[lang]}</h4>
              <p class="quiz-recommendation-description">${area.reason[lang]}</p>
              <a href="area-guide/${area.slug}.html" class="btn btn-sm btn-secondary" style="margin-top: 8px;">
                ${lang === 'th' ? 'เรียนรู้เพิ่มเติม' : 'Learn More'}
              </a>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="quiz-results-section">
        <h3 class="quiz-results-section-title">${lang === 'th' ? 'ประเภทอสังหาแนะนำ' : 'Recommended Property Types'}</h3>
        <div class="quiz-recommendations">
          ${recommendations.types.map(type => `
            <div class="quiz-recommendation-card">
              <h4 class="quiz-recommendation-title">${type.name[lang]}</h4>
              <p class="quiz-recommendation-description">${type.reason[lang]}</p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="quiz-results-section">
        <h3 class="quiz-results-section-title">${lang === 'th' ? 'โครงการแนะนำ' : 'Recommended Projects'}</h3>
        <div class="quiz-recommendations">
          ${recommendations.projects.map(project => `
            <div class="quiz-recommendation-card">
              <h4 class="quiz-recommendation-title">${project.name[lang]}</h4>
              <p class="quiz-recommendation-description">
                ${project.location} • ฿${(project.pricing.min / 1000000).toFixed(1)}M - ฿${(project.pricing.max / 1000000).toFixed(1)}M
              </p>
              <a href="projects/detail.html?id=${project.project_id}" class="btn btn-sm btn-primary" style="margin-top: 8px;">
                ${lang === 'th' ? 'ดูรายละเอียด' : 'View Details'}
              </a>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <button class="btn btn-secondary" onclick="startQuiz()" style="margin-right: 8px;">
          ${lang === 'th' ? 'ทำใหม่อีกครั้ง' : 'Start Over'}
        </button>
        <a href="contact.html" class="btn btn-primary">
          ${lang === 'th' ? 'ติดต่อเราเพื่อคำแนะนำเพิ่มเติม' : 'Contact us for more advice'}
        </a>
      </div>
    </div>
  `;
  
  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function generateRecommendations(answers) {
  // Area recommendations based on answers
  let recommendedAreas = [];
  
  if (answers.lifestyle === 'beach') {
    recommendedAreas.push({
      name: { th: 'วงศ์อมาตย์', en: 'Wong Amat' },
      slug: 'wong-amat',
      reason: { th: 'หาดสวย เงียบสงบ เหมาะสำหรับผู้ชื่นชอบชายหาด', en: 'Beautiful beach, peaceful, perfect for beach lovers' }
    });
  }
  
  if (answers.lifestyle === 'city') {
    recommendedAreas.push({
      name: { th: 'พัทยากลาง', en: 'Central Pattaya' },
      slug: 'pattaya',
      reason: { th: 'ใกล้แหล่งบันเทิง ร้านอาหาร ห้างสรรพสินค้า', en: 'Near entertainment, restaurants, shopping malls' }
    });
  }
  
  if (answers.lifestyle === 'quiet' || answers.purpose === 'retire') {
    recommendedAreas.push({
      name: { th: 'นาจอมเทียน', en: 'Na Jomtien' },
      slug: 'na-jomtien',
      reason: { th: 'เงียบสงบ บรรยากาศธรรมชาติ เหมาะกับผู้สูงอายุ', en: 'Peaceful, natural atmosphere, suitable for retirees' }
    });
  }
  
  if (answers.lifestyle === 'family' || answers.propertyType === 'villa') {
    recommendedAreas.push({
      name: { th: 'เขาไผ่ใหญ่', en: 'Huay Yai' },
      slug: 'huay-yai',
      reason: { th: 'เหมาะสำหรับครอบครัว ราคาย่อมเยา พื้นที่กว้างขวาง', en: 'Family-friendly, affordable, spacious' }
    });
  }
  
  // Default if none matched
  if (recommendedAreas.length === 0) {
    recommendedAreas.push({
      name: { th: 'จอมเทียน', en: 'Jomtien' },
      slug: 'jomtien',
      reason: { th: 'สมดุลระหว่างความสะดวกสบายและความเป็นส่วนตัว', en: 'Balance between convenience and privacy' }
    });
  }
  
  // Limit to top 2 areas
  recommendedAreas = recommendedAreas.slice(0, 2);
  
  // Type recommendations
  let recommendedTypes = [];
  
  if (answers.propertyType === 'condo' || answers.propertyType === 'both') {
    recommendedTypes.push({
      name: { th: 'คอนโด', en: 'Condo' },
      reason: { th: 'บำรุงรักษาง่าย มีสิ่งอำนวยความสะดวก เหมาะกับการลงทุนให้เช่า', en: 'Low maintenance, facilities included, good for rental investment' }
    });
  }
  
  if (answers.propertyType === 'villa' || answers.propertyType === 'both') {
    recommendedTypes.push({
      name: { th: 'วิลล่า/บ้าน', en: 'Villa/House' },
      reason: { th: 'มีพื้นที่ส่วนตัว เหมาะกับครอบครัว มีสวนและที่จอดรถ', en: 'Private space, suitable for families, garden and parking' }
    });
  }
  
  // Project recommendations based on budget and timeline
  let recommendedProjects = [];
  
  if (typeof MOCK_PROJECTS !== 'undefined') {
    recommendedProjects = MOCK_PROJECTS.filter(project => {
      // Budget filter
      if (answers.budget === 'under2' && project.pricing.min >= 2000000) return false;
      if (answers.budget === '2to5' && (project.pricing.min < 2000000 || project.pricing.min >= 5000000)) return false;
      if (answers.budget === '5to10' && (project.pricing.min < 5000000 || project.pricing.min >= 10000000)) return false;
      if (answers.budget === 'over10' && project.pricing.min < 10000000) return false;
      
      // Type filter
      if (answers.propertyType === 'condo' && project.type !== 'condo') return false;
      if (answers.propertyType === 'villa' && project.type !== 'villa') return false;
      
      // Timeline filter
      if (answers.timeline === 'immediately' && project.status !== 'ready-to-move') return false;
      
      return true;
    });
    
    // Limit to top 3 projects
    recommendedProjects = recommendedProjects.slice(0, 3);
  }
  
  return {
    areas: recommendedAreas,
    types: recommendedTypes,
    projects: recommendedProjects
  };
}

// Initialize quiz
function initQuiz() {
  const startBtn = document.getElementById('start-quiz-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startQuiz);
  }
  
  // Auto-start if on quiz page
  if (document.getElementById('quiz-question-container')) {
    startQuiz();
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuiz);
} else {
  initQuiz();
}

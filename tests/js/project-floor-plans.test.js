const fs = require('fs');
const path = require('path');

describe('Project detail floor plans integration', () => {
  const mockProjectsPath = path.join(__dirname, '../../demo-website/assets/js/mock-projects.js');
  const projectDetailJsPath = path.join(__dirname, '../../demo-website/assets/js/project-detail.js');
  const projectDetailHtmlPath = path.join(__dirname, '../../demo-website/projects/detail.html');

  const mockProjectsSource = fs.readFileSync(mockProjectsPath, 'utf8');
  const projectDetailJsSource = fs.readFileSync(projectDetailJsPath, 'utf8');
  const projectDetailHtmlSource = fs.readFileSync(projectDetailHtmlPath, 'utf8');

  test('adds floor_plans array to mapped project mock data', () => {
    expect(mockProjectsSource).toContain('floor_plans: (UNIT_TYPES_BY_PROPERTY[project.type] || []).slice(0, 3).map');
  });

  test('renders floor plans section in project detail page', () => {
    expect(projectDetailHtmlSource).toContain('id="floor-plans-section"');
    expect(projectDetailHtmlSource).toContain('id="floor-plans-grid"');
  });

  test('supports floor plan lightbox rendering in project detail script', () => {
    expect(projectDetailJsSource).toContain('renderFloorPlans(project.floor_plans || [])');
    expect(projectDetailJsSource).toContain('openFloorPlanLightbox');
    expect(projectDetailJsSource).toContain("id = 'floor-plan-lightbox'");
  });
});

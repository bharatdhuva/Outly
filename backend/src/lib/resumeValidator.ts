/**
 * Utility to validate if a given text content resembles a professional resume/CV.
 * Scans for common section headers, contact information patterns, and checks against obvious non-resume documents.
 */
export function validateResumeText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length < 150) {
    return {
      isValid: false,
      error: "The uploaded document is too short to be a valid resume."
    };
  }

  const lowerText = text.toLowerCase();

  // 1. Resume sections detection (broad matches for common structural headings)
  const hasExperience = /experience|work\s+history|employment|professional\s+experience|professional\s+history|job\s+history/i.test(lowerText);
  const hasEducation = /education|academic|university|college|degree|qualification/i.test(lowerText);
  const hasSkills = /skills|technical\s+skills|expertise|technologies|core\s+competencies|competencies|programming\s+languages/i.test(lowerText);
  const hasProjects = /projects|personal\s+projects|academic\s+projects|key\s+projects/i.test(lowerText);
  const hasSummary = /summary|professional\s+summary|objective|career\s+objective|profile|about\s+me/i.test(lowerText);
  const hasCertifications = /certifications|certificates|awards|interests/i.test(lowerText);

  // 2. Contact info indicators
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i.test(lowerText);
  // Phone regex matching common formats (e.g. +1234567890, (123) 456-7890, 123-456-7890)
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(lowerText);
  const hasLinks = /linkedin\.com|github\.com/i.test(lowerText);
  
  const hasContactInfo = hasEmail || hasPhone || hasLinks || /email|phone|contact/i.test(lowerText);

  // 3. Count matching major sections
  let sectionMatchCount = 0;
  if (hasExperience) sectionMatchCount++;
  if (hasEducation) sectionMatchCount++;
  if (hasSkills) sectionMatchCount++;
  if (hasProjects) sectionMatchCount++;
  if (hasSummary) sectionMatchCount++;
  if (hasCertifications) sectionMatchCount++;

  // 4. Non-resume markers (obvious anti-patterns like invoices, tax returns, recipes, or simple code files)
  const isInvoiceOrReceipt = /invoice|bill\s+to|amount\s+due|payment\s+due|total\s+due|receipt|subtotal|tax\s+invoice|transaction\s+id/i.test(lowerText) && sectionMatchCount < 2;
  const isTaxForm = /form\s+\d{4}|tax\s+return|internal\s+revenue|irs|w-2|form\s+w2|1040/i.test(lowerText) && sectionMatchCount < 2;
  const isRecipe = /ingredients|instructions|cook\s+time|prep\s+time|servings|recipe/i.test(lowerText) && !hasExperience && !hasEducation;
  const isGenericCode = /import\s+.*\s+from|const\s+.*=|function\s+.*\(|class\s+.*\s*\{/i.test(lowerText) && !hasExperience && !hasEducation && !hasSkills;

  // A valid resume must have at least 2 distinct sections, contact information, and must not match non-resume patterns.
  const meetsSectionRequirement = sectionMatchCount >= 2;
  
  if (!meetsSectionRequirement || !hasContactInfo || isInvoiceOrReceipt || isTaxForm || isRecipe || isGenericCode) {
    return {
      isValid: false,
      error: "The uploaded file does not appear to be a resume/CV. Please upload a valid resume containing standard sections (e.g., Experience, Education, Skills, or Projects) and contact information."
    };
  }

  return { isValid: true };
}

/**
 * Utility to validate if a given text content resembles a job description.
 * Scans for common job requirements, responsibilities, company descriptions, and checks against obvious non-JD documents.
 */
export function validateJobDescriptionText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length < 80) {
    return {
      isValid: false,
      error: "The job description is too short to be valid."
    };
  }

  const lowerText = text.toLowerCase();

  // Job description structural keywords
  const hasRequirements = /requirements|qualifications|skills|experience|must\s+have|nice\s+to\s+have|who\s+you\s+are|what\s+you\s+need|competencies|profile/i.test(lowerText);
  const hasResponsibilities = /responsibilities|duties|what\s+you\s+will\s+do|role|about\s+the\s+role|tasks|job\s+description|position|responsabilities/i.test(lowerText);
  const hasCompany = /about\s+us|our\s+team|company|culture|benefits|perks|we\s+are\s+looking\s+for|we\s+are\s+hiring/i.test(lowerText);

  // Common phrases used in JDs
  const hasPhrases = /years\s+of\s+experience|ability\s+to|degree\s+in|knowledge\s+of|background\s+in|proven\s+track\s+record|responsibilities\s+include/i.test(lowerText);

  let matchCount = 0;
  if (hasRequirements) matchCount++;
  if (hasResponsibilities) matchCount++;
  if (hasCompany) matchCount++;
  if (hasPhrases) matchCount++;

  // Obvious anti-patterns like invoices, tax returns, recipes, or simple code files
  const isInvoiceOrReceipt = /invoice|bill\s+to|amount\s+due|payment\s+due|total\s+due|receipt|subtotal|tax\s+invoice|transaction\s+id/i.test(lowerText) && matchCount < 2;
  const isTaxForm = /form\s+\d{4}|tax\s+return|internal\s+revenue|irs|w-2|form\s+w2|1040/i.test(lowerText) && matchCount < 2;
  const isRecipe = /ingredients|instructions|cook\s+time|prep\s+time|servings|recipe/i.test(lowerText) && !hasRequirements && !hasResponsibilities;
  const isGenericCode = /import\s+.*\s+from|const\s+.*=|function\s+.*\(|class\s+.*\s*\{/i.test(lowerText) && !hasRequirements && !hasResponsibilities;

  // A job description should match at least 1-2 criteria and not trigger anti-patterns
  const isPossiblyJD = matchCount >= 1;

  if (!isPossiblyJD || isInvoiceOrReceipt || isTaxForm || isRecipe || isGenericCode) {
    return {
      isValid: false,
      error: "The provided text does not appear to be a valid job description. Please make sure to paste/upload a valid job description containing responsibilities, requirements, or role details."
    };
  }

  return { isValid: true };
}

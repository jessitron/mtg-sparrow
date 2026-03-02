type AssessmentOption = {
  label: string;
  value: string;
};

export const SELF_ASSESSMENT_MIN_CARDS = 3;

const ASSESSMENT_OPTIONS: AssessmentOption[] = [
  { label: 'Still learning', value: 'still_learning' },
  { label: 'Getting there', value: 'getting_there' },
  { label: 'Nailing it', value: 'nailing_it' },
];

/**
 * Build the self-assessment UI section.
 * Returns the section element; append it to your container.
 * When the user picks an option, onAssessment is called with the value.
 */
export function buildSelfAssessment(onAssessment: (value: string) => void): HTMLElement {
  const assessmentSection = document.createElement('div');
  assessmentSection.classList.add('self-assessment');

  const prompt = document.createElement('div');
  prompt.classList.add('self-assessment-prompt');
  prompt.textContent = 'How did that feel?';
  assessmentSection.appendChild(prompt);

  const buttonRow = document.createElement('div');
  buttonRow.classList.add('self-assessment-buttons');

  for (const option of ASSESSMENT_OPTIONS) {
    const btn = document.createElement('button');
    btn.classList.add('self-assessment-button');
    btn.textContent = option.label;
    btn.addEventListener('click', () => {
      onAssessment(option.value);
    });
    buttonRow.appendChild(btn);
  }

  assessmentSection.appendChild(buttonRow);
  return assessmentSection;
}

import { startSpan, endSpan, flushSpans, getSessionId } from '../telemetry/telemetry';

/**
 * Wire the feedback button in the settings menu.
 * Opens a modal where users can submit feedback as a telemetry span.
 */
export function wireFeedback(): void {
  const feedbackBtn = document.getElementById('settings-feedback-btn');
  if (!feedbackBtn) return;

  let recentlySubmitted = false;

  feedbackBtn.addEventListener('click', () => {
    if (recentlySubmitted) return;

    // Close the settings menu
    const panel = document.getElementById('settings-panel');
    const backdrop = document.getElementById('settings-backdrop');
    if (panel) panel.hidden = true;
    if (backdrop) backdrop.hidden = true;

    openFeedbackModal();
  });

  function openFeedbackModal(): void {
    // Create backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'feedback-backdrop';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Send feedback');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <button class="feedback-close-btn" aria-label="Close">&times;</button>
      <h2 class="feedback-title">Send Feedback</h2>
      <p class="feedback-hint">What's on your mind? Bug reports, ideas, or just say hi.</p>
      <textarea class="feedback-textarea" maxlength="500" placeholder="Your feedback..." rows="5"></textarea>
      <div class="feedback-char-count">0 / 500</div>
      <input class="feedback-email" type="email" placeholder="Email (optional, so we can follow up)" />
      <button class="feedback-submit-btn" disabled>Send</button>
      <div class="feedback-thanks" hidden>Thanks for your feedback!</div>
    `;

    document.body.appendChild(modalBackdrop);
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector<HTMLButtonElement>('.feedback-close-btn')!;
    const textarea = modal.querySelector<HTMLTextAreaElement>('.feedback-textarea')!;
    const charCount = modal.querySelector<HTMLDivElement>('.feedback-char-count')!;
    const emailInput = modal.querySelector<HTMLInputElement>('.feedback-email')!;
    const submitBtn = modal.querySelector<HTMLButtonElement>('.feedback-submit-btn')!;
    const thanksMsg = modal.querySelector<HTMLDivElement>('.feedback-thanks')!;
    const hintEl = modal.querySelector<HTMLParagraphElement>('.feedback-hint')!;

    function closeModal(): void {
      document.removeEventListener('keydown', onKeyDown);
      modal.remove();
      modalBackdrop.remove();
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') closeModal();
    }

    // Update character counter and submit button state on input
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = `${len} / 500`;
      submitBtn.disabled = textarea.value.trim().length === 0;
    });

    closeBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', onKeyDown);

    submitBtn.addEventListener('click', async () => {
      const message = textarea.value.trim();
      const email = emailInput.value.trim();

      submitBtn.disabled = true;

      const span = startSpan('feedback.submit', {
        'feedback.message': message,
        'feedback.email': email,
        'feedback.page': window.location.pathname,
        'feedback.session_id': getSessionId(),
        'feedback.message_length': message.length,
      });
      endSpan(span);
      await flushSpans();

      // Hide form elements, show thanks
      textarea.hidden = true;
      emailInput.hidden = true;
      submitBtn.hidden = true;
      charCount.hidden = true;
      hintEl.hidden = true;
      thanksMsg.hidden = false;

      recentlySubmitted = true;
      setTimeout(() => { recentlySubmitted = false; }, 3000);

      setTimeout(() => {
        closeModal();
      }, 2000);
    });

    // Focus textarea after modal is in DOM
    textarea.focus();
  }
}

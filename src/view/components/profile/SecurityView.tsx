/** @jsx h */
import { h } from 'preact';

export function SecurityView() {
  return (
    <div className="security-view">
      <div className="security-actions">
        <button type="button" className="security-button">
          Change password
        </button>
        <button type="button" className="security-button">
          Activate 2 step verification
        </button>
      </div>

      <section className="security-support">
        <h3 className="security-section-title">Contact support</h3>
        <form className="security-form">
          <textarea
            className="security-textarea"
            placeholder="Describe the issue"
            rows={6}
          />
          <button type="submit" className="security-submit">
            Send request
          </button>
        </form>
      </section>
    </div>
  );
}

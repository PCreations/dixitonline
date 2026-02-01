/** @jsx h */
import { h } from 'preact';
import { ComingSoonPlaceholder } from './ComingSoonPlaceholder.js';

export interface SecurityViewProps {
  readonly comingSoon?: boolean | undefined;
}

export function SecurityView({ comingSoon }: SecurityViewProps) {
  if (comingSoon) {
    return (
      <ComingSoonPlaceholder
        title="Security Settings"
        description="Password management, two-factor authentication and support contact are coming soon!"
      />
    );
  }

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

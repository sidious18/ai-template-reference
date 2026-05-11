/**
 * Conventional Commits + KAN-{NUMBER} ticket prefix.
 *
 * Accepts:
 *   feat: KAN-123 add login
 *   chore: release 1.2.3   <- release-please bot
 *
 * Rejects anything else.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
    'footer-max-line-length': [2, 'always', 200],
    'subject-case': [0],
    'subject-full-stop': [0],
    'jira-ticket-id': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'jira-ticket-id': ({ header, subject }) => {
          if (/^chore: release \d+\.\d+\.\d+/.test(header)) {
            return [true];
          }
          const hasKey = /\bKAN-\d+\b/.test(subject || header);
          return [
            hasKey,
            'Commit subject must include a Jira ticket id (e.g. "feat: KAN-123 add login"). Allowed without a ticket: release-please bot commits matching "chore: release X.Y.Z".',
          ];
        },
      },
    },
  ],
};

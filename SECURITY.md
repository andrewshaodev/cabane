# Security

Report a suspected vulnerability privately through
[GitHub private vulnerability reporting](https://github.com/cabane-app/cabane/security/advisories/new).
Do not disclose an unfixed vulnerability in a public issue or pull request.
If private reporting is unavailable, wait for the maintainer to provide a private
channel rather than posting sensitive details publicly.

Include the affected version or public source commit, a minimal reproduction,
observed impact and relevant browser/hosting configuration. Use synthetic data.
Never submit access tokens, OAuth callbacks, real entity IDs, private home exports,
camera media or browser-storage dumps.

Security maintenance is best effort and focuses on the current main branch and
latest distributed version. Older versions may require upgrading. We do not
promise a response time or a fix deadline.

Cabane's browser tests use synthetic Home Assistant fixtures. Passing those tests
does not certify a household network, TLS deployment or live device configuration;
see [transport acceptance](./docs/transport-acceptance.md).

export default function PrivacyPage() {
  return (
    <main className="site-shell">
      <p className="eyebrow">Privacy</p>
      <h1>Privacy notice for the greeting demonstration</h1>
      <p>
        The demonstration processes the supplied name only to generate a
        greeting. The application does not persist names, tool arguments, or
        tool results. Its structured logs contain request metadata and outcome,
        never request bodies or personal data.
      </p>
      <p>
        The deployment and ChatGPT may process technical information necessary
        to deliver the service. Replace this notice with the actual data map,
        retention periods, subprocessors, contact details, and jurisdiction
        before submitting a real product.
      </p>
    </main>
  );
}

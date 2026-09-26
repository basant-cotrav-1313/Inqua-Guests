import { useEffect, useState } from 'react'
import './App.css'

// The ONE thing this app does: build https://<base>/stay#urn=<urn> and
// navigate there.
//
// Which domain: set VITE_PARTICIPANT_BASE_URL (in Netlify's env var UI, or a
// local .env.local) to override. Defaults to the demo domain so a plain
// build/deploy never accidentally targets production.
//   demo (default): https://demoinqua.cotrav.co.in
//   production:      https://inqua.cotrav.co.in
const PARTICIPANT_BASE_URL =
  // import.meta.env.VITE_PARTICIPANT_BASE_URL || 'https://demoinqua.cotrav.co.in'
  import.meta.env.VITE_PARTICIPANT_BASE_URL || 'http://localhost:3000'

const SAMPLE_URNS = [
  { urn: 'UF410Z', status: 'confirmed' },
  { urn: 'IELVG9', status: 'confirmed' },
  { urn: 'CEKUOP', status: 'confirmed' },
  { urn: '6504DF', status: 'cancelled' },
  { urn: 'RIP6PC', status: 'live URN' },
]

function participantUrl(urn) {
  return `${PARTICIPANT_BASE_URL}/stay#urn=${encodeURIComponent(urn)}`
}

function App() {
  const [urn, setUrn] = useState('')

  // Opened as .../?urn=UF410Z -> redirect immediately, no click needed.
  // Lets this page double as a plain link dropped into an email.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('urn')
    if (fromQuery?.trim()) window.location.href = participantUrl(fromQuery.trim())
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = urn.trim()
    if (trimmed) window.location.href = participantUrl(trimmed)
  }

  return (
    <div className="wrap">
      <h1>Book your stay</h1>
      <p className="sub">
        Redirects straight to INQUA&rsquo;s Participant Lookup page. No server,
        no database &mdash; this page just builds one URL and navigates there.
      </p>

      <div className="card">
        <form className="lookup" onSubmit={handleSubmit}>
          <input
            value={urn}
            onChange={(e) => setUrn(e.target.value)}
            placeholder="e.g. UF410Z"
            autoComplete="off"
            spellCheck="false"
            required
          />
          <button className="btn" type="submit">Book your stay</button>
        </form>
        <p className="muted">
          Or open this page with <code>?urn=UF410Z</code> in the address bar
          and it redirects immediately &mdash; drop that link straight into an
          email.
        </p>
      </div>

      <h2>Sample URNs</h2>
      <div className="card flush">
        <table>
          <thead>
            <tr><th>urn</th><th>status</th><th></th></tr>
          </thead>
          <tbody>
            {SAMPLE_URNS.map((r) => (
              <tr key={r.urn}>
                <td><code>{r.urn}</code></td>
                <td>{r.status}</td>
                <td><a className="btn" href={participantUrl(r.urn)}>Book your stay</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        These are plain <code>&lt;a href&gt;</code> links &mdash; no
        JavaScript needed for them to work.
      </p>
    </div>
  )
}

export default App

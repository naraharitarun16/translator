const highlights = [
  'Handled 100+ concurrent users with WebSocket messaging and JWT authentication.',
  'Integrated Meta NLLB-200 through Hugging Face for AI translation across 15+ languages.',
  'Built REST microservices, parallel translation with ExecutorService, and user-specific message queues.',
  'Designed a responsive React interface with group chat and typing indicators.',
]

const technologies = ['JAVA', 'REACT', 'WEBSOCKET', 'JWT', 'REST APIS', 'HUGGING FACE']

export default function Page() {
  return (
    <main className="case-study-shell">
      <article className="case-study" aria-labelledby="project-title">
        <header className="case-study-header">
          <span>01</span>
          <span>CASE STUDY</span>
        </header>

        <div className="case-study-content">
          <section className="project-intro">
            <h1 id="project-title"><span>Polyglot Chat</span></h1>
            <p>
              <span>A real-time, multilingual chat</span>{' '}
              <span>platform designed to make</span>{' '}
              <span>conversation feel native across</span>{' '}
              <span>language barriers.</span>
            </p>
          </section>

          <section className="project-highlights" aria-label="Project highlights">
            {highlights.map((highlight) => (
              <p className="highlight" key={highlight}>
                <span className="dash" aria-hidden="true">—</span>
                <span className="highlight-copy">{highlight}</span>
              </p>
            ))}
          </section>
        </div>

        <footer className="technology-list" aria-label="Technologies used">
          {technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </footer>
      </article>
    </main>
  )
}

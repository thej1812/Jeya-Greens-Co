
import Menu from "../components/Menu"
import Footer from "../components/Footer"

const A = "/assets"

export default function AboutUs() {
  return (
    <div id="top" className="site-shell">
      {/* ---------- MENU ---------- */}
      <Menu />

      <main>
        {/* ---------- STORY ---------- */}
        <section id="story" className="story" style={{ marginTop: "52px" }}>
          <h2 className="story-title">
            The Story Behind
            <br />
            Jeya Greens & Co.
          </h2>

          <div className="story-copy">
           <p>
              At <strong>Jeya Greens &amp; Co</strong>, Our journey began with a simple yet powerful mission: to
bring the purest, most authentic gifts of nature directly from the farm to your family&#39;s
table. Inspired by traditional agricultural heritage, we set out to craft coconut and
food essentials that honor natural goodness without compromise.
            </p>
            <p>
              It all began with a simple commitment to purity extracting cold-pressed Virgin
Coconut Oil the way nature intended, without compromises or chemical shortcuts.
But as our roots took hold, so did a bigger vision: to bring that same unadulterated
goodness to every corner of your kitchen.
            </p>
            <p>
              We believe that good health starts with honest food. That is why our products remain
free from artificial additives, preserving the essential antioxidants, healthy medium-
chain fats, and natural flavors that nature intended. At JEYA GREENS &amp; CO, we
aren&#39;t just making food; we are creating a healthier, higher-quality lifestyle for
generations to come.
            </p>
          </div>

          <div className="founder" data-reveal>
            <p className="founder-label">Founder</p>

            <img
              src={`${A}/founder.jpeg`}
              alt="Founder of Jeya Greens as a young man"
            />

            <p className="founder-name">
              Ashwin
              <br />
              sivagurunathan
            </p>
          </div>
        </section>

        {/* ---------- MISSION ---------- */}
        <section id="mission" className="mission">
          <h2 className="mission-title">Our Mission</h2>

          <p className="mission-copy">
           From cold-pressed coconut oil to delicious traditional sweets and healthy essentials, we are committed to maintaining quality at every step while preserving traditional flavours and timeless values.
          </p>
        </section>

        {/* ---------- VISION ---------- */}
        <section id="vision" className="vision">
          <h2 className="vision-title">Our Vision</h2>

          <p className="vision-copy">
            We aspire to preserve traditional flavours, support quality agricultural practices, and create a diverse range of products that make natural goodness and traditional living a part of everyday life.</p>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <Footer />
    </div>
  )
}

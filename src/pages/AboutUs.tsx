
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
              Jeya Greens & Co. began with a simple yet powerful belief:
              bringing the natural goodness of coconuts directly from
              trusted farms to every family's home. Inspired by traditional
              agricultural heritage, we started our journey with a commitment
              to purity, quality, and authentic flavours.
            </p>

            <p>
              What began with producing pure, cold-pressed Virgin Coconut Oil
              gradually grew into a diverse range of coconut-based products,
              including traditional sweets, healthy beverages, and everyday
              essentials. Every product reflects our dedication to preserving
              nature's goodness and celebrating timeless traditions.
            </p>

            <p>
              At Jeya Greens & Co., we believe that good food begins with
              honest ingredients. Our journey is driven by quality,
              authenticity, and the passion to bring natural coconut goodness
              closer to every home.
            </p>
          </div>

          <div className="founder" data-reveal>
            <p className="founder-label">Founder</p>

            <img
              src={`${A}/72a88.png`}
              alt="Founder of Jeya Greens as a young man"
            />

            <p className="founder-name">
              Ashwin
              <br />
              Sivakurnanthan
            </p>
          </div>
        </section>

        {/* ---------- MISSION ---------- */}
        <section id="mission" className="mission">
          <h2 className="mission-title">Our Mission</h2>

          <p className="mission-copy">
            Our mission is to deliver pure, high-quality coconut products
            that bring natural goodness to everyday life. From cold-pressed
            coconut oil to delicious traditional sweets and healthy
            essentials, we are committed to maintaining quality at every
            step while preserving authentic flavours and traditional values.
          </p>
        </section>

        {/* ---------- VISION ---------- */}
        <section id="vision" className="vision">
          <h2 className="vision-title">Our Vision</h2>

          <p className="vision-copy">
            Our vision is to become a trusted name in natural coconut-based
            products by bringing the goodness of coconuts to every home.
            We aspire to preserve traditional flavours, support quality
            agricultural practices, and create a diverse range of products
            that make natural and authentic living a part of everyday life.
          </p>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <Footer />
    </div>
  )
}

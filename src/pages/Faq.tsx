
import { useState } from "react"
import Menu from "../components/Menu"


// FAQ DATA
const faqs = [
  [
    "Do you only take bulk orders, or can I place a small individual order?",
    "Yes. Contact us with your quantity and timeline. Yes, definitely! Whether it’s a single gift pack or a large bulk order, we’d love to help. As a growing business, we deeply value every single customer no order is too small for us. Just share the quantity and date you need it by, and we’ll take care of the rest with personal attention!",
  ],
  [
    "Are your products made in small batches?",
    "Yes. Small-batch production helps us protect freshness, texture and the traditional character of every recipe.",
  ],
  [
    "Do you use artificial flavours?",
    "No. Our focus is on simple ingredients, familiar flavours and thoughtful preparation.",
  ],
  [
    "How should coconut products be stored?",
    "Keep them sealed in a cool, dry place. Product-specific guidance is included with every order.",
  ],
  [
    "Can I place a bulk or gifting order?",
    "Yes. Contact us with your event, quantity and timeline and our team will help create the right selection.",
  ],
]

export default function FAQ() {
  // FAQ ACCORDION
  const [openFaq, setOpenFaq] = useState<number>(0)

  return (
    <div className="faq-page">

      {/* MENU */}
      <Menu />

      <main>

        {/* FAQ SECTION */}
        <section
          className="faq section-pad"
          id="faq"
          style={{ marginTop: "52px" }}
        >

          <h2>FAQ</h2>

          <div className="faq-list">

            {faqs.map(([question, answer], index) => (

              <article
                className={`faq-item ${
                  openFaq === index ? "is-open" : ""
                }`}
                key={question}
              >

                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? -1 : index)
                  }
                  aria-expanded={openFaq === index}
                >

                  <span>{question}</span>

                  <span className="faq-plus">
                    {openFaq === index ? "−" : "+"}
                  </span>

                </button>

                <div className="faq-answer">
                  <p>{answer}</p>
                </div>

              </article>

            ))}

          </div>

        </section>

      </main>

      {/* FOOTER */}
      

    </div>
  )
}

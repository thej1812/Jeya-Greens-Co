const A = "/assets"

export default function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`brand-logo ${light ? "brand-logo--light" : ""}`}
      href="/"
      aria-label="Jeya Greens home"
    >
      <img src={`${A}/logo.png`} alt="Jeya Greens & Co." />
    </a>
  )
}
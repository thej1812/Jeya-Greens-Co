const A = "/assets"

export default function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`brand-logo ${light ? "brand-logo--light" : ""}`}
      href="/"
      aria-label="Jeya Greens home"
    >
      <img src={`${A}/43927.png`} alt="Jeya Greens & Co." />
    </a>
  )
}
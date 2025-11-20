import "./SectionHeading.css";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      {title && <h2>{title}</h2>}
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

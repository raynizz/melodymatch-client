import { Link } from "react-router-dom";
import "./Button.css";

const baseClass = "ui-button";

const variantClassMap = {
  primary: "ui-button--primary",
  ghost: "ui-button--ghost",
  subtle: "ui-button--subtle",
};

const sizeClassMap = {
  md: "ui-button--md",
  lg: "ui-button--lg",
};

export default function Button({
  to,
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = [
    baseClass,
    variantClassMap[variant],
    sizeClassMap[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

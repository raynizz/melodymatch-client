import Header from "../header/Header";
import Footer from "../footer/Footer";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

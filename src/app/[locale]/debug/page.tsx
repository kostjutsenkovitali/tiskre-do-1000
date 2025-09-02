import { useI18n } from "@/contexts/I18nProvider";

export default function DebugTranslations() {
  const { t, locale } = useI18n();
  
  // Test the specific keys that are used in TestimoniesAbout
  const topText = t("Home.testimonies.topText");
  const bottomText = t("Home.testimonies.bottomText");
  
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Translation Debug</h1>
      <p><strong>Current Locale:</strong> {locale}</p>
      <p><strong>Top Text Key:</strong> Home.testimonies.topText</p>
      <p><strong>Top Text Value:</strong> "{topText}"</p>
      <p><strong>Bottom Text Key:</strong> Home.testimonies.bottomText</p>
      <p><strong>Bottom Text Value:</strong> "{bottomText}"</p>
      
      <h2>Expected Values by Locale:</h2>
      <ul>
        <li><strong>en:</strong> "Customer" / "Testimonials"</li>
        <li><strong>et:</strong> "Klient" / "Iseloomustused"</li>
        <li><strong>de:</strong> "Kunde" / "Referenzen"</li>
        <li><strong>fi:</strong> "Asiakas" / "Suositukset"</li>
        <li><strong>sv:</strong> "Kund" / "Vitsord"</li>
        <li><strong>fr:</strong> "Client" / "Témoignages"</li>
      </ul>
    </div>
  );
}
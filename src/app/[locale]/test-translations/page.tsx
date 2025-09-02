import { useI18n } from "@/contexts/I18nProvider";

export default function TranslationTest() {
  const { t, locale } = useI18n();
  
  const topText = t("Home.testimonies.topText");
  const bottomText = t("Home.testimonies.bottomText");
  
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Translation Test</h1>
      <p><strong>Locale:</strong> {locale}</p>
      <p><strong>Top Text Key:</strong> Home.testimonies.topText</p>
      <p><strong>Top Text Value:</strong> {topText}</p>
      <p><strong>Bottom Text Key:</strong> Home.testimonies.bottomText</p>
      <p><strong>Bottom Text Value:</strong> {bottomText}</p>
    </div>
  );
}
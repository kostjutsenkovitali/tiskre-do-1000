// This page needs to be statically generated
export const dynamic = 'force-static';

// Generate static params for all locales
export async function generateStaticParams() {
  // Import locales directly to avoid using headers
  const locales = ["en", "et", "de", "fi", "sv", "fr"];
  
  return locales.map((locale) => ({
    locale,
  }));
}

export default function DebugTranslations() {
  // Since we can't use useI18n hook in a server component, we'll create a simple client component
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Translation Debug</h1>
      <p>This page requires client-side JavaScript to display translations.</p>
      <div id="debug-content"></div>
      <script dangerouslySetInnerHTML={{
        __html: `
          // This would normally be handled by your I18nProvider
          const locales = ["en", "et", "de", "fi", "sv", "fr"];
          const currentLocale = window.location.pathname.split('/')[1] || 'en';
          
          // Simple translation function (in a real app, this would come from your provider)
          function t(key) {
            const translations = {
              en: {
                "Home.testimonies.topText": "Customer",
                "Home.testimonies.bottomText": "Testimonials"
              },
              et: {
                "Home.testimonies.topText": "Klient",
                "Home.testimonies.bottomText": "Iseloomustused"
              },
              de: {
                "Home.testimonies.topText": "Kunde",
                "Home.testimonies.bottomText": "Referenzen"
              },
              fi: {
                "Home.testimonies.topText": "Asiakas",
                "Home.testimonies.bottomText": "Suositukset"
              },
              sv: {
                "Home.testimonies.topText": "Kund",
                "Home.testimonies.bottomText": "Vitsord"
              },
              fr: {
                "Home.testimonies.topText": "Client",
                "Home.testimonies.bottomText": "Témoignages"
              }
            };
            
            return translations[currentLocale]?.[key] || key;
          }
          
          // Display the translations
          const topText = t("Home.testimonies.topText");
          const bottomText = t("Home.testimonies.bottomText");
          
          document.getElementById('debug-content').innerHTML = \`
            <p><strong>Current Locale:</strong> \${currentLocale}</p>
            <p><strong>Top Text Key:</strong> Home.testimonies.topText</p>
            <p><strong>Top Text Value:</strong> "\${topText}"</p>
            <p><strong>Bottom Text Key:</strong> Home.testimonies.bottomText</p>
            <p><strong>Bottom Text Value:</strong> "\${bottomText}"</p>
            
            <h2>Expected Values by Locale:</h2>
            <ul>
              <li><strong>en:</strong> "Customer" / "Testimonials"</li>
              <li><strong>et:</strong> "Klient" / "Iseloomustused"</li>
              <li><strong>de:</strong> "Kunde" / "Referenzen"</li>
              <li><strong>fi:</strong> "Asiakas" / "Suositukset"</li>
              <li><strong>sv:</strong> "Kund" / "Vitsord"</li>
              <li><strong>fr:</strong> "Client" / "Témoignages"</li>
            </ul>
          \`;
        `
      }} />
    </div>
  );
}
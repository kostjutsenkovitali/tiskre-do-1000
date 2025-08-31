"use client";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";

export default function Contact() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">{t("Contact.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("Contact.intro")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="font-medium">{t("Contact.sendMessageTitle")}</h2></div>
            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm">{t("Contact.firstName")}</label>
                    <input id="firstName" placeholder={t("Contact.firstNamePlaceholder")}
                      className="w-full h-10 px-3 border rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm">{t("Contact.lastName")}</label>
                    <input id="lastName" placeholder={t("Contact.lastNamePlaceholder")} className="w-full h-10 px-3 border rounded-md" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm">{t("Contact.email")}</label>
                  <input id="email" type="email" placeholder={t("Contact.emailPlaceholder")} className="w-full h-10 px-3 border rounded-md" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm">{t("Contact.subject")}</label>
                  <input id="subject" placeholder={t("Contact.subjectPlaceholder")} className="w-full h-10 px-3 border rounded-md" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm">{t("Contact.message")}</label>
                  <textarea id="message" placeholder={t("Contact.messagePlaceholder")} rows={6} className="w-full px-3 py-2 border rounded-md" />
                </div>

                <Button className="w-full">{t("Contact.sendMessage")}</Button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">{t("Contact.infoTitle")}</h2></div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 mt-1" />
                  <div>
                    <h3 className="font-medium text-foreground">{t("Contact.email")}</h3>
                    <p className="text-muted-foreground">info@tiskre-do.eu</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 mt-1" />
                  <div>
                    <h3 className="font-medium text-foreground">{t("Contact.phone")}</h3>
                    <p className="text-muted-foreground">+3759027489</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 mt-1" />
                  <div>
                    <h3 className="font-medium text-foreground">{t("Contact.address")}</h3>
                    <p className="text-muted-foreground">
                      10416 Estonia, Tallinn, str. Karjamaa 9
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">{t("Contact.businessHours")}</h2></div>
              <div className="p-6 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("Contact.weekdays")}</span><span className="font-medium">9:00 AM - 6:00 PM</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("Contact.saturday")}</span><span className="font-medium">10:00 AM - 4:00 PM</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("Contact.sunday")}</span><span className="font-medium">{t("Contact.closed")}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



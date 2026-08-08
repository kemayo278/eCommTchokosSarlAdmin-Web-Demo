import { MessageCircle, Send } from "lucide-react";
import { PageHeader, Card, Button } from "@/components/ui/primitives";

const conversations = [
  { nom: "Serge Etoa", canal: "WhatsApp", apercu: "Bonjour, ma commande #77120 est où ?", heure: "08:42", nonLu: true },
  { nom: "Nadège Owona", canal: "E-mail", apercu: "Je souhaite un remboursement pour…", heure: "07:15", nonLu: true },
  { nom: "Marie Essomba", canal: "WhatsApp", apercu: "Merci beaucoup pour la livraison !", heure: "Hier", nonLu: false },
  { nom: "Yann Mballa", canal: "Téléphone", apercu: "Rappel concernant le paiement OM", heure: "Hier", nonLu: false },
];

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader titre="Messages" sousTitre="Conversations avec les clients" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="divide-y divide-slate-50 lg:col-span-1">
          {conversations.map((c) => (
            <button key={c.nom} className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                {c.nom.split(" ").map((m) => m[0]).join("").slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-semibold text-secondary">{c.nom}</p>
                  <span className="text-xs text-slate-400">{c.heure}</span>
                </div>
                <p className="truncate text-xs text-slate-500">{c.apercu}</p>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {c.canal}
                </span>
              </div>
              {c.nonLu && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">SE</span>
            <div>
              <p className="font-bold text-secondary">Serge Etoa</p>
              <p className="text-xs text-slate-400">WhatsApp · en ligne</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 p-4">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-secondary">
              Bonjour, ma commande #77120 est où ?
            </div>
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white">
              Bonjour Serge ! Votre colis est en cours d&apos;acheminement, livraison prévue avant 10h30.
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              placeholder="Écrire un message…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <Button className="!px-3">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Plus, Video } from "lucide-react";
import { PageHeader, Card, Button } from "@/components/ui/primitives";
import { videos } from "@/lib/data";

const categoriesVideo = ["Sacs", "Sacs à main", "Sacs à dos", "Draps", "Parures de lit", "Couvertures"];

export default function CategoriesVideosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titre="Catégories de vidéos"
        sousTitre="Organisez le contenu vidéo du site"
        action={
          <Button>
            <Plus className="h-4 w-4" /> Nouvelle catégorie
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesVideo.map((c) => {
          const nb = videos.filter((v) => v.categorie === c).length;
          return (
            <Card key={c} className="flex items-center gap-3 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <Video className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-secondary">{c}</p>
                <p className="text-sm text-slate-500">{nb} vidéo(s)</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

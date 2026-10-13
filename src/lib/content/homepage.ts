export type HeroItem = Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  image: string;
  image_alt: string;
  image_credit: string;
  cta_label: string;
  cta_url: string;
}>;

// Literal hero.items from content/homepage.php at the pinned Laravel revision.
export const heroItems = [
    {
        "id": "icelli2026",
        "eyebrow": "Scientific Meeting",
        "title": "International Colloquim on Equatorial and Low-Latitude Ionosphere / ICELLI2026",
        "summary": "Join us for the International Colloquium on Equatorial and Low-Latitude Ionosphere (ICELLI2026) to explore the latest research and developments in this exciting field.",
        "image": "/media/home/hero-1.png",
        "image_alt": "Visualization illustrating the Fountain Effect of ions in the near-Earth electric and magnetic fields.",
        "image_credit": "Visualization illustrating the Fountain Effect of ions in the near-Earth electric and magnetic fields. Credit: NASA's Scientific Visualization Studio",
        "cta_label": "Read",
        "cta_url": "/events/icelli2026"
    },
    {
        "id": "nosee-annual-general-meetings",
        "eyebrow": "Conference",
        "title": "Annual General Meeting of the Network of Space-Earth Environmentalists (NOSEE)",
        "summary": "Join us for the Annual general meeting of the Network of Space-Earth Environmentalists (NOSEE) to explore the latest research and developments in this exciting field.",
        "image": "/media/home/hero-2.jpg",
        "image_alt": "A photo of clouds, taken from above.",
        "image_credit": "A photo of clouds, taken from above. Credit:Photo by Sanni Sahi on Unsplash",
        "cta_label": "Read",
        "cta_url": "/events/nosee-annual-general-meeting"
    }
] as const satisfies readonly HeroItem[];

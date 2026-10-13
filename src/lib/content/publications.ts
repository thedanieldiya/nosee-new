export type PublicationRecord = Readonly<{
  slug: string; title: string; type: string; authors: readonly string[];
  publication_date: string; publication_source: string; research_area: string; doi: string; featured: boolean;
}>;

// Literal pinned development fixtures; not approved organisational facts.
export const publicationRecords = [
  {
    "slug": "equatorial-plasma-bubble-detection",
    "title": "Detecting Equatorial Plasma Bubbles with Ground-Based GNSS Networks",
    "type": "journal-article",
    "authors": [
      "Daniel Okeke",
      "Rukayat Balogun"
    ],
    "publication_date": "2025-02-21",
    "publication_source": "Development Journal of Ionospheric Studies",
    "research_area": "space-weather",
    "doi": "10.5555/nosee.dev.2025.010",
    "featured": false
  },
  {
    "slug": "geospatial-data-cube-for-coastal-change",
    "title": "A Geospatial Data Cube Workflow for Tracking Coastal Change",
    "type": "conference-paper",
    "authors": [
      "Kemi Afolayan",
      "Sani Ibrahim"
    ],
    "publication_date": "2026-02-14",
    "publication_source": "Development Earth Informatics Conference",
    "research_area": "earth-and-space-informatics",
    "doi": "10.5555/nosee.dev.2026.004",
    "featured": false
  },
  {
    "slug": "harmattan-particulate-transport",
    "title": "Regional Transport of Harmattan Particulates in Surface Observations",
    "type": "journal-article",
    "authors": [
      "Zainab Garba",
      "Ola Williams"
    ],
    "publication_date": "2025-11-12",
    "publication_source": "Development Air Quality Research Letters",
    "research_area": "atmosphere-and-air-quality",
    "doi": "10.5555/nosee.dev.2025.006",
    "featured": false
  },
  {
    "slug": "hybrid-renewable-grid-planning",
    "title": "Earth-Observation Inputs for Hybrid Renewable Grid Planning",
    "type": "report",
    "authors": [
      "Samuel Edet",
      "Halima Adamu"
    ],
    "publication_date": "2025-05-03",
    "publication_source": "Development Sustainable Energy Briefs",
    "research_area": "energy-resources-and-environment",
    "doi": "10.5555/nosee.dev.2025.009",
    "featured": false
  },
  {
    "slug": "low-latitude-geomagnetic-storm-responses",
    "title": "Low-Latitude Ionospheric Responses to Geomagnetic Storm Events",
    "type": "journal-article",
    "authors": [
      "Amina Bello",
      "Tunde Adeyemi",
      "Chika Nwosu"
    ],
    "publication_date": "2026-06-18",
    "publication_source": "Development Journal of Space Environment",
    "research_area": "space-weather",
    "doi": "10.5555/nosee.dev.2026.001",
    "featured": true
  },
  {
    "slug": "open-workflows-for-earth-observation",
    "title": "Open Reproducible Workflows for Regional Earth-Observation Analysis",
    "type": "conference-paper",
    "authors": [
      "Mariam Hassan",
      "Femi Ojo",
      "Lilian Kalu"
    ],
    "publication_date": "2025-07-18",
    "publication_source": "Development Geospatial Computing Proceedings",
    "research_area": "earth-and-space-informatics",
    "doi": "10.5555/nosee.dev.2025.008",
    "featured": false
  },
  {
    "slug": "regional-heatwave-indicators",
    "title": "Regional Heatwave Indicators from Blended Climate Reanalysis",
    "type": "book-chapter",
    "authors": [
      "Adaeze Obi",
      "Yusuf Danjuma"
    ],
    "publication_date": "2025-09-26",
    "publication_source": "Development Advances in Regional Climate",
    "research_area": "climate-science",
    "doi": "10.5555/nosee.dev.2025.007",
    "featured": false
  },
  {
    "slug": "satellite-soil-moisture-drought-signals",
    "title": "Satellite Soil-Moisture Signals for Regional Drought Monitoring",
    "type": "journal-article",
    "authors": [
      "Ifeoma Eze",
      "Bola Lawal",
      "David Mensah"
    ],
    "publication_date": "2026-03-22",
    "publication_source": "Development Climate Systems Review",
    "research_area": "climate-science",
    "doi": "10.5555/nosee.dev.2026.003",
    "featured": true
  },
  {
    "slug": "solar-resource-variability-west-africa",
    "title": "Characterising Seasonal Solar-Resource Variability across West Africa",
    "type": "report",
    "authors": [
      "Ngozi Umeh",
      "Kabiru Salisu"
    ],
    "publication_date": "2026-01-30",
    "publication_source": "Development Energy Systems Report Series",
    "research_area": "energy-resources-and-environment",
    "doi": "10.5555/nosee.dev.2026.005",
    "featured": false
  },
  {
    "slug": "urban-aerosol-optical-depth-patterns",
    "title": "Urban Aerosol Optical Depth Patterns from Multi-Sensor Observations",
    "type": "journal-article",
    "authors": [
      "Fatima Musa",
      "Emeka Okorie"
    ],
    "publication_date": "2026-05-09",
    "publication_source": "Development Journal of Atmospheric Observation",
    "research_area": "atmosphere-and-air-quality",
    "doi": "10.5555/nosee.dev.2026.002",
    "featured": true
  }
] as const satisfies readonly PublicationRecord[];

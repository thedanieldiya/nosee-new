export type NewsRecord = Readonly<{
  slug: string; title: string; excerpt: string; category: string; published_at: string;
  image: string; image_alt: string; featured: boolean; editorial_timezone?: string;
}>;

// Literal pinned development fixtures; not approved organisational facts.
export const newsRecords = [
  {
    "slug": "air-quality-smoke-transport-study",
    "title": "Study Prototype Tracks Long-Range Smoke Transport",
    "excerpt": "Researchers test a draft workflow that combines satellite imagery and surface observations for regional air-quality analysis.",
    "category": "research-news",
    "published_at": "2026-07-22T11:15:00+00:00",
    "image": "/media/trending/trending3.png",
    "image_alt": "Dark smoke plume rising into a pale sky",
    "featured": false
  },
  {
    "slug": "community-space-weather-workshop-report",
    "title": "Community Workshop Tests Space Weather Activities",
    "excerpt": "Facilitators trial hands-on learning activities designed to explain solar events and their effects on technology.",
    "category": "outreach-report",
    "published_at": "2026-06-18T13:10:00+00:00",
    "image": "/media/trending/trending1.png",
    "image_alt": "Bright solar flare extending from the surface of the Sun",
    "featured": false
  },
  {
    "slug": "early-career-researcher-recognition",
    "title": "Early-Career Researcher Recognised for Solar Analysis",
    "excerpt": "A fictional development profile highlights reproducible methods for interpreting solar activity observations.",
    "category": "member-achievement",
    "published_at": "2026-07-07T16:00:00+00:00",
    "image": "/media/trending/trending1.png",
    "image_alt": "Bright solar flare extending from the surface of the Sun",
    "featured": false
  },
  {
    "slug": "new-ionospheric-forecast-method",
    "title": "Prototype Forecast Method Targets Ionospheric Changes",
    "excerpt": "A technical development record explores combining ground and orbital measurements for short-range ionospheric forecasts.",
    "category": "scientific-development",
    "published_at": "2026-06-05T09:35:00+00:00",
    "image": "/media/trending/trending2.png",
    "image_alt": "Astronaut working outside a space station above Earth",
    "featured": false
  },
  {
    "slug": "open-call-environmental-data-pilots",
    "title": "Draft Open Call Supports Environmental Data Pilots",
    "excerpt": "A development funding notice describes small pilot projects focused on practical access to environmental observations.",
    "category": "funding-opportunity",
    "published_at": "2026-06-30T10:20:00+00:00",
    "image": "/media/trending/trending3.png",
    "image_alt": "Dark smoke plume rising into a pale sky",
    "featured": false
  },
  {
    "slug": "regional-earth-observation-partnership",
    "title": "Partners Draft Shared Earth Observation Programme",
    "excerpt": "A proposed collaboration would align training, instrument access, and environmental data exchange across participating institutions.",
    "category": "partnership",
    "published_at": "2026-07-14T08:45:00+00:00",
    "image": "/media/trending/trending2.png",
    "image_alt": "Astronaut working outside a space station above Earth",
    "featured": false
  },
  {
    "slug": "research-network-quarterly-update",
    "title": "Research Network Shares Development Quarter Update",
    "excerpt": "The fictional update summarises planned workshops, shared datasets, and coordination priorities for the next quarter.",
    "category": "organisation-news",
    "published_at": "2026-05-20T15:25:00+00:00",
    "image": "/media/trending/trending3.png",
    "image_alt": "Dark smoke plume rising into a pale sky",
    "featured": false
  },
  {
    "slug": "solar-storm-monitoring-exercise",
    "title": "Regional Teams Complete Solar Storm Monitoring Exercise",
    "excerpt": "A development scenario explores how observatories could coordinate rapid updates during elevated solar activity.",
    "category": "organisation-news",
    "published_at": "2026-08-01T09:00:00+00:00",
    "image": "/media/trending/trending1.png",
    "image_alt": "Bright solar flare extending from the surface of the Sun",
    "featured": true
  },
  {
    "slug": "space-station-instrument-calibration",
    "title": "Space Station Instrument Calibration Enters Review",
    "excerpt": "Development notes outline a review workflow for comparing orbital instrument readings with ground observations.",
    "category": "scientific-development",
    "published_at": "2026-07-28T14:30:00+00:00",
    "image": "/media/trending/trending2.png",
    "image_alt": "Astronaut working outside a space station above Earth",
    "featured": false
  }
] as const satisfies readonly NewsRecord[];

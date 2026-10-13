export type EventRecord = Readonly<{
  slug: string; title: string; type: string; summary: string; featured: boolean;
  image: string | null; image_alt: string | null; timezone: string; start_date: string; end_date: string | null;
  schedule: Readonly<{
    mode: string; start_time: string | null; end_time: string | null;
    itinerary: readonly Readonly<{date: string; start_time: string; end_time: string; title: string; description: string | null}>[];
  }>;
  location: Readonly<{type: string; venue: string | null; address: string | null; city: string | null; country: string | null; platform: string | null}>;
  application_deadline: string | null; meeting_site_url: string | null; organiser: string; speakers: readonly string[];
  registration_url: string | null; body: string; resources: readonly Readonly<{label: string; url: string}>[];
}>;

// Literal pinned development fixtures; not approved organisational facts.
export const eventRecords = [
  {
    "slug": "atmospheric-measurement-seminar",
    "title": "Advances in Atmospheric Measurement Lecture",
    "type": "lecture",
    "summary": "A development lecture on instrument calibration, field observations, and reliable atmospheric data workflows.",
    "featured": true,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2027-05-14",
    "end_date": null,
    "schedule": {
      "mode": "single_day",
      "start_time": "10:00",
      "end_time": "12:00",
      "itinerary": []
    },
    "location": {
      "type": "physical",
      "venue": "Atmospheric Science Laboratory",
      "address": "Development Campus Road",
      "city": "Ibadan",
      "country": "Nigeria",
      "platform": null
    },
    "application_deadline": null,
    "meeting_site_url": null,
    "organiser": "NOSEE Development Programme Team",
    "speakers": [
      "Development Guest Lecturer"
    ],
    "registration_url": null,
    "body": "This fictional lecture record provides development detail content about calibration checks, observation planning, and quality assurance.",
    "resources": []
  },
  {
    "slug": "community-sky-observation-day",
    "title": "Community Sky Observation Day",
    "type": "outreach",
    "summary": "A development outreach event uses guided observations to introduce families to atmospheric and space science.",
    "featured": false,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2026-09-26",
    "end_date": null,
    "schedule": {
      "mode": "single_day",
      "start_time": "16:00",
      "end_time": "19:00",
      "itinerary": []
    },
    "location": {
      "type": "physical",
      "venue": "Community Science Field",
      "address": null,
      "city": "Enugu",
      "country": "Nigeria",
      "platform": null
    },
    "application_deadline": "2026-09-20T17:00:00+01:00",
    "meeting_site_url": null,
    "organiser": "NOSEE Development Outreach Team",
    "speakers": [],
    "registration_url": "https://example.org/events/community-sky-observation-day",
    "body": "This fictional outreach record describes guided sky observations, simple demonstrations, and development-only family activities.",
    "resources": [
      {
        "label": "Development participant guide",
        "url": "https://example.org/resources/sky-observation-guide"
      }
    ]
  },
  {
    "slug": "earth-observation-data-workshop",
    "title": "Earth Observation Data Methods Workshop",
    "type": "workshop",
    "summary": "A practical development workshop exploring reproducible processing and interpretation of environmental satellite data.",
    "featured": true,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2027-04-21",
    "end_date": "2027-04-22",
    "schedule": {
      "mode": "multi_day",
      "start_time": null,
      "end_time": null,
      "itinerary": [
        {
          "date": "2027-04-21",
          "start_time": "09:00",
          "end_time": "16:00",
          "title": "Data preparation",
          "description": "Development exercises for sourcing, checking, and preparing satellite observations."
        },
        {
          "date": "2027-04-22",
          "start_time": "09:30",
          "end_time": "15:30",
          "title": "Analysis workflows",
          "description": "Development exercises for reproducible analysis and interpretation."
        }
      ]
    },
    "location": {
      "type": "hybrid",
      "venue": "Development Geospatial Laboratory",
      "address": "University Road",
      "city": "Lagos",
      "country": "Nigeria",
      "platform": "Zoom"
    },
    "application_deadline": "2027-04-07T17:00:00+01:00",
    "meeting_site_url": null,
    "organiser": "NOSEE Development Data Team",
    "speakers": [
      "Development Workshop Facilitator"
    ],
    "registration_url": "https://example.org/events/earth-observation-data-workshop",
    "body": "This fictional workshop record provides development detail content for a two-day sequence of practical earth-observation exercises.",
    "resources": [
      {
        "label": "Development workshop requirements",
        "url": "https://example.org/resources/earth-observation-requirements"
      }
    ]
  },
  {
    "slug": "environmental-data-training",
    "title": "Environmental Data Stewardship Training",
    "type": "training",
    "summary": "A development training programme covering metadata, version control, quality checks, and responsible data reuse.",
    "featured": false,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2027-07-19",
    "end_date": "2027-07-23",
    "schedule": {
      "mode": "multi_day",
      "start_time": null,
      "end_time": null,
      "itinerary": [
        {
          "date": "2027-07-19",
          "start_time": "09:00",
          "end_time": "15:00",
          "title": "Data stewardship foundations",
          "description": null
        },
        {
          "date": "2027-07-20",
          "start_time": "09:00",
          "end_time": "15:00",
          "title": "Metadata practice",
          "description": null
        },
        {
          "date": "2027-07-21",
          "start_time": "09:00",
          "end_time": "15:00",
          "title": "Versioned workflows",
          "description": null
        },
        {
          "date": "2027-07-22",
          "start_time": "09:00",
          "end_time": "15:00",
          "title": "Quality checks",
          "description": null
        },
        {
          "date": "2027-07-23",
          "start_time": "09:00",
          "end_time": "13:00",
          "title": "Responsible reuse",
          "description": null
        }
      ]
    },
    "location": {
      "type": "physical",
      "venue": "Development Training Centre",
      "address": null,
      "city": "Port Harcourt",
      "country": "Nigeria",
      "platform": null
    },
    "application_deadline": null,
    "meeting_site_url": null,
    "organiser": "NOSEE Development Training Team",
    "speakers": [],
    "registration_url": null,
    "body": "This fictional five-day training record provides development detail content for practical environmental data stewardship sessions.",
    "resources": []
  },
  {
    "slug": "icelli2026",
    "title": "International Colloquium on Equatorial and Low-Latitude Ionosphere 2026",
    "type": "meeting",
    "summary": "A development meeting record for testing the hand-off from NOSEE event discovery to a dedicated meeting website.",
    "featured": false,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2026-11-18",
    "end_date": "2026-11-20",
    "schedule": {
      "mode": "multi_day",
      "start_time": null,
      "end_time": null,
      "itinerary": []
    },
    "location": {
      "type": "hybrid",
      "venue": "Development Meeting Centre",
      "address": null,
      "city": "Kano",
      "country": "Nigeria",
      "platform": "Zoom"
    },
    "application_deadline": null,
    "meeting_site_url": "https://icelli.nosee.org",
    "organiser": "",
    "speakers": [],
    "registration_url": null,
    "body": "",
    "resources": []
  },
  {
    "slug": "ionospheric-methods-seminar",
    "title": "Ionospheric Observation Methods Lecture",
    "type": "lecture",
    "summary": "A completed development lecture record covering observation planning and interpretation of ionospheric measurements.",
    "featured": false,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2026-06-05",
    "end_date": null,
    "schedule": {
      "mode": "single_day",
      "start_time": "14:00",
      "end_time": null,
      "itinerary": []
    },
    "location": {
      "type": "online",
      "venue": null,
      "address": null,
      "city": null,
      "country": null,
      "platform": "Microsoft Teams"
    },
    "application_deadline": null,
    "meeting_site_url": null,
    "organiser": "NOSEE Development Research Team",
    "speakers": [
      "Development Methods Lecturer"
    ],
    "registration_url": null,
    "body": "This fictional completed lecture record provides development detail content about ionospheric observation planning and interpretation.",
    "resources": []
  },
  {
    "slug": "regional-space-weather-conference",
    "title": "Regional Space Weather Research Conference",
    "type": "conference",
    "summary": "A development programme for sharing observational methods, forecasting studies, and regional research priorities.",
    "featured": true,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2027-03-10",
    "end_date": "2027-03-12",
    "schedule": {
      "mode": "multi_day",
      "start_time": null,
      "end_time": null,
      "itinerary": [
        {
          "date": "2027-03-10",
          "start_time": "09:00",
          "end_time": "17:00",
          "title": "Regional observations",
          "description": "Development presentations on observation networks and shared methods."
        },
        {
          "date": "2027-03-11",
          "start_time": "09:00",
          "end_time": "17:00",
          "title": "Forecasting studies",
          "description": "Development presentations and working sessions on forecasting research."
        },
        {
          "date": "2027-03-12",
          "start_time": "09:00",
          "end_time": "14:00",
          "title": "Research priorities",
          "description": "Development discussion of possible regional research priorities."
        }
      ]
    },
    "location": {
      "type": "physical",
      "venue": "Development Conference Centre",
      "address": "Research District",
      "city": "Abuja",
      "country": "Nigeria",
      "platform": null
    },
    "application_deadline": null,
    "meeting_site_url": null,
    "organiser": "NOSEE Development Conference Team",
    "speakers": [
      "Development Conference Speaker"
    ],
    "registration_url": "https://example.org/events/regional-space-weather-conference",
    "body": "This fictional three-day conference record provides development detail content for presentations, working sessions, and research discussions.",
    "resources": []
  },
  {
    "slug": "satellite-climate-lecture",
    "title": "Public Lecture on Satellite Climate Indicators",
    "type": "lecture",
    "summary": "A fictional lecture introduces how long-term satellite records can support climate monitoring and communication.",
    "featured": false,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2027-06-09",
    "end_date": null,
    "schedule": {
      "mode": "single_day",
      "start_time": "11:00",
      "end_time": "12:30",
      "itinerary": []
    },
    "location": {
      "type": "online",
      "venue": null,
      "address": null,
      "city": null,
      "country": null,
      "platform": "Zoom"
    },
    "application_deadline": null,
    "meeting_site_url": null,
    "organiser": "NOSEE Development Climate Team",
    "speakers": [
      "Development Climate Lecturer"
    ],
    "registration_url": "https://example.org/events/satellite-climate-lecture",
    "body": "This fictional lecture record provides development detail content about long-term satellite climate indicators and public communication.",
    "resources": []
  },
  {
    "slug": "small-grants-application-deadline",
    "title": "Environmental Research Small Grants Application Clinic",
    "type": "workshop",
    "summary": "A fictional online clinic for development testing of event application deadlines and registration information.",
    "featured": false,
    "image": null,
    "image_alt": null,
    "timezone": "Africa/Lagos",
    "start_date": "2026-09-02",
    "end_date": null,
    "schedule": {
      "mode": "single_day",
      "start_time": "15:00",
      "end_time": "16:30",
      "itinerary": []
    },
    "location": {
      "type": "online",
      "venue": null,
      "address": null,
      "city": null,
      "country": null,
      "platform": "Google Meet"
    },
    "application_deadline": "2026-08-30T17:00:00+01:00",
    "meeting_site_url": null,
    "organiser": "NOSEE Development Grants Team",
    "speakers": [],
    "registration_url": "https://example.org/events/small-grants-application-clinic",
    "body": "This fictional application clinic record provides development detail content about eligibility questions and proposal preparation.",
    "resources": [
      {
        "label": "Development application notes",
        "url": "https://example.org/resources/small-grants-notes"
      }
    ]
  }
] as const satisfies readonly EventRecord[];

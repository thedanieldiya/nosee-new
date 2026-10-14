// Literal content/about.php at 9872c4ed; unapproved development fixtures.
export const about = {
  "page_title": "About NOSEE",
  "intro": {
    "eyebrow": "Network of Space–Earth Environmentalists",
    "headline": "A network connecting the science of Earth, atmosphere and space.",
    "description_mobile": "NOSEE brings researchers, students, institutions and communities into a shared space for understanding the connected Earth–space environment.",
    "description_tablet": "NOSEE brings researchers, students, institutions and communities into a shared space for understanding the connected Earth–space environment. The layout stays spacious and editorial rather than card-heavy.",
    "description": "NOSEE brings researchers, students, institutions and communities into a shared space for understanding the connected Earth–space environment. This mockup treats the page like an editorial feature: measured, spacious and scientific rather than card-heavy.",
    "closing_statement_compact": "Research, collaboration, learning and public engagement.",
    "closing_statement": "Built around research, collaboration, learning and public engagement.",
    "image_mobile": "/media/about/earth-space-environment-mobile.png",
    "image_tablet": "/media/about/earth-space-environment-tablet.png",
    "image": "/media/about/earth-space-environment.png",
    "image_alt": "A false-colour visualisation of Earth and its surrounding space environment."
  },
  "mission": {
    "title": "Our Mission",
    "statement_mobile": "To create a stronger bridge between space science, Earth science and environmental understanding — and to make that knowledge useful.",
    "statement_tablet": "To create a stronger bridge between space science, Earth science and environmental understanding — and to make that knowledge useful to researchers, institutions and wider communities.",
    "statement": "To create a stronger bridge between space science, Earth science and environmental understanding and to make that knowledge useful to researchers, institutions and wider communities.",
    "objectives": [
      {
        "number": "01",
        "title": "Connect disciplines",
        "description_mobile": "Create room for researchers across related disciplines to exchange ideas and methods.",
        "description": "Create room for researchers working across atmospheric, environmental, Earth and space science to exchange ideas and methods."
      },
      {
        "number": "02",
        "title": "Advance shared knowledge",
        "description_mobile": "Support meetings, publications, data products and learning that make complex work easier to use.",
        "description": "Support meetings, publications, data products and learning that make complex scientific work easier to discover and use."
      },
      {
        "number": "03",
        "title": "Extend scientific impact",
        "description_mobile": "Translate research into education, collaboration, outreach and practical understanding.",
        "description": "Translate research into education, collaboration, outreach and practical environmental understanding."
      }
    ]
  },
  "quote": {
    "text": "The most useful science is rarely confined to one discipline. It grows where observations, people and perspectives meet.",
    "attribution": "John Doe",
    "image_tablet": "/media/about/solar-observation-tablet.png",
    "image": "/media/about/solar-observation.png",
    "image_alt": "A bright solar observation fading into a warm atmospheric glow."
  },
  "story": {
    "title": "Our Story",
    "lead": "NOSEE’s story can be told through the relationships that formed around common scientific problems: observing the environment, understanding change and creating spaces where knowledge can travel.",
    "body": "This section intentionally remains development copy. Approved dates, milestones and institutional history can replace it here without changing the page template.",
    "image": "/media/about/earth-from-space.png",
    "image_alt": "Earth viewed from space, with clouds crossing blue oceans and green land."
  },
  "leadership": {
    "title": "Leadership",
    "intro": "The profiles below are clearly marked development placeholders. Approved leadership names, roles and portraits can be replaced directly in this content file.",
    "people": [
      {
        "name": "Leadership profile 01",
        "title": "Role to be confirmed",
        "image": "/media/about/earth-from-space.png",
        "image_alt": "Earth viewed from orbit, used as a temporary leadership profile visual."
      },
      {
        "name": "Leadership profile 02",
        "title": "Role to be confirmed",
        "image": "/media/about/earth-space-environment.png",
        "image_alt": "A false-colour Earth–space visualisation used as a temporary leadership profile visual."
      },
      {
        "name": "Leadership profile 03",
        "title": "Role to be confirmed",
        "image": "/media/about/solar-observation.png",
        "image_alt": "A bright solar observation used as a temporary leadership profile visual."
      },
      {
        "name": "Leadership profile 04",
        "title": "Role to be confirmed",
        "image": "/media/about/earth-from-space.png",
        "image_alt": "Cloud systems over Earth, used as a temporary leadership profile visual."
      },
      {
        "name": "Leadership profile 05",
        "title": "Role to be confirmed",
        "image": "/media/about/earth-space-environment.png",
        "image_alt": "A false-colour Earth-space visualisation used as a temporary leadership profile visual."
      },
      {
        "name": "Leadership profile 06",
        "title": "Role to be confirmed",
        "image": "/media/about/solar-observation.png",
        "image_alt": "A bright solar observation used as a temporary leadership profile visual."
      },
      {
        "name": "Leadership profile 07",
        "title": "Role to be confirmed",
        "image": "/media/about/earth-from-space.png",
        "image_alt": "Earth viewed from orbit, used as a temporary leadership profile visual."
      }
    ]
  },
  "collaboration": {
    "eyebrow": "Collaboration",
    "title": "Science moves further when knowledge, institutions and communities work together.",
    "description": "Connect with NOSEE to take part in research exchange, institutional collaboration and public engagement.",
    "actions": [
      {
        "label": "Participate",
        "url": "/participate"
      },
      {
        "label": "Partner with NOSEE",
        "url": "/partnerships"
      },
      {
        "label": "Support NOSEE",
        "url": "/support"
      }
    ]
  }
} as const;

export type AboutContent = typeof about;
export type AboutProfile = AboutContent["leadership"]["people"][number];

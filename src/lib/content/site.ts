type ContentLink = { label: string; url: string };
type SiteContent = {
  name: string;
  tagline: string;
  description: string;
  footer: {
    description: string;
    link_groups: { heading: string; links: ContentLink[] }[];
    contact: { heading: string; address: string; email: string; phone: string };
    social_links: (ContentLink & { icon: "LinkedinFilled" | "FacebookFilled" | "SocialXFilled" | "InstagramFilled" | "YoutubeFilled" })[];
    legal_links: ContentLink[];
    newsletter: {
      heading: string; description: string; label: string; placeholder: string;
      button_label: string; enabled: boolean; action: string; disabled_text: string;
    };
    support_url: string;
    copyright: string;
  };
};

// Literal content/site.php except approved MingCute UI-icon identifiers.
export const site = {
    "name": "NSEE",
    "tagline": "Research, data, and collaboration.",
    "description": "Starter website content for local development.",
    "footer": {
        "description": "Research, data, and collaboration.",
        "link_groups": [
            {
                "heading": "Quick Links",
                "links": [
                    {
                        "label": "Join NSEE",
                        "url": "/join"
                    },
                    {
                        "label": "Research",
                        "url": "/research"
                    },
                    {
                        "label": "People",
                        "url": "/people"
                    },
                    {
                        "label": "News",
                        "url": "/news"
                    },
                    {
                        "label": "Gallery",
                        "url": "/multimedia"
                    }
                ]
            }
        ],
        "contact": {
            "heading": "Contact",
            "address": "Plot 003, Saburi One Kubwa-Deidei Express Road 900107 Abuja Federal Capital Territory, Nigeria",
            "email": "info@nosee.org",
            "phone": "+234 805 929 1023"
        },
        "social_links": [
            {
                "label": "LinkedIn",
                "url": "https://linkedin.com",
                "icon": "LinkedinFilled"
            },
            {
                "label": "Facebook",
                "url": "https://facebook.com",
                "icon": "FacebookFilled"
            },
            {
                "label": "X",
                "url": "https://x.com",
                "icon": "SocialXFilled"
            },
            {
                "label": "Instagram",
                "url": "https://instagram.com",
                "icon": "InstagramFilled"
            },
            {
                "label": "YouTube",
                "url": "https://youtube.com",
                "icon": "YoutubeFilled"
            }
        ],
        "legal_links": [
            {
                "label": "Privacy Policy",
                "url": "/privacy"
            },
            {
                "label": "Terms of Use",
                "url": "/terms"
            }
        ],
        "newsletter": {
            "heading": "NOSEE Newsletter",
            "description": "Subscribe to our newsletter to receive more updates.",
            "label": "Newsletter email address",
            "placeholder": "Email address",
            "button_label": "Subscribe",
            "enabled": true,
            "action": "/newsletter/subscribe",
            "disabled_text": "Newsletter signup is unavailable in this development build."
        },
        "support_url": "/support",
        "copyright": "© 2026 NOSEE. All rights reserved."
    }
} satisfies SiteContent;

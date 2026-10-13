export type NavigationItem = {
  label: string;
  url: string;
  enabled: boolean;
  version?: string;
  children?: NavigationItem[];
};

export type NavigationState = Omit<NavigationItem, "children"> & {
  active: boolean;
  current: boolean;
  children?: NavigationState[];
};

// Literal content/navigation.php at the pinned Laravel revision.
export const navigation = {
    "primary": [
        {
            "label": "About NSEE",
            "url": "/about",
            "enabled": true,
            "children": [
                {
                    "label": "Mission",
                    "url": "/about#mission",
                    "enabled": true
                },
                {
                    "label": "Leadership",
                    "url": "/about#leadership",
                    "enabled": true
                },
                {
                    "label": "Collaborations",
                    "url": "/about#collaborations",
                    "enabled": true
                }
            ]
        },
        {
            "label": "Research",
            "url": "/research",
            "enabled": true,
            "children": [
                {
                    "label": "Atmosphere and Air Quality",
                    "url": "/research/atmosphere-and-air-quality",
                    "enabled": true
                },
                {
                    "label": "Climate Science",
                    "url": "/research/climate-science",
                    "enabled": true
                },
                {
                    "label": "Earth and Space Informatics",
                    "url": "/research/earth-and-space-informatics",
                    "enabled": true
                },
                {
                    "label": "Energy, Resources and Environment",
                    "url": "/research/energy-resources-and-environment",
                    "enabled": true
                },
                {
                    "label": "Space Weather",
                    "url": "/research/space-weather",
                    "enabled": true
                }
            ]
        },
        {
            "label": "Data & Products",
            "url": "/data",
            "enabled": true,
            "children": [
                {
                    "label": "Data",
                    "url": "/data",
                    "enabled": true
                },
                {
                    "label": "Products",
                    "url": "/products",
                    "enabled": true
                }
            ]
        },
        {
            "label": "Events",
            "url": "/events",
            "enabled": true
        },
        {
            "label": "Publications",
            "url": "/publications",
            "enabled": true
        },
        {
            "label": "Outreach",
            "url": "/outreach",
            "enabled": true
        }
    ],
    "utility": [
        {
            "label": "News",
            "url": "/news",
            "enabled": true
        },
        {
            "label": "Multimedia",
            "url": "/multimedia",
            "enabled": true
        },
        {
            "label": "Support NOSEE",
            "url": "/support",
            "enabled": true
        },
        {
            "label": "Login",
            "url": "/login",
            "enabled": true,
            "version": "v1"
        }
    ]
} satisfies { primary: NavigationItem[]; utility: NavigationItem[] };

export function normalizePath(path: string): string {
  return "/" + path.replace(/^\/+|\/+$/g, "");
}

export function internalPath(url: string | null): string | null {
  if (!url?.startsWith("/") || url.startsWith("//")) return null;
  return normalizePath(url.split(/[?#]/, 1)[0]);
}

export function withActiveState(items: NavigationItem[], path: string): NavigationState[] {
  return items.filter((item) => item.enabled === true).map((item) => {
    const { children: sourceChildren, ...fields } = item;
    const children = sourceChildren ? withActiveState(sourceChildren, path) : [];
    const itemPath = internalPath(item.url);
    const current = itemPath === path;
    const active = current
      || (itemPath !== null && itemPath !== "/" && path.startsWith(itemPath + "/"))
      || children.some((child) => child.active);
    return { ...fields, ...(sourceChildren ? { children } : {}), active, current };
  });
}

export function getNavigationState(path: string) {
  path = normalizePath(path);
  return {
    homeCurrent: path === "/",
    primary: withActiveState(navigation.primary, path),
    utility: withActiveState(navigation.utility, path),
  };
}

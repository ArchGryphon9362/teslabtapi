const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Tesla BluetoothLE API (Unofficial)",
  tagline: "The API documentation you've all been waiting for 😃",
  url: "https://teslabtapi.lexnastin.com",
  baseUrl: "/",
  trailingSlash: false,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "/img/icon.svg",
  organizationName: "ArchGryphon9362", // Usually your GitHub org/user name.
  projectName: "teslabtapi", // Usually your repo name.
  plugins: [
    require.resolve("docusaurus-lunr-search"),
    [
      "@docusaurus/plugin-pwa",
      {
        debug: false,
        offlineModeActivationStrategies: [
          "appInstalled",
          "standalone",
          "queryString",
        ],
        pwaHead: [
          {
            tagName: "link",
            rel: "icon",
            href: "/img/icon.svg",
          },
          {
            tagName: "link",
            rel: "manifest",
            href: "/manifest.json",
          },
          {
            tagName: "meta",
            name: "theme-color",
            content: "rgb(232, 33, 39)",
          },
          {
            tagName: "meta",
            name: "apple-mobile-web-app-capable",
            content: "yes",
          },
          {
            tagName: "meta",
            name: "apple-mobile-web-app-status-bar-style",
            content: "#000",
          },
          {
            tagName: "link",
            rel: "apple-touch-icon",
            href: "/img/icon.svg",
          },
          {
            tagName: "link",
            rel: "mask-icon",
            href: "/img/icon.svg",
            color: "rgb(232, 33, 39)",
          },
          {
            tagName: "meta",
            name: "msapplication-TileImage",
            content: "/img/icon.svg",
          },
          {
            tagName: "meta",
            name: "msapplication-TileColor",
            content: "#000",
          },
        ],
      },
    ],
    [
      "docusaurus-plugin-ackee-improved",
      {
        domainId: "c21a18c1-4e62-485b-9eb4-a40feebb5164",
        server: "https://analytics.lexnastin.com",
        detailed: true,
        ignoreLocalhost: false,
        ignoreOwnVisits: true,
        ackeeTracerFile: "tracer.js",
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Tesla BluetoothLE API (Unofficial)",
      logo: {
        alt: "Site Logo",
        src: "/img/icon.svg",
      },
      items: [
        {
          type: "doc",
          docId: "intro",
          position: "left",
          label: "Tutorial",
        },
        {
          href: "https://www.lexnastin.com",
          label: "Blog",
          position: "left",
        },
        {
          href: "https://ko-fi.com/lexnastin",
          label: "Donate",
          position: "right"
        },
        {
          href: "https://github.com/ArchGryphon9362/teslabtapi",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    /* footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/docusaurus',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tesla BluetoothLE API. Built with Docusaurus.`,
    }, */
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/ArchGryphon9362/teslabtapi/edit/main/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        sitemap: {
          changefreq: "weekly",
          priority: 0.5,
        },
      },
    ],
  ],
  scripts: [
    {
      src: "/remove-cookies.js",
      defer: true,
    },
  ],
};

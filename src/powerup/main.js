
/* global TrelloPowerUp */

const APP_URL = window.location.origin;

const ICON_URL = `${APP_URL}/public-icon.svg`;

TrelloPowerUp.initialize({
  "board-buttons": function (t) {
    return [
      {
        text: "Board Merge",

        icon: {
          dark: ICON_URL,
          light: ICON_URL,
        },

        callback: function (t) {
          return t.modal({
            title: "Board Merge",
            url: `${APP_URL}/index.html`,
            fullscreen: true,
            accentColor: "#0C66E4",
          });
        },
      },
    ];
  },
});

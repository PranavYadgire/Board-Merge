
/* global TrelloPowerUp */

const APP_URL = 'https://boardmerge-three.vercel.app';

const ICON = {
  dark: `${APP_URL}/public-icon.svg`,
  light: `${APP_URL}/public-icon.svg`
};

TrelloPowerUp.initialize({
  'board-buttons': function (t) {
    return [
      {
        icon: ICON,
        text: 'Board Merge',
        callback: function (t) {
          return t.popup({
            title: 'Board Merge',
            url: `${APP_URL}/index.html`,
            height: 700
          });
        }
      }
    ];
  }
});

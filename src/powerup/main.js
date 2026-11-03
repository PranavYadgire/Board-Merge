
/* global TrelloPowerUp */

const origin = window.location.origin;

const ICON = {
  dark: `${origin}/public-icon.svg`,
  light: `${origin}/public-icon.svg`
};

TrelloPowerUp.initialize({
  'board-buttons': function () {
    return [
      {
        icon: ICON,
        text: 'Board Merge',
        callback: function (t) {
          return t.popup({
            title: 'Board Merge',
            url: './index.html',
            height: 700
          });
        }
      }
    ];
  }
});

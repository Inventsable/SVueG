window.Event = new Vue();

csInterface.addEventListener('svueg.notificationOn', function (evt) {
  console.log('Caught notification')
  console.log(evt.data);
})

Vue.component('notification-window', {
  template: `
        <div class="content">
            <stylizer />
            <div class="testApp">Hello world</div>
            <notification v-if="hasNotification" :model="notification" />
        </div>
    `,
  data() {
    return {
      msg: 'hello there',
      hasNotification: false,
      notification: {
        data: 'test update',
        details: '',
        notes: [
          "dummy text 1",
          "dummy text 2",
          "dummy text 3"
        ],
        preview: 'https://via.placeholder.com/960x540/434343/b7b7b7',
      },
    }
  },
  mounted() {
    console.log(this.msg);
  },
  methods: {
    showNotification() {
      //  if (this.$root.notificationsEnabled) { this.hasNotification = true; } 
    },
    hideNotification() {
      //  this.$root.notificationsEnabled = false, this.hasNotification = false; 
    },
    constructUpdate(msg) {
      this.notification = JSON.parse(msg);
    },
  }
})

Vue.component('stylizer', {
  template: `
        <div class="stylizer"></div>
    `,
  data() {
    return {
      cssOrder: ['bg', 'icon', 'border', 'button-hover', 'button-active', 'button-disabled', 'text-active', 'text-default', 'text-disabled', 'input-focus', 'input-idle', 'scrollbar', 'scrollbar-thumb', 'scrollbar-thumb-hover', 'scrollbar-thumb-width', 'scrollbar-thumb-radius'],
      activeStyle: [],
      styleList: {
        ILST: {
          lightest: ['#f0f0f0', '#535353', '#dcdcdc', '#f9f9f9', '#bdbdbd', '#e6e6e6', '#484848', '#484848', '#c6c6c6', '#ffffff', '#ffffff', '#fbfbfb', '#dcdcdc', '#a6a6a6', '20px', '20px'],
          light: ['#b8b8b8', '#404040', '#5f5f5f', '#dcdcdc', '#969696', '#b0b0b0', '#101010', '#101010', '#989898', '#e3e3e3', '#e3e3e3', '#c4c4c4', '#a8a8a8', '#7b7b7b', '20px', '10px'],
          dark: ['#535353', '#c2c2c2', '#5f5f5f', '#4a4a4a', '#404040', '#5a5a5a', '#d8d8d8', '#d5d5d5', '#737373', '#ffffff', '#474747', '#4b4b4b', '#606060', '#747474', '20px', '10px'],
          darkest: ['#323232', '#b7b7b7', '#5f5f5f', '#292929', '#1f1f1f', '#393939', '#1b1b1b', '#a1a1a1', '#525252', '#fcfcfc', '#262626', '#2a2a2a', '#383838', '#525252', '20px', '10px'],
        },
      }
    }
  },
  mounted() {
    Event.$on('findTheme', this.findTheme);
  },
  methods: {
    setGradientTheme() {
      console.log('This is an After Effects theme');
      this.$root.setCSS('color-bg', toHex(appSkin.panelBackgroundColor.color));
      this.$root.setCSS('color-scrollbar', toHex(appSkin.panelBackgroundColor.color, -20));
      this.$root.setCSS('color-scrollbar-thumb', toHex(appSkin.panelBackgroundColor.color));
      this.$root.setCSS('color-scrollbar-thumb-hover', toHex(appSkin.panelBackgroundColor.color, 10));
    },
    // detectTheme() {
    //     let app = this.$root.activeApp, theme = this.$root.activeTheme;
    // },
    assignTheme() {
      let app = this.$root.activeApp, theme = this.$root.activeTheme;
      for (var i = 0; i < this.cssOrder.length; i++) {
        let prop = this.cssOrder[i], value = this.styleList[app][theme][i];
        if (!/width|radius/.test(prop)) {
          this.$root.setCSS(`color-${prop}`, value);
        } else {
          this.$root.setCSS(prop, value);
        }
      }
    },
    // getCSSName(str) {
    //     if (/\_/gm.test(str))
    //         str = str.replace(/\_/gm, '-');
    //     return str;
    // },
    findTheme(appSkin) {
      if (this.$root.activeApp !== 'AEFT') {
        if (appSkin.panelBackgroundColor.color.red > 230)
          this.$root.activeTheme = 'lightest';
        else if (appSkin.panelBackgroundColor.color.red > 170)
          this.$root.activeTheme = 'light';
        else if (appSkin.panelBackgroundColor.color.red > 80)
          this.$root.activeTheme = 'dark';
        else
          this.$root.activeTheme = 'darkest';
        // this.$root.updateStorage();
      } else {
        // this.setGradientTheme();
      }
      this.assignTheme();
    },
  }
})

var app = new Vue({
  el: '#app',
  data: {
    msg: 'hello world',
    activeTheme: 'none',
  },
  mounted() {
    console.log('Hello notification');
    csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, self.appThemeChanged);
    this.appThemeChanged();
  },
  methods: {
    appThemeChanged(event) {
      var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
      console.log('Detected theme change')
      Event.$emit('findTheme', skinInfo);
    },
  }
});

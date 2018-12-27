var csInterface = new CSInterface();
loadUniversalJSXLibraries();
loadJSX(csInterface.hostEnvironment.appName + '/host.jsx');
window.Event = new Vue();

const EventList = [
  { listenTo: 'debug.on', sendTo: 'debugModeOn', package: false, },
  { listenTo: 'debug.off', sendTo: 'debugModeOff', package: false, },
];

for (let e = 0; e < EventList.length; e++) {
  let event = EventList[e];
  console.log(event);
  csInterface.addEventListener(event.listenTo, function(evt) {
    console.log(evt)
    if (/debug/.test(evt.type)) {
      if (evt.type == 'debug.on')
        Event.$emit('debugModeOn');
      if (evt.type == 'debug.off')
        Event.$emit('debugModeOff');
    } else {
      // This might be broken
      console.log(event);
      if (event.package) {
        // 
      } else {
        console.log(event)
        Event.$emit(event.sendTo);
      }
    }
  });
}

Vue.component('svueg', {
  template: `
    <div class="appGrid" 
      @mouseover="wakeApp" 
      @mouseout="sleepApp"
      :style="styleDebug()">
      <notification v-if="hasNotification" :model="notification" />
      <event-manager />
      <stylizer />
      <panel>
        <top>
          <node-visual />
        </top>
        <center>
          <node-inputs :model="injectors" />
          <result-text />
        </center>
        <bottom>
          <div class="footpedals">

          </div>
        </bottom>
      </panel>
    </div>
  `,
  data() {
    return {
      wakeOnly: false,
      showConsole: true,
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
  computed: {
    debugMode: function () { return this.$root.debugMode },
    isWake: function () { return this.$root.isWake },
    injectors: function () { return this.$root.totalNodes },
  },
  methods: {
    openModal() {
      console.log('Opening modal extension');
      window.__adobe_cep__.requestOpenExtension("inventsable.svueg.modal", "");
    },
    // updateInjectors(msg) {
    //   msg = JSON.parse(msg);
    //   this.injectors = [];
    //   if (msg.length) {
    //     // let actives = msg.split(',');
    //     for (let i = 0; i < msg.length; i++) {
    //       const target = msg[i];
    //       const clone = {
    //         placeholder: target,
    //         size: 'large',
    //         sendEvent: `submit-${target}`,
    //       }
    //       this.injectors.push(clone);
    //     }
    //   }
    //   // console.log(this.injectors);
    // },
    // updateNodeInputs() {
    //   this.injectors = [];
    //   for (let i = 0; i < this.nodeList.length; i++) {
    //     const node = this.nodeList[i];
    //     // const clone = {
    //       // sendEvent: `submit-${target}`,
    //     // }
    //     this.injectors.push(clone);
    //   }
    // },
    // checkDebug() {
    //   if ((this.isWake) && (this.debugMode)) {
    //     let selection = this.$root.getCSS('color-selection');
    //     this.$root.setCSS('color-debug', selection);
    //   } else {
    //     this.$root.setCSS('color-debug', 'transparent');
    //   }
    // },
    styleDebug() { return ((this.debugMode) && (this.isWake)) ? `border-color: ${this.$root.getCSS('color-selection')}` : `border-color: transparent`; },
    wakeApp() {
      this.$root.wake();
      this.$root.dispatchEvent('debug.target', this.$root.name);
      if (this.debugMode) {
        this.$root.dispatchEvent('debug.link', 'Can start to read')
      } else {
        // console.log('Not in debug mode')
      }
      // this.checkDebug();
      Event.$emit('startStats');
    },
    sleepApp() {
      if (this.wakeOnly) {
        this.wakeApp();
        Event.$emit('clearStats');
      } else {
        this.$root.sleep();
        if (this.debugMode) {
          // console.log('Attempting to send debug.unlink')
          this.$root.dispatchEvent('debug.target', '');
          this.$root.dispatchEvent('debug.unlink', 'Can no longer read')
        } else {
          // console.log('Not in debug mode')
        }
        Event.$emit('clearStats');
      }
      // this.checkDebug();
    },
    showNotification() { if (this.$root.notificationsEnabled) { this.hasNotification = true; } },
    hideNotification() { this.$root.notificationsEnabled = false, this.hasNotification = false; },
    constructUpdate(msg) { this.notification = JSON.parse(msg); },
  },
  mounted() {
    Event.$on('showNotification', this.showNotification);
    Event.$on('hideNotification', this.hideNotification);
    Event.$on('promptUpdate', this.constructUpdate);
    // this.updateNodeInputs();
    // Event.$on('updateInjectors', this.updateInjectors);
    // Event.$on('debugModeOff', this.checkDebug);
    // console.log(this.injectors);
  }
})
Vue.component('panel', { template: `<div class="screen"><slot></slot></div>` })
Vue.component('top', { template: `<div class="appTop"><slot></slot></div>` })
Vue.component('center', { template: `<div class="appCenter"><slot></slot></div>` })
Vue.component('bottom', { template: `<div class="appBottom"><slot></slot></div>` })

Vue.component('node-visual', {
  template: `
    <div class="node-ui-wrap">
      <div class="node-ui-content">
        <div class="node-code">\<</div>
        <div class="node-wrap">
          <div v-for="(node,index) in nodeList"
            :key="index" 
            class="node-solo" 
            :style="getStyle(index)"
            @click="removeNode(index)"
            v-on:rebuildEvent="checkBuild(node,index)"></div>
          <div class="node-add" @click="newNode()"></div>
        </div>
        <div class="node-code"> code \></div>
      </div>
    </div>
  `,
  data() {
    return {
      // labelList: ['#c0392b', '#27ae60', '#2980b9'],
      // nodeList: [],
      mirror: [],
    }
  },
  computed: {
    nodeList: function() {
      return this.$root.totalNodes;
    },
    labelList: function() {
      let mirror = [];
      mirror.push(this.$root.getCSS('color-icon'));
      mirror.push(this.$root.getCSS('color-icon'));
      mirror.push(this.$root.getCSS('color-icon'));
      return mirror;
    }
  },
  methods: {
    findInParent(msg) {
      for (let i = 0; i < this.$root.totalNodes.length; i++) {
        const child = this.$root.totalNodes[i];
        if (msg == child)
          return i;
          // this.$root.totalNodes.splice(i, 1);
      }
      return -1;
    },
    promptInjectors(msg) {
      msg = JSON.parse(msg);
      // console.log(`prompting injectors`)
      // console.log(msg)
      // console.log(msg.index)
      let current = this.findInParent(msg.data);
      // console.log(`${current} :: ${msg.index}`);
      let index = msg.index;
      if ((current !== index) && (current > 0)) {
        // console.log(`Node has moved from ${index} to ${current}`)
        this.$root.totalNodes[current] = msg.data;
        this.$root.totalNodes.splice(index,1);
      } else {
        if (index !== this.$root.totalNodes.length)
          this.$root.totalNodes[index] = msg.data;
      }
      // console.log(this.$root.totalNodes);
      this.$root.updateStorage();
    },
    newNode() {
      this.nodeList.push('');
      Event.$emit('updateInjectors', JSON.stringify(this.nodeList));
    },
    removeNode(key) {
      if (this.$root.Alt) {
        console.log(`Should remove ${key}`)
        this.$root.totalNodes.splice(key, 1);
        Event.$emit('rebuild')
        this.checkValues();
        this.$root.updateStorage();
      }
    },
    checkValues() {
      let mirror = this.$root.totalNodes;
      let result = this.$root.removeDuplicatesInArray(mirror);
      result = this.$root.removeEmptyValues(result);
      this.$root.totalNodes = result;
    },
    checkBuild(node,index) {
      console.log(`${node} is at ${index}`);
    },
    sendBuild() {
      this.$emit('rebuildEvent');
    },
    getStyle(key) {
      if (key > this.labelList.length)
        key = key % this.labelList.length;
      const target = this.labelList[key];
      if (!this.$root.Alt) {
        return `background-color: ${target};`;
      } else if (this.$root.Alt) {
        return `cursor:pointer;background-color:red;`
      }
    },
  },
  mounted() {
    // this.nodeList = this.$root.totalNodes;
    // console.log('Component has mounted:');
    // console.log(this.$root.totalNodes);
    Event.$on('checkInjector', this.promptInjectors);
    Event.$on('rebuild', this.sendBuild);
    Event.$on('addInjector', this.newNode);
  }
})

Vue.component('launch-button', {
  template: `
    <div class="test-tertiary-btn" @click="doTest()">Launch</div>
  `,
  data() {
    return {
      msg: 'Hello there',
    }
  },
  mounted() {

  },
  methods: {
    doTest() {
      console.log('Button was clicked!');
      csInterface.evalScript(`exportSVG()`, function() {
        Event.$emit('exportTemp');
      });
    }
  }
})

Vue.component('clear-button', {
  template: `
    <div class="test-tertiary-btn" @click="doTest()">Clear</div>
  `,
  methods: {
    doTest() {
      Event.$emit('clearOriginal');
    }
  }
})

Vue.component('node-inputs', {
  props: {
    model: Array
  },
  template: `
    <div :class="getGridClass()">
      <auto-input 
        v-for="(input,key) in model"
        :key="key"
        :index="key"
        :emitter="'send' + key" />
    </div>
  `,
  methods: {
    getGridClass() {
      return 'testGrid';
    },
  },
})

Vue.component('auto-input', {
  props: {
    index: Number,
    emitter: String,
  },
  template: `
    <div class="wrap-input">
      <div class="label" style="getLabelStyle()"></div>
      <input 
        :class="getClass()"
        :style="checkSize()"
        @keyup.enter="submitTest(fakeMsg)"
        v-model="fakeMsg"
        spellcheck="false"
        placeholder="dynamic attribute"/>
      <div class="include-menu">
        <div class="include-options"></div>
      </div>
    </div>
  `,
  data() {
    return {
      fakeMsg: '',
    }
  },
  computed: {
    isWake: function () {
      return this.$root.isWake;
    },
    labelList: function () {
      let mirror = [];
      mirror.push(this.$root.getCSS('color-icon'));
      mirror.push(this.$root.getCSS('color-icon'));
      mirror.push(this.$root.getCSS('color-icon'));
      return mirror;
    },
  },
  mounted() {
    // console.log(this.index + ' is online');
    Event.$on('collectKeys', this.sendKey);
    Event.$on('rebuild', this.rebuild);
    this.rebuild();
  },
  methods: {
    rebuild() {
      let index = this.index;
      if (this.fakeMsg !== "undefined") {
        if (this.index < this.$root.totalNodes.length) {
          this.fakeMsg = this.$root.totalNodes[index];
        } else {
          console.log('Caught renegade node');
        }
      } else {
        console.log('Caught legendary outlaw node');
      }
      console.log(this.$root.totalNodes);
      // console.log(`Rebuilding ${this.index} with ${this.fakeMsg}`);
    },
    sendKey() {
      let child = {
        index: this.index,
        data: this.fakeMsg,
      }
      console.log(`Sending key from ${this.index}`)
      Event.$emit('checkInjector', JSON.stringify(child));
      Event.$emit('injectResults');
      // @@
      // this.$root.totalNodes.push(this.fakeMsg);
    },
    getLabelStyle() {
      const targ = this.index;
      return this.labelList[targ];
    },
    checkSize() {
        return `width: calc(100% - 5.7rem);`;
    },
    getClass() {
      return this.isWake ? 'input-active' : 'input-idle'
    },
    submitTest(msg) {
      if (msg.length) {
        if (this.$root.Shift) {
          Event.$emit('addInjector')
        } else {
          console.log(msg);
          console.log(`Emit ${this.emitter}`)
        }
      }
    }
  }
})

Vue.component('result-text', {
  template: `
    <div class="wrap-result">
      <div class="wrap-input">
        <textarea 
          :class="getClass()"
          @keyup.enter="submitTest(msg)"
          style="width:100%;margin:.5rem 1rem .5rem .75rem;"
          v-model="msg" 
          :rows="rows"
          spellcheck="false"
          placeholder="SVG result"/>
      </div>
      <div class="result-toolbar">
        <launch-button />
        <clear-button />
      </div>
    </div>
  `,
  data() {
    return {
      original: '',
      msg: '',
      rows: 3,
      shortHand: true,
      rx: {
        trimL: /(.|\s)*title\>/gm,
        trimLshort: /(.|\n)*title\>/gm,
        trimR: /\<\/svg\>/gm,
        hasClass: /class=\"cls\-(\d)*\"/gm,
        trimLayerL: /\<g\sid\=\"Layer\_(\d)*\"\sdata-name\=\"(.)*\"\>/gm,
        layerName: /Layer\_(\d)*(?=\"\sdata-name\=\"(.)*\"\>)/gm,
        trimLayerR: /^\<\/g\>/gm,
        emptyGroup: / *\<g\>/gm,
        trimGroupEnds: / *\<\/g\>/gm,
      }
    }
  },
  computed: {
    isWake: function() {
      return this.$root.isWake;
    }
  },
  mounted() {
    Event.$on('updateResult', this.updateResult);
    Event.$on('exportTemp', this.checkTemp);
    Event.$on('injectResults', this.injectResults);
    Event.$on('clearOriginal', this.clearOriginal);
  },
  methods: {
    clearOriginal() {
      this.original = '';
      this.msg = '';
    },
    getClass() {
      return this.isWake ? 'input-active' : 'input-idle'
    },
    submitTest(msg) {
      if (msg.length) {
        console.log(msg);
      }
    },
    injectResults() {
      console.log('injecting attributes:')
      let attrs = this.$root.totalNodes.join(' ');
      // let temp = '';
      if (this.original.length) {
        let temp = this.original;
        if (this.rx.emptyGroup.test(temp)) {
          temp = temp.replace(this.rx.emptyGroup, '');
          temp = temp.replace(this.rx.trimGroupEnds, '');
        }
        if (this.rx.trimLayerL.test(temp)) {
          console.log('found layer...')
          temp = temp.replace(this.rx.trimLayerL, `<g>`);
          temp = temp.replace(this.rx.trimGroupEnds, `</g>`);
        }
        if (this.rx.hasClass.test(this.original)) {
          console.log('found class')
          temp = temp.replace(this.rx.hasClass, attrs);
        }
        this.msg = temp;
      }
      this.$root.healResults();
    },
    updateResult(msg) {
      console.log('Result is...');
      console.log(msg);
      this.original = msg;
      // this.msg = msg;
      this.injectResults();
      this.rows = msg.split('\n').length;
    },
    checkTemp() {
      let file = '', err = 0;
      try {
        file = window.cep.fs.readFile(this.$root.tempPath + '/temp.svg');
        // console.log(file)
        file = file.data;
      } catch(e) {
        err++;
        console.log(err)
      } finally {
        if (err < 1) {
        let result = '';
          result = file.replace(this.rx.trimLshort, '');
          result = result.replace(this.rx.trimR, '');
          result = result.split(`</defs>`);
          result = result[1].split('\n');
          let mirror = [];
          for (let i = 0; i < result.length; i++) {
            let line = result[i];
            if (line.length > 2) {
              if (/^\s\s/.test(line))
                line = line.replace(/^\s\s/, '');
              mirror.push(line);
            }
          }
          result = mirror.join('\n');
          console.log(result);
          this.updateResult(result);
        }
      }
    }
  }
})

// Vue.component('custom-input', {
//   props: {
//     size: String,
//   },
//   template: `
//     <div class="wrap-input">
//       <input 
//         v-if="size !== 'large'"
//         :class="getClass()"
//         :style="checkSize()"
//         @keyup.enter="submitTest(msg)"
//         v-model="msg" 
//         :placeholder="placeholder""/>
//       <textarea 
//         v-if="size == 'large'"
//         :class="getClass()"
//         :style="checkSize()"
//         @keyup.enter="submitTest(msg)"
//         v-model="msg" 
//         :placeholder="placeholder""/>
//     </div>
//   `,
//   data() {
//     return {
//       msg: '',
//     }
//   },
//   computed: {
//     isWake: function () {
//       return this.$root.isWake;
//     },
//     placeholder: function() {
//       if (this.size == 'large')
//         return `size is fullscreen`;
//       else if (this.size == 'auto')
//         return `size is automatic`;
//       else if (this.size == 'small')
//         return `mini`
//     },
//   },
//   mounted() {
//     console.log(this.msg)
//   },
//   methods: {
//     checkSize() {
//       if (this.size == 'large')
//         return `width: 100%;`;
//       else if (this.size == 'mid')
//         return `width: auto;`;
//       else if (this.size == 'small')
//         return `width: 5rem;`;
//     },
//     getClass() {
//       return this.isWake ? 'input-active' : 'input-idle'
//     },
//     submitTest(msg) {
//       if (msg.length) {
//         console.log(msg);
//       }
//     }
//   }
// })


// Vue.component('notification-icon', {
//   props: {
//     type: String,
//   },
//   template: `
//     <div 
//       :class="type == 'cancel' ? 'note-icon' : 'note-icon'" 
//       @mouseover="hover = true" 
//       @mouseout="hover = false" 
//       @click="doAction"
//       v-if="type !== 'none'">
//       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
//         <path v-if="type == 'cancel'" :style="iconColor" d="M29.24,25,41.12,13.12a3,3,0,0,0-4.24-4.24L25,20.76,13.12,8.88a3,3,0,0,0-4.24,4.24L20.76,25,8.88,36.88a3,3,0,0,0,0,4.24,3,3,0,0,0,4.24,0L25,29.24,36.88,41.12a3,3,0,0,0,4.24,0,3,3,0,0,0,0-4.24Z"/>
//         <path v-if="type == 'arrowRight'" :style="iconColor" d="M18,42a3,3,0,0,1-2.12-.88,3,3,0,0,1,0-4.24L27.76,25,15.88,13.12a3,3,0,0,1,4.24-4.24l14,14a3,3,0,0,1,0,4.24l-14,14A3,3,0,0,1,18,42Z"/>
//         <path v-if="type == 'arrowUp'" :style="iconColor" d="M39,35a3,3,0,0,1-2.12-.88L25,22.24,13.12,34.12a3,3,0,1,1-4.24-4.24l14-14a3,3,0,0,1,4.24,0l14,14a3,3,0,0,1,0,4.24A3,3,0,0,1,39,35Z"/>
//         <path v-if="type == 'arrowLeft'" :style="iconColor" d="M32,42a3,3,0,0,1-2.12-.88l-14-14a3,3,0,0,1,0-4.24l14-14a3,3,0,1,1,4.24,4.24L22.24,25,34.12,36.88a3,3,0,0,1,0,4.24A3,3,0,0,1,32,42Z"/>
//         <path v-if="type == 'arrowDown'" :style="iconColor" d="M25,35a3,3,0,0,1-2.12-.88l-14-14a3,3,0,1,1,4.24-4.24L25,27.76,36.88,15.88a3,3,0,1,1,4.24,4.24l-14,14A3,3,0,0,1,25,35Z"/>
//         <path v-if="type == 'menu'" :style="iconColor" d="M40,28H10a3,3,0,0,1,0-6H40a3,3,0,0,1,0,6Zm3-16a3,3,0,0,0-3-3H10a3,3,0,0,0,0,6H40A3,3,0,0,0,43,12Zm0,26a3,3,0,0,0-3-3H10a3,3,0,0,0,0,6H40A3,3,0,0,0,43,38Z"/>
//         <path v-if="type == 'info'" :style="iconColor" d="M25,4A21,21,0,1,0,46,25,21,21,0,0,0,25,4Zm0,35a3,3,0,1,1,3-3A3,3,0,0,1,25,39Zm1.52-9h-3L21.91,12.37a3.1,3.1,0,1,1,6.18,0Z"/>
//         <path v-if="type == 'home'" :style="iconColor" d="M45.79,26.74l-1.56,1.89a.9.9,0,0,1-1.26.12L26.57,15.17a1.66,1.66,0,0,0-2.14,0L8,28.75a.9.9,0,0,1-1.26-.12L5.21,26.74a.89.89,0,0,1,.12-1.27L23.16,10.71a3.68,3.68,0,0,1,4.65,0l6.54,5.42V10.31a.74.74,0,0,1,.74-.74h3.48a.74.74,0,0,1,.74.74V20.2l6.36,5.27A.89.89,0,0,1,45.79,26.74Zm-12.15-2.3-7.38-5.91a1.23,1.23,0,0,0-1.52,0l-7.38,5.91-5.92,4.73a1.2,1.2,0,0,0-.45.95V40.78a.65.65,0,0,0,.65.65H21a.66.66,0,0,0,.66-.65v-7.9a.65.65,0,0,1,.65-.65H28a.66.66,0,0,1,.66.65v7.9a.65.65,0,0,0,.65.65h9.31a.66.66,0,0,0,.66-.65V29.56a1.23,1.23,0,0,0-.46-1Z"/>
//       </svg>
//     </div>
//   `,
//   data() {
//     return {
//       hover: false,
//     }
//   },
//   computed: {
//     iconColor: function () { return (this.$root.isWake) ? `fill: ${this.$root.getCSS('color-note-icon')}` : `fill: ${this.$root.getCSS('color-text-disabled')}`; }
//   },
//   methods: {
//     doAction() {
//       // console.log(`Clicked on ${this.type}`)
//     }
//   }
// })

// Vue.component('notification', {
//   props: {
//     model: Object,
//   },
//   template: `
//     <div class="global-notification">
//       <div class="global-notification-wrap">
//         <div v-if="!alt" class="note-display">
//           <notification-icon type="info" />
//         </div>
//         <div v-if="isLarge" class="note-header">
//           <a @click="goToHome" v-if="!hasDetails && !nullified" class="global-notification-text">{{model.data}}</a>
//           <a @click="goToHome" v-if="hasDetails && !nullified" class="global-notification-text">{{fulldetails}}</a>
//           <span v-if="nullified" class="global-notification-text">No updates</span>
//         </div>
//         <div class="note-cancel" @click="killNote">
//           <notification-icon type="cancel" />
//         </div>
//       </div>
//       <ul v-if="hasDetails && !nullified" class="note-list">
//           <li v-for="(item,key) in model.notes" v-if="!isSmall" class="note-list-note">{{item}}</li>
//           <notification-icon v-for="(item,key) in model.notes" v-if="isSmall" type="info" :title="item" :key="key" />
//       </ul>
//       <div v-if="hasDetails && !nullified"" class="note-preview">
//         <div @click="goToHome" :style="getPreviewStyle(model.preview)"></div>
//       </div>
//       <div v-if="!nullified"" class="global-notification-wrap">
//         <div class="global-notification-toggle" @click="toggleTray" :style="styleTray()">
//           <notification-icon :type="hasDetails ? 'none' : 'arrowDown'" />
//         </div>
//       </div>
//     </div>
//   `,
//   data() {
//     return {
//       alt: true,
//       hasDetails: false,
//       msg: 'Hello notification',
//     }
//   },
//   computed: {
//     fulldetails: function () { return `${this.$root.rootName} ${this.model.details}` },
//     nullified: function () { return !this.$root.needsUpdate },
//     isSmall: function () { return this.$root.isSmall },
//     isMedium: function () { return this.$root.isMedium },
//     isLarge: function () { return this.$root.isLarge },
//     anchorLink: function () { return `https://www.inventsable.cc#${this.$root.rootName}`; },
//   },
//   methods: {
//     goToHome() { cep.util.openURLInDefaultBrowser(this.anchorLink); },
//     styleTray() {
//       if (this.hasDetails) {
//         if (this.isLarge) {
//           return `width: calc(100% - 3rem);`;
//         } else {
//           return `width: 100%;`;
//         }
//       } else {
//         return `width: 100%;`;
//       }
//     },
//     getPreviewStyle(img) { return `cursor:pointer; background-image: url(${img}); background-size: contain; background-repeat: norepeat; background-color: ${this.$root.getCSS('color-note-dark')}`; },
//     toggleTray(el) { this.hasDetails = !this.hasDetails; },
//     killNote() {
//       Event.$emit('hideNotification');
//       const targ = this.$root.findMenuItemById('notificationsEnabled');
//       targ.checked = false;
//       this.$root.setContextMenu();
//     },
//     nullifyUpdate() {
//       this.nullified = true;
//     },
//   },
//   mounted() {
//     Event.$on('nullUpdate', this.nullifyUpdate);
//   }
// })

Vue.component('event-manager', {
  template: `
    <div 
      v-keydown-outside="onKeyDownOutside"
      v-keyup-outside="onKeyUpOutside"
      v-mousemove-outside="onMouseMove"
      v-mouseup-outside="onMouseUp"
      v-mousedown-outside="onMouseDown"
      v-click-outside="onClickOutside">
    </div>
  `,
  data() {
    return {
      activeList: [
        { name: 'Ctrl' },
        { name: 'Shift' },
        { name: 'Alt' },
      ],
      Shift: false,
      Ctrl: false,
      Alt: false,
      wasDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
    }
  },
  mounted() {
    var self = this;
    this.activeMods();
    this.handleResize(null);
    window.addEventListener('resize', this.handleResize);
    csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, self.appThemeChanged);
    this.appThemeChanged();
    Event.$on('newAction', this.checkDebugAction);
    Event.$on('keypress', this.checkDebugKeypress);
  },
  computed: {
    isDefault: function () { return this.$root.isDefault },
    mouseX: function () { return this.$root.mouseX; },
    mouseY: function () { return this.$root.mouseY; },
    hasCtrl: function () { return this.$root.Ctrl ? 'Ctrl' : false; },
    hasShift: function () { return this.$root.Shift ? 'Shift' : false; },
    hasAlt: function () { return this.$root.Alt ? 'Alt' : false; },
  },
  methods: {
    checkDebugAction(msg) {
      if (this.$root.debugMode) {
        console.log(`Debug action is ${msg}`)
        this.$root.lastAction = msg;
        this.$root.dispatchEvent('debug.listen', JSON.stringify(this.$root.clone));
      }
    },
    checkDebugKeypress(e) {
      if (this.$root.debugMode) {
        console.log(`Debug keypress is ${e.key}`)
        this.getLastKey(e.key);
        this.$root.dispatchEvent('debug.listen', JSON.stringify(this.$root.clone));
      }
    },
    setPanelCSSHeight() {
      this.$root.setCSS('evt-height', `${this.$root.panelHeight - 50}px`);
      this.$root.setCSS('panel-height', `${this.$root.panelHeight - 20}px`);
    },
    appThemeChanged(event) {
      var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
      console.log('Detected theme change')
      Event.$emit('findTheme', skinInfo);
    },
    handleResize(evt) {
      if (this.$root.activeApp == 'AEFT') {
        this.$root.panelWidth = document.documentElement.clientWidth;
        this.$root.panelHeight = document.documentElement.clientHeight;
      } else {
        this.$root.panelWidth = document.documentElement.clientWidth;
        this.$root.panelHeight = document.documentElement.clientHeight;
        this.setPanelCSSHeight();
        if (this.$root.debugMode) {
          this.$root.dispatchEvent('debug.listen', JSON.stringify(this.$root.clone));
        }
      }
    },
    activeMods() {
      var mirror = [], child = {};
      if (this.Ctrl)
        child = { name: 'Ctrl', key: 0 }, mirror.push(child);
      if (this.Shift) {
        child = { name: 'Shift', key: 1 }
        mirror.push(child);
      }
      if (this.Alt) {
        child = { name: 'Alt', key: 2 }
        mirror.push(child);
      }
      this.activeList = mirror;
    },
    clearMods() {
      this.Shift = false, this.Alt = false, this.Ctrl = false;
      this.activeList = [];
    },
    updateMods() {
      this.Ctrl = this.$root.Ctrl, this.Shift = this.$root.Shift, this.Alt = this.$root.Alt;
      this.activeMods();
    },
    onMouseDown(e, el) {
      this.$root.isDragging = true, this.wasDragging = false;
      this.lastMouseX = this.$root.mouseX, this.lastMouseY = this.$root.mouseY;
      Event.$emit('newAction', 'Mouse click');
    },
    onMouseUp(e, el) {
      if (this.$root.isDragging) {
        if (((this.lastMouseX <= this.$root.mouseX + 6) && (this.lastMouseX >= this.$root.mouseX - 6)) && ((this.lastMouseY <= this.$root.mouseY + 6) && (this.lastMouseY >= this.$root.mouseY - 6))) {
          this.wasDragging = false;
        } else {
          Event.$emit('newAction', 'Click/Drag');
          this.wasDragging = true;
        }
        this.$root.isDragging = false;
      } else {
        // Event.$emit('newAction', 'Drag release');
      }
    },
    onMouseMove(e, el) {
      this.$root.mouseX = e.clientX, this.$root.mouseY = e.clientY;
      if (this.$root.isDragging) {
        Event.$emit('newAction', 'Click-drag')
      } else {
        if (((this.lastMouseX <= this.$root.mouseX + 6) && (this.lastMouseX >= this.$root.mouseX - 6)) && ((this.lastMouseY <= this.$root.mouseY + 6) && (this.lastMouseY >= this.$root.mouseY - 6))) {
          //
        } else {
          Event.$emit('newAction', 'Mouse move');
        }
      }
      this.$root.parseModifiers(e);
      // console.log(`${this.$root.mouseX}, ${this.$root.mouseY}`)
    },
    onClickOutside(e, el) {
      if (!this.wasDragging) {
        Event.$emit('newAction', 'Mouse click');
      }
    },
    onKeyDownOutside(e, el) {
      this.$root.parseModifiers(e);
      this.checkDebugKeypress(e);
      Event.$emit('newAction', 'keyDown');
    },
    onKeyUpOutside(e, el) {
      this.$root.parseModifiers(e);
      this.checkDebugKeypress(e);
      Event.$emit('newAction', 'keyUp');
      // this.$root.totalNodes = [];
      Event.$emit('collectKeys');
      
    },
    getLastKey(msg) {
      if (/Control/.test(msg)) {
        msg = 'Ctrl'
      }
      if (msg !== this.lastKey) {
        if (((this.$root.isDefault) && (msg !== 'Unidentified')) || ((msg == 'Ctrl') || (msg == 'Shift') || (msg == 'Alt'))) {
          if ((msg == 'Ctrl') || (msg == 'Shift') || (msg == 'Alt')) {
            var stack = []
            if (this.hasCtrl)
              stack.push(this.hasCtrl)
            if (this.hasShift)
              stack.push(this.hasShift)
            if (this.hasAlt)
              stack.push(this.hasAlt)

            if (stack.length) {
              console.log('Had length')
              this.lastKey = stack.join('+')
            } else {
              console.log('No length')
              this.lastKey = msg;
            }
          } else {
            this.lastKey = msg;
          }
        } else if (msg == 'Unidentified') {
          this.lastKey = 'Meta'
        } else {
          var stack = []
          if (this.hasCtrl)
            stack.push(this.hasCtrl)
          if (this.hasShift)
            stack.push(this.hasShift)
          if (this.hasAlt)
            stack.push(this.hasAlt)
          stack.push(msg);
          this.lastKey = stack.join('+')
        }
        this.$root.lastKey = this.lastKey;
      }
    },
  },
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
    detectTheme() {
      let app = this.$root.activeApp, theme = this.$root.activeTheme;
    },
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
    getCSSName(str) {
      if (/\_/gm.test(str))
        str = str.replace(/\_/gm, '-');
      return str;
    },
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
        this.$root.updateStorage();
      } else {
        this.setGradientTheme();
      }
      this.assignTheme();
    },
  }
})

var app = new Vue({
  el: '#app',
  data: {
    macOS: false,
    debugMode: false,
    notificationsEnabled: true,
    needsUpdate: true,
    name: 'none',
    panelWidth: null,
    panelHeight: null,
    mouseX: null,
    mouseY: null,
    lastKey: null,
    lastAction: 'No action',
    isDragging: false,
    winW: null,
    winH: null,
    homepage: 'https://www.inventsable.cc#svueg',
    activeApp: csInterface.hostEnvironment.appName,
    extPath: csInterface.getSystemPath(SystemPath.EXTENSION),
    tempPath: csInterface.getSystemPath(SystemPath.EXTENSION) + '/sandbox',
    activeTheme: 'darkest',
    showConsole: true,
    isWake: false,
    Shift: false,
    Ctrl: false,
    Alt: false,
    totalNodes: [],
    context: {
      menu: [
        { id: "refresh", label: "Refresh panel", enabled: true, checkable: false, checked: false, },
        { id: "notificationsEnabled", label: "Show notifications", enabled: true, checkable: true, checked: true, },
        { id: "test", label: "Run test", enabled: true, checkable: false, checked: false, },
        { label: "---" },
        { id: "about", label: "Go to Homepage", enabled: true, checkable: false, checked: false, },
      ],
    },
  },
  computed: {
    menuString: function () { return JSON.stringify(this.context); },
    isDefault: function () {
      var result = true;
      if ((this.Shift) | (this.Ctrl) | (this.Alt))
        result = false;
      return result;
    },
    rootName: function () {
      const str = csInterface.getSystemPath(SystemPath.EXTENSION);
      return str.substring(str.lastIndexOf('/') + 1, str.length);
    },
    clone: function () {
      let self = this;
      let child = {
        name: self.rootName,
        mouseX: self.mouseX,
        mouseY: self.mouseY,
        panelHeight: document.documentElement.clientHeight,
        panelWidth: document.documentElement.clientWidth,
        lastKey: self.lastKey,
        lastAction: self.lastAction,
      }
      return JSON.stringify(child);
    },
    isSmall: function () { return (this.panelWidth < 120) ? true : false; },
    isMedium: function () { return ((this.panelWidth > 120) && (this.panelWidth < 200)) ? true : false; },
    isLarge: function () { return (this.panelWidth > 200) ? true : false; },
  },
  mounted() {
    var self = this;
    this.name = this.rootName;
    if (navigator.platform.indexOf('Win') > -1) { this.macOS = false; } else if (navigator.platform.indexOf('Mac') > -1) { this.macOS = true; }
    this.readStorage();
    this.setContextMenu();
    Event.$on('debugModeOn', this.startDebug);
    Event.$on('debugModeOff', this.stopDebug);
    Event.$on('updateStorage', self.updateStorage);
    this.getVersion();
    this.tryFetch();
    if (this.notificationsEnabled)
      Event.$emit('showNotification');
    else
      Event.$emit('hideNotification');

    csInterface.evalScript(`setLocation('${self.tempPath}')`)
  },
  methods: {
    getVersion() {
      const path = csInterface.getSystemPath(SystemPath.EXTENSION);
      const xml = window.cep.fs.readFile(`${path}/CSXS/manifest.xml`);
      const verID = /(\w|\<|\s|\=|\"|\.)*ExtensionBundleVersion\=\"(\d|\.)*(?=\")/;
      let match = xml.data.match(verID);
      if (match.length) {
        const str = match[0].split(' ');
        this.buildNumber = str[(str.length - 1)].replace(/\w*\=\"/, '');
      } else {
        this.buildNumber = 'unknown';
      }
      Event.$emit('console.string', this.buildNumber);
    },
    tryFetch() {
      fetch('http://inventsable.cc/master.json')
        .then(function (response) {
          return response.json();
        })
        .then(function (myJson) {
          console.log(myJson);
          Event.$emit('checkHTMLData', myJson);
        });
      Event.$emit('console.full', this.buildNumber);
    },
    checkHTMLData(result) {
      for (let [key, value] of Object.entries(result.master)) {
        if (key == this.rootName) {
          if (value.version !== this.buildNumber) {
            Event.$emit('promptUpdate', JSON.stringify(value));
            Event.$emit('console.full', JSON.stringify(value))
            this.needsUpdate = true;
          } else {
            this.needsUpdate = false;
          }
        }
      }
    },
    startDebug() {
      this.debugMode = true;
      console.log('Received')
      if (this.isWake) {
        console.log('sending clone');
        this.dispatchEvent('debug.listen', JSON.stringify(this.clone));
      }
    },
    stopDebug() { 
      this.debugMode = false; 
      console.log('Stopping debug')
    },
    dispatchEvent(name, data) {
      var event = new CSEvent(name, 'APPLICATION');
      event.data = data;
      csInterface.dispatchEvent(event);
    },
    readStorage() {
      var storage = window.localStorage;
      if (!storage.length) {
        console.log('There was no pre-existing session data');
        this.updateStorage();
      } else {
        console.log('Detected previous session data');
        this.context.menu = JSON.parse(storage.getItem('contextmenu'));
        this.notificationsEnabled = JSON.parse(storage.getItem('notificationsEnabled'));
        this.totalNodes = JSON.parse(storage.getItem('nodeList'));
        this.rememberContextMenu(storage);
        console.log(storage);
      }
      console.log('Sending event...')
      Event.$emit('rebuild');
    },
    updateStorage() {
      var storage = window.localStorage, self = this;
      storage.setItem('contextmenu', JSON.stringify(self.context.menu));
      storage.setItem('notificationsEnabled', JSON.stringify(self.notificationsEnabled));
      storage.setItem('nodeList', JSON.stringify(self.totalNodes));
      this.setContextMenuMemory(storage);
      console.log(storage);
    },
    setContextMenuMemory(storage) {
      for (var i = 0; i < this.context.menu.length; i++) {
        var target = this.context.menu[i], name = target.id;
        if (target.checkable) {
          // console.log(name);
          // console.log(this[name])
          storage.setItem(name, this[name]);
        }
      }
    },
    rememberContextMenu(storage) {
      for (var i = 0; i < this.context.menu.length; i++) {
        var target = this.context.menu[i], name = target.id;
        if (target.checkable) {
          // console.log(name)
          this[name] = JSON.parse(storage.getItem(name));
          this.context.menu[i].checked = this[name];
        }
      }
    },
    setContextMenu() {
      var self = this;
      csInterface.setContextMenuByJSON(self.menuString, self.contextMenuClicked);
    },
    contextMenuClicked(id) {
      var target = this.findMenuItemById(id), parent = this.findMenuItemById(id, true);
      if (id == "refresh") {
        location.reload();
      } else if (id == 'about') {
        cep.util.openURLInDefaultBrowser(this.homepage);
      } else if (id == 'test') {
        loadJSX(csInterface.hostEnvironment.appName + '/host.jsx');
      } else if (id == 'notificationsEnabled') {
        this.notificationsEnabled = !this.notificationsEnabled;
        if (this.notificationsEnabled)
          Event.$emit('showNotification');
        else
          Event.$emit('hideNotification');
      } else {
        this[id] = !this[id];
        var target = this.findMenuItemById(id);
        target.checked = this[id];
      }
      this.updateStorage();
    },
    findMenuItemById(id, requested = false) {
      var child, parent;
      for (var i = 0; i < this.context.menu.length; i++) {
        for (let [key, value] of Object.entries(this.context.menu[i])) {
          if (key == "menu") {
            parent = this.context.menu[i];
            for (var v = 0; v < value.length; v++) {
              for (let [index, data] of Object.entries(value[v])) {
                if ((index == "id") && (data == id))
                  child = value[v];
              }
            }
          }
          if ((key == "id") && (value == id)) {
            child = this.context.menu[i], parent = 'root';
          }
        }
      }
      return (requested) ? parent : child;
    },
    toggleMenuItemSiblings(parent, exclude, state) {
      if (parent.length) {
        for (var i = 0; i < parent.length; i++) {
          if (parent[i].id !== exclude)
            csInterface.updateContextMenuItem(parent[i].id, true, state);
        }
      }
    },
    parseModifiers(evt) {
      var lastMods = [this.Ctrl, this.Shift, this.Alt]
      if (this.isWake) {
        if (((!this.macOS) && (evt.ctrlKey)) || ((this.macOS) && (evt.metaKey))) {
          this.Ctrl = true;
        } else {
          this.Ctrl = false;
        }
        if (evt.shiftKey)
          this.Shift = true;
        else
          this.Shift = false;
        if (evt.altKey) {
          evt.preventDefault();
          this.Alt = true;
        } else {
          this.Alt = false;
        };
        var thisMods = [this.Ctrl, this.Shift, this.Alt]
        // if (!this.isEqualArray(lastMods, thisMods))
        // console.log(`${thisMods} : ${lastMods}`)
        // Event.$emit('updateModsUI');
      } else {
        // Event.$emit('clearMods');
      }
    },
    flushModifiers() {
      this.Ctrl = false;
      this.Shift = false;
      this.Alt = false;
      Event.$emit('clearMods');
    },
    wake() {
      this.isWake = true;
    },
    sleep() {
      this.isWake = false;
      this.flushModifiers();
    },
    getCSS(prop) {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop);
    },
    setCSS(prop, data) {
      document.documentElement.style.setProperty('--' + prop, data);
    },
    healResults() {
      // console.log('Healing...')
      // let mirror = this.totalNodes;
      // mirror = this.removeDuplicatesInArray(mirror);
      // mirror = this.removeEmptyValues(mirror);
      // this.totalNodes = mirror;
      // console.log(this.totalNodes);
    },
    isEqualArray(array1, array2) {
      array1 = array1.join().split(','), array2 = array2.join().split(',');
      var errors = 0, result;
      for (var i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i])
          errors++;
      }
      if (errors > 0)
        result = false;
      else
        result = true;
      return result;
    },
    removeEmptyValues(keyList, mirror = []) {
      for (var i = 0; i < keyList.length; i++) {
        var targ = keyList[i];
        if ((/\s/.test(targ)) || (targ.length < 2)) {
          // no action
        // } else if ((targ === "null") || (targ == 'undefined')) {
          // no action
        } else {
          mirror.push(targ);
        }
      }
      return mirror;
    },
    removeDuplicatesInArray(keyList) {
      try {
        var uniq = keyList
          .map((name) => {
            return { count: 1, name: name }
          })
          .reduce((a, b) => {
            a[b.name] = (a[b.name] || 0) + b.count
            return a
          }, {})
        var sorted = Object.keys(uniq).sort((a, b) => uniq[a] < uniq[b])
      } catch (err) {
        sorted = keyList
      } finally {
        return sorted;
      }
    },
  }
});

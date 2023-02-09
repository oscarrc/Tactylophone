let active = false;
let keyId = null;
let touchId = null;
let pwa = null;

const IS_APP = document.referrer.includes('android-app://me.oscarrc.tactylophone.twa');
const IS_PWA = window.matchMedia('(display-mode: fullscreen)').matches;
const IS_APPROVED = true;
const TUNING_MODES = [0.5, 1, 2];
const FREQUENCIES = {
    "1": 110,
    "1.5": 116.54,
    "2": 123.47,
    "3": 130.81,
    "3.5": 138.59,
    "4": 146.83,
    "4.5": 155.56,
    "5": 164.81,
    "6": 174.61,
    "6.5": 185.00,
    "7": 196.00,
    "7.5": 207.65,
    "8": 220.00,
    "8.5": 233.08,
    "9": 246.94,
    "10": 261.63,
    "10.5": 277.18,
    "11":293.66,
    "11.5": 311.13,
    "12": 329.63
}

// OSCILLATOR
const osc = {
    context: null,
    instance: null,
    enabled: false,
    tuning: 1,
    vibrato: {
        instance: null,
        enabled: false,
        start: function(){
            if(!osc.context || !osc.instance || !osc.enabled) return;
        
            const oscillator = osc.context.createOscillator();
            const envelopeEffect = osc.context.createGain();
            
            if(this.instance) this.instance.disconnect();
    
            oscillator.frequency.value = 5
            envelopeEffect.gain.value = 5;
    
            oscillator.connect(envelopeEffect).connect(osc.instance.frequency);
            oscillator.start();
            
            this.instance = oscillator;
        },
        stop: function(){        
            if(!this.instance) return;
            this.instance.stop();
            this.instance.disconnect();
        },
        toggle: function(){
            this.enabled = !this.enabled;
            if(!this.enabled) this.stop();
            else this.start();
        }
    },    
    play: function(note) {
        if(!note) return
        if(!this.enabled) return;
        if(!this.context) this.context = new AudioContext();
        
        const freq = FREQUENCIES[note];
        const osc = this.context.createOscillator();
        const envelope = this.context.createGain();
        
        if(this.instance) this.instance.disconnect();

        osc.type = "square";
        osc.frequency.value = freq * this.tuning;
        envelope.gain.value = 0.3;

        osc.connect(envelope);
        envelope.connect(this.context.destination);
        osc.start();
        
        this.instance = osc;

        this.vibrato.enabled && this.vibrato.start();
    },
    stop: function() {
        if(!this.instance) return;
        this.instance.stop();
        this.instance.disconnect();
    },
    tune: function(tuning) {
        if(!TUNING_MODES.includes(tuning)) return;
        if(this.instance) this.instance.frequency.value = (this.instance.frequency.value / this.tuning) * tuning;
        this.tuning = tuning;
    },
    toggle: function(){
        this.enabled = !this.enabled;
        if(!this.enabled) this.stop();
    }
}

// KEYBOARD AN KEY EVENT HANDLERS

// Mouse events
const keyMouseEvents = {
    mousedown: (e) => {
        const note = e.target.getAttribute("data-key");
        active = true;
        osc.play(note);
    },
    mouseup: () => {
        active = false
        osc.stop();
    },
    mouseenter: (e) => {
        const note = e.target.getAttribute("data-key");
        active && osc.play(note)
    },
    mouseleave: osc.stop
}

// Touch events
const keyTouchEvents = {
    touchstart: (e)=> {    
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.pageX,touch.pageY);    
        const note = target.getAttribute("data-key");    
        
        if(touch.identifier !== touchId && touchId !== null) return;
        
        touchId = touch.identifier;
        keyId = target?.id;
        
        osc.play(note);
    },
    touchmove: (e) => {
        const touch = Object.values(e.changedTouches).filter(t => t.identifier === touchId)?.[0];
        if(!touch) return;
    
        const target = document.elementFromPoint(touch.pageX,touch.pageY);
        const note = target?.getAttribute("data-key");

        if(target?.id === keyId) return;

        keyId = target?.id;
        
        osc.stop();
        osc.play(note);
    },
    touchend: (e) => {
        if(Object.values(e.changedTouches).filter( t => t.identifier === touchId).length === 0 ) return;
        touchId = null;
        osc.stop();
    }
}

const initKeyboard = () => {
    const keys = document.getElementsByClassName("key");
    const keyboard = document.getElementById("keys");
    
    // Mouse events
    keyboard.addEventListener("mouseleave", () => {
        active = false;
        osc.stop();
    });

    Object.values(keys).forEach( key => {
        Object.keys(keyMouseEvents).forEach( event => {
            key.addEventListener(event, keyMouseEvents[event], { pasive: false })
        })
    })

    // Touch events
    Object.keys(keyTouchEvents).map( event => {
        document.getElementById("keyboard").addEventListener(event, keyTouchEvents[event], { passive: true });
    })
}

// SWITCHES AND TOGGLES

// Tuning toggle
const setToggleListeners = () => {
    const toggle = document.getElementsByClassName("toggle-value");
    
    Object.values(toggle).forEach( t => {
        t.addEventListener("touchstart", setTuning, { passive: false });
        t.addEventListener("change", setTuning)
    })
}

// Tuning setter
const setTuning = (e) => {
    let mode = parseFloat(e.target.value);

    if(e.type === "touchstart"){
        e.preventDefault();
        e.target.checked = true;
    };

    if(e.type === "keydown"){
        mode = TUNING_MODES[e.key - 1];
        document.querySelector(`.toggle-value[value='${mode}']`).checked = true;
    }
    
    osc.tune(mode);
}

// Power and vibrato switcehs
const setSwitchListeners = () => {
    document.getElementById("power-switch").addEventListener("click", togglePower);
    document.getElementById("vibrato-switch").addEventListener("click", toggleVibrato);
    document.getElementById("power-switch").addEventListener("touchstart", togglePower, { passive: false });
    document.getElementById("vibrato-switch").addEventListener("touchstart", toggleVibrato, { passive: false });
}

// Vibrato toggle setter
const toggleVibrato = (e) => {    
    if (e.type === "touchstart") e.preventDefault();

    osc.vibrato.toggle();
    
    document.getElementById("vibrato-handle").setAttribute("y", osc.vibrato.enabled ? 308.6 : 283.6);
    document.getElementById("vibrato-switch").setAttribute("aria-checked", osc.vibrato.enabled);
};

// Power toggle setter
const togglePower = (e) => {
    if (e.type === "touchstart") e.preventDefault();
    
    osc.toggle();
    
    document.getElementById("power-handle").setAttribute("y", osc.enabled ? 308.6 : 283.6);
    document.getElementById("power-switch").setAttribute("aria-checked", osc.enabled);
};

// Keyboard bindinds
const keyboardBindigs = {
    "v": toggleVibrato,
    "p": togglePower,
    1 : setTuning,
    2 : setTuning,
    3 : setTuning
}

const setKeyboardBindings = () => {
    document.addEventListener("keydown", (e) => {
        const lowercaseKey = e.key.toLowerCase();
        if(!Object.keys(keyboardBindigs).includes(lowercaseKey)) return;
        keyboardBindigs[lowercaseKey](e);
    })
}

// UI

// Loader handler
const handleLoader = () => {
    const loader = document.getElementById("loader");
    const logo = document.getElementById("tactylophone-logo");
    
    if(IS_APP || IS_PWA) return loader.remove();
    
    if("onanimationend" in logo){
        logo.addEventListener("animationend", () => {
            loader.style.opacity = 0;

            if("ontransitionend" in loader){ 
                loader.addEventListener("transitionend", () => {
                    document.getElementById("main").style.opacity = 1;
                    loader.remove();
                })     
            }else{
                document.getElementById("main").style.opacity = 1;
                loader.remove();
            }           
        }, false);
    }else{
        loader.remove();
    }
}

// Fullscreen handler
const requestFullscreen = () => {
    const elem = document.documentElement;
    const fullscreenButton = document.getElementById("fullscreen");
    const fullscreenIcon = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M290 236.4l43.9-43.9a8.01 8.01 0 0 0-4.7-13.6L169 160c-5.1-.6-9.5 3.7-8.9 8.9L179 329.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L370 423.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L290 236.4zm352.7 187.3c3.1 3.1 8.2 3.1 11.3 0l133.7-133.6 43.7 43.7a8.01 8.01 0 0 0 13.6-4.7L863.9 169c.6-5.1-3.7-9.5-8.9-8.9L694.8 179c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L600.3 370a8.03 8.03 0 0 0 0 11.3l42.4 42.4zM845 694.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L654 600.3a8.03 8.03 0 0 0-11.3 0l-42.4 42.3a8.03 8.03 0 0 0 0 11.3L734 787.6l-43.9 43.9a8.01 8.01 0 0 0 4.7 13.6L855 864c5.1.6 9.5-3.7 8.9-8.9L845 694.9zm-463.7-94.6a8.03 8.03 0 0 0-11.3 0L236.3 733.9l-43.7-43.7a8.01 8.01 0 0 0-13.6 4.7L160.1 855c-.6 5.1 3.7 9.5 8.9 8.9L329.2 845c6.6-.8 9.4-8.9 4.7-13.6L290 787.6 423.7 654c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.4z"></path></svg>'
    const restoreIcon = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M391 240.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L200 146.3a8.03 8.03 0 0 0-11.3 0l-42.4 42.3a8.03 8.03 0 0 0 0 11.3L280 333.6l-43.9 43.9a8.01 8.01 0 0 0 4.7 13.6L401 410c5.1.6 9.5-3.7 8.9-8.9L391 240.9zm10.1 373.2L240.8 633c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L146.3 824a8.03 8.03 0 0 0 0 11.3l42.4 42.3c3.1 3.1 8.2 3.1 11.3 0L333.7 744l43.7 43.7A8.01 8.01 0 0 0 391 783l18.9-160.1c.6-5.1-3.7-9.4-8.8-8.8zm221.8-204.2L783.2 391c6.6-.8 9.4-8.9 4.7-13.6L744 333.6 877.7 200c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.3a8.03 8.03 0 0 0-11.3 0L690.3 279.9l-43.7-43.7a8.01 8.01 0 0 0-13.6 4.7L614.1 401c-.6 5.2 3.7 9.5 8.8 8.9zM744 690.4l43.9-43.9a8.01 8.01 0 0 0-4.7-13.6L623 614c-5.1-.6-9.5 3.7-8.9 8.9L633 783.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L824 877.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L744 690.4z"></path></svg>'

    if((window.innerWidth == screen.width && window.innerHeight == screen.height)){
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen)  document.webkitExitFullscreen();
        
        fullscreenButton.innerHTML = fullscreenIcon
        fullscreenButton.setAttribute("data-tooltip", "Fullscreen");
    }else{        
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen)  elem.msRequestFullscreen();
        
        fullscreenButton.innerHTML = restoreIcon
        fullscreenButton.setAttribute("data-tooltip", "Restore");
    }
}

const handleFullscreen = () => {
    const fullscreenButton = document.getElementById("fullscreen");
    if(IS_APP || IS_PWA) fullscreenButton.remove();
    else fullscreenButton.addEventListener("click", requestFullscreen);
}


// PWA

// Store event
const handlePWA = () => {
    const pwaIcon = document.getElementById("pwa");
    if(IS_APP || IS_PWA) pwaIcon.remove();
    
    window.addEventListener("beforeinstallprompt", (e) => {
        document.getElementById("fab-more").append(pwaIcon);
        pwaIcon.addEventListener("click", promptPWA)
        pwa = e
    });
}

// Propmt install
const promptPWA = (e) => {
    e.stopPropagation();
    e.preventDefault();
    pwa && pwa.prompt();
}

// APP INITIALIZATION

const init = () => {
    handlePWA();
    handleLoader();
    handleFullscreen();
    initKeyboard();
    setSwitchListeners();
    setToggleListeners();
    setKeyboardBindings();
}

if(IS_APP && !IS_APPROVED ) document.getElementById("ko-fi").remove();

navigator.serviceWorker.register("worker.js", { scope: '/' });
window.addEventListener("blur", () => { 
    osc.stop(); 
    active = false
});
document.addEventListener("DOMContentLoaded", init);
let oscillator = null;
let audioContext = null;
let vibrato =  false;
let power = false;
let tuning = 1;
let active = false;
let keyId = null;
let touchId = null;
let pwa = null;

const IS_APP = document.referrer.includes('android-app://me.oscarrc.tactylophone.twa');
const IS_PWA = window.matchMedia('(display-mode: fullscreen)').matches;
const IS_APPROVED = false;
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

const toggleVibrato = () => {
    vibrato = !vibrato;
    document.getElementById("vibrato-handle").setAttribute("y", vibrato ? 308.6 : 283.6);
    document.getElementById("vibrato-switch").setAttribute("aria-checked", vibrato);
};

const togglePower = () => {
    power = !power;   
    document.getElementById("power-handle").setAttribute("y", power ? 308.6 : 283.6);
    document.getElementById("power-switch").setAttribute("aria-checked", power);
   
    if(!power) audioContext = null;
    else if(power && !audioContext) audioContext = new AudioContext();
};

const setTunning = (mode) => {
    if(![0.5, 1, 2].includes(mode)) return;
    tuning = mode;
}

const vibratoEffect = (param) => {
    if(!audioContext || !power) return;

    const oscEffect = audioContext.createOscillator();
    oscEffect.frequency.value = 5

    const envelopeEffect = audioContext.createGain();
    envelopeEffect.gain.value = 5;

    oscEffect.connect(envelopeEffect).connect(param);
    oscEffect.start();
}

const playNote = (note) => {
    if(!note) return
    if(!power) return;
    else if(!audioContext) audioContext = new AudioContext();
    
    const freq = FREQUENCIES[note];
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    
    if(oscillator) oscillator.disconnect();

    osc.type = "square";
    osc.frequency.value = freq * tuning;
    envelope.gain.value = 0.3;

    osc.connect(envelope);
    envelope.connect(audioContext.destination);        
    
    oscillator = osc;

    osc.start();
    vibrato && vibratoEffect(osc.frequency)
}

const stopNote = () => {
    if(!oscillator) return;
    oscillator.stop();
    oscillator.disconnect();
}

const handleTouchStart = (e)=> {    
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.pageX,touch.pageY);    
    const note = target.getAttribute("data-key");

    if(!note) return;    
    if(touch.identifier !== touchId && touchId !== null) return;
        
    e.preventDefault();
    e.stopPropagation();
    
    playNote(note);
    touchId = touch.identifier;
    keyId = target?.id;
}

const handleTouchEnd = (e) => {
    if(Object.values(e.touches).filter( t => t.identifier === touchId).length > 0 ) return;
    touchId = null;
    stopNote();
}

const handleTouchMove = (e) => {
    const touch = Object.values(e.touches).filter(t => t.identifier === touchId)?.[0];
    if(!touch) return;

    const target = document.elementFromPoint(touch.pageX,touch.pageY);
    const note = target.getAttribute("data-key");
    
    if(target?.id === keyId) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    stopNote();
    playNote(note);
    
    keyId = target?.id;
}

const mouseEventListeners = {
    mousedown: (e) => {
        const note = e.target.getAttribute("data-key");
        active = true;
        playNote(note);
    },
    mouseup: () => {
        active = false
        stopNote();
    },
    mouseenter: (e) => {
        const note = e.target.getAttribute("data-key");
        active && playNote(note)
    },
    mouseleave: stopNote
}

const setMouseEventListeners = () => {
    const keys = document.getElementsByClassName("key");
    
    Object.values(keys).forEach( key => {
        Object.keys(mouseEventListeners).forEach( event => {
            key.addEventListener(event, mouseEventListeners[event], { pasive: false })
        })
    })
}

const setToggleEventListeners = () => {
    const toggle = document.getElementsByClassName("toggle-value");
    
    Object.values(toggle).forEach( value => {
        value.addEventListener("change", function(){tuning = parseFloat(this.value)})
    })
}

const setTouchEventListeners = () => {
    document.getElementById("keys").addEventListener("touchstart", handleTouchStart, { passive: true });
    document.getElementById("keys").addEventListener("touchmove", handleTouchMove, { passive: true });
    document.getElementById("keys").addEventListener("touchend", handleTouchEnd, { passive: true });
}

const setSwitchEventListeners = () => {
    document.getElementById("power-switch").addEventListener("click", togglePower);
    document.getElementById("vibrato-switch").addEventListener("click", toggleVibrato);
}

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

const handlePWA = () => {
    const pwaIcon = document.getElementById("pwa");
    if(IS_APP || IS_PWA) pwaIcon.remove();
    
    window.addEventListener("beforeinstallprompt", (e) => {
        document.getElementById("fab-more").append(pwaIcon);
        pwaIcon.addEventListener("click", promptPWA)
        pwa = e
    });
}

const promptPWA = (e) => {
    e.stopPropagation();
    e.preventDefault();
    pwa && pwa.prompt();
}

const init = () => {
    handlePWA();
    handleLoader();
    handleFullscreen();
    setMouseEventListeners();
    setTouchEventListeners();
    setSwitchEventListeners();
    setToggleEventListeners();
}

if(IS_APP && !IS_APPROVED ) document.getElementById("ko-fi").remove();

navigator.serviceWorker.register("worker.js", { scope: '/' });
window.addEventListener("blur", () => { 
    active = false; 
    stopNote(); 
});
document.addEventListener("DOMContentLoaded", init);
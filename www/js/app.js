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
        active = true;
        const note = e.target.getAttribute("data-key");
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
    if(IS_APP) loader.remove()
    else {
        document.getElementById("tactylophone-logo").addEventListener("animationend", () => {
            loader.style.opacity = 0;
            loader.addEventListener("transitionend", () => {
                document.getElementById("main").style.opacity = 1;
                loader.remove();
            })
        }, false);
    }    
}

const handlePWA = () => {
    document.getElementById("pwa").style.display = "none";    
    window.addEventListener("beforeinstallprompt", (e) => {
        document.getElementById("pwa").style.display = "flex";
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
    setMouseEventListeners();
    setTouchEventListeners();
    setSwitchEventListeners();
    setToggleEventListeners();
}

if(IS_APP){
    document.getElementById("pwa").remove();
    !IS_APPROVED && document.getElementById("ko-fi").remove();
}

navigator.serviceWorker.register("worker.js", { scope: '/' });
window.addEventListener("blur", () => { 
    active = false; 
    stopNote(); 
});
document.addEventListener("DOMContentLoaded", init);
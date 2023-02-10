class PWA{
    #installable = false;
    #installer = null;

    constructor(){
        window.addEventListener('beforeinstallprompt', (e) => {
            this.#installable = true;
            this.#installer = e
        });

        this.isPWA = window.matchMedia('(display-mode: fullscreen)').matches;
        this.isTWA = document.referrer.includes('android-app://me.oscarrc.tactylophone.twa');
    }

    get installable(){
        return this.#installable;
    }

    install(){
        this.#installable && this.#installer.prompt();
        this.#installer.userChoice.then((choiceResult) => {
            if(choiceResult.outcome === 'accepted') this.#installable = false;
        });
    }
}

export default PWA;
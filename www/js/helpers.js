const requestFullscreen = () => {
    const elem = document.documentElement;
    
    if((window.innerWidth == screen.width && window.innerHeight == screen.height)){
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen)  document.webkitExitFullscreen();
        
        return true;
    }else{        
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen)  elem.msRequestFullscreen();
        
        return false;
    }
}

const checkFullscreen = () => {    
    const elem = document.documentElement;
    return ["requestFullscreen", "webkitRequestFullscreen", "msRequestFullscreen"].some( p => p in elem)
}

export { requestFullscreen, checkFullscreen }
function LBar(){
    document.getElementById("sideL").classList.add("side-handle-activate");
    document.getElementById("sideR").classList.remove("side-handle-right-activate");
}
function RBar(){
    document.getElementById("sideL").classList.remove("side-handle-activate");
    document.getElementById("sideR").classList.add("side-handle-right-activate");
}
document.getElementById("sideL").addEventListener("click",LBar);
document.getElementById("sideR").addEventListener("click",RBar);

function LMBar(){
    document.getElementById('mobileSidebarL').classList.toggle('mobile-left-activate');  
    document.getElementById('mobileSidebarR').classList.remove('mobile-right-activate');
}
function RMBar(){
    document.getElementById('mobileSidebarR').classList.toggle('mobile-right-activate'); 
    document.getElementById('mobileSidebarL').classList.remove('mobile-left-activate');
}
// Wait for the page to load first
window.onload = function() {
    var links = document.getElementsByClassName("about-movie-selection-text");
    for (var i = 0; i < links.length; i++) {
        var a = links.item(i);
        a.onclick = function() {
            changeURLWithoutRedirect(document.location.pathname.substring(0, 3) + this.getAttribute("href"));
            //window.history.pushState("object or string", "Title", document.location.pathname.substring(0,3)+a.getAttribute("href"));
            acquireContent(this.getAttribute("href").substring(1));
            return false; //to not redirect
        }
    }
    
}
document.getElementById("topLButton").addEventListener("click",LMBar);
document.getElementById("topRButton").addEventListener("click",RMBar);

function changeURLWithoutRedirect(URL){
    window.history.pushState("", "Zeme, kas dzied", URL);
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
window.addEventListener('popstate', (event) => {
    window.location.href = window.location.href;
  });
  
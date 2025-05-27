document.addEventListener('DOMContentLoaded', async () => {
    // create the data service
    window.dataService = await new DataService();
    window.dataService.init().then(async () => {
        console.log("Data service created");
        console.log(window.dataService);
        
        currentComponent = 'home';
        await loadComponent(currentComponent);

        updateUI();
        setInterval(updateUI, 1000);
    });
});

async function loadComponent(name) {
    // call cleanup on the current component
    if (window.components?.[currentComponent]?.cleanup) {
        window.components[currentComponent].cleanup();
    }

    const htmlPath = `./components/${name}/${name}.html`;
    const jsPath = `./components/${name}/${name}.js`;
    const cssPath = `./components/${name}/${name}.css`;

    // load the css
    const oldStylesheet = document.getElementById('component-stylesheet');
    if (oldStylesheet) {
        oldStylesheet.remove();
    }

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = cssPath;
    stylesheet.id = 'component-stylesheet';
    stylesheet.onload = () => {
        const module = window.components?.[name];
        if (module?.loadStyles) {
            module.loadStyles();
        }
    }

    document.head.appendChild(stylesheet);

    // load the html
    const componentContainer = document.querySelector('.component-container');
    const response = await fetch(htmlPath);
    const html = await response.text();
    componentContainer.innerHTML = html;

    // load the js
    const oldScript = document.getElementById('component-script');
    if (oldScript) {
        oldScript.remove();
    }

    const script = document.createElement('script');
    script.src = jsPath;
    script.id = 'component-script';
    // call loadPage on the new component
    script.onload = () => {
        const module = window.components?.[name];
        if (module?.loadPage) {
            module.loadPage();
            currentComponent = name;
        }
    }

    document.body.appendChild(script);
}

function updateUI() {
    updateDateTime();
    updateHeaderColor();
}

function updateDateTime() {
    const timeElement = document.querySelector('.time-text');
    const dateElement = document.querySelector('.date-text');

    const now = new Date();

    // Format time as h:mm AM/PM
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    timeElement.textContent = `${hours}:${minutes}`;

    // Format date like "Thursday, May 22"
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString(undefined, options);
}

function updateHeaderColor() {
    const header = document.querySelector('.header');
    const unoccupied = window.dataService.getRoomStatus().unoccupied;
    if (unoccupied) {
        header.style.backgroundColor = "#74be06"; // Green
    } else {
        header.style.backgroundColor = "#F44336"; // Red
    }
}


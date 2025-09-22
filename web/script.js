document.addEventListener('DOMContentLoaded', async () => {
    window.schedulerError = new schedulerError("");
    // create the data service
    window.dataService = await new DataService();
    window.dataService.init().then(async () => {
        console.log("Data service created");
        console.log(window.dataService);

        currentComponent = 'home';
        await loadComponent(currentComponent);
        await loadBgImage();

        updateUI();
        setInterval(updateUI, 1000);

        // reset error state every 5 minutes
        setInterval(() => window.schedulerError.clear(), 5 * 60 * 1000);
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
    componentContainer.classList.add('loading'); // hide before loading

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
        componentContainer.classList.remove('loading'); // finally show it
    };

    document.body.appendChild(script);
}

async function loadBgImage() {
    const html = document.querySelector('html');
    const image = await window.dataService.getBgImage();
    if (image) {
        const url = URL.createObjectURL(image);
        html.style.backgroundImage = `url(${url})`;
        html.style.backgroundSize = 'cover';
    }
    else {
        console.warn("No background image found, using default.");
        html.style.backgroundImage = 'url(assets/bg.png)';
        html.style.backgroundSize = 'cover';
    }
}


function updateUI() {
    updateDateTime();
    updateHeaderColor();
    checkErrorState();
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
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
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

function showHelp() {
    const helpContainer = document.querySelector('.help-container');
    if (helpContainer) {
        helpContainer.classList.remove('hidden');
    } else {
        console.warn("Help container not found");
    }
}

function showError() {
    const errorContainer = document.querySelector('.error-modal');
    const errorMessage = document.querySelector('.error-message');
    errorMessage.textContent = window.schedulerError.message || "An unknown error occurred.";
    errorContainer.classList.remove('hidden');
}

function closeHelp() {
    const helpContainer = document.querySelector('.help-container');
    if (helpContainer) {
        helpContainer.classList.add('hidden');
    } else {
        console.warn("Help container not found");
    }

    const getHelp = document.querySelector('.get-help');

    getHelp.classList.remove('hidden');
    const helpConfirmation = document.querySelector('.help-confirmation');
    helpConfirmation.classList.add('hidden');
}

function closeError() {
    const errorModal = document.querySelector('.error-modal');
    window.schedulerError.clear();
    if (errorModal) {
        errorModal.classList.add('hidden');
    } else {
        console.warn("Error container not found");
    }
}

async function requestHelp() {
    const roomId = window.dataService.config._id;
    console.log("Requesting help for room ID:", roomId);

    const getHelp = document.querySelector('.get-help');
    const helpConfirmation = document.querySelector('.help-confirmation');
    const helpMessage = document.querySelector('.help-message');
    helpConfirmation.classList.remove('hidden');
    closeConfirmationButton = document.querySelector('.close-confirmation-button');
    closeConfirmationButton.classList.add('hidden');

    getHelp.classList.add('hidden');

    // Show spinner while waiting
    helpMessage.innerHTML = `<span class="spinner"></span>Sending help request...`;

    try {
        const res = await window.dataService.sendHelpRequest(roomId);
        console.log("Help request sent:", res);
        closeConfirmationButton.classList.remove('hidden');
        helpMessage.textContent = "Your help request has been received; a member of our support staff is on their way.";
    } catch (err) {
        closeConfirmationButton.classList.remove('hidden');
        console.error("Help request failed:", err);
        helpMessage.textContent = "Your help request failed to send; please try again or call AV Support at 801-422-7671.";

    }
}

function checkErrorState() {
    if (window.schedulerError.isError) {
        errorContainer = document.querySelector('.error-container');
        errorContainer.classList.remove('hidden');
    } else {
        errorContainer = document.querySelector('.error-container');
        errorContainer.classList.add('hidden');
    }
}

// error class
class schedulerError {
    constructor(message, isError = false) {
        this.message = message;
        this.isError = isError;
    }

    clear() {
        this.isError = false;
        this.message = "";
    }
}


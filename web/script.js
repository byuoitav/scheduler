document.addEventListener('DOMContentLoaded', async () => {
    const header = document.querySelector('header');
    const componentContainer = document.querySelector('.component-container');
    const footer = document.querySelector('footer');

    loadComponent('home');
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
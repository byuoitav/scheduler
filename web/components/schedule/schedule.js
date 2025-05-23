window.components = window.components || {};

window.components.schedule = {
    loadPage: function () {
        console.log
        this.addBackArrow();
        this.addScheduleTitle();
        this.addNavButtons();
    },

    cleanup: function () {
        console.log("Cleaning up schedule component");
        const header = document.querySelector('.header');
        const backButton = header.querySelector('.back-button');
        if (backButton) {
            backButton.remove();
        }
        const title = header.querySelector('h1');
        if (title) {
            title.remove();
        }

        const footer = document.querySelector('.footer');
        const buttons = footer.querySelectorAll('button');
        buttons.forEach(button => {
            button.remove();
        });
        
    },

    addBackArrow: function () {
        console.log("Adding back arrow");
        const header = document.querySelector('.header');
        const backButton = document.createElement('div');
        backButton.classList.add('back-button');
        const backImg = document.createElement('img');
        backImg.src = "assets/arrow-left.svg";
        backImg.width = 60;
        backImg.height = 60;
        backButton.appendChild(backImg);
        backButton.addEventListener('click', () => {
            loadComponent('home');
        });
        header.appendChild(backButton);
    },

    addScheduleTitle: function () {
        const header = document.querySelector('.header');
        const title = document.createElement('h1');
        title.classList.add('schedule-title');
        title.textContent = "The JET Schedule";
        header.appendChild(title);
    },

    addNavButtons: function () {
        const footer = document.querySelector('.footer');
        if (true) {
            const helpButton = document.createElement('button');
            const helpImg = document.createElement('img');
            helpImg.src = "assets/help.svg";
            helpImg.width = 40;
            helpImg.height = 40;
            helpButton.appendChild(helpImg);
            helpButton.appendChild(document.createTextNode("Help"));
            footer.appendChild(helpButton);
           
        }
    }
}
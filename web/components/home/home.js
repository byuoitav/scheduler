window.components = window.components || {};

window.components.home = {
    loadPage: function () {
        this.addNavButtons();
    },

    cleanup: function () {
        console.log("Cleaning up home component");
        const footer = document.querySelector('.footer');
        const buttons = footer.querySelectorAll('button');
        buttons.forEach(button => {
            button.remove();
        });
    },

    addNavButtons: function () {
        console.log("Adding nav buttons");
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

        if (true) {
            const bookButton = document.createElement('button');
            const bookImg = document.createElement('img');
            bookImg.src = "assets/plus.svg";
            bookImg.width = 32;
            bookImg.height = 32;
            bookButton.appendChild(bookImg);
            bookButton.appendChild(document.createTextNode("Book Now"));
            footer.appendChild(bookButton);
            bookButton.addEventListener('click', () => {
                console.log("Book button clicked");
                loadComponent('book');
            });
        }

        if (true) {
            const scheduleButton = document.createElement('button');
            const scheduleImg = document.createElement('img');
            scheduleImg.src = "assets/schedule.svg";
            scheduleImg.width = 40;
            scheduleImg.height = 40;
            scheduleButton.appendChild(scheduleImg);
            scheduleButton.appendChild(document.createTextNode("View Schedule"));
            footer.appendChild(scheduleButton);
            scheduleButton.addEventListener('click', () => {
                console.log("Schedule button clicked");
                loadComponent('schedule');
            });
        }
    }
}
window.components = window.components || {};

window.components.book = {
    loadPage: function () {
        this.addBackArrow();
        this.addBookTitle();
        this.addNavButtons();
    },

    cleanup: function () {
        console.log("Cleaning up book component");
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

    addBookTitle: function () {
        const header = document.querySelector('.header');
        const title = document.createElement('h1');
        title.classList.add('book-title');
        title.textContent = "Booking The JET for Friday, May 23";
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

        if (true) {
            const cancelButton = document.createElement('button');
            const cancelImg = document.createElement('img');
            cancelImg.src = "assets/cancel.svg";
            cancelImg.width = 32;
            cancelImg.height = 32;
            cancelButton.appendChild(cancelImg);
            cancelButton.appendChild(document.createTextNode("Cancel"));
            footer.appendChild(cancelButton);
            cancelButton.addEventListener('click', () => {
                loadComponent('home');
            });
        }

        if (true) {
            const saveButton = document.createElement('button');
            const saveImg = document.createElement('img');
            saveImg.src = "assets/save.svg";
            saveImg.width = 32;
            saveImg.height = 32;
            saveButton.appendChild(saveImg);
            saveButton.appendChild(document.createTextNode("Save"));
            footer.appendChild(saveButton);
            saveButton.addEventListener('click', () => {
                console.log("Schedule button clicked");
                loadComponent('schedule');
            });
        }
    }
}
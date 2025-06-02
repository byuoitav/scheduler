window.components = window.components || {};

window.components.home = {
    intervalId: null,

    loadPage: function () {
        this.addNavButtons();
        this.setRoomNameAndAvailability();
        this.intervalId = setInterval(() => this.setRoomNameAndAvailability(), 1000);
    },

    cleanup: function () {
        console.log("Cleaning up home component");
        const footer = document.querySelector('.footer');
        const buttons = footer.querySelectorAll('button');
        buttons.forEach(button => {
            button.remove();
        });

        // Clear the interval
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    addNavButtons: function () {
        console.log("Adding nav buttons");
        const footer = document.querySelector('.footer');
        if (window.dataService.status.displayHelp) {
            const helpButton = document.createElement('button');
            const helpImg = document.createElement('img');
            helpImg.src = "assets/help.svg";
            helpImg.width = 40;
            helpImg.height = 40;
            helpButton.appendChild(helpImg);
            helpButton.appendChild(document.createTextNode("Help"));
            footer.appendChild(helpButton);

        }

        if (window.dataService.status.displayBookNow) {
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
    },

    setRoomNameAndAvailability: function () {
        const roomName = document.querySelector('.room-name');
        const roomStatus = document.querySelector('.available-text');
        const unoccupied = window.dataService.getRoomStatus().unoccupied;
        const currentEvent = window.dataService.getCurrentEvent();

        if (!unoccupied) {
            roomName.innerText = currentEvent.title;
            roomStatus.innerText = "IN USE";
            roomStatus.classList.add('occupied');
            roomStatus.classList.remove('unoccupied');
        } else {
            roomName.innerText = window.dataService.getRoomStatus().roomName;
            roomStatus.innerText = "AVAILABLE";
            roomStatus.classList.add('unoccupied');
            roomStatus.classList.remove('occupied');
        }
    }
}
window.components = window.components || {};

window.components.schedule = {
    loadPage: function () {
        console.log
        this.addBackArrow();
        this.addScheduleTitle();
        this.addNavButtons();
        this.addEvents();
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
        backImg.width = 50;
        backImg.height = 50;
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
        title.textContent = "Schedule";
        header.appendChild(title);
    },

    addNavButtons: function () {
        const footer = document.querySelector('.footer');
        if (window.dataService.status.displayHelp) {
            const helpButton = document.createElement('button');
            helpButton.onclick = () => {
                showHelp();
            };
            const helpImg = document.createElement('img');
            helpImg.src = "assets/help.svg";
            helpImg.width = 40;
            helpImg.height = 40;
            helpButton.appendChild(helpImg);
            helpButton.appendChild(document.createTextNode("Help"));
            footer.appendChild(helpButton);

        }
    },

    addEvents: function () {
        const eventList = document.querySelector('.schedule-list');
        if (!window.dataService || !window.dataService.getSchedule()) {
            console.warn("No schedule data available");
            return;
        }

        var schedule = window.dataService.getSchedule();
        schedule = this.sortEvents(schedule);

        // Get current local date (America/Denver)
        const now = new Date();
        const localYear = now.getFullYear();
        const localMonth = now.getMonth();
        const localDate = now.getDate();

        // Only keep events that are on the same local day
        schedule = schedule.filter(event => {
            // Convert event start time to local (America/Denver)
            const eventStart = new Date(event.startTime);
            const eventLocal = new Date(eventStart.toLocaleString('en-US', { timeZone: 'America/Denver' }));
            return (
                eventLocal.getFullYear() === localYear &&
                eventLocal.getMonth() === localMonth &&
                eventLocal.getDate() === localDate
            );
        });

        if (!schedule || schedule.length === 0) {
            console.warn("Schedule is empty");
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = "No events scheduled.";
            eventList.appendChild(emptyMessage);
            return;
        }

        schedule.forEach(event => {
            // console.log(event);
            const eventItem = document.createElement('div');
            eventItem.classList.add('schedule-item');

            const scheduleItemHeader = document.createElement('div');
            scheduleItemHeader.classList.add('schedule-item-header');

            // title of meeting
            const name = document.createElement('h2');
            name.classList.add('schedule-item-title');
            if (window.dataService.status.displayTitle) {
                name.textContent = event.title;
            } else {
                name.textContent = "In Use";
            }
            scheduleItemHeader.appendChild(name);

            const scheduleItemContent = document.createElement('div');
            scheduleItemContent.classList.add('schedule-item-content');

            // meeting length in hours and minutes
            scheduleItemLength = document.createElement('p');
            scheduleItemLength.classList.add('schedule-item-length');
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);
            const hours = this.calculateHours(event.startTime, event.endTime);
            const minutes = this.calculateMinutes(event.startTime, event.endTime);
            scheduleItemLength.textContent = `${hours} Hours ${minutes} minutes`;
            scheduleItemContent.appendChild(scheduleItemLength);

            // start time and end time (11:42 AM - 12:14 PM)
            const timeElement = document.createElement('p');
            timeElement.classList.add('schedule-item-times');
            const startTimeFormatted = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeFormatted = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timeElement.textContent = `${startTimeFormatted} - ${endTimeFormatted}`;
            scheduleItemContent.appendChild(timeElement);

            eventItem.appendChild(scheduleItemHeader);
            eventItem.appendChild(scheduleItemContent);
            eventList.appendChild(eventItem);

            const title = document.createElement('h2');
            title.textContent = event.title;


        });

    },

    calculateHours: function (startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = end - start; // difference in milliseconds
        const hours = Math.floor(diff / (1000 * 60 * 60)); // convert to hours
        return hours;
    },

    calculateMinutes: function (startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = end - start; // difference in milliseconds
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); // convert to minutes
        return minutes;
    },

    sortEvents: function (events) {
        return events.sort((a, b) => {
            const startA = new Date(a.startTime);
            const startB = new Date(b.startTime);
            return startA - startB; // Sort by start time
        });
    }
}
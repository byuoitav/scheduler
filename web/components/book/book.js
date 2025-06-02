window.components = window.components || {};

window.components.book = {
    loadPage: function () {
        this.addBackArrow();
        this.addBookTitle();
        this.addNavButtons();
        this.addKeyboard();
        this.populateTimeDropdowns();

        const saveButton = document.querySelector('.save-button');
        saveButton.addEventListener('click', () => {
            this.createEvent();
        });
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

        this.removeHeaderInfo();
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
        const dayOfWeek = this.getDayOfWeek();
        const dayOfMonth = this.getDayOfMonth();
        const monthName = this.getMonthName();
        const roomName = window.dataService.status.roomName;
        title.textContent = `Booking ${roomName} for ${dayOfWeek}, ${monthName} ${dayOfMonth}`;
        header.appendChild(title);
    },

    addNavButtons: function () {
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
            saveButton.classList.add('save-button');
            saveImg.src = "assets/save.svg";
            saveImg.width = 32;
            saveImg.height = 32;
            saveButton.appendChild(saveImg);
            saveButton.appendChild(document.createTextNode("Save"));
            footer.appendChild(saveButton);
        }
    },

    addKeyboard: function () {
        const body = document.querySelector('body');

        let keyboard;
        let keyboardContainer;
        let activeInput = null;
        let isShift = false;

        const removeKeyboard = () => {
            if (keyboardContainer && keyboardContainer.parentNode) {
                keyboardContainer.parentNode.removeChild(keyboardContainer);
                keyboardContainer = null;
                keyboard = null;
                activeInput = null;
            }
        };

        // Add keyboard only when focusing an input
        const input = document.querySelector(".event-title-input");
        input.addEventListener("focus", () => {
            // If already active and same input, do nothing
            if (keyboard && activeInput === input) return;

            removeKeyboard(); // remove old keyboard if needed

            activeInput = input;

            // Create container
            keyboardContainer = document.createElement('div');
            keyboardContainer.classList.add('simple-keyboard');

            Object.assign(keyboardContainer.style, {
                position: 'fixed',
                left: '0',
                right: '0',
                bottom: '0',
                height: '40vh',
                zIndex: '9999',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                background: '#181818',
                overflow: 'hidden'
            });

            body.appendChild(keyboardContainer);

            // Init keyboard
            keyboard = new SimpleKeyboard.default({
                rootElement: keyboardContainer,
                layout: {
                    default: [
                        "1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                        "q w e r t y u i o p",
                        "a s d f g h j k l {enter}",
                        "z x c v b n m",
                        "{shift} {space}"
                    ],
                    shift: [
                        "! @ # $ % ^ & * ( ) _ + {bksp}",
                        "Q W E R T Y U I O P",
                        "A S D F G H J K L {enter}",
                        "Z X C V B N M",
                        "{shift} {space}"
                    ]
                },
                layoutName: "default",
                onKeyPress: button => {
                    if (!activeInput) return;

                    let currentValue = activeInput.value || "";

                    if (button === "{bksp}") {
                        currentValue = currentValue.slice(0, -1);
                    } else if (button === "{space}") {
                        currentValue += " ";
                    } else if (button === "{shift}") {
                        isShift = !isShift;
                        keyboard.setOptions({
                            layoutName: isShift ? "shift" : "default"
                        });
                        return;
                    } else if (button === "{enter}") {
                        removeKeyboard();
                        return;
                    } else if (button.startsWith("{") && button.endsWith("}")) {
                        return;
                    } else {
                        currentValue += button;

                        if (isShift) {
                            isShift = false;
                            keyboard.setOptions({
                                layoutName: "default"
                            });
                        }
                    }


                    activeInput.value = currentValue;
                    keyboard.setInput(currentValue);
                }
            });

            keyboard.setInput(input.value);
        });


        // Hide keyboard when clicking outside inputs or keyboard
        document.addEventListener('mousedown', (e) => {
            // Delay to allow focus to fire first
            setTimeout(() => {
                if (
                    !e.target.closest('input') &&
                    !e.target.closest('textarea') &&
                    !e.target.closest('.simple-keyboard')
                ) {
                    removeKeyboard();
                }
            }, 0);
        });

    },

    generateTimeOptions: function () {
        const pad = n => n.toString().padStart(2, '0');
        const to12Hour = (h, m) => {
            const hour12 = ((h + 11) % 12 + 1);
            const suffix = h >= 12 ? 'PM' : 'AM';
            return `${hour12}:${pad(m)} ${suffix}`;
        };

        const now = new Date();
        let hour = now.getHours();
        let minute = now.getMinutes();

        // Round up to next 30 min increment
        if (minute >= 30) {
            hour += 1;
            minute = 0;
        } else {
            minute = 30;
        }

        const options = [];
        while (hour < 24) {
            options.push(to12Hour(hour, minute));
            minute += 30;
            if (minute >= 60) {
                minute = 0;
                hour += 1;
            }
        }

        return options;
    },


    populateTimeDropdowns: async function () {
        const events = await window.dataService.getSchedule();
        const options = this.generateTimeOptions(); // Times in Utah time zone

        const selectStart = document.querySelector('.event-start-time');
        const selectEnd = document.querySelector('.event-end-time');

        selectStart.innerHTML = '<option value="">Select start time</option>';
        selectEnd.innerHTML = '<option value="">Select end time</option>';

        // Helper: Convert local time string to UTC Date (DST safe)
        const toUTCDateFromLocalString = (timeStr) => {
            const [time, meridian] = timeStr.split(' ');
            let [hour, minute] = time.split(':').map(Number);
            if (meridian === "PM" && hour !== 12) hour += 12;
            if (meridian === "AM" && hour === 12) hour = 0;

            const now = new Date();
            // Build a date string for today in local time
            const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
            // Get the time in UTC as if it were in America/Denver (Utah, DST safe)
            const utahMillis = Date.parse(
                new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/Denver' })
            );
            return new Date(utahMillis);
        };

        const isStartTimeBlocked = (timeStr) => {
            const t = toUTCDateFromLocalString(timeStr);
            return events.some(event => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                return t >= start && t < end;
            });
        };

        const isEndTimeBlocked = (timeStr) => {
            const t = toUTCDateFromLocalString(timeStr);
            return events.some(event => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                return t > start && t <= end;
            });
        };

        for (const time of options) {
            // START OPTION
            const startBlocked = isStartTimeBlocked(time);
            const startOption = document.createElement('option');
            startOption.value = time;
            startOption.textContent = startBlocked ? `${time} (In Use)` : time;
            startOption.disabled = startBlocked;
            selectStart.appendChild(startOption);

            // END OPTION
            const endBlocked = isEndTimeBlocked(time);
            const endOption = document.createElement('option');
            endOption.value = time;
            endOption.textContent = endBlocked ? `${time} (In Use)` : time;
            endOption.disabled = endBlocked;
            selectEnd.appendChild(endOption);
        }
    },

    getDayOfWeek: function () {
        const now = new Date();
        const options = { weekday: 'long' };
        return now.toLocaleDateString('en-US', options);
    },

    getDayOfMonth: function () {
        const now = new Date();
        return now.getDate();
    },

    getMonthName: function () {
        const now = new Date();
        const options = { month: 'long' };
        return now.toLocaleDateString('en-US', options);
    },

    removeHeaderInfo: function () {
        console.log("Removing header info");
        const header = document.querySelector('.header');
        const bookTitle = header.querySelector('.book-title');
        if (bookTitle) {
            bookTitle.remove();
        }
    },

    createEvent: function () {
        const titleInput = document.querySelector('.event-title-input');
        const startSelect = document.querySelector('.event-start-time');
        const endSelect = document.querySelector('.event-end-time');

        const title = titleInput.value.trim();
        const startTime = startSelect.value;
        const endTime = endSelect.value;

        if (!title || !startTime || !endTime) {
            alert("Please fill in all fields.");
            return;
        }

        const startDate = this.parseTimeToDate(startTime);
        const endDate = this.parseTimeToDate(endTime);

        if (startDate >= endDate) {
            alert("End time must be after start time.");
            return;
        }

        const event = {
            title: title,
            startTime: this.toIsoWithOffset(startDate),
            endTime: this.toIsoWithOffset(endDate)
        };

        console.log("event", event);

        window.dataService.submitNewEvent(event);
        alert("Event created successfully!");

        // Clear inputs
        titleInput.value = '';
        startSelect.selectedIndex = 0;
        endSelect.selectedIndex = 0;

        loadComponent('home');
    },

    // Format as ISO with time zone offset (local time)
    toIsoWithOffset: function (date) {
        const tzOffset = -date.getTimezoneOffset(); // in minutes
        const diffHours = Math.floor(Math.abs(tzOffset) / 60);
        const diffMinutes = Math.abs(tzOffset) % 60;
        const sign = tzOffset >= 0 ? '+' : '-';
        const pad = num => String(num).padStart(2, '0');

        const iso = date.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:MM:SS"
        return `${iso}${sign}${pad(diffHours)}:${pad(diffMinutes)}`;
    },

    // Parse time strings into local Date objects with today's date
    parseTimeToDate: function (timeStr) {
        const today = new Date();
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const date = new Date(today);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }


}
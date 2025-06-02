window.components = window.components || {};

window.components.book = {
    keyboard: null,
    keyboardContainer: null,
    activeInput: null,

    // --- Entry Points ---
    loadPage() {
        this.addBackArrow();
        this.addBookTitle();
        this.addNavButtons();
        this.addKeyboard();
        this.populateTimeDropdowns();
        this.attachSaveHandler();
    },

    cleanup() {
        console.log("Cleaning up book component");
        this.removeElement('.header .back-button');
        this.removeElement('.header h1');
        this.removeFooterButtons();
        this.removeHeaderInfo();
    },

    // --- UI Setup ---
    addBackArrow() {
        const header = document.querySelector('.header');
        const backButton = this.createButtonWithImg('back-button', 'assets/arrow-left.svg', 60, 60);
        backButton.addEventListener('click', () => loadComponent('home'));
        header.appendChild(backButton);
    },

    addBookTitle() {
        const header = document.querySelector('.header');
        const title = document.createElement('h1');
        title.classList.add('book-title');
        const { dayOfWeek, dayOfMonth, monthName, roomName } = this.getDateRoomInfo();
        title.textContent = `Booking ${roomName} for ${dayOfWeek}, ${monthName} ${dayOfMonth}`;
        header.appendChild(title);
    },

    addNavButtons() {
        const footer = document.querySelector('.footer');
        if (window.dataService.status.displayHelp) {
            footer.appendChild(this.createFooterButton('Help', 'assets/help.svg', 40, 40, showHelp));
        }
        footer.appendChild(this.createFooterButton('Cancel', 'assets/cancel.svg', 32, 32, () => loadComponent('home')));
        footer.appendChild(this.createFooterButton('Save', 'assets/save.svg', 32, 32, null, 'save-button'));
    },

    attachSaveHandler() {
        const saveButton = document.querySelector('.save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.createEvent());
        }
    },

    removeKeyboard() {
        if (this.keyboardContainer?.parentNode) {
            this.keyboardContainer.parentNode.removeChild(this.keyboardContainer);
        }
        this.keyboard = null;
        this.keyboardContainer = null;
        this.activeInput = null;
    },

    addKeyboard() {
        const input = document.querySelector(".event-title-input");
        if (!input) return;

        let isShift = false;
        const body = document.body;

        input.addEventListener("focus", () => {
            if (this.keyboard && this.activeInput === input && this.keyboardContainer?.parentNode) return;

            this.removeKeyboard();
            this.activeInput = input;
            this.keyboardContainer = this.createKeyboardContainer();
            body.appendChild(this.keyboardContainer);

            this.keyboard = new SimpleKeyboard.default({
                rootElement: this.keyboardContainer,
                layout: this.getKeyboardLayout(),
                layoutName: "default",
                onKeyPress: button =>
                    this.handleKeyboardPress(button, isShift => isShift = !isShift, () => isShift = false)
            });

            this.keyboard.setInput(input.value);
        });

        document.addEventListener('mousedown', (e) => {
            setTimeout(() => {
                if (!e.target.closest('input, textarea, .simple-keyboard')) {
                    this.removeKeyboard();
                }
            }, 0);
        });
    },


    // --- Dropdowns ---
    async populateTimeDropdowns() {
        const events = await window.dataService.getSchedule();
        const options = this.generateTimeOptions();
        const selectStart = document.querySelector('.event-start-time');
        const selectEnd = document.querySelector('.event-end-time');
        if (!selectStart || !selectEnd) return;

        this.populateStartOptions(selectStart, options, events);
        selectEnd.innerHTML = '<option value="">Select end time</option>';
        selectEnd.disabled = true;

        selectStart.addEventListener('change', () => {
            if (selectStart.value) {
                selectEnd.disabled = false;
                this.renderEndOptions(selectEnd, selectStart.value, options, events);
            } else {
                selectEnd.disabled = true;
                selectEnd.innerHTML = '<option value="">Select end time</option>';
            }
        });
    },

    // --- Event Creation ---
    createEvent() {
        const titleInput = document.querySelector('.event-title-input');
        const startSelect = document.querySelector('.event-start-time');
        const endSelect = document.querySelector('.event-end-time');
        const overlay = document.querySelector('.event-submission-container');
        const confirmationText = document.querySelector('.confirmation-text');
        const symbol = document.querySelector('.symbol');
        const spinner = document.querySelector('.spinner');

        if (!titleInput || !startSelect || !endSelect || !overlay || !confirmationText || !spinner) return;

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

        // Reset and show popup
        overlay.style.display = 'flex';
        confirmationText.textContent = '';
        spinner.style.display = 'block';

        const event = {
            title,
            startTime: this.toIsoWithOffset(startDate),
            endTime: this.toIsoWithOffset(endDate)
        };

        window.dataService.submitNewEvent(event)
            .then(() => {
                symbol.src = 'assets/check.png';
                symbol.width = 60;
                symbol.height = 60;
                confirmationText.textContent = 'Event Submitted Successfully.';
            })
            .catch(() => {
                symbol.src = 'assets/x.png';
                symbol.width = 60;
                symbol.height = 60;
                confirmationText.textContent = 'Failed to Submit Event.';
            })
            .finally(() => {
                spinner.style.display = 'none';

                setTimeout(() => {
                    overlay.style.display = 'none';
                    if (confirmationText.textContent === 'Event Submitted Successfully.') {
                        loadComponent('home');
                    }
                }, 2000);
            });

        // Clear form immediately
        titleInput.value = '';
        startSelect.selectedIndex = 0;
        endSelect.selectedIndex = 0;
    },
    // --- Helpers ---
    createButtonWithImg(className, imgSrc, imgW, imgH) {
        const btn = document.createElement('div');
        btn.classList.add(className);
        const img = document.createElement('img');
        img.src = imgSrc;
        img.width = imgW;
        img.height = imgH;
        btn.appendChild(img);
        return btn;
    },

    createFooterButton(text, imgSrc, imgW, imgH, onClick, extraClass) {
        const btn = document.createElement('button');
        if (extraClass) btn.classList.add(extraClass);
        const img = document.createElement('img');
        img.src = imgSrc;
        img.width = imgW;
        img.height = imgH;
        btn.appendChild(img);
        btn.appendChild(document.createTextNode(text));
        if (onClick) btn.onclick = onClick;
        return btn;
    },

    removeElement(selector) {
        const el = document.querySelector(selector);
        if (el) el.remove();
    },

    removeFooterButtons() {
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.querySelectorAll('button').forEach(btn => btn.remove());
        }
    },

    removeHeaderInfo() {
        this.removeElement('.header .book-title');
    },

    getDateRoomInfo() {
        const now = new Date();
        return {
            dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
            dayOfMonth: now.getDate(),
            monthName: now.toLocaleDateString('en-US', { month: 'long' }),
            roomName: window.dataService.status.roomName
        };
    },

    createKeyboardContainer() {
        const container = document.createElement('div');
        container.classList.add('simple-keyboard');
        Object.assign(container.style, {
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
        return container;
    },

    getKeyboardLayout() {
        return {
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
        };
    },

    handleKeyboardPress(button, toggleShift, resetShift) {
        const input = this.activeInput;
        const keyboard = this.keyboard;
        if (!input || !keyboard) return;
        let val = input.value || "";

        if (button === "{bksp}") {
            val = val.slice(0, -1);
        } else if (button === "{space}") {
            val += " ";
        } else if (button === "{shift}") {
            toggleShift();
            keyboard.setOptions({ layoutName: keyboard.options.layoutName === "default" ? "shift" : "default" });
            return;
        } else if (button === "{enter}") {
            document.activeElement.blur();
            this.removeKeyboard(); // ✅ Cleanly resets state
            return;
        } else if (!button.startsWith("{")) {
            val += button;
            resetShift();
            keyboard.setOptions({ layoutName: "default" });
        }

        input.value = val;
        keyboard.setInput(val);
    },


    generateTimeOptions() {
        const pad = n => n.toString().padStart(2, '0');
        const to12Hour = (h, m) => {
            const hour12 = ((h + 11) % 12 + 1);
            const suffix = h >= 12 ? 'PM' : 'AM';
            return `${hour12}:${pad(m)} ${suffix}`;
        };
        const now = new Date();
        let hour = now.getHours();
        let minute = now.getMinutes();
        if (minute >= 30) { hour += 1; minute = 0; } else { minute = 30; }
        const options = [];
        while (hour < 24) {
            options.push(to12Hour(hour, minute));
            minute += 30;
            if (minute >= 60) { minute = 0; hour += 1; }
        }
        return options;
    },

    populateStartOptions(select, options, events) {
        select.innerHTML = '<option value="">Select start time</option>';
        for (const time of options) {
            const blocked = this.isTimeBlocked(time, events, true);
            const option = document.createElement('option');
            option.value = time;
            option.textContent = blocked ? `${time} (In Use)` : time;
            option.disabled = blocked;
            select.appendChild(option);
        }
    },

    renderEndOptions(select, selectedStart, options, events) {
        select.innerHTML = '<option value="">Select end time</option>';
        const startDate = this.toUTCDateFromLocalString(selectedStart);
        for (const time of options) {
            const endDate = this.toUTCDateFromLocalString(time);
            const timeDiffMin = (endDate - startDate) / (1000 * 60);
            const blocked = this.isTimeBlocked(time, events, false);
            const option = document.createElement('option');
            option.value = time;
            option.textContent = blocked ? `${time} (In Use)` : time;
            // Only allow end times that are after start time and within 2 hours
            select.appendChild(option);
            option.disabled = blocked || timeDiffMin <= 0 || timeDiffMin > 120;
        }
    },

    isTimeBlocked(timeStr, events, isStart) {
        const t = this.toUTCDateFromLocalString(timeStr);
        return events.some(event => {
            const start = new Date(event.startTime);
            const end = new Date(event.endTime);
            return isStart ? (t >= start && t < end) : (t > start && t <= end);
        });
    },

    toUTCDateFromLocalString(timeStr) {
        const [time, meridian] = timeStr.split(' ');
        let [hour, minute] = time.split(':').map(Number);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const utahMillis = Date.parse(
            new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/Denver' })
        );
        return new Date(utahMillis);
    },

    // Format as ISO with time zone offset (local time)
    toIsoWithOffset(date) {
        const tzOffset = -date.getTimezoneOffset();
        const diffHours = Math.floor(Math.abs(tzOffset) / 60);
        const diffMinutes = Math.abs(tzOffset) % 60;
        const sign = tzOffset >= 0 ? '+' : '-';
        const pad = num => String(num).padStart(2, '0');
        const iso = date.toISOString().slice(0, 19);
        return `${iso}${sign}${pad(diffHours)}:${pad(diffMinutes)}`;
    },

    // Parse time strings into local Date objects with today's date
    parseTimeToDate(timeStr) {
        const today = new Date();
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const date = new Date(today);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }
};

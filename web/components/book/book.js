window.components = window.components || {};

window.components.book = {
    inactivityTimeout: null,
    inactivityDuration: 60000, // 60 seconds
    keyboard: null,
    keyboardContainer: null,
    activeInput: null,
    startDropDown: null,
    endDropDown: null,

    // --- Entry Points ---
    loadPage() {
        this.addBackArrow();
        this.addBookTitle();
        this.addNavButtons();
        this.addKeyboard();
        this.populateTimeDropdowns();
        this.startInactivityTimer();
        this.addInteractionListeners();
    },

    cleanup() {
        console.log("Cleaning up book component");
        this.removeElement('.header .back-button');
        this.removeElement('.header h1');
        this.removeFooterButtons();
        this.removeHeaderInfo();
        this.clearInactivityTimer();
    },

    // --- UI Setup ---
    addBackArrow() {
        const header = document.querySelector('.header');
        const backButton = this.createButtonWithImg('back-button', 'assets/arrow-left.svg', 50, 50);
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
        const saveBtn = footer.querySelector('.save-button');
        saveBtn.disabled = true;
        saveBtn.classList.add('disabled');
    },

    attachSaveHandler() {
        const titleInput = document.querySelector('.event-title-input');
        const saveBtn = document.querySelector('.save-button');

        const validate = () => this.validateFormAndToggleSave();

        titleInput.addEventListener('input', validate);
        console.log("Attaching dropdown change listeners");
        this.startDropDown.onChange(validate);
        this.endDropDown.onChange(validate);

        saveBtn.addEventListener('click', () => {
            if (!saveBtn.disabled) {
                this.createEvent();
            }
        });
    },

    validateFormAndToggleSave() {
        const title = document.querySelector('.event-title-input')?.value.trim();
        const start = this.startDropDown?.value;
        const end = this.endDropDown?.value;
        const saveBtn = document.querySelector('.save-button');
        if (!saveBtn) return;

        const isValid = title && start && end;
        saveBtn.disabled = !isValid;
        saveBtn.classList.toggle('disabled', !isValid);
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
            this.labelSpaceButton();
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

    // --- Timeout Stuff ---
    startInactivityTimer: function () {
        this.clearInactivityTimer();
        this.inactivityTimeout = setTimeout(() => {
            const backButton = document.querySelector('.header .back-button');
            if (backButton) backButton.click();
        }, this.inactivityDuration);
    },

    clearInactivityTimer: function () {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
    },

    addInteractionListeners: function () {
        const body = document.querySelector('.main');
        if (!body) return;

        const resetTimer = () => this.startInactivityTimer();

        // Mouse interactions
        body.addEventListener('mousedown', resetTimer);
        body.addEventListener('mousemove', resetTimer);
        body.addEventListener('mouseup', resetTimer);

        // Touch interactions
        body.addEventListener('touchstart', resetTimer);
        body.addEventListener('touchmove', resetTimer);
        body.addEventListener('touchend', resetTimer);

        body.addEventListener('scroll', resetTimer);
    },

    // --- Dropdowns ---
    async populateTimeDropdowns() {
        this.endDropDown = new CustomDropdown("event-end-time", [], "Select end time", false);
        const events = await window.dataService.getSchedule();
        const options = this.generateTimeOptions();

        this.startDropDown = new CustomDropdown("event-start-time", [], "Select start time", true);
        for (const time of options) {
            const blocked = this.isTimeBlocked(time, events, true);
            this.startDropDown.addOption(time, time, blocked);
        }

        this.startDropDown.onChange(() => {
            console.log("Start time changed, disabling end time");
            if (this.startDropDown.value) {
                console.log(this.startDropDown.value)
                this.endDropDown.setEnabled(true);
                this.endDropDown.reset();
                this.renderEndOptions(this.endDropDown, this.startDropDown.value, options, events);
            }
        });

        this.attachSaveHandler();
    },

    // --- Event Creation ---
    createEvent() {
        const titleInput = document.querySelector('.event-title-input');
        const startSelect = this.startDropDown;
        const endSelect = this.endDropDown;
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
            monthName: now.toLocaleDateString('en-US', { month: 'short' }),
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
                "{shift} z x c v b n m {space}",
            ],
            shift: [
                "! @ # $ % ^ & * ( ) _ + {bksp}",
                "Q W E R T Y U I O P",
                "A S D F G H J K L {enter}",
                "{shift} Z X C V B N M {space}",
            ]
        };
    },

    labelSpaceButton() {
        const spaceBtn = document.querySelector(
            '.hg-button.hg-functionBtn.hg-button-space'
        );
        if (spaceBtn) {
            const span = spaceBtn.querySelector('span');
            if (span) {
                span.textContent = '  SPACE  ';
            }
        }
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
            this.labelSpaceButton();
            return;
        } else if (button === "{enter}") {
            document.activeElement.blur();
            this.removeKeyboard(); // cleanly resets state
            return;
        } else if (!button.startsWith("{")) {
            val += button;
            resetShift();
            keyboard.setOptions({ layoutName: "default" });
        }

        input.value = val;
        keyboard.setInput(val);
        this.labelSpaceButton();
    },

    // Generate time options in 30-minute intervals
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

    // Render end options based on selected start time
    renderEndOptions(select, selectedStart, options, events) {
        const startDate = this.toUTCDateFromLocalString(selectedStart);
        select.options = []; // Clear existing options

        // Find the next meeting after the selected start time
        let nextMeetingStart = null;
        for (const event of events) {
            const eventStart = new Date(event.startTime);
            if (eventStart > startDate) {
                if (!nextMeetingStart || eventStart < nextMeetingStart) {
                    nextMeetingStart = eventStart;
                }
            }
        }

        for (const time of options) {
            const endDate = this.toUTCDateFromLocalString(time);
            const timeDiffMin = (endDate - startDate) / (1000 * 60);
            let blocked = this.isTimeBlocked(time, events, false);

            // Only allow end times that are after start time, within 2 hours, and before next meeting
            const isAfterStart = timeDiffMin > 0;
            const isWithin2Hours = timeDiffMin <= 120;
            const isBeforeNextMeeting = !nextMeetingStart || endDate <= nextMeetingStart;

            const option = document.createElement('option');
            option.value = time;
            const textContent = blocked ? `${time} (In Use)` : time;
            blocked = blocked || !isAfterStart || !isWithin2Hours || !isBeforeNextMeeting;
            select.addOption(textContent, time, blocked);
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
        const [time, meridian] = timeStr.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;

        const now = new Date();
        const localDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute,
            0,
            0
        );
        return localDate;
    },


    // Format as ISO with time zone offset (local time)
    toIsoWithOffset(date) {
        const tzOffset = -date.getTimezoneOffset(); // in minutes
        const sign = tzOffset >= 0 ? "+" : "-";
        const pad = num => String(Math.floor(Math.abs(num))).padStart(2, "0");

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        const offsetHours = pad(tzOffset / 60);
        const offsetMinutes = pad(tzOffset % 60);

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
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

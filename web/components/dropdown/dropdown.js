class CustomDropdown {
    static injectCSS() {
        if (document.getElementById('custom-dropdown-css')) return;
        const style = document.createElement('style');
        style.id = 'custom-dropdown-css';
        style.textContent = `
      .dropdown {
        position: relative;
        width: 250px;
        user-select: none;
        color: white;
        width: 100%;
      }
      .dropdown.disabled {
        opacity: 0.6;
        pointer-events: none;
      }
      .dropdown-toggle {
        background: #212427;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 4px;
      }
      .dropdown-toggle.disabled {
        color: #ccc;
        cursor: not-allowed;
      }
      .dropdown-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        max-height: 300px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        margin-top: 5px;
        z-index: 1000;
        scroll-behavior: smooth;
      }
      .dropdown-menu.show {
        display: block;
      }
      .dropdown-item {
        background-color: #212427;
        color: white;
        padding: 1rem;
        font-size: 1.2rem;
        cursor: pointer;
        transition: background 0.2s;
      }
      .dropdown-item.disabled {
        color: #aaa;
        cursor: not-allowed;
      }
      .dropdown-menu::-webkit-scrollbar {
        display: none;
      }
      .dropdown-menu {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .dropdown-menu.open-up {
        top: auto !important;
        bottom: 100%;
        margin-top: 0;
        margin-bottom: 5px;
        border-radius: 8px 8px 0 0;
        max-height: 300px;
        overflow-y: auto;
        position: absolute;
        left: 0;
        right: 0;
      }
      @media (max-width: 600px) {
        .dropdown {
          width: 100%;
          min-width: 0;
        }
        .dropdown-menu, .dropdown-menu.open-up {
          left: 0 !important;
          right: 0 !important;
          max-width: 100vw;
        }
      }
    `;
        document.head.appendChild(style);
    }

    constructor(containerId, options = [], placeholder = 'Select an option', enabled = true) {
        CustomDropdown.injectCSS();
        this.container = document.getElementById(containerId);
        this.options = options;
        this.placeholder = placeholder;
        this.enabled = enabled;
        this.value = null;
        this.changeListeners = [];

        this._render();
        this._attachEvents();
    }
    onChange(listener) {
        if (typeof listener === 'function') {
            this.changeListeners.push(listener);
        }
    }

    _render() {
        this.container.innerHTML = `
      <div class="dropdown${!this.enabled ? ' disabled' : ''}">
        <div class="dropdown-toggle${!this.enabled ? ' disabled' : ''}">${this.placeholder}</div>
        <div class="dropdown-menu"></div>
      </div>
    `;

        this.toggle = this.container.querySelector('.dropdown-toggle');
        this.menu = this.container.querySelector('.dropdown-menu');
        this._renderOptions();
        if (!this.enabled) {
            this.toggle.setAttribute('tabindex', '-1');
        }
    }

    _renderOptions() {
        this.menu.innerHTML = "";
        this.options.forEach(opt => {
            const item = document.createElement("div");
            item.className = "dropdown-item" + (opt.disabled ? " disabled" : "");
            item.textContent = opt.label;
            item.dataset.value = opt.value;
            this.menu.appendChild(item);
        });
    }

    _attachEvents() {
        // ----------------- Toggle open/close -----------------
        this.toggle.addEventListener("click", () => {
            if (!this.enabled) return;
            const rect = this.toggle.getBoundingClientRect();
            this.menu.style.bottom = `${rect.height}px`;
            this.menu.style.top = "auto";
            this.menu.classList.add("open-up");
            this.menu.style.maxHeight = "240px";
            this.menu.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(`#${this.container.id} .dropdown`)) {
                this.menu.classList.remove("show");
            }
        });

        // ----------------- Drag + scroll (pointer events) -----------------
        let isDragging = false;
        let startY = 0;
        let startScroll = 0;
        let pendingWalk = 0;
        let ticking = false;

        const updateScroll = () => {
            this.menu.scrollTop = startScroll - pendingWalk;
            ticking = false;
        };

        this.menu.addEventListener("pointerdown", (e) => {
            if (!this.enabled) return;
            isDragging = true;
            startY = e.clientY;
            startScroll = this.menu.scrollTop;
            this.menu.style.cursor = "grabbing";
            document.body.style.userSelect = "none"; // prevent text selection
        });

        this.menu.addEventListener("pointermove", (e) => {
            if (!isDragging || !this.enabled) return;
            pendingWalk = e.clientY - startY;
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateScroll);
            }
            if (Math.abs(pendingWalk) > 5) {
                this.menu.classList.add("dragging");
            }
        });

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            this.menu.style.cursor = "default";
            document.body.style.userSelect = "";
            // don't clear dragging here; pointerup decides tap vs scroll
        };

        this.menu.addEventListener("pointerup", (e) => {
            if (!this.enabled) return;

            if (this.menu.classList.contains("dragging")) {
                this.menu.classList.remove("dragging");
                endDrag();
                return; // treat as scroll, not tap
            }

            const item = e.target.closest(".dropdown-item");
            if (!item || item.classList.contains("disabled")) {
                endDrag();
                return;
            }

            this.toggle.textContent = item.textContent;
            const oldValue = this.value;
            this.value = item.dataset.value;
            this.menu.classList.remove("show");

            if (oldValue !== this.value) {
                this.changeListeners.forEach(fn => fn(this.value));
            }
            endDrag();
        });

        this.menu.addEventListener("pointercancel", endDrag);
        this.menu.addEventListener("pointerleave", endDrag);

        // ----------------- Fallback click for mouse -----------------
        this.menu.addEventListener("click", (e) => {
            if (!this.enabled) return;
            if (this.menu.classList.contains("dragging")) {
                this.menu.classList.remove("dragging");
                return;
            }

            const item = e.target.closest(".dropdown-item");
            if (!item || item.classList.contains("disabled")) return;

            this.toggle.textContent = item.textContent;
            const oldValue = this.value;
            this.value = item.dataset.value;
            this.menu.classList.remove("show");

            if (oldValue !== this.value) {
                this.changeListeners.forEach(fn => fn(this.value));
            }
        });
    }





    // Public API
    addOption(label, value, disabled = false) {
        this.options.push({ label, value, disabled });
        this._renderOptions();
    }

    removeOption(value) {
        this.options = this.options.filter(opt => opt.value !== value);
        this._renderOptions();
    }

    disableOption(value) {
        const opt = this.options.find(o => o.value === value);
        if (opt) opt.disabled = true;
        this._renderOptions();
    }

    enableOption(value) {
        const opt = this.options.find(o => o.value === value);
        if (opt) opt.disabled = false;
        this._renderOptions();
    }

    getValue() {
        return this.value;
    }
}

CustomDropdown.prototype.onChange = function (listener) {
    if (typeof listener === 'function') {
        this.changeListeners.push(listener);
    }
};

CustomDropdown.prototype.setEnabled = function (enabled) {
    this.enabled = !!enabled;
    const dropdown = this.container.querySelector('.dropdown');
    const toggle = this.container.querySelector('.dropdown-toggle');
    if (this.enabled) {
        dropdown.classList.remove('disabled');
        toggle.classList.remove('disabled');
        toggle.removeAttribute('tabindex');
    } else {
        dropdown.classList.add('disabled');
        toggle.classList.add('disabled');
        toggle.setAttribute('tabindex', '-1');
        this.menu.classList.remove('show');
    }
};

CustomDropdown.prototype.reset = function () {
    this.value = null;
    if (this.toggle) {
        this.toggle.textContent = this.placeholder;
    }
    this.menu.classList.remove('show');
    // Notify listeners of value change
    this.changeListeners.forEach(fn => fn(this.value));
};


document.addEventListener('DOMContentLoaded', () => {
    const LS_PROFILES_KEY = 'bfhDamageCalcProfiles_v2'; // Keep this for profile management
    const LS_AUTO_SAVE_KEY = 'bfhDamageCalcFormState_v2'; // Keep this for auto-save
    let initialFormState = {};

    const UIManager = {
        allInputFields: [],
        resultElements: {},

        init() {
            this.allInputFields = Array.from(document.querySelectorAll('[data-field]'));
            this.resultElements = {
                fieldname37: document.getElementById('result_fieldname37'),
                fieldname38: document.getElementById('result_fieldname38'),
                fieldname1: document.getElementById('result_fieldname1'),
                fieldname30: document.getElementById('result_fieldname30'),
                fieldname42: document.getElementById('result_fieldname42'),
            };

            this.captureInitialFormState();
            this.loadFormState(); // Load auto-saved state first
            this.setupEventListeners();
            this.updateAllRadioGroupVisuals(); // Ensure radio buttons reflect loaded/initial state
            this.updateAllBuffButtonVisuals(); // Ensure buff buttons reflect loaded/initial state
            Calculator.calculateAndDisplay(); // Initial calculation
        },

        captureInitialFormState() {
            initialFormState = {};
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (input.type === 'hidden' && input.closest('.radio-button-group')) {
                    const group = input.closest('.radio-button-group');
                    const activeButton = group.querySelector('.btn-radio.active'); // Check HTML for initial active
                    initialFormState[fieldName] = activeButton ? activeButton.dataset.value : input.value;
                } else {
                    initialFormState[fieldName] = input.value;
                }
            });
        },
        
        setupEventListeners() {
            // Main action buttons (calculate, manage profiles, reset form)
            document.querySelectorAll('.js-action-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    switch(action) {
                        case 'calculate':
                            Calculator.calculateAndDisplay();
                            break;
                        case 'manageProfiles':
                            this.openProfileModal();
                            break;
                        case 'resetForm':
                            this.resetForm();
                            break;
                        case 'closeProfileModal': // Added for the modal's close button
                            this.closeProfileModal();
                            break;
                    }
                });
            });
            
            // Profile modal specific buttons (Save, Load, Delete)
            document.getElementById('saveProfileBtn').addEventListener('click', () => ProfileManager.handleSaveProfile());
            document.getElementById('loadProfileBtn').addEventListener('click', () => ProfileManager.handleLoadProfile());
            document.getElementById('deleteProfileBtn').addEventListener('click', () => ProfileManager.handleDeleteProfile());
            
            // Close modal if backdrop is clicked
            window.addEventListener('click', (event) => {
                if (event.target === document.getElementById('profileModal')) {
                    this.closeProfileModal();
                }
            });

            // Plus-Minus buttons
            document.querySelectorAll('.pm-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetId = e.target.dataset.target;
                    const step = parseInt(e.target.dataset.step, 10);
                    this.handleNumberButtonClick(targetId, step);
                });
            });

            // Radio-button groups
            document.querySelectorAll('.radio-button-group .btn-radio').forEach(button => {
                button.addEventListener('click', (e) => {
                    const group = e.target.closest('.radio-button-group');
                    const targetField = group.dataset.radioGroupField; // This should be the ID of the hidden input
                    const value = e.target.dataset.value;
                    this.handleRadioSelection(targetField, value, group);
                });
            });
            
            // Buff buttons
            document.querySelectorAll('.buff-buttons .buff-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetId = e.target.dataset.target;
                    const value = e.target.dataset.value;
                    this.handleBuffSelection(targetId, value);
                });
            });

            // Auto-save on input change
            this.allInputFields.forEach(input => {
                // For type=hidden (radio button groups), change is triggered programmatically by handleRadioSelection
                // For type=number, 'change' or 'input'
                input.addEventListener('change', () => this.saveCurrentFormState());
                if (input.type === 'number') {
                    input.addEventListener('input', () => this.saveCurrentFormStateDebounced());
                }
            });
        },

        handleNumberButtonClick(fieldId, step) {
            const inputElement = document.getElementById(fieldId);
            if (inputElement && inputElement.type === 'number') { // Ensure it's a number input
                let currentValue = parseFloat(inputElement.value) || 0;
                inputElement.value = currentValue + step;
                this.saveCurrentFormState(); // Auto-save
                this.updateBuffButtonVisuals(fieldId); // Update buff buttons if they control this field
                Calculator.calculateAndDisplay(); // Optional: recalculate on change
            }
        },
        
        handleRadioSelection(fieldId, value, groupElement) {
            const hiddenInput = document.getElementById(fieldId); // fieldId is the ID of the hidden input
            if (hiddenInput) {
                hiddenInput.value = value;
                groupElement.querySelectorAll('.btn-radio').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === value);
                });
                this.saveCurrentFormState(); // Auto-save
                Calculator.calculateAndDisplay(); // Optional: recalculate on change
            }
        },

        handleBuffSelection(fieldId, value) {
            const inputElement = document.getElementById(fieldId);
            if (inputElement) {
                inputElement.value = value;
                this.updateBuffButtonVisuals(fieldId);
                this.saveCurrentFormState(); // Auto-save
                Calculator.calculateAndDisplay(); // Optional: recalculate on change
            }
        },
        
        updateRadioGroupVisuals(fieldIdOfHiddenInput) {
            const hiddenInput = document.getElementById(fieldIdOfHiddenInput);
            if (hiddenInput && hiddenInput.type === 'hidden') {
                 const group = hiddenInput.closest('.form-group')?.querySelector(`.radio-button-group[data-radio-group-field="${fieldIdOfHiddenInput}"]`);
                 if (group) {
                    const currentValue = hiddenInput.value;
                    group.querySelectorAll('.btn-radio').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.value === currentValue);
                    });
                 }
            }
        },

        updateAllRadioGroupVisuals() {
            document.querySelectorAll('input[type="hidden"][data-field]').forEach(hiddenInput => {
                if (hiddenInput.closest('.form-group')?.querySelector(`.radio-button-group[data-radio-group-field="${hiddenInput.id}"]`)) {
                    this.updateRadioGroupVisuals(hiddenInput.id);
                }
            });
        },

        updateBuffButtonVisuals(fieldId) {
            const inputElement = document.getElementById(fieldId);
            // Find the buff buttons associated with this input field
            // This assumes buff buttons are in a .buff-buttons div within the same .form-group or a sibling structure.
            // A more robust way might be to add a data-controls-buffs attribute to the input.
            // For now, let's assume they are siblings or children within the form-group.
            const formGroup = inputElement.closest('.form-group');
            if (!formGroup) return;

            const buffButtonGroup = formGroup.querySelector('.buff-buttons');
            if (inputElement && buffButtonGroup) {
                const currentValue = inputElement.value;
                buffButtonGroup.querySelectorAll('.buff-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === currentValue && btn.dataset.target === fieldId);
                });
            }
        },
        
        updateAllBuffButtonVisuals() {
            this.allInputFields.forEach(input => {
                if (input.type === 'number') { // Typically, buff buttons control number inputs
                     this.updateBuffButtonVisuals(input.id);
                }
            });
        },

        getFormData() {
            const data = {};
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                data[fieldName] = (input.type === 'number' && input.value === '') ? '0' : input.value;
            });
            return data;
        },

        setFormData(data) {
            this.allInputFields.forEach(input => {
                const fieldName = input.dataset.field;
                if (data.hasOwnProperty(fieldName)) {
                    input.value = data[fieldName];
                    this.updateRadioGroupVisuals(fieldName); // Works if fieldName is the id of the hidden input
                    this.updateBuffButtonVisuals(fieldName);  // Works if fieldName is the id of the number input
                }
            });
            // No explicit saveCurrentFormState here, as it might trigger loops if called from loadFormState.
            // Let individual handlers or loadFormState decide when to save.
        },

        displayResults(results) {
            for (const key in results) {
                if (this.resultElements[key]) {
                    const value = results[key];
                    let displayValue;
                    if (typeof value === 'number') {
                        if (Number.isInteger(value)) {
                            displayValue = value;
                        } else if (key === 'fieldname42') { // Damage percentage
                            displayValue = value.toFixed(2);
                        } 
                        else {
                             displayValue = Math.floor(value);
                        }
                    } else {
                         displayValue = value;
                    }
                     this.resultElements[key].textContent = displayValue;
                }
            }
        },

        resetForm() {
            if (confirm('フォームの入力内容を初期状態にリセットしますか？（自動保存された内容は上書きされます）')) {
                this.setFormData(initialFormState);
                this.saveCurrentFormState(); // Save the reset state
                Calculator.calculateAndDisplay();
            }
        },

        openProfileModal() {
            document.getElementById('profileModal').style.display = 'block';
            ProfileManager.populateProfileList();
            document.getElementById('profileNameInput').value = '';
        },

        closeProfileModal() {
            document.getElementById('profileModal').style.display = 'none';
        },

        saveCurrentFormState() {
            const formData = this.getFormData();
            localStorage.setItem(LS_AUTO_SAVE_KEY, JSON.stringify(formData));
        },
        
        _saveTimeout: null,
        saveCurrentFormStateDebounced() {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = setTimeout(() => {
                this.saveCurrentFormState();
            }, 300); // Reduced debounce for quicker save on number input
        },

        loadFormState() {
            const savedState = localStorage.getItem(LS_AUTO_SAVE_KEY);
            if (savedState) {
                try {
                    const formData = JSON.parse(savedState);
                    this.setFormData(formData);
                } catch (e) {
                    console.error("Error parsing auto-saved state from localStorage:", e);
                    localStorage.removeItem(LS_AUTO_SAVE_KEY);
                    this.setFormData(initialFormState); // Fallback to initial state
                }
            } else {
                 this.setFormData(initialFormState); // Apply initial state if nothing saved
            }
             // After setting data (either saved or initial), ensure visual states are correct.
            this.updateAllRadioGroupVisuals();
            this.updateAllBuffButtonVisuals();
        }
        // Export/Import functions removed
    };

    const ProfileManager = {
        profileNameInput: document.getElementById('profileNameInput'),
        profileListSelect: document.getElementById('profileList'),

        loadProfiles: () => {
            const profiles = localStorage.getItem(LS_PROFILES_KEY);
            return profiles ? JSON.parse(profiles) : {};
        },
        saveToProfiles: (name, data) => {
            if (!name) {
                alert('プロフィール名を入力してください。');
                return false;
            }
            const profiles = ProfileManager.loadProfiles();
            profiles[name] = data;
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            return true;
        },
        deleteFromProfiles: (name) => {
            if (!name) return false;
            const profiles = ProfileManager.loadProfiles();
            delete profiles[name];
            localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
            return true;
        },
        getFromProfiles: (name) => {
            const profiles = ProfileManager.loadProfiles();
            return profiles[name];
        },
        populateProfileList: () => {
            const profiles = ProfileManager.loadProfiles();
            ProfileManager.profileListSelect.innerHTML = '<option value="">--- プロフィールを選択 ---</option>';
            for (const name in profiles) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                ProfileManager.profileListSelect.appendChild(option);
            }
        },
        handleSaveProfile: () => {
            const name = ProfileManager.profileNameInput.value.trim();
            const currentFormData = UIManager.getFormData();
            if (ProfileManager.saveToProfiles(name, currentFormData)) {
                alert(`プロフィール「${name}」を保存しました。`);
                ProfileManager.populateProfileList();
                ProfileManager.profileNameInput.value = '';
            }
        },
        handleLoadProfile: () => {
            const name = ProfileManager.profileListSelect.value;
            if (name) {
                const profileData = ProfileManager.getFromProfiles(name);
                if (profileData) {
                    UIManager.setFormData(profileData);
                    UIManager.saveCurrentFormState(); // Also update auto-save with loaded profile
                    Calculator.calculateAndDisplay();
                    UIManager.closeProfileModal();
                    alert(`プロフィール「${name}」を読み込みました。`);
                } else {
                    alert("選択されたプロフィールの読み込みに失敗しました。");
                }
            } else {
                alert('読み込むプロフィールを選択してください。');
            }
        },
        handleDeleteProfile: () => {
            const name = ProfileManager.profileListSelect.value;
            if (name) {
                if (confirm(`プロフィール「${name}」を削除してもよろしいですか？`)) {
                    if (ProfileManager.deleteFromProfiles(name)) {
                        alert(`プロフィール「${name}」を削除しました。`);
                        ProfileManager.populateProfileList();
                    }
                }
            } else {
                alert('削除するプロフィールを選択してください。');
            }
        }
    };

    const Calculator = {
        getNumericValue(data, fieldName, defaultValue = 0) {
            const valStr = data[fieldName];
            if (valStr === undefined || valStr === null || String(valStr).trim() === '') return defaultValue;
            const val = parseFloat(valStr);
            return isNaN(val) ? defaultValue : val;
        },

        calculateAttackDamage: (data) => {
            const f2 = Calculator.getNumericValue(data, 'fieldname2');
            const f4 = Calculator.getNumericValue(data, 'fieldname4');
            const f6 = Calculator.getNumericValue(data, 'fieldname6') / 100;
            const f8 = Calculator.getNumericValue(data, 'fieldname8') / 100;
            const f10 = Calculator.getNumericValue(data, 'fieldname10') / 100;
            const f12 = Calculator.getNumericValue(data, 'fieldname12') / 100;
            const f14 = Calculator.getNumericValue(data, 'fieldname14', 100) / 100;
    
            const term1 = f2 * (1 + f6 - f10);
            const term2 = (f4 / 2) * (1 + f8 - f12);
            const baseDamage = Math.floor(term1 - term2);
            return Math.max(baseDamage * f14, 0);
        },
    
        calculateMagicDamage: (data) => {
            const f3 = Calculator.getNumericValue(data, 'fieldname3');
            const f5 = Calculator.getNumericValue(data, 'fieldname5');
            const f7 = Calculator.getNumericValue(data, 'fieldname7') / 100;
            const f9 = Calculator.getNumericValue(data, 'fieldname9') / 100;
            const f11 = Calculator.getNumericValue(data, 'fieldname11') / 100;
            const f13 = Calculator.getNumericValue(data, 'fieldname13') / 100;
            const f15 = Calculator.getNumericValue(data, 'fieldname15', 100) / 100;
            
            const term1 = f3 * (1 + f7 - f11);
            const term2 = (f5 / 2) * (1 + f9 - f13);
            const baseDamage = Math.floor(term1 - term2);
            return Math.max(baseDamage * f15, 0);
        },
    
        calculateTotalDamage: (data, atkDmg, magDmg) => {
            const f16 = Calculator.getNumericValue(data, 'fieldname16') / 100;
            const f17 = Calculator.getNumericValue(data, 'fieldname17') / 100;
            const f18 = Calculator.getNumericValue(data, 'fieldname18') / 100;
            const f19 = Calculator.getNumericValue(data, 'fieldname19') / 100; // Now 0 or 0.05
            const f20_raw = Calculator.getNumericValue(data, 'fieldname20');
            const f22 = Calculator.getNumericValue(data, 'fieldname22', 1);
            const f50 = Calculator.getNumericValue(data, 'fieldname50') / 100; // Now 0 or 0.05
    
            const sumOfDamages = atkDmg + magDmg;
            
            let modifiedDamage = sumOfDamages * (f22 + f18 - f17);
            modifiedDamage = modifiedDamage * (1 - f16);
            modifiedDamage = modifiedDamage * (1 - f50); 
            modifiedDamage = modifiedDamage * (1 + f19);

            const flooredModifiedDamage = Math.floor(modifiedDamage);
            const finalTotalDamage = flooredModifiedDamage * (100 + f20_raw) / 100;
            
            return Math.floor(finalTotalDamage); 
        },

        calculateHpThreshold: (totalDamage, data) => {
            const f29 = Calculator.getNumericValue(data, 'fieldname29', 30);
            if (f29 >= 100 || f29 <= 0) return Infinity; // Adjusted to f29 <= 0 to also cover this edge case.
            if (totalDamage <= 0) return 0;
            const threshold = totalDamage / ((100 - f29) / 100);
            return Math.round(threshold);
        },

        calculateDamagePercentage: (totalDamage, data) => {
            const f41 = Calculator.getNumericValue(data, 'fieldname41');
            if (f41 <= 0 || totalDamage <= 0) return 0; // Changed f41 === 0 to f41 <= 0
            return (totalDamage / f41) * 100;
        },

        calculateAll: () => {
            const formData = UIManager.getFormData();
            const results = {};

            results.fieldname37 = Calculator.calculateAttackDamage(formData);
            results.fieldname38 = Calculator.calculateMagicDamage(formData);
            results.fieldname1 = Calculator.calculateTotalDamage(formData, results.fieldname37, results.fieldname38);
            results.fieldname30 = Calculator.calculateHpThreshold(results.fieldname1, formData);
            results.fieldname42 = Calculator.calculateDamagePercentage(results.fieldname1, formData);
            
            return results;
        },

        calculateAndDisplay: () => {
            const results = Calculator.calculateAll();
            UIManager.displayResults(results);
        }
    };

    // --- Initial Setup ---
    UIManager.init();

});
